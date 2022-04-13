import type { JSONValue } from "replicache";
import { z } from "zod";
import type { Executor } from "./pg";
import { ReplicacheTransaction } from "./replicache-transaction";
import { Issue, putIssue } from "../frontend/issue";
import { flatten } from "lodash";

export async function createDatabase(executor: Executor) {
  const schemaVersion = await getSchemaVersion(executor);
  if (schemaVersion < 0 || schemaVersion > 1) {
    throw new Error("Unexpected schema version: " + schemaVersion);
  }
  if (schemaVersion === 0) {
    await createSchemaVersion1(executor);
  }
  console.log("schemaVersion is 1 - nothing to do");
}

async function getSchemaVersion(executor: Executor) {
  const metaExists = await executor(`select exists(
    select from pg_tables where schemaname = 'public' and tablename = 'meta')`);
  if (!metaExists.rows[0].exists) {
    return 0;
  }

  const qr = await executor(
    `select value from meta where key = 'schemaVersion'`
  );
  return qr.rows[0].value;
}

export async function createSchemaVersion1(executor: Executor) {
  await executor("create table meta (key text primary key, value json)");
  await executor("insert into meta (key, value) values ('schemaVersion', '1')");

  await executor(`create table space (
      id text primary key not null,
      version integer not null,
      lastmodified timestamp(6) not null
      )`);

  await executor(`alter publication supabase_realtime add table space`);
  await executor(`alter publication supabase_realtime set 
      (publish = 'insert, update, delete');`);

  await executor(`create table client (
        id text primary key not null,
        lastmutationid integer not null,
        lastmodified timestamp(6) not null
        )`);

  await executor(`create table entry (
      spaceid text not null,
      key text not null,
      value text not null,
      deleted boolean not null,
      version integer not null,
      lastmodified timestamp(6) not null
      )`);

  await executor(`create unique index on entry (spaceid, key)`);
  await executor(`create index on entry (spaceid)`);
  await executor(`create index on entry (deleted)`);
  await executor(`create index on entry (version)`);
}

export async function initSpace(
  executor: Executor,
  spaceID: string,
  getSampleIssues: () => Promise<Issue[]>
) {
  const { rows } = await executor(`select version from space where id = $1`, [
    spaceID,
  ]);
  if (rows.length !== 0) {
    console.log("Space already initialized", spaceID);
    return;
  }
  console.log("Initializing space", spaceID);

  const sampleSpaceID = "sampleSpaceID";
  const initialVersion = 1;

  const {
    rows: sampleSpaceRows,
  } = await executor(`select version from space where id = $1`, [
    sampleSpaceID,
  ]);

  if (sampleSpaceRows.length === 0) {
    await executor(
      `insert into space (id, version, lastmodified) values ($1, $2, now())`,
      [sampleSpaceID, initialVersion]
    );
    const tx = new ReplicacheTransaction(
      executor,
      sampleSpaceID,
      "fake-client-id-for-server-init",
      initialVersion
    );
    const start = Date.now();
    for (const issue of await getSampleIssues()) {
      await putIssue(tx, issue);
    }
    console.log("puts took " + (Date.now() - start) + "ms");
    const start2 = Date.now();
    await tx.flush();
    console.log("flush took " + (Date.now() - start2) + "ms");
  }
  const start = Date.now();
  await executor(
    `insert into space (id, version, lastmodified) values ($1, $2, now())`,
    [spaceID, initialVersion]
  );
  await executor(
    `
     insert into entry (spaceid, key, value, deleted, version, lastmodified)
     select $1, key, value, deleted, version, lastmodified from entry where spaceid = $2
    `,
    [spaceID, sampleSpaceID]
  );
  console.log("copy took " + (Date.now() - start) + "ms");
}

export async function getEntry(
  executor: Executor,
  spaceID: string,
  key: string
): Promise<JSONValue | undefined> {
  const {
    rows,
  } = await executor(
    "select value from entry where spaceid = $1 and key = $2 and deleted = false",
    [spaceID, key]
  );
  const value = rows[0]?.value;
  if (value === undefined) {
    return undefined;
  }
  return JSON.parse(value);
}

export async function putEntries(
  executor: Executor,
  spaceID: string,
  entries: [key: string, value: JSONValue][],
  version: number
): Promise<void> {
  if (entries.length === 0) {
    return;
  }
  const valuesSql = Array.from(
    { length: entries.length },
    (_, i) => `($1, $${i * 2 + 3}, $${i * 2 + 4}, false, $2, now())`
  ).join();
  await executor(
    `
    insert into entry (spaceid, key, value, deleted, version, lastmodified)
    values ${valuesSql}
    on conflict (spaceid, key) do update set
      value = excluded.value, deleted = false, version = excluded.version, lastmodified = now()
    `,
    [
      spaceID,
      version,
      ...flatten(entries.map(([key, value]) => [key, JSON.stringify(value)])),
    ]
  );
}

export async function delEntries(
  executor: Executor,
  spaceID: string,
  keys: string[],
  version: number
): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  const keyParamsSQL = keys.map((_, i) => `$${i + 3}`).join(",");
  await executor(
    `update entry set deleted = true, version = $2 where spaceid = $1 and key in(${keyParamsSQL})`,
    [spaceID, version, ...keys]
  );
}

export async function getChangedEntries(
  executor: Executor,
  spaceID: string,
  prevVersion: number
): Promise<[key: string, value: JSONValue, deleted: boolean][]> {
  const {
    rows,
  } = await executor(
    `select key, value, deleted from entry where spaceid = $1 and version > $2`,
    [spaceID, prevVersion]
  );
  return rows.map((row) => [row.key, JSON.parse(row.value), row.deleted]);
}

export async function getCookie(
  executor: Executor,
  spaceID: string
): Promise<number | undefined> {
  const { rows } = await executor(`select version from space where id = $1`, [
    spaceID,
  ]);
  const value = rows[0]?.version;
  if (value === undefined) {
    return undefined;
  }
  return z.number().parse(value);
}

export async function setCookie(
  executor: Executor,
  spaceID: string,
  version: number
): Promise<void> {
  await executor(
    `update space set version = $2, lastmodified = now() where id = $1`,
    [spaceID, version]
  );
}

export async function getLastMutationID(
  executor: Executor,
  clientID: string
): Promise<number | undefined> {
  const {
    rows,
  } = await executor(`select lastmutationid from client where id = $1`, [
    clientID,
  ]);
  const value = rows[0]?.lastmutationid;
  if (value === undefined) {
    return undefined;
  }
  return z.number().parse(value);
}

export async function setLastMutationID(
  executor: Executor,
  clientID: string,
  lastMutationID: number
): Promise<void> {
  await executor(
    `
    insert into client (id, lastmutationid, lastmodified)
    values ($1, $2, now())
      on conflict (id) do update set lastmutationid = $2, lastmodified = now()
    `,
    [clientID, lastMutationID]
  );
}

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
} from "react";
import type { Diff, Replicache } from "replicache";
import LeftMenu from "./left-menu";
import type { M } from "./mutators";
import {
  getAllIssuesMap,
  Issue,
  issueFromKeyAndValue,
  issuePrefix,
  IssueValue,
  Order,
  orderEnumSchema,
  Priority,
  priorityEnumSchema,
  Status,
  statusEnumSchema,
} from "./issue";
import { useState } from "react";
import TopFilter from "./top-filter";
import IssueList from "./issue-list";
import { useQueryState } from "next-usequerystate";
import IssueBoard from "./issue-board";
import { sortBy, sortedIndexBy } from "lodash";

class Filter {
  readonly status?: ReadonlySet<Status>;
  readonly priority?: ReadonlySet<Priority>;
  constructor(status?: ReadonlySet<Status>, priority?: ReadonlySet<Priority>) {
    this.status = status;
    this.priority = priority;
  }
  filter(issue: Issue) {
    if (this.status) {
      if (!this.status.has(issue.status)) {
        return false;
      }
    }
    if (this.priority) {
      if (!this.priority.has(issue.priority)) {
        return false;
      }
    }
    return true;
  }
  hasConstraints() {
    return !!(this.status || this.priority);
  }
}

class Filters {
  readonly viewFilter: Filter;
  readonly additionalFilter: Filter;

  constructor(viewFilter: Filter, issueFilter: Filter) {
    this.viewFilter = viewFilter;
    this.additionalFilter = issueFilter;
  }

  filter(issue: Issue) {
    return this.viewFilter.filter(issue) && this.additionalFilter.filter(issue);
  }
}

function getFilters(
  view: string | null,
  priorityFilter: string | null,
  statusFilter: string | null
): Filters {
  let viewFilter: Filter = new Filter();
  switch (view?.toLowerCase()) {
    case "active":
      viewFilter = new Filter(new Set([Status.IN_PROGRESS, Status.TODO]));
      break;
    case "backlog":
      viewFilter = new Filter(new Set([Status.BACKLOG]));
      break;
  }

  let status = undefined;
  let priority = undefined;
  if (statusFilter) {
    status = new Set<Status>();
    for (const s of statusFilter.split(",")) {
      const parseResult = statusEnumSchema.safeParse(s);
      if (
        parseResult.success &&
        (!viewFilter?.status || viewFilter?.status.has(parseResult.data))
      ) {
        status.add(parseResult.data);
      }
    }
  }

  if (priorityFilter) {
    priority = new Set<Priority>();
    for (const p of priorityFilter.split(",")) {
      const parseResult = priorityEnumSchema.safeParse(p);
      if (parseResult.success) {
        priority.add(parseResult.data);
      }
    }
    if (priority.size === 0) {
      priority = undefined;
    }
  }
  const additionalFilter = new Filter(status, priority);
  return new Filters(viewFilter, additionalFilter);
}

function getIssueOrder(orderBy: string | null): Order {
  const parseResult = orderEnumSchema.safeParse(orderBy);
  return parseResult.success ? parseResult.data : Order.MODIFIED;
}

function getTitle(view: string | null) {
  switch (view?.toLowerCase()) {
    case "active":
      return "Active issues";
    case "backlog":
      return "Backlog issues";
    case "board":
      return "Board";
    default:
      return "All issues";
  }
}

type State = {
  allIssuesMap: Map<string, Issue>;
  viewIssueCount: number;
  filteredIssues: Issue[];
  filters: Filters;
  issueOrder: Order;
};
function timedReducer(
  state: State,
  action:
    | {
        type: "init";
        allIssuesMap: Map<string, Issue>;
      }
    | {
        type: "diff";
        diff: Diff;
      }
    | {
        type: "setFilters";
        filters: Filters;
      }
    | {
        type: "setIssueOrder";
        issueOrder: Order;
      }
): State {
  const start = Date.now();
  const result = reducer(state, action);
  console.log(`Reducer took ${Date.now() - start}ms`, action);
  return result;
}

function reducer(
  state: State,
  action:
    | {
        type: "init";
        allIssuesMap: Map<string, Issue>;
      }
    | {
        type: "diff";
        diff: Diff;
      }
    | {
        type: "setFilters";
        filters: Filters;
      }
    | {
        type: "setIssueOrder";
        issueOrder: Order;
      }
): State {
  const filters = action.type === "setFilters" ? action.filters : state.filters;
  const issueOrder =
    action.type === "setIssueOrder" ? action.issueOrder : state.issueOrder;

  function order(issue: Issue): string {
    let orderValue: number;
    switch (issueOrder) {
      case Order.CREATED:
        orderValue = issue.created;
        break;
      case Order.MODIFIED:
        orderValue = issue.modified;
        break;
    }
    return Number.MAX_SAFE_INTEGER - orderValue + "-" + issue.id;
  }
  function filterAndSort(issues: Issue[]): Issue[] {
    return sortBy(issues.filter(filters.filter.bind(filters)), order);
  }
  function countViewIssues(issues: Issue[]): number {
    let count = 0;
    for (const issue of issues) {
      if (filters.viewFilter.filter(issue)) {
        count++;
      }
    }
    return count;
  }

  switch (action.type) {
    case "init": {
      const allIssues = [...action.allIssuesMap.values()];
      return {
        ...state,
        allIssuesMap: action.allIssuesMap,
        viewIssueCount: countViewIssues(allIssues),
        filteredIssues: filterAndSort([...action.allIssuesMap.values()]),
      };
    }
    case "diff": {
      const newAllIssuesMap = new Map(state.allIssuesMap);
      let newViewIssueCount = state.viewIssueCount;
      const newFilteredIssues = [...state.filteredIssues];
      for (const diffOp of action.diff) {
        switch (diffOp.op) {
          case "add": {
            const newIssue = issueFromKeyAndValue(diffOp.key, diffOp.newValue);
            newAllIssuesMap.set(diffOp.key, newIssue);
            if (filters.viewFilter.filter(newIssue)) {
              newViewIssueCount++;
            }
            if (filters.filter(newIssue)) {
              newFilteredIssues.splice(
                sortedIndexBy(newFilteredIssues, newIssue, order),
                0,
                newIssue
              );
            }
            break;
          }
          case "del": {
            const oldIssue = issueFromKeyAndValue(diffOp.key, diffOp.oldValue);
            const index = sortedIndexBy(newFilteredIssues, oldIssue, order);
            newAllIssuesMap.delete(diffOp.key);
            if (filters.viewFilter.filter(oldIssue)) {
              newViewIssueCount--;
            }
            if (newFilteredIssues[index]?.id === oldIssue.id) {
              newFilteredIssues.splice(index, 1);
            }
            break;
          }
          case "change": {
            const oldIssue = issueFromKeyAndValue(diffOp.key, diffOp.oldValue);
            const index = sortedIndexBy(newFilteredIssues, oldIssue, order);
            if (filters.viewFilter.filter(oldIssue)) {
              newViewIssueCount--;
            }
            if (newFilteredIssues[index]?.id === oldIssue.id) {
              newFilteredIssues.splice(index, 1);
            }
            const newIssue = issueFromKeyAndValue(diffOp.key, diffOp.newValue);
            newAllIssuesMap.set(diffOp.key, newIssue);
            if (filters.viewFilter.filter(newIssue)) {
              newViewIssueCount++;
            }
            if (filters.filter(newIssue)) {
              newFilteredIssues.splice(
                sortedIndexBy(newFilteredIssues, newIssue, order),
                0,
                newIssue
              );
            }
            break;
          }
        }
      }
      return {
        ...state,
        allIssuesMap: newAllIssuesMap,
        viewIssueCount: newViewIssueCount,
        filteredIssues: newFilteredIssues,
      };
    }
    case "setFilters": {
      const allIssues = [...state.allIssuesMap.values()];
      return {
        ...state,
        viewIssueCount: countViewIssues(allIssues),
        filters: action.filters,
        filteredIssues: filterAndSort(allIssues),
      };
    }
    case "setIssueOrder": {
      return {
        ...state,
        filteredIssues: sortBy(state.filteredIssues, order),
        issueOrder: action.issueOrder,
      };
    }
  }

  return state;
}

const App = ({ rep }: { rep: Replicache<M> }) => {
  const [view] = useQueryState("view");
  const [priorityFilter] = useQueryState("priorityFilter");
  const [statusFilter] = useQueryState("statusFilter");
  const [orderBy] = useQueryState("orderBy");
  const [menuVisible, setMenuVisible] = useState(false);

  const [state, dispatch] = useReducer(timedReducer, {
    allIssuesMap: new Map(),
    viewIssueCount: 0,
    filteredIssues: [],
    filters: getFilters(view, priorityFilter, statusFilter),
    issueOrder: getIssueOrder(orderBy),
  });
  useEffect(() => {
    async function fetchIssues() {
      const allIssues = await rep.query((tx) => getAllIssuesMap(tx));
      dispatch({
        type: "init",
        allIssuesMap: allIssues,
      });
      rep.watch(
        (diff) => {
          dispatch({
            type: "diff",
            diff,
          });
        },
        { prefix: issuePrefix }
      );
    }
    void fetchIssues();
  }, [rep]);

  useLayoutEffect(() => {
    dispatch({
      type: "setFilters",
      filters: getFilters(view, priorityFilter, statusFilter),
    });
  }, [view, priorityFilter, statusFilter]);

  useEffect(() => {
    dispatch({
      type: "setIssueOrder",
      issueOrder: getIssueOrder(orderBy),
    });
  }, [orderBy]);

  const handleCreateIssue = (issue: IssueValue) => rep.mutate.putIssue(issue);
  const handleUpdateIssue = useCallback(
    (id: string, changes: Partial<IssueValue>) =>
      rep.mutate.updateIssue({
        id,
        changes,
      }),
    [rep]
  );

  return (
    <div>
      <div className="flex w-full h-screen overflow-y-hidden">
        <LeftMenu
          menuVisible={menuVisible}
          onCloseMenu={() => setMenuVisible(false)}
          onCreateIssue={handleCreateIssue}
        />
        <div className="flex flex-col flex-grow">
          <TopFilter
            onToggleMenu={() => setMenuVisible(!menuVisible)}
            title={getTitle(view)}
            filteredIssuesCount={
              state.filters.additionalFilter.hasConstraints()
                ? state.filteredIssues.length
                : undefined
            }
            issuesCount={state.viewIssueCount}
          />
          {view === "board" ? (
            <IssueBoard issues={state.filteredIssues} />
          ) : (
            <IssueList
              issues={state.filteredIssues}
              onUpdateIssue={handleUpdateIssue}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

import React, { CSSProperties, useCallback, useRef } from "react";
import IssueRow from "./issue-row";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import type { Description, Issue, IssueValue, Priority, Status } from "./issue";

interface Props {
  onUpdateIssues: (
    issueUpdates: {
      id: string;
      changes: Partial<IssueValue>;
      description?: Description;
    }[]
  ) => void;
  issues: Issue[];
}

type ListData = {
  issues: Issue[];
  handleChangePriority: (issue: Issue, priority: Priority) => void;
  handleChangeStatus: (issue: Issue, status: Status) => void;
};

const itemKey = (index: number, data: ListData) => data.issues[index].id;

const Row = ({
  data,
  index,
  style,
}: {
  data: ListData;
  index: number;
  style: CSSProperties;
}) => (
  <div style={style}>
    <IssueRow
      issue={data.issues[index]}
      onChangePriority={data.handleChangePriority}
      onChangeStatus={data.handleChangeStatus}
    />
  </div>
);

const IssueList = ({ onUpdateIssues, issues }: Props) => {
  const fixedSizeListRef = useRef<FixedSizeList>(null);

  const handleChangePriority = useCallback(
    (issue: Issue, priority: Priority) => {
      onUpdateIssues([{ id: issue.id, changes: { priority } }]);
    },
    [onUpdateIssues]
  );

  const handleChangeStatus = useCallback(
    (issue: Issue, status: Status) => {
      onUpdateIssues([{ id: issue.id, changes: { status } }]);
    },
    [onUpdateIssues]
  );

  return (
    <div className="flex flex-col flex-grow overflow-auto">
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            ref={fixedSizeListRef}
            height={height}
            itemCount={issues.length}
            itemSize={43}
            itemData={{
              handleChangePriority,
              handleChangeStatus,
              issues,
            }}
            itemKey={itemKey}
            overscanCount={10}
            width={width}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

export default IssueList;

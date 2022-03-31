import DefaultAvatarIcon from "./assets/icons/avatar.svg";
// import PriorityMenu from 'components/contextmenu/PriorityMenu';
// import StatusMenu from 'components/contextmenu/StatusMenu';
import PriorityIcon from "./priority-icon";
import React from "react";
import type { Issue } from "./issue";
import { formatDate } from "../util/date";

interface Props {
  issue: Issue;
  onChangePriority?: (issue: Issue, priority: string) => void;
  onChangeStatus?: (issue: Issue, priority: string) => void;
}

export default function IssueRow({
  issue,
}: //   onChangePriority,
//   onChangeStatus,
Props) {
  const avatar =
    issue.owner !== undefined && issue.owner.avatar !== undefined ? (
      <img
        src={issue.owner.avatar}
        className="w-4.5 h-4.5 rounded-full overflow-hidden"
      />
    ) : (
      <img
        src={DefaultAvatarIcon}
        className="w-4.5 h-4.5 rounded-full overflow-hidden"
      />
    );

  //   const handleChangePriority = (p: string) => {
  //     if (onChangePriority) onChangePriority(issue, p);
  //   };

  //   const handleChangeStatus = (status: string) => {
  //     if (onChangeStatus) onChangeStatus(issue, status);
  //   };
  return (
    <div
      key={issue.id}
      className="inline-flex items-center flex-grow flex-shrink w-full min-w-0 pl-2 pr-8 text-sm border-b border-gray-100 hover:bg-gray-100 h-11"
      id={issue.id}
    >
      <div className="flex-shrink-0 hidden ml-2 sm:block">
        <input
          type="checkbox"
          className="rounded-sm appearance-none form-checkbox focus:ring-transparent focus:outline-none form-stick checked:bg-indigo-600 checked:border-transparent border border-gray-300 md:border-transparent hover:border-gray-600 w-3.5 h-3.5"
        />
      </div>
      <div className="flex-shrink-0 ml-2">
        <PriorityIcon priority={issue.priority} />
        {/* <PriorityMenu
          id={"r-priority-" + issue.id}
          button={
            <div className="flex-shrink-0 ml-2">
              <PriorityIcon priority={issue.priority} />
            </div>
          }
          onSelect={handleChangePriority}
        /> */}
      </div>
      <div className="flex-shrink-0 hidden ml-2 font-normal text-gray-500 sm:block w-11 md:block">
        {issue.id}
      </div>
      <div className="flex-shrink-0 ml-2">
        {/* <StatusMenu
          id={"r-status-" + issue.id}
          button={statusIcon}
          onSelect={handleChangeStatus}
        /> */}
      </div>
      <div className="flex-wrap flex-shrink ml-2 overflow-hidden font-medium line-clamp-1 overflow-ellipsis">
        {issue.title.substr(0, 3000) || ""}
      </div>
      <div className="flex flex-grow ml-2"></div>
      <div className="flex-shrink-0 hidden w-10 ml-2 mr-3 font-normal sm:block">
        {formatDate(new Date(issue.modified))}
      </div>
      <div className="flex-shrink-0 ml-auto">{avatar}</div>
    </div>
  );
}

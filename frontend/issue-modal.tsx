import AttachmentIcon from "./assets/icons/attachment.svg";
import OwnerIcon from "./assets/icons/avatar.svg";
import CloseIcon from "./assets/icons/close.svg";
import GitIssueIcon from "./assets/icons/git-issue.svg";
// import LabelIcon from "./assets/icons/label.svg";
import ZoomIcon from "./assets/icons/zoom.svg";
import Modal from "./modal";
import Toggle from "./toggle";
import React, { useState } from "react";
// import Editor from "rich-markdown-editor";
// import { Priority, Status } from "./issue";
// import { showInfo, showWarning } from 'utils/notification';
// import LabelMenu from './contextmenu/LabelMenu';
// import PriorityMenu from './contextmenu/PriorityMenu';
// import StatusMenu from './contextmenu/StatusMenu';
// import PriorityIcon from "./priority-icon";
// import StatusIcon from "./status-icon";

interface Props {
  isOpen: boolean;
  onDismiss?: () => void;
}
// function getPriorityString(priority: PriorityEnum) {
//   switch (priority) {
//     case Priority.NONE:
//       return "Priority";
//     case Priority.HIGH:
//       return "High";
//     case Priority.MEDIUM:
//       return "Medium";
//     case Priority.LOW:
//       return "Low";
//     case Priority.URGENT:
//       return "Urgent";
//     default:
//       return "Priority";
//   }
// }

export default function IssueModal({ isOpen, onDismiss }: Props) {
  const [title, setTitle] = useState("");
  //   const [description, setDescription] = useState("");
  //   const [priority, setPriority] = useState(Priority.NONE);
  //   const [status, setStatus] = useState(Status.BACKLOG);

  const handleSubmit = () => {
    if (title === "") {
      //   showWarning("Please enter a title before submiting", "Title required");
      return;
    }

    // clear state
    // close modal
    if (onDismiss) onDismiss();
    setTitle("");
    // setDescription("");
    // setPriority(Priority.NONE);
    // setStatus(Status.BACKLOG);
  };

  const handleClickCloseBtn = () => {
    if (onDismiss) onDismiss();
  };

  const body = (
    <div className="flex flex-col w-full py-4 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between flex-shrink-0 px-4">
        <div className="flex items-center">
          <span className="inline-flex items-center p-1 text-gray-400 bg-gray-100 rounded">
            <GitIssueIcon className="w-3 mr-1" />
            <span>GIT</span>
          </span>
          <span className="ml-2 font-normal text-gray-700">› New Issue</span>
        </div>
        <div className="flex items-center">
          <div className="inline-flex items-center justify-center text-gray-500 rounded h-7 w-7 hover:bg-gray-100 hover:text-gray-700">
            <ZoomIcon className="w-3" />
          </div>
          <div
            className="inline-flex items-center justify-center ml-2 text-gray-500 h-7 w-7 hover:bg-gray-100 rouned hover:text-gray-700"
            onClick={handleClickCloseBtn}
          >
            <CloseIcon className="w-4" />
          </div>
        </div>
      </div>
      <div className="flex flex-col flex-1 pb-3.5 overflow-y-auto">
        {/* Issue title */}
        <div className="flex items-center w-full mt-1.5 px-4">
          {/* <StatusMenu
                    id='status-menu'
                    button={<button className='flex items-center justify-center w-6 h-6 border-none rounded focus:outline-none hover:bg-gray-100'><StatusIcon status={status} /></button>}
                    onSelect={(st) => {
                        setStatus(st);
                    }}
                /> */}
          <input
            className="w-full ml-1.5 text-lg font-semibold placeholder-gray-400 border-none h-7 focus:outline-none"
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Issue description editor */}
        <div className="flex w-full px-4">
          {/* <Editor
                    value={description}
                    onChange={(val) => setDescription(val)}
                    className='w-full mt-4 ml-5 font-normal border-none appearance-none min-h-12 text-md focus:outline-none'
                    placeholder='Add description...'
                /> */}
        </div>
      </div>

      {/* Issue labels & priority */}
      <div className="flex items-center px-4 pb-3 mt-1 border-b border-gray-200">
        {/* <PriorityMenu
                id='priority-menu'
                button={<button
                    className='inline-flex items-center h-6 px-2 text-gray-500 bg-gray-200 border-none rounded focus:outline-none hover:bg-gray-100 hover:text-gray-700'
                >
                    <PriorityIcon priority={priority} className='mr-0.5' />
                    <span>{getPriorityString(priority)}</span>
                </button>}
                onSelect={(val) => setPriority(val)}
            /> */}
        <button className="inline-flex items-center h-6 px-2 ml-2 text-gray-500 bg-gray-200 border-none rounded focus:outline-none hover:bg-gray-100 hover:text-gray-700">
          <OwnerIcon className="w-3.5 h-3.5 ml-2 mr-0.5" />
          <span>Assignee</span>
        </button>
        {/* <LabelMenu
                id='label-menu'
                button={<button className='inline-flex items-center h-6 px-2 ml-2 text-gray-500 bg-gray-200 border-none rounded focus:outline-none hover:bg-gray-100 hover:text-gray-700'>
                    <LabelIcon className='w-3.5 h-3.5 ml-2 mr-0.5' />
                    <span>Label</span>
                </button>} /> */}
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between flex-shrink-0 px-4 pt-3">
        <button className="focus:outline-none">
          <AttachmentIcon />
        </button>
        <div className="flex items-center">
          {/* <input type='checkbox' /> */}
          <Toggle />
          <span className="ml-2 font-normal">Create more</span>
          <button
            className="px-3 ml-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 h-7 focus:outline-none"
            onClick={handleSubmit}
          >
            Save Issue
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} center={false} size="large" onDismiss={onDismiss}>
      {body}
    </Modal>
  );
}

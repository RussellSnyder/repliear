import { useClickOutside } from "./hooks/useClickOutside";
import React, { useRef } from "react";
import Select from "./select";
import Toggle from "./toggle";

interface Props {
  isOpen: boolean;
  onDismiss?: () => void;
}
export default function ViewOptionMenu({ isOpen, onDismiss }: Props) {
  const ref = useRef(null);

  useClickOutside(ref, () => {
    if (isOpen && onDismiss) onDismiss();
  });

  return (
    <div ref={ref}>
      <div
        style={isOpen ? { display: "" } : { display: "none" }}
        className="fixed right-0 z-30 flex flex-col bg-white rounded-lg shadow-modal top-12 w-70"
      >
        <div className="font-medium border-b border-gray-200 px-4.5 py-2">
          View Options
        </div>
        {/* Grouping & Ordering */}
        <div className="px-4.5 py-2 flex flex-col border-b border-gray-200">
          <div className="flex items-center justify-between min-h-8">
            <span className="text-gray-500">Grouping</span>
            <div className="flex ml-2">
              {/* <select de></select> */}
              <Select>
                <option>No grouping</option>
                <option>Status</option>
                <option>Assignee</option>
                <option>Project</option>
                <option>Priority</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1 min-h-8">
            <span className="text-gray-500">Ordering</span>
            <div className="flex ml-2">
              <Select>
                <option>Priority</option>
                <option>Last updated</option>
                <option>Last created</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="px-4.5 py-2 flex flex-col border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Completed issues</span>
            <div className="flex ml-2">
              <Select>
                <option>All</option>
                <option>Past Week</option>
                <option>Past Month</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-1 min-h-8">
            <span className="text-gray-500">Ordering</span>
            <div className="flex ml-2">
              <Toggle />
            </div>
          </div>
        </div>

        {/* Filter fields */}
        <div className="px-4.5 py-2 flex flex-wrap border-b text-gray-800 border-gray-200 w-70">
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Priority
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            ID
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Status
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Labels
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Projects
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Due date
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Created
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Updated
          </button>
          <button className="h-6 px-2 mb-1 mr-1 font-medium bg-gray-100 border border-transparent rounded hover:border-gray-300 focus:outline-none">
            Assignee
          </button>
        </div>
      </div>
    </div>
  );
}

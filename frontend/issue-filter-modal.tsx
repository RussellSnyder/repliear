import SearchIcon from "./assets/icons/search.svg";
import Modal from "./modal";
import React from "react";

interface SearchOptionProps {
  name: string;
}

interface Props {
  isOpen: boolean;
  onDismiss?: () => void;
}

function SearchOption({ name }: SearchOptionProps) {
  return (
    <div className="flex items-center px-4 py-5 font-normal text-gray-700 border-l-2 border-transparent cursor-default text-14 hover:text-gray-800 hover:border-indigo-700 hover:bg-gray-100">
      <SearchIcon className="w-4 h-4 mr-4 " />
      <div className="text-overflow-ellipsis flex-nowrap text-14">{name}</div>
    </div>
  );
}

export default function IssueFilterModal({ isOpen, onDismiss }: Props) {
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} size="large" className="h-100">
      <div className="flex flex-col w-full">
        {/* Top search box */}
        <input
          type="text"
          className="flex-grow-0 w-full p-4 text-lg border-b border-gray-200 focus:outline-none"
          placeholder="Filter Issues..."
        />
        {/* Search option */}
        <div className="flex flex-col flex-grow w-full">
          <div className="px-4 mt-1 font-normal text-gray-500">Filter</div>
          <SearchOption name="Filter by status..." />
          <SearchOption name="Filter by priority..." />
          <SearchOption name="Filter by creator..." />
          <SearchOption name="Filter by label..." />
        </div>
      </div>
    </Modal>
  );
}

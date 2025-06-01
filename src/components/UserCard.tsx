import { MoreHorizontal } from "lucide-react";

const UserCard = ({ type }: { type: string }) => {
  return (
    <div className="rounded-2xl bg-sasLightBlue p-4 flex-1 min-w-[130px] shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-blue-800 font-semibold select-none">
          2024/25
        </span>
        <button
          aria-label="More options"
          className="p-1 rounded-full hover:bg-white/30 transition-colors"
          type="button"
        >
          <MoreHorizontal className="w-5 h-5 text-blue-800" />
        </button>
      </div>
      <h1 className="text-2xl font-semibold my-4 select-text">1,234</h1>
      <h2 className="capitalize text-sm font-medium text-gray-500 select-text">
        {type}s
      </h2>
    </div>
  );
};

export default UserCard;

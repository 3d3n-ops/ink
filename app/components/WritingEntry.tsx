"use client";

interface WritingEntryProps {
  title: string;
  date: string;
  onClick?: () => void;
}

export default function WritingEntry({ title, date, onClick }: WritingEntryProps) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col py-1 ${onClick ? "cursor-pointer hover:opacity-70 transition-opacity" : ""}`}
    >
      <span className="text-sm text-[#171717] md:text-base">
        {title}
      </span>
      <span className="text-xs text-[#171717]/70 md:text-sm">
        {date}
      </span>
    </div>
  );
}


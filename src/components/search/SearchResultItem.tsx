"use client";

import { Command } from "cmdk";
import { CheckSquare, Brain, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultItemProps {
  type: "task" | "memory" | "document";
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  category?: string;
  searchQuery: string;
  onSelect: () => void;
}

// Highlight matching text
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const statusColors: Record<string, string> = {
  backlog: "bg-zinc-700 text-zinc-300",
  todo: "bg-blue-900/50 text-blue-300",
  in_progress: "bg-yellow-900/50 text-yellow-300",
  done: "bg-green-900/50 text-green-300",
  cancelled: "bg-red-900/50 text-red-300",
};

const priorityIndicators: Record<string, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-zinc-500",
};

const categoryIcons: Record<string, string> = {
  preference: "💡",
  fact: "📌",
  decision: "⚖️",
  entity: "👤",
  other: "📝",
};

export function SearchResultItem({
  type,
  title,
  description,
  status,
  priority,
  category,
  searchQuery,
  onSelect,
}: SearchResultItemProps) {
  const Icon = type === "task" ? CheckSquare : type === "memory" ? Brain : FileText;

  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
        "hover:bg-zinc-800/80 data-[selected=true]:bg-zinc-800/80",
        "border-l-2 border-transparent",
        type === "task" && priority && priorityIndicators[priority]
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 text-zinc-400 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-100 truncate">
            {highlightMatch(title, searchQuery)}
          </span>

          {/* Status badge for tasks */}
          {type === "task" && status && (
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0",
                statusColors[status] ?? "bg-zinc-700 text-zinc-300"
              )}
            >
              {status.replace("_", " ")}
            </span>
          )}

          {/* Category for memories */}
          {type === "memory" && category && (
            <span className="text-xs text-zinc-500 shrink-0">
              {categoryIcons[category] ?? "📝"} {category}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
            {highlightMatch(description, searchQuery)}
          </p>
        )}
      </div>
    </Command.Item>
  );
}

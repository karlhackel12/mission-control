"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Command } from "cmdk";
import { Search, Brain, CheckSquare, Loader2 } from "lucide-react";
import { SearchResultItem } from "./SearchResultItem";
import { useDebounce } from "@/hooks/useDebounce";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Only fetch when we have a query
  const searchResults = useQuery(
    api.search.globalSearch,
    debouncedQuery.trim().length > 0 ? { query: debouncedQuery } : "skip"
  );

  const isLoading = debouncedQuery.trim().length > 0 && searchResults === undefined;
  const hasResults = searchResults && (searchResults.tasks.length > 0 || searchResults.memories.length > 0);
  const showEmptyState = debouncedQuery.trim().length > 0 && searchResults && !hasResults;

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Reset search when closing
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelect = useCallback((type: string, id: string) => {
    // TODO: Navigate to the selected item
    console.log("Selected:", type, id);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[20%] z-50 mx-auto max-w-[500px] px-4">
        <Command
          className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200"
          shouldFilter={false}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-zinc-800 px-4">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <Command.Input
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Search everything..."
              className="flex-1 bg-transparent py-4 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="h-4 w-4 text-zinc-500 animate-spin shrink-0" />
            )}
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] text-zinc-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            {/* Empty state - no query */}
            {!debouncedQuery.trim() && (
              <div className="py-14 text-center text-sm text-zinc-500">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>Start typing to search tasks and memories...</p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="py-14 text-center text-sm text-zinc-500">
                <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-50" />
                <p>Searching...</p>
              </div>
            )}

            {/* Empty results */}
            {showEmptyState && (
              <Command.Empty className="py-14 text-center text-sm text-zinc-500">
                <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No results found for &ldquo;{debouncedQuery}&rdquo;</p>
              </Command.Empty>
            )}

            {/* Results */}
            {hasResults && (
              <>
                {/* Tasks */}
                {searchResults.tasks.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 py-2">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Tasks ({searchResults.tasks.length})
                      </div>
                    }
                  >
                    {searchResults.tasks.map((task) => (
                      <SearchResultItem
                        key={task._id}
                        type="task"
                        title={task.title}
                        description={task.description}
                        status={task.status}
                        priority={task.priority}
                        searchQuery={debouncedQuery}
                        onSelect={() => handleSelect("task", task._id)}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Memories */}
                {searchResults.memories.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wider px-2 py-2 mt-2">
                        <Brain className="h-3.5 w-3.5" />
                        Memories ({searchResults.memories.length})
                      </div>
                    }
                  >
                    {searchResults.memories.map((memory) => (
                      <SearchResultItem
                        key={memory._id}
                        type="memory"
                        title={memory.content.slice(0, 100) + (memory.content.length > 100 ? "..." : "")}
                        category={memory.category}
                        searchQuery={debouncedQuery}
                        onSelect={() => handleSelect("memory", memory._id)}
                      />
                    ))}
                  </Command.Group>
                )}
              </>
            )}
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5">esc</kbd>
                close
              </span>
            </div>
          </div>
        </Command>
      </div>
    </>
  );
}

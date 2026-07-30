import React, { useEffect, useRef } from "react";
import { useLibraryState } from "../../state/libraryState";
import "../../styles/searchbar.css";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ value, onChange }, ref) => {
    const searchQuery = useLibraryState((s) => s.searchQuery);
    const setSearchQuery = useLibraryState((s) => s.setSearchQuery);
    const inputRef = useRef<HTMLInputElement>(null);

    // Allow parent to control focus
    useEffect(() => {
      if (typeof ref === "function") ref(inputRef.current);
      else if (ref) ref.current = inputRef.current;
    }, [ref]);

    // Global keyboard shortcuts
    useEffect(() => {
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // Ctrl+F / Cmd+F → focus search
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }

        // Escape → clear search
        if (e.key === "Escape" && document.activeElement === inputRef.current) {
          setSearchQuery("");
          inputRef.current?.blur();
        }
      };

      window.addEventListener("keydown", handleGlobalKeyDown);
      return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [setSearchQuery]);

    return (
      <div className="searchbar-root">
        <input
          ref={inputRef}
          type="text"
          className="searchbar-input"
          placeholder="Search library… (Ctrl+F)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {searchQuery && (
          <button
            className="searchbar-clear"
            onClick={() => {
              setSearchQuery("");
              inputRef.current?.focus();
            }}
            title="Clear search (Esc)"
          >
            ✕
          </button>
        )}
      </div>
    );
  }
);

export default SearchBar;

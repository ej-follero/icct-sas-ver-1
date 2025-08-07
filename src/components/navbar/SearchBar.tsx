"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Clock, TrendingUp, User, BookOpen, Building, FileText, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type SearchResult, type SearchHistory } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // Search functionality props
  results?: SearchResult[];
  loading?: boolean;
  history?: SearchHistory[];
  showHistory?: boolean;
  setShowHistory?: (show: boolean) => void;
  clearHistory?: () => void;
  removeFromHistory?: (query: string) => void;
  navigateToResult?: (result: SearchResult) => void;
  getSuggestions?: (query: string) => string[];
}

const getTypeIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'student':
    case 'teacher':
      return <User className="w-4 h-4" />;
    case 'course':
      return <BookOpen className="w-4 h-4" />;
    case 'department':
      return <Building className="w-4 h-4" />;
    case 'attendance':
      return <Calendar className="w-4 h-4" />;
    case 'report':
      return <FileText className="w-4 h-4" />;
    default:
      return <Search className="w-4 h-4" />;
  }
};

const getTypeColor = (type: SearchResult['type']) => {
  switch (type) {
    case 'student':
      return 'bg-blue-100 text-blue-800';
    case 'teacher':
      return 'bg-green-100 text-green-800';
    case 'course':
      return 'bg-purple-100 text-purple-800';
    case 'department':
      return 'bg-orange-100 text-orange-800';
    case 'attendance':
      return 'bg-red-100 text-red-800';
    case 'report':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search students, teachers, courses...",
  className = "",
  // Search functionality props with defaults
  results = [],
  loading = false,
  history = [],
  showHistory = false,
  setShowHistory = () => {},
  clearHistory = () => {},
  removeFromHistory = () => {},
  navigateToResult = () => {},
  getSuggestions = () => [],
}) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout>();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleInputFocus = useCallback(() => {
    setSearchFocused(true);
    if (history.length > 0) {
      setShowHistory(true);
    }
  }, [history.length, setShowHistory]);

  const handleInputBlur = useCallback(() => {
    setSearchFocused(false);
    // Clear any existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    // Delay hiding results to allow clicking on them
    blurTimeoutRef.current = setTimeout(() => {
      if (!searchRef.current?.contains(document.activeElement)) {
        setShowHistory(false);
      }
    }, 200);
  }, [setShowHistory]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigateToResult(result);
    setShowHistory(false);
  }, [navigateToResult, setShowHistory]);

  const handleHistoryClick = useCallback((query: string) => {
    onChange(query);
    setShowHistory(false);
  }, [onChange, setShowHistory]);

  const handleClearClick = useCallback(() => {
    onChange('');
  }, [onChange]);

  const suggestions = getSuggestions(value);

  // Derive showResults from value and showHistory
  const showResults = !!(value.trim() || showHistory);

  return (
    <div ref={searchRef} className={`relative max-w-xs ${className}`}>
      <div 
        className={cn(
          "relative transition-all duration-200",
          searchFocused ? "ring-2 ring-blue-900 rounded-full" : ""
        )}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-5 h-5" />
        </span>
        <input
          type="text"
          className="w-full pl-10 pr-10 py-2 rounded-full border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-gray-600"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          aria-label="Search"
          style={{ minWidth: '180px' }}
        />
        {value && (
          <button
            onClick={handleClearClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-700">Searching...</p>
            </div>
          )}

          {/* Search History */}
          {showHistory && history.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="flex items-center justify-between p-3">
                <span className="text-sm font-medium text-gray-700">Recent Searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-xl"
                >
                  Clear
                </Button>
              </div>
              {history.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleHistoryClick(item.query)}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.resultCount} results
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(item.query);
                      }}
                      className="text-xs text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-xl"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search Suggestions */}
          {!loading && !showHistory && suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="p-3">
                <span className="text-sm font-medium text-gray-700">Suggestions</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onChange(suggestion)}
                >
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Search Results */}
          {!loading && !showHistory && results.length > 0 && (
            <div>
              <div className="p-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-700">
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex-shrink-0">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </span>
                      <Badge className={cn("text-xs", getTypeColor(result.type))}>
                        {result.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {result.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.relevance * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !showHistory && value.trim() && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found for &quot;{value}&quot;</p>
              <p className="text-xs mt-1">Try different keywords or check spelling</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 
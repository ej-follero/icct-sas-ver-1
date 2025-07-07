import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from './use-debounce';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'student' | 'teacher' | 'course' | 'department' | 'attendance' | 'report';
  url: string;
  relevance: number;
}

export interface SearchHistory {
  query: string;
  timestamp: number;
  resultCount: number;
}

// Mock search results - moved outside to prevent recreation on every render
const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'John Doe',
    description: 'Student - BSIT 3rd Year',
    type: 'student',
    url: '/list/students/1',
    relevance: 0.95
  },
  {
    id: '2',
    title: 'Jane Smith',
    description: 'Teacher - Information Technology Department',
    type: 'teacher',
    url: '/list/instructors/2',
    relevance: 0.88
  },
  {
    id: '3',
    title: 'ICT101 - Programming Fundamentals',
    description: 'Course - 3 units',
    type: 'course',
    url: '/list/courses/ICT101',
    relevance: 0.82
  },
  {
    id: '4',
    title: 'Information Technology Department',
    description: 'Department - 15 faculty members',
    type: 'department',
    url: '/list/departments/IT',
    relevance: 0.75
  },
  {
    id: '5',
    title: 'Attendance Report - ICT101',
    description: 'Report - Today\'s attendance',
    type: 'attendance',
    url: '/list/attendance/students?course=ICT101',
    relevance: 0.70
  }
];

export const useSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const historyLoadedRef = useRef(false);

  // Add search to history
  const addToHistory = useCallback((searchQuery: string, resultCount: number) => {
    const newHistoryItem: SearchHistory = {
      query: searchQuery,
      timestamp: Date.now(),
      resultCount
    };

    setHistory(prev => {
      // Remove duplicate queries
      const filtered = prev.filter(item => item.query !== searchQuery);
      // Add new item at the beginning
      return [newHistoryItem, ...filtered].slice(0, 10); // Keep only last 10
    });
  }, []);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In real implementation, fetch from API
      // const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      // if (!response.ok) throw new Error('Search failed');
      // const data = await response.json();
      
      // Filter mock results based on query
      const filteredResults = mockSearchResults.filter(result =>
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(filteredResults);
      
      // Add to history if results found
      if (filteredResults.length > 0) {
        addToHistory(searchQuery, filteredResults.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [addToHistory]); // Removed mockSearchResults from dependencies

  // Clear search history
  const clearHistory = useCallback(() => {
    setHistory([]);
    // In real implementation, also clear from localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  }, []);

  // Remove specific history item
  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => prev.filter(item => item.query !== query));
  }, []);

  // Navigate to search result
  const navigateToResult = useCallback((result: SearchResult) => {
    // In real implementation, use Next.js router
    window.location.href = result.url;
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback((partialQuery: string): string[] => {
    if (!partialQuery.trim()) return [];
    
    const suggestions = [
      'students',
      'teachers',
      'courses',
      'departments',
      'attendance',
      'reports',
      'ICT101',
      'BSIT',
      'Information Technology'
    ];
    
    return suggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(partialQuery.toLowerCase())
    ).slice(0, 5);
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && !historyLoadedRef.current) {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed)) {
            setHistory(parsed);
          }
        } catch (err) {
          console.error('Failed to parse search history:', err);
        }
      }
      historyLoadedRef.current = true;
    }
  }, []);

  // Save search history to localStorage
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && historyLoadedRef.current && history.length > 0) {
      localStorage.setItem('searchHistory', JSON.stringify(history));
    }
  }, [history]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (debouncedQuery) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(debouncedQuery);
      }, 100);
    } else {
      setResults([]);
      setLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [debouncedQuery, performSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    history,
    showHistory,
    setShowHistory,
    performSearch,
    clearHistory,
    removeFromHistory,
    navigateToResult,
    getSuggestions,
    hasResults: results.length > 0,
    hasHistory: history.length > 0
  };
}; 
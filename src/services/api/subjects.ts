import { Subject } from '@/types/subject';

interface FetchSubjectsParams {
  page: number;
  pageSize: number;
  search?: string;
  type?: string;
  semester?: string;
  year_level?: string;
  department?: string;
  status?: string;
  sortField?: string;
  sortOrder?: string;
}

interface FetchSubjectsResponse {
  subjects: Subject[];
  total: number;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const cache = new Map<string, { data: any; timestamp: number }>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || 'An error occurred',
        response.status,
        error.code,
        error.details
      );
    }
    return response;
  } catch (error) {
    if (retries > 0 && error instanceof ApiError && error.status >= 500) {
      await delay(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export const subjectsApi = {
  async fetchSubjects(params: FetchSubjectsParams): Promise<FetchSubjectsResponse> {
    const cacheKey = `subjects-${JSON.stringify(params)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetchWithRetry(`/api/subjects?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  },

  async createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
    const response = await fetchWithRetry('/api/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subject),
    });

    const data = await response.json();
    cache.clear(); // Clear cache on mutation
    return data;
  },

  async updateSubject(id: string, subject: Partial<Subject>): Promise<Subject> {
    const response = await fetchWithRetry(`/api/subjects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subject),
    });

    const data = await response.json();
    cache.clear(); // Clear cache on mutation
    return data;
  },

  async deleteSubject(id: string): Promise<void> {
    await fetchWithRetry(`/api/subjects/${id}`, {
      method: 'DELETE',
    });
    cache.clear(); // Clear cache on mutation
  },

  async checkSubjectDeletable(id: string): Promise<{
    canDelete: boolean;
    details?: {
      hasSchedules: boolean;
      hasAnnouncements: boolean;
      hasInstructors: boolean;
      hasEnrolledStudents: boolean;
    };
  }> {
    const response = await fetchWithRetry(`/api/subjects/${id}/check-deletable`, {
      method: 'GET',
    });

    return response.json();
  },

  clearCache() {
    cache.clear();
  },
}; 
// Chart fallback utility for DRY chart data generation
export function withFallback<T>(
  students: any[],
  fallback: () => T,
  realData: () => T,
  hasRealData: (students: any[]) => boolean
): T {
  if (!Array.isArray(students) || students.length === 0) {
    return fallback();
  }
  if (!hasRealData(students)) {
    return fallback();
  }
  return realData();
} 
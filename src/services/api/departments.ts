export const departmentsApi = {
  async fetchDepartments(): Promise<{ id: string; name: string; code: string }[]> {
    const response = await fetch('/api/departments');
    if (!response.ok) throw new Error('Failed to fetch departments');
    const data = await response.json();
    return (data.data || []).map((dept: any) => ({ id: dept.id, name: dept.name, code: dept.code }));
  },
}; 
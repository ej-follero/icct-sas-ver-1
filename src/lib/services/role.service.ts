export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  status: string;
  totalUsers: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permissions: string[];
  status?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  status?: string;
}

export interface BulkImportRoleData {
  roleName: string;
  roleDescription?: string;
  rolePermissions: string[];
  roleStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface BulkImportResult {
  success: number;
  failed: number;
  errors: string[];
  createdRoles: Role[];
}

class RoleService {
  private baseUrl = '/api/roles';

  // Get all roles
  async getAllRoles(): Promise<Role[]> {
    try {
      const response = await fetch(this.baseUrl, { cache: 'no-store' });
      
      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      return data.data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }

  // Get a specific role by ID
  async getRoleById(id: string): Promise<Role> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  }

  // Create a new role
  async createRole(roleData: CreateRoleData): Promise<Role> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Update a role
  async updateRole(id: string, roleData: UpdateRoleData): Promise<Role> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      });

      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the successful response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      return data.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  // Delete a role
  async deleteRole(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  // Check if role name exists
  async checkRoleNameExists(name: string, excludeId?: string): Promise<boolean> {
    try {
      const roles = await this.getAllRoles();
      return roles.some(role => 
        role.name.toLowerCase() === name.toLowerCase() && 
        role.id !== excludeId
      );
    } catch (error) {
      console.error('Error checking role name:', error);
      return false;
    }
  }

  // Bulk import roles
  async bulkImportRoles(rolesData: BulkImportRoleData[]): Promise<BulkImportResult> {
    try {
      console.log('RoleService: Starting bulk import with data:', JSON.stringify(rolesData, null, 2));
      
      const response = await fetch(`${this.baseUrl}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: rolesData }),
      });

      console.log('RoleService: API response status:', response.status);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to parse error response as JSON first
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use the status text
          console.warn('Failed to parse error response as JSON:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Try to parse the successful response
      let data;
      try {
        data = await response.json();
        console.log('RoleService: API response data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response format from server');
      }

      // Return the results from the API response
      return data.results || {
        success: 0,
        failed: rolesData.length,
        errors: ['No results returned from server'],
        createdRoles: []
      };
    } catch (error) {
      console.error('Error bulk importing roles:', error);
      // Return a structured error result instead of throwing
      return {
        success: 0,
        failed: rolesData.length,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        createdRoles: []
      };
    }
  }
}

export const roleService = new RoleService(); 
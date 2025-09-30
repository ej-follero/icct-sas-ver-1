/**
 * Input Validation Middleware
 * Provides comprehensive input validation for API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import { sanitizeObject, sanitizeText } from './sanitizer';

export interface ValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
  sanitizeBody?: boolean;
  maxBodySize?: number;
  allowedMethods?: string[];
}

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).optional(),
  }),

  // Search
  search: z.object({
    q: z.string().max(200).optional(),
    query: z.string().max(200).optional(),
    search: z.string().max(200).optional(),
  }),

  // Sorting
  sorting: z.object({
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    orderBy: z.string().max(50).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),

  // Common IDs
  id: z.object({
    id: z.coerce.number().positive(),
  }),

  // User input validation
  userInput: z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email().max(255).toLowerCase().trim(),
    phone: z.string().regex(/^[\+]?[\d\-\(\)\s]+$/).max(20).optional(),
    description: z.string().max(1000).trim().optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    filename: z.string().max(255),
    mimetype: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_.]*$/),
    size: z.number().max(10 * 1024 * 1024), // 10MB max
  }),

  // Security-related validation
  security: z.object({
    token: z.string().min(1).max(500),
    password: z.string().min(8).max(128),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_HEAD', 'INSTRUCTOR', 'STUDENT', 'SYSTEM_AUDITOR']),
  }),

  // Date validation
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  }),
};

// Security validation patterns
const securityPatterns = {
  // Prevent SQL injection patterns
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b|['";]|--|\/\*|\*\/)/i,
  
  // Prevent XSS patterns
  xssPatterns: /<script|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=/i,
  
  // Prevent path traversal
  pathTraversal: /\.\.|\/\.\.|\\\.\.|\%2e\%2e|\%2f\%2e\%2e/i,
  
  // Prevent command injection
  commandInjection: /[;&|`$(){}[\]\\]/,
};

export class ValidationMiddleware {
  private config: ValidationConfig;

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  /**
   * Validate request data against security patterns
   */
  private validateSecurity(data: any, path: string = ''): string[] {
    const errors: string[] = [];
    
    if (typeof data === 'string') {
      // Check for SQL injection
      if (securityPatterns.sqlInjection.test(data)) {
        errors.push(`Potential SQL injection detected in ${path || 'input'}`);
      }
      
      // Check for XSS
      if (securityPatterns.xssPatterns.test(data)) {
        errors.push(`Potential XSS detected in ${path || 'input'}`);
      }
      
      // Check for path traversal
      if (securityPatterns.pathTraversal.test(data)) {
        errors.push(`Path traversal attempt detected in ${path || 'input'}`);
      }
      
      // Check for command injection
      if (securityPatterns.commandInjection.test(data)) {
        errors.push(`Potential command injection detected in ${path || 'input'}`);
      }
    } else if (Array.isArray(data)) {
      data.forEach((item, index) => {
        errors.push(...this.validateSecurity(item, `${path}[${index}]`));
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        errors.push(...this.validateSecurity(value, newPath));
      });
    }
    
    return errors;
  }

  /**
   * Validate request body size
   */
  private async validateBodySize(request: NextRequest): Promise<boolean> {
    if (!this.config.maxBodySize) return true;
    
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > this.config.maxBodySize) {
      return false;
    }
    
    return true;
  }

  /**
   * Parse and validate request body
   */
  private async parseBody(request: NextRequest): Promise<any> {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        return await request.json();
      } catch (error) {
        throw new Error('Invalid JSON in request body');
      }
    } else if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        const result: any = {};
        
        formData.forEach((value, key) => {
          if (value instanceof File) {
            result[key] = {
              name: value.name,
              size: value.size,
              type: value.type,
              file: value
            };
          } else {
            result[key] = value;
          }
        });
        
        return result;
      } catch (error) {
        throw new Error('Invalid form data in request body');
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const text = await request.text();
        const params = new URLSearchParams(text);
        const result: any = {};
        
        params.forEach((value, key) => {
          result[key] = value;
        });
        
        return result;
      } catch (error) {
        throw new Error('Invalid form data in request body');
      }
    }
    
    return {};
  }

  /**
   * Parse query parameters
   */
  private parseQuery(request: NextRequest): Record<string, any> {
    const { searchParams } = request.nextUrl;
    const query: Record<string, any> = {};
    
    searchParams.forEach((value, key) => {
      // Handle array parameters (key[])
      if (key.endsWith('[]')) {
        const baseKey = key.slice(0, -2);
        if (!query[baseKey]) {
          query[baseKey] = [];
        }
        query[baseKey].push(value);
      } else {
        query[key] = value;
      }
    });
    
    return query;
  }

  /**
   * Validate request method
   */
  private validateMethod(method: string): boolean {
    if (!this.config.allowedMethods) return true;
    return this.config.allowedMethods.includes(method.toUpperCase());
  }

  /**
   * Main validation function
   */
  async validate(request: NextRequest, params?: Record<string, string>): Promise<{
    isValid: boolean;
    data?: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
    };
    errors?: string[];
  }> {
    const errors: string[] = [];
    const data: any = {};

    try {
      // Validate method
      if (!this.validateMethod(request.method)) {
        errors.push(`Method ${request.method} not allowed`);
      }

      // Validate body size
      if (!(await this.validateBodySize(request))) {
        errors.push(`Request body too large. Maximum size: ${this.config.maxBodySize} bytes`);
      }

      // Parse and validate body
      if (this.config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await this.parseBody(request);
          
          // Security validation
          const securityErrors = this.validateSecurity(body, 'body');
          errors.push(...securityErrors);
          
          // Sanitize if requested
          const sanitizedBody = this.config.sanitizeBody ? sanitizeObject(body) : body;
          
          // Schema validation
          const validatedBody = this.config.body.parse(sanitizedBody);
          data.body = validatedBody;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(e => `Body validation: ${e.path.join('.')} - ${e.message}`));
          } else {
            errors.push(`Body validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Parse and validate query parameters
      if (this.config.query) {
        try {
          const query = this.parseQuery(request);
          
          // Security validation
          const securityErrors = this.validateSecurity(query, 'query');
          errors.push(...securityErrors);
          
          // Schema validation
          const validatedQuery = this.config.query.parse(query);
          data.query = validatedQuery;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(e => `Query validation: ${e.path.join('.')} - ${e.message}`));
          } else {
            errors.push(`Query validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Validate route parameters
      if (this.config.params && params) {
        try {
          // Security validation
          const securityErrors = this.validateSecurity(params, 'params');
          errors.push(...securityErrors);
          
          // Schema validation
          const validatedParams = this.config.params.parse(params);
          data.params = validatedParams;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(e => `Params validation: ${e.path.join('.')} - ${e.message}`));
          } else {
            errors.push(`Params validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Validate headers
      if (this.config.headers) {
        try {
          const headers: Record<string, string> = {};
          request.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });
          
          const validatedHeaders = this.config.headers.parse(headers);
          data.headers = validatedHeaders;
        } catch (error) {
          if (error instanceof ZodError) {
            errors.push(...error.errors.map(e => `Headers validation: ${e.path.join('.')} - ${e.message}`));
          } else {
            errors.push(`Headers validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? data : undefined,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      };
    }
  }

  /**
   * Create a validation response for errors
   */
  createErrorResponse(errors: string[]): NextResponse {
    return NextResponse.json(
      {
        error: 'Validation failed',
        message: 'Request validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}

/**
 * Helper function to create validation middleware
 */
export function createValidationMiddleware(config: ValidationConfig) {
  return new ValidationMiddleware(config);
}

/**
 * Helper function to validate API requests
 */
export async function validateRequest(
  request: NextRequest,
  config: ValidationConfig,
  params?: Record<string, string>
): Promise<{ data?: any; response?: NextResponse }> {
  const validator = new ValidationMiddleware(config);
  const result = await validator.validate(request, params);
  
  if (!result.isValid) {
    return {
      response: validator.createErrorResponse(result.errors || ['Unknown validation error'])
    };
  }
  
  return { data: result.data };
}

// Export common validation configurations
export const validationConfigs = {
  // Basic CRUD operations
  create: {
    allowedMethods: ['POST'],
    sanitizeBody: true,
    maxBodySize: 1024 * 1024, // 1MB
  },
  
  read: {
    allowedMethods: ['GET'],
    query: commonSchemas.pagination.merge(commonSchemas.search).merge(commonSchemas.sorting),
  },
  
  update: {
    allowedMethods: ['PUT', 'PATCH'],
    sanitizeBody: true,
    maxBodySize: 1024 * 1024, // 1MB
  },
  
  delete: {
    allowedMethods: ['DELETE'],
    params: commonSchemas.id,
  },
  
  // File upload
  upload: {
    allowedMethods: ['POST'],
    maxBodySize: 10 * 1024 * 1024, // 10MB
    sanitizeBody: false, // Don't sanitize file uploads
  },
  
  // Authentication
  auth: {
    allowedMethods: ['POST'],
    sanitizeBody: true,
    maxBodySize: 1024, // 1KB
  },
} as const;

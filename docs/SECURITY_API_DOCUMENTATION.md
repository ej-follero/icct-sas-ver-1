# Security System API Documentation

## Overview

This document provides comprehensive API documentation for the Security System endpoints. All endpoints are prefixed with `/api/security/` and require appropriate authentication and authorization.

## Base URL
```
http://localhost:3000/api/security
```

## Authentication

All endpoints require authentication. Include the session cookie or authorization header:

```bash
# Using session cookie (recommended)
curl -H "Cookie: session=your-session-token" https://localhost:3000/api/security/settings

# Using authorization header
curl -H "Authorization: Bearer your-token" https://localhost:3000/api/security/settings
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "Unauthorized",
  "status": 401
}
```

```json
{
  "error": "Forbidden",
  "status": 403
}
```

```json
{
  "error": "Internal Server Error",
  "status": 500
}
```

## Endpoints

### 1. Security Settings

#### GET /api/security/settings

Retrieves the current security settings.

**Response:**
```json
{
  "id": 1,
  "twoFactorAuth": false,
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": false
  },
  "sessionTimeout": 30,
  "maxLoginAttempts": 5,
  "lockoutDuration": 15,
  "ipWhitelist": ["192.168.1.0/24"],
  "auditLogRetention": 90,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view security settings

#### PUT /api/security/settings

Updates security settings. Requires SUPER_ADMIN role.

**Request Body:**
```json
{
  "twoFactorAuth": true,
  "passwordPolicy": {
    "minLength": 10,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": true
  },
  "sessionTimeout": 60,
  "maxLoginAttempts": 3,
  "lockoutDuration": 30,
  "ipWhitelist": ["192.168.1.0/24", "10.0.0.0/8"],
  "auditLogRetention": 180
}
```

**Response:**
```json
{
  "message": "Security settings updated successfully",
  "settings": {
    "id": 1,
    "twoFactorAuth": true,
    "passwordPolicy": {
      "minLength": 10,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSpecialChars": true
    },
    "sessionTimeout": 60,
    "maxLoginAttempts": 3,
    "lockoutDuration": 30,
    "ipWhitelist": ["192.168.1.0/24", "10.0.0.0/8"],
    "auditLogRetention": 180,
    "updatedAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks SUPER_ADMIN role
- `500 Internal Server Error`: Database error

### 2. Security Status

#### GET /api/security/status

Retrieves real-time security status and statistics.

**Response:**
```json
{
  "totalLogs": 1250,
  "criticalEvents": 5,
  "failedLogins": 12,
  "suspiciousActivities": 3,
  "last24Hours": {
    "logins": 45,
    "failedLogins": 8,
    "securityEvents": 15
  },
  "systemHealth": {
    "database": "healthy",
    "api": "healthy",
    "lastCheck": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view security status

### 3. Security Logs

#### GET /api/security/logs

Retrieves security logs with filtering and pagination.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page (max: 100)
- `severity` (optional): Filter by severity level (INFO, WARNING, ERROR, CRITICAL)
- `event` (optional): Filter by event type
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter logs from date (ISO 8601 format)
- `endDate` (optional): Filter logs to date (ISO 8601 format)
- `ipAddress` (optional): Filter by IP address

**Example Request:**
```bash
curl "http://localhost:3000/api/security/logs?page=1&limit=20&severity=CRITICAL&startDate=2024-01-01T00:00:00Z"
```

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "event": "LOGIN_ATTEMPT",
      "userId": 1,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "details": {
        "success": true,
        "method": "password",
        "sessionId": "abc123"
      },
      "severity": "INFO",
      "timestamp": "2024-01-15T10:30:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "severity": "CRITICAL",
    "startDate": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view security logs

### 4. Security Analytics

#### GET /api/security/analytics

Retrieves security analytics data.

**Query Parameters:**
- `period` (optional, default: 30d): Time period (7d, 30d, 90d)
- `type` (optional, default: events): Analytics type (events, logins, alerts)

**Example Request:**
```bash
curl "http://localhost:3000/api/security/analytics?period=30d&type=events"
```

**Response:**
```json
{
  "period": "30d",
  "type": "events",
  "data": {
    "totalEvents": 1250,
    "eventsByType": {
      "LOGIN_ATTEMPT": 800,
      "PASSWORD_CHANGE": 150,
      "SETTINGS_UPDATE": 200,
      "SUSPICIOUS_ACTIVITY": 100
    },
    "eventsBySeverity": {
      "INFO": 1000,
      "WARNING": 200,
      "ERROR": 40,
      "CRITICAL": 10
    },
    "trends": [
      {
        "date": "2024-01-01",
        "count": 45,
        "severity": "INFO",
        "type": "LOGIN_ATTEMPT"
      },
      {
        "date": "2024-01-02",
        "count": 52,
        "severity": "INFO",
        "type": "LOGIN_ATTEMPT"
      }
    ],
    "topUsers": [
      {
        "userId": 1,
        "name": "John Doe",
        "eventCount": 150,
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    ],
    "topIPs": [
      {
        "ipAddress": "192.168.1.100",
        "eventCount": 200,
        "lastActivity": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view analytics

### 5. Security Alerts

#### GET /api/security/alerts

Retrieves security alerts with filtering and pagination.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page (max: 100)
- `type` (optional): Filter by alert type (LOW, MEDIUM, HIGH, CRITICAL)
- `resolved` (optional): Filter by resolution status (true/false)
- `actionRequired` (optional): Filter by action required (true/false)
- `userId` (optional): Filter by user ID

**Example Request:**
```bash
curl "http://localhost:3000/api/security/alerts?page=1&limit=20&type=CRITICAL&resolved=false"
```

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "type": "CRITICAL",
      "title": "Multiple Failed Login Attempts",
      "message": "User ID 1 has had 7 failed login attempts in the last 30 minutes from IP 192.168.1.100",
      "userId": 1,
      "ipAddress": "192.168.1.100",
      "actionRequired": true,
      "resolved": false,
      "resolvedAt": null,
      "resolvedBy": null,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "ADMIN"
      },
      "resolver": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "type": "CRITICAL",
    "resolved": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid query parameters
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view alerts

#### PUT /api/security/alerts

Updates alert resolution status. Requires ADMIN or SUPER_ADMIN role.

**Request Body:**
```json
{
  "alertId": 1,
  "resolved": true,
  "resolvedBy": 2
}
```

**Response:**
```json
{
  "message": "Alert resolved successfully",
  "alert": {
    "id": 1,
    "type": "CRITICAL",
    "title": "Multiple Failed Login Attempts",
    "message": "User ID 1 has had 7 failed login attempts in the last 30 minutes",
    "userId": 1,
    "ipAddress": "192.168.1.100",
    "actionRequired": true,
    "resolved": true,
    "resolvedAt": "2024-01-15T10:35:00Z",
    "resolvedBy": 2,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "resolver": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request body or alert not found
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to resolve alerts
- `500 Internal Server Error`: Database error

### 6. Security Notifications

#### GET /api/security/notifications/stats

Retrieves security notification statistics.

**Response:**
```json
{
  "totalAlerts": 25,
  "activeAlerts": 8,
  "criticalAlerts": 3,
  "resolvedToday": 5,
  "resolutionRate": 68.0,
  "criticalRate": 12.0,
  "averageResolutionTime": "2.5 hours",
  "trends": {
    "alertsCreated": [10, 15, 8, 12, 20],
    "alertsResolved": [8, 12, 6, 10, 18],
    "dates": ["2024-01-11", "2024-01-12", "2024-01-13", "2024-01-14", "2024-01-15"]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks permission to view notification stats

### 7. Test Endpoints

#### POST /api/security/test-alerts

Generates test security alerts for testing purposes. Requires SUPER_ADMIN role.

**Response:**
```json
{
  "message": "Test alerts created successfully",
  "count": 4,
  "alerts": [
    {
      "id": 1,
      "type": "CRITICAL",
      "title": "Multiple Failed Login Attempts",
      "message": "User ID 1 has had 7 failed login attempts in the last 30 minutes from IP 192.168.1.100"
    },
    {
      "id": 2,
      "type": "HIGH",
      "title": "Login from New Location",
      "message": "User ID 2 logged in from a new IP address: 203.0.113.45"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized`: User not authenticated
- `403 Forbidden`: User lacks SUPER_ADMIN role
- `500 Internal Server Error`: Database error

## Rate Limiting

All security endpoints are rate-limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Logging endpoints**: 1000 requests per 15 minutes per IP
- **Analytics endpoints**: 50 requests per 15 minutes per IP

When rate limited, endpoints return:

```json
{
  "error": "Too many requests",
  "status": 429,
  "retryAfter": 900
}
```

## Pagination

All list endpoints support pagination with the following response format:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Filtering

Most list endpoints support filtering with query parameters. Filters are returned in the response for transparency:

```json
{
  "data": [...],
  "pagination": {...},
  "filters": {
    "severity": "CRITICAL",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-15T23:59:59Z"
  }
}
```

## Data Formats

### Dates
All dates are returned in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

### IP Addresses
IP addresses are validated and stored as strings. IPv4 and IPv6 formats are supported.

### JSON Fields
Complex data is stored as JSON and returned as objects. Examples:
- `passwordPolicy`: Password policy configuration
- `details`: Additional event details
- `ipWhitelist`: Array of IP ranges

## Webhooks (Future Enhancement)

The security system will support webhooks for real-time notifications:

```json
{
  "event": "SECURITY_ALERT_CREATED",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "alertId": 1,
    "type": "CRITICAL",
    "title": "Security Breach Detected",
    "message": "Unauthorized access attempt detected"
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
class SecurityAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async getSettings() {
    const response = await fetch(`${this.baseUrl}/api/security/settings`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }

  async updateSettings(settings: any) {
    const response = await fetch(`${this.baseUrl}/api/security/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    return response.json();
  }

  async getLogs(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseUrl}/api/security/logs?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return response.json();
  }
}
```

### Python

```python
import requests
import json

class SecurityAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def get_settings(self):
        response = requests.get(
            f'{self.base_url}/api/security/settings',
            headers=self.headers
        )
        return response.json()

    def update_settings(self, settings: dict):
        response = requests.put(
            f'{self.base_url}/api/security/settings',
            headers=self.headers,
            json=settings
        )
        return response.json()

    def get_logs(self, params: dict = None):
        response = requests.get(
            f'{self.base_url}/api/security/logs',
            headers=self.headers,
            params=params
        )
        return response.json()
```

## Testing

### Using curl

```bash
# Get security settings
curl -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/security/settings

# Update security settings
curl -X PUT \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"twoFactorAuth": true, "maxLoginAttempts": 3}' \
  http://localhost:3000/api/security/settings

# Get security logs with filters
curl -H "Authorization: Bearer your-token" \
  "http://localhost:3000/api/security/logs?severity=CRITICAL&limit=10"

# Create test alerts
curl -X POST \
  -H "Authorization: Bearer your-token" \
  http://localhost:3000/api/security/test-alerts
```

### Using Postman

1. Set up a collection with base URL: `http://localhost:3000/api/security`
2. Add authorization header: `Authorization: Bearer your-token`
3. Create requests for each endpoint
4. Use environment variables for dynamic values

---

*This API documentation covers all security system endpoints. For implementation details, see the main documentation files.* 
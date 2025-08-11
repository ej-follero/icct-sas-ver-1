# Security System Documentation

## Overview

The ICCT Smart Attendance System includes a comprehensive security management system that provides real-time monitoring, alerting, and analytics for system security events. This documentation covers all implemented features, APIs, and components.

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Frontend Components](#frontend-components)
4. [Services](#services)
5. [Security Features](#security-features)
6. [Role-Based Access Control](#role-based-access-control)
7. [Usage Instructions](#usage-instructions)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Database Schema

### SecuritySettings Model
```prisma
model SecuritySettings {
  id                    Int      @id @default(autoincrement())
  twoFactorAuth         Boolean  @default(false)
  passwordPolicy        Json     @default("{}")
  sessionTimeout        Int      @default(30)
  maxLoginAttempts      Int      @default(5)
  lockoutDuration       Int      @default(15)
  ipWhitelist           Json     @default("[]")
  auditLogRetention     Int      @default(90)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
}
```

### SecurityLog Model
```prisma
model SecurityLog {
  id          Int           @id @default(autoincrement())
  event       String
  userId      Int?
  ipAddress   String?
  userAgent   String?
  details     Json?
  severity    SecurityLevel @default(INFO)
  timestamp   DateTime      @default(now())
  user        User?         @relation(fields: [userId], references: [id])
}
```

### SecurityAlert Model
```prisma
model SecurityAlert {
  id            Int           @id @default(autoincrement())
  type          SecurityAlertType
  title         String
  message       String
  userId        Int?
  ipAddress     String?
  actionRequired Boolean      @default(false)
  resolved      Boolean       @default(false)
  resolvedAt    DateTime?
  resolvedBy    Int?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  user          User?         @relation("SecurityAlerts", fields: [userId], references: [id])
  resolver      User?         @relation("ResolvedSecurityAlerts", fields: [resolvedBy], references: [id])
}
```

### Enums
```prisma
enum SecurityLevel {
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum SecurityAlertType {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}
```

## API Endpoints

### Security Settings

#### GET /api/security/settings
Retrieves current security settings.

**Response:**
```json
{
  "id": 1,
  "twoFactorAuth": false,
  "passwordPolicy": {},
  "sessionTimeout": 30,
  "maxLoginAttempts": 5,
  "lockoutDuration": 15,
  "ipWhitelist": [],
  "auditLogRetention": 90
}
```

#### PUT /api/security/settings
Updates security settings.

**Request Body:**
```json
{
  "twoFactorAuth": true,
  "passwordPolicy": {
    "minLength": 8,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSpecialChars": true
  },
  "sessionTimeout": 60,
  "maxLoginAttempts": 3,
  "lockoutDuration": 30,
  "ipWhitelist": ["192.168.1.0/24"],
  "auditLogRetention": 180
}
```

### Security Status

#### GET /api/security/status
Retrieves real-time security status.

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
  }
}
```

### Security Logs

#### GET /api/security/logs
Retrieves security logs with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `severity` (optional): Filter by severity level
- `event` (optional): Filter by event type
- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter logs from date
- `endDate` (optional): Filter logs to date

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "event": "LOGIN_ATTEMPT",
      "userId": 1,
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "details": {
        "success": true,
        "method": "password"
      },
      "severity": "INFO",
      "timestamp": "2024-01-15T10:30:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

### Security Analytics

#### GET /api/security/analytics
Retrieves security analytics data.

**Query Parameters:**
- `period` (optional): Time period (7d, 30d, 90d) (default: 30d)
- `type` (optional): Analytics type (events, logins, alerts) (default: events)

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
        "severity": "INFO"
      }
    ]
  }
}
```

### Security Alerts

#### GET /api/security/alerts
Retrieves security alerts with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by alert type
- `resolved` (optional): Filter by resolution status
- `actionRequired` (optional): Filter by action required

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "type": "CRITICAL",
      "title": "Multiple Failed Login Attempts",
      "message": "User ID 1 has had 7 failed login attempts in the last 30 minutes",
      "userId": 1,
      "ipAddress": "192.168.1.100",
      "actionRequired": true,
      "resolved": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

#### PUT /api/security/alerts
Updates alert resolution status.

**Request Body:**
```json
{
  "alertId": 1,
  "resolved": true,
  "resolvedBy": 2
}
```

### Security Notifications

#### GET /api/security/notifications/stats
Retrieves notification statistics.

**Response:**
```json
{
  "totalAlerts": 25,
  "activeAlerts": 8,
  "criticalAlerts": 3,
  "resolvedToday": 5
}
```

### Test Endpoints

#### POST /api/security/test-alerts
Generates test security alerts for testing purposes.

**Response:**
```json
{
  "message": "Test alerts created successfully",
  "count": 4
}
```

## Frontend Components

### SecurityPage Component
**Location:** `src/app/settings/security/page.tsx`

Main security settings page with tabs for:
- General Settings
- Analytics
- Alerts
- Notifications

**Features:**
- Role-based access control
- Real-time settings updates
- Security status monitoring
- Analytics visualization
- Alert management
- Notification statistics

### SecurityAnalytics Component
**Location:** `src/components/analytics/SecurityAnalytics.tsx`

Displays security analytics with:
- Event distribution charts
- Severity level breakdown
- Time-based trends
- Interactive filters

### SecurityAlerts Component
**Location:** `src/components/security/SecurityAlerts.tsx`

Manages security alerts with:
- Alert listing with pagination
- Filtering by type and status
- Alert resolution functionality
- Real-time updates

### NotificationStats Component
**Location:** `src/components/security/NotificationStats.tsx`

Displays notification statistics with:
- Total alerts count
- Active alerts count
- Critical alerts count
- Resolution rates
- Today's activity summary

## Services

### SecurityLogger Service
**Location:** `src/lib/services/security-logger.service.ts`

Centralized logging service for security events.

**Methods:**
- `logLoginAttempt(userId, success, ipAddress, userAgent, details?)`
- `logPasswordChange(userId, ipAddress, userAgent)`
- `logSettingsUpdate(userId, settings, ipAddress, userAgent)`
- `logSuspiciousActivity(userId, activity, ipAddress, userAgent, details?)`
- `logSecurityAlert(alert)`
- `logAlertResolved(alertId, resolvedBy)`

### SecurityNotifications Service
**Location:** `src/lib/services/security-notifications.service.ts`

Manages security alerts and notifications.

**Methods:**
- `sendSecurityAlert(alert)`
- `checkSuspiciousLogins(userId, ipAddress)`
- `sendEmailNotification(alert, recipients)`
- `getActiveAlerts()`
- `resolveAlert(alertId, resolvedBy)`
- `getNotificationStats()`

## Security Features

### 1. Two-Factor Authentication
- Enable/disable 2FA for the system
- Configure authentication methods
- Monitor 2FA usage

### 2. Password Policy Management
- Minimum password length
- Character requirements (uppercase, lowercase, numbers, special characters)
- Password expiration settings
- Password history tracking

### 3. Session Management
- Configurable session timeout
- Automatic session termination
- Session activity monitoring

### 4. Login Security
- Maximum login attempts
- Account lockout duration
- IP-based restrictions
- Failed login monitoring

### 5. IP Whitelisting
- Configure allowed IP ranges
- Block suspicious IP addresses
- Geographic IP restrictions

### 6. Audit Logging
- Comprehensive event logging
- Configurable retention periods
- Detailed activity tracking
- Export capabilities

### 7. Real-time Alerts
- Critical security event notifications
- Suspicious activity detection
- Automated alert generation
- Alert resolution tracking

### 8. Security Analytics
- Event trend analysis
- Severity level distribution
- User activity patterns
- System security metrics

## Role-Based Access Control

### Super Admin
- Full access to all security features
- Can modify all security settings
- Access to all analytics and logs
- Can manage alerts and notifications

### Admin
- Limited access to security settings
- View-only access to analytics
- Can view and resolve alerts
- Access to notification statistics

### Audit
- Read-only access to security logs
- View-only access to analytics
- Can view alerts (no resolution)
- Access to notification statistics

### Other Roles
- No access to security features
- Redirected to access restricted page

## Usage Instructions

### For Administrators

1. **Access Security Settings**
   - Navigate to Settings > Security
   - Ensure you have appropriate permissions

2. **Configure Security Settings**
   - Go to the "Settings" tab
   - Modify security parameters as needed
   - Click "Save Changes" to apply

3. **Monitor Security Status**
   - Check the "Analytics" tab for security trends
   - Review the "Alerts" tab for active security issues
   - View "Notifications" tab for statistics

4. **Manage Alerts**
   - Review active alerts in the Alerts tab
   - Click "Resolve" to mark alerts as resolved
   - Monitor alert patterns and trends

### For Developers

1. **Adding New Security Events**
   ```typescript
   import { SecurityLogger } from '@/lib/services/security-logger.service';
   
   // Log a new security event
   await SecurityLogger.logSuspiciousActivity(
     userId,
     'UNUSUAL_ACCESS_PATTERN',
     ipAddress,
     userAgent,
     { details: 'Additional context' }
   );
   ```

2. **Creating Security Alerts**
   ```typescript
   import { SecurityNotifications } from '@/lib/services/security-notifications.service';
   
   // Send a security alert
   await SecurityNotifications.sendSecurityAlert({
     type: 'CRITICAL',
     title: 'Security Breach Detected',
     message: 'Unauthorized access attempt detected',
     userId: userId,
     ipAddress: ipAddress,
     actionRequired: true
   });
   ```

3. **Custom Analytics**
   ```typescript
   // Fetch custom analytics data
   const response = await fetch('/api/security/analytics?period=7d&type=events');
   const analytics = await response.json();
   ```

## Testing

### Manual Testing

1. **Test Security Settings**
   - Navigate to Settings > Security
   - Modify various settings
   - Verify changes are saved and applied

2. **Test Alerts**
   - Use the test endpoint: `POST /api/security/test-alerts`
   - Check the Alerts tab for new alerts
   - Test alert resolution functionality

3. **Test Analytics**
   - Generate some security events
   - Check the Analytics tab for data
   - Test different time periods and filters

### Automated Testing

1. **API Testing**
   ```bash
   # Test security settings API
   curl -X GET http://localhost:3000/api/security/settings
   
   # Test alerts API
   curl -X GET http://localhost:3000/api/security/alerts
   
   # Test analytics API
   curl -X GET http://localhost:3000/api/security/analytics
   ```

2. **Database Testing**
   ```bash
   # Run database migrations
   npx prisma migrate dev
   
   # Seed test data
   npx prisma db seed
   ```

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   - Check user role and permissions
   - Verify role-based access control settings
   - Contact system administrator

2. **Database Connection Issues**
   - Verify database connection string
   - Check Prisma schema and migrations
   - Run `npx prisma generate` to regenerate client

3. **API Endpoint Errors**
   - Check API route handlers
   - Verify request/response formats
   - Check server logs for detailed error messages

4. **Component Rendering Issues**
   - Check React component imports
   - Verify hook order and dependencies
   - Check browser console for JavaScript errors

### Debug Mode

Enable debug logging by setting environment variables:
```bash
DEBUG=security:*
NODE_ENV=development
```

### Log Files

Security logs are stored in the database and can be accessed via:
- API endpoint: `GET /api/security/logs`
- Database query: `SELECT * FROM SecurityLog ORDER BY timestamp DESC`

### Performance Monitoring

Monitor system performance with:
- Database query performance
- API response times
- Frontend component rendering
- Memory usage patterns

## Security Best Practices

1. **Regular Updates**
   - Keep security settings up to date
   - Monitor security logs regularly
   - Update password policies as needed

2. **Alert Management**
   - Respond to critical alerts immediately
   - Review and resolve alerts promptly
   - Monitor alert patterns for trends

3. **Access Control**
   - Regularly review user permissions
   - Implement least privilege principle
   - Monitor user activity patterns

4. **Data Protection**
   - Encrypt sensitive data
   - Implement proper backup strategies
   - Regular security audits

## Future Enhancements

1. **Advanced Analytics**
   - Machine learning-based threat detection
   - Predictive security analytics
   - Custom dashboard creation

2. **Enhanced Notifications**
   - Real-time push notifications
   - SMS alerts for critical events
   - Custom notification channels

3. **Integration Capabilities**
   - SIEM system integration
   - Third-party security tools
   - API webhook support

4. **Advanced Features**
   - Behavioral analytics
   - Risk scoring algorithms
   - Automated response actions

---

*This documentation covers the complete security system implementation. For additional support or questions, please refer to the development team or system administrator.* 
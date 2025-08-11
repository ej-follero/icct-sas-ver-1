# Security System Documentation

## Overview

The ICCT Smart Attendance System includes a comprehensive security management system that provides real-time monitoring, alerting, and analytics for system security events. This documentation suite covers all aspects of the security system implementation.

## Documentation Structure

### 📚 Main Documentation
- **[Security System Documentation](./SECURITY_SYSTEM_DOCUMENTATION.md)** - Complete system overview, features, and usage instructions
- **[API Documentation](./SECURITY_API_DOCUMENTATION.md)** - Detailed API reference with examples and error codes
- **[Developer Quick Reference](./SECURITY_DEVELOPER_QUICK_REFERENCE.md)** - Code examples and common patterns for developers

### 🚀 Quick Start

#### For Administrators
1. Navigate to **Settings > Security** in the application
2. Review the **Settings** tab to configure security parameters
3. Check the **Analytics** tab for security trends and insights
4. Monitor the **Alerts** tab for active security issues
5. View the **Notifications** tab for statistics and metrics

#### For Developers
1. Review the **[Developer Quick Reference](./SECURITY_DEVELOPER_QUICK_REFERENCE.md)** for code examples
2. Check the **[API Documentation](./SECURITY_API_DOCUMENTATION.md)** for endpoint details
3. Use the test endpoints to generate sample data
4. Integrate security logging into your components

## System Features

### 🔐 Security Settings
- **Two-Factor Authentication**: Enable/disable 2FA for the system
- **Password Policy Management**: Configure password requirements and complexity
- **Session Management**: Set session timeouts and automatic termination
- **Login Security**: Configure maximum login attempts and lockout duration
- **IP Whitelisting**: Manage allowed IP ranges and restrictions
- **Audit Logging**: Configure retention periods and logging levels

### 📊 Security Analytics
- **Real-time Monitoring**: Live security status and statistics
- **Event Analysis**: Comprehensive logging of all security events
- **Trend Visualization**: Charts and graphs for security metrics
- **User Activity Tracking**: Monitor user behavior patterns
- **System Health Monitoring**: Database and API health checks

### 🚨 Security Alerts
- **Real-time Notifications**: Instant alerts for critical security events
- **Suspicious Activity Detection**: Automated detection of unusual patterns
- **Alert Management**: Resolution tracking and status updates
- **Email Notifications**: Automated email alerts to administrators
- **Alert Statistics**: Comprehensive reporting and metrics

### 👥 Role-Based Access Control
- **Super Admin**: Full access to all security features
- **Admin**: Limited access with alert management capabilities
- **Audit**: Read-only access to logs and analytics
- **Other Roles**: No access to security features

## API Endpoints

### Core Endpoints
- `GET /api/security/settings` - Retrieve security settings
- `PUT /api/security/settings` - Update security settings
- `GET /api/security/status` - Get real-time security status
- `GET /api/security/logs` - Retrieve security logs with filtering
- `GET /api/security/analytics` - Get security analytics data

### Alert Management
- `GET /api/security/alerts` - Retrieve security alerts
- `PUT /api/security/alerts` - Update alert resolution status
- `GET /api/security/notifications/stats` - Get notification statistics

### Testing
- `POST /api/security/test-alerts` - Generate test security alerts

## Database Models

### SecuritySettings
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

### SecurityLog
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

### SecurityAlert
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

## Services

### SecurityLogger Service
Centralized logging service for all security events.

**Key Methods:**
- `logLoginAttempt(userId, success, ipAddress, userAgent, details?)`
- `logPasswordChange(userId, ipAddress, userAgent)`
- `logSettingsUpdate(userId, settings, ipAddress, userAgent)`
- `logSuspiciousActivity(userId, activity, ipAddress, userAgent, details?)`
- `logSecurityAlert(alert)`
- `logAlertResolved(alertId, resolvedBy)`

### SecurityNotifications Service
Manages security alerts and notifications.

**Key Methods:**
- `sendSecurityAlert(alert)`
- `checkSuspiciousLogins(userId, ipAddress)`
- `sendEmailNotification(alert, recipients)`
- `getActiveAlerts()`
- `resolveAlert(alertId, resolvedBy)`
- `getNotificationStats()`

## Frontend Components

### SecurityPage
Main security settings page with tabs for:
- **Settings**: Configure security parameters
- **Analytics**: View security trends and metrics
- **Alerts**: Manage security alerts
- **Notifications**: View notification statistics

### SecurityAnalytics
Displays security analytics with:
- Event distribution charts
- Severity level breakdown
- Time-based trends
- Interactive filters

### SecurityAlerts
Manages security alerts with:
- Alert listing with pagination
- Filtering by type and status
- Alert resolution functionality
- Real-time updates

### NotificationStats
Displays notification statistics with:
- Total alerts count
- Active alerts count
- Critical alerts count
- Resolution rates
- Today's activity summary

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Prisma CLI

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npx prisma migrate dev`
5. Seed the database: `npx prisma db seed`
6. Start the development server: `npm run dev`

### Testing the Security System
1. Navigate to **Settings > Security**
2. Use the test endpoint to generate alerts: `POST /api/security/test-alerts`
3. Check the **Alerts** tab for new alerts
4. Test alert resolution functionality
5. Explore the **Analytics** tab for data visualization

## Common Use Cases

### 1. Monitoring Security Events
```typescript
// Log a login attempt
await SecurityLogger.logLoginAttempt(
  userId,
  true,
  '192.168.1.100',
  'Mozilla/5.0...',
  { method: 'password' }
);

// Check security status
const status = await fetch('/api/security/status').then(r => r.json());
```

### 2. Creating Security Alerts
```typescript
// Send a critical alert
await SecurityNotifications.sendSecurityAlert({
  type: 'CRITICAL',
  title: 'Multiple Failed Login Attempts',
  message: `User ${userId} has had 7 failed login attempts`,
  userId: userId,
  ipAddress: ipAddress,
  actionRequired: true
});
```

### 3. Viewing Analytics
```typescript
// Get security analytics
const analytics = await fetch('/api/security/analytics?period=30d&type=events')
  .then(r => r.json());
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

## Security Best Practices

### 1. Regular Updates
- Keep security settings up to date
- Monitor security logs regularly
- Update password policies as needed

### 2. Alert Management
- Respond to critical alerts immediately
- Review and resolve alerts promptly
- Monitor alert patterns for trends

### 3. Access Control
- Regularly review user permissions
- Implement least privilege principle
- Monitor user activity patterns

### 4. Data Protection
- Encrypt sensitive data
- Implement proper backup strategies
- Regular security audits

## Future Enhancements

### 1. Advanced Analytics
- Machine learning-based threat detection
- Predictive security analytics
- Custom dashboard creation

### 2. Enhanced Notifications
- Real-time push notifications
- SMS alerts for critical events
- Custom notification channels

### 3. Integration Capabilities
- SIEM system integration
- Third-party security tools
- API webhook support

### 4. Advanced Features
- Behavioral analytics
- Risk scoring algorithms
- Automated response actions

## Support

For additional support or questions:
- Review the detailed documentation files
- Check the troubleshooting section
- Contact the development team
- Refer to system administrator

---

*This documentation suite provides comprehensive coverage of the security system implementation. Choose the appropriate documentation file based on your needs and role.* 
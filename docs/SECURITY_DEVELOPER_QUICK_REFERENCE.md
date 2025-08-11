# Security System Developer Quick Reference

## Quick Start

### 1. Basic Security Logging
```typescript
import { SecurityLogger } from '@/lib/services/security-logger.service';

// Log a login attempt
await SecurityLogger.logLoginAttempt(
  userId,
  true, // success
  '192.168.1.100',
  'Mozilla/5.0...',
  { method: 'password' }
);

// Log suspicious activity
await SecurityLogger.logSuspiciousActivity(
  userId,
  'UNUSUAL_ACCESS_PATTERN',
  ipAddress,
  userAgent,
  { details: 'Access from new location' }
);
```

### 2. Creating Security Alerts
```typescript
import { SecurityNotifications } from '@/lib/services/security-notifications.service';

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

### 3. API Endpoints Reference

#### Security Settings
```typescript
// GET current settings
const settings = await fetch('/api/security/settings').then(r => r.json());

// PUT update settings
await fetch('/api/security/settings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    twoFactorAuth: true,
    maxLoginAttempts: 3,
    sessionTimeout: 60
  })
});
```

#### Security Logs
```typescript
// GET logs with filters
const logs = await fetch('/api/security/logs?page=1&limit=20&severity=CRITICAL')
  .then(r => r.json());
```

#### Security Analytics
```typescript
// GET analytics data
const analytics = await fetch('/api/security/analytics?period=30d&type=events')
  .then(r => r.json());
```

#### Security Alerts
```typescript
// GET alerts
const alerts = await fetch('/api/security/alerts?page=1&limit=20')
  .then(r => r.json());

// PUT resolve alert
await fetch('/api/security/alerts', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    alertId: 1,
    resolved: true,
    resolvedBy: currentUserId
  })
});
```

## Database Models

### SecuritySettings
```typescript
interface SecuritySettings {
  id: number;
  twoFactorAuth: boolean;
  passwordPolicy: Record<string, any>;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  ipWhitelist: string[];
  auditLogRetention: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### SecurityLog
```typescript
interface SecurityLog {
  id: number;
  event: string;
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: Date;
  user?: User;
}
```

### SecurityAlert
```typescript
interface SecurityAlert {
  id: number;
  type: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  userId?: number;
  ipAddress?: string;
  actionRequired: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  resolver?: User;
}
```

## Common Patterns

### 1. Role-Based Access Control
```typescript
// Check if user can view security logs
function canViewSecurityLogs(): boolean {
  const userRole = getCurrentUserRole();
  return ['SUPER_ADMIN', 'ADMIN', 'AUDIT'].includes(userRole);
}

// Check if user can modify security settings
function canModifySecuritySettings(): boolean {
  const userRole = getCurrentUserRole();
  return ['SUPER_ADMIN'].includes(userRole);
}
```

### 2. Error Handling
```typescript
try {
  await SecurityLogger.logLoginAttempt(userId, success, ipAddress, userAgent);
} catch (error) {
  console.error('Failed to log security event:', error);
  // Don't throw - security logging should not break main functionality
}
```

### 3. Async Operations
```typescript
// Fire and forget for non-critical logging
SecurityLogger.logLoginAttempt(userId, success, ipAddress, userAgent)
  .catch(error => console.error('Security logging failed:', error));

// Wait for critical alerts
await SecurityNotifications.sendSecurityAlert(criticalAlert);
```

## Component Integration

### 1. Adding Security Monitoring to Components
```typescript
import { SecurityLogger } from '@/lib/services/security-logger.service';

function MyComponent() {
  const handleSensitiveAction = async () => {
    try {
      // Perform sensitive action
      await performAction();
      
      // Log the action
      await SecurityLogger.logSettingsUpdate(
        currentUserId,
        { action: 'sensitive_action' },
        getClientIP(),
        navigator.userAgent
      );
    } catch (error) {
      // Log the failure
      await SecurityLogger.logSuspiciousActivity(
        currentUserId,
        'SENSITIVE_ACTION_FAILED',
        getClientIP(),
        navigator.userAgent,
        { error: error.message }
      );
      throw error;
    }
  };
}
```

### 2. Real-time Security Status
```typescript
function SecurityStatusComponent() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch('/api/security/status');
      const data = await response.json();
      setStatus(data);
    };
    
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <p>Total Logs: {status?.totalLogs}</p>
      <p>Critical Events: {status?.criticalEvents}</p>
    </div>
  );
}
```

## Testing

### 1. Unit Testing Security Services
```typescript
import { SecurityLogger } from '@/lib/services/security-logger.service';

describe('SecurityLogger', () => {
  it('should log login attempts', async () => {
    const mockPrisma = { securityLog: { create: jest.fn() } };
    
    await SecurityLogger.logLoginAttempt(1, true, '192.168.1.100', 'test');
    
    expect(mockPrisma.securityLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: 'LOGIN_ATTEMPT',
        userId: 1,
        severity: 'INFO'
      })
    });
  });
});
```

### 2. Integration Testing
```typescript
describe('Security API', () => {
  it('should return security settings', async () => {
    const response = await request(app)
      .get('/api/security/settings')
      .expect(200);
    
    expect(response.body).toHaveProperty('twoFactorAuth');
    expect(response.body).toHaveProperty('maxLoginAttempts');
  });
});
```

### 3. Test Data Generation
```typescript
// Generate test alerts
await fetch('/api/security/test-alerts', { method: 'POST' });

// Create test security logs
await SecurityLogger.logLoginAttempt(1, false, '192.168.1.100', 'test');
await SecurityLogger.logSuspiciousActivity(1, 'TEST_ACTIVITY', '192.168.1.100', 'test');
```

## Performance Considerations

### 1. Batch Logging
```typescript
// For high-volume events, consider batching
const logBatch = [];
logBatch.push({ event: 'LOGIN_ATTEMPT', userId: 1 });

// Process batch periodically
if (logBatch.length >= 10) {
  await SecurityLogger.batchLog(logBatch);
  logBatch.length = 0;
}
```

### 2. Async Processing
```typescript
// Use queue for non-critical logging
import { Queue } from 'bull';

const securityQueue = new Queue('security-logs');

// Add to queue instead of direct logging
await securityQueue.add('log-event', {
  event: 'LOGIN_ATTEMPT',
  userId: 1,
  ipAddress: '192.168.1.100'
});
```

### 3. Caching
```typescript
// Cache security settings
const settingsCache = new Map();

async function getSecuritySettings() {
  if (settingsCache.has('settings')) {
    return settingsCache.get('settings');
  }
  
  const settings = await fetch('/api/security/settings').then(r => r.json());
  settingsCache.set('settings', settings);
  
  return settings;
}
```

## Security Best Practices

### 1. Input Validation
```typescript
function validateSecurityInput(input: any) {
  if (typeof input.userId !== 'number' || input.userId <= 0) {
    throw new Error('Invalid user ID');
  }
  
  if (input.ipAddress && !isValidIP(input.ipAddress)) {
    throw new Error('Invalid IP address');
  }
}
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const securityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many security requests from this IP'
});

app.use('/api/security', securityLimiter);
```

### 3. Data Sanitization
```typescript
function sanitizeSecurityData(data: any) {
  return {
    ...data,
    userAgent: data.userAgent?.substring(0, 500), // Limit length
    ipAddress: data.ipAddress?.replace(/[^0-9.]/g, ''), // Only allow IP chars
    details: typeof data.details === 'object' ? data.details : {}
  };
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Regenerate Prisma client
   npx prisma generate
   
   # Reset database
   npx prisma migrate reset
   ```

2. **Permission Denied**
   ```typescript
   // Check user role
   console.log('Current user role:', getCurrentUserRole());
   
   // Check permissions
   console.log('Can view logs:', canViewSecurityLogs());
   ```

3. **Component Rendering Issues**
   ```typescript
   // Check hook order
   const [data, setData] = useState(null); // Must be first
   const [loading, setLoading] = useState(true); // Must be second
   
   useEffect(() => {
     // Effect must be after all useState calls
   }, []);
   ```

### Debug Mode
```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Security event:', { event, userId, ipAddress });
}
```

---

*This quick reference covers the most common patterns and use cases for the security system. For detailed documentation, see `SECURITY_SYSTEM_DOCUMENTATION.md`.* 
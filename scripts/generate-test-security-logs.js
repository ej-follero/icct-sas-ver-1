const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateTestSecurityLogs() {
  try {
    console.log('Generating test security logs...');

    // Get some users for testing
    const users = await prisma.user.findMany({
      take: 5,
      select: { userId: true, userName: true, email: true }
    });

    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    const testEvents = [
      {
        eventType: 'LOGIN_SUCCESS',
        severity: 'LOW',
        description: 'User login successful',
        userId: users[0].userId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        eventType: 'LOGIN_FAILED',
        severity: 'HIGH',
        description: 'Failed login attempt - Invalid credentials',
        userId: users[1].userId,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      },
      {
        eventType: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH',
        description: 'Multiple failed login attempts detected',
        userId: users[2].userId,
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      },
      {
        eventType: 'PASSWORD_CHANGE',
        severity: 'MEDIUM',
        description: 'Password changed successfully',
        userId: users[0].userId,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      },
      {
        eventType: 'SETTINGS_UPDATE',
        severity: 'MEDIUM',
        description: 'Security settings updated',
        userId: users[3].userId,
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      },
      {
        eventType: 'SECURITY_ALERT',
        severity: 'CRITICAL',
        description: 'Unauthorized access attempt from suspicious IP',
        userId: null,
        ipAddress: '198.51.100.123',
        userAgent: 'Unknown',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        eventType: 'LOGIN_SUCCESS',
        severity: 'LOW',
        description: 'User login successful',
        userId: users[4].userId,
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      }
    ];

    // Insert test events
    for (const event of testEvents) {
      await prisma.securityLog.create({
        data: {
          eventType: event.eventType,
          severity: event.severity,
          description: event.description,
          userId: event.userId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: event.timestamp,
          details: {
            testEvent: true,
            generatedAt: new Date().toISOString()
          }
        }
      });
    }

    console.log(`✅ Generated ${testEvents.length} test security logs`);
    console.log('You can now view the security logs in the Security Analytics tab');

  } catch (error) {
    console.error('Error generating test security logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateTestSecurityLogs();

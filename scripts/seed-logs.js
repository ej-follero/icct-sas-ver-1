const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const logLevels = ['INFO', 'WARNING', 'ERROR', 'DEBUG', 'CRITICAL'];
const modules = ['auth', 'attendance', 'rfid', 'backup', 'api', 'database'];
const actions = [
  'User login',
  'User logout', 
  'RFID card scan',
  'Attendance marked',
  'Database query',
  'Backup created',
  'Backup restored',
  'System check',
  'Error occurred',
  'Security alert',
  'Password reset',
  'Account locked',
  'File uploaded',
  'Email sent',
  'API request'
];

const userEmails = [
  'admin@icct.edu.ph',
  'teacher1@icct.edu.ph',
  'teacher2@icct.edu.ph',
  'student1@student.icct.edu.ph',
  'student2@student.icct.edu.ph',
  'parent1@parent.icct.edu.ph',
  'parent2@parent.icct.edu.ph'
];

const ipAddresses = [
  '192.168.1.100',
  '192.168.1.101', 
  '192.168.1.102',
  '10.0.0.50',
  '10.0.0.51',
  '172.16.0.10',
  '172.16.0.11'
];

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
  const hoursAgo = Math.floor(Math.random() * 24);
  const minutesAgo = Math.floor(Math.random() * 60);
  
  return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (hoursAgo * 60 * 60 * 1000) - (minutesAgo * 60 * 1000));
}

async function seedLogs() {
  try {
    console.log('🌱 Seeding log data...');

    // Generate System Logs
    const systemLogs = [];
    for (let i = 0; i < 100; i++) {
      systemLogs.push({
        timestamp: getRandomDate(),
        level: getRandomElement(logLevels),
        module: getRandomElement(modules),
        action: getRandomElement(actions),
        userId: Math.floor(Math.random() * 1000) + 1,
        userEmail: getRandomElement(userEmails),
        ipAddress: getRandomElement(ipAddresses),
        userAgent: getRandomElement(userAgents),
        details: `System log entry ${i + 1} - ${getRandomElement(actions)} performed`,
        severity: getRandomElement(logLevels),
        eventType: 'SYSTEM_EVENT',
        resolved: Math.random() > 0.3,
        message: `System operation: ${getRandomElement(actions)}`
      });
    }

    // Generate Security Logs
    const securityLogs = [];
    for (let i = 0; i < 80; i++) {
      securityLogs.push({
        timestamp: getRandomDate(),
        level: getRandomElement(['INFO', 'WARNING', 'ERROR', 'CRITICAL']),
        module: 'auth',
        action: getRandomElement(['Login attempt', 'Password change', 'Account lockout', 'Security scan', 'Permission denied']),
        userId: Math.floor(Math.random() * 1000) + 1,
        userEmail: getRandomElement(userEmails),
        ipAddress: getRandomElement(ipAddresses),
        userAgent: getRandomElement(userAgents),
        details: `Security event ${i + 1} - ${getRandomElement(['Login attempt', 'Password change', 'Account lockout'])}`,
        severity: getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        eventType: 'SECURITY_EVENT',
        resolved: Math.random() > 0.2,
        message: `Security operation: ${getRandomElement(['Login attempt', 'Password change', 'Account lockout'])}`
      });
    }

    // Generate RFID Logs
    const rfidLogs = [];
    for (let i = 0; i < 120; i++) {
      rfidLogs.push({
        timestamp: getRandomDate(),
        level: getRandomElement(['INFO', 'WARNING', 'ERROR']),
        module: 'rfid',
        action: getRandomElement(['RFID scan', 'Card registered', 'Card deactivated', 'Attendance marked', 'Invalid card']),
        userId: Math.floor(Math.random() * 1000) + 1,
        userEmail: getRandomElement(userEmails),
        ipAddress: getRandomElement(ipAddresses),
        userAgent: 'RFID Scanner Device',
        details: `RFID operation ${i + 1} - Card scan performed`,
        severity: getRandomElement(['LOW', 'MEDIUM', 'HIGH']),
        eventType: 'RFID_EVENT',
        resolved: Math.random() > 0.1,
        message: `RFID scan: ${getRandomElement(['Card registered', 'Card deactivated', 'Attendance marked'])}`
      });
    }

    // Generate Backup Logs
    const backupLogs = [];
    for (let i = 0; i < 60; i++) {
      backupLogs.push({
        timestamp: getRandomDate(),
        level: getRandomElement(['INFO', 'WARNING', 'ERROR']),
        module: 'backup',
        action: getRandomElement(['Backup created', 'Backup restored', 'Backup failed', 'Backup scheduled', 'Backup completed']),
        userId: Math.floor(Math.random() * 1000) + 1,
        userEmail: getRandomElement(userEmails),
        ipAddress: getRandomElement(ipAddresses),
        userAgent: 'Backup System',
        details: `Backup operation ${i + 1} - ${getRandomElement(['Backup created', 'Backup restored', 'Backup failed'])}`,
        severity: getRandomElement(['LOW', 'MEDIUM', 'HIGH']),
        eventType: 'BACKUP_EVENT',
        resolved: Math.random() > 0.15,
        message: `Backup operation: ${getRandomElement(['Backup created', 'Backup restored', 'Backup failed'])}`
      });
    }

    // Insert all logs
    await prisma.systemLog.createMany({ data: systemLogs });
    console.log('✅ System logs created');

    await prisma.securityLog.createMany({ data: securityLogs });
    console.log('✅ Security logs created');

    await prisma.rfidLog.createMany({ data: rfidLogs });
    console.log('✅ RFID logs created');

    await prisma.backupSystemLog.createMany({ data: backupLogs });
    console.log('✅ Backup logs created');

    console.log('🎉 All log data seeded successfully!');
    console.log(`📊 Total logs created: ${systemLogs.length + securityLogs.length + rfidLogs.length + backupLogs.length}`);

  } catch (error) {
    console.error('❌ Error seeding logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLogs();

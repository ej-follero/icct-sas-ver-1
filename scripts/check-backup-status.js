const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBackupStatus() {
  try {
    console.log('Checking backup status...');
    
    await prisma.$connect();
    
    // Check for stuck backups (IN_PROGRESS for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const stuckBackups = await prisma.systemBackup.findMany({
      where: {
        status: 'IN_PROGRESS',
        createdAt: {
          lt: oneHourAgo
        }
      }
    });
    
    console.log(`Found ${stuckBackups.length} stuck backups`);
    
    if (stuckBackups.length > 0) {
      console.log('Stuck backups:');
      stuckBackups.forEach(backup => {
        console.log(`- ID: ${backup.id}, Name: ${backup.name}, Created: ${backup.createdAt}`);
      });
      
      // Update stuck backups to FAILED
      const updateResult = await prisma.systemBackup.updateMany({
        where: {
          status: 'IN_PROGRESS',
          createdAt: {
            lt: oneHourAgo
          }
        },
        data: {
          status: 'FAILED',
          errorMessage: 'Backup stuck - automatically marked as failed',
          completedAt: new Date()
        }
      });
      
      console.log(`Updated ${updateResult.count} stuck backups to FAILED`);
    }
    
    // Get all backups
    const allBackups = await prisma.systemBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\nRecent backups:');
    allBackups.forEach(backup => {
      console.log(`- ID: ${backup.id}, Name: ${backup.name}, Status: ${backup.status}, Created: ${backup.createdAt}`);
    });
    
  } catch (error) {
    console.error('Error checking backup status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBackupStatus(); 
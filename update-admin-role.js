const { PrismaClient } = require('@prisma/client');

async function updateAdminRole() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Updating admin user role...');
    
    const updatedUser = await prisma.user.update({
      where: {
        email: 'admin@globetrotter.com'
      },
      data: {
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user role updated successfully:');
    console.log(`- ID: ${updatedUser.id}`);
    console.log(`- Name: ${updatedUser.name}`);
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- Role: ${updatedUser.role}`);
    console.log(`- Updated: ${updatedUser.updatedAt}`);
    
  } catch (error) {
    console.error('❌ Error updating admin user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminRole();

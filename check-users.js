const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    
    console.log('Users in database:')
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`)
    })
    
    const adminUsers = users.filter(u => u.role === 'ADMIN')
    console.log(`\nAdmin users found: ${adminUsers.length}`)
    
    if (adminUsers.length === 0) {
      console.log('No admin users found! This might be the issue.')
    }
    
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()

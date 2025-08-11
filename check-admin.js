const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdminUser() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@globetrotter.com' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })
    
    if (adminUser) {
      console.log('✅ Admin user found in database:')
      console.log('- ID:', adminUser.id)
      console.log('- Name:', adminUser.name)
      console.log('- Email:', adminUser.email)
      console.log('- Role:', adminUser.role)
      console.log('- Created:', adminUser.createdAt)
    } else {
      console.log('❌ Admin user NOT found in database!')
      console.log('Creating admin user...')
      
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash('password123', 12)
      
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: 'admin@globetrotter.com',
          password: hashedPassword,
          role: 'ADMIN',
        }
      })
      
      console.log('✅ Admin user created:', newAdmin.email, 'Role:', newAdmin.role)
    }
    
  } catch (error) {
    console.error('Error checking admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdminUser()

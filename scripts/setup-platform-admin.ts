// scripts/make-other-admin.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function switchPlatformAdmin() {
  try {
    // First, reset the current admin back to USER
    const currentAdmin = await prisma.user.findFirst({
      where: { platformRole: 'PLATFORM_ADMIN' },
    });

    if (currentAdmin) {
      console.log(`🔄 Resetting ${currentAdmin.email} to USER role...`);
      await prisma.user.update({
        where: { id: currentAdmin.id },
        data: { platformRole: 'USER' },
      });
      console.log(`✅ ${currentAdmin.email} is now USER`);
    }

    // Now make kelvinndomamutua@gmail.com the Platform Admin
    const newAdminEmail = 'kelvinndomamutua@gmail.com';
    const newAdmin = await prisma.user.findUnique({
      where: { email: newAdminEmail },
    });

    if (!newAdmin) {
      console.log(`❌ User ${newAdminEmail} not found`);
      return;
    }

    console.log(`\n🚀 Making ${newAdminEmail} Platform Admin...`);
    const updatedUser = await prisma.user.update({
      where: { email: newAdminEmail },
      data: { platformRole: 'PLATFORM_ADMIN' },
    });
    
    console.log(`✅ Success! ${updatedUser.email} is now Platform Admin`);

    // Verify
    const allUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        platformRole: true,
      },
      orderBy: { email: 'asc' },
    });

    console.log('\n📋 Final User Roles:');
    console.log('=' .repeat(40));
    allUsers.forEach((user, index) => {
      const roleBadge = user.platformRole === 'PLATFORM_ADMIN' ? '👑 PLATFORM_ADMIN' : '👤 USER';
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${roleBadge}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

switchPlatformAdmin();
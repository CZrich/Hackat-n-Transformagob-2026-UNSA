import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updatePassword() {
  const email = 'odeeg@unsa.edu.pe';
  const password = 'PasswordUnsa123!';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log(`Successfully updated password for ${email}`);
  } catch (err) {
    console.error('Error updating password:', err);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();

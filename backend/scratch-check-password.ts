import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'odeeg@unsa.edu.pe' }
  });
  if (!user) {
    console.log('User not found!');
    return;
  }
  console.log('User found:', user.email);
  console.log('Hash in DB:', user.password);
  
  const matches = await bcrypt.compare('admin123', user.password || '');
  console.log('Does "admin123" match?', matches);
}
main().catch(console.error).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'odeeg@unsa.edu.pe';
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    await prisma.user.update({
      where: { email: adminEmail },
      data: { password: hashedPassword },
    });
    console.log('Admin ODEEG ya existe, contraseña actualizada a formato hasheado.');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Administrador ODEEG',
      role: 'ADMIN',
      password: hashedPassword,
      telefono: '958473621',
      skills: [],
    },
  });

  console.log(`Admin ODEEG creado: ${admin.email} (password: admin123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

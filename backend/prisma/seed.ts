import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'odeeg@unsa.edu.pe';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log('Admin ODEEG ya existe, saltando seed.');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'Administrador ODEEG',
      role: 'ADMIN',
      password: 'admin123',
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

import { PrismaClient, JobStatus, ApplicationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Reading seed data...');
  const seedDataPath = path.join(__dirname, '../../seed-data.json');
  const rawData = fs.readFileSync(seedDataPath, 'utf8');
  const data = JSON.parse(rawData);

  console.log('Cleaning existing data (due to constraints, better to just push --force-reset but we clear if needed)...');
  // Since we are going to run `npx prisma db push --force-reset`, the database will be entirely empty.
  // No manual deletion needed if we use --force-reset. But let's add it just in case this is run on an existing db.
  await prisma.application.deleteMany();
  await prisma.companyRating.deleteMany();
  await prisma.job.deleteMany();
  await prisma.event.deleteMany();
  await prisma.company.deleteMany();
  await prisma.graduateProfile.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('123456', 10);

  // 1. Create Admin
  console.log('Seeding Admin...');
  const adminUser = await prisma.user.create({
    data: {
      email: data.admin.email,
      name: data.admin.name,
      role: data.admin.role,
      password: defaultPassword,
    }
  });

  // 2. Create Empleadores + Company
  console.log('Seeding Employers...');
  const employerMap = new Map(); // email -> id
  const companyMap = new Map(); // email -> company.id
  
  for (const emp of data.empleadores) {
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        name: emp.name,
        role: emp.role,
        password: defaultPassword,
        company: {
          create: {
            ruc: emp.company.ruc,
            name: emp.company.name,
            rubro: emp.company.rubro,
            direccion: emp.company.direccion,
            horario: emp.company.horario,
            contacto_telefono: emp.company.contacto_telefono,
            contacto_email: emp.company.contacto_email,
            es_verificada: emp.company.es_verificada,
            es_baneada: emp.company.es_baneada,
            rating_promedio: emp.company.rating_promedio,
            total_votos: emp.company.total_votos,
          }
        }
      },
      include: { company: true }
    });
    employerMap.set(emp.email, user.id);
    companyMap.set(emp.email, user.company!.id);
  }

  // 3. Create Egresados + GraduateProfile
  console.log('Seeding Graduates...');
  const graduateMap = new Map(); // email -> id
  for (const eg of data.egresados) {
    const user = await prisma.user.create({
      data: {
        email: eg.email,
        name: eg.name,
        role: eg.role,
        password: defaultPassword,
        profile: {
          create: {
            carrera: eg.profile.carrera,
            telefono: eg.profile.telefono,
            skills: eg.profile.skills,
            cv_url: eg.profile.cv_url,
            cv_name: eg.profile.cv_name,
            bio: eg.profile.bio,
            summary: eg.profile.summary,
            education: eg.profile.education,
            experience: eg.profile.experience,
            certifications: eg.profile.certifications,
            languages: eg.profile.languages,
            linkedin_url: eg.profile.linkedin_url,
            portfolio_url: eg.profile.portfolio_url,
          }
        }
      }
    });
    graduateMap.set(eg.email, user.id);
  }

  // 4. Create Jobs
  console.log('Seeding Jobs...');
  const jobMap = new Map(); // internal_id -> db_id
  for (const j of data.jobs) {
    const companyId = companyMap.get(j.employer_email);
    const userId = employerMap.get(j.employer_email);
    
    if (!companyId || !userId) continue;

    const job = await prisma.job.create({
      data: {
        title: j.title,
        description: j.description,
        company_id: companyId,
        created_by_id: userId,
        carrera_destino: j.carrera_destino,
        salario_min: j.salario_min,
        salario_max: j.salario_max,
        fecha_inicio: new Date(j.fecha_inicio),
        fecha_fin: new Date(j.fecha_fin),
        lugar: j.lugar,
        horario: j.horario,
        perfil: j.perfil,
        cantidad_req: j.cantidad_req,
        requisitos: j.requisitos,
        funciones: j.funciones,
        competencias: j.competencias,
        status: j.status as JobStatus,
      }
    });
    jobMap.set(j._id, job.id);
  }

  // 5. Create Applications
  console.log('Seeding Applications...');
  for (const app of data.applications) {
    const userId = graduateMap.get(app.applicant_email);
    const jobId = jobMap.get(app.job_internal_id);
    
    if (!userId || !jobId) continue;

    await prisma.application.create({
      data: {
        userId: userId,
        jobId: jobId,
        status: app.status as ApplicationStatus,
      }
    });
  }

  // 6. Create Events
  console.log('Seeding Events...');
  for (const ev of data.events) {
    await prisma.event.create({
      data: {
        title: ev.title,
        description: ev.description,
        type: ev.type as any,
        date: new Date(ev.date),
        location: ev.location,
        link: ev.link,
        image_url: ev.image_url,
        created_by: adminUser.id,
      }
    });
  }

  console.log('Database seeded perfectly!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

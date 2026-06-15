# Conecta UNSA

Plataforma full-stack para emparejar egresados de la Universidad Nacional de San Agustín (UNSA) con ofertas laborales verificadas por la ODEEG.

## Arquitectura

Monorepo con **pnpm workspaces** compuesto por:

| Carpeta | Tecnología | Puerto |
|---------|-----------|--------|
| `frontend/` | React 18 + TypeScript + Vite + Tailwind CSS | 5173 |
| `backend/` | NestJS + TypeScript + Prisma ORM + Supabase PostgreSQL | 3000 |

El frontend proxyye `/api` hacia `http://localhost:3000` mediante Vite.

## Roles de usuario

- **EGRESADO** — Visualiza ofertas aprobadas, simula entrevistas con IA.
- **EMPLEADOR** — Gestiona su empresa y crea ofertas laborales (requiere verificación de ODEEG).
- **ADMIN** — Modera ofertas (`PENDING → APPROVED/REJECTED`) y verifica empresas.

## Requisitos

- Node.js >= 18
- pnpm >= 8

## Instalación y ejecución

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Editar backend/.env con DATABASE_URL, JWT keys, etc.

# 3. Generar claves RSA para JWT (si no existen)
cd backend && mkdir -p keys && openssl genrsa -out keys/private.pem 2048 && openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# 4. Migrar base de datos
cd backend && npx prisma db push

# 5. Sembrar admin ODEEG (opcional)
cd backend && npx prisma db seed

# 6. Iniciar en desarrollo (backend + frontend)
pnpm dev
```

O por separado:

```bash
pnpm dev:backend   # solo backend en http://localhost:3000
pnpm dev:frontend  # solo frontend en http://localhost:5173
```

## Autenticación

- **JWT asimétrico RS256** con claves RSA de 2048 bits.
- Passwords hasheados con **bcryptjs** (10 rounds).
- Login con Google OAuth 2.0 (`@react-oauth/google` + `google-auth-library`).

## API endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login email/password |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/google-login` | Login con Google |
| GET | `/api/jobs/match` | Ofertas aprobadas por carrera (egresado) |
| GET | `/api/jobs/pending` | Ofertas pendientes (admin) |
| GET | `/api/jobs/my` | Ofertas de mi empresa (empleador) |
| POST | `/api/jobs` | Crear oferta (empleador) |
| PATCH | `/api/jobs/:id/status` | Moderar oferta (admin) |
| GET | `/api/admin/companies` | Listar empresas (admin) |
| PATCH | `/api/admin/companies/:id/verify` | Verificar empresa (admin) |
| POST | `/api/ai/simulate-interview` | Simulacro de entrevista con IA |

## Base de datos

- **Supabase PostgreSQL** vía Prisma ORM.
- Modelos principales: `User`, `Company` (relación 1:1 con User), `Job`.

### Seed de administrador

```bash
cd backend && npx prisma db seed
```

Usuario por defecto: `odeeg@unsa.edu.pe` / `admin123`

## Licencia

Uso interno — Universidad Nacional de San Agustín (UNSA)

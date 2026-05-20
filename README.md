# AssessHub - Internal MCQ Assessment Platform

A full-stack role-based MCQ testing platform with Spring Boot backend and React frontend.

## Tech Stack

### Backend
- Java 21, Spring Boot 3.2
- Spring Security + JWT Authentication + 2FA (Email OTP)
- MySQL + JPA/Hibernate
- Lombok, BCrypt, JavaMailSender

### Frontend
- React 18 + Vite
- Tailwind CSS v4
- React Router, Axios, React Hook Form + Zod
- Lucide Icons, React Hot Toast

## Prerequisites

- Java 21+
- Maven 3.8+
- Node.js 18+
- Docker (optional, for running MySQL locally)

## Setup

For EC2 production deployment, follow [`deployment/EC2_DEPLOYMENT.md`](deployment/EC2_DEPLOYMENT.md).

### 1. Database

**Option A: Docker (quick start)**
```bash
docker compose up -d db
```
This starts MySQL 8 with database `assessment_platform` on `localhost:3306` and persists data in a named volume.

**Option B: Manual MySQL**
```sql
CREATE DATABASE assessment_platform;
```

The backend picks up database credentials from environment variables with sensible defaults:
- `DB_URL` (default `jdbc:mysql://localhost:3306/assessment_platform?...`)
- `DB_USERNAME` (default `root`)
- `DB_PASSWORD` (default `12345678`)

### 2. Backend
```bash
cd backend

# Update .env / environment variables if you don't want the defaults
# MAIL_USERNAME / MAIL_PASSWORD are needed for OTP emails
# JWT_SECRET can override the default secret

./mvnw spring-boot:run
# Or: mvn spring-boot:run
```
Backend runs on: http://localhost:8080

Default admin: `admin@assessment.com` / `admin123`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

## Seeded Data

On startup, the backend seeds:
- **5 Teams**: Falconz, Beyonders, Eternals, La Masia's, Ariba
- **1 Admin user**: admin@assessment.com / admin123

## Roles
- **ADMIN** - Create tests, view submissions, release results, manage users
- **TRAINEE** / **INTERN** / **PPO** - Take assigned tests, view released results

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-otp`

### Admin
- `POST /api/admin/tests` - Create test
- `GET /api/admin/tests` - List all tests
- `GET /api/admin/tests/{id}/submissions` - View submissions
- `POST /api/admin/tests/{id}/release` - Release results
- `PUT /api/admin/users/{id}/role` - Change user role
- `GET /api/admin/users` - List all users
- `GET /api/admin/teams` - List all teams

### User
- `GET /api/tests` - Assigned tests
- `GET /api/tests/{id}` - Test details
- `POST /api/tests/{id}/submit` - Submit test
- `GET /api/results` - View results
# TEST-PLATFORM

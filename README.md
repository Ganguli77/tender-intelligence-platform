# Tender Intelligence Platform

Full-stack tender intelligence app with a Vite React frontend and Spring Boot backend.

## Run Locally

Backend:

```bash
cd src/backend
mvnw.cmd spring-boot:run
```

Frontend:

```bash
npm.cmd run dev
```

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8081/api`

Seeded admin login:

- Username: `admin`
- Password: `admin123`

## Checks

```bash
npm.cmd run lint
npm.cmd run build
cd src/backend
mvnw.cmd test
```

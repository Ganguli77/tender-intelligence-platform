# Tender Intelligence Platform

Full-stack tender intelligence app with a Vite React frontend and Spring Boot backend.

## Run Locally

Backend:

```bash
cd backend
mvnw.cmd spring-boot:run
```

Frontend:

```bash
cd frontend
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
cd frontend
npm.cmd run lint
npm.cmd run build
cd ../backend
mvnw.cmd test
```

## Deploy to Railway

The frontend and backend are separate Docker services. The frontend serves the Vite build and proxies `/api` to the backend over Railway's private network. Add this repository to a Railway project and create these services in the same environment:

1. Add a MySQL database service named `MySQL`.
2. Add a backend service from this repository with its root directory set to `/backend`. Set these variables:

	```text
	SPRING_DATASOURCE_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
	SPRING_DATASOURCE_DRIVER=com.mysql.cj.jdbc.Driver
	SPRING_DATASOURCE_USERNAME=${{MySQL.MYSQLUSER}}
	SPRING_DATASOURCE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
	SPRING_JPA_HIBERNATE_DDL_AUTO=update
	APP_SEED_DATA=false
	JWT_SECRET=<a unique, randomly generated secret>
	```

	`APP_SEED_DATA=false` prevents demo accounts and tenders from being created. Public registration always creates a regular user. To provision the first administrator, register the intended account normally, then run this query in Railway's MySQL console, replacing the email with that account's address:

	```sql
	UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
	```

	Keep `OPENAI_API_KEY` optional unless AI features should be enabled. For Google sign-in, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the backend, and set `VITE_GOOGLE_CLIENT_ID` as a frontend build variable before deploying.
3. Add a frontend service from this repository with its root directory set to `/frontend`. Set `BACKEND_URL` to `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}`, using the exact Railway service name `backend`.
4. Generate a public domain for the frontend service. The frontend service is the public entry point; the backend only needs private networking enabled.

Leave `VITE_API_BASE_URL` unset on the frontend service so requests use the same-origin `/api` proxy. Railway supplies `PORT` to both containers. After deployment, verify the frontend domain loads and its login/API requests reach the backend.

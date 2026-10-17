# Tender Intelligence Platform

Full-stack tender intelligence app with a Vite React frontend and Spring Boot backend.

## Run Locally

In VS Code, run **Tasks: Run Task → Start Local App** to start both services in
separate integrated terminals. The task uses fixed local ports and displays
startup errors in the terminal that owns each service.

To start them manually, use separate terminals:

```powershell
cd backend; powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\run-local.ps1
cd frontend; npm.cmd run dev
```

The frontend is pinned to port `5173` and will report an error if that port is
already occupied rather than silently switching ports. The backend defaults to
port `8081`. Local backend runs use a separate persistent database at
`backend/data/tender-ai-local`; the previous local database is left untouched.
Stop each service with `Ctrl+C` in its terminal.

Local URLs:

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
	APP_CORS_ALLOWED_ORIGINS=https://ideal-surprise-production-7932.up.railway.app,https://nextender.com,https://www.nextender.com
	```

	`APP_SEED_DATA=false` prevents demo accounts and tenders from being created. Public registration always creates a regular user. To provision the first administrator, register the intended account normally, then run this query in Railway's MySQL console, replacing the email with that account's address:

	```sql
	UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';
	```

	Keep `OPENAI_API_KEY` optional unless AI features should be enabled. For Google sign-in, create a Web application OAuth client in Google Cloud Console, add the frontend origins to its authorized JavaScript origins, then set `GOOGLE_CLIENT_ID` on the backend and `VITE_GOOGLE_CLIENT_ID` as a frontend build variable.

	Phone OTP sign-in uses Firebase Authentication. In Firebase Console, add a Web app and copy its `apiKey`, `authDomain`, `projectId`, and `appId` into the frontend build variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. Enable Phone as a sign-in provider under Authentication, configure allowed domains and SMS regions, and set the same web API key as the backend variable `FIREBASE_WEB_API_KEY`. Phone numbers must use E.164 format (for example, `+14155552671`). Do not commit private service-account credentials; Firebase's web API key is a public project identifier, and the backend uses it to validate Firebase phone ID tokens.
3. Add a frontend service from this repository with its root directory set to `/frontend`. Set `BACKEND_URL` to `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}`, using the exact Railway service name `backend`.
4. Generate a public domain for the frontend service. The frontend service is the public entry point; the backend only needs private networking enabled.

Leave `VITE_API_BASE_URL` unset on the frontend service so requests use the same-origin `/api` proxy. If the API is hosted separately and called directly by the browser, set `VITE_API_BASE_URL` to that API's `/api` URL and add the frontend origin to `APP_CORS_ALLOWED_ORIGINS`. Railway supplies `PORT` to both containers. After deployment, verify the frontend domain loads and its login/API requests reach the backend.

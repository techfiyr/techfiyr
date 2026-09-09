# TechFiyr website CMS

The original static pages are now served by a Java 21 / Spring Boot / Thymeleaf application. PostgreSQL stores the editable page source, users, uploaded-media metadata, and contact messages.

## Start with Docker

1. Copy `.env.example` to `.env` and replace every example password.
2. Run:

   ```bash
   docker compose up --build
   ```

3. Open [http://localhost:8001](http://localhost:8001). Admin and employee login is available directly at [http://localhost:8001/login](http://localhost:8001/login); login/dashboard buttons are intentionally not shown on public pages.

The first startup imports the six root HTML files into PostgreSQL and creates the configured admin and employee accounts. Later application restarts preserve all CMS edits. The original files remain available as reset sources from the page editor.

## Login and permissions

- `/login` accepts both account types and redirects by role.
- `ADMIN` users can edit website content, upload images, read contact submissions, and manage users.
- `EMPLOYEE` users can access `/employee` but cannot access `/admin`.

Without a `.env` file, the development-only defaults are `admin / ChangeMe123!` and `employee / Employee123!`. Change them before any shared or production deployment. Bootstrap passwords create missing users; they do not overwrite passwords already stored in PostgreSQL.

## Editing website content

Open **Admin → Website content**, select a page, and search or filter the detected fields. The editor exposes:

- visible text and numeric values;
- headings, paragraphs, buttons, labels, and metadata;
- image paths, responsive image paths, image descriptions, and CSS background-image paths;
- navigation and social links;
- form placeholders/values, accessibility labels, counter/progress values, and launch timing values.

Existing database pages are upgraded automatically when new editable content types are introduced. This preserves prior admin changes while adding missing controls.

Text is written back as text rather than executable HTML, and editable URLs reject script/data schemes. To replace an image, upload it in **Media library**, copy its `/uploads/...` path, and paste that into the page’s image field.

## Local development

Make sure Docker Desktop is running, then start the application from IntelliJ or with Maven:

```bash
mvn spring-boot:run
```

Spring Boot uses `compose.local.yml` to start PostgreSQL automatically and waits for it before Flyway runs. The database stays running after the application stops. If you prefer to manage it yourself, set `SPRING_DOCKER_COMPOSE_ENABLED=false` and start the `db` service from `compose.yml` before launching the app.

Run tests with `mvn test`.

## Important files

- `compose.yml` — application and PostgreSQL services
- `compose.local.yml` — PostgreSQL service automatically started for IDE/Maven development
- `src/main/resources/db/migration/` — database migrations
- `src/main/java/com/techfiyr/cms/` — generic field-based CMS
- `src/main/java/com/techfiyr/config/SecurityConfig.java` — access rules
- `src/main/resources/templates/admin/` — administration UI
- root `*.html` files — initial/reset source pages

Database content is stored in the `postgres_data` Docker volume and uploaded images in `uploaded_media`.

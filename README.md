# Task Manager API

## A RESTful Task Management API built with **Laravel 12** and **MySQL**, featuring token-based authentication via Laravel Sanctum, full CRUD operations with soft deletes, filtering, pagination, and a vanilla JavaScript browser frontend.

## Tech Stack

| Layer             | Technology                    |
| ----------------- | ----------------------------- |
| Backend Framework | Laravel 12 (PHP 8.2)          |
| Database          | MySQL                         |
| Authentication    | Laravel Sanctum (token-based) |
| Frontend          | Vanilla HTML, CSS, JavaScript |
| Local Server      | XAMPP (Apache + MySQL)        |

---

## Features

- User registration and login with secure token-based authentication
- Full task CRUD including create, read, update, and delete
- Soft deletes with restore functionality (data is preserved, never permanently removed)
- Filter tasks by status (`pending`, `in-progress`, `completed`)
- Search tasks by title keyword
- Filter tasks by due date
- Pagination (10 tasks per page)
- Users can only access and manage their own tasks
- Browser-based frontend that fully consumes the API

---

## Prerequisites

Make sure the following are installed before proceeding:

- PHP 8.2+
- Composer 2.x
- MySQL (via XAMPP or standalone)
- Git

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/farwiinm/task-manager.git
cd task-manager
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Copy the environment file

```bash
cp .env.example .env
```

### 4. Generate the application key

```bash
php artisan key:generate
```

> This generates a unique `APP_KEY` value in your `.env` file. Laravel uses this for encryption. The project will not run correctly without it.

### 5. Configure your database

Open `.env` and update the following values to match your local MySQL setup:

```
DB_DATABASE=task_manager
DB_USERNAME=root
DB_PASSWORD=
```

Then create the database in MySQL. If you are using XAMPP, open `http://localhost/phpmyadmin`, click **New** in the sidebar, name it `task_manager`, and click **Create**.

Alternatively, via the MySQL CLI:

```sql
CREATE DATABASE task_manager;
```

### 6. Run database migrations

```bash
php artisan migrate
```

This creates all required tables: `users`, `personal_access_tokens`, `tasks`, and supporting Laravel tables.

### 7. Start the development server

```bash
php artisan serve
```

The application will be available at:

```
http://127.0.0.1:8000
```

- **Browser frontend:** `http://127.0.0.1:8000`
- **API base URL:** `http://127.0.0.1:8000/api`

> Keep this terminal window open while using the application. Closing it stops the server.

---

## Environment Variables

All environment variables are defined in `.env`. Copy `.env.example` to `.env` and fill in the values below.

| Variable                   | Description                                                       | Example Value               |
| -------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `APP_NAME`                 | Application name shown in logs                                    | `TaskManager`               |
| `APP_ENV`                  | Environment mode                                                  | `local`                     |
| `APP_KEY`                  | Laravel encryption key — generated via `php artisan key:generate` | _(auto-generated)_          |
| `APP_DEBUG`                | Show detailed error messages                                      | `true`                      |
| `APP_URL`                  | Base URL of the application                                       | `http://localhost`          |
| `DB_CONNECTION`            | Database driver                                                   | `mysql`                     |
| `DB_HOST`                  | Database host                                                     | `127.0.0.1`                 |
| `DB_PORT`                  | Database port                                                     | `3306`                      |
| `DB_DATABASE`              | Name of the MySQL database                                        | `task_manager`              |
| `DB_USERNAME`              | MySQL username                                                    | `root`                      |
| `DB_PASSWORD`              | MySQL password                                                    | _(blank for XAMPP default)_ |
| `SANCTUM_STATEFUL_DOMAINS` | Domains allowed for Sanctum auth                                  | `localhost`                 |

---

## Project Structure

```
task-manager/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php      — registration, login, logout
│   │       └── TaskController.php      — full task CRUD, soft delete, restore
│   └── Models/
│       ├── User.php                    — user model with Sanctum token support
│       └── Task.php                    — task model with soft delete support
├── database/
│   └── migrations/                     — database table definitions
├── routes/
│   └── api.php                         — all API route definitions
├── public/
│   ├── index.html                      — browser frontend entry point
│   ├── style.css                       — frontend styles
│   └── app.js                          — frontend JavaScript
├── .env.example                        — environment variable template
└── README.md
```

---

## API Documentation

All API routes are prefixed with `/api`.

Protected routes require a valid Bearer token in the `Authorization` header:

```
Authorization: Bearer {your_token_here}
```

---

### Authentication Endpoints

#### Register a new user

```
POST /api/register
```

**Request body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Validation rules:**

- `name` — required, string
- `email` — required, valid email format, must be unique
- `password` — required, minimum 8 characters, must match `password_confirmation`

**Success response `201`:**

```json
{
    "message": "Registration successful",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    "token": "1|abc123xyz..."
}
```

---

#### Login

```
POST /api/login
```

**Request body:**

```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Success response `200`:**

```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
    },
    "token": "2|xyz789abc..."
}
```

**Failed response `401`:**

```json
{
    "message": "Invalid credentials"
}
```

> Each login invalidates all previous tokens for that user and issues a fresh one.

---

#### Logout

```
POST /api/logout
```

**Requires:** `Authorization: Bearer {token}`

**Success response `200`:**

```json
{
    "message": "Logged out successfully"
}
```

> The current token is immediately invalidated. Subsequent requests using the same token will receive a `401 Unauthenticated` response.

---

### Task Endpoints

All task endpoints require `Authorization: Bearer {token}`. Users can only access their own tasks.

---

#### List all tasks

```
GET /api/tasks
```

**Query parameters (all optional):**

| Parameter  | Type    | Description                                                |
| ---------- | ------- | ---------------------------------------------------------- |
| `status`   | string  | Filter by status: `pending`, `in-progress`, or `completed` |
| `search`   | string  | Search tasks by title keyword (partial match)              |
| `due_date` | date    | Filter by exact due date (`YYYY-MM-DD`)                    |
| `page`     | integer | Page number for pagination (default: `1`)                  |

**Example requests:**

```
GET /api/tasks
GET /api/tasks?status=pending
GET /api/tasks?search=API
GET /api/tasks?status=in-progress&page=2
```

**Success response `200`:**

```json
{
    "current_page": 1,
    "data": [
        {
            "id": 1,
            "user_id": 1,
            "title": "Build the API",
            "description": "Complete the task management REST API",
            "status": "in-progress",
            "due_date": "2025-12-31",
            "created_at": "2026-03-05T10:00:00.000000Z",
            "updated_at": "2026-03-05T10:00:00.000000Z",
            "deleted_at": null
        }
    ],
    "per_page": 10,
    "total": 1,
    "last_page": 1,
    "next_page_url": null,
    "prev_page_url": null
}
```

---

#### Create a task

```
POST /api/tasks
```

**Requires:** `Authorization: Bearer {token}`

**Request body:**

```json
{
    "title": "Build the API",
    "description": "Complete the task management REST API",
    "status": "in-progress",
    "due_date": "2025-12-31"
}
```

**Validation rules:**

- `title` — required, string, max 255 characters
- `description` — optional, string
- `status` — optional, must be one of: `pending`, `in-progress`, `completed` (defaults to `pending`)
- `due_date` — optional, valid date format (`YYYY-MM-DD`)

**Success response `201`:**

```json
{
    "message": "Task created successfully",
    "task": {
        "id": 1,
        "user_id": 1,
        "title": "Build the API",
        "status": "in-progress",
        "due_date": "2025-12-31",
        "created_at": "2026-03-05T10:00:00.000000Z",
        "updated_at": "2026-03-05T10:00:00.000000Z"
    }
}
```

---

#### Get a single task

```
GET /api/tasks/{id}
```

**Requires:** `Authorization: Bearer {token}`

**Success response `200`:**

```json
{
    "id": 1,
    "user_id": 1,
    "title": "Build the API",
    "description": "Complete the task management REST API",
    "status": "in-progress",
    "due_date": "2025-12-31",
    "created_at": "2026-03-05T10:00:00.000000Z",
    "updated_at": "2026-03-05T10:00:00.000000Z"
}
```

**Not found response `404`:**

```json
{
    "message": "Task not found"
}
```

---

#### Update a task

```
PUT /api/tasks/{id}
```

**Requires:** `Authorization: Bearer {token}`

All fields are optional — only send the fields you want to update.

**Request body:**

```json
{
    "title": "Updated title",
    "description": "Updated description",
    "status": "completed",
    "due_date": "2025-12-31"
}
```

**Success response `200`:**

```json
{
    "message": "Task updated successfully",
    "task": {
        "id": 1,
        "title": "Updated title",
        "status": "completed",
        ...
    }
}
```

---

#### Delete a task (soft delete)

```
DELETE /api/tasks/{id}
```

**Requires:** `Authorization: Bearer {token}`

The task is **not permanently removed**. A `deleted_at` timestamp is set. The task is hidden from the normal task list but can be viewed and restored from the trashed endpoint.

**Success response `200`:**

```json
{
    "message": "Task deleted successfully"
}
```

---

#### View deleted tasks

```
GET /api/tasks/trashed
```

**Requires:** `Authorization: Bearer {token}`

Returns a paginated list of all soft-deleted tasks belonging to the authenticated user.

**Success response `200`:**

```json
{
    "current_page": 1,
    "data": [
        {
            "id": 1,
            "title": "Build the API",
            "deleted_at": "2026-03-05T11:00:00.000000Z",
            ...
        }
    ],
    "total": 1
}
```

---

#### Restore a deleted task

```
POST /api/tasks/{id}/restore
```

**Requires:** `Authorization: Bearer {token}`

Clears the `deleted_at` timestamp, making the task visible in the normal task list again.

**Success response `200`:**

```json
{
    "message": "Task restored successfully",
    "task": {
        "id": 1,
        "title": "Build the API",
        "deleted_at": null,
        ...
    }
}
```

---

## HTTP Status Codes Used

| Code  | Meaning              | When used                                                |
| ----- | -------------------- | -------------------------------------------------------- |
| `200` | OK                   | Successful GET, PUT, DELETE, POST (non-creation)         |
| `201` | Created              | Successful resource creation (register, create task)     |
| `401` | Unauthorized         | Invalid credentials or missing/invalid token             |
| `404` | Not Found            | Task does not exist or belongs to another user           |
| `422` | Unprocessable Entity | Validation failed — response includes field-level errors |

---

## Assumptions Made

The following assumptions were made when requirements were ambiguous:

1. **Task ownership is strictly per user.** There is no concept of shared tasks, team tasks, or admin visibility. Each user can only see, edit, and delete their own tasks.

2. **Soft deletes only meaning no permanent deletion.** The DELETE endpoint performs a soft delete. No hard delete endpoint is provided, as preserving data for potential recovery was considered the safer default.

3. **One active token per user at a time.** When a user logs in, all previous tokens are invalidated before a new one is issued. This prevents token accumulation and reduces the surface area for session hijacking.

4. **Status values are fixed.** Task status is restricted to `pending`, `in-progress`, and `completed`. No custom or user-defined statuses are supported in this implementation.

5. **Pagination page size is fixed at 10.** The number of results per page is not configurable via query parameters. This can be made dynamic in a future iteration.

6. **Frontend is single-user per session.** The browser frontend stores the token in `localStorage` and does not support multi-tab concurrent sessions with different accounts.

7. **No email verification.** Users are immediately active after registration with no email confirmation step required.

---

## What I Would Add With More Time

- **Unit and feature tests** using PHPUnit and Laravel's testing utilities to verify each endpoint's behaviour
- **Role-based access control**, an admin role that can view and manage all users' tasks
- **Task priorities**, a `priority` field (low, medium, high) with filtering support
- **Hard delete endpoint**, permanent removal available to admin users only
- **Task categories or tags**, allowing users to organise tasks beyond status
- **Due date notifications**, email alerts when a task's due date is approaching
- **API rate limiting**, throttling to prevent abuse of endpoints
- **Configurable pagination**, allowing `?per_page=25` style parameters
- **Refresh token support**, automatic token renewal without requiring re-login

---

## Author

**Farwin M**

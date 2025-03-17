# Task and Project Management System

A web-based Task and Project Management System built with **React (Vite)** for the frontend, **Django (DRF)** for the backend, and **PostgreSQL** as the database.

## Features

- User authentication (Sign up, Login, Logout)
- Task and project creation, assignment, and tracking
- Role-based access control (Admin, Manager, Member)
- Comments and attachments for tasks
- Real-time updates using WebSockets
- Cloud storage integration for file uploads
- Responsive UI with Tailwind CSS

## Project Structure

```
task_project_management/
│── frontend/               # React (Vite) frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│── backend/                # Django backend
│   ├── task_management/
│   ├── tasks/
│   ├── users/
│   ├── manage.py
│   ├── requirements.txt
│── .gitignore
│── README.md
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PaulaMagdi0/task_project_management.git
```

### 2. Backend Setup (Django & PostgreSQL)

#### Install Dependencies:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Set up the Database:

```bash
python manage.py migrate
python manage.py createsuperuser  # Create an admin user
```

#### Run the Server:

```bash
python manage.py runserver
```

### 3. Frontend Setup (React + Vite)

#### Install Dependencies:

```bash
cd frontend
npm install
```

#### Run the Development Server:

```bash
npm run dev
```

## API Endpoints (Example)

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | `/api/tasks/`      | Get all tasks     |
| POST   | `/api/tasks/`      | Create a new task |
| GET    | `/api/tasks/{id}/` | Get task details  |
| PUT    | `/api/tasks/{id}/` | Update a task     |
| DELETE | `/api/tasks/{id}/` | Delete a task     |

## License

This project is open-source and available under the **MIT License**.

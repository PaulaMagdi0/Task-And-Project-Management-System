<div align="center">

# 📋 Task and Project Management System

### A modern full-stack productivity platform with real-time chat, task tracking, and project boards.

<p>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" />
</p>

<p>
  <a href="https://tasks-managment-system.vercel.app/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-2EA043?style=for-the-badge&labelColor=0D1117" alt="Live Demo" />
  </a>
</p>

</div>

---

## 🎯 What It Does

Streamlines team task and project management with real-time collaboration:

- 📋 **Visual project boards** with task tracking
- 💬 **Real-time chat** between team members (Django Channels + WebSockets)
- 🔍 **Filtering & sorting** by status, priority, due date
- 📱 **Responsive design** — desktop, tablet, mobile
- 🔐 **Secure auth** with JWT-based registration and login

<!-- Add a screenshot or GIF here:  ![Screenshot](docs/screenshot.png) -->

## 🚀 Features

- **User Authentication** — Secure registration and login (JWT)
- **Task Management** — Create, update, delete tasks with title, description, due date, priority
- **Project Overview** — Visual representation of tasks and projects for tracking
- **Real-time Chat** — Django Channels WebSocket messaging between team members
- **Filtering & Sorting** — Organize tasks by status, priority, or due date
- **Responsive UI** — Tailwind CSS-driven layouts optimized for every screen size

## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | React 18 · Vite · Tailwind CSS |
| **Backend** | Django · Django REST Framework · Django Channels |
| **Database** | PostgreSQL |
| **Auth** | JSON Web Tokens (JWT) |
| **Real-time** | WebSockets via Django Channels |
| **Deployment** | Vercel (frontend) · Railway (backend) |

## 🧠 What I Learned

Building this end-to-end taught me:

- **Real-time architecture** — combining REST for CRUD with WebSockets for live chat (Django Channels) without conflict
- **Multi-service deployment** — coordinating frontend (Vercel) and backend (Railway) with proper CORS, env vars, and SPA routing
- **JWT authentication patterns** — token issuance, refresh strategy, and secure storage across SPA boundaries
- **Database design for collaborative tools** — modeling many-to-many between users, projects, and tasks with proper indexing
- **Frontend state for live updates** — merging WebSocket events into React state without race conditions

## 🧑‍💻 Getting Started

### Prerequisites
- Python 3.9+ and pip
- PostgreSQL
- Node.js 18+ and npm

### Installation

```bash
# Clone
git clone https://github.com/PaulaMagdi0/Task-And-Project-Management-System.git
cd Task-And-Project-Management-System

# Frontend
cd frontend
npm install
npm run dev

# Backend (new terminal)
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
SECRET_KEY=your_django_secret_key
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_NAME=your_db_name
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

Then:

```bash
python manage.py migrate
python manage.py runserver
```

## 📂 Project Structure

```
├── frontend/    # React + Vite + Tailwind
├── backend/     # Django + DRF + Channels
└── README.md
```

## 📄 License

MIT — see [LICENSE](LICENSE).

## 📫 Contact

Built by **Paula Magdy** — [GitHub](https://github.com/PaulaMagdi0) · [LinkedIn](https://www.linkedin.com/in/paula-magdy/) · [Portfolio](https://paulamagdy.framer.website/)

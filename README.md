# Task and Project Management System

A modern, full-featured web application designed to streamline task and project management.
Built with a robust tech stack, it offers intuitive features for users and administrators to manage tasks efficiently.

## 🌐 Live Demo

Experience the application in action:

🔗 [https://tasks-managment-system.vercel.app/](https://tasks-managment-system.vercel.app/)

## 🚀 Features

- **User Authentication**: Secure login and registration system.
- **Task Management**: Create, update, and delete tasks with attributes like title, description, due date, and priority.
- **Project Overview**: Visual representation of tasks and projects for better tracking.
- **Filtering & Sorting**: Organize tasks based on status, priority, or due date.
- **Responsive Design**: Optimized for desktops, tablets, and mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Vite
- **Backend**: Python, Django, Django REST Framework
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **WebSockets**: Django Channels, Websocket (for real-time chat)
- **Deployment**: Vercel (frontend), Railway (backend)

## 🧑‍💻 Getting Started

### Prerequisites

- Python 3.9+ and pip
- PostgreSQL
- Websocket (for real-time features)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/PaulaMagdi0/Task-And-Project-Management-System.git
   cd Task-And-Project-Management-System
   ```

2. **Frontend Setup**:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Setup**:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

   Create a `.env` file in the backend directory with the following:

   ```env
   SECRET_KEY=your_django_secret_key
   ALLOWED_HOSTS=localhost,127.0.0.1
   DATABASE_NAME=your_db_name
   DATABASE_USER=your_db_user
   DATABASE_PASSWORD=your_db_password
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   ```

   Then apply migrations and run the server:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

## 📂 Project Structure

```plaintext
├── frontend/                 # React frontend
├── backend/                 # Django backend
└── README.md               # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature-name`.
3. Commit your changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature-name`.
5. Open a pull request.

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 📧 Contact

For any inquiries or feedback, please contact [Paula Magdi](mailto:paulamagdy665@gmail.com).

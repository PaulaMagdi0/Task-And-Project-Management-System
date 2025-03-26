
## Project Structure

```
tproject/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── project/                     # Main Django project folder
│   │   ├── _init_.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/                # User models (Supervisor, Instructor, Student)
│   │   │   ├── migrations/
│   │   │   ├── _init_.py
│   │   │   ├── models.py            # Base User and child models
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── tests.py
│   │   ├── tracks/                  # Track management (includes supervisor linkage)
│   │   │   ├── migrations/
│   │   │   ├── _init_.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── tests.py
│   │   ├── courses/                 # Course management (linking tracks and instructors)
│   │   │   ├── migrations/
│   │   │   ├── _init_.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── tests.py
│   │   ├── assignments/             # Assignment creation and management
│   │   │   ├── migrations/
│   │   │   ├── _init_.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   ├── urls.py
│   │   │   └── tests.py
│   │   └── grades/                  # Grading and feedback system
│   │       ├── migrations/
│   │       ├── _init_.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       ├── urls.py
│   │       └── tests.py
│   ├── utils/                       # Helper functions, utilities, custom permissions, etc.
│   │   └── helpers.py
│   └── docs/                        # Project documentation (architecture, setup guides, etc.)
│       └── architecture.md
│
├── frontend/
│   ├── package.json
│   ├── yarn.lock                    # (or package-lock.json if using npm)
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   └── src/
│       ├── index.js                 # Entry point for React
│       ├── App.js                   # Main App component
│       ├── App.css                  # Global styles
│       ├── components/              # Reusable UI components
│       │   ├── common/
│       │   │   └── LoadingSpinner.js
│       │   └── layout/
│       │       ├── Header.js
│       │       └── Footer.js
│       ├── pages/                   # Page-level components (views)
│       │   ├── Login.js
│       │   ├── Dashboard.js
│       │   ├── TrackManagement.js
│       │   ├── CourseManagement.js
│       │   ├── AssignmentManagement.js
│       │   └── GradeDashboard.js
│       ├── redux/                   # Redux setup
│       │   ├── actions/
│       │   │   ├── authActions.js
│       │   │   ├── trackActions.js
│       │   │   ├── courseActions.js
│       │   │   ├── assignmentActions.js
│       │   │   └── gradeActions.js
│       │   ├── reducers/
│       │   │   ├── authReducer.js
│       │   │   ├── trackReducer.js
│       │   │   ├── courseReducer.js
│       │   │   ├── assignmentReducer.js
│       │   │   ├── gradeReducer.js
│       │   │   └── rootReducer.js
│       │   └── store.js
│       ├── routes/                  # React Router configuration (including Private Routes)
│       │   └── PrivateRoute.js
│       └── utils/                   # API helpers, constants, etc.
│           └── api.js
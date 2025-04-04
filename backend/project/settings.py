import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = "your-secret-key"

DEBUG = True

ALLOWED_HOSTS = []
AUTH_USER_MODEL = 'staff_members.StaffMember'

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'rest_framework.authtoken',  # Add this line for Token Authentication
    'rest_framework_simplejwt',
    "rest_framework",
    "apps.tracks",
    "apps.courses",
    "apps.assignments",
    "apps.grades",
    "apps.staff_members",
    "apps.student",
    "apps.custom_auth",
    "apps.submission",
    "apps.branch_location",
    "corsheaders",


]
# settings.py
# Add this import at the top of settings.py
from datetime import timedelta

# Then add your JWT configuration
JWT_AUTH = {
    'ACCESS_TOKEN_COOKIE': 'access_token',
    'REFRESH_TOKEN_COOKIE': 'refresh_token',
    'COOKIE_PATH': '/',
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# settings.py

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # 'rest_framework.authentication.SessionAuthentication',  # Comment this out
        # 'rest_framework.authentication.BasicAuthentication',  # Or comment this out as well
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # Allow unauthenticated access
    ],
    # Other settings...
}
# REST_FRAMEWORK = {
#     'DEFAULT_AUTHENTICATION_CLASSES': [
#         'rest_framework.authentication.SessionAuthentication',
#     ],
# }
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "project.urls"
CORS_ALLOW_ALL_ORIGINS = True

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "templates")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "project.wsgi.application"
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "task-project-system",  # Change this to your database name
        "USER": "postgres",  # Your PostgreSQL username
        "PASSWORD": "2580",  # Your PostgreSQL password
        "HOST": "localhost",
        "PORT": "5432",
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# settings.py

SITE_URL = 'http://127.0.0.1:8000'

# settings.py


# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_USE_TLS = True
# EMAIL_HOST = 'smtp.mailtrap.io'  # Mailtrap SMTP Server
# EMAIL_HOST_USER = '67da28f2216e33'# Find this in Mailtrap settings
# EMAIL_HOST_PASSWORD = '865177a2af916d'# Find this in Mailtrap settings
# EMAIL_PORT = '587'
# DEFAULT_FROM_EMAIL = 'm.nasr266@gmail.com'  # Your "from" email address
# # efvh pzab wslt upfq
# # EMAIL_HOST_PASSWORD = 'efvh pzab wslt upfq'


EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "m.nasr266@gmail.com"
EMAIL_HOST_PASSWORD = 'efvh pzab wslt upfq'  # Use an App Password, NOT your Gmail password
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


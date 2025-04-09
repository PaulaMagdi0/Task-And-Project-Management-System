from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("", TemplateView.as_view(template_name="api_root.html"), name="api-root"),
    path("admin/", admin.site.urls),
    
    # API Endpoints
    path("api/tracks/", include("apps.tracks.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/assignments/", include("apps.assignments.urls")),
    path("api/grades/", include("apps.grades.urls")),
    path("api/staff/", include("apps.staff_members.urls")),
    path("api/students/", include("apps.student.urls")),
    path("api/submissions/", include("apps.submission.urls")),
    path("api/auth/", include("apps.custom_auth.urls")),
    path("api/branches/", include("apps.branch_location.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/contact/", include("apps.contact.urls")),
    
    # Authentication
    path('api/auth/', include('rest_framework.urls')),
]
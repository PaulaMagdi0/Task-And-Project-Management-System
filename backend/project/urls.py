from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path("", TemplateView.as_view(template_name="api_root.html"), name="api-root"),
    path("admin/", admin.site.urls),
    path("api/tracks/", include("apps.tracks.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/assignments/", include("apps.assignments.urls")),
    path("api/grades/", include("apps.grades.urls")),
    path("api/staff/", include("apps.staff_members.urls")),
    path("api/student/", include("apps.student.urls")),
    path("api/submission/", include("apps.submission.urls")),
    path("api/auth/", include("apps.custom_auth.urls")),
    path("api/branch_location/", include("apps.branch_location.urls")),


]

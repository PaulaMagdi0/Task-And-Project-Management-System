from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path("", TemplateView.as_view(template_name="api_root.html"), name="api-root"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/tracks/", include("apps.tracks.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/assignments/", include("apps.assignments.urls")),
    path("api/grades/", include("apps.grades.urls")),
]

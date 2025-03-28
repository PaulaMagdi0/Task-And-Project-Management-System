from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
urlpatterns = [
    path("", TemplateView.as_view(template_name="api_root.html"), name="api-root"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/tracks/", include("apps.tracks.urls")),
    path("api/courses/", include("apps.courses.urls")),
    path("api/assignments/", include("apps.assignments.urls")),
    path("api/grades/", include("apps.grades.urls")),
    path('api/users/', include('apps.users.urls')),  # Add this line
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# project/urls.py
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
    # path('api/', include('apps.student.urls')),
    path("api/chat/", include("apps.chat.urls")),
    path("api/contact/", include("apps.contact.urls")),
    path('ai/', include('ai_recommendations.urls')),
    path('api/', include('chat_ai.urls')),  # 👈 Add this line
    path('api/', include('jokes.urls')),  # Include the 'jokes' app's URLs
    path('api/github/', include('githubStat.urls')),
    path('book_search/', include('book_search.urls')),
    path('movie_search/', include('movie_search.urls')),

]

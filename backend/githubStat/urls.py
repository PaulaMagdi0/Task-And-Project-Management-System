print("githubStat.urls imported!")  # Debugging line

from django.urls import path
from . import views  # Import views here

urlpatterns = [
    path('stats/', views.GitHubStatsView.as_view(), name='github-stats'),  # Correct view for GitHubStatsView
    path('commits/', views.get_commits, name='get_commits'),  # Using views.get_commits
    path('branches/', views.get_branches, name='get_branches'),  # Using views.get_branches
]

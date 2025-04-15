from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view  # Import api_view here
import requests

class GitHubStatsView(APIView):
    def get(self, request):
        username = request.query_params.get("username")
        token = request.query_params.get("token", None)

        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

        headers = {"Authorization": f"token {token}"} if token else {}
        
        # Use /user/repos only if token is provided AND username matches token owner
        if token:
            url = "https://api.github.com/user/repos?per_page=100"
        else:
            url = f"https://api.github.com/users/{username}/repos?per_page=100"

        response = requests.get(url, headers=headers)

        if response.status_code != 200:
            return Response({"error": "GitHub API error", "status_code": response.status_code}, status=response.status_code)

        repos = response.json()
        repo_data = []

        for repo in repos:
            repo_data.append({
                "name": repo["name"],
                "private": repo["private"],
                "language": repo["language"],
                "stars": repo["stargazers_count"],
                "forks": repo["forks_count"],
                "open_issues": repo["open_issues_count"],
                "watchers": repo["watchers_count"],
                "created_at": repo["created_at"]
            })

        return Response(repo_data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_commits(request):
    username = request.GET.get('username')
    repo = request.GET.get('repo')
    token = request.GET.get('token')

    url = f"https://api.github.com/repos/{username}/{repo}/commits"
    headers = {"Authorization": f"token {token}"} if token else {}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        commits = [
            {
                "committer_name": commit["commit"]["committer"]["name"],
                "committer_date": commit["commit"]["committer"]["date"],
                "commit_message": commit["commit"]["message"]
            }
            for commit in response.json()
        ]
        return Response(commits)
    return Response({"error": "Failed to fetch commits"}, status=400)

@api_view(['GET'])
def get_branches(request):
    username = request.GET.get('username')
    repo = request.GET.get('repo')
    token = request.GET.get('token')

    url = f"https://api.github.com/repos/{username}/{repo}/branches"
    headers = {"Authorization": f"token {token}"} if token else {}

    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        branches = [{"name": branch["name"]} for branch in response.json()]
        return Response(branches)
    return Response({"error": "Failed to fetch branches"}, status=400)
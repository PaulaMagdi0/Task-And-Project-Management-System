import requests
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

API_KEY = "42f35605505847f2e6a5d264ac86227c"
BASE_URL = "https://api.themoviedb.org/3"


def get_trending_movies():
    url = f"{BASE_URL}/trending/movie/week?api_key={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        movies_data = response.json()["results"]
        movie_list = []
        for movie in movies_data:
            movie_list.append({
                "Title": movie.get("title", "No title"),
                "Release Date": movie.get("release_date", "No release date"),
                "Description": movie.get("overview", "No description"),
                "Rating": movie.get("vote_average", "No rating")
            })
        return pd.DataFrame(movie_list)
    return None


def get_movies_by_genre(genre_id):
    url = f"{BASE_URL}/discover/movie?api_key={API_KEY}&with_genres={genre_id}"
    response = requests.get(url)

    if response.status_code == 200:
        movies_data = response.json()["results"]
        movie_list = []
        for movie in movies_data:
            movie_list.append({
                "Title": movie.get("title", "No title"),
                "Release Date": movie.get("release_date", "No release date"),
                "Description": movie.get("overview", "No description"),
                "Rating": movie.get("vote_average", "No rating")
            })
        return pd.DataFrame(movie_list)
    return None


def get_movie_id_from_title(movie_title):
    url = f"{BASE_URL}/search/movie?api_key={API_KEY}&query={movie_title}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json().get("results", [])
        if data:
            return data[0]['id']
    return None


def get_movie_trailer(movie_id):
    url = f"{BASE_URL}/movie/{movie_id}/videos?api_key={API_KEY}"
    response = requests.get(url)

    if response.status_code == 200:
        video_data = response.json().get("results", [])
        if video_data:
            return f"https://www.youtube.com/watch?v={video_data[0]['key']}"
    return "No trailer available"


# === Views ===

@csrf_exempt
def trending_movies_view(request):
    movies_df = get_trending_movies()
    if movies_df is not None:
        return JsonResponse(movies_df.to_dict(orient='records'), safe=False)
    return JsonResponse({"error": "Failed to fetch trending movies"}, status=500)


@csrf_exempt
def movies_by_genre_view(request):
    genre_id = request.GET.get("genre_id", "")
    if genre_id:
        movies_df = get_movies_by_genre(genre_id)
        if movies_df is not None:
            return JsonResponse(movies_df.to_dict(orient='records'), safe=False)
        return JsonResponse({"error": "Failed to fetch movies by genre"}, status=500)
    return JsonResponse({"error": "Missing genre_id"}, status=400)


@csrf_exempt
def movie_trailer_view(request):
    title = request.GET.get("title", "")
    if title:
        movie_id = get_movie_id_from_title(title)
        if movie_id:
            trailer_url = get_movie_trailer(movie_id)
            return JsonResponse({"title": title, "trailer_url": trailer_url})
        return JsonResponse({"error": "Movie ID not found"}, status=404)
    return JsonResponse({"error": "Missing title"}, status=400)

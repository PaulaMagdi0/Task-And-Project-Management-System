from django.urls import path
from .views import trending_movies_view, movies_by_genre_view, movie_trailer_view

urlpatterns = [
    path('trending/', trending_movies_view),
    path('by_genre/', movies_by_genre_view),
    path('trailer/', movie_trailer_view),
]

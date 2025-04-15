from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_books_view, name='search_books'),
]

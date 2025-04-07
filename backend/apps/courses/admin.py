# apps/courses/admin.py
from django.contrib import admin
from .models import Course  # Import the Course model

class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'track', 'instructor', 'created_at')  # Display these fields in the list view
    search_fields = ('name', 'track__name', 'instructor__username')  # Add search functionality
    list_filter = ('track', 'instructor')  # Add filters for track and instructor
    ordering = ('-created_at',)  # Order by created_at in descending order

admin.site.register(Course, CourseAdmin)  # Register the Course model with the custom admin class

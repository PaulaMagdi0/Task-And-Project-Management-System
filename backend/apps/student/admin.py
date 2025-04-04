# apps/students/admin.py
from django.contrib import admin
from .models import Student

class StudentAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'email', 'track', 'role', 'is_active', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('role', 'is_active', 'track')
    ordering = ('-date_joined',)

admin.site.register(Student, StudentAdmin)

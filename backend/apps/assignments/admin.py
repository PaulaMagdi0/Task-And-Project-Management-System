from django.contrib import admin
from .models import Assignment  # Import the Assignment model

# class AssignmentAdmin(admin.ModelAdmin):
#     list_display = ('title', 'course', 'assignment_type', 'assigned_to', 'due_date', 'end_date', 'created_at')  # Fields to display, added 'assigned_to'
#     search_fields = ('title', 'course__name', 'assignment_type', 'assigned_to__full_name')  # Search by title, course name, type, and assigned student's full name
#     list_filter = ('assignment_type', 'course', 'assigned_to')  # Filter by assignment type, course, and assigned student
#     ordering = ('-created_at',)  # Order by creation date in descending order
    
#     # Read-only fields to display additional information (e.g., file URL)
#     readonly_fields = ('file', 'file_url')

#     def save_model(self, request, obj, form, change):
#         """Custom save method (if any validation or modification is needed before saving)"""
#         # You can add extra logic here if needed
#         super().save_model(request, obj, form, change)

# admin.site.register(Assignment, AssignmentAdmin)  # Register the Assignment model with the custom admin class
# In apps/assignments/admin.py
from django.contrib import admin
from .models import Assignment, AssignmentStudent
from django.utils.html import format_html
from .forms import AssignmentAdminForm
from apps.student.models import Student

# Inline for AssignmentStudent to link with Assignment
class AssignmentStudentInline(admin.TabularInline):
    model = AssignmentStudent
    extra = 1  # Number of empty forms to show by default in the inline
    fields = ['student', 'course', 'track']  # Fields to display

class AssignmentAdmin(admin.ModelAdmin):
    form = AssignmentAdminForm  # Link the custom form to the model
    list_display = ('title', 'course', 'due_date', 'end_date', 'created_at', 'assigned_students')
    search_fields = ('title', 'course__name', 'description')
    list_filter = ('assignment_type', 'course', 'due_date')

    # Add custom field to display assigned students in list view
    def assigned_students(self, obj):
        return format_html(
            ", ".join([f"{student.student.full_name} ({student.course.name})" for student in obj.assignmentstudent_set.all()])
        )
    assigned_students.short_description = "Assigned Students"

    # Include inline for AssignmentStudent
    inlines = [AssignmentStudentInline]

    def get_queryset(self, request):
        # Override to make sure we can access the related AssignmentStudent data
        queryset = super().get_queryset(request)
        queryset = queryset.prefetch_related('assignmentstudent_set')
        return queryset

    def save_model(self, request, obj, form, change):
        # Handle the case when the 'assigned_to_all' checkbox is checked
        assigned_students = form.cleaned_data.get('assigned_to')
        if form.cleaned_data.get('assigned_to_all'):
            track = form.cleaned_data.get('track')
            if track:
                # Assign all students from the selected track to the assignment
                assigned_students = Student.objects.filter(track=track)
        
        # Remove old students and add the new ones
        obj.save()

        # Clear previous assignments
        obj.assignmentstudent_set.all().delete()

        # Add new assignments
        for student in assigned_students:
            AssignmentStudent.objects.create(
                assignment=obj,
                student=student,
                course=obj.course,
                track=student.track
            )
        super().save_model(request, obj, form, change)

admin.site.register(Assignment, AssignmentAdmin)
admin.site.register(AssignmentStudent)

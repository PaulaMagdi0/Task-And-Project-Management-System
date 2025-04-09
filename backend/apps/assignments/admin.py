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
from django.contrib import admin
from .models import Assignment, AssignmentStudent
from .forms import AssignmentAdminForm  # Import the form we created
from apps.student.models import Student  # Ensure you import the Student model here
from apps.courses.models import Course  # Ensure you import the Course model here

class AssignmentAdmin(admin.ModelAdmin):
    form = AssignmentAdminForm  # Use the custom form to handle dynamic student assignment
    list_display = ['title', 'course', 'due_date', 'created_at']

    def save_model(self, request, obj, form, change):
        # Save the assignment first
        obj.save()

        # Get form fields for assigning students
        assigned_to_all = form.cleaned_data['assigned_to_all']
        course = form.cleaned_data['course']  # Get the course from the form

        if assigned_to_all:
            # If 'Assign to All Students' is selected, assign all students in the selected track
            track = form.cleaned_data['track']  # Get the track from the form
            students_in_track = Student.objects.filter(track=track)
            for student in students_in_track:
                # Ensure each student is associated with the correct course
                AssignmentStudent.objects.create(
                    assignment=obj,
                    student=student,
                    course=course  # Assign the course to the student
                )
        else:
            # Otherwise, assign the selected students
            selected_students = form.cleaned_data['assigned_to']
            for student in selected_students:
                AssignmentStudent.objects.create(
                    assignment=obj,
                    student=student,
                    course=course  # Assign the course to the student
                )

        # Save the updated assignment
        obj.save()

    def get_fieldsets(self, request, obj=None):
        return [
            (None, {'fields': ['title', 'course', 'description', 'due_date', 'assigned_to', 'assigned_to_all', 'track']}),
        ]

# Register the admin
admin.site.register(Assignment, AssignmentAdmin)
admin.site.register(AssignmentStudent)

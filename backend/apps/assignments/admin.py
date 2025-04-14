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

    def assigned_students(self, obj):
        # Display the assigned students along with their courses and tracks
        return format_html(
            ", ".join([f"{student.student.full_name} ({student.course.name} - {student.track.name if student.track else 'No Track'})" for student in obj.assignmentstudent_set.all()])
        )
    assigned_students.short_description = "Assigned Students"

    # Include inline for AssignmentStudent
    inlines = [AssignmentStudentInline]

    def get_course_name(self, obj):
        return obj.course.name if obj.course else "No Course Assigned"
    get_course_name.short_description = "Course"

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        # Prefetch related data to optimize queries
        queryset = queryset.prefetch_related(
            'assignmentstudent_set',           # Prefetch the related AssignmentStudent instances
            'assignmentstudent_set__student',   # Prefetch related student for each AssignmentStudent
            'assignmentstudent_set__course',    # Prefetch related course for each AssignmentStudent
            'assignmentstudent_set__track'      # Prefetch related track for each AssignmentStudent
        )
        return queryset

    def save_model(self, request, obj, form, change):
        """Handle saving of the model and assignment of students based on conditions"""
        # Get the list of students assigned to this assignment
        assigned_students = form.cleaned_data.get('assigned_to', [])
        
        # Check if 'assigned_to_all' was selected and assign students from the track
        if form.cleaned_data.get('assigned_to_all'):
            track = form.cleaned_data.get('track')
            if track:
                # Assign all students from the selected track to the assignment
                assigned_students = Student.objects.filter(track=track)

        # Save the Assignment model
        obj.save()

        # Clear previous students assigned to this assignment
        obj.assignmentstudent_set.all().delete()

        # Add new assignments (students)
        for student in assigned_students:
            # Ensure that the correct track is linked to the student for this assignment
            AssignmentStudent.objects.create(
                assignment=obj,
                student=student,
                course=obj.course,
                track=student.track  # Ensure track is correctly set
            )

        super().save_model(request, obj, form, change)

# Registering the models with the admin
admin.site.register(Assignment, AssignmentAdmin)
admin.site.register(AssignmentStudent)

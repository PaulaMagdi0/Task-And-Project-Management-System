from django import forms
from .models import Assignment
from apps.student.models import Student
from apps.courses.models import Course
from apps.tracks.models import Track
class AssignmentAdminForm(forms.ModelForm):
    assigned_to_all = forms.BooleanField(required=False, label="Assign to all students from selected track")
    track = forms.ModelChoiceField(queryset=Track.objects.all(), required=False, label="Select Track")
    file_url = forms.URLField(required=False, label="File URL", help_text="URL of the assignment file (e.g., PDF or DOCX)")

    class Meta:
        model = Assignment
        fields = ['title', 'due_date', 'end_date', 'assignment_type', 'course', 'description', 'assigned_to', 'track', 'file_url']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if 'assigned_to' in self.fields:
            if self.instance.pk:  # If assignment instance exists
                course = self.instance.course
                if course:
                    # Filter students by course's track
                    self.fields['assigned_to'].queryset = Student.objects.filter(track=course.track)
            else:
                self.fields['assigned_to'].queryset = Student.objects.none()

    def clean_assigned_to(self):
        assigned_students = self.cleaned_data.get('assigned_to', [])
        if self.cleaned_data.get('assigned_to_all'):  # If the checkbox is checked
            track = self.cleaned_data.get('track')
            if track:
                # Assign all students from the selected track to the assignment
                assigned_students = Student.objects.filter(track=track)
                print(f"Assigned Students: {assigned_students}")  # Add logging here for debugging
                self.cleaned_data['assigned_to'] = assigned_students
        return assigned_students

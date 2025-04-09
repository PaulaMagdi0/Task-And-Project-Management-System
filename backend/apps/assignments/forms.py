# In apps/assignments/forms.py
from django import forms
from .models import Assignment
from apps.student.models import Student
from apps.courses.models import Track

class AssignmentAdminForm(forms.ModelForm):
    assigned_to_all = forms.BooleanField(required=False, initial=False)
    track = forms.ModelChoiceField(queryset=Track.objects.all(), required=False)  # Track field to filter students
    assigned_to = forms.ModelMultipleChoiceField(
        queryset=Student.objects.all(), required=False, widget=forms.CheckboxSelectMultiple, label="Select Students"
    )

    class Meta:
        model = Assignment
        fields = ['title', 'course', 'due_date', 'assigned_to', 'assigned_to_all', 'track']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Pre-select students based on the track selected
        if self.instance.pk and self.instance.track:
            self.fields['assigned_to'].queryset = self.instance.track.students.all()

    def clean(self):
        cleaned_data = super().clean()

        # Conditionally handle the 'assigned_to' field based on 'assigned_to_all' checkbox
        if cleaned_data.get('assigned_to_all'):
            cleaned_data['assigned_to'] = Student.objects.filter(track=cleaned_data.get('track'))

        return cleaned_data

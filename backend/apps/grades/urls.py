from django.urls import path
from .views import StudentGradeByAssignmentView,GradeListView, GradeDetailView, StudentGradeListView, GradeByStudentAndAssignmentView, InstructorTrackCourseGradesView

urlpatterns = [
    path('', GradeListView.as_view(), name='grade-list-create'),
    path('<int:id>/', GradeDetailView.as_view(), name='grade-detail'),
    path('student/<int:studentid>/', StudentGradeListView.as_view(), name='student-grades'),
    path('track/<int:track_id>/course/<int:course_id>/', InstructorTrackCourseGradesView.as_view(), name='grades-by-track-course'),
    path('student/<int:student_id>/assignment/<int:assignment_id>/', GradeByStudentAndAssignmentView.as_view(), name='grade-by-student-assignment'),
    path('student/<int:student_id>/', StudentGradeByAssignmentView.as_view(), name='grades-by-student-assignment'),

   
   
]

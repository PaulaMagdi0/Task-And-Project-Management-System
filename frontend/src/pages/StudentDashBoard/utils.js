export const getCourseProgress = (courseId, assignments, submittedAssignments) => {
    const courseAssignments = assignments.filter((a) => a.course === courseId);
    if (courseAssignments.length === 0) return 0;
    const completed = courseAssignments.filter((a) => submittedAssignments[a.id]?.submitted).length;
    return Math.round((completed / courseAssignments.length) * 100);
  };
  
  export const filterAssignments = (assignments, isSubmitted, courseFilter, deadlineFilter, submittedAssignments) => {
    return assignments.filter((assignment) => {
      const matchesSubmissionStatus = isSubmitted
        ? submittedAssignments[assignment.id]?.submitted
        : !submittedAssignments[assignment.id]?.submitted;
      const matchesCourse = courseFilter === 'all' || assignment.course_name === courseFilter;
      const matchesDeadline = !deadlineFilter || new Date(assignment.end_date).toISOString().slice(0, 10) === deadlineFilter;
      const isFutureDeadline = !isSubmitted ? new Date(assignment.end_date) >= new Date() : true;
      return matchesSubmissionStatus && matchesCourse && matchesDeadline && isFutureDeadline;
    });
  };
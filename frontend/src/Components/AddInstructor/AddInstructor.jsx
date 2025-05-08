import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    Typography,
    TextField,
    Divider,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    styled,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '../../redux/coursesSlice';
import apiClient from '../../services/api';

const StyledCard = styled(Card)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: '16px',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.1)',
    maxWidth: '800px',
    margin: '0 auto'
}));

const StyledButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1.5),
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: '12px'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px',
        '& fieldset': {
            borderColor: theme.palette.grey[300],
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
}));

const UploadInstructor = () => {
    const dispatch = useDispatch();
    const { user_id, role } = useSelector((state) => state.auth);
    const {
        userCourses: { track_courses },
        status: { fetchCoursesLoading, fetchCoursesError }
    } = useSelector((state) => state.courses);

    const [staffData, setStaffData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'instructor',
        course_id: '',
    });

    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        isSuccess: false
    });
    const [intakes, setIntakes] = useState([]);
    const [intakeCourses, setIntakeCourses] = useState({});
    const [intakesLoading, setIntakesLoading] = useState(false);
    const [intakesError, setIntakesError] = useState(null);

    // Fetch courses on mount
    useEffect(() => {
        if (user_id) {
            dispatch(fetchCourses(user_id));
        }
    }, [dispatch, user_id]);

    // Fetch intakes and intake-specific courses
    useEffect(() => {
        const fetchIntakeData = async () => {
            setIntakesLoading(true);
            setIntakesError(null);
            try {
                // Fetch all intakes
                const intakeResponse = await apiClient.get('/student/intakes/');
                const fetchedIntakes = Array.isArray(intakeResponse.data.intakes)
                    ? intakeResponse.data.intakes
                    : [];
                setIntakes(fetchedIntakes);

                // Fetch courses for each intake
                const fetchedIntakeCourses = {};
                await Promise.all(
                    fetchedIntakes.map(async (intake) => {
                        try {
                            const response = await apiClient.get(`/courses/intakes/${intake.id}/courses/`);
                            fetchedIntakeCourses[intake.id] = Array.isArray(response.data)
                                ? response.data
                                : [];
                        } catch (error) {
                            console.warn(`Failed to fetch courses for intake ${intake.id}:`, error);
                            fetchedIntakeCourses[intake.id] = [];
                        }
                    })
                );
                setIntakeCourses(fetchedIntakeCourses);
            } catch (error) {
                console.error('Error fetching intakes:', error);
                setIntakesError(error.response?.data?.detail || 'Failed to fetch intakes');
            } finally {
                setIntakesLoading(false);
            }
        };

        if (user_id) {
            fetchIntakeData();
        }
    }, [user_id]);

    // Show error modals
    useEffect(() => {
        if (fetchCoursesError) {
            showErrorModal('Failed to load courses');
        }
        if (intakesError) {
            showErrorModal('Failed to load intake data');
        }
    }, [fetchCoursesError, intakesError]);

    // Deduplicate and filter courses by role, enrich with intake data
    const uniqueCourses = useMemo(() => {
        const courseMap = new Map();
        const courses = role === 'supervisor'
            ? track_courses || []
            : track_courses?.filter((course) => course.instructor?.id === user_id) || [];

        courses.forEach((course) => {
            if (!courseMap.has(course.id)) {
                // Find intake for this course
                let intake = null;
                for (const intakeId in intakeCourses) {
                    const coursesInIntake = intakeCourses[intakeId];
                    if (coursesInIntake.some((c) => c.id === course.id)) {
                        const matchingIntake = intakes.find((i) => i.id === parseInt(intakeId));
                        if (matchingIntake) {
                            intake = { id: matchingIntake.id, name: matchingIntake.name };
                            break;
                        }
                    }
                }

                courseMap.set(course.id, {
                    ...course,
                    intake,
                    tracks: Array.isArray(course.tracks) ? course.tracks : [],
                });
            } else {
                const existing = courseMap.get(course.id);
                const existingTrackIds = new Set(existing.tracks.map((t) => t.id));
                course.tracks?.forEach((track) => {
                    if (!existingTrackIds.has(track.id)) {
                        existing.tracks.push(track);
                        existingTrackIds.add(track.id);
                    }
                });
            }
        });

        return Array.from(courseMap.values());
    }, [track_courses, role, user_id, intakes, intakeCourses]);

    const handleStaffInputChange = (e) => {
        const { name, value } = e.target;
        setStaffData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const showSuccessModal = (message) => {
        setModalContent({
            title: 'Success!',
            message,
            isSuccess: true
        });
        setOpenModal(true);
    };

    const showErrorModal = (message) => {
        setModalContent({
            title: 'Error',
            message,
            isSuccess: false
        });
        setOpenModal(true);
    };

    const validateEmail = (email) => {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailPattern.test(email);
    };

    const handleSubmitManualStaff = async () => {
        if (!staffData.username || !staffData.password || !staffData.first_name ||
            !staffData.last_name || !staffData.email || !staffData.course_id || !staffData.phone) {
            showErrorModal('Please fill all required fields');
            return;
        }
        if (!validateEmail(staffData.email)) {
            showErrorModal('Please enter a valid email');
            return;
        }

        // Validate course_id
        const selectedCourse = uniqueCourses.find((course) => course.id === staffData.course_id);
        if (!selectedCourse) {
            showErrorModal('Selected course is invalid');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('username', staffData.username);
            formData.append('password', staffData.password);
            formData.append('first_name', staffData.first_name);
            formData.append('last_name', staffData.last_name);
            formData.append('email', staffData.email);
            formData.append('phone', staffData.phone);
            formData.append('role', 'instructor');
            formData.append('course_id', staffData.course_id);

            const response = await apiClient.post('/staff/create-instructor/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            showSuccessModal('Instructor added successfully!');
            setStaffData({
                username: '',
                password: '',
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                role: 'instructor',
                course_id: ''
            });
        } catch (error) {
            const errorMsg = error?.response?.data?.detail || error?.response?.data?.message || 'Failed to add instructor';
            console.error('Error submitting instructor data:', error);
            showErrorModal(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, background: '#f5f7fa', minHeight: '100vh' }}>
            <StyledCard>
                <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
                    Add New Instructor
                </Typography>

                <Divider sx={{ my: 3, borderColor: 'rgba(0, 0, 0, 0.08)' }} />

                <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
                    <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
                        Instructor Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="Username *"
                                fullWidth
                                name="username"
                                value={staffData.username}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="Password *"
                                fullWidth
                                name="password"
                                type="password"
                                value={staffData.password}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="First Name *"
                                fullWidth
                                name="first_name"
                                value={staffData.first_name}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="Last Name *"
                                fullWidth
                                name="last_name"
                                value={staffData.last_name}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="Email *"
                                fullWidth
                                name="email"
                                type="email"
                                value={staffData.email}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledTextField
                                label="Phone *"
                                fullWidth
                                name="phone"
                                value={staffData.phone}
                                onChange={handleStaffInputChange}
                                sx={{ mb: 2 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel id="course-label">Assign To Course</InputLabel>
                                <Select
                                    labelId="course-label"
                                    id="course-select"
                                    name="course_id"
                                    value={staffData.course_id}
                                    onChange={handleStaffInputChange}
                                    label="Assign To Course"
                                    disabled={fetchCoursesLoading || intakesLoading}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value=""><em>Select Course</em></MenuItem>
                                    {fetchCoursesLoading || intakesLoading ? (
                                        <MenuItem disabled>Loading courses...</MenuItem>
                                    ) : uniqueCourses.length === 0 ? (
                                        <MenuItem disabled>No courses available</MenuItem>
                                    ) : (
                                        uniqueCourses.map((course) => (
                                            <MenuItem key={course.id} value={course.id}>
                                                {course.name} Intake({course.intake?.name || 'No Intake'})
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>

                    <StyledButton
                        variant="contained"
                        fullWidth
                        onClick={handleSubmitManualStaff}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{ py: 1.5 }}
                    >
                        {loading ? 'Processing...' : 'Add Instructor'}
                    </StyledButton>
                </Box>
            </StyledCard>

            {/* Success/Error Modal */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        minWidth: '400px'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    {modalContent.isSuccess ? (
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: '28px' }} />
                    ) : (
                        <Error color="error" sx={{ mr: 1, fontSize: '28px' }} />
                    )}
                    {modalContent.title}
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {modalContent.message}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal} color="primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UploadInstructor;
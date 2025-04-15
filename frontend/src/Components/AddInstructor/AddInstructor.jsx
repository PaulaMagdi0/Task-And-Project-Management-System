import React, { useState, useEffect } from 'react';
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
    Paper,
    styled,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import CloudUpload from '@mui/icons-material/CloudUpload';
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

const FileInput = styled('input')({
    display: 'none',
});

const UploadInstructor = () => {
    const [isExcelUpload, setIsExcelUpload] = useState(false);
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

    const [courses, setCourses] = useState([]);
    const [excelFile, setExcelFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingCourses, setFetchingCourses] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        isSuccess: false
    });

    useEffect(() => {
        const fetchCourses = async () => {
            setFetchingCourses(true);
            try {
                const response = await apiClient.get('/courses/');
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
                showErrorModal('Failed to load courses');
            } finally {
                setFetchingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const handleStaffInputChange = (e) => {
        const { name, value } = e.target;
        setStaffData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        setExcelFile(e.target.files[0]);
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
    
            // If successful, handle success
            showSuccessModal('Instructor added successfully!');
            setStaffData({
                username: '',
                password: '',
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
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
    
    const handleUploadExcel = async () => {
        if (!excelFile || !staffData.course_id) {
            showErrorModal('Please upload a file and select a course.');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        if (!allowedTypes.includes(excelFile.type)) {
            showErrorModal('Invalid file type. Please upload an Excel file.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', excelFile);
            formData.append('course_id', staffData.course_id);

            const response = await apiClient.post(
                '/staff/upload/',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            showSuccessModal('Instructors uploaded successfully!');
            setExcelFile(null);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to upload instructors';
            console.error('Error uploading instructors:', error);
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
                                    disabled={fetchingCourses}
                                >
                                    {fetchingCourses ? (
                                        <MenuItem disabled>Loading courses...</MenuItem>
                                    ) : (
                                        courses.map((course) => (
                                            <MenuItem key={course.id} value={course.id}>
                                                {course.name}
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
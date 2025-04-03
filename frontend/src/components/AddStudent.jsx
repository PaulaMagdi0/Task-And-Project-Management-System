import React, { useState } from 'react';
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
    styled
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import CloudUpload from '@mui/icons-material/CloudUpload';
import axios from 'axios';

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

const UploadStudentPage = () => {
    const [isExcelUpload, setIsExcelUpload] = useState(false);
    const [studentData, setStudentData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [excelFile, setExcelFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        isSuccess: false
    });

    const handleStudentInputChange = (e) => {
        const { name, value } = e.target;
        setStudentData((prevData) => ({
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

    const handleSubmitManualStudent = async () => {
        if (!studentData.first_name || !studentData.last_name || !studentData.email) {
            showErrorModal('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/student/upload/`,
                studentData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            showSuccessModal('Student added successfully!');
            setStudentData({
                first_name: '',
                last_name: '',
                email: ''
            });
        } catch (error) {
            console.error('Error submitting student data:', error);
            showErrorModal(error.response?.data?.error || 'Failed to add student');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadExcel = async () => {
        if (!excelFile) {
            showErrorModal('Please select a file first');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('excel_file', excelFile);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/student/upload/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            showSuccessModal(`${response.data.count || 'Students'} added successfully!`);
            setExcelFile(null);
        } catch (error) {
            console.error('Error uploading file:', error);
            showErrorModal(error.response?.data?.error || 'Failed to upload students');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, background: '#f5f7fa', minHeight: '100vh' }}>
            <StyledCard>
                <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
                    {isExcelUpload ? 'Upload Students Sheet' : 'Add New Student'}
                </Typography>

                <Grid container spacing={2} mb={3}>
                    <Grid item xs={6}>
                        <StyledButton
                            fullWidth
                            variant={!isExcelUpload ? 'contained' : 'outlined'}
                            onClick={() => setIsExcelUpload(false)}
                            color={!isExcelUpload ? 'primary' : 'inherit'}
                        >
                            Add Single Student
                        </StyledButton>
                    </Grid>
                    <Grid item xs={6}>
                        <StyledButton
                            fullWidth
                            variant={isExcelUpload ? 'contained' : 'outlined'}
                            onClick={() => setIsExcelUpload(true)}
                            color={isExcelUpload ? 'primary' : 'inherit'}
                        >
                            Add Multiple Students
                        </StyledButton>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3, borderColor: 'rgba(0, 0, 0, 0.08)' }} />

                {!isExcelUpload ? (
                    <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
                        <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
                            Student Information
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <StyledTextField
                                    label="First Name *"
                                    fullWidth
                                    name="first_name"
                                    value={studentData.first_name}
                                    onChange={handleStudentInputChange}
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <StyledTextField
                                    label="Last Name *"
                                    fullWidth
                                    name="last_name"
                                    value={studentData.last_name}
                                    onChange={handleStudentInputChange}
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <StyledTextField
                                    label="Email *"
                                    fullWidth
                                    name="email"
                                    type="email"
                                    value={studentData.email}
                                    onChange={handleStudentInputChange}
                                    sx={{ mb: 3 }}
                                />
                            </Grid>
                        </Grid>

                        <StyledButton
                            variant="contained"
                            fullWidth
                            onClick={handleSubmitManualStudent}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? 'Processing...' : 'Add Student'}
                        </StyledButton>
                    </Box>
                ) : (
                    <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
                        <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
                            Upload Excel File
                        </Typography>

                        <Paper
                            variant="outlined"
                            sx={{
                                p: 3,
                                mb: 3,
                                borderStyle: 'dashed',
                                borderColor: 'grey.300',
                                textAlign: 'center'
                            }}
                        >
                            <label htmlFor="file-upload">
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<CloudUpload />}
                                >
                                    Choose File
                                </Button>
                            </label>
                            {excelFile && (
                                <Typography variant="body2" mt={2}>
                                    Selected file: <strong>{excelFile.name}</strong>
                                </Typography>
                            )}
                            <Typography variant="caption" display="block" mt={1} color="text.secondary">
                                Supported formats: .xlsx, .xls, .csv
                            </Typography>
                        </Paper>

                        <StyledButton
                            variant="contained"
                            fullWidth
                            onClick={handleUploadExcel}
                            disabled={loading || !excelFile}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? 'Uploading...' : 'Upload Students'}
                        </StyledButton>
                    </Box>
                )}
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
                    <Typography variant="body1">
                        {modalContent.message}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleCloseModal}
                        variant="contained"
                        color={modalContent.isSuccess ? 'success' : 'error'}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UploadStudentPage;
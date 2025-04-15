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
    Chip,
    FormControl,
    Autocomplete
} from '@mui/material';
import { Close, CheckCircle, Error } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import { fetchInstructors } from '../../redux/supervisorsSlice';
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

const AddCourses = () => {
    const dispatch = useDispatch();

    const { instructors, loading: instructorsLoading } = useSelector(state => state.supervisors);
    const { data: courseContextData, loading: tracksLoading } = useSelector(state => state.courses);
    
    const [formState, setFormState] = useState({
        name: '',
        description: '',
        instructor: null,
        tracks: []
    });

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ open: false, title: '', message: '', isSuccess: false });

    useEffect(() => {
        dispatch(fetchInstructors());

        const loggedInUserId = 3; // Replace with actual dynamic ID if available
        dispatch(fetchCourses(loggedInUserId));
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleInstructorSelect = (_, value) => {
        setFormState(prev => ({ ...prev, instructor: value }));
    };

    const handleTracksSelect = (_, values) => {
        setFormState(prev => ({ ...prev, tracks: values }));
    };

    const openModal = (title, message, isSuccess) => {
        setModal({ open: true, title, message, isSuccess });
    };

    const handleCloseModal = () => {
        setModal(prev => ({ ...prev, open: false }));
    };

    const handleSubmit = async () => {
        const { name, description, instructor, tracks } = formState;

        if (!name.trim() || !description.trim()) {
            openModal('Error', 'Course name and description are required', false);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name,
                description,
                instructor: instructor?.id || null,
                tracks: tracks.map(track => track.id)
            };

            await apiClient.post('/courses/', payload);
            openModal('Success!', 'Course created successfully!', true);

            setFormState({ name: '', description: '', instructor: null, tracks: [] });
        } catch (error) {
            const errorMsg = JSON.stringify(error.response?.data || { error: 'Unknown error' });
            openModal('Error', errorMsg, false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, background: '#f5f7fa', minHeight: '100vh' }}>
            <StyledCard>
                <Typography variant="h4" mb={3} fontWeight="bold" color="primary">
                    Create New Course
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
                    <Typography variant="h6" mb={3} fontWeight="600" color="text.secondary">
                        Course Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <StyledTextField
                                label="Course Name *"
                                fullWidth
                                name="name"
                                value={formState.name}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <StyledTextField
                                label="Description *"
                                fullWidth
                                name="description"
                                multiline
                                rows={4}
                                value={formState.description}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Autocomplete
                                    options={instructors}
                                    getOptionLabel={(option) => option.full_name || option.username}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={formState.instructor}
                                    onChange={handleInstructorSelect}
                                    loading={instructorsLoading}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            label="Instructor (Optional)" 
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {instructorsLoading && <CircularProgress size={20} color="inherit" />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <Autocomplete
                                    multiple
                                    options={courseContextData?.tracks || []}
                                    getOptionLabel={(option) => option.name}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    value={formState.tracks}
                                    onChange={handleTracksSelect}
                                    renderInput={(params) => (
                                        <TextField 
                                            {...params} 
                                            label="Associated Tracks" 
                                            placeholder="Select tracks"
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip label={option.name} {...getTagProps({ index })} key={option.id} />
                                        ))
                                    }
                                />
                            </FormControl>
                        </Grid>
                    </Grid>

                    <StyledButton
                        variant="contained"
                        fullWidth
                        onClick={handleSubmit}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        sx={{ mt: 3 }}
                    >
                        {loading ? 'Creating Course...' : 'Create Course'}
                    </StyledButton>
                </Box>
            </StyledCard>

            <Dialog
                open={modal.open}
                onClose={handleCloseModal}
                PaperProps={{ sx: { borderRadius: '16px', minWidth: '400px' } }}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                    {modal.isSuccess ? (
                        <CheckCircle color="success" sx={{ mr: 1, fontSize: '28px' }} />
                    ) : (
                        <Error color="error" sx={{ mr: 1, fontSize: '28px' }} />
                    )}
                    {modal.title}
                    <IconButton
                        onClick={handleCloseModal}
                        sx={{ position: 'absolute', right: 8, top: 8, color: 'grey.500' }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        {modal.message}
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

export default AddCourses;

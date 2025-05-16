import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Avatar,
    Paper,
    Grid,
    TextField,
    Button,
    Divider,
    Chip,
    InputAdornment,
    IconButton,
} from "@mui/material";
import {
    User,
    Mail,
    Phone,
    Calendar,
    Edit,
    Save,
    Briefcase,
    MapPin,
    Globe,
    Eye,
    EyeOff,
    Lock,
    Key,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useSnackbar } from "notistack";
import { CircularProgress } from "@mui/material";
import axios from "axios";
import apiClient from "../services/api";

const ProfilePage = () => {
    const { username, email, token } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const { enqueueSnackbar } = useSnackbar();
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState({
        fullName: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        date_joined: "",
        location: "",
        languages: "",
        currentPassword: "",
        newPassword: "",
    });

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            const studentId = localStorage.getItem("user_id");
            const token = localStorage.getItem("authToken");
            try {
                const response = await apiClient.get(`/student/${studentId}/courses`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = response.data;
                const [firstName, lastName] = data.student.full_name?.split(" ") || [];
                const dateJoined = data.student.date_joined?.split("T")[0] || "";

                setUserData({
                    fullName: data.student.name || "",
                    first_name: firstName || "",
                    last_name: lastName || "",
                    email: data.student.email || "",
                    phone: data.student.phone || "",
                    role: data.student.role || "Student",
                    department: data.student.department || "Education",
                    date_joined: dateJoined,
                    location: data.student.location || "Cairo, Egypt",
                    languages: data.student.languages || "English, Arabic",
                    newPassword: "",
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserData({
                    fullName: username,
                    first_name: username?.split(" ")[0] || "",
                    last_name: username?.split(" ")[1] || "",
                    email: email,
                    phone: "+20 123 456 7890",
                    role: "Senior Instructor",
                    department: "Education",
                    date_joined: "2023-01-15",
                    location: "Cairo, Egypt",
                    languages: "English, Arabic",
                    newPassword: "",
                });
            }
        };

        fetchUserData();
    }, [token, username, email]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
    };

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setUserData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
    };

    const handleSave = async () => {
        const studentId = localStorage.getItem("user_id");
        const authToken = localStorage.getItem("authToken");
        const { currentPassword, newPassword } = userData;

        if (!currentPassword || !newPassword) {
            enqueueSnackbar("Both fields are required", { variant: "error" });
            return;
        }

        if (newPassword.length < 8) {
            enqueueSnackbar("Password must be at least 8 characters", {
                variant: "error",
            });
            return;
        }

        setIsLoading(true);

        try {
            const { data } = await apiClient.patch(
                `/student/${studentId}/update/`,
                { currentPassword, newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            enqueueSnackbar(data.message || "Password updated successfully", {
                variant: "success",
            });
            setIsEditing(false);
            setUserData((prev) => ({
                ...prev,
                currentPassword: "",
                newPassword: "",
            }));
        } catch (error) {
            const errorMessage =
                error.response?.data?.error ||
                error.message ||
                "Failed to update password";
            enqueueSnackbar(errorMessage, { variant: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                p: { xs: 2, md: 4 },
                minHeight: "100vh",
                bgcolor: "#121212",
                color: "white",
            }}
        >
            <Paper
                sx={{
                    p: { xs: 2, md: 4 },
                    maxWidth: 800,
                    mx: "auto",
                    bgcolor: "#1E1E1E",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                }}
            >
                {/* Header Section */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: "center",
                        mb: 4,
                        gap: 3,
                    }}
                >
                    <Avatar
                        sx={{
                            width: 96,
                            height: 96,
                            bgcolor: "#d32f2f", // Blood red
                            fontSize: "2.5rem",
                            border: "3px solid rgba(255, 255, 255, 0.1)",
                        }}
                    >
                        {username?.charAt(0)?.toUpperCase()}
                    </Avatar>

                    <Box sx={{ textAlign: { xs: "center", sm: "left" } }}>
                        <Typography
                            variant="h4"
                            sx={{ color: "#eee", fontWeight: 700, mb: 0.5 }}
                        >
                            {userData.first_name} {userData.last_name}
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#aaa", mb: 1 }}>
                            {userData.role} At ITI
                        </Typography>
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                justifyContent: { xs: "center", sm: "flex-start" },
                            }}
                        >
                            <Chip
                                icon={<MapPin size={16} />}
                                label={userData.location}
                                size="small"
                                sx={{
                                    bgcolor: "rgba(211, 47, 47, 0.1)", // Semi-transparent blood red
                                    color: "#d32f2f", // Blood red text
                                    border: "1px solid rgba(211, 47, 47, 0.3)",
                                }}
                            />
                            <Chip
                                icon={<Globe size={16} />}
                                label={userData.languages}
                                size="small"
                                sx={{
                                    bgcolor: "rgba(211, 47, 47, 0.1)", // Semi-transparent blood red
                                    color: "#d32f2f", // Blood red text
                                    border: "1px solid rgba(211, 47, 47, 0.3)",
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 3, bgcolor: "rgba(255, 255, 255, 0.1)" }} />

                {/* Personal Information Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "white",
                        }}
                    >
                        <User size={20} />
                        Personal Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={`${userData.first_name} ${userData.last_name}`}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <User size={20} style={{ color: "#777" }} />
                                        </InputAdornment>
                                    ),
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={userData.email}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Mail size={20} style={{ color: "#777" }} />
                                        </InputAdornment>
                                    ),
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid>

                        {/* <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={userData.phone}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Phone size={20} style={{ color: "#777" }} />
                                        </InputAdornment>
                                    ),
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid> */}

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Join Date"
                                value={userData.date_joined}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Calendar size={20} style={{ color: "#777" }} />
                                        </InputAdornment>
                                    ),
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Professional Information Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "white",
                        }}
                    >
                        <Briefcase size={20} />
                        Professional Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Position"
                                value={userData.role}
                                InputProps={{
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Department"
                                value={userData.department}
                                InputProps={{
                                    readOnly: true,
                                }}
                                sx={textFieldStyles}
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Password Section - Only shown in edit mode */}
                {isEditing && (
                    <Box sx={{ mb: 4 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                mb: 2,
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                color: "white",
                            }}
                        >
                            <Key size={20} />
                            Change Password
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    label="Current Password"
                                    value={userData.currentPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock size={20} style={{ color: "#777" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() =>
                                                        setShowCurrentPassword(!showCurrentPassword)
                                                    }
                                                    edge="end"
                                                    sx={{ color: "#777" }}
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff size={20} />
                                                    ) : (
                                                        <Eye size={20} />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={textFieldStyles}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    name="newPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    label="New Password"
                                    value={userData.newPassword}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock size={20} style={{ color: "#777" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    edge="end"
                                                    sx={{ color: "#777" }}
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff size={20} />
                                                    ) : (
                                                        <Eye size={20} />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={textFieldStyles}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                )}

                {/* Action Buttons */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 2,
                        mt: 4,
                    }}
                >
                    {!isEditing ? (
                        <Button
                            variant="outlined"
                            startIcon={<Edit size={18} />}
                            onClick={handleEditToggle}
                            sx={{
                                ...outlinedButtonStyles,
                                "&:hover": {
                                    borderColor: "#d32f2f", // Blood red on hover
                                },
                            }}
                        >
                            Change Password
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                onClick={handleEditToggle}
                                sx={{
                                    ...outlinedButtonStyles,
                                    "&:hover": {
                                        borderColor: "#d32f2f", // Blood red on hover
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={
                                    isLoading ? (
                                        <CircularProgress size={20} color="inherit" />
                                    ) : (
                                        <Save size={18} />
                                    )
                                }
                                onClick={handleSave}
                                disabled={
                                    !userData.currentPassword ||
                                    !userData.newPassword ||
                                    isLoading
                                }
                                sx={{
                                    ...containedButtonStyles,
                                    backgroundColor: "#d32f2f",
                                    color: "white",
                                    "&:hover": {
                                        backgroundColor: "#b71c1c",
                                    },
                                    "&.Mui-disabled": {
                                        backgroundColor: "rgba(211, 47, 47, 0.5)",
                                        color: "rgba(255, 255, 255, 0.5)",
                                    },
                                }}
                            >
                                {isLoading ? "Updating..." : "Save Password"}
                            </Button>
                        </>
                    )}
                </Box>
            </Paper>
        </Box>
    );
};

// Reusable styles
const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
        color: "white",
        "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
        },
        "&:hover fieldset": {
            borderColor: "#d32f2f", // Blood red on hover
        },
        "&.Mui-focused fieldset": {
            borderColor: "#d32f2f", // Blood red when focused
        },
        "& .MuiInputBase-input.Mui-readOnly": {
            color: "#aaa",
            WebkitTextFillColor: "#aaa !important",
        },
    },
    "& .MuiInputLabel-root": {
        color: "#aaa",
    },
    "& .MuiInputLabel-root.Mui-focused": {
        color: "#d32f2f", // Blood red when focused
    },
};

const outlinedButtonStyles = {
    px: 3,
    py: 1,
    borderRadius: "8px",
    borderColor: "rgba(255,255,255,0.2)",
    color: "white",
};

const containedButtonStyles = {
    px: 3,
    py: 1,
    borderRadius: "8px",
    textTransform: "none",
};

export default ProfilePage;
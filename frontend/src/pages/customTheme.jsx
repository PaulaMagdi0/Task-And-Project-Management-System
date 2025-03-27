export const getDesignTokens = (mode) => ({
    palette: {
        mode,
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: '#9c27b0',
        },
        background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
});

export const inputsCustomizations = {
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
            size: 'small',
        },
        styleOverrides: {
            root: {
                marginBottom: '1rem',
            },
        },
    },
    MuiButton: {
        styleOverrides: {
            root: {
                textTransform: 'none',
            },
        },
    },
};
import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { createTheme, ThemeProvider, useColorScheme } from '@mui/material/styles';
import { getDesignTokens, inputsCustomizations } from './customTheme';

const providers = [
    { id: 'github', name: 'GitHub' },
    { id: 'google', name: 'Google' },
    { id: 'credentials', name: 'Email and Password' },

];

const signIn = async (provider) => {
    const promise = new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Sign in with ${provider.id}`);
            resolve({ error: 'This is a mock error message.' });
        }, 500);
    });
    return promise;
};

export default function ThemeSignInPage() {
    const { mode, setMode } = useColorScheme();
    const calculatedMode = mode || 'light';
    const brandingDesignTokens = getDesignTokens(calculatedMode);

    const THEME = createTheme({
        ...brandingDesignTokens,
        palette: {
            ...brandingDesignTokens.palette,
            mode: calculatedMode,
        },
        components: {
            ...inputsCustomizations,
        },
    });

    return (
        <ThemeProvider theme={THEME}>
            <AppProvider theme={THEME}>
                <SignInPage
                    signIn={signIn}
                    providers={providers}
                    slotProps={{ form: { noValidate: true } }}
                    sx={{
                        '& form > .MuiStack-root': {
                            marginTop: '2rem',
                            rowGap: '0.5rem',
                        },
                    }}
                />
            </AppProvider>
        </ThemeProvider>
    );
}
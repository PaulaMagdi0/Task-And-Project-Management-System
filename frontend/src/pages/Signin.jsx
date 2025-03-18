import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { SignInPage } from '@toolpad/core/SignInPage';
import { useTheme } from '@mui/material/styles';
import { Container } from '@mui/material';

const providers = [{ id: 'credentials', name: 'Credentials' }];
const BRANDING = {
    logo: (
        <img
            src="https://mui.com/static/logo.svg"
            alt="MUI logo"
            style={{ height: 24 }}
        />
    ),
    title: 'MUI',
};

const signIn = async (provider) => {
    const promise = new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Sign in with ${provider.id}`);
            resolve();
        }, 500);
    });
    return promise;
};

export default function SignIn() {
    const theme = useTheme();
    return (
        <Container maxWidth="sm" sx={{ marginTop: 4 }}>

            <AppProvider branding={BRANDING} theme={theme}>
                <SignInPage
                    signIn={signIn}
                    providers={providers}
                    slotProps={{ emailField: { autoFocus: false }, form: { noValidate: true } }}
                />
            </AppProvider>
        </Container>
    );
}

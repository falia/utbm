import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { medicalTheme } from './theme/medicalTheme';
import MedicalDiagnosisApp from './components/MedicalDiagnosisApp';

function App() {
  return (
    <ThemeProvider theme={medicalTheme}>
      <CssBaseline />
      <Authenticator>
        {({ signOut, user }) => (
          <MedicalDiagnosisApp />
        )}
      </Authenticator>
    </ThemeProvider>
  );
}

export default App;
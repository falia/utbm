import React, { useState } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { medicalTheme, medicalDarkTheme } from './theme/medicalTheme';
import MedicalDiagnosisApp from './components/MedicalDiagnosisApp';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={isDarkMode ? medicalDarkTheme : medicalTheme}>
      <CssBaseline />
      <MedicalDiagnosisApp />
    </ThemeProvider>
  );
}

export default App;
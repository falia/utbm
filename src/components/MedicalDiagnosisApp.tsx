import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { useAuthenticator } from '@aws-amplify/ui-react';
import HistoryComponent from './HistoryComponent';
import {
  Box,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableBody,
  Paper,
  TableContainer,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  Container,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
  Fab,
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AssessmentIcon from '@mui/icons-material/Assessment';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

// Styled Components
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    background: 'linear-gradient(135deg, #2E7D8A 0%, #4A90A4 100%)',
    color: theme.palette.common.white,
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.9rem',
    padding: '16px',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    cursor: 'pointer',
  },
}));

const UploadZone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: 16,
  padding: theme.spacing(4),
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  minHeight: 200,
  width: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(46, 125, 138, 0.15)',
  },
  '& *': {
    textAlign: 'center',
  },
}));

const ResultCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #F8FAFB 0%, #FFFFFF 100%)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  },
}));

const FeedbackCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #E3F2FD 0%, #F3E5F5 100%)',
  border: `1px solid ${theme.palette.primary.light}`,
  borderRadius: 16,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(46, 125, 138, 0.15)',
  },
}));

const drawerWidth = 280;

interface PredictionResult {
  statusCode: number;
  body: Array<{
    label: string;
    confidence: string;
  }>;
}

interface FeedbackState {
  rating: 'up' | 'down' | null;
  selectedClass: string;
  submitted: boolean;
}

interface HistoryItem {
  id: string;
  imageName: string;
  timestamp: string;
  predictions: string;
  imagePath: string;
  imageUrl?: string;
  feedback?: {
    rating: string;
    selectedClass: string;
    submittedAt: string;
  };
  topPrediction?: {
    label: string;
    confidence: string;
  };
}

type CurrentView = 'diagnosis' | 'history' | 'about' | 'settings';

export default function MedicalDiagnosisApp() {
  const { signOut, user } = useAuthenticator();
  const client = generateClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Navigation state
  const [currentView, setCurrentView] = useState<CurrentView>('diagnosis');
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Diagnosis states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<PredictionResult | null>(null);
  const [currentDiagnosisId, setCurrentDiagnosisId] = useState<string | null>(null);
  const [isFromHistory, setIsFromHistory] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    rating: null,
    selectedClass: '',
    submitted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const availableClasses = [
    'Démence légère', 
    'Démence modérée', 
    'Démence sévère', 
    'Contrôle normal'
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view: CurrentView) => {
    setCurrentView(view);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleSelectDiagnosis = (historyItem: HistoryItem) => {
    // Load diagnosis from history
    setCurrentView('diagnosis');
    setImagePreview(historyItem.imageUrl || null);
    setCurrentDiagnosisId(historyItem.id);
    setIsFromHistory(true);
    
    // Parse and set predictions
    try {
      const predictions = JSON.parse(historyItem.predictions);
      setRawResult({
        statusCode: 200,
        body: Array.isArray(predictions) ? predictions : JSON.parse(predictions)
      });
    } catch (error) {
      console.error('Error parsing predictions:', error);
      setRawResult(null);
    }
    
    // Set feedback if exists
    if (historyItem.feedback) {
      setFeedback({
        rating: historyItem.feedback.rating as 'up' | 'down',
        selectedClass: historyItem.feedback.selectedClass,
        submitted: true
      });
    } else {
      setFeedback({
        rating: null,
        selectedClass: '',
        submitted: false
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states for new diagnosis
    setRawResult(null);
    setCurrentDiagnosisId(null);
    setIsFromHistory(false);
    setFeedback({ rating: null, selectedClass: '', submitted: false });
    setSubmitError(null);
    setAnalysisProgress(0);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImagePreview(null);
    setRawResult(null);
    setCurrentDiagnosisId(null);
    setIsFromHistory(false);
    setFeedback({ rating: null, selectedClass: '', submitted: false });
    setSubmitError(null);
    setAnalysisProgress(0);
  };

  const handleSubmit = async () => {
    if (!imagePreview) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setAnalysisProgress(10);

    try {
      // Extract filename from file input or generate one
      const fileName = `diagnosis_${Date.now()}.jpg`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await client.graphql({
        query: `
          mutation Predict($image: String!, $imageName: String) {
            predict(image: $image, imageName: $imageName)
          }
        `,
        variables: { 
          image: imagePreview,
          imageName: fileName
        },
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if ('data' in response && response.data?.predict) {
        const parsed = JSON.parse(response.data?.predict);
        const responseBody = JSON.parse(parsed.body);
        
        // Set diagnosis ID for feedback
        setCurrentDiagnosisId(responseBody.diagnosisId);
        setIsFromHistory(false);
        
        // Parse predictions
        const predictions = JSON.parse(responseBody.predictions);
        setRawResult({
          statusCode: parsed.statusCode,
          body: predictions,
        });
        
        setFeedback({ rating: null, selectedClass: '', submitted: false });
      }
    } catch (error) {
      console.error('Failed to parse prediction result:', error);
      setSubmitError('Échec de l\'analyse. Veuillez réessayer.');
      setRawResult(null);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setAnalysisProgress(0), 1000);
    }
  };

  const handleFeedbackRating = (rating: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleClassSelection = (selectedClass: string) => {
    setFeedback(prev => ({ ...prev, selectedClass }));
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.rating || !currentDiagnosisId) return;
    if (feedback.rating === 'down' && !feedback.selectedClass) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedClass = feedback.rating === 'up' 
        ? rawResult?.body[0]?.label || 'Unknown'
        : feedback.selectedClass;

      await client.graphql({
        query: `
          mutation SaveFeedback(
            $diagnosisId: String!
            $rating: String!
            $selectedClass: String!
          ) {
            saveFeedback(
              diagnosisId: $diagnosisId
              rating: $rating
              selectedClass: $selectedClass
            )
          }
        `,
        variables: {
          diagnosisId: currentDiagnosisId,
          rating: feedback.rating,
          selectedClass: selectedClass,
        },
      });

      setFeedback(prev => ({ ...prev, submitted: true }));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitError('Échec de l\'envoi du retour. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'diagnosis': 
        return isFromHistory ? 'Diagnostic depuis l\'historique' : 'Diagnostic par IRM - Alzheimer';
      case 'history': return 'Historique des diagnostics';
      case 'about': return 'À propos de NeuroScan AI';
      case 'settings': return 'Paramètres';
      default: return 'NeuroScan AI';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return 'success';
    if (conf >= 60) return 'warning';
    return 'error';
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 3, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <LocalHospitalIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          NeuroScan AI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Diagnostic IRM Alzheimer
        </Typography>
      </Box>
      
      <List sx={{ px: 2, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentView === 'diagnosis'}
            onClick={() => handleViewChange('diagnosis')}
          >
            <ListItemIcon>
              <AssessmentIcon color={currentView === 'diagnosis' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Diagnostic" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentView === 'history'}
            onClick={() => handleViewChange('history')}
          >
            <ListItemIcon>
              <HistoryIcon color={currentView === 'history' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Historique" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentView === 'about'}
            onClick={() => handleViewChange('about')}
          >
            <ListItemIcon>
              <InfoIcon color={currentView === 'about' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="À propos" />
          </ListItemButton>
        </ListItem>
        
        <Divider sx={{ my: 2 }} />
        
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <BrightnessMediumIcon />
            </ListItemIcon>
            <ListItemText primary="Thème" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding>
          <ListItemButton 
            selected={currentView === 'settings'}
            onClick={() => handleViewChange('settings')}
          >
            <ListItemIcon>
              <SettingsIcon color={currentView === 'settings' ? 'primary' : 'inherit'} />
            </ListItemIcon>
            <ListItemText primary="Paramètres" />
          </ListItemButton>
        </ListItem>
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Card sx={{ p: 2, bgcolor: 'action.hover' }}>
          <Box display="flex" alignItems="center" gap={2}>
            <AccountCircleIcon color="primary" />
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {user?.signInDetails?.loginId || 'Utilisateur'}
              </Typography>
            </Box>
          </Box>
          <Button
            fullWidth
            startIcon={<ExitToAppIcon />}
            onClick={signOut}
            sx={{ mt: 2 }}
            size="small"
          >
            Déconnexion
          </Button>
        </Card>
      </Box>
    </Box>
  );

  const renderDiagnosisView = () => (
    <>
      {/* Progress Bar */}
      {analysisProgress > 0 && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress 
            variant="determinate" 
            value={analysisProgress}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Analyse en cours... {analysisProgress}%
          </Typography>
        </Box>
      )}

      {/* History indicator */}
      {isFromHistory && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            📁 Diagnostic chargé depuis l'historique - {currentDiagnosisId}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Upload Section - Full width when no results */}
        {!rawResult ? (
          <Grid item xs={12}>
            <Card sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
                <CloudUploadIcon color="primary" />
                Télécharger une IRM
              </Typography>
              
              {!imagePreview ? (
                <UploadZone component="label">
                  <input
                    hidden
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom align="center">
                    Sélectionner une image IRM
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Formats supportés: JPEG, PNG, DICOM
                  </Typography>
                  <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                    Taille max: 10MB
                  </Typography>
                </UploadZone>
              ) : (
                <Box>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 3,
                      boxShadow: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="IRM Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 400,
                        maxWidth: 600,
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                    >
                      Nouvelle image
                      <input hidden type="file" onChange={handleFileChange} accept="image/*" />
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isFromHistory}
                      startIcon={<SendIcon />}
                      size="large"
                    >
                      {isSubmitting ? 'Analyse...' : 'Analyser'}
                    </Button>
                    
                    <IconButton
                      onClick={handleReset}
                      color="error"
                    >
                      <CloseIcon />
                    </IconButton>
                  </Stack>

                  {submitError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {submitError}
                    </Alert>
                  )}
                </Box>
              )}
            </Card>
          </Grid>
        ) : (
          <>
            {/* Left Column - Upload with results */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ p: 3, height: 'fit-content' }}>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CloudUploadIcon color="primary" />
                  Image IRM
                  {isFromHistory && (
                    <Chip 
                      label="Historique" 
                      size="small" 
                      color="info" 
                      variant="outlined"
                    />
                  )}
                </Typography>
                
                <Box>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      mb: 3,
                      boxShadow: 2,
                    }}
                  >
                    <img
                      src={imagePreview!}
                      alt="IRM Preview"
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 400,
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      size="small"
                    >
                      Nouvelle image
                      <input hidden type="file" onChange={handleFileChange} accept="image/*" />
                    </Button>
                    
                    <Tooltip title="Nouveau diagnostic">
                      <IconButton
                        onClick={handleReset}
                        color="primary"
                        size="small"
                      >
                        <RestartAltIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              </Card>
            </Grid>

            {/* Right Column - Results */}
            <Grid item xs={12} lg={6}>
              <Stack spacing={3}>
                {/* Results Table */}
                <ResultCard>
                  <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AssessmentIcon color="primary" />
                      Résultats du diagnostic
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <StyledTableCell>Diagnostic</StyledTableCell>
                            <StyledTableCell align="right">Confiance</StyledTableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rawResult.body.map((item, index) => (
                            <StyledTableRow key={index}>
                              <StyledTableCell>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Typography fontWeight={index === 0 ? 600 : 400}>
                                    {item.label}
                                  </Typography>
                                  {index === 0 && (
                                    <Chip 
                                      label="Principal" 
                                      size="small" 
                                      color="primary"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              </StyledTableCell>
                              <StyledTableCell align="right">
                                <Chip
                                  label={`${item.confidence}%`}
                                  size="small"
                                  color={getConfidenceColor(item.confidence)}
                                  variant={index === 0 ? 'filled' : 'outlined'}
                                  sx={{ 
                                    fontWeight: index === 0 ? 600 : 400,
                                    minWidth: 60
                                  }}
                                />
                              </StyledTableCell>
                            </StyledTableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </ResultCard>

                {/* Feedback Section */}
                <FeedbackCard>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Évaluer ce diagnostic
                    </Typography>
                    
                    {!feedback.submitted ? (
                      <>
                        <Box display="flex" gap={2} mb={3} justifyContent="center">
                          <Tooltip title="Diagnostic correct">
                            <Fab
                              color={feedback.rating === 'up' ? 'primary' : 'default'}
                              onClick={() => handleFeedbackRating('up')}
                              size="medium"
                              sx={{
                                transform: feedback.rating === 'up' ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease'
                              }}
                            >
                              <ThumbUpIcon />
                            </Fab>
                          </Tooltip>
                          
                          <Tooltip title="Diagnostic incorrect">
                            <Fab
                              color={feedback.rating === 'down' ? 'error' : 'default'}
                              onClick={() => handleFeedbackRating('down')}
                              size="medium"
                              sx={{
                                transform: feedback.rating === 'down' ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.2s ease'
                              }}
                            >
                              <ThumbDownIcon />
                            </Fab>
                          </Tooltip>
                        </Box>

                        {feedback.rating === 'down' && (
                          <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel>Diagnostic correct</InputLabel>
                            <Select
                              value={feedback.selectedClass}
                              label="Diagnostic correct"
                              onChange={(e) => handleClassSelection(e.target.value)}
                            >
                              {availableClasses.map((className) => (
                                <MenuItem key={className} value={className}>
                                  {className}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSubmitFeedback}
                          disabled={
                            !feedback.rating || 
                            (feedback.rating === 'down' && !feedback.selectedClass) || 
                            isSubmitting ||
                            !currentDiagnosisId
                          }
                          fullWidth
                          startIcon={<SendIcon />}
                          sx={{ py: 1.5 }}
                        >
                          {isSubmitting ? 'Envoi...' : 'Envoyer l\'évaluation'}
                        </Button>
                      </>
                    ) : (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        <Box display="flex" alignItems="center" gap={2}>
                          {feedback.rating === 'up' ? (
                            <ThumbUpIcon color="success" />
                          ) : (
                            <ThumbDownIcon color="error" />
                          )}
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              Merci pour votre retour !
                            </Typography>
                            <Typography variant="body2">
                              {feedback.rating === 'up' 
                                ? 'Vous avez confirmé la justesse du diagnostic.'
                                : `Vous avez indiqué: "${feedback.selectedClass}"`
                              }
                            </Typography>
                          </Box>
                        </Box>
                      </Alert>
                    )}
                  </CardContent>
                </FeedbackCard>

                {/* Medical Disclaimer */}
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={500} gutterBottom>
                    ⚕️ Avertissement
                  </Typography>
                  <Typography variant="body2">
Cet outil d'intelligence artificielle est conçu pour soutenir les professionnels de santé, sans toutefois se substituer à un diagnostic médical effectué par un professionnel qualifié. Il est toujours recommandé de consulter un spécialiste médical pour obtenir un diagnostic final.
                  </Typography>
                </Alert>
              </Stack>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'diagnosis':
        return renderDiagnosisView();
      case 'history':
        return <HistoryComponent onSelectDiagnosis={handleSelectDiagnosis} />;
      case 'about':
        return (
          <Card sx={{ p: 4, textAlign: 'center', maxWidth: 600, mx: 'auto' }}>
            <LocalHospitalIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>NeuroScan AI</Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              v0.01 - Diagnostic de la maladie d'Alzheimer à l'aide de l'IRM
            </Typography>
            <Divider sx={{ my: 3 }} />
            <Typography variant="body1" paragraph>
              Système d'aide au diagnostic utilisant l'intelligence artificielle pour analyser 
              les images IRM et détecter les signes de la maladie d'Alzheimer.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Développé pour assister les professionnels de santé dans leurs diagnostics, 
              ce système combine apprentissage automatique avancé et interface intuitive 
              pour une analyse rapide et précise des scans cérébraux.
            </Typography>
          </Card>
        );
      case 'settings':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Préférences utilisateur</Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Langue</InputLabel>
                    <Select defaultValue="fr" label="Langue">
                      <MenuItem value="fr">Français</MenuItem>
                      <MenuItem value="en">English</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Notifications</InputLabel>
                    <Select defaultValue="enabled" label="Notifications">
                      <MenuItem value="enabled">Activées</MenuItem>
                      <MenuItem value="disabled">Désactivées</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Statistiques</Typography>
                <Stack spacing={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Diagnostics effectués:</Typography>
                    <Chip label="--" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Feedbacks donnés:</Typography>
                    <Chip label="--" size="small" />
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Précision moyenne:</Typography>
                    <Chip label="--%" size="small" color="success" />
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        );
      default:
        return renderDiagnosisView();
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {(currentView === 'diagnosis' && rawResult) || isFromHistory ? (
            <IconButton
              color="inherit"
              onClick={handleReset}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          ) : null}
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getViewTitle()}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {currentView === 'diagnosis' && rawResult && (
              <Chip 
                label={`ID: ${currentDiagnosisId?.slice(0, 8)}...`}
                size="small" 
                variant="outlined"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
            )}
            <Chip 
              label="v0.1" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ color: 'primary.main' }}
            />
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {renderCurrentView()}
        </Container>
      </Box>
    </Box>
  );
}
import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { styled } from '@mui/material/styles';
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
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import SendIcon from '@mui/icons-material/Send';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const FeedbackCard = styled(Card)(({ theme }) => ({
  marginTop: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
}));

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

export default function ImageUploader() {
  const client = generateClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<PredictionResult | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>({
    rating: null,
    selectedClass: '',
    submitted: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states when new image is selected
    setRawResult(null);
    setFeedback({ rating: null, selectedClass: '', submitted: false });
    setSubmitError(null);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImagePreview(null);
    setRawResult(null);
    setFeedback({ rating: null, selectedClass: '', submitted: false });
    setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (!imagePreview) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await client.graphql({
        query: `
          mutation Predict($image: String!) {
            predict(image: $image)
          }
        `,
        variables: { image: imagePreview },
      });

      if ('data' in response && response.data?.predict) {
        const parsed = JSON.parse(response.data?.predict);
        const bodyArray = JSON.parse(parsed.body);
        setRawResult({
          statusCode: parsed.statusCode,
          body: bodyArray,
        });
        // Reset feedback state for new prediction
        setFeedback({ rating: null, selectedClass: '', submitted: false });
      }
    } catch (error) {
      console.error('Failed to parse prediction result:', error);
      setSubmitError('Failed to get prediction. Please try again.');
      setRawResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackRating = (rating: 'up' | 'down') => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleClassSelection = (selectedClass: string) => {
    setFeedback(prev => ({ ...prev, selectedClass }));
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.rating || !feedback.selectedClass || !rawResult) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await client.graphql({
        query: `
          mutation SaveFeedback(
            $rating: String!
            $selectedClass: String!
            $predictions: String!
            $timestamp: String!
          ) {
            saveFeedback(
              rating: $rating
              selectedClass: $selectedClass
              predictions: $predictions
              timestamp: $timestamp
            )
          }
        `,
        variables: {
          rating: feedback.rating,
          selectedClass: feedback.selectedClass,
          predictions: JSON.stringify(rawResult.body),
          timestamp: new Date().toISOString(),
        },
      });

      setFeedback(prev => ({ ...prev, submitted: true }));
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box 
      p={isSmall ? 2 : 4} 
      display="flex" 
      flexDirection={isMobile ? "column" : "row"} 
      alignItems="flex-start" 
      gap={isMobile ? 3 : 4}
    >
      {/* Left Side - Upload and Preview */}
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        gap={2} 
        flexBasis={isMobile ? "100%" : "50%"} 
        width={isMobile ? "100%" : "50%"}
      >
        {!imagePreview && (
          <Button 
            variant="outlined" 
            component="label"
            size={isSmall ? "medium" : "large"}
            sx={{ minWidth: isSmall ? 120 : 150 }}
          >
            Upload Image
            <input hidden type="file" onChange={handleFileChange} accept="image/*" />
          </Button>
        )}

        {imagePreview && (
          <Box mt={2} width="100%" display="flex" flexDirection="column" alignItems="center">
            <Box 
              display="flex" 
              justifyContent="center"
              sx={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 400,
              }}
            >
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  width: '100%',
                  height: 'auto',
                  maxHeight: isMobile ? 250 : 300,
                  objectFit: 'contain',
                  borderRadius: 8,
                }} 
              />
            </Box>
            
            <Divider sx={{ width: '100%', my: 2 }} />
            
            <Stack 
              direction={isSmall ? "column" : "row"} 
              spacing={2} 
              alignItems="center"
              width="100%"
            >
              <Button variant="outlined" component="label" size={isSmall ? "small" : "medium"}>
                Upload New
                <input hidden type="file" onChange={handleFileChange} accept="image/*" />
              </Button>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                size={isSmall ? "small" : "medium"}
                startIcon={<SendIcon />}
              >
                {isSubmitting ? 'Processing...' : 'Submit Image'}
              </Button>
              
              <IconButton 
                size={isSmall ? "small" : "medium"} 
                color="primary" 
                onClick={handleReset}
              >
                <CloseIcon />
              </IconButton>
            </Stack>

            {submitError && (
              <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                {submitError}
              </Alert>
            )}
          </Box>
        )}
      </Box>

      {/* Right Side - Results and Feedback */}
      <Box flexBasis={isMobile ? "100%" : "50%"} width={isMobile ? "100%" : "50%"}>
        <Typography variant={isSmall ? "h6" : "h5"} gutterBottom>
          Prediction Results
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table size={isSmall ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <StyledTableCell align="left">Category</StyledTableCell>
                <StyledTableCell align="left">Confidence (%)</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rawResult ? (
                rawResult.body.map((item, index) => (
                  <StyledTableRow key={index}>
                    <StyledTableCell sx={{ fontWeight: 'bold' }}>
                      {item.label}
                    </StyledTableCell>
                    <StyledTableCell>{item.confidence}</StyledTableCell>
                  </StyledTableRow>
                ))
              ) : (
                <StyledTableRow>
                  <StyledTableCell colSpan={2} align="center">
                    No data yet. Upload an image and submit to see predictions.
                  </StyledTableCell>
                </StyledTableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Feedback Section */}
        {rawResult && (
          <FeedbackCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rate this prediction
              </Typography>
              
              {!feedback.submitted ? (
                <>
                  {/* Rating Buttons */}
                  <Box display="flex" gap={2} mb={3} justifyContent="center">
                    <IconButton
                      onClick={() => handleFeedbackRating('up')}
                      color={feedback.rating === 'up' ? 'primary' : 'default'}
                      size={isSmall ? "medium" : "large"}
                      sx={{
                        backgroundColor: feedback.rating === 'up' ? 'primary.light' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      }}
                    >
                      <ThumbUpIcon />
                    </IconButton>
                    
                    <IconButton
                      onClick={() => handleFeedbackRating('down')}
                      color={feedback.rating === 'down' ? 'error' : 'default'}
                      size={isSmall ? "medium" : "large"}
                      sx={{
                        backgroundColor: feedback.rating === 'down' ? 'error.light' : 'transparent',
                        '&:hover': {
                          backgroundColor: 'error.light',
                        },
                      }}
                    >
                      <ThumbDownIcon />
                    </IconButton>
                  </Box>

                  {/* Class Selection */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Correct Class</InputLabel>
                    <Select
                      value={feedback.selectedClass}
                      label="Correct Class"
                      onChange={(e) => handleClassSelection(e.target.value)}
                      size={isSmall ? "small" : "medium"}
                    >
                      {availableClasses.map((className) => (
                        <MenuItem key={className} value={className}>
                          {className}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Submit Feedback Button */}
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitFeedback}
                    disabled={!feedback.rating || !feedback.selectedClass || isSubmitting}
                    fullWidth
                    size={isSmall ? "small" : "medium"}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </>
              ) : (
                <Alert severity="success">
                  Thank you for your feedback! Your response has been saved.
                </Alert>
              )}
            </CardContent>
          </FeedbackCard>
        )}
      </Box>
    </Box>
  );
}
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
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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

export default function ImageUploader() {
  const client = generateClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setImagePreview(null);
    setRawResult(null);
  };

  const handleSubmit = async () => {
    if (!imagePreview) return;

    const response = await client.graphql({
      query: `
        mutation Predict($image: String!) {
          predict(image: $image)
        }
      `,
      variables: { image: imagePreview },
    });

    try {
      if ('data' in response && response.data?.predict) {
        const parsed = JSON.parse(response.data?.predict);
        const bodyArray = JSON.parse(parsed.body);
        setRawResult({
          statusCode: parsed.statusCode,
          body: bodyArray,
        });
      }
    } catch (error) {
      console.error('Failed to parse prediction result:', error);
      setRawResult(null);
    }
  };

  return (
    <Box p={4} display="flex" flexDirection="row" alignItems="flex-start" gap={4}>
      {/* Left Side - Upload and Preview */}
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} flexBasis="50%" width="50%">
        {!imagePreview && (
          <Button variant="outlined" component="label">
            Upload Image
            <input hidden type="file" onChange={handleFileChange} accept="image/*" />
          </Button>
        )}

        {imagePreview && (
          <Box mt={2} width="100%" display="flex" flexDirection="column" alignItems="center">
            <Box display="flex" justifyContent="center">
              <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 300 }} />
            </Box>
            <Divider sx={{ width: '100%', my: 2 }} />
            <Box display="flex" flexDirection="row" gap={2} alignItems="center">
              <Button variant="outlined" component="label">
                Upload New Image
                <input hidden type="file" onChange={handleFileChange} accept="image/*" />
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                Submit Image
              </Button>
              <IconButton size="small" color="primary" onClick={handleReset}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* Right Side - Prediction Result Section */}
      <Box flexBasis="50%" width="50%">
        <Typography variant="h6" gutterBottom>
          Prediction Result
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell align="left">Category</StyledTableCell>
                <StyledTableCell align="left">Confidence (%)</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rawResult ? (
                rawResult.body.map((item: any, index: number) => (
                  <StyledTableRow key={index}>
                    <StyledTableCell sx={{ fontWeight: 'bold' }}>{item.label}</StyledTableCell>
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
      </Box>
    </Box>
  );
}

import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/api';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableContainer,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';

// Icons
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ImageIcon from '@mui/icons-material/Image';
import AssessmentIcon from '@mui/icons-material/Assessment';

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
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
}));

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

interface HistoryProps {
  onSelectDiagnosis: (diagnosis: HistoryItem) => void;
}

export default function HistoryComponent({ onSelectDiagnosis }: HistoryProps) {
  const client = generateClient();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.graphql({
        query: `
          query GetHistory($operation: String!) {
            getHistory(operation: $operation)
          }
        `,
        variables: { operation: 'list' },
      });

      if ('data' in response && response.data?.getHistory) {
        const parsed = JSON.parse(response.data.getHistory);
        const historyData = JSON.parse(parsed.body);
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFeedbackIcon = (feedback?: HistoryItem['feedback']) => {
    if (!feedback) return null;
    
    return feedback.rating === 'up' ? (
      <Tooltip title="Diagnostic confirmé correct">
        <ThumbUpIcon color="success" fontSize="small" />
      </Tooltip>
    ) : (
      <Tooltip title={`Diagnostic corrigé: ${feedback.selectedClass}`}>
        <ThumbDownIcon color="error" fontSize="small" />
      </Tooltip>
    );
  };

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 80) return 'success';
    if (conf >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Chargement de l'historique...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Aucun diagnostic dans l'historique
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vos analyses d'IRM apparaîtront ici après avoir effectué des diagnostics.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AssessmentIcon color="primary" />
          Historique des diagnostics
        </Typography>
        <Badge badgeContent={history.length} color="primary">
          <Chip 
            label={`${history.length} diagnostic${history.length > 1 ? 's' : ''}`}
            variant="outlined"
            color="primary"
          />
        </Badge>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <StyledTableCell>Image</StyledTableCell>
              <StyledTableCell>Nom du fichier</StyledTableCell>
              <StyledTableCell>Date & Heure</StyledTableCell>
              <StyledTableCell>Diagnostic principal</StyledTableCell>
              <StyledTableCell>Confiance</StyledTableCell>
              <StyledTableCell>Feedback</StyledTableCell>
              <StyledTableCell align="center">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item) => (
              <StyledTableRow 
                key={item.id}
                onClick={() => onSelectDiagnosis(item)}
              >
                <StyledTableCell>
                  <Avatar
                    variant="rounded"
                    sx={{ width: 48, height: 48 }}
                    src={item.imageUrl}
                  >
                    <ImageIcon />
                  </Avatar>
                </StyledTableCell>
                
                <StyledTableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {item.imageName}
                  </Typography>
                </StyledTableCell>
                
                <StyledTableCell>
                  <Typography variant="body2">
                    {formatDate(item.timestamp)}
                  </Typography>
                </StyledTableCell>
                
                <StyledTableCell>
                  {item.topPrediction ? (
                    <Typography variant="body2" fontWeight={500}>
                      {item.topPrediction.label}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Non disponible
                    </Typography>
                  )}
                </StyledTableCell>
                
                <StyledTableCell>
                  {item.topPrediction ? (
                    <Chip
                      label={`${item.topPrediction.confidence}%`}
                      size="small"
                      color={getConfidenceColor(item.topPrediction.confidence)}
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </StyledTableCell>
                
                <StyledTableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getFeedbackIcon(item.feedback)}
                    {!item.feedback && (
                      <Typography variant="caption" color="text.secondary">
                        Aucun feedback
                      </Typography>
                    )}
                  </Box>
                </StyledTableCell>
                
                <StyledTableCell align="center">
                  <Tooltip title="Voir les détails">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDiagnosis(item);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
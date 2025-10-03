'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { CreateHoldingData, PortfoliosApiClient } from 'lib/api/portfolios';

// Popular stock symbols for autocomplete
const POPULAR_SYMBOLS = [
  'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'SPY', 'QQQ', 'VTI', 'VOO', 'F', 'GM', 'DIS', 'INTC', 'AMD'
];

const apiClient = new PortfoliosApiClient();

interface AddHoldingFormProps {
  portfolioId: string;
  onSave: (holdingData: CreateHoldingData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form component for adding new holdings to a portfolio
 * @param props - Component props
 * @param props.portfolioId - The ID of the portfolio to add holdings to
 * @param props.onSave - Callback function when holding is saved
 * @param props.onCancel - Callback function when form is cancelled
 */
const AddHoldingForm: React.FC<AddHoldingFormProps> = ({
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateHoldingData>({
    symbol: '',
    shares: 0,
    costBasis: 0,
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatingSymbol, setValidatingSymbol] = useState(false);

  const handleSymbolChange = async (value: string) => {
    setFormData(prev => ({ ...prev, symbol: value.toUpperCase() }));
    setError(null);

    if (value.length >= 1) {
      setValidatingSymbol(true);
      try {
        // Validate symbol by trying to get a quote
        await apiClient.getStockQuote(value.toUpperCase());
      } catch {
        if (value.length >= 3) { // Only show error for longer symbols
          setError('Invalid stock symbol');
        }
      } finally {
        setValidatingSymbol(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.symbol || !formData.shares || !formData.costBasis || !formData.purchaseDate) {
      setError('All fields are required');
      return;
    }

    if (formData.shares <= 0) {
      setError('Shares must be greater than 0');
      return;
    }

    if (formData.costBasis <= 0) {
      setError('Cost basis must be greater than 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSave(formData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add holding';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      symbol: '',
      shares: 0,
      costBasis: 0,
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setError(null);
  };

  return (
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom>
          Add New Holding
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <Autocomplete
              options={POPULAR_SYMBOLS}
              freeSolo
              value={formData.symbol}
              onInputChange={(event, newValue) => {
                handleSymbolChange(newValue || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Stock Symbol"
                  required
                  placeholder="e.g., AAPL, GOOGL"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {validatingSymbol ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              label="Number of Shares"
              type="number"
              required
              fullWidth
              value={formData.shares || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                shares: parseFloat(e.target.value) || 0 
              }))}
              inputProps={{ min: 0, step: 0.001 }}
            />
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              label="Cost Basis (Price per Share)"
              type="number"
              required
              fullWidth
              value={formData.costBasis || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                costBasis: parseFloat(e.target.value) || 0 
              }))}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Box>

          <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
            <TextField
              label="Purchase Date"
              type="date"
              required
              fullWidth
              value={formData.purchaseDate}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                purchaseDate: e.target.value 
              }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Total Investment: ${(formData.shares * formData.costBasis).toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || validatingSymbol}
          >
            {loading ? 'Adding...' : 'Add Holding'}
          </Button>
        </Box>
      </Box>
  );
};

export default AddHoldingForm;
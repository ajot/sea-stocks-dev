'use client';

import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { CreatePortfolioData } from 'lib/api/portfolios';

interface CreatePortfolioFormProps {
  onSave: (portfolioData: CreatePortfolioData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Form component for creating new portfolios
 * @param props - Component props
 * @param props.onSave - Callback function when portfolio is saved
 * @param props.onCancel - Callback function when form is cancelled
 */
const CreatePortfolioForm: React.FC<CreatePortfolioFormProps> = ({
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreatePortfolioData>({
    name: '',
    description: '',
    type: 'PERSONAL'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Portfolio name is required');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Portfolio name must be less than 100 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData: CreatePortfolioData = {
        name: formData.name.trim(),
        type: formData.type
      };
      
      if (formData.description?.trim()) {
        submitData.description = formData.description.trim();
      }

      await onSave(submitData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create portfolio';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERSONAL'
    });
    setError(null);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom>
        Create New Portfolio
      </Typography>

      <Typography variant="body2" color="textSecondary" paragraph>
        Create a new portfolio to track your investments. You can organize different types of investments into separate portfolios.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <TextField
            label="Portfolio Name"
            required
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., My Growth Portfolio, Retirement Fund"
            inputProps={{ maxLength: 100 }}
            helperText={`${formData.name.length}/100 characters`}
          />
        </Box>

        <Box>
          <FormControl fullWidth>
            <InputLabel>Portfolio Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER' }))}
              label="Portfolio Type"
            >
              <MenuItem value="PERSONAL">Personal</MenuItem>
              <MenuItem value="RETIREMENT">Retirement (401k, IRA)</MenuItem>
              <MenuItem value="TAXABLE">Taxable Brokerage</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of your portfolio goals or strategy..."
            inputProps={{ maxLength: 500 }}
            helperText={`${formData.description?.length || 0}/500 characters`}
          />
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
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Portfolio'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreatePortfolioForm;
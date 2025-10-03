'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Portfolio, Holding, PortfoliosApiClient } from 'lib/api/portfolios';

interface PortfolioDetailsProps {
  portfolio: Portfolio;
  onAddHolding: () => void;
  onEditHolding: (holdingId: string) => void;
  onDeleteHolding: (holdingId: string) => void;
  onPricesUpdated?: () => void;
}

const PortfolioDetails: React.FC<PortfolioDetailsProps> = ({
  portfolio,
  onAddHolding,
  onEditHolding,
  onDeleteHolding,
  onPricesUpdated
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuHoldingId, setMenuHoldingId] = useState<string | null>(null);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  const portfoliosApi = new PortfoliosApiClient();

  // Auto-refresh prices on mount if portfolio has holdings
  useEffect(() => {
    const autoRefreshPrices = async () => {
      // Only auto-refresh if there are holdings
      if (!portfolio.holdings || portfolio.holdings.length === 0) {
        return;
      }

      // Auto-refresh prices silently in background
      try {
        await portfoliosApi.updatePortfolioPrices(portfolio.id);

        // Notify parent to refresh portfolio data
        if (onPricesUpdated) {
          onPricesUpdated();
        }
      } catch (error) {
        console.error('[Auto-refresh] Error updating prices:', error);
        // Silently fail - user can still manually refresh
      }
    };

    autoRefreshPrices();
  }, [portfolio.id]); // Only run when portfolio changes

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, holdingId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuHoldingId(holdingId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuHoldingId(null);
  };

  const handleRefreshPrices = async () => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      setSnackbarMessage('No holdings to update prices for');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      return;
    }

    setIsUpdatingPrices(true);
    try {
      const result = await portfoliosApi.updatePortfolioPrices(portfolio.id);
      setSnackbarMessage(`Updated ${result.updated} of ${result.total} symbols`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Notify parent to refresh portfolio data
      if (onPricesUpdated) {
        onPricesUpdated();
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      setSnackbarMessage('Failed to update prices. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsUpdatingPrices(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Calculate portfolio totals
  const calculateTotals = () => {
    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      return { totalValue: 0, totalCost: 0, gainLoss: 0, gainLossPercent: 0 };
    }

    let totalValue = 0;
    let totalCost = 0;

    portfolio.holdings.forEach(holding => {
      const currentPrice = Number(holding.currentPrice || holding.costBasis);
      const shares = Number(holding.shares);
      const costBasisPrice = Number(holding.costBasis);
      const holdingValue = shares * currentPrice;
      const holdingCost = shares * costBasisPrice;
      
      totalValue += holdingValue;
      totalCost += holdingCost;
    });

    const gainLoss = totalValue - totalCost;
    const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

    return { totalValue, totalCost, gainLoss, gainLossPercent };
  };

  // Calculate individual holding performance
  const calculateHoldingPerformance = (holding: Holding) => {
    const currentPrice = Number(holding.currentPrice || holding.costBasis);
    const shares = Number(holding.shares);
    const costBasisPrice = Number(holding.costBasis);
    const currentValue = shares * currentPrice;
    const costBasis = shares * costBasisPrice;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return { currentValue, gainLoss, gainLossPercent };
  };

  const { totalValue, totalCost, gainLoss, gainLossPercent } = calculateTotals();
  const isPortfolioPositive = gainLoss >= 0;

  return (
    <Box>
      {/* Portfolio Header */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {portfolio.name}
          </Typography>
          <Chip label={portfolio.type} variant="outlined" />
        </Box>
        
        {portfolio.description && (
          <Typography variant="body1" color="textSecondary" mb={2}>
            {portfolio.description}
          </Typography>
        )}

        {/* Portfolio Performance Summary */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Value
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Cost
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  ${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ 
              bgcolor: isPortfolioPositive ? 'success.light' : 'error.light',
              color: isPortfolioPositive ? 'success.contrastText' : 'error.contrastText'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  {isPortfolioPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  <Typography variant="h6" ml={1}>
                    Total Gain/Loss
                  </Typography>
                </Box>
                <Typography variant="h4" fontWeight="bold">
                  {isPortfolioPositive ? '+' : ''}${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="h6">
                  ({isPortfolioPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Holdings Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          Holdings ({portfolio.holdings?.length || 0})
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={isUpdatingPrices ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={handleRefreshPrices}
            disabled={isUpdatingPrices || !portfolio.holdings || portfolio.holdings.length === 0}
          >
            {isUpdatingPrices ? 'Updating...' : 'Refresh Prices'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddHolding}
          >
            Add Holding
          </Button>
        </Box>
      </Box>

      {/* Holdings Table */}
      {!portfolio.holdings || portfolio.holdings.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography variant="h6" color="textSecondary" mb={2}>
            No holdings in this portfolio yet
          </Typography>
          <Typography color="textSecondary" mb={3}>
            Add your first stock or ETF to start tracking your investments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAddHolding}
          >
            Add Your First Holding
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Symbol</strong></TableCell>
                <TableCell align="right"><strong>Shares</strong></TableCell>
                <TableCell align="right"><strong>Cost Basis</strong></TableCell>
                <TableCell align="right"><strong>Current Price</strong></TableCell>
                <TableCell align="right"><strong>Current Value</strong></TableCell>
                <TableCell align="right"><strong>Gain/Loss</strong></TableCell>
                <TableCell align="right"><strong>%</strong></TableCell>
                <TableCell><strong>Sector</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {portfolio.holdings.map((holding) => {
                const { currentValue, gainLoss, gainLossPercent } = calculateHoldingPerformance(holding);
                const isPositive = gainLoss >= 0;
                const currentPrice = holding.currentPrice || holding.costBasis;

                return (
                  <TableRow key={holding.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{holding.symbol}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {holding.shares.toLocaleString('en-US', { 
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 8 
                      })}
                    </TableCell>
                    <TableCell align="right">
                      ${Number(holding.costBasis).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${Number(currentPrice).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={isPositive ? 'success.main' : 'error.main'} fontWeight="bold">
                        {isPositive ? '+' : ''}${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={isPositive ? 'success.main' : 'error.main'} fontWeight="bold">
                        {isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {holding.sector ? (
                        <Chip label={holding.sector} size="small" variant="outlined" />
                      ) : (
                        <Typography variant="body2" color="textSecondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, holding.id)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Holdings Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (menuHoldingId) onEditHolding(menuHoldingId);
          handleCloseMenu();
        }}>
          Edit Holding
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuHoldingId) onDeleteHolding(menuHoldingId);
          handleCloseMenu();
        }}>
          Delete Holding
        </MenuItem>
      </Menu>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PortfolioDetails;
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Dialog, 
  DialogContent,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Portfolio, PortfoliosApiClient } from 'lib/api/portfolios';
import PageContainer from '../Common/PageContainer/PageContainer';
import Toast from '../Common/Toast/Toast';
import ConfirmationDialog from '../MyNotes/ConfirmationDialog/ConfirmationDialog';
import PortfolioDetails from './PortfolioDetails';
import CreatePortfolioForm from './CreatePortfolioForm';
import AddHoldingForm from './AddHoldingForm';

// Create an instance of the ApiClient
const apiClient = new PortfoliosApiClient();

/**
 * PortfolioDashboard component
 * Main dashboard for managing investment portfolios and holdings
 */
const PortfolioDashboard: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isCreatePortfolioOpen, setIsCreatePortfolioOpen] = useState(false);
  const [isPortfolioDetailsOpen, setIsPortfolioDetailsOpen] = useState(false);
  const [isEditPortfolioOpen, setIsEditPortfolioOpen] = useState(false);
  const [isAddHoldingOpen, setIsAddHoldingOpen] = useState(false);
  const [selectedPortfolioForHolding, setSelectedPortfolioForHolding] = useState<string | null>(null);
  
  // Confirmation dialog
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [portfolioToDelete, setPortfolioToDelete] = useState<string | null>(null);
  
  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Menu state for portfolio actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuPortfolioId, setMenuPortfolioId] = useState<string | null>(null);

  // Fetch portfolios from API
  const fetchPortfolios = useCallback(async () => {
    try {
      setIsLoading(true);
      const { portfolios } = await apiClient.getPortfolios();
      setPortfolios(portfolios);
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolios:', err);
      setError('Failed to load portfolios. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  // Portfolio value calculation helper
  const calculatePortfolioValue = (portfolio: Portfolio): { totalValue: number; totalCost: number; gainLoss: number; gainLossPercent: number } => {
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

  // Handle portfolio creation
  const handleCreatePortfolio = async (portfolioData: { name: string; description?: string; type?: 'PERSONAL' | 'RETIREMENT' | 'TAXABLE' | 'OTHER' }) => {
    try {
      await apiClient.createPortfolio(portfolioData);
      setIsCreatePortfolioOpen(false);
      await fetchPortfolios();
      
      setToastMessage('Portfolio created successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err) {
      console.error('Error creating portfolio:', err);
      setToastMessage('Failed to create portfolio');
      setToastSeverity('error');
      setToastOpen(true);
    }
  };

  // Handle portfolio deletion
  const handleDeleteConfirmation = (portfolioId: string) => {
    setPortfolioToDelete(portfolioId);
    setDeleteConfirmationOpen(true);
    handleCloseMenu();
  };

  const handleConfirmDelete = async () => {
    if (portfolioToDelete) {
      try {
        await apiClient.deletePortfolio(portfolioToDelete);
        await fetchPortfolios();
        
        setToastMessage('Portfolio deleted successfully');
        setToastSeverity('success');
        setToastOpen(true);
      } catch (err) {
        console.error('Error deleting portfolio:', err);
        setToastMessage('Failed to delete portfolio');
        setToastSeverity('error');
        setToastOpen(true);
      } finally {
        setDeleteConfirmationOpen(false);
        setPortfolioToDelete(null);
      }
    }
  };

  // Handle portfolio selection for details view
  const handleViewPortfolio = async (portfolioId: string) => {
    try {
      const { portfolio } = await apiClient.getPortfolio(portfolioId);
      setSelectedPortfolio(portfolio);
      setIsPortfolioDetailsOpen(true);
    } catch (err) {
      console.error('Error fetching portfolio details:', err);
      setToastMessage('Failed to load portfolio details');
      setToastSeverity('error');
      setToastOpen(true);
    }
  };

  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, portfolioId: string) => {
    setAnchorEl(event.currentTarget);
    setMenuPortfolioId(portfolioId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuPortfolioId(null);
  };

  const handleCloseToast = () => {
    setToastOpen(false);
  };

  // Handle adding holdings
  const handleAddHolding = (portfolioId: string) => {
    setSelectedPortfolioForHolding(portfolioId);
    setIsAddHoldingOpen(true);
  };

  const handleCreateHolding = async (holdingData: { symbol: string; shares: number; costBasis: number; purchaseDate: string }) => {
    if (!selectedPortfolioForHolding) return;

    try {
      await apiClient.createHolding(selectedPortfolioForHolding, holdingData);
      setIsAddHoldingOpen(false);
      setSelectedPortfolioForHolding(null);
      
      // Refresh portfolio data if details modal is open
      if (selectedPortfolio && selectedPortfolio.id === selectedPortfolioForHolding) {
        const { portfolio } = await apiClient.getPortfolio(selectedPortfolio.id);
        setSelectedPortfolio(portfolio);
      }
      
      // Refresh portfolios list to update totals
      await fetchPortfolios();
      
      setToastMessage('Holding added successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err: any) {
      console.error('Error creating holding:', err);
      setToastMessage(err.message || 'Failed to add holding');
      setToastSeverity('error');
      setToastOpen(true);
    }
  };

  // Handle deleting holdings
  const handleDeleteHolding = async (holdingId: string) => {
    if (!selectedPortfolio) return;

    try {
      await apiClient.deleteHolding(selectedPortfolio.id, holdingId);
      
      // Refresh portfolio data
      const { portfolio } = await apiClient.getPortfolio(selectedPortfolio.id);
      setSelectedPortfolio(portfolio);
      
      // Refresh portfolios list to update totals
      await fetchPortfolios();
      
      setToastMessage('Holding deleted successfully');
      setToastSeverity('success');
      setToastOpen(true);
    } catch (err: any) {
      console.error('Error deleting holding:', err);
      setToastMessage('Failed to delete holding');
      setToastSeverity('error');
      setToastOpen(true);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="My Portfolios">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading portfolios...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="My Portfolios">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography color="error">{error}</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="My Portfolios">
      {/* Header with Create Portfolio Button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Investment Portfolios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsCreatePortfolioOpen(true)}
        >
          Create Portfolio
        </Button>
      </Box>

      {/* Portfolios Grid */}
      {portfolios.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" mb={2}>
            No portfolios yet
          </Typography>
          <Typography color="textSecondary" mb={3}>
            Create your first portfolio to start tracking your investments
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreatePortfolioOpen(true)}
          >
            Create Your First Portfolio
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {portfolios.map((portfolio) => {
            const { totalValue, gainLoss, gainLossPercent } = calculatePortfolioValue(portfolio);
            const isPositive = gainLoss >= 0;
            
            return (
              <Grid item xs={12} sm={6} md={4} key={portfolio.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box flex={1} onClick={() => handleViewPortfolio(portfolio.id)}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {portfolio.name}
                        </Typography>
                        <Chip 
                          label={portfolio.type} 
                          size="small" 
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, portfolio.id)}
                        sx={{ mt: -1, mr: -1 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                    
                    <Box onClick={() => handleViewPortfolio(portfolio.id)}>
                      {portfolio.description && (
                        <Typography variant="body2" color="textSecondary" mb={2}>
                          {portfolio.description}
                        </Typography>
                      )}
                      
                      <Box mt={2}>
                        <Typography variant="h5" fontWeight="bold">
                          ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color={isPositive ? 'success.main' : 'error.main'}
                          fontWeight="bold"
                        >
                          {isPositive ? '+' : ''}${gainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          ({isPositive ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {portfolio.holdings?.length || 0} holdings
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Portfolio Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          if (menuPortfolioId) handleViewPortfolio(menuPortfolioId);
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          // TODO: Handle edit portfolio
          handleCloseMenu();
        }}>
          Edit Portfolio
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuPortfolioId) handleDeleteConfirmation(menuPortfolioId);
        }}>
          Delete Portfolio
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmationOpen}
        title="Delete Portfolio"
        message="Are you sure you want to delete this portfolio? This will also delete all holdings within it. This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmationOpen(false)}
        confirmButtonColor="error"
      />

      {/* Toast notifications */}
      <Toast
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={handleCloseToast}
      />

      {/* Create Portfolio Modal */}
      <Dialog open={isCreatePortfolioOpen} onClose={() => setIsCreatePortfolioOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <CreatePortfolioForm
            onSave={handleCreatePortfolio}
            onCancel={() => setIsCreatePortfolioOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Portfolio Details Modal */}
      <Dialog open={isPortfolioDetailsOpen} onClose={() => setIsPortfolioDetailsOpen(false)} maxWidth="lg" fullWidth>
        <DialogContent>
          {selectedPortfolio && (
            <PortfolioDetails
              portfolio={selectedPortfolio}
              onAddHolding={() => handleAddHolding(selectedPortfolio.id)}
              onEditHolding={(holdingId) => {
                // TODO: Handle edit holding
                console.log('Edit holding:', holdingId);
              }}
              onDeleteHolding={handleDeleteHolding}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Holding Modal */}
      <Dialog open={isAddHoldingOpen} onClose={() => {
        setIsAddHoldingOpen(false);
        setSelectedPortfolioForHolding(null);
      }} maxWidth="md" fullWidth>
        <DialogContent>
          {selectedPortfolioForHolding && (
            <AddHoldingForm
              portfolioId={selectedPortfolioForHolding}
              onSave={handleCreateHolding}
              onCancel={() => {
                setIsAddHoldingOpen(false);
                setSelectedPortfolioForHolding(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default PortfolioDashboard;
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { calendarApi } from '../api';
import { setSelectedCalendarClient } from '../helpers/calendarClient';

export const CalendarClientSelectionPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await calendarApi.get('/calendars/clients');
      setClients(Array.isArray(data.clients) ? data.clients : []);
    } catch (requestError) {
      setError(requestError.response?.data?.msg || 'No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const openClient = (client) => {
    setSelectedCalendarClient(client);
    navigate('/monitor');
  };

  return (
    <Box sx={{ minHeight: '100dvh', p: { xs: 2, md: 5 }, bgcolor: 'background.default', color: 'text.primary' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 4, md: 7 } }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate('/')}>Módulos</Button>
        <Typography variant="overline" color="text.secondary">ENTA TOOLS · CALENDARS</Typography>
      </Stack>

      <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: 30, md: 42 } }}>
          Elegí un cliente
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Seleccioná el conjunto de calendarios con el que querés trabajar.
        </Typography>

        {loading && <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>}
        {error && <Alert severity="error" action={<Button color="inherit" onClick={loadClients}>Reintentar</Button>}>{error}</Alert>}
        {!loading && !error && clients.length === 0 && (
          <Alert severity="info">No hay clientes con calendarios disponibles.</Alert>
        )}

        {!loading && !error && clients.length > 0 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
            {clients.map((client) => (
              <Paper
                key={client}
                component="button"
                onClick={() => openClient(client)}
                elevation={0}
                sx={{
                  minHeight: 170,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  color: 'text.primary',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
                  '&:hover, &:focus-visible': { borderColor: 'primary.main', transform: 'translateY(-3px)', boxShadow: 4, outline: 'none' },
                }}
              >
                <BusinessRoundedIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{client}</Typography>
                <Typography variant="body2" color="primary.main">Abrir calendarios →</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

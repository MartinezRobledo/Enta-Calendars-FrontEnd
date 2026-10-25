import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { Navbar } from '../components';
import { calendarApi } from '../api';

export const AuditPage = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const loadAudit = useCallback(async () => {
    setLoading(true);
    try { const { data } = await calendarApi.get('/audit?limit=200'); setEntries(data.entries || []); setError(''); }
    catch (e) { setError(e.response?.data?.msg || 'No se pudo cargar la auditoría.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadAudit(); }, [loadAudit]);

  const restore = async (entry) => {
    try {
      await calendarApi.post(`/calendars/restore/${encodeURIComponent(entry.entityId)}`);
      setMessage(`Calendario restaurado: ${entry.metadata?.title || entry.summary}`); await loadAudit();
    } catch (e) { setError(e.response?.data?.msg || 'No se pudo restaurar el calendario.'); }
  };

  return <><Navbar /><Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
      <Typography variant="h4">Auditoría</Typography><Button onClick={loadAudit}>Actualizar</Button>
    </Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    {loading ? <Typography>Cargando registro…</Typography> : entries.length === 0 ? <Typography>No hay actividad registrada.</Typography> : <Stack spacing={1}>
      {entries.map((entry) => <Paper key={entry._id} sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight="bold">{entry.summary}</Typography>
            <Typography variant="body2" color="text.secondary">{entry.actorName} · {new Date(entry.createdAt).toLocaleString()} · {entry.action}</Typography>
            {entry.action !== 'user.list' && entry.metadata && Object.keys(entry.metadata).length > 0 && <Box component="details" sx={{ mt: 1 }}>
              <Box component="summary" sx={{ cursor: 'pointer', color: 'text.secondary' }}>Ver detalles</Box>
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 12, mb: 0 }}>{JSON.stringify(entry.metadata, null, 2)}</Box>
            </Box>}
          </Box>
          {entry.action === 'calendar.delete' && <Button variant="outlined" onClick={() => restore(entry)}>Restaurar calendario</Button>}
        </Stack>
      </Paper>)}
    </Stack>}
  </Box></>;
};

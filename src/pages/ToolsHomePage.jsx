import { Box, Button, Card, CardActions, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Link } from 'react-router-dom';
import { Navbar } from '../components';

export const ToolsHomePage = () => (
  <>
    <Navbar />
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 4, md: 7 } }}>
      <Typography variant="h3" component="h1" fontWeight={700} sx={{ mb: 1 }}>
        Enta Tools
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 720 }}>
        Herramientas de Enta Consulting para simplificar el trabajo diario. Selecciona una herramienta para continuar.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={8} md={6}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <CalendarMonthIcon color="primary" sx={{ fontSize: 38 }} />
                <Typography variant="h5" component="h2" fontWeight={600}>Calendarios</Typography>
              </Stack>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Crea y administra calendarios de automatización, combina reglas por capas y exporta fechas para tus plataformas RPA.
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Chip label="Blue Prism" size="small" />
                <Chip label="UiPath" size="small" />
                <Chip label="Automation Anywhere" size="small" />
              </Stack>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
              <Button component={Link} to="/monitor" variant="contained">Abrir calendarios</Button>
              <Button component={Link} to="/crear" variant="outlined">Crear calendario</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  </>
);

import { Box, ButtonBase, IconButton, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ExitToAppRoundedIcon from '@mui/icons-material/ExitToAppRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks';
import UiPathLogo from '../assets/images/uipath-logo.svg';
import AutomationAnywhereLogo from '../assets/images/Logo-Automation-Anywhere.webp';
import EntaCalendarsLogo from '../assets/images/logo-enta-horizontal-h100-Calendars.png';

const modules = [
  {
    name: 'UiPath',
    eyebrow: 'CONTROL ROOM',
    description: 'Herramientas para trabajar con la API de UiPath Orchestrator.',
    path: '/uipath',
    color: '#FA4616',
    logo: UiPathLogo,
    logoBackground: '#fff',
    number: '01',
  },
  {
    name: 'Automation Anywhere',
    eyebrow: 'CONTROL ROOM',
    description: 'Herramientas para trabajar con la API de Automation Anywhere Control Room.',
    path: '/automation-anywhere',
    color: '#FF6A2A',
    logo: AutomationAnywhereLogo,
    logoBackground: '#fff',
    number: '02',
  },
  {
    name: 'Calendars',
    eyebrow: 'MULTIPLATAFORMA',
    description: 'Crea, configura y administra calendarios laborales para todas tus tecnologías.',
    path: '/calendars',
    color: '#168dff',
    logo: EntaCalendarsLogo,
    logoBackground: '#fff',
    number: '03',
  },
];

export const ToolsHomePage = () => {
  const { startLogout } = useAuthStore();

  return (
    <Box
      component="main"
      sx={{
        height: '100dvh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gridTemplateRows: { xs: 'repeat(3, minmax(0, 1fr))', md: '1fr' },
        overflow: 'hidden',
        bgcolor: '#090d14',
        color: '#f7f9fc',
        '@supports not (height: 100dvh)': { height: '100vh' },
      }}
    >
      {modules.map(({ name, eyebrow, description, path, color, logo, logoBackground, number }) => (
        <ButtonBase
          key={name}
          component={Link}
          to={path}
          focusRipple
          aria-label={`Abrir módulo ${name}`}
          sx={{
            position: 'relative',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            textAlign: 'left',
            px: { xs: 3, sm: 6, md: 5, lg: 8 },
            py: { xs: 1, md: 5 },
            borderRight: { md: '1px solid rgba(255,255,255,.11)' },
            borderBottom: { xs: '1px solid rgba(255,255,255,.11)', md: 0 },
            background: `radial-gradient(ellipse at 50% 120%, ${alpha(color, 0.12)} 0%, transparent 65%)`,
            transition: 'background 260ms ease, box-shadow 260ms ease',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              opacity: 0,
              background: `radial-gradient(ellipse at 50% 50%, ${alpha(color, 0.24)} 0%, ${alpha(color, 0.1)} 48%, transparent 78%)`,
              transition: 'opacity 280ms ease',
            },
            '&:hover::before, &:focus-visible::before': { opacity: 1 },
            '&:hover, &:focus-visible': { boxShadow: `inset 0 0 0 1px ${alpha(color, 0.4)}` },
            '&:hover .module-logo, &:focus-visible .module-logo': {
              transform: 'translateY(-5px) scale(1.06)',
              filter: `drop-shadow(0 0 22px ${alpha(color, 0.55)})`,
            },
            '&:hover .module-title, &:focus-visible .module-title': { color },
            '&:hover .module-arrow, &:focus-visible .module-arrow': { opacity: 1, transform: 'translate(0, 0)' },
            '& > :not(.module-arrow)': { position: 'relative', zIndex: 1 },
          }}
        >
          <Typography sx={{ fontSize: 12, letterSpacing: '.22em', color: 'rgba(255,255,255,.48)', mb: { xs: 0.5, md: 3 } }}>
            {number} / ENTATOOLS
          </Typography>
          <Box
            sx={{
              width: { xs: 150, sm: 200, md: 'min(100%, 270px)' },
              height: { xs: 48, sm: 62, md: 88 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: logoBackground,
              borderRadius: logoBackground === '#fff' ? 1 : 0,
              p: logoBackground === '#fff' ? { xs: 0.8, md: 1.5 } : 0,
              mb: { xs: 0.5, md: 3 },
              transition: 'filter 260ms ease, transform 260ms ease',
            }}
          >
            <Box
              component="img"
              className="module-logo"
              src={logo}
              alt={`${name} logo`}
              sx={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transition: 'transform 260ms ease, filter 260ms ease',
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 10, letterSpacing: '.2em', color, mb: 0.75 }}>
            {eyebrow}
          </Typography>
          <Typography className="module-title" component="h1" sx={{ fontWeight: 700, fontSize: { xs: 'clamp(1.2rem, 4vw, 1.65rem)', md: 'clamp(1.5rem, 2.2vw, 2.35rem)' }, lineHeight: 1.12, transition: 'color 260ms ease' }}>
            {name}
          </Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 340, mt: 1.5, color: 'rgba(255,255,255,.58)', fontSize: { sm: 14, lg: 16 }, lineHeight: 1.6 }}>
            {description}
          </Typography>
          <ArrowOutwardRoundedIcon className="module-arrow" sx={{ position: 'absolute', zIndex: 1, right: { xs: 24, md: 36 }, bottom: { xs: 18, md: 36 }, color, opacity: 0, transform: 'translate(-5px, 5px)', transition: 'all 220ms ease' }} />
        </ButtonBase>
      ))}

      <Tooltip title="Salir de la sesión">
        <IconButton
          onClick={startLogout}
          aria-label="Salir de la sesión"
          sx={{
            position: 'fixed',
            zIndex: 2,
            right: { xs: 12, md: 20 },
            bottom: { xs: 12, md: 20 },
            width: 38,
            height: 38,
            color: 'rgba(255,255,255,.76)',
            bgcolor: 'rgba(9,13,20,.72)',
            border: '1px solid rgba(255,255,255,.2)',
            '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,.16)' },
          }}
        >
          <ExitToAppRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

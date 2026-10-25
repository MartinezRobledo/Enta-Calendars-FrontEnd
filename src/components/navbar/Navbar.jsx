// import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckIcon from '@mui/icons-material/Check';
import Logo from '../../assets/images/logo-enta-horizontal-blanco-h100.png'
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../hooks';
import { useState } from 'react';
import { useThemeMode } from '../../theme';

const pages = [{title:'Crear', path:'/crear'}, {title:'Monitor', path:'/monitor'}, {title:'Editar', path:'/editar'}, {title:'Ayuda', path:'/ayuda'}];
const settings = ['Usuario', 'Salir'];

export const Navbar = ()=> {
  const { startLogout, user } = useAuthStore();
  const { mode, toggleMode } = useThemeMode();
  const visiblePages = [
    ...pages,
    ...(user.roles?.includes('gerente') ? [{ title: 'Usuarios', path: '/usuarios' }] : []),
    ...(user.roles?.includes('gerente') ? [{ title: 'Feriados', path: '/feriados' }] : []),
    ...(user.roles?.some((role) => ['gerente', 'lider'].includes(role)) ? [{ title: 'Auditoría', path: '/auditoria' }] : []),
  ];

  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xxl">
        <Toolbar disableGutters>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, userSelect: 'none' }}>
            <img
              src={Logo} // URL de la imagen
              alt="Imagen centrada"
              style={{
                width: '160px', // Asegura que la imagen no se desborde
                height: 'auto', // Mantiene la proporción de la imagen
              }} // Ajusta la imagen para que se adapte a la caja
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
            >
              <MenuIcon color='default'/>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {visiblePages.map((page) => (
                <MenuItem 
                  key={page.title} 
                  onClick={handleCloseNavMenu}
                  component={Link}
                  to={page.path}
                >
                  <Typography 
                    textAlign="center"
                    color={location.pathname === page.path ? 'secondary' : 'default'}
                    >
                      {page.title}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box 
            sx={{ display: { xs: 'flex', md: 'none' }, 
            mr: 1, position: 'fixed', 
            left: '50%',
            justifyContent: 'center', 
            alignItems: 'center', 
            transform: 'translate(-50%, 0)',
            userSelect: 'none'
            }}>
              <img
                src={Logo} // URL de la imagen
                alt="Imagen centrada"
                style={{
                  maxWidth: '50%', // Asegura que la imagen no se desborde
                  height: 'auto', // Mantiene la proporción de la imagen
                }} // Ajusta la imagen para que se adapte a la caja
              />
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            {visiblePages.map((page) => (
              <Button
                key={page.title}
                onClick={handleCloseNavMenu}
                sx={{ my: 1, display: 'block' }}
                component={Link}
                to={page.path}
                color={location.pathname === page.path ? 'secondary' : 'default'}
              >
                {page.title}
              </Button>
            ))}
          </Box>
          <Box 
            sx={{ flexGrow: 0, display: 'flex', width: '160px', justifyContent: 'flex-end' }}>
            <Typography alignSelf={'center'} sx={{color:'white', fontWeight:'bold', m:1}}>{user.name}&nbsp;</Typography>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user.name} src={user.picture} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={handleCloseUserMenu}>
                  <Typography 
                    textAlign="center"
                    color={setting === 'Salir' ? 'error':'inherit'}
                    onClick={setting === 'Salir' ? startLogout : null}
                    >
                      {setting}
                  </Typography>
                </MenuItem>
              ))}
              <MenuItem
                onClick={() => {
                  toggleMode();
                  handleCloseUserMenu();
                }}
              >
                <ListItemIcon>
                  <DarkModeIcon fontSize="small" />
                </ListItemIcon>
                <Typography sx={{ flexGrow: 1 }}>Modo oscuro</Typography>
                {mode === 'dark' && <CheckIcon fontSize="small" />}
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

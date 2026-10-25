import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { Navbar } from '../components';
import { calendarApi } from '../api';
import { useAuthStore } from '../hooks';

const roleLabels = { gerente: 'Gerente', lider: 'Líder', desarrollador: 'Desarrollador' };

export const UserAdminPage = () => {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', password: '', role: 'desarrollador' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try { const { data } = await calendarApi.get('/users'); setUsers(data.users || []); }
    catch (e) { setError(e.response?.data?.msg || 'No se pudieron cargar los usuarios.'); }
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  const createUser = async (event) => {
    event.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try {
      await calendarApi.post('/users', form);
      setMessage('Usuario creado.'); setForm({ name: '', password: '', role: 'desarrollador' }); await loadUsers();
    } catch (e) { setError(e.response?.data?.msg || 'No se pudo crear el usuario.'); }
    finally { setLoading(false); }
  };

  const updateRole = async (user, role) => {
    setError(''); setMessage('');
    try { await calendarApi.put(`/users/${user.uid}`, { role }); setMessage(`Rol actualizado para ${user.name}.`); await loadUsers(); }
    catch (e) { setError(e.response?.data?.msg || 'No se pudo actualizar el rol.'); }
  };

  const deactivate = async (user) => {
    if (!window.confirm(`¿Desactivar a ${user.name}? No podrá iniciar sesión.`)) return;
    try { await calendarApi.delete(`/users/${user.uid}`); setMessage(`Usuario ${user.name} desactivado.`); await loadUsers(); }
    catch (e) { setError(e.response?.data?.msg || 'No se pudo desactivar el usuario.'); }
  };

  return <><Navbar /><Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
    <Typography variant="h4" sx={{ mb: 3 }}>Administración de usuarios</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}{message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
    <Paper component="form" onSubmit={createUser} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Crear usuario</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Usuario" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
        <TextField label="Contraseña inicial" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} inputProps={{ minLength: 8 }} required fullWidth />
        <TextField select label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} sx={{ minWidth: 190 }}>
          {Object.entries(roleLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 130 }}>Crear</Button>
      </Stack>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>El usuario no recibirá invitación automáticamente; comparte la contraseña inicial por un canal seguro.</Typography>
    </Paper>
    <Typography variant="h6" sx={{ mb: 1 }}>Usuarios existentes</Typography>
    <Stack spacing={1}>
      {users.map((user) => <Paper key={user.uid} sx={{ p: 2 }}><Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <Box sx={{ flex: 1 }}><Typography fontWeight="bold">{user.name} {!user.active && '(desactivado)'}</Typography></Box>
        <TextField select label="Rol" size="small" value={user.role} disabled={user.uid === currentUser.uid} onChange={(e) => updateRole(user, e.target.value)} sx={{ minWidth: 190 }}>
          {Object.entries(roleLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        {user.active && <Button color="error" disabled={user.uid === currentUser.uid} onClick={() => deactivate(user)}>Desactivar</Button>}
      </Stack></Paper>)}
    </Stack>
  </Box></>;
};

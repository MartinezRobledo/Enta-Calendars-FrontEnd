import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { Grid, Typography, IconButton, Checkbox } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';

export const SimplePaper = ({ papers = [], handleClick, handleDownload, handleDelete, selectedIds = [], setSelectedIds, setSelectAll, showClient = false }) => {
  const theme = useTheme();
  const selectedIdSet = new Set(selectedIds);

  const handleCheckboxChange = (id, nextCheck) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
    if(!nextCheck)
      setSelectAll(nextCheck);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        '& > :not(style)': {
          m: 1,
        },
      }}
    >
      {papers.map((paper) => {
        const isSelected = selectedIdSet.has(paper._id);

        return (
          <Grid item key={paper._id}>
            <Paper
              elevation={6}
              sx={{
                position: 'relative',
                height: '200px',
                width: '200px',
                backgroundColor: theme.palette.background.paper,
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  cursor: 'pointer',
                },
              }}
              onClick={(e) => {
                // Verificar si el evento proviene del checkbox
                if (e.target.type !== 'checkbox') {
                  handleClick(paper);
                }
              }}
            >
              {/* Texto con nombre del calendario */}
              {showClient && (
                <Typography
                  variant="caption"
                  sx={{ position: 'absolute', top: 8, left: 10, right: 10, color: 'text.secondary', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={paper.cliente}
                >
                  {paper.cliente}
                </Typography>
              )}
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.palette.text.primary,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  height: showClient ? 'calc(100% - 24px)' : '100%',
                  mt: showClient ? '20px' : 0,
                  padding: '0 10px',
                  zIndex: 1,
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                  pointerEvents: 'none',
                }}
              >
                {paper.titleStore}
              </Typography>

              {/* Fecha de actualización */}
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  bottom: '8px',
                  fontSize: '0.75rem',
                  color: theme.palette.text.secondary,
                  left: '19%',
                }}
              >
                fec. act: {new Date(paper.fechaActualizacion).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Typography>

              {/* Capa de hover */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: theme.palette.secondary.main,
                  opacity: isSelected ? 1 : 0, // Mantiene la opacidad activa si está seleccionado
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#fff',
                  fontWeight: 'bold',
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    opacity: 1,
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    width: '100%',
                    boxSizing: 'border-box',
                    px: 2,
                    textAlign: 'center',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {isSelected ? paper.titleStore : 'Ver calendario'}
                </Typography>

                {/* Botón cerrar */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: '#fff',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(paper);
                  }}
                >
                  <CloseIcon />
                </IconButton>

                {/* Botón descargar */}
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: '8px',
                    color: '#fff',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(paper);
                  }}
                >
                  <DownloadIcon />
                </IconButton>

                {/* Checkbox en la esquina superior izquierda (visible solo en hover) */}
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleCheckboxChange(paper._id, !isSelected);
                    }}
                    sx={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      color: '#fff',
                      padding: 0,
                      '&:hover': {
                        backgroundColor: 'transparent',
                      },
                      '& .MuiSvgIcon-root': {
                        borderRadius: 0,
                        backgroundColor: 'transparent',
                      },
                      '&.Mui-checked .MuiSvgIcon-root': {
                        color: 'white',
                      },
                    }}
                  />
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Box>
  );
};

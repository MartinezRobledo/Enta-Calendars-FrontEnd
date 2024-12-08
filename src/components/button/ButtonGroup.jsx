import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import React from 'react'

const ButtonGroup = ({extensions = [], setOption}) => {
  return (
    <ToggleButtonGroup
        value={extensions} // Pasamos el array de días seleccionados
        onChange={(event, option) => {setOption(option)}}
        aria-label="Extensiones"
        sx={{ display: 'flex', flexWrap: 'wrap' }}
      >
        {extensions.map((ext) => (
          <ToggleButton
            key={ext}
            value={ext} // Usamos el nombre del día como valor
            aria-label={ext}
            sx={{
              flex: '1',
              margin: '1px',
              '&:hover': {
                backgroundColor: 'primary.main', // Fondo al hacer hover
              },
              '&.Mui-selected': {
                backgroundColor: 'primary.main', // Fondo cuando está seleccionado
                color: 'white', // Color del texto cuando está seleccionado
                '&:hover': {
                  backgroundColor: 'secondary.main', // Fondo al hacer hover cuando está seleccionado
                }
              }
            }}
          >
            {ext} {/* Mostrar solo las primeras 3 letras */}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
  )
}

export default ButtonGroup
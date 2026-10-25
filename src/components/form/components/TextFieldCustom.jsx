import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import { useState } from 'react';
import HelpIcon from '@mui/icons-material/Help';

export const TextFieldCustom = ({ byMonthdayStr, onChangeByMonthdays, isDisabled }) => {
  const [isInvalid, setIsInvalid] = useState(false);
  const maxDaysInMonth = 31; // Máximo de días permitidos

  const validateInput = (input, maxDays) => {
    if (input.trim() === '') return true; // Permitir vacío
    const regex = /^(-?\d{0,2})|(-?\d+[+-]?)(, *(-?\d+[+-]?))*,?$/; // Aceptar números con signos opcionales al final
    if (!regex.test(input)) return false;

    // Extraer números ignorando los signos "+" y "-" al final
    const numbers = input.match(/-?\d+/g)?.map(Number) || [];
    return numbers.every((number) => number >= -maxDays && number <= maxDays);
  };

  const handleChange = (event) => {
    const newValue = event.target.value;
    const isValid = validateInput(newValue, maxDaysInMonth);

    if (isValid) {
      setIsInvalid(false);
      onChangeByMonthdays(newValue); // Actualizar el valor en tiempo real
    } else {
      setIsInvalid(true);
    }
  };

  const handleBlur = () => {
    // Validar entrada final al perder foco
    const isValid = validateInput(byMonthdayStr, maxDaysInMonth);
    setIsInvalid(!isValid);

    if (isValid) {
      onChangeByMonthdays(byMonthdayStr); // Pasar el valor al padre
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Evitar salto de línea
    }
  };

  return (
    <TextField
      label="Regla de días"
      variant="outlined"
      type="text"
      multiline
      fullWidth
      onKeyDown={handleKeyDown}
      value={byMonthdayStr}
      onChange={handleChange}
      onBlur={handleBlur}
      error={isInvalid}
      disabled={isDisabled}
      helperText={
        isInvalid
          ? 'Solo se aceptan números enteros con "+" o "-" opcionales al final, separados por coma dentro del rango permitido.'
          : ''
      }
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title="Separe las reglas con comas. Ejemplos: 15 selecciona el día 15; -2 selecciona el penúltimo día; 2+ selecciona desde el día 2 hasta el final del mes; 2- selecciona desde el día 1 hasta el día 2; -2+ selecciona los dos últimos días; -2- selecciona desde el día 1 hasta el penúltimo día de cada mes.">
              <IconButton>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      sx={{
        mt: 1,
        zIndex: 0,
      }}
    />
  );
};

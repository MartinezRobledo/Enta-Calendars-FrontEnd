import { eachDayOfInterval, isSameDay } from "date-fns";

export const crear = async(title, añosActivos, user, saveConfig) => {
    const diasFinales = [
        ...new Set(
            añosActivos.flatMap(año => [...año.diasActivosStore, ...año.aditionalDaysToAdd])
        ),
        ].filter(day => {
        // Verificar si el día no está en aditionalDaysToRemove
        return !añosActivos.some(año =>
            año.aditionalDaysToRemove.some(removedDay =>
            new Date(day).getTime() === new Date(removedDay).getTime()
            ));
        });

    //Generar Hash para ID con días finales
    const idBD = await generarHashCalendario(diasFinales, user);
    const calendario = {
        _id: idBD,
        cliente: user,
        titleStore: title,
        añosStore: añosActivos,
        fechaActualizacion: new Date(),
    }

    //Guardar las Capas del Store en la base de datos
    const error = await saveConfig(calendario);
    if(error)
        return {ok:false, msg:error};
    
    return {ok:true, msg:"Se guardó exitosamente"}
}

export const guardar = async(_id, title, añosActivos, user, updateConfig) => {
    const diasFinales = [
        ...new Set(
            añosActivos.flatMap(año => [...año.diasActivosStore, ...año.aditionalDaysToAdd])
        ),
        ].filter(day => {
        // Verificar si el día no está en aditionalDaysToRemove
        return !añosActivos.some(año =>
            año.aditionalDaysToRemove.some(removedDay =>
            new Date(day).getTime() === new Date(removedDay).getTime()
            ));
        });

    //Generar Hash para ID con días finales
    const idBD = await generarHashCalendario(diasFinales, user);
    const calendario = {
        _id: idBD,
        cliente: user,
        titleStore: title,
        añosStore: añosActivos,
        fechaActualizacion: new Date(),
    }

    //Guardar las Capas del Store en la base de datos
    const error = await updateConfig(_id, calendario);
    if(error)
        return {ok:false, msg:error};
    return {ok:true, msg:"Se guardó exitosamente"}
}

async function generarHashCalendario(diasFinales, cliente) {
    // Normaliza el array ordenándolo
    const diasOrdenados = [...diasFinales].sort();

    // Asegurar que las fechas sean objetos Date
    const diasOrdenadosDates = diasOrdenados.map(fecha => new Date(fecha));
    
    // Convierte a string
    const dataString = JSON.stringify(diasOrdenadosDates) + cliente;
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);

    // Genera el hash usando SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convierte el hash a hexadecimal
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

  
function formatDateBP(date) {
    // Obtener la fecha en formato 'YYYY-MM-DD HH:mm:ss'
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11, por eso sumamos 1
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    // Formato deseado: 'YYYY-MM-DD HH:mm:ss'
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}Z`;
}

function formatDateAutomation(date) {
    // Obtener la fecha en formato 'YYYY-MM-DD HH:mm:ss'
    const dateFormated = new Date(date);
    const year = dateFormated.getFullYear();
    const month = String(dateFormated.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11, por eso sumamos 1
    const day = String(dateFormated.getDate()).padStart(2, '0');

    // Formato deseado: 'YYYY-MM-DD'
    return `${year}-${month}-${day}`;
}

// Obtengo todas las fechas que no son las fechas de ejecución
function fechasToBp(fechasDeEjecucion = [], fechaInicio, fechaFin) {
    // Asegurar que las fechas sean objetos Date
    const fechasDeEjecucionDates = fechasDeEjecucion.map(fecha => new Date(fecha));
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);

    // Generar todas las fechas dentro del intervalo
    const todasLasFechas = eachDayOfInterval({ start: fechaInicioDate, end: fechaFinDate });

    // Filtrar las fechas excluyendo las que están en fechasDeEjecucion
    const otherDates = todasLasFechas.filter(fecha =>
        !fechasDeEjecucionDates.some(excluir => isSameDay(fecha, excluir))
    );

    return otherDates;
}

export const createCalendarbp = (fechas = [], title, user, inicio, fin)=> {

    const template = {
        calendar: "<calendar id='ID' name='NOMBRE' xmlns='http://www.blueprism.co.uk/product/calendar'>",
        close_tickets: "</schedule-calendar></calendar></bpr:contents></bpr:release>",
        contents: "<bpr:contents count='1'>",
        created: "<bpr:created>FECHA</bpr:created>",
        created_by: "<bpr:user-created-by>USUARIO</bpr:user-created-by>",
        header: "<?xml version='1.0' encoding='utf-8'?><bpr:release xmlns:bpr='http://www.blueprism.co.uk/product/release'>",
        id: "<bpr:package-id>ID</bpr:package-id>",
        name: "<bpr:name>NOMBRE</bpr:name>",
        notes: "<bpr:release-notes />",
        other_holidays: "<other-holidays><other-date value='yyyy-MM-dd' /></other-holidays>",
        package_name: "<bpr:package-name>NOMBRE</bpr:package-name>",
        schedule_calendar: "<schedule-calendar id='ID' name='NOMBRE' working-week='HABILES'>",
    }

    const replacements = {
        "NOMBRE":title,
        "ID": new Date().getMilliseconds(),
        "FECHA": formatDateBP(new Date()),
        "USUARIO":user,
        "HABILES":"127",
    }

    let templateCharged = {...template};

    for( const key in templateCharged) {
        for( const key_r in replacements) {
            if(templateCharged[key].includes(key_r)) {
                templateCharged[key] = templateCharged[key].replace(key_r, replacements[key_r]);
            }
        }
    }

    const startDate = new Date(Number(fin.getFullYear()) + 1, 0, 1);
    
    const otherDates = fechasToBp(fechas, inicio, fin);

    // Crear la estructura de <other-holidays> con las fechas en formato <other-date>
    const otherHolidays = '<other-holidays>\n' +
    otherDates.map(fecha => `<other-date value='${new Date(fecha).toISOString().split('T')[0]}' />\n`).join('') +
    `<other-date value='${new Date(startDate).toISOString().split('T')[0]}' />\n` +
    '</other-holidays>';

    // Reemplazo other holidays
    templateCharged.other_holidays = otherHolidays;

    return templateCharged;
    
}

export const createCalendarAutomation = (fechas = []) => {
    const AutomationDates = fechas.map(fecha => formatDateAutomation(fecha));
    return AutomationDates;
}

export const exportBpRelease = async(title, añosActivos, user) => {

    const diasFinales = [
    ...new Set(
        añosActivos.flatMap(año => [...año.diasActivosStore, ...año.aditionalDaysToAdd])
    ),
    ].filter(day => {
    // Verificar si el día no está en aditionalDaysToRemove
    return !añosActivos.some(año =>
        año.aditionalDaysToRemove.some(removedDay =>
        new Date(day).getTime() === new Date(removedDay).getTime()
        ));
    });

    const allInitDates = añosActivos
    .flatMap(año => año.capasStore.map(capa => capa.data.initCalendar));
    const allFinishDates = añosActivos
    .flatMap(año => año.capasStore.map(capa => capa.data.finishCalendar));

    // Encontrar la menor initCalendar y la mayor finishCalendar
    const inicio = new Date(Math.min(...allInitDates));
    const fin = new Date(Math.max(...allFinishDates));

    ExportarBprelease(createCalendarbp(diasFinales, title, user, inicio, fin), title);
}

export const exportCsv = () => {
    console.log('exportCsv');
    ExportarCsv(createCalendarAutomation(diasFinales), title);
}


export const ExportarBprelease = (jsonData, fileName) => {
  
    // Convertir el objeto JSON en una cadena de texto
    const jsonString = 
      `${jsonData.header}\n` +
      `${jsonData.name}\n` +
      `${jsonData.notes}\n` +
      `${jsonData.created}\n` +
      `${jsonData.id}\n` +
      `${jsonData.package_name}\n`+
      `${jsonData.created_by}\n` +
      `${jsonData.contents}\n` +
      `${jsonData.calendar}\n` +
      `${jsonData.schedule_calendar}\n` +
      `${jsonData.other_holidays}\n` +
      `${jsonData.close_tickets}\n`;
  
    // Crear un Blob a partir de la cadena JSON
    const blob = new Blob([jsonString], { type: '' });
    
    // Crear un enlace temporal para la descarga
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.bprelease`; // El nombre del archivo que se descargará
    
    // Añadir el enlace al DOM y simular el clic
    document.body.appendChild(link);
    link.click();
    
    // Eliminar el enlace después de la descarga
    document.body.removeChild(link);
    
  }
  
  export const ExportarCsv = (dates, filename) => {
    // Crea una cadena con los elementos del array, uno por fila
    const csvContent = dates.map(item => item.toString()).join('\n');
      
    // Crea un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Crea un enlace temporal para la descarga
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    
    // Simula el clic para iniciar la descarga
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

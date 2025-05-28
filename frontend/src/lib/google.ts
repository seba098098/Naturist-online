import { google } from 'googleapis';

export const getGoogleCalendar = async () => {
  try {
    // Aquí necesitarás configurar tus credenciales de Google
    // Por ahora, usaremos un cliente anónimo para probar
    const calendar = google.calendar({
      version: 'v3',
      auth: null // En producción necesitarás configurar la autenticación
    });

    // Obtener información básica sobre el calendario
    const calendarList = await calendar.calendarList.list();
    return calendarList.data;
  } catch (error) {
    console.error('Error al obtener calendarios:', error);
    throw error;
  }
};

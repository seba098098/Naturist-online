import { google } from 'googleapis';

export const getGoogleAuth = () => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  return auth;
};

export const getGoogleCalendar = async () => {
  const auth = getGoogleAuth();
  const calendar = google.calendar({
    version: 'v3',
    auth
  });

  try {
    const calendarList = await calendar.calendarList.list();
    return calendarList.data;
  } catch (error) {
    console.error('Error al obtener calendarios:', error);
    throw error;
  }
};

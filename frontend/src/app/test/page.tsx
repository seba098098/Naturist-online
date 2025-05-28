"use client";

import { useState, useEffect } from 'react';
import { getGoogleAuthUrl, handleGoogleCallback, getCalendarEvents } from '@/lib/google-calendar';

export default function TestPage() {
  const [authUrl, setAuthUrl] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const url = await getGoogleAuthUrl();
        setAuthUrl(url);
      } catch (err) {
        setError('Error al obtener URL de autenticación');
        console.error('Error:', err);
      }
    };
    initialize();
  }, []);

  const handleCallback = async (code: string) => {
    try {
      const result = await handleGoogleCallback(code);
      // Aquí obtendrías el accessToken
      const accessToken = result.tokens.access_token;
      
      // Obtener eventos del calendario
      const calendarEvents = await getCalendarEvents(accessToken);
      setEvents(calendarEvents);
    } catch (err) {
      setError('Error en el callback de Google');
      console.error('Error:', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prueba Google Calendar</h1>
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      
      {authUrl && (
        <a 
          href={authUrl} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = authUrl;
          }}
        >
          Iniciar sesión con Google
        </a>
      )}
      
      {events.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Eventos del Calendario:</h2>
          <ul className="list-disc pl-5">
            {events.map((event: any) => (
              <li key={event.id} className="mb-2">
                <strong>{event.summary}</strong> - {event.start.dateTime || event.start.date}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      )}
    </div>
  );
}

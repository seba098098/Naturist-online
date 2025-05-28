import { NextResponse } from 'next/server';

export const getGoogleAuthUrl = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/google/auth`);
    const data = await response.json();
    return data.authUrl;
  } catch (error) {
    console.error('Error obteniendo URL de autenticación:', error);
    throw error;
  }
};

export const handleGoogleCallback = async (code: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google/callback?code=${code}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en callback de Google:', error);
    throw error;
  }
};

export const getCalendarEvents = async (accessToken: string) => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/google/events?accessToken=${accessToken}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error obteniendo eventos del calendario:', error);
    throw error;
  }
};

import { NextResponse } from 'next/server';
import { getGoogleCalendar } from '@/lib/google';

export async function GET() {
  try {
    const data = await getGoogleCalendar();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error en la API de Google:', error);
    return NextResponse.json(
      { success: false, error: 'Error al conectar con Google Calendar' },
      { status: 500 }
    );
  }
}

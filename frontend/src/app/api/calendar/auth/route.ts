import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const authUrl = `http://localhost:3000/api/auth/callback/google?scope=https://www.googleapis.com/auth/calendar.readonly&prompt=consent`;
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Error generando URL de autenticación:', error);
    return NextResponse.json(
      { error: 'Error generando URL de autenticación' },
      { status: 500 }
    );
  }
}

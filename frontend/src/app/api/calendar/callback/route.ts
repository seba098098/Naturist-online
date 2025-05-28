import { NextResponse } from 'next/server';
import { getGoogleAuth } from '@/lib/google-auth';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'No se recibió código de autorización' },
        { status: 400 }
      );
    }

    const auth = getGoogleAuth();
    const { tokens } = await auth.getToken(code);
    
    if (!tokens.access_token) {
      return NextResponse.json(
        { error: 'No se obtuvo token de acceso' },
        { status: 400 }
      );
    }

    auth.setCredentials(tokens);
    
    return NextResponse.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      }
    });
  } catch (error) {
    console.error('Error en callback de Google:', error);
    return NextResponse.json(
      { error: 'Error en el callback de Google' },
      { status: 500 }
    );
  }
}

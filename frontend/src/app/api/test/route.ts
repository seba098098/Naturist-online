import { NextResponse } from 'next/server';
import { fetch } from 'cross-fetch';

export async function GET() {
  try {
    console.log('URL de API:', process.env.NEXT_PUBLIC_API_URL);
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Estado de la respuesta:', response.status);
    
    if (!response.ok) {
      throw new Error('Error en la petición');
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error en /api/test:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al conectar con el backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

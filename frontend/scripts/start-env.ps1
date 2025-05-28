$env:NEXT_PUBLIC_API_URL = "http://localhost:4000"

# Mostrar las variables de entorno
Write-Host "Variables de entorno:"
Write-Host "NEXT_PUBLIC_API_URL: $($env:NEXT_PUBLIC_API_URL)"

# Iniciar Next.js
npm run dev

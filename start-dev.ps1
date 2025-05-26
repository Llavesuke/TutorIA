# Script para iniciar el backend y el frontend en desarrollo

Write-Host "Iniciando TutorIA en modo desarrollo..." -ForegroundColor Green

# Crear archivo .env para el backend si no existe
if (-not (Test-Path "./backend/.env")) {
    Write-Host "Creando archivo .env para el backend..." -ForegroundColor Yellow
    @"
DB_CONNECTION_STRING=postgresql://postgres:tutorIA12@db.xxxceuscnfcxpfgnmdfe.supabase.co:5432/postgres
PORT=3000
SUPABASE_URL=https://xxxceuscnfcxpfgnmdfe.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eGNldXNjbmZjeHBmZ25tZGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc1MzA0MDAsImV4cCI6MjAzMzEwNjQwMH0.Nh0fPXLB9dDQzxhJxIYX9-MwFWJ-_OYEnqXsXJfRFWw
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=drhxjofkq
CLOUDINARY_API_KEY=982762731681915
CLOUDINARY_API_SECRET=g2XbZZ2VT3JKp1PzNr4Jbtq0uVk
GEMINI_API_KEY=AIzaSyBP7_EVqHLldEZEfAEnFEouZqH2Zraq6wU
"@ | Out-File -FilePath "./backend/.env" -Encoding utf8
}

# Iniciar el backend en una nueva ventana
Write-Host "Iniciando el backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend' ; npm run dev"

# Esperar un momento para que el backend inicie
Start-Sleep -Seconds 3

# Iniciar el frontend en una nueva ventana
Write-Host "Iniciando el frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend' ; npm run dev"

Write-Host "¡TutorIA está en ejecución!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C en las ventanas de PowerShell para detener los servicios." -ForegroundColor Gray

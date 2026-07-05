@echo off
title Learn RAG - Educational Agentic RAG
color 0A

echo.
echo  ============================================
echo     Learn RAG - Starting Development Server
echo  ============================================
echo.

cd /d "C:\Users\aakas\Documents\Agent\Agentic_RAG-main"

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    call npm install
    echo.
) else (
    echo [1/3] Dependencies already installed. Skipping.
)

:: Check if Prisma DB exists
if not exist "prisma\dev.db" (
    echo [2/3] Setting up database...
    call npx prisma migrate dev --name init
    echo.
) else (
    echo [2/3] Database already exists. Skipping.
)

:: Generate Prisma client
echo [3/3] Starting development server...
echo.
echo  ============================================
echo    App running at: http://localhost:3000
echo    Press Ctrl+C to stop the server
echo  ============================================
echo.

call npm run dev

pause

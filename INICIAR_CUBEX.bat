
@echo off
title CUBEX - Iniciando sistema

echo =================================
echo          INICIANDO CUBEX
echo =================================

REM Iniciar microservicio de login
start "CUBEX - Microservicio Login" cmd /k "cd /d "%~dp0microservicio-login" && npm run dev"

REM Iniciar microservicio de verificacion de bots
start "CUBEX - Verificacion Bot" cmd /k "cd /d "%~dp0verificacion-bot" && node server.js"

REM Iniciar microservicio de recuperacion de contrasena
start "CUBEX - Recuperacion Password" cmd /k "cd /d "%~dp0soa-servicio-reset-password-main\api" && npm run dev"

REM Iniciar microservicio de roles
start "CUBEX - Servicio de Roles" cmd /k "cd /d "%~dp0servicio-roles" && npm run dev"

REM Iniciar microservicio de inventario
start "CUBEX - Microservicio Inventario" cmd /k "cd /d "%~dp0inventario-service-main" && npm run dev"

REM Iniciar microservicio de comentarios y resenas
start "CUBEX - Comentarios y Resenas" cmd /k "cd /d "%~dp0comentarios-resenas-service" && node src/server.js"

REM Iniciar servidor web
start "CUBEX - Pagina Web" cmd /k "cd /d "%~dp0" && py -m http.server 5500 --bind 127.0.0.1"

REM Esperar a que los servicios arranquen
timeout /t 7 /nobreak >nul

REM Abrir CUBEX
start "" "http://127.0.0.1:5500/index.html"

echo.
echo CUBEX se esta iniciando.
echo =================================
pause

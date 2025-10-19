@echo off
echo Reiniciando o servidor de desenvolvimento...
taskkill /f /im node.exe
start cmd /c "npm run dev"
echo Servidor reiniciado!
pause
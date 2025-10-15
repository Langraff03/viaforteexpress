@echo off
echo Iniciando workers de leads...
cd %~dp0
set NODE_ENV=development
npx tsx src/workers/lead.worker.ts
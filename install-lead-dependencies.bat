@echo off
echo ===================================================
echo    INSTALANDO DEPENDENCIAS PARA SISTEMA DE LEADS
echo ===================================================
echo.

echo Instalando JSONStream para processamento de arquivos grandes...
call npm install --save jsonstream

echo Instalando csv-parse para processamento de arquivos CSV...
call npm install --save csv-parse

echo.
echo ===================================================
echo    DEPENDENCIAS INSTALADAS COM SUCESSO!
echo ===================================================
echo.
echo Para processar arquivos grandes de leads, use:
echo processar-leads-cliente.bat NOME_CLIENTE CAMINHO_ARQUIVO_JSON
echo.
echo Exemplo: processar-leads-cliente.bat empresa-abc leads-empresa-abc.json
echo.

pause
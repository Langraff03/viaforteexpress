@echo off
REM Script de build específico para Railway (Windows)
REM Compila apenas os arquivos backend necessários

echo 🚀 Iniciando build específico para Railway...

REM Criar diretório dist se não existir
if not exist dist mkdir dist

echo 📦 Compilando arquivos backend...

REM Webhook server
echo   - Compilando webhook-server...
call npx tsc src/webhook-server/index.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Workers
echo   - Compilando workers...
call npx tsc src/workers/index.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Routes
echo   - Compilando routes...
call npx tsc src/routes/adminApiRoutes.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/routes/invoiceRoutes.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/routes/leadCampaignRoutes.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/routes/paymentRoutes.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Lib (apenas arquivos backend)
echo   - Compilando bibliotecas backend...
call npx tsc src/lib/api.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/auth.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/domainHelpers.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/AssetGateway.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/BaseGateway.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/ConfigValidator.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/GatewayInterface.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/GatewayRegistry.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/GatewayUtils.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/ShopifyGateway.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/gateways/gatewaySelector.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/invoiceService.tsx --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/payment.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/queue.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/shopifyConfig.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/lib/websocket-server.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Emails backend
echo   - Compilando templates de email backend...
call npx tsc src/emails/TrackingEmail.backend.tsx --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/emails/OfferEmail.backend.tsx --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Utils backend
echo   - Compilando utilitários backend...
call npx tsc src/utils/errorHandling.js --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/events-polyfill.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/format.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/pdfGenerator.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/secureData.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/tokenUtils.js --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/utils/validation.js --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

REM Types
echo   - Compilando tipos...
call npx tsc src/types/gateway.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/types/index.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/types/react-query.d.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node
call npx tsc src/types/supabase.ts --outDir dist --module ES2020 --target ES2020 --moduleResolution node --esModuleInterop --skipLibCheck --jsx react-jsx --types node

echo ✅ Build concluído com sucesso!
echo 📁 Arquivos compilados em: dist/
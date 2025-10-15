import express from 'express';
import cors from 'cors';

const app = express();

// Configuração básica
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Rota de healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Configuração da porta
const PORT = process.env.PORT || 3002;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
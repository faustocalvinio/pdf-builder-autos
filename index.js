require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const { generarPDFStock } = require('./templates/pdfTemplate');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'mi-clave-secreta';

app.use(express.json({ limit: '10mb' }));

function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== API_KEY) {
    return res.status(401).json({ error: 'API Key invalida' });
  }
  next();
}

app.get('/', (req, res) => {
  res.json({
    servicio: 'PDF Builder - Stock de Autos',
    version: '1.0.0',
    endpoints: {
      'POST /api/pdf': 'Recibe JSON con stock y devuelve PDF como archivo binario',
      'GET /api/health': 'Health check',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/pdf', authMiddleware, async (req, res) => {
  try {
    const stockData = req.body;

    if (!stockData.autos || !Array.isArray(stockData.autos)) {
      return res.status(400).json({
        error: 'El body debe incluir un array "autos"',
        ejemplo: {
          concesionaria: 'Autos del Sur',
          autos: [
            { marca: 'Toyota', modelo: 'Corolla', anio: 2024, precio: 28500000, cantidad: 3, estado: 'Nuevo' },
            { marca: 'Ford', modelo: 'Ranger', anio: 2023, precio: 32000000, cantidad: 2, estado: 'Usado' },
          ],
        },
      });
    }

    const pdfPath = await generarPDFStock(stockData);

    const fileName = `stock-${stockData.concesionaria || 'autos'}-${new Date().toISOString().slice(0, 10)}.pdf`
      .replace(/\s+/g, '-')
      .toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);

    readStream.on('end', () => {
      fs.unlink(pdfPath, () => {});
    });

  } catch (error) {
    console.error('Error generando PDF:', error.message);
    res.status(500).json({ error: 'Error al generar el PDF', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor PDF Builder corriendo en http://localhost:${PORT}`);
});

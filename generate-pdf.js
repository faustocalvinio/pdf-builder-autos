const fs = require('fs');
const path = require('path');
const { generarPDFStock } = require('./templates/pdfTemplate');

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

async function main() {
  const args = process.argv.slice(2);

  let inputPath, outputPath, useStdin = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      inputPath = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[++i];
    } else if (args[i] === '--stdin') {
      useStdin = true;
    }
  }

  if (!outputPath) {
    console.error('Uso: node generate-pdf.js (--input <archivo.json> | --stdin) --output <salida.pdf>');
    process.exit(1);
  }

  if (!inputPath && !useStdin) {
    console.error('Error: debe especificar --input o --stdin');
    process.exit(1);
  }

  let raw;
  if (useStdin) {
    raw = await readStdin();
  } else {
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: archivo de entrada no encontrado: ${inputPath}`);
      process.exit(1);
    }
    raw = fs.readFileSync(inputPath, 'utf-8');
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error('Error: el JSON de entrada no contiene JSON valido');
    process.exit(1);
  }

  if (!data.autos || !Array.isArray(data.autos)) {
    console.error('Error: el JSON debe incluir un array "autos"');
    process.exit(1);
  }

  const pdfPath = await generarPDFStock(data, outputPath);
  console.log(pdfPath);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});

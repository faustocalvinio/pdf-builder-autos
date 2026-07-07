const fs = require('fs');
const path = require('path');
const { generarPDFStock } = require('./templates/pdfTemplate');

async function main() {
  const args = process.argv.slice(2);

  let inputPath, outputPath;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' || args[i] === '-i') {
      inputPath = args[++i];
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputPath = args[++i];
    }
  }

  if (!inputPath || !outputPath) {
    console.error('Uso: node generate-pdf.js --input <archivo.json> --output <salida.pdf>');
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: archivo de entrada no encontrado: ${inputPath}`);
    process.exit(1);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    console.error('Error: el archivo de entrada no contiene JSON valido');
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

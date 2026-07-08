const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function generarPDFLegal(data, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `legal-${timestamp}.pdf`;
    const filePath = outputPath || path.join(uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const firma = data.firma || 'DOTCOM Estudio Jurídico';
    const titulo = data.titulo || '';
    const contenido = data.contenido || '';
    const fechaFooter = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const azulOscuro = '#1a237e';
    const azulMedio = '#3949ab';
    const gris = '#616161';

    function piePagina(pageCount) {
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        const bottom = doc.page.height - 50;

        doc
          .moveTo(50, bottom)
          .lineTo(545, bottom)
          .strokeColor(azulOscuro)
          .lineWidth(0.5)
          .stroke();

        doc
          .fontSize(7)
          .fillColor(gris)
          .font('Helvetica')
          .text(firma, 50, bottom + 6, { width: 200, align: 'left' })
          .text(fechaFooter, 50, bottom + 6, { width: 495, align: 'center' })
          .text(`Pág. ${i + 1} de ${pageCount}`, 50, bottom + 6, { width: 495, align: 'right' });
      }
    }

    // ========================
    // ENCABEZADO
    // ========================

    doc
      .rect(50, 50, 495, 3)
      .fill(azulOscuro);

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(azulOscuro)
      .text(firma.toUpperCase(), 50, 65, { width: 495, align: 'center' })
      .moveDown(0.2);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(gris)
      .text('Estudio Jurídico', { width: 495, align: 'center' })
      .moveDown(0.8);

    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor(azulMedio)
      .lineWidth(1)
      .stroke()
      .moveDown(0.6);

    // ========================
    // TITULO
    // ========================

    if (titulo) {
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor(azulOscuro)
        .text(titulo.toUpperCase(), { width: 495, align: 'center' })
        .moveDown(1);
    }

    // ========================
    // CONTENIDO
    // ========================

    if (contenido) {
      const parrafos = contenido.split('\n').filter((p) => p.trim() !== '');

      parrafos.forEach((p) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#333')
          .text(p.trim(), {
            width: 495,
            align: 'justify',
            lineGap: 2,
          })
          .moveDown(0.3);
      });
    }

    // ========================
    // PIE DE PAGINA
    // ========================

    doc.end();
    doc.on('end', () => piePagina(doc.bufferedPageRange().count));

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generarPDFLegal };

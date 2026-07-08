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
    const titulo = data.titulo || 'Documento Legal';
    const subtitulo = data.subtitulo || '';
    const expediente = data.expediente || '';
    const caratula = data.caratula || '';
    const cliente = data.cliente || '';
    const materia = data.materia || '';
    const jurisdiccion = data.jurisdiccion || '';
    const secciones = data.secciones || [];
    const firmante = data.firmante || '';
    const notas = data.notas || '';
    const fechaFooter = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const azulOscuro = '#1a237e';
    const azulMedio = '#3949ab';
    const gris = '#616161';
    const grisClaro = '#f5f5f5';

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
    // ENCABEZADO - LETTERHEAD
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
    // TITULO DEL DOCUMENTO
    // ========================

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(azulOscuro)
      .text(titulo.toUpperCase(), { width: 495, align: 'center' })
      .moveDown(0.2);

    if (subtitulo) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor(gris)
        .text(subtitulo, { width: 495, align: 'center' })
        .moveDown(0.6);
    }

    doc.moveDown(0.4);

    // ========================
    // DATOS DEL EXPEDIENTE
    // ========================

    const tieneMetadata = expediente || caratula || cliente || materia || jurisdiccion;

    if (tieneMetadata) {
      const boxTop = doc.y;

      doc.rect(50, boxTop, 495, 4).fill(azulMedio);

      const labels = [];
      if (expediente) labels.push({ lbl: 'Expediente', val: expediente });
      if (caratula) labels.push({ lbl: 'Carátula', val: caratula });
      if (cliente) labels.push({ lbl: 'Cliente', val: cliente });
      if (materia) labels.push({ lbl: 'Materia', val: materia });
      if (jurisdiccion) labels.push({ lbl: 'Jurisdicción', val: jurisdiccion });

      let metaY = boxTop + 10;

      labels.forEach((item) => {
        doc
          .fontSize(9)
          .font('Helvetica-Bold')
          .fillColor(azulOscuro)
          .text(`${item.lbl}: `, 58, metaY, { continued: true, width: 100 })
          .font('Helvetica')
          .fillColor('#333')
          .text(item.val, { width: 380 })
          .moveDown(0.1);
        metaY = doc.y;
      });

      doc
        .rect(50, boxTop, 495, metaY - boxTop + 4)
        .strokeColor(azulMedio)
        .lineWidth(0.5)
        .stroke();

      doc.moveDown(0.6);
    }

    // ========================
    // SECCIONES DE CONTENIDO
    // ========================

    secciones.forEach((seccion, idx) => {
      if (doc.y > 650) doc.addPage();

      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(azulOscuro)
        .text(seccion.titulo || `Sección ${idx + 1}`, { width: 495 })
        .moveDown(0.3);

      if (seccion.contenido) {
        const parrafos = seccion.contenido.split('\n').filter(Boolean);
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

      doc.moveDown(0.3);
    });

    // ========================
    // FIRMA
    // ========================

    if (firmante) {
      if (doc.y > 600) doc.addPage();
      doc.moveDown(1.5);

      doc
        .moveTo(350, doc.y)
        .lineTo(545, doc.y)
        .strokeColor(azulOscuro)
        .lineWidth(0.5)
        .stroke()
        .moveDown(0.3);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#333')
        .text(firmante, 350, doc.y, { width: 195, align: 'center' })
        .moveDown(1);
    }

    // ========================
    // NOTAS / DISCLAIMER
    // ========================

    if (notas) {
      if (doc.y > 650) doc.addPage();

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor(grisClaro)
        .lineWidth(1)
        .stroke()
        .moveDown(0.4);

      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .fillColor(gris)
        .text(notas, { width: 495, align: 'justify' });
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

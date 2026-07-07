const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function generarPDFStock(stockData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `stock-autos-${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const concesionaria = stockData.concesionaria || 'Concesionaria';
    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Encabezado
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text(concesionaria.toUpperCase(), { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(14)
      .font('Helvetica')
      .fillColor('#555')
      .text('REPORTE DE STOCK DE VEHICULOS', { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .fillColor('#888')
      .text(`Generado: ${fecha}`, { align: 'center' })
      .moveDown(1);

    // Línea separadora
    doc
      .moveTo(40, doc.y)
      .lineTo(555, doc.y)
      .strokeColor('#2962ff')
      .lineWidth(2)
      .stroke()
      .moveDown(1);

    const autos = stockData.autos || [];

    if (autos.length === 0) {
      doc
        .fontSize(12)
        .fillColor('#999')
        .text('No hay vehículos en stock.', { align: 'center' });
    } else {
      // Resumen
      const totalStock = autos.reduce((sum, a) => sum + (a.cantidad || a.stock || 1), 0);
      const marcas = [...new Set(autos.map((a) => a.marca).filter(Boolean))];

      doc.fontSize(11).fillColor('#333');

      doc
        .font('Helvetica-Bold')
        .text(`Total de unidades: `, { continued: true })
        .font('Helvetica')
        .text(`${totalStock}`)
        .moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .text(`Marcas en stock: `, { continued: true })
        .font('Helvetica')
        .text(marcas.join(', ') || 'N/A')
        .moveDown(0.5);

      doc
        .font('Helvetica-Bold')
        .text(`Modelos distintos: `, { continued: true })
        .font('Helvetica')
        .text(`${autos.length}`)
        .moveDown(1);

      // Tabla
      const tableTop = doc.y;
      const colX = {
        nro: 40,
        marca: 70,
        modelo: 170,
        anio: 310,
        precio: 370,
        stock: 450,
        estado: 500,
      };

      const colWidths = {
        nro: 30,
        marca: 100,
        modelo: 140,
        anio: 60,
        precio: 80,
        stock: 50,
        estado: 55,
      };

      // Cabecera de tabla
      doc.rect(40, tableTop, 515, 20).fill('#2962ff');

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor('#fff');

      doc.text('#', colX.nro, tableTop + 5, { width: colWidths.nro });
      doc.text('Marca', colX.marca, tableTop + 5, { width: colWidths.marca });
      doc.text('Modelo', colX.modelo, tableTop + 5, { width: colWidths.modelo });
      doc.text('Año', colX.anio, tableTop + 5, { width: colWidths.anio, align: 'center' });
      doc.text('Precio', colX.precio, tableTop + 5, { width: colWidths.precio, align: 'right' });
      doc.text('Stock', colX.stock, tableTop + 5, { width: colWidths.stock, align: 'center' });
      doc.text('Estado', colX.estado, tableTop + 5, { width: colWidths.estado, align: 'center' });

      let rowY = tableTop + 22;

      autos.forEach((auto, index) => {
        if (rowY > 760) {
          doc.addPage();
          rowY = 40;

          // Re-dibujar cabecera en nueva página
          doc.rect(40, rowY, 515, 20).fill('#2962ff');
          doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#fff');

          doc.text('#', colX.nro, rowY + 5, { width: colWidths.nro });
          doc.text('Marca', colX.marca, rowY + 5, { width: colWidths.marca });
          doc.text('Modelo', colX.modelo, rowY + 5, { width: colWidths.modelo });
          doc.text('Año', colX.anio, rowY + 5, { width: colWidths.anio, align: 'center' });
          doc.text('Precio', colX.precio, rowY + 5, { width: colWidths.precio, align: 'right' });
          doc.text('Stock', colX.stock, rowY + 5, { width: colWidths.stock, align: 'center' });
          doc.text('Estado', colX.estado, rowY + 5, { width: colWidths.estado, align: 'center' });

          rowY = 62;
        }

        const bgColor = index % 2 === 0 ? '#f5f5f5' : '#fff';
        doc.rect(40, rowY - 1, 515, 18).fill(bgColor);

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#333');

        const precio = auto.precio
          ? `$${Number(auto.precio).toLocaleString('es-AR')}`
          : '-';

        doc.text(`${index + 1}`, colX.nro, rowY + 3, { width: colWidths.nro });
        doc.text(auto.marca || '-', colX.marca, rowY + 3, { width: colWidths.marca });
        doc.text(auto.modelo || '-', colX.modelo, rowY + 3, { width: colWidths.modelo });
        doc.text(`${auto.anio || '-'}`, colX.anio, rowY + 3, { width: colWidths.anio, align: 'center' });
        doc.text(precio, colX.precio, rowY + 3, { width: colWidths.precio, align: 'right' });
        doc.text(`${auto.cantidad || auto.stock || 1}`, colX.stock, rowY + 3, { width: colWidths.stock, align: 'center' });
        doc.text(auto.estado || '-', colX.estado, rowY + 3, { width: colWidths.estado, align: 'center' });

        rowY += 18;
      });
    }

    // Pie de página
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor('#aaa')
        .text(
          `Página ${i + 1} de ${pageCount}`,
          40,
          doc.page.height - 50,
          { align: 'center', width: 515 }
        );
    }

    doc.switchToPage(pageCount - 1);
    doc.y = doc.page.height - 55;

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generarPDFStock };

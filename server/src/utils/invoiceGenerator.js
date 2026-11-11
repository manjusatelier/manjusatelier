import PDFDocument from 'pdfkit';

function formatPaymentStatus(status) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function generateInvoice(order, res, inline = false) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename=invoice-${order.customOrderId || order._id}.pdf`
  );

  doc.pipe(res);

  const brandColor = '#c19b6c';
  const textColor = '#333333';
  const lightText = '#777777';

  // Header Background
  doc.rect(0, 0, doc.page.width, 120).fill('#fcf9f2');
  
  // Header Text
  doc
    .fillColor(brandColor)
    .font('Helvetica-Bold')
    .fontSize(28)
    .text("Manju's Atelier", 50, 45)
    .fillColor(lightText)
    .font('Helvetica')
    .fontSize(10)
    .text('Handcrafted with love', 52, 75);

  // Store Address (Right aligned)
  doc
    .fillColor(textColor)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text("Manju's Atelier", 200, 40, { align: 'right' })
    .font('Helvetica')
    .text('Neelam Apartments, Mansarovar Park', 200, 55, { align: 'right' })
    .text('Lal Kuan, Ghaziabad', 200, 70, { align: 'right' })
    .text('Uttar Pradesh - 201009', 200, 85, { align: 'right' });

  // Add a line below the header
  doc.strokeColor(brandColor).lineWidth(2).moveTo(0, 120).lineTo(doc.page.width, 120).stroke();

  // Invoice Details
  const customerName = order.user?.name || order.shippingAddress?.fullName || 'Customer';
  const invoiceDate = new Date(order.createdAt).toLocaleDateString();
  const orderId = order.customOrderId || order._id;
  const statusStr = formatPaymentStatus(order.paymentStatus || 'PENDING');

  doc.moveDown(3);

  // Left Column (Invoice Info)
  doc
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('INVOICE', 50, 150)
    .font('Helvetica')
    .fontSize(10)
    .fillColor(lightText)
    .text('Invoice Number:', 50, 170)
    .fillColor(textColor)
    .text(String(orderId).startsWith('#') ? String(orderId) : `#${orderId}`, 140, 170)
    .fillColor(lightText)
    .text('Invoice Date:', 50, 185)
    .fillColor(textColor)
    .text(invoiceDate, 140, 185)
    .fillColor(lightText)
    .text('Payment Status:', 50, 200)
    .fillColor(brandColor)
    .font('Helvetica-Bold')
    .text(statusStr, 140, 200)
    .font('Helvetica');

  // Right Column (Bill To)
  doc
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .fontSize(12)
    .text('BILL TO', 350, 150)
    .fontSize(10)
    .text(customerName, 350, 170)
    .font('Helvetica');

  if (order.shippingAddress) {
    const addressLines = [];
    if (order.shippingAddress.line1) addressLines.push(order.shippingAddress.line1);
    if (order.shippingAddress.line2) addressLines.push(order.shippingAddress.line2);
    
    const cityState = [order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ');
    const postal = order.shippingAddress.postalCode || '';
    if (cityState || postal) {
      addressLines.push(`${cityState} ${postal}`.trim());
    }
    
    doc.text(addressLines.join('\n'), 350, 185, { width: 200, lineGap: 3 });
    
    if (order.shippingAddress.phone) {
      doc.moveDown(0.5);
      doc.fillColor(lightText).text(`Phone: ${order.shippingAddress.phone}`, { width: 200 });
    }
  }

  // Table Setup
  const tableTop = 270;
  doc
    .fillColor('#f8f5f0')
    .rect(50, tableTop - 10, 500, 30)
    .fill();

  doc
    .fillColor(textColor)
    .font('Helvetica-Bold')
    .fontSize(10);
  
  generateTableRow(doc, tableTop, 'Item Description', 'Qty', 'Unit Price', 'Total Amount');
  
  doc.strokeColor('#dddddd').lineWidth(1).moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

  // Items
  doc.font('Helvetica');
  let position = tableTop + 35;

  for (const item of order.items) {
    if (position > 650) {
      doc.addPage();
      position = 50;
    }
    
    // Instead of drawing a rect background, just text
    const name = item.product?.name || item.name || 'Product';
    
    doc.fillColor(textColor);
    generateTableRow(
      doc,
      position,
      name,
      item.quantity,
      `Rs. ${item.price.toFixed(2)}`,
      `Rs. ${(item.price * item.quantity).toFixed(2)}`
    );
    
    const height = doc.heightOfString(name, { width: 220 });
    const rowHeight = Math.max(height + 15, 30);
    
    doc.strokeColor('#eeeeee').lineWidth(1).moveTo(50, position + height + 10).lineTo(550, position + height + 10).stroke();
    position += rowHeight;
  }

  // Summary Box
  const summaryTop = position + 20;
  
  doc.font('Helvetica-Bold').fillColor(textColor);
  generateTableRow(doc, summaryTop, '', '', 'Subtotal:', `Rs. ${order.subtotal.toFixed(2)}`);
  
  let currentSummaryY = summaryTop + 20;
  
  if (order.shippingFee > 0) {
    doc.font('Helvetica').fillColor(lightText);
    generateTableRow(doc, currentSummaryY, '', '', 'Shipping:', `Rs. ${order.shippingFee.toFixed(2)}`);
    currentSummaryY += 20;
  }
  
  if (order.discount > 0) {
    doc.font('Helvetica').fillColor('#e74c3c');
    generateTableRow(doc, currentSummaryY, '', '', 'Discount:', `- Rs. ${order.discount.toFixed(2)}`);
    currentSummaryY += 20;
  }
  
  // Total line
  doc.strokeColor('#dddddd').lineWidth(2).moveTo(350, currentSummaryY - 5).lineTo(550, currentSummaryY - 5).stroke();
  
  doc.font('Helvetica-Bold').fontSize(12).fillColor(brandColor);
  doc.text('Total:', 350, currentSummaryY, { width: 80, align: 'right' });
  doc.text(`Rs. ${order.total.toFixed(2)}`, 450, currentSummaryY, { width: 80, align: 'right' });

  // Footer
  const footerTop = doc.page.height - 90;
  doc
    .strokeColor('#dddddd')
    .lineWidth(1)
    .moveTo(50, footerTop - 15)
    .lineTo(550, footerTop - 15)
    .stroke();

  doc
    .font('Helvetica-Oblique')
    .fontSize(10)
    .fillColor(brandColor)
    .text(
      'Thank you for shopping with Manju\'s Atelier!',
      50,
      footerTop,
      { align: 'center', width: 500, lineBreak: false }
    );
    
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(lightText)
    .text(
      'For any inquiries, please contact us at queries@manjusatelier.in',
      50,
      footerTop + 15,
      { align: 'center', width: 500, lineBreak: false }
    );

  doc.end();
}

function generateTableRow(doc, y, item, qty, unit, total) {
  doc
    .text(item, 50, y, { width: 220 })
    .text(qty, 280, y, { width: 50, align: 'center' })
    .text(unit, 350, y, { width: 80, align: 'right' })
    .text(total, 450, y, { width: 80, align: 'right' });
}

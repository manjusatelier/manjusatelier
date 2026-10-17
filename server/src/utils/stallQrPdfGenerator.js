import PDFDocument from 'pdfkit';

/**
 * Generates a high-resolution, print-ready A4 PDF standee flyer for offline stalls
 * featuring an embedded review QR code and a heartfelt feedback request.
 */
export async function generateStallQrPdf(options = {}, res) {
  const {
    headline = 'Loved Our Handcrafted Creations?',
    message = 'Every stitch, petal, and craft is made by hand with immense love and care.\n\nAs a homegrown artisan studio, your review means the world to us! Taking just 30 seconds to share your experience helps us reach more handmade craft lovers across India.',
    stallName = '',
    targetUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://manjusatelier.in'}/offline-review`,
    inline = false,
  } = options;

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 35, bottom: 35, left: 35, right: 35 },
    info: {
      Title: "Manju's Atelier — Stall Review QR Flyer",
      Author: "Manju's Atelier",
      Subject: 'Customer Feedback & Review Standee Flyer',
    },
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="manjus-atelier-stall-review-qr.pdf"`
  );

  doc.pipe(res);

  const primaryGold = '#b8860b';
  const accentGold = '#c19b6c';
  const darkBrown = '#2d2015';
  const lightBg = '#fcfaf5';
  const mutedText = '#604c3d';
  const cardBorder = '#d8c1a6';

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  // 1. Warm artisanal background
  doc.rect(0, 0, pageWidth, pageHeight).fill(lightBg);

  // 2. Elegant double-line decorative frame
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(2.5).strokeColor(primaryGold).stroke();
  doc.rect(26, 26, pageWidth - 52, pageHeight - 52).lineWidth(0.8).strokeColor(cardBorder).stroke();

  // Corner accent marks
  const corners = [
    [24, 24],
    [pageWidth - 24, 24],
    [24, pageHeight - 24],
    [pageWidth - 24, pageHeight - 24],
  ];
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 2).fillColor(primaryGold).fill();
  });

  // 3. Brand Header
  doc.y = 48;
  doc
    .fillColor(primaryGold)
    .fontSize(15)
    .font('Helvetica-Bold')
    .text("M A N J U ' S   A T E L I E R", { align: 'center', characterSpacing: 3 });

  doc.moveDown(0.25);
  doc
    .fillColor(mutedText)
    .fontSize(9.5)
    .font('Helvetica-Oblique')
    .text('Handcrafted with Love  *  Pure Indian Artistry', { align: 'center', characterSpacing: 1 });

  // Decorative divider
  doc.moveDown(0.9);
  const divY = doc.y;
  doc
    .strokeColor(accentGold)
    .lineWidth(1)
    .moveTo(pageWidth / 2 - 90, divY)
    .lineTo(pageWidth / 2 + 90, divY)
    .stroke();
  doc.circle(pageWidth / 2, divY, 2.5).fillColor(primaryGold).fill();

  doc.moveDown(1.2);

  // Optional Stall / Event Pill
  if (stallName && stallName.trim()) {
    const cleanStall = stallName.trim();
    doc
      .fillColor(primaryGold)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`[  ${cleanStall.toUpperCase()}  ]`, { align: 'center', characterSpacing: 1.5 });
    doc.moveDown(0.8);
  }

  // 4. Headline
  doc
    .fillColor(darkBrown)
    .fontSize(23)
    .font('Helvetica-Bold')
    .text(headline, { align: 'center', lineGap: 2 });

  doc.moveDown(0.6);

  // 5. Heartwarming Message
  const safeMessage = message.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu, '');
  doc
    .fillColor(mutedText)
    .fontSize(11)
    .font('Helvetica')
    .text(safeMessage, {
      align: 'center',
      lineGap: 4,
      width: pageWidth - 130,
      indent: 0,
    });

  doc.moveDown(1.2);

  // 6. Fetch & Embed QR Code
  const qrCardWidth = 250;
  const qrCardHeight = 280;
  const qrCardX = (pageWidth - qrCardWidth) / 2;
  const qrCardY = doc.y;

  // White Card Container
  doc
    .roundedRect(qrCardX, qrCardY, qrCardWidth, qrCardHeight, 14)
    .fillAndStroke('#ffffff', cardBorder);

  // Card Header Tag
  doc
    .fillColor(primaryGold)
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .text('SCAN TO REVIEW & GET FEATURED', qrCardX, qrCardY + 14, {
      width: qrCardWidth,
      align: 'center',
      characterSpacing: 0.8,
    });

  // Fetch QR Code image as PNG buffer
  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=10&data=${encodeURIComponent(targetUrl)}`;
    const qrResponse = await fetch(qrApiUrl);
    if (!qrResponse.ok) throw new Error('Failed to fetch QR image');
    const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());

    const qrImgSize = 180;
    doc.image(qrBuffer, qrCardX + (qrCardWidth - qrImgSize) / 2, qrCardY + 34, {
      width: qrImgSize,
      height: qrImgSize,
    });
  } catch (err) {
    console.error('Failed to embed QR image in PDF:', err);
    doc
      .fillColor(darkBrown)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('QR Code Placeholder', qrCardX, qrCardY + 100, { width: qrCardWidth, align: 'center' });
  }

  // Camera instruction text inside card
  doc
    .fillColor(darkBrown)
    .fontSize(9.5)
    .font('Helvetica')
    .text('Point your smartphone camera to scan', qrCardX, qrCardY + 232, {
      width: qrCardWidth,
      align: 'center',
    });

  doc
    .fillColor(primaryGold)
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text(targetUrl.replace(/^https?:\/\//, ''), qrCardX, qrCardY + 250, {
      width: qrCardWidth,
      align: 'center',
    });

  // 7. Bottom Thank You & Social handles
  doc.y = qrCardY + qrCardHeight + 22;

  doc
    .fillColor(darkBrown)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('Share photos of your craft to get featured on our Instagram!', { align: 'center' });

  doc.moveDown(0.4);
  doc
    .fillColor(mutedText)
    .fontSize(9.5)
    .font('Helvetica')
    .text('Instagram: @manjusatelier   |   Website: www.manjusatelier.in', { align: 'center' });

  doc.moveDown(0.7);
  doc
    .fillColor(primaryGold)
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .text('Thank You for Supporting Local & Handmade Artistry!', { align: 'center' });

  doc.end();
}

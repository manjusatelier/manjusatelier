import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

/**
 * Generates a high-resolution, print-ready A4 PDF standee flyer for offline stalls
 * matching the exact content, text, and layout shown in the application.
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
    margins: { top: 30, bottom: 30, left: 30, right: 30 },
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

  const pageWidth = doc.page.width;   // 595.28
  const pageHeight = doc.page.height; // 841.89

  // 1. Warm artisanal background
  doc.rect(0, 0, pageWidth, pageHeight).fill(lightBg);

  // 2. Elegant double-line decorative frame
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40).lineWidth(2.5).strokeColor(primaryGold).stroke();
  doc.rect(26, 26, pageWidth - 52, pageHeight - 52).lineWidth(0.8).strokeColor(cardBorder).stroke();

  // Corner accent marks
  const corners = [
    [23, 23],
    [pageWidth - 23, 23],
    [23, pageHeight - 23],
    [pageWidth - 23, pageHeight - 23],
  ];
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 2.5).fillColor(primaryGold).fill();
  });

  // 3. Brand Header (Vertically balanced)
  doc.y = 72;
  doc
    .fillColor(primaryGold)
    .fontSize(17)
    .font('Helvetica-Bold')
    .text("M A N J U ' S   A T E L I E R", 0, doc.y, {
      align: 'center',
      width: pageWidth,
      characterSpacing: 4,
    });

  doc.moveDown(0.35);
  doc
    .fillColor(mutedText)
    .fontSize(10.5)
    .font('Helvetica-Oblique')
    .text('Handcrafted with Love  *  Pure Artistry', 0, doc.y, {
      align: 'center',
      width: pageWidth,
      characterSpacing: 1.2,
    });

  // Decorative divider
  doc.moveDown(0.7);
  const divY = doc.y;
  doc
    .strokeColor(accentGold)
    .lineWidth(1)
    .moveTo(pageWidth / 2 - 80, divY)
    .lineTo(pageWidth / 2 + 80, divY)
    .stroke();
  doc.circle(pageWidth / 2, divY, 2.5).fillColor(primaryGold).fill();

  doc.y = divY + 22;

  // Optional Stall / Event Pill
  if (stallName && stallName.trim()) {
    const cleanStall = stallName.trim();
    doc
      .fillColor(primaryGold)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`[  ${cleanStall.toUpperCase()}  ]`, 0, doc.y, {
        align: 'center',
        width: pageWidth,
        characterSpacing: 1.5,
      });
    doc.moveDown(0.8);
  }

  // 4. Headline
  const headlineWidth = 490;
  const headlineX = (pageWidth - headlineWidth) / 2;
  doc
    .fillColor(darkBrown)
    .fontSize(25)
    .font('Helvetica-Bold')
    .text(headline, headlineX, doc.y, {
      width: headlineWidth,
      align: 'center',
      lineGap: 3,
    });

  doc.moveDown(0.75);

  // 5. Customer Review Request Message (Fixed center indentation)
  const safeMessage = message.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
    ''
  );

  const msgWidth = 470;
  const msgX = (pageWidth - msgWidth) / 2;
  const paragraphs = safeMessage.split('\n\n').map((p) => p.trim()).filter(Boolean);

  paragraphs.forEach((p, idx) => {
    doc
      .fillColor(mutedText)
      .fontSize(12)
      .font('Helvetica')
      .text(p, msgX, doc.y, {
        width: msgWidth,
        align: 'center',
        lineGap: 4.5,
      });
    if (idx < paragraphs.length - 1) {
      doc.moveDown(0.65);
    }
  });

  doc.moveDown(1.2);

  // 6. QR Code Card (Clean, high-resolution standee box)
  const qrCardWidth = 280;
  const qrCardHeight = 315;
  const qrCardX = (pageWidth - qrCardWidth) / 2;
  const qrCardY = doc.y;

  // White Card Container
  doc
    .roundedRect(qrCardX, qrCardY, qrCardWidth, qrCardHeight, 16)
    .fillAndStroke('#ffffff', cardBorder);

  // Card Header Tag matching Application preview: "* SCAN WITH PHONE CAMERA *"
  doc
    .fillColor(primaryGold)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('*  SCAN WITH PHONE CAMERA  *', qrCardX, qrCardY + 16, {
      width: qrCardWidth,
      align: 'center',
      characterSpacing: 1.2,
    });

  // Generate QR Code image as PNG buffer locally
  try {
    const qrBuffer = await QRCode.toBuffer(targetUrl, {
      width: 600,
      margin: 1,
      color: {
        dark: '#2d2015',
        light: '#ffffff',
      },
    });

    const qrImgSize = 205;
    doc.image(qrBuffer, qrCardX + (qrCardWidth - qrImgSize) / 2, qrCardY + 38, {
      width: qrImgSize,
      height: qrImgSize,
    });
  } catch (err) {
    console.error('Local QR buffer failed, trying fallback API:', err);
    try {
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&margin=10&data=${encodeURIComponent(targetUrl)}`;
      const qrResponse = await fetch(qrApiUrl);
      if (!qrResponse.ok) throw new Error('Failed to fetch QR image');
      const qrBuffer = Buffer.from(await qrResponse.arrayBuffer());

      const qrImgSize = 205;
      doc.image(qrBuffer, qrCardX + (qrCardWidth - qrImgSize) / 2, qrCardY + 38, {
        width: qrImgSize,
        height: qrImgSize,
      });
    } catch (fallbackErr) {
      console.error('Failed to embed QR image in PDF:', fallbackErr);
      doc
        .fillColor(darkBrown)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Scan for Offline Review', qrCardX, qrCardY + 110, {
          width: qrCardWidth,
          align: 'center',
        });
    }
  }

  // URL inside card matching application: "manjusatelier.in/offline-review"
  const cleanUrl = targetUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  doc
    .fillColor(primaryGold)
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .text(cleanUrl, qrCardX, qrCardY + 266, {
      width: qrCardWidth,
      align: 'center',
    });

  // 7. Footer note matching Application: "Tag us on Instagram: @manjusatelier"
  const footerY = qrCardY + qrCardHeight + 35;
  doc
    .fillColor(darkBrown)
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Tag us on Instagram: @manjusatelier', 0, footerY, {
      width: pageWidth,
      align: 'center',
    });

  doc.end();
}

import { PDFDocument, rgb, StandardFonts, PDFName } from 'pdf-lib';

export const pdfGenerator = {
  /**
   * Compiles a professional two-page Delivery instructions PDF for Etsy purchases.
   * Features high-contrast dark panels, champagne/emerald borders, and real CLICKABLE button links!
   */
  async generateDeliveryPDF(
    projectName: string,
    authorName: string,
    supportEmail: string,
    canvaLink: string
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    
    // Page Dimensions (Standard US Letter 612 x 792)
    const width = 612;
    const height = 792;
    const page = pdfDoc.addPage([width, height]);

    // Fonts setup
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Color definitions (Emerald/Teal and deep backgrounds)
    const colorBg = rgb(0.02, 0.04, 0.08); // obsidian
    const colorPrimary = rgb(0.06, 0.72, 0.5); // emerald
    const colorTextLight = rgb(0.95, 0.95, 0.98); // white
    const colorTextMuted = rgb(0.58, 0.64, 0.72); // gray slate
    const colorWhite = rgb(1, 1, 1);

    // 1. DRAW BACKGROUND
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: colorBg
    });

    // 2. DESIGN FRAME/BORDER ACCENTS
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: colorPrimary,
      borderWidth: 2,
      opacity: 0.2
    });

    // 3. TOP GLOW BAR
    page.drawRectangle({
      x: 0,
      y: height - 8,
      width,
      height: 8,
      color: colorPrimary
    });

    // 4. MAIN TITLE HEADINGS
    page.drawText('THANK YOU FOR YOUR PURCHASE!', {
      x: 50,
      y: height - 120,
      size: 26,
      font: helveticaBold,
      color: colorWhite
    });

    page.drawText('YOUR EDITABLE DIGITAL BUNDLE IS READY', {
      x: 50,
      y: height - 150,
      size: 13,
      font: helveticaBold,
      color: colorPrimary
    });

    // 5. PROJECT INFOCARD GLOW PANEL
    page.drawRectangle({
      x: 50,
      y: height - 320,
      width: width - 100,
      height: 120,
      color: rgb(0.08, 0.11, 0.18),
      borderColor: rgb(0.15, 0.23, 0.35),
      borderWidth: 1
    });

    page.drawText('PRODUCT PACKAGE DETAILS:', {
      x: 75,
      y: height - 235,
      size: 10,
      font: helveticaBold,
      color: colorPrimary
    });

    page.drawText(projectName.toUpperCase(), {
      x: 75,
      y: height - 265,
      size: 18,
      font: helveticaBold,
      color: colorTextLight
    });

    page.drawText(`Format: Canva Editable Templates  |  Compiled By: ${authorName}`, {
      x: 75,
      y: height - 295,
      size: 9,
      font: helvetica,
      color: colorTextMuted
    });

    // 6. DETAILED INSTRUCTIONS COPY
    let yCursor = height - 370;
    
    page.drawText('HOW TO ACCESS AND EDIT YOUR SHABLONS:', {
      x: 50,
      y: yCursor,
      size: 12,
      font: helveticaBold,
      color: colorWhite
    });
    
    const steps = [
      '1. Click the large active access button in this PDF below.',
      '2. It will open Canva.com in your browser (free account is sufficient!).',
      '3. Click "Use Template" to import the assets directly to your account.',
      '4. Upload your own photography, and edit all text layers, colors, and graphics.',
      '5. Export your final designs as high-quality PNG or PDF Print files.'
    ];

    yCursor -= 25;
    for (const step of steps) {
      page.drawText(step, {
        x: 50,
        y: yCursor,
        size: 10,
        font: helvetica,
        color: colorTextMuted
      });
      yCursor -= 20;
    }

    // 7. INTERACTIVE LINK ACCESS BUTTON
    yCursor -= 60;
    const btnWidth = 360;
    const btnHeight = 46;
    const btnX = (width - btnWidth) / 2;
    const btnY = yCursor;

    // Draw active button background
    page.drawRectangle({
      x: btnX,
      y: btnY,
      width: btnWidth,
      height: btnHeight,
      color: colorPrimary,
      rx: 12
    } as any);

    // Draw active button text
    const textStr = 'ACCESS YOUR TEMPLATE IN CANVA';
    const textWidth = helveticaBold.widthOfTextAtSize(textStr, 12);
    page.drawText(textStr, {
      x: btnX + (btnWidth - textWidth) / 2,
      y: btnY + (btnHeight - 12) / 2 + 2,
      size: 12,
      font: helveticaBold,
      color: colorBg
    });

    // INJECT CLICKABLE WEB LINK ANNOTATION
    const linkAnnotation = pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [btnX, btnY, btnX + btnWidth, btnY + btnHeight],
      Border: [0, 0, 0],
      A: {
        Type: 'Action',
        S: 'URI',
        URI: canvaLink
      }
    });

    // Register link
    const annots = page.node.get(PDFName.of('Annots')) as any;
    if (annots) {
      annots.push(linkAnnotation);
    } else {
      page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));
    }

    // 8. BRANDS & TECHNICAL NOTICE SUPPORT
    yCursor -= 60;
    page.drawText('NEED CUSTOMER SUPPORT?', {
      x: 50,
      y: yCursor,
      size: 11,
      font: helveticaBold,
      color: colorWhite
    });

    yCursor -= 20;
    page.drawText(`If you encounter any issues or need support, contact our administrator team at:`, {
      x: 50,
      y: yCursor,
      size: 10,
      font: helvetica,
      color: colorTextMuted
    });

    yCursor -= 18;
    page.drawText(supportEmail, {
      x: 50,
      y: yCursor,
      size: 11,
      font: helveticaBold,
      color: colorPrimary
    });

    // Footer notice
    page.drawText('Etsy Canva AI Studio © All rights reserved. Templates licensed for single brand use.', {
      x: 50,
      y: 50,
      size: 8,
      font: helvetica,
      color: rgb(0.3, 0.35, 0.45)
    });

    // Save and return buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};

/**
 * Lightweight, zero-dependency, local-first client-side PDF 1.4 document builder.
 * Runs 100% offline in browser and Node.js environments.
 * Produces crisp, vector-rendered, selectable-text PDF documents.
 */

export interface PdfColor {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export type StandardFont = 'Helvetica' | 'Helvetica-Bold' | 'Helvetica-Oblique';

export interface TextOptions {
  font?: StandardFont;
  size?: number;
  color?: PdfColor;
  align?: 'left' | 'right' | 'center';
  maxWidth?: number;
}

export interface RectOptions {
  fillColor?: PdfColor;
  strokeColor?: PdfColor;
  lineWidth?: number;
}

export interface LineOptions {
  color?: PdfColor;
  lineWidth?: number;
  dash?: number[];
}

export class PdfDocumentBuilder {
  // A4 dimensions in points (72 points = 1 inch)
  public static readonly A4_WIDTH = 595.28;
  public static readonly A4_HEIGHT = 841.89;

  private pages: string[] = [''];
  private currentPageIndex = 0;
  private title: string = 'Faktur Penjualan';

  constructor(title: string = 'Faktur Penjualan') {
    this.title = title;
  }

  /**
   * Adds a new A4 page and sets it as the active drawing page.
   */
  public addPage(): void {
    this.pages.push('');
    this.currentPageIndex = this.pages.length - 1;
  }

  public get pageCount(): number {
    return this.pages.length;
  }

  public setPage(index: number): void {
    if (index >= 0 && index < this.pages.length) {
      this.currentPageIndex = index;
    }
  }

  /**
   * Translates top-left coordinate (user space) to bottom-left coordinate (PDF space).
   */
  private toPdfY(y: number): number {
    return PdfDocumentBuilder.A4_HEIGHT - y;
  }

  private append(content: string): void {
    this.pages[this.currentPageIndex] += content + '\n';
  }

  private formatColor(c: PdfColor): string {
    const r = (Math.max(0, Math.min(255, c.r)) / 255).toFixed(3);
    const g = (Math.max(0, Math.min(255, c.g)) / 255).toFixed(3);
    const b = (Math.max(0, Math.min(255, c.b)) / 255).toFixed(3);
    return `${r} ${g} ${b}`;
  }

  private getFontKey(font: StandardFont): string {
    switch (font) {
      case 'Helvetica-Bold':
        return '/F2';
      case 'Helvetica-Oblique':
        return '/F3';
      case 'Helvetica':
      default:
        return '/F1';
    }
  }

  /**
   * Escapes special characters for PDF literal string syntax.
   * Maps common UTF-8 symbols to standard ASCII / WinAnsi characters.
   */
  private sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2013\u2014]/g, '-') // En/em dashes
      .replace(/\u2022/g, '*') // Bullet
      .replace(/\u2026/g, '...') // Ellipsis
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' '); // Strip unsupported glyphs to preserve PDF integrity
  }

  /**
   * Approximates text width in points for Helvetica.
   */
  public measureTextWidth(text: string, fontSize: number, isBold: boolean = false): number {
    const boldFactor = isBold ? 1.08 : 1.0;
    // Average character width for Helvetica is ~0.52 of font size
    return text.length * (fontSize * 0.52) * boldFactor;
  }

  /**
   * Draws a filled and/or stroked rectangle.
   */
  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: RectOptions = {}
  ): void {
    const pdfY = this.toPdfY(y + height);
    let cmd = 'q\n';

    if (options.fillColor) {
      cmd += `${this.formatColor(options.fillColor)} rg\n`;
    }
    if (options.strokeColor) {
      cmd += `${this.formatColor(options.strokeColor)} RG\n`;
      cmd += `${(options.lineWidth || 1).toFixed(2)} w\n`;
    }

    cmd += `${x.toFixed(2)} ${pdfY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re\n`;

    if (options.fillColor && options.strokeColor) {
      cmd += 'B\n'; // fill and stroke
    } else if (options.fillColor) {
      cmd += 'f\n'; // fill only
    } else if (options.strokeColor) {
      cmd += 'S\n'; // stroke only
    }

    cmd += 'Q';
    this.append(cmd);
  }

  /**
   * Draws a straight line between two points.
   */
  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: LineOptions = {}
  ): void {
    const pdfY1 = this.toPdfY(y1);
    const pdfY2 = this.toPdfY(y2);
    let cmd = 'q\n';

    if (options.color) {
      cmd += `${this.formatColor(options.color)} RG\n`;
    }
    cmd += `${(options.lineWidth || 1).toFixed(2)} w\n`;

    if (options.dash && options.dash.length > 0) {
      cmd += `[${options.dash.join(' ')}] 0 d\n`;
    }

    cmd += `${x1.toFixed(2)} ${pdfY1.toFixed(2)} m ${x2.toFixed(2)} ${pdfY2.toFixed(2)} l S\n`;
    cmd += 'Q';
    this.append(cmd);
  }

  /**
   * Draws a single line of text with custom alignment and color.
   */
  public drawText(
    text: string,
    x: number,
    y: number,
    options: TextOptions = {}
  ): void {
    const font = options.font || 'Helvetica';
    const size = options.size || 10;
    const color = options.color || { r: 30, g: 41, b: 59 };
    const align = options.align || 'left';
    const fontKey = this.getFontKey(font);
    const isBold = font === 'Helvetica-Bold';

    const safeText = this.sanitizeText(text);
    if (!safeText) return;

    let targetX = x;
    const measuredWidth = this.measureTextWidth(safeText, size, isBold);

    if (align === 'right') {
      targetX = x - measuredWidth;
    } else if (align === 'center') {
      targetX = x - measuredWidth / 2;
    }

    // PDF text baseline offset
    const pdfY = this.toPdfY(y);

    let cmd = 'BT\n';
    cmd += `${fontKey} ${size.toFixed(2)} Tf\n`;
    cmd += `${this.formatColor(color)} rg\n`;
    cmd += `${targetX.toFixed(2)} ${pdfY.toFixed(2)} Td\n`;
    cmd += `(${safeText}) Tj\n`;
    cmd += 'ET';

    this.append(cmd);
  }

  /**
   * Splits and draws multi-line text with automatic line-wrapping.
   * Returns the final Y position after the wrapped block.
   */
  public drawWrappedText(
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    options: TextOptions & { lineHeight?: number } = {}
  ): number {
    const size = options.size || 9;
    const lineHeight = options.lineHeight || size * 1.35;
    const font = options.font || 'Helvetica';
    const isBold = font === 'Helvetica-Bold';

    const rawLines = text.split('\n');
    let currentY = y;

    for (const rawLine of rawLines) {
      const words = rawLine.split(' ');
      let currentLine = '';

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        const width = this.measureTextWidth(testLine, size, isBold);

        if (width > maxWidth && currentLine) {
          this.drawText(currentLine, x, currentY, options);
          currentY += lineHeight;
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        this.drawText(currentLine, x, currentY, options);
        currentY += lineHeight;
      }
    }

    return currentY;
  }

  /**
   * Compiles and outputs the entire PDF document as a binary Uint8Array.
   */
  public build(): Uint8Array {
    const objects: string[] = [];
    const offsets: number[] = [];

    // Helper to register an object and track its byte offset
    const addObject = (body: string): number => {
      objects.push(body);
      return objects.length; // 1-indexed object ID
    };

    // 1: Catalog
    // 2: Pages
    // 3, 4, 5: Fonts (Helvetica, Helvetica-Bold, Helvetica-Oblique)
    // Pages kids array will refer to individual page objects
    const pageObjIds: number[] = [];

    // Allocate font objects first
    const font1Id = 3;
    const font2Id = 4;
    const font3Id = 5;

    // Build page objects & content stream objects
    // Each page gets a Page object + a Stream object
    let nextAvailableId = 6;
    const pageStreamPairs: { pageId: number; streamId: number; content: string }[] = [];

    for (const pageContent of this.pages) {
      const pageId = nextAvailableId++;
      const streamId = nextAvailableId++;
      pageObjIds.push(pageId);
      pageStreamPairs.push({ pageId, streamId, content: pageContent });
    }

    // Object 1: Catalog
    objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;

    // Object 2: Pages tree
    const kidsStr = pageObjIds.map((id) => `${id} 0 R`).join(' ');
    objects[1] = `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageObjIds.length} >>`;

    // Objects 3, 4, 5: Standard Type1 Fonts
    objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;
    objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>`;

    // Fill Page objects and Content Stream objects
    for (const pair of pageStreamPairs) {
      // Page Object
      objects[pair.pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PdfDocumentBuilder.A4_WIDTH} ${PdfDocumentBuilder.A4_HEIGHT}] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R /F3 ${font3Id} 0 R >> >> /Contents ${pair.streamId} 0 R >>`;

      // Content Stream
      const streamBytes = pair.content;
      const streamLen = new TextEncoder().encode(streamBytes).length;
      objects[pair.streamId - 1] = `<< /Length ${streamLen} >>\nstream\n${streamBytes}\nendstream`;
    }

    // Now assemble full PDF stream
    let pdfString = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';

    for (let i = 0; i < objects.length; i++) {
      const objId = i + 1;
      offsets.push(new TextEncoder().encode(pdfString).length);
      pdfString += `${objId} 0 obj\n${objects[i]}\nendobj\n`;
    }

    // XREF Table
    const startXref = new TextEncoder().encode(pdfString).length;
    pdfString += `xref\n0 ${objects.length + 1}\n`;
    pdfString += '0000000000 65535 f \n';

    for (const offset of offsets) {
      const padded = offset.toString().padStart(10, '0');
      pdfString += `${padded} 00000 n \n`;
    }

    // Trailer
    const safeTitle = this.sanitizeText(this.title);
    pdfString += `trailer\n<<\n  /Size ${objects.length + 1}\n  /Root 1 0 R\n  /Info << /Title (${safeTitle}) /Producer (Ficco Local-First PDF Engine) >>\n>>\nstartxref\n${startXref}\n%%EOF\n`;

    return new TextEncoder().encode(pdfString);
  }

  /**
   * Generates a Blob ready for browser download or viewing.
   */
  public toBlob(): Blob {
    const bytes = this.build();
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Generates a data URL for preview iframes.
   */
  public toDataUri(): string {
    const blob = this.toBlob();
    return URL.createObjectURL(blob);
  }

  /**
   * Triggers an immediate browser download of the PDF file.
   */
  public download(filename: string): void {
    const blob = this.toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}

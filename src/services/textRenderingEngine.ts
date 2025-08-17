import { EnhancedTextBlock } from './enhancedOcrService';
import { StyleAnalysis } from './visualStyleAnalyzer';

// Text rendering options
export interface RenderingOptions {
  preserveOriginalStyle: boolean;
  adaptiveScaling: boolean;
  qualityLevel: 'low' | 'medium' | 'high' | 'ultra';
  antialiasing: boolean;
  subpixelRendering: boolean;
}

// Font loading and matching
export interface FontDescriptor {
  family: string;
  weight: string;
  style: string;
  size: number;
  fallbacks: string[];
}

// Text layout information
export interface TextLayout {
  lines: TextLine[];
  totalWidth: number;
  totalHeight: number;
  baseline: number;
}

export interface TextLine {
  text: string;
  width: number;
  height: number;
  x: number;
  y: number;
  words: TextWord[];
}

export interface TextWord {
  text: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

// Rendering result
export interface RenderingResult {
  canvas: HTMLCanvasElement;
  success: boolean;
  scaleFactor: number;
  actualFont: FontDescriptor;
  layout: TextLayout;
  renderTime: number;
}

export class TextRenderingEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fontCache: Map<string, FontDescriptor> = new Map();
  private measureCanvas: HTMLCanvasElement;
  private measureCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.measureCanvas = document.createElement('canvas');
    this.measureCtx = this.measureCanvas.getContext('2d')!;
    
    // Enable high-quality rendering
    this.setupHighQualityRendering();
  }

  /**
   * Render translated text with preserved style
   */
  async renderTranslatedText(
    originalBlock: EnhancedTextBlock,
    translatedText: string,
    styleAnalysis: StyleAnalysis,
    targetBounds: { width: number; height: number },
    options: RenderingOptions = this.getDefaultOptions()
  ): Promise<RenderingResult> {
    const startTime = performance.now();
    
    // Setup canvas
    this.canvas.width = targetBounds.width;
    this.canvas.height = targetBounds.height;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, targetBounds.width, targetBounds.height);
    
    try {
      // Load and prepare font
      const font = await this.prepareFontForRendering(styleAnalysis.typography, options);
      
      // Calculate optimal layout
      const layout = this.calculateTextLayout(
        translatedText,
        font,
        targetBounds,
        styleAnalysis.layout,
        options
      );
      
      // Apply text effects (shadows, outlines)
      this.applyTextEffects(styleAnalysis.effects);
      
      // Render the text
      this.renderTextWithStyle(
        layout,
        font,
        styleAnalysis,
        options
      );
      
      const renderTime = performance.now() - startTime;
      
      return {
        canvas: this.canvas,
        success: true,
        scaleFactor: layout.totalHeight / targetBounds.height,
        actualFont: font,
        layout,
        renderTime
      };
      
    } catch (error) {
      console.error('Text rendering failed:', error);
      
      return {
        canvas: this.canvas,
        success: false,
        scaleFactor: 1,
        actualFont: this.getDefaultFont(),
        layout: this.getEmptyLayout(),
        renderTime: performance.now() - startTime
      };
    }
  }

  /**
   * Setup high-quality rendering context
   */
  private setupHighQualityRendering(): void {
    // Enable high-DPI rendering
    const dpr = window.devicePixelRatio || 1;
    
    [this.ctx, this.measureCtx].forEach(ctx => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
    });
  }

  /**
   * Prepare font for rendering with fallbacks
   */
  private async prepareFontForRendering(
    typography: StyleAnalysis['typography'],
    options: RenderingOptions
  ): Promise<FontDescriptor> {
    const cacheKey = this.getFontCacheKey(typography);
    
    if (this.fontCache.has(cacheKey)) {
      return this.fontCache.get(cacheKey)!;
    }
    
    // Create font descriptor with fallbacks
    const font: FontDescriptor = {
      family: typography.fontFamily,
      weight: typography.fontWeight,
      style: typography.fontStyle,
      size: typography.fontSize,
      fallbacks: this.generateFontFallbacks(typography.fontFamily)
    };
    
    // Test font availability and load if necessary
    const availableFont = await this.findAvailableFont(font);
    
    this.fontCache.set(cacheKey, availableFont);
    return availableFont;
  }

  /**
   * Calculate optimal text layout
   */
  private calculateTextLayout(
    text: string,
    font: FontDescriptor,
    bounds: { width: number; height: number },
    layoutStyle: StyleAnalysis['layout'],
    options: RenderingOptions
  ): TextLayout {
    // Set font for measurements
    const fontString = this.buildFontString(font);
    this.measureCtx.font = fontString;
    
    // Handle text wrapping and line breaks
    const lines = this.wrapText(text, bounds.width, layoutStyle.alignment);
    
    // Calculate line positions
    const lineHeight = font.size * 1.2; // Default line height
    const totalHeight = lines.length * lineHeight;
    
    // Adjust font size if text doesn't fit
    let scaleFactor = 1;
    if (options.adaptiveScaling && totalHeight > bounds.height) {
      scaleFactor = bounds.height / totalHeight;
      font.size *= scaleFactor;
      this.measureCtx.font = this.buildFontString(font);
    }
    
    // Calculate final layout
    const layout: TextLayout = {
      lines: [],
      totalWidth: 0,
      totalHeight: totalHeight * scaleFactor,
      baseline: layoutStyle.baseline
    };
    
    let currentY = font.size;
    
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineWidth = this.measureCtx.measureText(lineText).width;
      
      // Calculate line position based on alignment
      let lineX = 0;
      switch (layoutStyle.alignment) {
        case 'center':
          lineX = (bounds.width - lineWidth) / 2;
          break;
        case 'right':
          lineX = bounds.width - lineWidth;
          break;
        case 'left':
        default:
          lineX = 0;
          break;
      }
      
      // Calculate word positions within the line
      const words = this.calculateWordPositions(lineText, lineX, currentY, font);
      
      layout.lines.push({
        text: lineText,
        width: lineWidth,
        height: lineHeight * scaleFactor,
        x: lineX,
        y: currentY,
        words
      });
      
      layout.totalWidth = Math.max(layout.totalWidth, lineWidth);
      currentY += lineHeight * scaleFactor;
    }
    
    return layout;
  }

  /**
   * Wrap text to fit within bounds
   */
  private wrapText(text: string, maxWidth: number, alignment: string): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.measureCtx.measureText(testLine).width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  /**
   * Calculate word positions within a line
   */
  private calculateWordPositions(
    lineText: string,
    lineX: number,
    lineY: number,
    font: FontDescriptor
  ): TextWord[] {
    const words: TextWord[] = [];
    const wordTexts = lineText.split(' ');
    let currentX = lineX;
    
    for (const wordText of wordTexts) {
      const wordWidth = this.measureCtx.measureText(wordText).width;
      const spaceWidth = this.measureCtx.measureText(' ').width;
      
      words.push({
        text: wordText,
        width: wordWidth,
        height: font.size,
        x: currentX,
        y: lineY
      });
      
      currentX += wordWidth + spaceWidth;
    }
    
    return words;
  }

  /**
   * Apply text effects (shadows, outlines, etc.)
   */
  private applyTextEffects(effects: StyleAnalysis['effects']): void {
    // Reset effects
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.strokeStyle = 'transparent';
    this.ctx.lineWidth = 0;
    
    // Apply shadow
    if (effects.hasShadow) {
      this.ctx.shadowColor = effects.shadowColor;
      this.ctx.shadowBlur = effects.shadowBlur;
      this.ctx.shadowOffsetX = effects.shadowOffset.x;
      this.ctx.shadowOffsetY = effects.shadowOffset.y;
    }
    
    // Apply outline
    if (effects.hasOutline) {
      this.ctx.strokeStyle = effects.outlineColor;
      this.ctx.lineWidth = effects.outlineWidth;
    }
    
    // Apply opacity
    this.ctx.globalAlpha = effects.opacity;
  }

  /**
   * Render text with preserved style
   */
  private renderTextWithStyle(
    layout: TextLayout,
    font: FontDescriptor,
    styleAnalysis: StyleAnalysis,
    options: RenderingOptions
  ): void {
    // Set font
    this.ctx.font = this.buildFontString(font);
    
    // Set text color
    this.ctx.fillStyle = styleAnalysis.color.textColor;
    
    // Render each line
    for (const line of layout.lines) {
      // Render outline first if needed
      if (styleAnalysis.effects.hasOutline) {
        this.ctx.strokeText(line.text, line.x, line.y);
      }
      
      // Render fill text
      this.ctx.fillText(line.text, line.x, line.y);
      
      // Render text decorations
      this.renderTextDecorations(line, font, styleAnalysis.typography);
    }
  }

  /**
   * Render text decorations (underline, strikethrough, etc.)
   */
  private renderTextDecorations(
    line: TextLine,
    font: FontDescriptor,
    typography: StyleAnalysis['typography']
  ): void {
    if (typography.textDecoration === 'none') return;
    
    this.ctx.strokeStyle = this.ctx.fillStyle;
    this.ctx.lineWidth = Math.max(1, font.size / 16);
    
    const decorationY = this.getDecorationY(line, typography.textDecoration, font);
    
    this.ctx.beginPath();
    this.ctx.moveTo(line.x, decorationY);
    this.ctx.lineTo(line.x + line.width, decorationY);
    this.ctx.stroke();
  }

  /**
   * Get Y position for text decoration
   */
  private getDecorationY(line: TextLine, decoration: string, font: FontDescriptor): number {
    switch (decoration) {
      case 'underline':
        return line.y + font.size * 0.1;
      case 'overline':
        return line.y - font.size * 0.8;
      case 'line-through':
        return line.y - font.size * 0.3;
      default:
        return line.y;
    }
  }

  /**
   * Find available font from descriptor
   */
  private async findAvailableFont(font: FontDescriptor): Promise<FontDescriptor> {
    const testFonts = [font.family, ...font.fallbacks];
    
    for (const fontFamily of testFonts) {
      if (await this.isFontAvailable(fontFamily)) {
        return { ...font, family: fontFamily };
      }
    }
    
    // Return default font if none available
    return { ...font, family: 'Arial, sans-serif' };
  }

  /**
   * Check if font is available
   */
  private async isFontAvailable(fontFamily: string): Promise<boolean> {
    try {
      // Use CSS Font Loading API if available
      if ('fonts' in document) {
        const font = new FontFace('test', `local("${fontFamily}")`);
        await font.load();
        return font.status === 'loaded';
      }
      
      // Fallback method: measure text width
      const testText = 'mmmmmmmmmmlli';
      const testSize = 72;
      
      this.measureCtx.font = `${testSize}px monospace`;
      const monoWidth = this.measureCtx.measureText(testText).width;
      
      this.measureCtx.font = `${testSize}px ${fontFamily}, monospace`;
      const testWidth = this.measureCtx.measureText(testText).width;
      
      return monoWidth !== testWidth;
    } catch {
      return false;
    }
  }

  /**
   * Generate font fallbacks
   */
  private generateFontFallbacks(fontFamily: string): string[] {
    const fallbacks = [
      'Arial',
      'Helvetica',
      'Times New Roman',
      'Georgia',
      'Verdana',
      'sans-serif',
      'serif'
    ];
    
    // Remove the original font from fallbacks
    return fallbacks.filter(f => !fontFamily.toLowerCase().includes(f.toLowerCase()));
  }

  /**
   * Build CSS font string
   */
  private buildFontString(font: FontDescriptor): string {
    const style = font.style !== 'normal' ? font.style : '';
    const weight = font.weight !== 'normal' ? font.weight : '';
    
    return `${style} ${weight} ${font.size}px ${font.family}`.trim();
  }

  /**
   * Get font cache key
   */
  private getFontCacheKey(typography: StyleAnalysis['typography']): string {
    return `${typography.fontFamily}_${typography.fontSize}_${typography.fontWeight}_${typography.fontStyle}`;
  }

  /**
   * Get default rendering options
   */
  private getDefaultOptions(): RenderingOptions {
    return {
      preserveOriginalStyle: true,
      adaptiveScaling: true,
      qualityLevel: 'high',
      antialiasing: true,
      subpixelRendering: true
    };
  }

  /**
   * Get default font
   */
  private getDefaultFont(): FontDescriptor {
    return {
      family: 'Arial, sans-serif',
      weight: 'normal',
      style: 'normal',
      size: 16,
      fallbacks: ['Helvetica', 'sans-serif']
    };
  }

  /**
   * Get empty layout
   */
  private getEmptyLayout(): TextLayout {
    return {
      lines: [],
      totalWidth: 0,
      totalHeight: 0,
      baseline: 0
    };
  }

  /**
   * Create a copy of the rendered canvas
   */
  cloneCanvas(): HTMLCanvasElement {
    const clone = document.createElement('canvas');
    clone.width = this.canvas.width;
    clone.height = this.canvas.height;
    
    const cloneCtx = clone.getContext('2d')!;
    cloneCtx.drawImage(this.canvas, 0, 0);
    
    return clone;
  }

  /**
   * Export rendered text as image data URL
   */
  exportAsDataURL(format: 'png' | 'jpeg' | 'webp' = 'png', quality: number = 1): string {
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Get rendering statistics
   */
  getStats(): {
    canvasSize: { width: number; height: number };
    fontCacheSize: number;
    memoryUsage: number;
  } {
    return {
      canvasSize: {
        width: this.canvas.width,
        height: this.canvas.height
      },
      fontCacheSize: this.fontCache.size,
      memoryUsage: this.canvas.width * this.canvas.height * 4 // RGBA bytes
    };
  }
}

export const textRenderingEngine = new TextRenderingEngine();
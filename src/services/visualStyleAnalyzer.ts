import { EnhancedTextBlock } from './enhancedOcrService';

// Advanced color analysis result
export interface ColorAnalysis {
  dominantColor: string;
  textColor: string;
  backgroundColor: string;
  shadowColor?: string;
  outlineColor?: string;
  contrast: number;
  colorScheme: 'light' | 'dark' | 'mixed';
}

// Typography analysis result
export interface TypographyAnalysis {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'light';
  fontStyle: 'normal' | 'italic';
  letterSpacing: number;
  lineHeight: number;
  textDecoration: 'none' | 'underline' | 'overline' | 'line-through';
}

// Layout analysis result
export interface LayoutAnalysis {
  alignment: 'left' | 'center' | 'right' | 'justify';
  rotation: number;
  skew: number;
  perspective: number;
  baseline: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

// Text effects analysis
export interface TextEffects {
  hasShadow: boolean;
  shadowOffset: { x: number; y: number };
  shadowBlur: number;
  shadowColor: string;
  hasOutline: boolean;
  outlineWidth: number;
  outlineColor: string;
  hasGradient: boolean;
  gradientColors: string[];
  opacity: number;
}

// Complete style analysis result
export interface StyleAnalysis {
  color: ColorAnalysis;
  typography: TypographyAnalysis;
  layout: LayoutAnalysis;
  effects: TextEffects;
  confidence: number;
}

export class VisualStyleAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Analyze visual style of a text block
   */
  async analyzeTextBlockStyle(
    textBlock: EnhancedTextBlock,
    imageData: ImageData,
    originalImage: HTMLImageElement
  ): Promise<StyleAnalysis> {
    const { bbox } = textBlock;
    const width = bbox.x1 - bbox.x0;
    const height = bbox.y1 - bbox.y0;

    // Extract region for detailed analysis
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(
      originalImage,
      bbox.x0, bbox.y0, width, height,
      0, 0, width, height
    );

    const regionImageData = this.ctx.getImageData(0, 0, width, height);

    // Perform comprehensive analysis
    const colorAnalysis = this.analyzeColors(regionImageData);
    const typographyAnalysis = this.analyzeTypography(regionImageData, textBlock);
    const layoutAnalysis = this.analyzeLayout(textBlock, originalImage);
    const effectsAnalysis = this.analyzeTextEffects(regionImageData);

    // Calculate overall confidence
    const confidence = this.calculateStyleConfidence(
      colorAnalysis,
      typographyAnalysis,
      layoutAnalysis,
      effectsAnalysis
    );

    return {
      color: colorAnalysis,
      typography: typographyAnalysis,
      layout: layoutAnalysis,
      effects: effectsAnalysis,
      confidence
    };
  }

  /**
   * Advanced color analysis with multiple techniques
   */
  private analyzeColors(imageData: ImageData): ColorAnalysis {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const pixels = width * height;

    // Color histogram
    const colorCounts = new Map<string, number>();
    const brightnesses: number[] = [];
    
    // Edge detection for text boundaries
    const edges = this.detectEdges(imageData);
    const textPixels: number[] = [];
    const backgroundPixels: number[] = [];

    for (let i = 0; i < pixels; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      
      brightnesses.push(brightness);
      
      const colorKey = `${Math.floor(r/16)*16},${Math.floor(g/16)*16},${Math.floor(b/16)*16}`;
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
      
      // Classify as text or background based on edge detection
      if (edges[i] > 0.5) {
        textPixels.push(brightness);
      } else {
        backgroundPixels.push(brightness);
      }
    }

    // Find dominant colors
    const sortedColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const dominantColor = `rgb(${sortedColors[0][0]})`;

    // Determine text and background colors
    const avgTextBrightness = textPixels.length > 0 
      ? textPixels.reduce((a, b) => a + b, 0) / textPixels.length 
      : 0;
    const avgBgBrightness = backgroundPixels.length > 0 
      ? backgroundPixels.reduce((a, b) => a + b, 0) / backgroundPixels.length 
      : 255;

    const textColor = avgTextBrightness < avgBgBrightness 
      ? this.brightnessToColor(avgTextBrightness)
      : this.brightnessToColor(avgBgBrightness);
    
    const backgroundColor = avgTextBrightness < avgBgBrightness 
      ? this.brightnessToColor(avgBgBrightness)
      : this.brightnessToColor(avgTextBrightness);

    // Calculate contrast ratio
    const contrast = this.calculateContrast(avgTextBrightness, avgBgBrightness);

    // Determine color scheme
    const avgBrightness = brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
    const colorScheme: 'light' | 'dark' | 'mixed' = 
      avgBrightness > 200 ? 'light' : 
      avgBrightness < 80 ? 'dark' : 'mixed';

    return {
      dominantColor,
      textColor,
      backgroundColor,
      contrast,
      colorScheme
    };
  }

  /**
   * Edge detection using Sobel operator
   */
  private detectEdges(imageData: ImageData): Float32Array {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const edges = new Float32Array(width * height);

    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            
            gx += gray * sobelX[kernelIdx];
            gy += gray * sobelY[kernelIdx];
          }
        }
        
        const magnitude = Math.sqrt(gx * gx + gy * gy) / 255;
        edges[y * width + x] = Math.min(1, magnitude);
      }
    }

    return edges;
  }

  /**
   * Analyze typography characteristics
   */
  private analyzeTypography(imageData: ImageData, textBlock: EnhancedTextBlock): TypographyAnalysis {
    const { bbox, text } = textBlock;
    const width = bbox.x1 - bbox.x0;
    const height = bbox.y1 - bbox.y0;

    // Estimate font size based on character height
    const fontSize = this.estimateFontSize(imageData, height);
    
    // Analyze font weight
    const fontWeight = this.analyzeFontWeight(imageData);
    
    // Detect italic style
    const fontStyle = this.detectItalic(imageData);
    
    // Estimate letter spacing
    const letterSpacing = this.estimateLetterSpacing(imageData, text.length);
    
    // Calculate line height
    const lineHeight = height / this.countLines(text);
    
    // Detect text decorations
    const textDecoration = this.detectTextDecoration(imageData);
    
    // Estimate font family
    const fontFamily = this.estimateFontFamily(imageData, fontSize);

    return {
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      letterSpacing,
      lineHeight,
      textDecoration
    };
  }

  /**
   * Estimate font size using multiple techniques
   */
  private estimateFontSize(imageData: ImageData, boundingHeight: number): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Find actual text height by detecting top and bottom boundaries
    let topBoundary = height;
    let bottomBoundary = 0;
    
    for (let y = 0; y < height; y++) {
      let hasText = false;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness < 200) { // Assuming dark text
          hasText = true;
          break;
        }
      }
      if (hasText) {
        topBoundary = Math.min(topBoundary, y);
        bottomBoundary = Math.max(bottomBoundary, y);
      }
    }
    
    const actualTextHeight = bottomBoundary - topBoundary;
    
    // Font size is typically 70-80% of text height
    return Math.max(8, Math.round(actualTextHeight * 0.75));
  }

  /**
   * Analyze font weight (bold detection)
   */
  private analyzeFontWeight(imageData: ImageData): 'normal' | 'bold' | 'light' {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let strokeWidth = 0;
    let measurements = 0;
    
    // Analyze horizontal strokes
    for (let y = Math.floor(height * 0.3); y < Math.floor(height * 0.7); y++) {
      let inStroke = false;
      let currentStrokeWidth = 0;
      
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (brightness < 128) { // Dark pixel (text)
          if (!inStroke) {
            inStroke = true;
            currentStrokeWidth = 1;
          } else {
            currentStrokeWidth++;
          }
        } else { // Light pixel (background)
          if (inStroke) {
            strokeWidth += currentStrokeWidth;
            measurements++;
            inStroke = false;
          }
        }
      }
    }
    
    const avgStrokeWidth = measurements > 0 ? strokeWidth / measurements : 1;
    
    if (avgStrokeWidth > 3) return 'bold';
    if (avgStrokeWidth < 1.5) return 'light';
    return 'normal';
  }

  /**
   * Detect italic text using slant analysis
   */
  private detectItalic(imageData: ImageData): 'normal' | 'italic' {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let totalSlant = 0;
    let measurements = 0;
    
    // Analyze vertical strokes for slant
    for (let x = Math.floor(width * 0.2); x < Math.floor(width * 0.8); x++) {
      const topPixel = this.findTopPixel(data, width, height, x);
      const bottomPixel = this.findBottomPixel(data, width, height, x);
      
      if (topPixel !== -1 && bottomPixel !== -1) {
        const slant = Math.abs(topPixel - bottomPixel) / height;
        totalSlant += slant;
        measurements++;
      }
    }
    
    const avgSlant = measurements > 0 ? totalSlant / measurements : 0;
    
    return avgSlant > 0.1 ? 'italic' : 'normal';
  }

  /**
   * Analyze layout characteristics
   */
  private analyzeLayout(textBlock: EnhancedTextBlock, originalImage: HTMLImageElement): LayoutAnalysis {
    const { bbox } = textBlock;
    const imageWidth = originalImage.width;
    const imageHeight = originalImage.height;
    
    // Calculate alignment
    const centerX = (bbox.x0 + bbox.x1) / 2;
    const alignment = this.determineAlignment(centerX, imageWidth);
    
    // Estimate rotation (simplified)
    const rotation = 0; // TODO: Implement rotation detection
    
    // Calculate margins
    const margins = {
      top: bbox.y0,
      right: imageWidth - bbox.x1,
      bottom: imageHeight - bbox.y1,
      left: bbox.x0
    };
    
    // Estimate baseline
    const baseline = bbox.y1 - (bbox.y1 - bbox.y0) * 0.2;
    
    return {
      alignment,
      rotation,
      skew: 0,
      perspective: 0,
      baseline,
      margins
    };
  }

  /**
   * Analyze text effects (shadows, outlines, etc.)
   */
  private analyzeTextEffects(imageData: ImageData): TextEffects {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Detect shadow by looking for blurred dark areas
    const hasShadow = this.detectShadow(data, width, height);
    
    // Detect outline by analyzing edge patterns
    const hasOutline = this.detectOutline(data, width, height);
    
    // Analyze opacity
    const opacity = this.calculateOpacity(data);
    
    return {
      hasShadow,
      shadowOffset: { x: 2, y: 2 }, // Default values
      shadowBlur: 4,
      shadowColor: '#000000',
      hasOutline,
      outlineWidth: 1,
      outlineColor: '#ffffff',
      hasGradient: false,
      gradientColors: [],
      opacity
    };
  }

  // Helper methods
  private brightnessToColor(brightness: number): string {
    const value = Math.round(brightness);
    return `rgb(${value}, ${value}, ${value})`;
  }

  private calculateContrast(color1: number, color2: number): number {
    const lighter = Math.max(color1, color2);
    const darker = Math.min(color1, color2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private countLines(text: string): number {
    return text.split('\n').length;
  }

  private estimateLetterSpacing(imageData: ImageData, charCount: number): number {
    if (charCount <= 1) return 0;
    const totalWidth = imageData.width;
    const avgCharWidth = totalWidth / charCount;
    return Math.max(0, avgCharWidth - 10); // Rough estimation
  }

  private detectTextDecoration(imageData: ImageData): 'none' | 'underline' | 'overline' | 'line-through' {
    // Simplified detection - look for horizontal lines
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Check bottom area for underline
    const bottomY = Math.floor(height * 0.9);
    let underlinePixels = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = (bottomY * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 128) underlinePixels++;
    }
    
    if (underlinePixels > width * 0.5) return 'underline';
    
    return 'none';
  }

  private estimateFontFamily(imageData: ImageData, fontSize: number): string {
    // Simplified font family detection based on character analysis
    const serifFonts = ['Times New Roman', 'Georgia', 'serif'];
    const sansSerifFonts = ['Arial', 'Helvetica', 'Verdana', 'sans-serif'];
    const monospaceFonts = ['Courier New', 'Monaco', 'monospace'];
    
    // TODO: Implement more sophisticated font detection
    // For now, return a common sans-serif font
    return 'Arial, sans-serif';
  }

  private determineAlignment(centerX: number, imageWidth: number): 'left' | 'center' | 'right' | 'justify' {
    const leftThird = imageWidth / 3;
    const rightThird = imageWidth * 2 / 3;
    
    if (centerX < leftThird) return 'left';
    if (centerX > rightThird) return 'right';
    return 'center';
  }

  private findTopPixel(data: Uint8ClampedArray, width: number, height: number, x: number): number {
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 128) return x;
    }
    return -1;
  }

  private findBottomPixel(data: Uint8ClampedArray, width: number, height: number, x: number): number {
    for (let y = height - 1; y >= 0; y--) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 128) return x;
    }
    return -1;
  }

  private detectShadow(data: Uint8ClampedArray, width: number, height: number): boolean {
    // Look for blurred dark areas that could be shadows
    let shadowPixels = 0;
    const totalPixels = width * height;
    
    for (let i = 0; i < totalPixels; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness > 50 && brightness < 150) {
        shadowPixels++;
      }
    }
    
    return shadowPixels > totalPixels * 0.1;
  }

  private detectOutline(data: Uint8ClampedArray, width: number, height: number): boolean {
    // Simplified outline detection
    const edges = this.detectEdges({ data, width, height } as ImageData);
    const strongEdges = edges.filter(e => e > 0.7).length;
    return strongEdges > (width * height * 0.05);
  }

  private calculateOpacity(data: Uint8ClampedArray): number {
    let totalAlpha = 0;
    const pixels = data.length / 4;
    
    for (let i = 0; i < pixels; i++) {
      totalAlpha += data[i * 4 + 3];
    }
    
    return (totalAlpha / pixels) / 255;
  }

  private calculateStyleConfidence(
    color: ColorAnalysis,
    typography: TypographyAnalysis,
    layout: LayoutAnalysis,
    effects: TextEffects
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on contrast
    if (color.contrast > 4.5) confidence += 0.2;
    if (color.contrast > 7) confidence += 0.1;
    
    // Boost confidence for clear typography
    if (typography.fontSize > 12) confidence += 0.1;
    if (typography.fontSize > 16) confidence += 0.1;
    
    // Reduce confidence for complex effects
    if (effects.hasShadow || effects.hasOutline) confidence -= 0.05;
    
    return Math.min(1, Math.max(0, confidence));
  }
}

export const visualStyleAnalyzer = new VisualStyleAnalyzer();
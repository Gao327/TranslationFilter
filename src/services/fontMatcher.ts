// Font classification and matching system

// Font categories
export type FontCategory = 
  | 'serif'
  | 'sans-serif'
  | 'monospace'
  | 'script'
  | 'display'
  | 'handwriting';

// Font characteristics
export interface FontCharacteristics {
  category: FontCategory;
  weight: 'thin' | 'light' | 'normal' | 'medium' | 'bold' | 'black';
  style: 'normal' | 'italic' | 'oblique';
  width: 'condensed' | 'normal' | 'expanded';
  xHeight: number; // Relative x-height
  ascenderHeight: number;
  descenderDepth: number;
  strokeContrast: number; // Difference between thick and thin strokes
  serifStyle?: 'old-style' | 'transitional' | 'modern' | 'slab';
  readabilityScore: number;
}

// Font database entry
export interface FontEntry {
  name: string;
  family: string;
  characteristics: FontCharacteristics;
  webSafe: boolean;
  googleFont: boolean;
  fallbacks: string[];
  languages: string[]; // Supported languages
  unicodeRanges: string[];
}

// Font matching result
export interface FontMatchResult {
  font: FontEntry;
  confidence: number;
  similarity: number;
  reasons: string[];
}

// Font analysis result
export interface FontAnalysisResult {
  detectedCharacteristics: FontCharacteristics;
  confidence: number;
  matches: FontMatchResult[];
  bestMatch: FontMatchResult;
}

export class FontMatcher {
  private fontDatabase: FontEntry[] = [];
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.initializeFontDatabase();
  }

  /**
   * Analyze font characteristics from image data
   */
  async analyzeFontFromImage(
    imageData: ImageData,
    sampleText: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): Promise<FontAnalysisResult> {
    // Extract font characteristics from the image
    const characteristics = this.extractFontCharacteristics(imageData, sampleText);
    
    // Find matching fonts
    const matches = this.findMatchingFonts(characteristics);
    
    // Calculate confidence based on image quality and text clarity
    const confidence = this.calculateAnalysisConfidence(imageData, characteristics);
    
    return {
      detectedCharacteristics: characteristics,
      confidence,
      matches,
      bestMatch: matches[0] || this.getDefaultMatch()
    };
  }

  /**
   * Find best matching font for given characteristics
   */
  findBestMatch(
    targetCharacteristics: Partial<FontCharacteristics>,
    language: string = 'en',
    webSafeOnly: boolean = false
  ): FontMatchResult {
    const matches = this.findMatchingFonts(targetCharacteristics, language, webSafeOnly);
    return matches[0] || this.getDefaultMatch();
  }

  /**
   * Get font suggestions for a specific use case
   */
  getSuggestions(
    category: FontCategory,
    language: string = 'en',
    readabilityPriority: boolean = true
  ): FontMatchResult[] {
    let candidates = this.fontDatabase.filter(font => 
      font.characteristics.category === category &&
      font.languages.includes(language)
    );
    
    if (readabilityPriority) {
      candidates = candidates.filter(font => 
        font.characteristics.readabilityScore > 0.7
      );
    }
    
    return candidates.map(font => ({
      font,
      confidence: font.characteristics.readabilityScore,
      similarity: 1.0,
      reasons: ['Category match', 'Language support']
    })).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract font characteristics from image data
   */
  private extractFontCharacteristics(
    imageData: ImageData,
    sampleText: string
  ): FontCharacteristics {
    const analysis = this.analyzeImageText(imageData);
    
    return {
      category: this.detectFontCategory(analysis),
      weight: this.detectFontWeight(analysis),
      style: this.detectFontStyle(analysis),
      width: this.detectFontWidth(analysis),
      xHeight: this.calculateXHeight(analysis),
      ascenderHeight: this.calculateAscenderHeight(analysis),
      descenderDepth: this.calculateDescenderDepth(analysis),
      strokeContrast: this.calculateStrokeContrast(analysis),
      serifStyle: this.detectSerifStyle(analysis),
      readabilityScore: this.calculateReadabilityScore(analysis)
    };
  }

  /**
   * Analyze text characteristics in image
   */
  private analyzeImageText(imageData: ImageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Extract text metrics
    const metrics = {
      strokeWidths: [] as number[],
      verticalStrokes: [] as number[],
      horizontalStrokes: [] as number[],
      curves: [] as number[],
      serifs: [] as number[],
      ascenders: [] as number[],
      descenders: [] as number[],
      xHeights: [] as number[],
      contrast: 0,
      density: 0
    };
    
    // Analyze stroke patterns
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (brightness < 128) { // Text pixel
          // Analyze local stroke characteristics
          const strokeInfo = this.analyzeLocalStroke(data, x, y, width, height);
          
          if (strokeInfo.isVertical) {
            metrics.verticalStrokes.push(strokeInfo.width);
          }
          if (strokeInfo.isHorizontal) {
            metrics.horizontalStrokes.push(strokeInfo.width);
          }
          if (strokeInfo.isCurve) {
            metrics.curves.push(strokeInfo.curvature);
          }
          if (strokeInfo.isSerif) {
            metrics.serifs.push(strokeInfo.serifSize);
          }
        }
      }
    }
    
    return metrics;
  }

  /**
   * Analyze local stroke characteristics
   */
  private analyzeLocalStroke(
    data: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const result = {
      width: 1,
      isVertical: false,
      isHorizontal: false,
      isCurve: false,
      isSerif: false,
      curvature: 0,
      serifSize: 0
    };
    
    // Analyze 3x3 neighborhood
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          neighbors.push(brightness < 128 ? 1 : 0);
        } else {
          neighbors.push(0);
        }
      }
    }
    
    // Detect stroke direction
    const verticalSum = neighbors[1] + neighbors[4] + neighbors[7];
    const horizontalSum = neighbors[3] + neighbors[4] + neighbors[5];
    
    result.isVertical = verticalSum >= 2;
    result.isHorizontal = horizontalSum >= 2;
    
    // Detect curves (simplified)
    const diagonalSum = neighbors[0] + neighbors[2] + neighbors[6] + neighbors[8];
    result.isCurve = diagonalSum >= 2;
    
    // Detect serifs (simplified)
    result.isSerif = neighbors.filter(n => n === 1).length >= 6;
    
    return result;
  }

  /**
   * Detect font category
   */
  private detectFontCategory(analysis: any): FontCategory {
    if (analysis.serifs.length > analysis.verticalStrokes.length * 0.1) {
      return 'serif';
    }
    
    if (analysis.curves.length > analysis.verticalStrokes.length * 0.3) {
      return 'script';
    }
    
    const avgVerticalWidth = analysis.verticalStrokes.reduce((a: number, b: number) => a + b, 0) / analysis.verticalStrokes.length || 1;
    const avgHorizontalWidth = analysis.horizontalStrokes.reduce((a: number, b: number) => a + b, 0) / analysis.horizontalStrokes.length || 1;
    
    if (Math.abs(avgVerticalWidth - avgHorizontalWidth) < 0.1) {
      return 'monospace';
    }
    
    return 'sans-serif';
  }

  /**
   * Detect font weight
   */
  private detectFontWeight(analysis: any): FontCharacteristics['weight'] {
    const avgStrokeWidth = [
      ...analysis.verticalStrokes,
      ...analysis.horizontalStrokes
    ].reduce((a, b) => a + b, 0) / (analysis.verticalStrokes.length + analysis.horizontalStrokes.length) || 1;
    
    if (avgStrokeWidth < 1.5) return 'light';
    if (avgStrokeWidth < 2.5) return 'normal';
    if (avgStrokeWidth < 3.5) return 'medium';
    return 'bold';
  }

  /**
   * Detect font style
   */
  private detectFontStyle(analysis: any): FontCharacteristics['style'] {
    // Simplified italic detection based on curve analysis
    const curveRatio = analysis.curves.length / (analysis.verticalStrokes.length || 1);
    return curveRatio > 0.3 ? 'italic' : 'normal';
  }

  /**
   * Detect font width
   */
  private detectFontWidth(analysis: any): FontCharacteristics['width'] {
    // Simplified width detection
    return 'normal';
  }

  /**
   * Calculate relative measurements
   */
  private calculateXHeight(analysis: any): number {
    return 0.5; // Simplified
  }

  private calculateAscenderHeight(analysis: any): number {
    return 0.75; // Simplified
  }

  private calculateDescenderDepth(analysis: any): number {
    return 0.25; // Simplified
  }

  private calculateStrokeContrast(analysis: any): number {
    if (analysis.verticalStrokes.length === 0 || analysis.horizontalStrokes.length === 0) {
      return 0;
    }
    
    const avgVertical = analysis.verticalStrokes.reduce((a: number, b: number) => a + b, 0) / analysis.verticalStrokes.length;
    const avgHorizontal = analysis.horizontalStrokes.reduce((a: number, b: number) => a + b, 0) / analysis.horizontalStrokes.length;
    
    return Math.abs(avgVertical - avgHorizontal) / Math.max(avgVertical, avgHorizontal);
  }

  /**
   * Detect serif style
   */
  private detectSerifStyle(analysis: any): FontCharacteristics['serifStyle'] | undefined {
    if (analysis.serifs.length === 0) return undefined;
    
    // Simplified serif classification
    const avgSerifSize = analysis.serifs.reduce((a: number, b: number) => a + b, 0) / analysis.serifs.length;
    
    if (avgSerifSize < 0.1) return 'modern';
    if (avgSerifSize < 0.2) return 'transitional';
    if (avgSerifSize < 0.3) return 'old-style';
    return 'slab';
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(analysis: any): number {
    let score = 0.5;
    
    // Boost score for consistent stroke widths
    const strokeConsistency = this.calculateStrokeConsistency(analysis);
    score += strokeConsistency * 0.3;
    
    // Boost score for good contrast
    if (analysis.contrast > 0.7) score += 0.2;
    
    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate stroke consistency
   */
  private calculateStrokeConsistency(analysis: any): number {
    if (analysis.verticalStrokes.length === 0) return 0;
    
    const mean = analysis.verticalStrokes.reduce((a: number, b: number) => a + b, 0) / analysis.verticalStrokes.length;
    const variance = analysis.verticalStrokes.reduce((a: number, b: number) => a + Math.pow(b - mean, 2), 0) / analysis.verticalStrokes.length;
    
    return Math.max(0, 1 - variance / mean);
  }

  /**
   * Find matching fonts based on characteristics
   */
  private findMatchingFonts(
    targetCharacteristics: Partial<FontCharacteristics>,
    language: string = 'en',
    webSafeOnly: boolean = false
  ): FontMatchResult[] {
    let candidates = this.fontDatabase;
    
    if (webSafeOnly) {
      candidates = candidates.filter(font => font.webSafe);
    }
    
    candidates = candidates.filter(font => 
      font.languages.includes(language) || font.languages.includes('*')
    );
    
    const matches = candidates.map(font => {
      const similarity = this.calculateSimilarity(targetCharacteristics, font.characteristics);
      const confidence = this.calculateMatchConfidence(font, targetCharacteristics);
      const reasons = this.getMatchReasons(targetCharacteristics, font.characteristics);
      
      return {
        font,
        confidence,
        similarity,
        reasons
      };
    });
    
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  /**
   * Calculate similarity between font characteristics
   */
  private calculateSimilarity(
    target: Partial<FontCharacteristics>,
    candidate: FontCharacteristics
  ): number {
    let score = 0;
    let factors = 0;
    
    // Category match (high weight)
    if (target.category && target.category === candidate.category) {
      score += 0.4;
    }
    factors += 0.4;
    
    // Weight match
    if (target.weight && target.weight === candidate.weight) {
      score += 0.2;
    }
    factors += 0.2;
    
    // Style match
    if (target.style && target.style === candidate.style) {
      score += 0.15;
    }
    factors += 0.15;
    
    // Numeric characteristics
    if (target.xHeight !== undefined) {
      score += (1 - Math.abs(target.xHeight - candidate.xHeight)) * 0.1;
    }
    factors += 0.1;
    
    if (target.strokeContrast !== undefined) {
      score += (1 - Math.abs(target.strokeContrast - candidate.strokeContrast)) * 0.15;
    }
    factors += 0.15;
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calculate match confidence
   */
  private calculateMatchConfidence(
    font: FontEntry,
    target: Partial<FontCharacteristics>
  ): number {
    const similarity = this.calculateSimilarity(target, font.characteristics);
    const readabilityBonus = font.characteristics.readabilityScore * 0.2;
    const webSafeBonus = font.webSafe ? 0.1 : 0;
    
    return Math.min(1, similarity + readabilityBonus + webSafeBonus);
  }

  /**
   * Get reasons for font match
   */
  private getMatchReasons(
    target: Partial<FontCharacteristics>,
    candidate: FontCharacteristics
  ): string[] {
    const reasons: string[] = [];
    
    if (target.category === candidate.category) {
      reasons.push(`Same category (${candidate.category})`);
    }
    
    if (target.weight === candidate.weight) {
      reasons.push(`Same weight (${candidate.weight})`);
    }
    
    if (target.style === candidate.style) {
      reasons.push(`Same style (${candidate.style})`);
    }
    
    if (candidate.readabilityScore > 0.8) {
      reasons.push('High readability');
    }
    
    return reasons;
  }

  /**
   * Calculate analysis confidence
   */
  private calculateAnalysisConfidence(
    imageData: ImageData,
    characteristics: FontCharacteristics
  ): number {
    // Base confidence on image quality and text clarity
    let confidence = 0.5;
    
    // Boost confidence for clear characteristics
    if (characteristics.readabilityScore > 0.7) confidence += 0.2;
    if (characteristics.strokeContrast > 0.3) confidence += 0.1;
    
    // Consider image resolution
    const pixelCount = imageData.width * imageData.height;
    if (pixelCount > 10000) confidence += 0.1;
    if (pixelCount > 50000) confidence += 0.1;
    
    return Math.min(1, confidence);
  }

  /**
   * Get default match
   */
  private getDefaultMatch(): FontMatchResult {
    const defaultFont = this.fontDatabase.find(f => f.name === 'Arial') || this.fontDatabase[0];
    
    return {
      font: defaultFont,
      confidence: 0.5,
      similarity: 0.5,
      reasons: ['Default fallback']
    };
  }

  /**
   * Initialize font database with common fonts
   */
  private initializeFontDatabase(): void {
    this.fontDatabase = [
      // Sans-serif fonts
      {
        name: 'Arial',
        family: 'Arial, sans-serif',
        characteristics: {
          category: 'sans-serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.52,
          ascenderHeight: 0.74,
          descenderDepth: 0.26,
          strokeContrast: 0.1,
          readabilityScore: 0.9
        },
        webSafe: true,
        googleFont: false,
        fallbacks: ['Helvetica', 'sans-serif'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF', 'U+0131', 'U+0152-0153']
      },
      {
        name: 'Helvetica',
        family: 'Helvetica, Arial, sans-serif',
        characteristics: {
          category: 'sans-serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.53,
          ascenderHeight: 0.75,
          descenderDepth: 0.25,
          strokeContrast: 0.08,
          readabilityScore: 0.95
        },
        webSafe: true,
        googleFont: false,
        fallbacks: ['Arial', 'sans-serif'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF']
      },
      {
        name: 'Roboto',
        family: 'Roboto, sans-serif',
        characteristics: {
          category: 'sans-serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.54,
          ascenderHeight: 0.73,
          descenderDepth: 0.27,
          strokeContrast: 0.12,
          readabilityScore: 0.92
        },
        webSafe: false,
        googleFont: true,
        fallbacks: ['Arial', 'sans-serif'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF', 'U+0131', 'U+0152-0153']
      },
      // Serif fonts
      {
        name: 'Times New Roman',
        family: 'Times New Roman, Times, serif',
        characteristics: {
          category: 'serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.45,
          ascenderHeight: 0.72,
          descenderDepth: 0.28,
          strokeContrast: 0.35,
          serifStyle: 'transitional',
          readabilityScore: 0.88
        },
        webSafe: true,
        googleFont: false,
        fallbacks: ['Times', 'serif'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF']
      },
      {
        name: 'Georgia',
        family: 'Georgia, serif',
        characteristics: {
          category: 'serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.48,
          ascenderHeight: 0.74,
          descenderDepth: 0.26,
          strokeContrast: 0.28,
          serifStyle: 'transitional',
          readabilityScore: 0.91
        },
        webSafe: true,
        googleFont: false,
        fallbacks: ['Times New Roman', 'serif'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF']
      },
      // Monospace fonts
      {
        name: 'Courier New',
        family: 'Courier New, Courier, monospace',
        characteristics: {
          category: 'monospace',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.42,
          ascenderHeight: 0.70,
          descenderDepth: 0.30,
          strokeContrast: 0.15,
          readabilityScore: 0.75
        },
        webSafe: true,
        googleFont: false,
        fallbacks: ['Courier', 'monospace'],
        languages: ['*'],
        unicodeRanges: ['U+0000-00FF']
      },
      // Chinese fonts
      {
        name: 'SimSun',
        family: 'SimSun, serif',
        characteristics: {
          category: 'serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.50,
          ascenderHeight: 0.75,
          descenderDepth: 0.25,
          strokeContrast: 0.20,
          readabilityScore: 0.85
        },
        webSafe: false,
        googleFont: false,
        fallbacks: ['serif'],
        languages: ['zh', 'zh-CN', 'zh-TW'],
        unicodeRanges: ['U+4E00-9FFF', 'U+3400-4DBF']
      },
      {
        name: 'Microsoft YaHei',
        family: 'Microsoft YaHei, sans-serif',
        characteristics: {
          category: 'sans-serif',
          weight: 'normal',
          style: 'normal',
          width: 'normal',
          xHeight: 0.52,
          ascenderHeight: 0.74,
          descenderDepth: 0.26,
          strokeContrast: 0.15,
          readabilityScore: 0.90
        },
        webSafe: false,
        googleFont: false,
        fallbacks: ['sans-serif'],
        languages: ['zh', 'zh-CN'],
        unicodeRanges: ['U+4E00-9FFF']
      }
    ];
  }
}

// Export singleton instance
export const fontMatcher = new FontMatcher();
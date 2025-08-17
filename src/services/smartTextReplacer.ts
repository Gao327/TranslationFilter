import { EnhancedTextBlock } from './enhancedOcrService';
import { StyleAnalysis } from './visualStyleAnalyzer';
import { textRenderingEngine, RenderingOptions, TextLayout } from './textRenderingEngine';
import { backgroundReconstructor, ReconstructionOptions } from './backgroundReconstructor';

// Text replacement strategies
export type ReplacementStrategy = 
  | 'preserve_bounds' 
  | 'adaptive_scaling'
  | 'multi_line_wrap'
  | 'overflow_expand'
  | 'abbreviation';

// Overflow handling options
export interface OverflowHandling {
  strategy: ReplacementStrategy;
  maxScaleDown: number; // Maximum scale reduction (0.5 = 50% of original)
  maxScaleUp: number; // Maximum scale increase
  allowLineBreaking: boolean;
  allowAbbreviation: boolean;
  prioritizeReadability: boolean;
  expandBounds: boolean;
  maxExpansion: number; // Maximum boundary expansion in pixels
}

// Text fitting result
export interface TextFittingResult {
  success: boolean;
  finalText: string;
  scaleFactor: number;
  strategy: ReplacementStrategy;
  layout: TextLayout;
  bounds: { x: number; y: number; width: number; height: number };
  confidence: number;
}

// Replacement result
export interface ReplacementResult {
  canvas: HTMLCanvasElement;
  success: boolean;
  textBlocks: Array<{
    original: EnhancedTextBlock;
    replacement: TextFittingResult;
  }>;
  processingTime: number;
  overallConfidence: number;
}

export class SmartTextReplacer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private workCanvas: HTMLCanvasElement;
  private workCtx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.workCanvas = document.createElement('canvas');
    this.workCtx = this.workCanvas.getContext('2d')!;
  }

  /**
   * Replace text in image with translated text
   */
  async replaceTextInImage(
    originalImage: HTMLImageElement,
    textBlocks: EnhancedTextBlock[],
    styleAnalyses: StyleAnalysis[],
    overflowOptions: OverflowHandling = this.getDefaultOverflowOptions(),
    renderingOptions: RenderingOptions = this.getDefaultRenderingOptions()
  ): Promise<ReplacementResult> {
    const startTime = performance.now();
    
    // Setup canvas
    this.canvas.width = originalImage.width;
    this.canvas.height = originalImage.height;
    this.ctx.drawImage(originalImage, 0, 0);
    
    const replacements: Array<{
      original: EnhancedTextBlock;
      replacement: TextFittingResult;
    }> = [];
    
    try {
      // First pass: Remove original text using background reconstruction
      const reconstructionResult = await backgroundReconstructor.reconstructBackground(
        originalImage,
        textBlocks,
        this.getReconstructionOptions()
      );
      
      if (reconstructionResult.success) {
        this.ctx.drawImage(reconstructionResult.reconstructedCanvas, 0, 0);
      }
      
      // Second pass: Fit and render translated text
      for (let i = 0; i < textBlocks.length; i++) {
        const block = textBlocks[i];
        const styleAnalysis = styleAnalyses[i];
        
        if (!block.translatedText) continue;
        
        const fittingResult = await this.fitTextToBounds(
          block,
          styleAnalysis,
          overflowOptions
        );
        
        if (fittingResult.success) {
          await this.renderFittedText(
            fittingResult,
            block,
            styleAnalysis,
            renderingOptions
          );
        }
        
        replacements.push({
          original: block,
          replacement: fittingResult
        });
      }
      
      const processingTime = performance.now() - startTime;
      const overallConfidence = this.calculateOverallConfidence(replacements);
      
      return {
        canvas: this.canvas,
        success: true,
        textBlocks: replacements,
        processingTime,
        overallConfidence
      };
      
    } catch (error) {
      console.error('Text replacement failed:', error);
      
      return {
        canvas: this.canvas,
        success: false,
        textBlocks: [],
        processingTime: performance.now() - startTime,
        overallConfidence: 0
      };
    }
  }

  /**
   * Fit translated text to original text bounds
   */
  private async fitTextToBounds(
    textBlock: EnhancedTextBlock,
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    const { bbox, translatedText } = textBlock;
    const originalBounds = {
      x: bbox.x0,
      y: bbox.y0,
      width: bbox.x1 - bbox.x0,
      height: bbox.y1 - bbox.y0
    };
    
    if (!translatedText) {
      return this.createFailedFittingResult(originalBounds);
    }
    
    // Try different strategies in order of preference
    const strategies: ReplacementStrategy[] = [
      'preserve_bounds',
      'adaptive_scaling',
      'multi_line_wrap',
      'overflow_expand',
      'abbreviation'
    ];
    
    for (const strategy of strategies) {
      if (!this.isStrategyAllowed(strategy, options)) continue;
      
      const result = await this.tryFittingStrategy(
        translatedText,
        originalBounds,
        styleAnalysis,
        strategy,
        options
      );
      
      if (result.success) {
        return result;
      }
    }
    
    // If all strategies fail, return the best attempt
    return await this.tryFittingStrategy(
      translatedText,
      originalBounds,
      styleAnalysis,
      'adaptive_scaling',
      options
    );
  }

  /**
   * Try a specific fitting strategy
   */
  private async tryFittingStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    strategy: ReplacementStrategy,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    switch (strategy) {
      case 'preserve_bounds':
        return this.preserveBoundsStrategy(text, bounds, styleAnalysis, options);
      case 'adaptive_scaling':
        return this.adaptiveScalingStrategy(text, bounds, styleAnalysis, options);
      case 'multi_line_wrap':
        return this.multiLineWrapStrategy(text, bounds, styleAnalysis, options);
      case 'overflow_expand':
        return this.overflowExpandStrategy(text, bounds, styleAnalysis, options);
      case 'abbreviation':
        return this.abbreviationStrategy(text, bounds, styleAnalysis, options);
      default:
        return this.createFailedFittingResult(bounds);
    }
  }

  /**
   * Preserve bounds strategy - keep original size, scale font if needed
   */
  private async preserveBoundsStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    const originalFontSize = styleAnalysis.typography.fontSize;
    let currentFontSize = originalFontSize;
    let scaleFactor = 1;
    
    // Create a test canvas for measurements
    this.workCanvas.width = bounds.width;
    this.workCanvas.height = bounds.height;
    
    // Binary search for optimal font size
    let minSize = originalFontSize * options.maxScaleDown;
    let maxSize = originalFontSize * options.maxScaleUp;
    let bestSize = originalFontSize;
    let bestLayout: TextLayout | null = null;
    
    for (let iteration = 0; iteration < 10; iteration++) {
      currentFontSize = (minSize + maxSize) / 2;
      scaleFactor = currentFontSize / originalFontSize;
      
      // Test if text fits at this size
      const testStyle = {
        ...styleAnalysis,
        typography: {
          ...styleAnalysis.typography,
          fontSize: currentFontSize
        }
      };
      
      const layout = this.calculateTextLayout(text, testStyle, bounds);
      
      if (this.doesTextFit(layout, bounds)) {
        bestSize = currentFontSize;
        bestLayout = layout;
        minSize = currentFontSize; // Try larger
      } else {
        maxSize = currentFontSize; // Try smaller
      }
    }
    
    if (bestLayout) {
      return {
        success: true,
        finalText: text,
        scaleFactor: bestSize / originalFontSize,
        strategy: 'preserve_bounds',
        layout: bestLayout,
        bounds,
        confidence: this.calculateFittingConfidence(bestLayout, bounds, scaleFactor)
      };
    }
    
    return this.createFailedFittingResult(bounds);
  }

  /**
   * Adaptive scaling strategy - allow moderate bound expansion
   */
  private async adaptiveScalingStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    const originalFontSize = styleAnalysis.typography.fontSize;
    
    // Try with slight bound expansion
    const expandedBounds = {
      x: bounds.x - options.maxExpansion / 4,
      y: bounds.y - options.maxExpansion / 4,
      width: bounds.width + options.maxExpansion / 2,
      height: bounds.height + options.maxExpansion / 2
    };
    
    // Ensure bounds don't go outside canvas
    expandedBounds.x = Math.max(0, expandedBounds.x);
    expandedBounds.y = Math.max(0, expandedBounds.y);
    expandedBounds.width = Math.min(this.canvas.width - expandedBounds.x, expandedBounds.width);
    expandedBounds.height = Math.min(this.canvas.height - expandedBounds.y, expandedBounds.height);
    
    return this.preserveBoundsStrategy(text, expandedBounds, styleAnalysis, options);
  }

  /**
   * Multi-line wrap strategy - break text into multiple lines
   */
  private async multiLineWrapStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    if (!options.allowLineBreaking) {
      return this.createFailedFittingResult(bounds);
    }
    
    // Try to wrap text intelligently
    const wrappedText = this.wrapTextIntelligently(text, bounds.width, styleAnalysis);
    
    return this.preserveBoundsStrategy(wrappedText, bounds, styleAnalysis, options);
  }

  /**
   * Overflow expand strategy - expand bounds significantly
   */
  private async overflowExpandStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    if (!options.expandBounds) {
      return this.createFailedFittingResult(bounds);
    }
    
    const expandedBounds = {
      x: Math.max(0, bounds.x - options.maxExpansion),
      y: Math.max(0, bounds.y - options.maxExpansion),
      width: Math.min(this.canvas.width, bounds.width + 2 * options.maxExpansion),
      height: Math.min(this.canvas.height, bounds.height + 2 * options.maxExpansion)
    };
    
    return this.preserveBoundsStrategy(text, expandedBounds, styleAnalysis, options);
  }

  /**
   * Abbreviation strategy - shorten text if allowed
   */
  private async abbreviationStrategy(
    text: string,
    bounds: { x: number; y: number; width: number; height: number },
    styleAnalysis: StyleAnalysis,
    options: OverflowHandling
  ): Promise<TextFittingResult> {
    if (!options.allowAbbreviation) {
      return this.createFailedFittingResult(bounds);
    }
    
    // Try progressively shorter versions
    const abbreviations = this.generateAbbreviations(text);
    
    for (const abbrev of abbreviations) {
      const result = await this.preserveBoundsStrategy(abbrev, bounds, styleAnalysis, options);
      if (result.success) {
        return {
          ...result,
          finalText: abbrev,
          strategy: 'abbreviation',
          confidence: result.confidence * 0.8 // Lower confidence for abbreviations
        };
      }
    }
    
    return this.createFailedFittingResult(bounds);
  }

  /**
   * Calculate text layout for given parameters
   */
  private calculateTextLayout(
    text: string,
    styleAnalysis: StyleAnalysis,
    bounds: { width: number; height: number }
  ): TextLayout {
    // Setup font for measurement
    const fontString = this.buildFontString(styleAnalysis.typography);
    this.workCtx.font = fontString;
    
    // Simple layout calculation
    const lines = text.split('\n');
    const lineHeight = styleAnalysis.typography.fontSize * 1.2;
    
    const layout: TextLayout = {
      lines: [],
      totalWidth: 0,
      totalHeight: lines.length * lineHeight,
      baseline: styleAnalysis.layout.baseline
    };
    
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const lineWidth = this.workCtx.measureText(lineText).width;
      
      layout.lines.push({
        text: lineText,
        width: lineWidth,
        height: lineHeight,
        x: 0,
        y: (i + 1) * lineHeight,
        words: [] // Simplified
      });
      
      layout.totalWidth = Math.max(layout.totalWidth, lineWidth);
    }
    
    return layout;
  }

  /**
   * Check if text layout fits within bounds
   */
  private doesTextFit(
    layout: TextLayout,
    bounds: { width: number; height: number }
  ): boolean {
    return layout.totalWidth <= bounds.width && layout.totalHeight <= bounds.height;
  }

  /**
   * Wrap text intelligently
   */
  private wrapTextIntelligently(
    text: string,
    maxWidth: number,
    styleAnalysis: StyleAnalysis
  ): string {
    const fontString = this.buildFontString(styleAnalysis.typography);
    this.workCtx.font = fontString;
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.workCtx.measureText(testLine).width;
      
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
    
    return lines.join('\n');
  }

  /**
   * Generate text abbreviations
   */
  private generateAbbreviations(text: string): string[] {
    const abbreviations: string[] = [];
    
    // Remove articles and prepositions
    const words = text.split(' ');
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filteredWords = words.filter(word => 
      !stopWords.includes(word.toLowerCase()) || words.length <= 3
    );
    
    if (filteredWords.length < words.length) {
      abbreviations.push(filteredWords.join(' '));
    }
    
    // Truncate progressively
    const maxLength = Math.max(10, text.length * 0.7);
    for (let len = maxLength; len >= 10; len -= 5) {
      if (text.length > len) {
        abbreviations.push(text.substring(0, len) + '...');
      }
    }
    
    return abbreviations;
  }

  /**
   * Render fitted text to canvas
   */
  private async renderFittedText(
    fittingResult: TextFittingResult,
    originalBlock: EnhancedTextBlock,
    styleAnalysis: StyleAnalysis,
    renderingOptions: RenderingOptions
  ): Promise<void> {
    // Adjust style for scaling
    const adjustedStyle = {
      ...styleAnalysis,
      typography: {
        ...styleAnalysis.typography,
        fontSize: styleAnalysis.typography.fontSize * fittingResult.scaleFactor
      }
    };
    
    // Render using text rendering engine
    const renderResult = await textRenderingEngine.renderTranslatedText(
      { 
        ...originalBlock,
        bbox: {
          x0: fittingResult.bounds.x,
          y0: fittingResult.bounds.y,
          x1: fittingResult.bounds.x + fittingResult.bounds.width,
          y1: fittingResult.bounds.y + fittingResult.bounds.height
        }
      },
      fittingResult.finalText,
      adjustedStyle,
      { width: fittingResult.bounds.width, height: fittingResult.bounds.height },
      renderingOptions
    );
    
    if (renderResult.success) {
      // Composite rendered text onto main canvas
      this.ctx.drawImage(
        renderResult.canvas,
        fittingResult.bounds.x,
        fittingResult.bounds.y
      );
    }
  }

  /**
   * Calculate fitting confidence
   */
  private calculateFittingConfidence(
    layout: TextLayout,
    bounds: { width: number; height: number },
    scaleFactor: number
  ): number {
    let confidence = 0.8; // Base confidence
    
    // Penalize scaling
    const scaleDeviation = Math.abs(1 - scaleFactor);
    confidence -= scaleDeviation * 0.3;
    
    // Reward good fit
    const widthUtilization = layout.totalWidth / bounds.width;
    const heightUtilization = layout.totalHeight / bounds.height;
    
    if (widthUtilization > 0.7 && widthUtilization < 0.95) confidence += 0.1;
    if (heightUtilization > 0.7 && heightUtilization < 0.95) confidence += 0.1;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    replacements: Array<{ original: EnhancedTextBlock; replacement: TextFittingResult }>
  ): number {
    if (replacements.length === 0) return 0;
    
    const totalConfidence = replacements.reduce((sum, r) => sum + r.replacement.confidence, 0);
    return totalConfidence / replacements.length;
  }

  /**
   * Check if strategy is allowed
   */
  private isStrategyAllowed(strategy: ReplacementStrategy, options: OverflowHandling): boolean {
    switch (strategy) {
      case 'multi_line_wrap':
        return options.allowLineBreaking;
      case 'overflow_expand':
        return options.expandBounds;
      case 'abbreviation':
        return options.allowAbbreviation;
      default:
        return true;
    }
  }

  /**
   * Create failed fitting result
   */
  private createFailedFittingResult(
    bounds: { x: number; y: number; width: number; height: number }
  ): TextFittingResult {
    return {
      success: false,
      finalText: '',
      scaleFactor: 1,
      strategy: 'preserve_bounds',
      layout: { lines: [], totalWidth: 0, totalHeight: 0, baseline: 0 },
      bounds,
      confidence: 0
    };
  }

  /**
   * Build CSS font string
   */
  private buildFontString(typography: StyleAnalysis['typography']): string {
    const style = typography.fontStyle !== 'normal' ? typography.fontStyle : '';
    const weight = typography.fontWeight !== 'normal' ? typography.fontWeight : '';
    
    return `${style} ${weight} ${typography.fontSize}px ${typography.fontFamily}`.trim();
  }

  /**
   * Get default overflow options
   */
  private getDefaultOverflowOptions(): OverflowHandling {
    return {
      strategy: 'adaptive_scaling',
      maxScaleDown: 0.6,
      maxScaleUp: 1.2,
      allowLineBreaking: true,
      allowAbbreviation: false,
      prioritizeReadability: true,
      expandBounds: true,
      maxExpansion: 20
    };
  }

  /**
   * Get default rendering options
   */
  private getDefaultRenderingOptions(): RenderingOptions {
    return {
      preserveOriginalStyle: true,
      adaptiveScaling: true,
      qualityLevel: 'high',
      antialiasing: true,
      subpixelRendering: true
    };
  }

  /**
   * Get reconstruction options
   */
  private getReconstructionOptions(): ReconstructionOptions {
    return {
      method: 'content_aware_fill',
      quality: 'balanced',
      preserveEdges: true,
      blendingRadius: 3,
      iterations: 3,
      textureAnalysis: true
    };
  }
}

export const smartTextReplacer = new SmartTextReplacer();
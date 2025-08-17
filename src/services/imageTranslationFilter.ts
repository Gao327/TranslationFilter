import { enhancedOcrService, EnhancedTextBlock, ImageAnalysisResult } from './enhancedOcrService';
import { visualStyleAnalyzer, StyleAnalysis } from './visualStyleAnalyzer';
import { smartTextReplacer, OverflowHandling, ReplacementResult } from './smartTextReplacer';
import { textRenderingEngine, RenderingOptions } from './textRenderingEngine';
import { baiduTranslationService } from './baiduTranslationService';

// Filter processing options
export interface FilterOptions {
  sourceLang: string;
  targetLang: string;
  preserveStyle: boolean;
  qualityLevel: 'fast' | 'balanced' | 'high_quality' | 'ultra';
  overflowHandling: OverflowHandling;
  renderingOptions: RenderingOptions;
  enablePreview: boolean;
  progressCallback?: (progress: number, stage: string) => void;
}

// Processing stages
export type ProcessingStage = 
  | 'loading'
  | 'ocr_analysis'
  | 'style_analysis'
  | 'translation'
  | 'background_reconstruction'
  | 'text_rendering'
  | 'finalization'
  | 'complete';

// Filter result
export interface FilterResult {
  success: boolean;
  originalCanvas: HTMLCanvasElement;
  translatedCanvas: HTMLCanvasElement;
  previewCanvas?: HTMLCanvasElement;
  textBlocks: EnhancedTextBlock[];
  styleAnalyses: StyleAnalysis[];
  replacementResult: ReplacementResult;
  processingTime: number;
  confidence: number;
  stages: ProcessingStageResult[];
}

// Stage result
export interface ProcessingStageResult {
  stage: ProcessingStage;
  success: boolean;
  duration: number;
  confidence: number;
  details?: any;
}

// Preview comparison
export interface PreviewComparison {
  beforeCanvas: HTMLCanvasElement;
  afterCanvas: HTMLCanvasElement;
  sideBySideCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  differenceCanvas: HTMLCanvasElement;
}

export class ImageTranslationFilter {
  private processingStages: ProcessingStageResult[] = [];
  private currentStage: ProcessingStage = 'loading';
  private progressCallback?: (progress: number, stage: string) => void;

  /**
   * Apply translation filter to image
   */
  async applyFilter(
    imageUrl: string,
    options: FilterOptions
  ): Promise<FilterResult> {
    const startTime = performance.now();
    this.processingStages = [];
    this.progressCallback = options.progressCallback;
    
    try {
      // Stage 1: Load and analyze image
      const imageAnalysis = await this.executeStage('loading', async () => {
        this.updateProgress(5, 'Loading image...');
        const img = await this.loadImage(imageUrl);
        
        this.updateProgress(15, 'Analyzing image structure...');
        return await enhancedOcrService.analyzeImage(imageUrl, options.sourceLang);
      });
      
      if (!imageAnalysis.textBlocks.length) {
        return this.createEmptyResult(imageUrl, 'No text detected in image');
      }
      
      // Stage 2: OCR and text detection
      const enhancedBlocks = await this.executeStage('ocr_analysis', async () => {
        this.updateProgress(25, 'Detecting text regions...');
        return imageAnalysis.textBlocks;
      });
      
      // Stage 3: Style analysis
      const styleAnalyses = await this.executeStage('style_analysis', async () => {
        this.updateProgress(35, 'Analyzing text styles...');
        const analyses: StyleAnalysis[] = [];
        
        for (let i = 0; i < enhancedBlocks.length; i++) {
          const block = enhancedBlocks[i];
          const analysis = await visualStyleAnalyzer.analyzeTextBlockStyle(
            block,
            imageAnalysis.imageData.context.getImageData(
              0, 0, 
              imageAnalysis.imageData.width, 
              imageAnalysis.imageData.height
            ),
            await this.loadImage(imageUrl)
          );
          analyses.push(analysis);
          
          this.updateProgress(
            35 + (i / enhancedBlocks.length) * 10,
            `Analyzing style ${i + 1}/${enhancedBlocks.length}...`
          );
        }
        
        return analyses;
      });
      
      // Stage 4: Translation
      const translatedBlocks = await this.executeStage('translation', async () => {
        this.updateProgress(50, 'Translating text...');
        return await enhancedOcrService.translateTextBlocks(
          enhancedBlocks,
          options.sourceLang,
          options.targetLang
        );
      });
      
      // Stage 5: Text replacement and rendering
      const replacementResult = await this.executeStage('text_rendering', async () => {
        this.updateProgress(70, 'Rendering translated text...');
        const originalImage = await this.loadImage(imageUrl);
        
        return await smartTextReplacer.replaceTextInImage(
          originalImage,
          translatedBlocks,
          styleAnalyses,
          options.overflowHandling,
          options.renderingOptions
        );
      });
      
      // Stage 6: Finalization
      const finalResult = await this.executeStage('finalization', async () => {
        this.updateProgress(90, 'Finalizing result...');
        
        const originalImage = await this.loadImage(imageUrl);
        const originalCanvas = this.createCanvasFromImage(originalImage);
        
        // Create preview if enabled
        let previewCanvas: HTMLCanvasElement | undefined;
        if (options.enablePreview) {
          previewCanvas = this.createPreviewComparison(
            originalCanvas,
            replacementResult.canvas
          ).sideBySideCanvas;
        }
        
        this.updateProgress(100, 'Complete!');
        
        return {
          originalCanvas,
          translatedCanvas: replacementResult.canvas,
          previewCanvas
        };
      });
      
      const processingTime = performance.now() - startTime;
      const confidence = this.calculateOverallConfidence();
      
      return {
        success: true,
        originalCanvas: finalResult.originalCanvas,
        translatedCanvas: finalResult.translatedCanvas,
        previewCanvas: finalResult.previewCanvas,
        textBlocks: translatedBlocks,
        styleAnalyses,
        replacementResult,
        processingTime,
        confidence,
        stages: this.processingStages
      };
      
    } catch (error) {
      console.error('Filter processing failed:', error);
      
      return {
        success: false,
        originalCanvas: document.createElement('canvas'),
        translatedCanvas: document.createElement('canvas'),
        textBlocks: [],
        styleAnalyses: [],
        replacementResult: {
          canvas: document.createElement('canvas'),
          success: false,
          textBlocks: [],
          processingTime: 0,
          overallConfidence: 0
        },
        processingTime: performance.now() - startTime,
        confidence: 0,
        stages: this.processingStages
      };
    }
  }

  /**
   * Create preview comparison between original and translated images
   */
  createPreviewComparison(
    originalCanvas: HTMLCanvasElement,
    translatedCanvas: HTMLCanvasElement
  ): PreviewComparison {
    const width = originalCanvas.width;
    const height = originalCanvas.height;
    
    // Side-by-side comparison
    const sideBySideCanvas = document.createElement('canvas');
    sideBySideCanvas.width = width * 2 + 20; // 20px gap
    sideBySideCanvas.height = height + 60; // 60px for labels
    const sideBySideCtx = sideBySideCanvas.getContext('2d')!;
    
    // Background
    sideBySideCtx.fillStyle = '#f0f0f0';
    sideBySideCtx.fillRect(0, 0, sideBySideCanvas.width, sideBySideCanvas.height);
    
    // Labels
    sideBySideCtx.fillStyle = '#333';
    sideBySideCtx.font = '16px Arial';
    sideBySideCtx.textAlign = 'center';
    sideBySideCtx.fillText('Original', width / 2, 25);
    sideBySideCtx.fillText('Translated', width + 10 + width / 2, 25);
    
    // Images
    sideBySideCtx.drawImage(originalCanvas, 0, 40);
    sideBySideCtx.drawImage(translatedCanvas, width + 20, 40);
    
    // Overlay comparison
    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = width;
    overlayCanvas.height = height;
    const overlayCtx = overlayCanvas.getContext('2d')!;
    
    overlayCtx.drawImage(originalCanvas, 0, 0);
    overlayCtx.globalAlpha = 0.5;
    overlayCtx.drawImage(translatedCanvas, 0, 0);
    overlayCtx.globalAlpha = 1;
    
    // Difference visualization
    const differenceCanvas = this.createDifferenceVisualization(
      originalCanvas,
      translatedCanvas
    );
    
    return {
      beforeCanvas: originalCanvas,
      afterCanvas: translatedCanvas,
      sideBySideCanvas,
      overlayCanvas,
      differenceCanvas
    };
  }

  /**
   * Create difference visualization
   */
  private createDifferenceVisualization(
    canvas1: HTMLCanvasElement,
    canvas2: HTMLCanvasElement
  ): HTMLCanvasElement {
    const width = canvas1.width;
    const height = canvas1.height;
    
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = width;
    diffCanvas.height = height;
    const diffCtx = diffCanvas.getContext('2d')!;
    
    const imageData1 = canvas1.getContext('2d')!.getImageData(0, 0, width, height);
    const imageData2 = canvas2.getContext('2d')!.getImageData(0, 0, width, height);
    const diffData = diffCtx.createImageData(width, height);
    
    for (let i = 0; i < imageData1.data.length; i += 4) {
      const r1 = imageData1.data[i];
      const g1 = imageData1.data[i + 1];
      const b1 = imageData1.data[i + 2];
      
      const r2 = imageData2.data[i];
      const g2 = imageData2.data[i + 1];
      const b2 = imageData2.data[i + 2];
      
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      
      if (diff > 30) {
        // Highlight differences in red
        diffData.data[i] = 255;
        diffData.data[i + 1] = 0;
        diffData.data[i + 2] = 0;
        diffData.data[i + 3] = 255;
      } else {
        // Keep original pixel but desaturated
        const gray = (r1 + g1 + b1) / 3;
        diffData.data[i] = gray;
        diffData.data[i + 1] = gray;
        diffData.data[i + 2] = gray;
        diffData.data[i + 3] = 255;
      }
    }
    
    diffCtx.putImageData(diffData, 0, 0);
    return diffCanvas;
  }

  /**
   * Execute a processing stage with error handling and timing
   */
  private async executeStage<T>(
    stage: ProcessingStage,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    this.currentStage = stage;
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.processingStages.push({
        stage,
        success: true,
        duration,
        confidence: 0.8, // Default confidence
        details: null
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.processingStages.push({
        stage,
        success: false,
        duration,
        confidence: 0,
        details: { error: error.message }
      });
      
      throw error;
    }
  }

  /**
   * Update progress
   */
  private updateProgress(progress: number, message: string): void {
    if (this.progressCallback) {
      this.progressCallback(progress, message);
    }
  }

  /**
   * Load image from URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Create canvas from image
   */
  private createCanvasFromImage(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    
    return canvas;
  }

  /**
   * Create empty result for failed processing
   */
  private async createEmptyResult(imageUrl: string, reason: string): Promise<FilterResult> {
    const originalImage = await this.loadImage(imageUrl);
    const originalCanvas = this.createCanvasFromImage(originalImage);
    
    return {
      success: false,
      originalCanvas,
      translatedCanvas: originalCanvas, // Return original as fallback
      textBlocks: [],
      styleAnalyses: [],
      replacementResult: {
        canvas: originalCanvas,
        success: false,
        textBlocks: [],
        processingTime: 0,
        overallConfidence: 0
      },
      processingTime: 0,
      confidence: 0,
      stages: [{
        stage: 'ocr_analysis',
        success: false,
        duration: 0,
        confidence: 0,
        details: { reason }
      }]
    };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(): number {
    if (this.processingStages.length === 0) return 0;
    
    const successfulStages = this.processingStages.filter(s => s.success);
    const totalConfidence = successfulStages.reduce((sum, s) => sum + s.confidence, 0);
    
    return totalConfidence / this.processingStages.length;
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalStages: number;
    successfulStages: number;
    totalDuration: number;
    averageConfidence: number;
    stageBreakdown: ProcessingStageResult[];
  } {
    const totalDuration = this.processingStages.reduce((sum, s) => sum + s.duration, 0);
    const successfulStages = this.processingStages.filter(s => s.success).length;
    const averageConfidence = this.calculateOverallConfidence();
    
    return {
      totalStages: this.processingStages.length,
      successfulStages,
      totalDuration,
      averageConfidence,
      stageBreakdown: [...this.processingStages]
    };
  }

  /**
   * Export result as different formats
   */
  exportResult(
    result: FilterResult,
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 1
  ): {
    original: string;
    translated: string;
    preview?: string;
  } {
    return {
      original: result.originalCanvas.toDataURL(`image/${format}`, quality),
      translated: result.translatedCanvas.toDataURL(`image/${format}`, quality),
      preview: result.previewCanvas?.toDataURL(`image/${format}`, quality)
    };
  }

  /**
   * Get default filter options
   */
  static getDefaultOptions(): FilterOptions {
    return {
      sourceLang: 'auto',
      targetLang: 'en',
      preserveStyle: true,
      qualityLevel: 'balanced',
      overflowHandling: {
        strategy: 'adaptive_scaling',
        maxScaleDown: 0.6,
        maxScaleUp: 1.2,
        allowLineBreaking: true,
        allowAbbreviation: false,
        prioritizeReadability: true,
        expandBounds: true,
        maxExpansion: 20
      },
      renderingOptions: {
        preserveOriginalStyle: true,
        adaptiveScaling: true,
        qualityLevel: 'high',
        antialiasing: true,
        subpixelRendering: true
      },
      enablePreview: true
    };
  }
}

export const imageTranslationFilter = new ImageTranslationFilter();
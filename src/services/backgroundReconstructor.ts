import { EnhancedTextBlock } from './enhancedOcrService';

// Background reconstruction methods
export type ReconstructionMethod = 
  | 'content_aware_fill'
  | 'patch_match'
  | 'texture_synthesis'
  | 'edge_preserving_smoothing'
  | 'inpainting';

// Reconstruction options
export interface ReconstructionOptions {
  method: ReconstructionMethod;
  quality: 'fast' | 'balanced' | 'high_quality';
  preserveEdges: boolean;
  blendingRadius: number;
  iterations: number;
  textureAnalysis: boolean;
}

// Reconstruction result
export interface ReconstructionResult {
  reconstructedCanvas: HTMLCanvasElement;
  maskCanvas: HTMLCanvasElement;
  success: boolean;
  processingTime: number;
  confidence: number;
  method: ReconstructionMethod;
}

// Texture analysis result
export interface TextureAnalysis {
  dominantPattern: 'solid' | 'gradient' | 'texture' | 'complex';
  direction: number; // angle in degrees
  scale: number;
  roughness: number;
  periodicity: number;
}

export class BackgroundReconstructor {
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
   * Remove text and reconstruct background
   */
  async reconstructBackground(
    originalImage: HTMLImageElement,
    textBlocks: EnhancedTextBlock[],
    options: ReconstructionOptions = this.getDefaultOptions()
  ): Promise<ReconstructionResult> {
    const startTime = performance.now();
    
    // Setup canvases
    this.canvas.width = originalImage.width;
    this.canvas.height = originalImage.height;
    this.workCanvas.width = originalImage.width;
    this.workCanvas.height = originalImage.height;
    
    // Draw original image
    this.ctx.drawImage(originalImage, 0, 0);
    this.workCtx.drawImage(originalImage, 0, 0);
    
    try {
      // Create text mask
      const maskCanvas = this.createTextMask(textBlocks, originalImage.width, originalImage.height);
      
      // Analyze texture around text regions
      const textureAnalysis = options.textureAnalysis 
        ? this.analyzeBackgroundTexture(textBlocks, originalImage)
        : null;
      
      // Choose optimal reconstruction method
      const method = this.selectOptimalMethod(textBlocks, textureAnalysis, options);
      
      // Perform reconstruction
      const success = await this.performReconstruction(
        originalImage,
        maskCanvas,
        textBlocks,
        method,
        options,
        textureAnalysis
      );
      
      const processingTime = performance.now() - startTime;
      const confidence = this.calculateReconstructionConfidence(textBlocks, textureAnalysis);
      
      return {
        reconstructedCanvas: this.canvas,
        maskCanvas,
        success,
        processingTime,
        confidence,
        method
      };
      
    } catch (error) {
      console.error('Background reconstruction failed:', error);
      
      return {
        reconstructedCanvas: this.canvas,
        maskCanvas: document.createElement('canvas'),
        success: false,
        processingTime: performance.now() - startTime,
        confidence: 0,
        method: options.method
      };
    }
  }

  /**
   * Create mask for text regions
   */
  private createTextMask(
    textBlocks: EnhancedTextBlock[],
    width: number,
    height: number
  ): HTMLCanvasElement {
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d')!;
    
    // Fill with black (background)
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(0, 0, width, height);
    
    // Mark text regions in white
    maskCtx.fillStyle = '#ffffff';
    
    for (const block of textBlocks) {
      const { bbox } = block;
      const padding = Math.max(2, Math.min(bbox.x1 - bbox.x0, bbox.y1 - bbox.y0) * 0.1);
      
      // Add padding around text for better reconstruction
      maskCtx.fillRect(
        Math.max(0, bbox.x0 - padding),
        Math.max(0, bbox.y0 - padding),
        Math.min(width, bbox.x1 - bbox.x0 + 2 * padding),
        Math.min(height, bbox.y1 - bbox.y0 + 2 * padding)
      );
    }
    
    // Apply morphological operations to smooth mask
    return this.smoothMask(maskCanvas);
  }

  /**
   * Smooth mask using morphological operations
   */
  private smoothMask(maskCanvas: HTMLCanvasElement): HTMLCanvasElement {
    const smoothCanvas = document.createElement('canvas');
    smoothCanvas.width = maskCanvas.width;
    smoothCanvas.height = maskCanvas.height;
    const smoothCtx = smoothCanvas.getContext('2d')!;
    
    // Apply Gaussian blur for smoother edges
    smoothCtx.filter = 'blur(2px)';
    smoothCtx.drawImage(maskCanvas, 0, 0);
    smoothCtx.filter = 'none';
    
    return smoothCanvas;
  }

  /**
   * Analyze background texture around text regions
   */
  private analyzeBackgroundTexture(
    textBlocks: EnhancedTextBlock[],
    originalImage: HTMLImageElement
  ): TextureAnalysis {
    // Sample regions around text blocks
    const sampleRegions = this.getSampleRegions(textBlocks, originalImage);
    
    let totalDirection = 0;
    let totalScale = 0;
    let totalRoughness = 0;
    let totalPeriodicity = 0;
    let patternCounts = { solid: 0, gradient: 0, texture: 0, complex: 0 };
    
    for (const region of sampleRegions) {
      const analysis = this.analyzeTextureRegion(region);
      
      totalDirection += analysis.direction;
      totalScale += analysis.scale;
      totalRoughness += analysis.roughness;
      totalPeriodicity += analysis.periodicity;
      patternCounts[analysis.dominantPattern]++;
    }
    
    const count = sampleRegions.length || 1;
    
    // Find dominant pattern
    const dominantPattern = Object.entries(patternCounts)
      .reduce((a, b) => patternCounts[a[0] as keyof typeof patternCounts] > patternCounts[b[0] as keyof typeof patternCounts] ? a : b)[0] as TextureAnalysis['dominantPattern'];
    
    return {
      dominantPattern,
      direction: totalDirection / count,
      scale: totalScale / count,
      roughness: totalRoughness / count,
      periodicity: totalPeriodicity / count
    };
  }

  /**
   * Get sample regions around text blocks
   */
  private getSampleRegions(
    textBlocks: EnhancedTextBlock[],
    originalImage: HTMLImageElement
  ): ImageData[] {
    const regions: ImageData[] = [];
    
    for (const block of textBlocks) {
      const { bbox } = block;
      const sampleSize = Math.min(50, Math.max(20, (bbox.x1 - bbox.x0) / 2));
      
      // Sample regions around the text block
      const samplePositions = [
        { x: bbox.x0 - sampleSize, y: bbox.y0 - sampleSize }, // Top-left
        { x: bbox.x1, y: bbox.y0 - sampleSize }, // Top-right
        { x: bbox.x0 - sampleSize, y: bbox.y1 }, // Bottom-left
        { x: bbox.x1, y: bbox.y1 } // Bottom-right
      ];
      
      for (const pos of samplePositions) {
        if (pos.x >= 0 && pos.y >= 0 && 
            pos.x + sampleSize <= originalImage.width && 
            pos.y + sampleSize <= originalImage.height) {
          
          this.workCtx.drawImage(originalImage, 0, 0);
          const region = this.workCtx.getImageData(pos.x, pos.y, sampleSize, sampleSize);
          regions.push(region);
        }
      }
    }
    
    return regions;
  }

  /**
   * Analyze texture in a specific region
   */
  private analyzeTextureRegion(imageData: ImageData): TextureAnalysis {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Calculate variance and gradients
    let variance = 0;
    let totalGradientX = 0;
    let totalGradientY = 0;
    let edgeCount = 0;
    
    const pixels = width * height;
    const brightnesses: number[] = [];
    
    // First pass: collect brightness values
    for (let i = 0; i < pixels; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      const brightness = (r + g + b) / 3;
      brightnesses.push(brightness);
    }
    
    const avgBrightness = brightnesses.reduce((a, b) => a + b, 0) / pixels;
    
    // Second pass: calculate variance and gradients
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const brightness = brightnesses[idx];
        
        // Variance
        variance += Math.pow(brightness - avgBrightness, 2);
        
        // Gradients
        const gradX = brightnesses[idx + 1] - brightnesses[idx - 1];
        const gradY = brightnesses[idx + width] - brightnesses[idx - width];
        
        totalGradientX += Math.abs(gradX);
        totalGradientY += Math.abs(gradY);
        
        if (Math.abs(gradX) > 20 || Math.abs(gradY) > 20) {
          edgeCount++;
        }
      }
    }
    
    variance /= pixels;
    const avgGradientX = totalGradientX / pixels;
    const avgGradientY = totalGradientY / pixels;
    
    // Determine pattern type
    let dominantPattern: TextureAnalysis['dominantPattern'];
    if (variance < 100) {
      dominantPattern = 'solid';
    } else if (edgeCount < pixels * 0.1) {
      dominantPattern = 'gradient';
    } else if (edgeCount < pixels * 0.3) {
      dominantPattern = 'texture';
    } else {
      dominantPattern = 'complex';
    }
    
    // Calculate direction
    const direction = Math.atan2(avgGradientY, avgGradientX) * 180 / Math.PI;
    
    // Calculate other properties
    const scale = Math.sqrt(variance) / 255;
    const roughness = edgeCount / pixels;
    const periodicity = this.calculatePeriodicity(brightnesses, width, height);
    
    return {
      dominantPattern,
      direction,
      scale,
      roughness,
      periodicity
    };
  }

  /**
   * Calculate periodicity of texture
   */
  private calculatePeriodicity(brightnesses: number[], width: number, height: number): number {
    // Simple autocorrelation for periodicity detection
    let maxCorrelation = 0;
    
    for (let offset = 1; offset < Math.min(width, height) / 4; offset++) {
      let correlation = 0;
      let count = 0;
      
      for (let y = 0; y < height - offset; y++) {
        for (let x = 0; x < width - offset; x++) {
          const idx1 = y * width + x;
          const idx2 = (y + offset) * width + (x + offset);
          
          correlation += brightnesses[idx1] * brightnesses[idx2];
          count++;
        }
      }
      
      if (count > 0) {
        correlation /= count;
        maxCorrelation = Math.max(maxCorrelation, correlation);
      }
    }
    
    return maxCorrelation / (255 * 255); // Normalize
  }

  /**
   * Select optimal reconstruction method
   */
  private selectOptimalMethod(
    textBlocks: EnhancedTextBlock[],
    textureAnalysis: TextureAnalysis | null,
    options: ReconstructionOptions
  ): ReconstructionMethod {
    if (options.method !== 'content_aware_fill') {
      return options.method;
    }
    
    // Auto-select based on texture analysis
    if (!textureAnalysis) {
      return 'edge_preserving_smoothing';
    }
    
    switch (textureAnalysis.dominantPattern) {
      case 'solid':
        return 'edge_preserving_smoothing';
      case 'gradient':
        return 'inpainting';
      case 'texture':
        return 'texture_synthesis';
      case 'complex':
        return 'patch_match';
      default:
        return 'content_aware_fill';
    }
  }

  /**
   * Perform the actual reconstruction
   */
  private async performReconstruction(
    originalImage: HTMLImageElement,
    maskCanvas: HTMLCanvasElement,
    textBlocks: EnhancedTextBlock[],
    method: ReconstructionMethod,
    options: ReconstructionOptions,
    textureAnalysis: TextureAnalysis | null
  ): Promise<boolean> {
    switch (method) {
      case 'content_aware_fill':
        return this.contentAwareFill(maskCanvas, options);
      case 'patch_match':
        return this.patchMatch(maskCanvas, options);
      case 'texture_synthesis':
        return this.textureSynthesis(maskCanvas, textureAnalysis, options);
      case 'edge_preserving_smoothing':
        return this.edgePreservingSmoothing(maskCanvas, options);
      case 'inpainting':
        return this.inpainting(maskCanvas, options);
      default:
        return false;
    }
  }

  /**
   * Content-aware fill implementation
   */
  private async contentAwareFill(
    maskCanvas: HTMLCanvasElement,
    options: ReconstructionOptions
  ): Promise<boolean> {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const maskData = maskCanvas.getContext('2d')!.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    
    // Implement simplified content-aware fill
    for (let iteration = 0; iteration < options.iterations; iteration++) {
      this.fillIteration(imageData, maskData, options);
    }
    
    this.ctx.putImageData(imageData, 0, 0);
    return true;
  }

  /**
   * Single iteration of fill algorithm
   */
  private fillIteration(
    imageData: ImageData,
    maskData: ImageData,
    options: ReconstructionOptions
  ): void {
    const data = imageData.data;
    const mask = maskData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const maskIdx = idx;
        
        // If this pixel needs to be filled (white in mask)
        if (mask[maskIdx] > 128) {
          const neighbors = this.getNeighborColors(data, mask, x, y, width, height);
          
          if (neighbors.length > 0) {
            // Average neighbor colors
            let r = 0, g = 0, b = 0;
            for (const neighbor of neighbors) {
              r += neighbor.r;
              g += neighbor.g;
              b += neighbor.b;
            }
            
            newData[idx] = r / neighbors.length;
            newData[idx + 1] = g / neighbors.length;
            newData[idx + 2] = b / neighbors.length;
            newData[idx + 3] = 255;
          }
        }
      }
    }
    
    // Copy back
    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  /**
   * Get neighbor colors for filling
   */
  private getNeighborColors(
    data: Uint8ClampedArray,
    mask: Uint8ClampedArray,
    x: number,
    y: number,
    width: number,
    height: number
  ): Array<{ r: number; g: number; b: number }> {
    const neighbors: Array<{ r: number; g: number; b: number }> = [];
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = (ny * width + nx) * 4;
          
          // If neighbor is not masked (black in mask)
          if (mask[idx] < 128) {
            neighbors.push({
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2]
            });
          }
        }
      }
    }
    
    return neighbors;
  }

  /**
   * Patch match implementation (simplified)
   */
  private async patchMatch(
    maskCanvas: HTMLCanvasElement,
    options: ReconstructionOptions
  ): Promise<boolean> {
    // Simplified patch-based reconstruction
    return this.contentAwareFill(maskCanvas, options);
  }

  /**
   * Texture synthesis implementation
   */
  private async textureSynthesis(
    maskCanvas: HTMLCanvasElement,
    textureAnalysis: TextureAnalysis | null,
    options: ReconstructionOptions
  ): Promise<boolean> {
    // Simplified texture synthesis
    return this.contentAwareFill(maskCanvas, options);
  }

  /**
   * Edge-preserving smoothing
   */
  private async edgePreservingSmoothing(
    maskCanvas: HTMLCanvasElement,
    options: ReconstructionOptions
  ): Promise<boolean> {
    // Apply bilateral filter-like smoothing
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const maskData = maskCanvas.getContext('2d')!.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    
    this.applyBilateralFilter(imageData, maskData, options);
    this.ctx.putImageData(imageData, 0, 0);
    
    return true;
  }

  /**
   * Apply bilateral filter
   */
  private applyBilateralFilter(
    imageData: ImageData,
    maskData: ImageData,
    options: ReconstructionOptions
  ): void {
    const data = imageData.data;
    const mask = maskData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);
    
    const radius = options.blendingRadius;
    const sigmaColor = 50;
    const sigmaSpace = 50;
    
    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        const idx = (y * width + x) * 4;
        
        if (mask[idx] > 128) { // Pixel needs reconstruction
          let totalWeight = 0;
          let r = 0, g = 0, b = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              const nIdx = (ny * width + nx) * 4;
              
              if (mask[nIdx] < 128) { // Valid neighbor
                const spatialDist = Math.sqrt(dx * dx + dy * dy);
                const colorDist = Math.sqrt(
                  Math.pow(data[idx] - data[nIdx], 2) +
                  Math.pow(data[idx + 1] - data[nIdx + 1], 2) +
                  Math.pow(data[idx + 2] - data[nIdx + 2], 2)
                );
                
                const weight = Math.exp(
                  -(spatialDist * spatialDist) / (2 * sigmaSpace * sigmaSpace) -
                  (colorDist * colorDist) / (2 * sigmaColor * sigmaColor)
                );
                
                totalWeight += weight;
                r += data[nIdx] * weight;
                g += data[nIdx + 1] * weight;
                b += data[nIdx + 2] * weight;
              }
            }
          }
          
          if (totalWeight > 0) {
            newData[idx] = r / totalWeight;
            newData[idx + 1] = g / totalWeight;
            newData[idx + 2] = b / totalWeight;
          }
        }
      }
    }
    
    // Copy back
    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  /**
   * Inpainting implementation
   */
  private async inpainting(
    maskCanvas: HTMLCanvasElement,
    options: ReconstructionOptions
  ): Promise<boolean> {
    // Simplified inpainting using diffusion
    return this.contentAwareFill(maskCanvas, options);
  }

  /**
   * Calculate reconstruction confidence
   */
  private calculateReconstructionConfidence(
    textBlocks: EnhancedTextBlock[],
    textureAnalysis: TextureAnalysis | null
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for simpler textures
    if (textureAnalysis) {
      switch (textureAnalysis.dominantPattern) {
        case 'solid':
          confidence += 0.4;
          break;
        case 'gradient':
          confidence += 0.3;
          break;
        case 'texture':
          confidence += 0.1;
          break;
        case 'complex':
          confidence -= 0.1;
          break;
      }
      
      // Lower confidence for high roughness
      confidence -= textureAnalysis.roughness * 0.2;
    }
    
    // Lower confidence for larger text regions
    const totalTextArea = textBlocks.reduce((sum, block) => {
      return sum + (block.bbox.x1 - block.bbox.x0) * (block.bbox.y1 - block.bbox.y0);
    }, 0);
    
    const imageArea = this.canvas.width * this.canvas.height;
    const textRatio = totalTextArea / imageArea;
    
    confidence -= textRatio * 0.3;
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Get default reconstruction options
   */
  private getDefaultOptions(): ReconstructionOptions {
    return {
      method: 'content_aware_fill',
      quality: 'balanced',
      preserveEdges: true,
      blendingRadius: 3,
      iterations: 5,
      textureAnalysis: true
    };
  }

  /**
   * Clone the reconstruction result
   */
  cloneResult(): HTMLCanvasElement {
    const clone = document.createElement('canvas');
    clone.width = this.canvas.width;
    clone.height = this.canvas.height;
    
    const cloneCtx = clone.getContext('2d')!;
    cloneCtx.drawImage(this.canvas, 0, 0);
    
    return clone;
  }
}

export const backgroundReconstructor = new BackgroundReconstructor();
import Tesseract from 'tesseract.js';
import { baiduTranslationService } from './baiduTranslationService';

// Enhanced text block interface with style information
export interface EnhancedTextBlock {
  id: string;
  text: string;
  translatedText?: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  style: {
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
    rotation: number;
    alignment: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    underline: boolean;
  };
  confidence: number;
}

export interface ImageAnalysisResult {
  textBlocks: EnhancedTextBlock[];
  imageData: {
    width: number;
    height: number;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
  };
}

export class EnhancedOcrService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Analyze image and extract text with style information
   */
  async analyzeImage(imageUrl: string, sourceLang: string = 'auto'): Promise<ImageAnalysisResult> {
    // Load image
    const img = await this.loadImage(imageUrl);
    
    // Setup canvas
    this.canvas.width = img.width;
    this.canvas.height = img.height;
    this.ctx.drawImage(img, 0, 0);
    
    // Get image data for analysis
    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
    
    // Perform OCR with Tesseract
    const ocrResult = await this.performOCR(imageUrl, sourceLang);
    
    // Enhance OCR results with style detection
    const enhancedBlocks = await this.enhanceWithStyleDetection(ocrResult, imageData, img);
    
    return {
      textBlocks: enhancedBlocks,
      imageData: {
        width: img.width,
        height: img.height,
        canvas: this.canvas,
        context: this.ctx
      }
    };
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
   * Perform OCR using Tesseract.js
   */
  private async performOCR(imageUrl: string, sourceLang: string) {
    const langMap: Record<string, string> = {
      'auto': 'eng+chi_sim+jpn+kor',
      'zh': 'chi_sim',
      'en': 'eng',
      'ja': 'jpn',
      'ko': 'kor',
      'fr': 'fra',
      'de': 'deu',
      'es': 'spa',
      'it': 'ita',
      'pt': 'por',
      'ru': 'rus'
    };

    const tesseractLang = langMap[sourceLang] || 'eng+chi_sim';
    
    const { data } = await Tesseract.recognize(imageUrl, tesseractLang, {
      logger: m => console.log('OCR Progress:', m)
    });

    return data;
  }

  /**
   * Enhance OCR results with style detection
   */
  private async enhanceWithStyleDetection(
    ocrData: Tesseract.Page,
    imageData: ImageData,
    img: HTMLImageElement
  ): Promise<EnhancedTextBlock[]> {
    const blocks: EnhancedTextBlock[] = [];

    // Handle different Tesseract.js data structures
    const words = (ocrData as any).words || [];
    if (!words.length) return blocks;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!word.text.trim() || word.confidence < 30) continue;

      const bbox = word.bbox;
      const style = await this.detectTextStyle(bbox, imageData, img);

      blocks.push({
        id: `block_${i}`,
        text: word.text,
        bbox,
        style,
        confidence: word.confidence / 100
      });
    }

    // Group nearby words into text blocks
    return this.groupWordsIntoBlocks(blocks);
  }

  /**
   * Detect text style from image region
   */
  private async detectTextStyle(
    bbox: Tesseract.Bbox,
    imageData: ImageData,
    img: HTMLImageElement
  ) {
    const { x0, y0, x1, y1 } = bbox;
    const width = x1 - x0;
    const height = y1 - y0;

    // Extract region for analysis
    const regionData = this.ctx.getImageData(x0, y0, width, height);
    
    // Analyze colors
    const colors = this.analyzeColors(regionData);
    
    // Estimate font size based on bounding box height
    const fontSize = this.estimateFontSize(height);
    
    // Detect text alignment
    const alignment = this.detectAlignment(bbox, img.width);
    
    // Analyze text properties
    const textProps = this.analyzeTextProperties(regionData);

    return {
      fontSize,
      fontFamily: this.estimateFontFamily(regionData),
      color: colors.textColor,
      backgroundColor: colors.backgroundColor,
      rotation: 0, // TODO: Implement rotation detection
      alignment,
      bold: textProps.bold,
      italic: textProps.italic,
      underline: textProps.underline
    };
  }

  /**
   * Analyze colors in image region
   */
  private analyzeColors(imageData: ImageData) {
    const data = imageData.data;
    const pixels = data.length / 4;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let darkPixels = 0, lightPixels = 0;
    
    for (let i = 0; i < pixels; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      
      totalR += r;
      totalG += g;
      totalB += b;
      
      const brightness = (r + g + b) / 3;
      if (brightness < 128) darkPixels++;
      else lightPixels++;
    }
    
    const avgR = Math.round(totalR / pixels);
    const avgG = Math.round(totalG / pixels);
    const avgB = Math.round(totalB / pixels);
    
    // Determine text and background colors
    const isDarkText = darkPixels > lightPixels;
    
    return {
      textColor: isDarkText ? '#000000' : '#ffffff',
      backgroundColor: isDarkText ? '#ffffff' : '#000000',
      averageColor: `rgb(${avgR}, ${avgG}, ${avgB})`
    };
  }

  /**
   * Estimate font size based on text height
   */
  private estimateFontSize(height: number): number {
    // Rough estimation: font size is typically 70-80% of text height
    return Math.max(8, Math.round(height * 0.75));
  }

  /**
   * Detect text alignment
   */
  private detectAlignment(bbox: Tesseract.Bbox, imageWidth: number): 'left' | 'center' | 'right' {
    const centerX = (bbox.x0 + bbox.x1) / 2;
    const imageCenter = imageWidth / 2;
    const leftThird = imageWidth / 3;
    const rightThird = imageWidth * 2 / 3;
    
    if (centerX < leftThird) return 'left';
    if (centerX > rightThird) return 'right';
    return 'center';
  }

  /**
   * Analyze text properties (bold, italic, underline)
   */
  private analyzeTextProperties(imageData: ImageData) {
    // Simple heuristics for text properties
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let edgePixels = 0;
    let totalPixels = 0;
    
    // Analyze edge density for bold detection
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = data[idx];
        const right = data[idx + 4];
        const bottom = data[(y + 1) * width * 4 + x * 4];
        
        if (Math.abs(current - right) > 50 || Math.abs(current - bottom) > 50) {
          edgePixels++;
        }
        totalPixels++;
      }
    }
    
    const edgeDensity = edgePixels / totalPixels;
    
    return {
      bold: edgeDensity > 0.3, // High edge density suggests bold text
      italic: false, // TODO: Implement italic detection
      underline: false // TODO: Implement underline detection
    };
  }

  /**
   * Estimate font family based on character analysis
   */
  private estimateFontFamily(imageData: ImageData): string {
    // Simple heuristic - analyze character shapes
    // For now, return common web fonts
    const fonts = [
      'Arial, sans-serif',
      'Times New Roman, serif',
      'Helvetica, sans-serif',
      'Georgia, serif',
      'Verdana, sans-serif'
    ];
    
    // TODO: Implement more sophisticated font detection
    return fonts[0]; // Default to Arial
  }

  /**
   * Group nearby words into coherent text blocks
   */
  private groupWordsIntoBlocks(words: EnhancedTextBlock[]): EnhancedTextBlock[] {
    if (words.length === 0) return [];
    
    const blocks: EnhancedTextBlock[] = [];
    const used = new Set<number>();
    
    for (let i = 0; i < words.length; i++) {
      if (used.has(i)) continue;
      
      const group = [words[i]];
      used.add(i);
      
      // Find nearby words
      for (let j = i + 1; j < words.length; j++) {
        if (used.has(j)) continue;
        
        if (this.areWordsNearby(words[i], words[j])) {
          group.push(words[j]);
          used.add(j);
        }
      }
      
      // Merge group into single block
      if (group.length > 0) {
        blocks.push(this.mergeWordsIntoBlock(group));
      }
    }
    
    return blocks;
  }

  /**
   * Check if two words are nearby and should be grouped
   */
  private areWordsNearby(word1: EnhancedTextBlock, word2: EnhancedTextBlock): boolean {
    const distance = Math.sqrt(
      Math.pow(word1.bbox.x0 - word2.bbox.x0, 2) +
      Math.pow(word1.bbox.y0 - word2.bbox.y0, 2)
    );
    
    const avgHeight = (word1.bbox.y1 - word1.bbox.y0 + word2.bbox.y1 - word2.bbox.y0) / 2;
    
    return distance < avgHeight * 2; // Words are nearby if distance < 2x average height
  }

  /**
   * Merge multiple words into a single text block
   */
  private mergeWordsIntoBlock(words: EnhancedTextBlock[]): EnhancedTextBlock {
    const texts = words.map(w => w.text).join(' ');
    
    // Calculate combined bounding box
    const minX = Math.min(...words.map(w => w.bbox.x0));
    const minY = Math.min(...words.map(w => w.bbox.y0));
    const maxX = Math.max(...words.map(w => w.bbox.x1));
    const maxY = Math.max(...words.map(w => w.bbox.y1));
    
    // Use style from the first word (could be improved)
    const style = words[0].style;
    
    // Average confidence
    const avgConfidence = words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
    
    return {
      id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: texts,
      bbox: { x0: minX, y0: minY, x1: maxX, y1: maxY },
      style,
      confidence: avgConfidence
    };
  }

  /**
   * Translate text blocks using Baidu API
   */
  async translateTextBlocks(
    blocks: EnhancedTextBlock[],
    sourceLang: string,
    targetLang: string
  ): Promise<EnhancedTextBlock[]> {
    const translatedBlocks = [...blocks];
    
    for (let i = 0; i < translatedBlocks.length; i++) {
      const block = translatedBlocks[i];
      
      try {
        const result = await baiduTranslationService.translateText({
          text: block.text,
          sourceLang,
          targetLang
        });
        
        translatedBlocks[i] = {
          ...block,
          translatedText: result.translatedText
        };
      } catch (error) {
        console.error(`Translation failed for block ${block.id}:`, error);
        translatedBlocks[i] = {
          ...block,
          translatedText: block.text // Fallback to original text
        };
      }
    }
    
    return translatedBlocks;
  }
}

export const enhancedOcrService = new EnhancedOcrService();
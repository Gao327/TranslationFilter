// Interface Translation Service Types
export interface UIElement {
  id: string;
  text: string;
  translatedText?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  confidence: number;
  elementType: 'button' | 'text' | 'label' | 'input' | 'link' | 'other';
}

export interface ScreenCapture {
  imageData: string; // Base64 encoded image
  width: number;
  height: number;
  timestamp: Date;
  deviceInfo: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
  };
}

export interface TranslationOverlay {
  id: string;
  elements: UIElement[];
  sourceLang: string;
  targetLang: string;
  opacity: number;
  isVisible: boolean;
  createdAt: Date;
}

export interface InterfaceTranslationRequest {
  screenshot: string;
  elements: UIElement[];
  sourceLang: string;
  targetLang: string;
  model?: string;
}

export interface InterfaceTranslationResponse {
  translations: Array<{
    elementId: string;
    translatedText: string;
    confidence: number;
  }>;
  processingTime: number;
  model: string;
}

// Mock UI Element Detection Service
class MockUIDetectionService {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async detectUIElements(imageData: string): Promise<UIElement[]> {
    await this.delay(1000 + Math.random() * 1000);

    // Mock detected UI elements
    const mockElements: UIElement[] = [
      {
        id: 'element-1',
        text: '设置',
        x: 50,
        y: 100,
        width: 60,
        height: 30,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#333333',
        backgroundColor: '#ffffff',
        confidence: 0.95,
        elementType: 'button'
      },
      {
        id: 'element-2',
        text: '消息',
        x: 150,
        y: 100,
        width: 60,
        height: 30,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#333333',
        backgroundColor: '#ffffff',
        confidence: 0.92,
        elementType: 'button'
      },
      {
        id: 'element-3',
        text: '联系人',
        x: 250,
        y: 100,
        width: 80,
        height: 30,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#333333',
        backgroundColor: '#ffffff',
        confidence: 0.88,
        elementType: 'button'
      },
      {
        id: 'element-4',
        text: '搜索...',
        x: 50,
        y: 200,
        width: 200,
        height: 40,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#666666',
        backgroundColor: '#f5f5f5',
        confidence: 0.85,
        elementType: 'input'
      },
      {
        id: 'element-5',
        text: '立即购买',
        x: 100,
        y: 300,
        width: 120,
        height: 45,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#ffffff',
        backgroundColor: '#007bff',
        confidence: 0.98,
        elementType: 'button'
      },
      {
        id: 'element-6',
        text: '了解更多',
        x: 250,
        y: 300,
        width: 100,
        height: 45,
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#007bff',
        backgroundColor: 'transparent',
        confidence: 0.90,
        elementType: 'link'
      }
    ];

    return mockElements;
  }

  async analyzeScreenshot(imageData: string): Promise<{
    elements: UIElement[];
    metadata: {
      detectedLanguage: string;
      elementCount: number;
      processingTime: number;
    };
  }> {
    const startTime = Date.now();
    const elements = await this.detectUIElements(imageData);
    const processingTime = Date.now() - startTime;

    return {
      elements,
      metadata: {
        detectedLanguage: 'zh',
        elementCount: elements.length,
        processingTime
      }
    };
  }
}

// Screen Capture Service
class ScreenCaptureService {
  async captureScreen(): Promise<ScreenCapture> {
    try {
      // For web applications, we can't directly capture the screen
      // This would typically require browser extensions or native apps
      // For demo purposes, we'll create a mock capture
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to viewport
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Create a mock screenshot (gradient background)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f0f9ff');
      gradient.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add some mock UI elements
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(50, 100, 60, 30);
      ctx.fillRect(150, 100, 60, 30);
      ctx.fillRect(250, 100, 80, 30);
      ctx.fillRect(50, 200, 200, 40);
      ctx.fillRect(100, 300, 120, 45);
      
      // Add text
      ctx.fillStyle = '#333333';
      ctx.font = '16px Arial';
      ctx.fillText('设置', 65, 120);
      ctx.fillText('消息', 165, 120);
      ctx.fillText('联系人', 265, 120);
      ctx.fillText('搜索...', 60, 225);
      ctx.fillText('立即购买', 120, 325);
      
      const imageData = canvas.toDataURL('image/png');
      
      return {
        imageData,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          screenWidth: screen.width,
          screenHeight: screen.height,
          pixelRatio: window.devicePixelRatio
        }
      };
    } catch (error) {
      throw new Error('Failed to capture screen: ' + error);
    }
  }

  async captureElement(element: HTMLElement): Promise<string> {
    // Mock element capture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Create mock element capture
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/png');
  }
}

// Translation Overlay Manager
class TranslationOverlayManager {
  private overlays: Map<string, TranslationOverlay> = new Map();
  private activeOverlayId: string | null = null;

  createOverlay(
    elements: UIElement[],
    sourceLang: string,
    targetLang: string,
    opacity: number = 0.8
  ): TranslationOverlay {
    const overlay: TranslationOverlay = {
      id: `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      elements,
      sourceLang,
      targetLang,
      opacity,
      isVisible: false,
      createdAt: new Date()
    };

    this.overlays.set(overlay.id, overlay);
    return overlay;
  }

  showOverlay(overlayId: string): void {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      // Hide current active overlay
      if (this.activeOverlayId) {
        this.hideOverlay(this.activeOverlayId);
      }

      overlay.isVisible = true;
      this.activeOverlayId = overlayId;
      this.renderOverlay(overlay);
    }
  }

  hideOverlay(overlayId: string): void {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      overlay.isVisible = false;
      this.removeOverlayFromDOM(overlayId);
      
      if (this.activeOverlayId === overlayId) {
        this.activeOverlayId = null;
      }
    }
  }

  updateOverlayOpacity(overlayId: string, opacity: number): void {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      overlay.opacity = opacity;
      if (overlay.isVisible) {
        this.renderOverlay(overlay);
      }
    }
  }

  toggleOverlay(overlayId: string): void {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      if (overlay.isVisible) {
        this.hideOverlay(overlayId);
      } else {
        this.showOverlay(overlayId);
      }
    }
  }

  private renderOverlay(overlay: TranslationOverlay): void {
    // Remove existing overlay
    this.removeOverlayFromDOM(overlay.id);

    // Create overlay container
    const overlayContainer = document.createElement('div');
    overlayContainer.id = `translation-overlay-${overlay.id}`;
    overlayContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10000;
    `;

    // Render each translated element
    overlay.elements.forEach(element => {
      if (element.translatedText) {
        const translationElement = document.createElement('div');
        translationElement.style.cssText = `
          position: absolute;
          left: ${element.x}px;
          top: ${element.y}px;
          width: ${element.width}px;
          height: ${element.height}px;
          background-color: rgba(59, 130, 246, ${overlay.opacity});
          color: white;
          font-size: ${element.fontSize || 14}px;
          font-family: ${element.fontFamily || 'Arial, sans-serif'};
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          font-weight: 500;
          text-align: center;
          padding: 2px 4px;
          box-sizing: border-box;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        `;
        translationElement.textContent = element.translatedText;
        overlayContainer.appendChild(translationElement);
      }
    });

    document.body.appendChild(overlayContainer);
  }

  private removeOverlayFromDOM(overlayId: string): void {
    const existingOverlay = document.getElementById(`translation-overlay-${overlayId}`);
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }

  getActiveOverlay(): TranslationOverlay | null {
    return this.activeOverlayId ? this.overlays.get(this.activeOverlayId) || null : null;
  }

  getAllOverlays(): TranslationOverlay[] {
    return Array.from(this.overlays.values());
  }

  removeOverlay(overlayId: string): void {
    this.hideOverlay(overlayId);
    this.overlays.delete(overlayId);
  }

  clearAllOverlays(): void {
    this.overlays.forEach((_, id) => this.hideOverlay(id));
    this.overlays.clear();
    this.activeOverlayId = null;
  }
}

// Main Interface Translation Service
export class InterfaceTranslationService {
  private uiDetectionService = new MockUIDetectionService();
  private screenCaptureService = new ScreenCaptureService();
  private overlayManager = new TranslationOverlayManager();

  async captureAndAnalyze(): Promise<{
    capture: ScreenCapture;
    elements: UIElement[];
    metadata: any;
  }> {
    const capture = await this.screenCaptureService.captureScreen();
    const analysis = await this.uiDetectionService.analyzeScreenshot(capture.imageData);
    
    return {
      capture,
      elements: analysis.elements,
      metadata: analysis.metadata
    };
  }

  async translateInterface(
    elements: UIElement[],
    sourceLang: string,
    targetLang: string,
    translationService: any
  ): Promise<UIElement[]> {
    const translatedElements = await Promise.all(
      elements.map(async (element) => {
        try {
          const response = await translationService.translate({
            text: element.text,
            sourceLang,
            targetLang
          });
          
          return {
            ...element,
            translatedText: response.translatedText
          };
        } catch (error) {
          console.error(`Failed to translate element ${element.id}:`, error);
          return {
            ...element,
            translatedText: element.text // Fallback to original text
          };
        }
      })
    );

    return translatedElements;
  }

  createTranslationOverlay(
    elements: UIElement[],
    sourceLang: string,
    targetLang: string,
    opacity: number = 0.8
  ): TranslationOverlay {
    return this.overlayManager.createOverlay(elements, sourceLang, targetLang, opacity);
  }

  showOverlay(overlayId: string): void {
    this.overlayManager.showOverlay(overlayId);
  }

  hideOverlay(overlayId: string): void {
    this.overlayManager.hideOverlay(overlayId);
  }

  toggleOverlay(overlayId: string): void {
    this.overlayManager.toggleOverlay(overlayId);
  }

  updateOverlayOpacity(overlayId: string, opacity: number): void {
    this.overlayManager.updateOverlayOpacity(overlayId, opacity);
  }

  getActiveOverlay(): TranslationOverlay | null {
    return this.overlayManager.getActiveOverlay();
  }

  clearAllOverlays(): void {
    this.overlayManager.clearAllOverlays();
  }

  // Utility methods
  async requestScreenCapturePermission(): Promise<boolean> {
    // In a real implementation, this would request screen capture permissions
    // For web apps, this might involve asking for screen sharing permissions
    try {
      // Mock permission request
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    } catch (error) {
      return false;
    }
  }

  isScreenCaptureSupported(): boolean {
    // Check if the current environment supports screen capture
    return 'getDisplayMedia' in navigator.mediaDevices || 
           'webkitGetDisplayMedia' in navigator.mediaDevices;
  }
}

// Export singleton instance
export const interfaceTranslationService = new InterfaceTranslationService();
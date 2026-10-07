/**
 * Japanese font support for jsPDF
 * Ensures proper rendering of Japanese characters using html2canvas
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Render Japanese text as image and add to PDF
 * This is necessary because jsPDF's default fonts don't support Japanese characters
 */
// --- FAST IMAGE CACHE ---
const canvasCache = new Map<string, HTMLCanvasElement>();

export const renderJapaneseText = async (
  text: string,
  fontSize: number = 10,
  fontStyle: 'normal' | 'bold' = 'normal',
  width: number = 100,
  align: 'left' | 'center' | 'right' = 'left'
): Promise<HTMLCanvasElement | null> => {
  try {
    const cacheKey = `${text}_${fontSize}_${fontStyle}_${width}`;
    if (canvasCache.has(cacheKey)) {
        return canvasCache.get(cacheKey) || null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scale = 4;
    const ptToPx = 1.333;
    const pxSize = fontSize * ptToPx;
    const fontStr = `${fontStyle === 'bold' ? 'bold' : 'normal'} ${pxSize}px 'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif`;
    
    ctx.font = fontStr;
    const maxWidthPx = (width * 3.78) || 2000;
    
    const words = text.split(/(?<=[ ,])/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        let testLine = currentLine + word;
        let metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidthPx) {
            // If the word itself is wider than maxWidth, we need to break it character by character
            if (currentLine !== '') {
                lines.push(currentLine.trim());
                currentLine = '';
            }
            
            let subWord = '';
            for (const char of word) {
                const testSubLine = currentLine + char;
                const subMetrics = ctx.measureText(testSubLine);
                if (subMetrics.width > maxWidthPx) {
                    lines.push(currentLine.trim());
                    currentLine = char;
                } else {
                    currentLine = testSubLine;
                }
            }
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine.trim());

    const lineHeight = pxSize * 1.3;
    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
    
    // Tightly bound text to avoid alignment shifts in PDF
    canvas.width = (maxLineWidth + 2) * scale;
    canvas.height = (lines.length * lineHeight + 6) * scale;
    
    ctx.scale(scale, scale);
    ctx.font = fontStr;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#000000';
    ctx.imageSmoothingEnabled = false;

    lines.forEach((line, i) => {
        ctx.fillText(line, 1, i * lineHeight + 2);
    });

    canvasCache.set(cacheKey, canvas);
    return canvas;
  } catch (error) {
    console.error('Error rendering Japanese text:', error);
    return null;
  }
};

/**
 * Configure jsPDF document for Japanese text rendering
 * Note: We'll use html2canvas for Japanese text rendering
 */
export const configureJapaneseFont = (doc: jsPDF): void => {
  try {
    // For Japanese, we'll render text using html2canvas
    // Set default font for non-Japanese text
    doc.setFont('helvetica');

    console.log('Japanese font support configured (using html2canvas for Japanese text)');
  } catch (error) {
    console.error('Error configuring Japanese font:', error);
  }
};

/**
 * Verifies if the Japanese font asset (Noto Sans JP) is loaded and available.
 * If the font asset failed to load or was blocked by network blocking / DevTools,
 * this returns false to prevent generating PDFs without the designated font.
 */
export const isJapaneseFontAssetLoaded = async (): Promise<boolean> => {
  try {
    if (typeof document === 'undefined' || !document.fonts) {
      return true;
    }

    // Try loading the font for Japanese characters
    try {
      const loadedFaces = await document.fonts.load('16px "Noto Sans JP"', '請求書');
      if (!loadedFaces || loadedFaces.length === 0) {
        return false;
      }
      const hasLoaded = loadedFaces.some((f) => f.status === 'loaded');
      if (!hasLoaded) {
        return false;
      }
    } catch (loadErr) {
      console.warn('document.fonts.load rejected for Noto Sans JP:', loadErr);
      return false;
    }

    const isReady = document.fonts.check('16px "Noto Sans JP"', '請求書');
    if (!isReady) {
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Japanese font asset check failed:', err);
    return false;
  }
};



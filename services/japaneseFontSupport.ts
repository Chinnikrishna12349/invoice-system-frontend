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
        const testLine = currentLine + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidthPx && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word;
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
 * Check if a string contains Japanese characters
 */
export const containsJapanese = (text: string): boolean => {
  // Check for Hiragana, Katakana, or Kanji
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u00A5\u20B9]/.test(text);
};


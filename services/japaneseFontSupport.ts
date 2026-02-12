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
export const renderJapaneseText = async (
  text: string,
  fontSize: number = 10,
  fontStyle: 'normal' | 'bold' = 'normal',
  width: number = 100,
  align: 'left' | 'center' | 'right' = 'left'
): Promise<string> => {
  try {
    // Create a temporary div element
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-9999px';
    div.style.top = '-9999px';
    div.style.fontSize = `${fontSize}pt`;
    div.style.fontFamily = "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    // Use slightly heavier weight for normal text to match PDF Helvetica
    div.style.fontWeight = fontStyle === 'bold' ? 'bold' : '500';
    div.style.color = '#000000';
    div.style.whiteSpace = 'nowrap';
    div.style.width = 'auto'; // Auto width to fit content
    div.style.minWidth = '50px'; // Minimum width to prevent collapse
    div.style.padding = '4px'; // Decreased padding as requested (2px)
    // CSS properties for sharper text rendering
    // @ts-ignore
    div.style.textRendering = 'geometricPrecision';
    // @ts-ignore
    div.style.webkitFontSmoothing = 'antialiased';

    // div.style.lineHeight = '1.2'; // Standard line height
    // div.style.textAlign = align; // Text align doesn't matter for auto width div
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'nowrap';
    const textNode = document.createTextNode(text);
    div.appendChild(textNode);
    // div.textContent = text;

    document.body.appendChild(div);

    // Render to canvas
    const canvas = await html2canvas(div, {
      backgroundColor: '#FFFFFF',
      scale: 4, // Higher scale for better definition
      logging: false,
      useCORS: true,
    });

    // Remove the temporary element
    document.body.removeChild(div);

    // Convert to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error rendering Japanese text:', error);
    return '';
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


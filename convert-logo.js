const fs = require('fs');
const path = require('path');

const imagePath = path.join(__dirname, 'public', 'vision-ai-logo.png');
const imageBuffer = fs.readFileSync(imagePath);
const base64 = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64}`;

console.log('// Vision AI Logo as Base64 Data URL');
console.log(`export const VISION_AI_LOGO_BASE64 = '${dataUrl}';`);

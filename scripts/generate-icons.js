// Simple script to generate placeholder PWA icons
// Run with: node scripts/generate-icons.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// Create a simple SVG icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#07c160"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
        fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">AI</text>
</svg>
`;

// For now, just create SVG files as placeholders
// In production, you should use proper PNG files or a tool like sharp to convert SVG to PNG

const sizes = [192, 512];

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
  const svgContent = createSVG(size);
  const filename = `pwa-${size}x${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svgContent);
  console.log(`Created ${filename}`);
});

console.log('\nNote: For production, replace these SVG files with proper PNG icons.');
console.log('You can use online tools like https://realfavicongenerator.net/');

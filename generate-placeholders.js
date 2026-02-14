const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Colors for variety (RGB values)
const colors = [
  { r: 59, g: 130, b: 246 },   // Blue
  { r: 16, g: 185, b: 129 },   // Green
  { r: 245, g: 158, b: 11 },   // Amber
  { r: 239, g: 68, b: 68 },    // Red
  { r: 139, g: 92, b: 246 },   // Purple
  { r: 6, g: 182, b: 212 },    // Cyan
  { r: 236, g: 72, b: 153 },   // Pink
  { r: 132, g: 204, b: 22 },   // Lime
  { r: 249, g: 115, b: 22 },   // Orange
  { r: 99, g: 102, b: 241 }    // Indigo
];

// Create images for each gallery
const galleries = [
  { name: 'fotogalerie/fotogalerie-1', count: 8 },
  { name: 'fotogalerie/fotogalerie-2', count: 10 },
  { name: 'fotogalerie/fotogalerie-3', count: 6 }
];

async function generateImages() {
  for (const gallery of galleries) {
    const origPath = path.join(gallery.name, 'orig');
    const thumbsPath = path.join(gallery.name, 'thumbs');
    
    // Ensure directories exist
    if (!fs.existsSync(origPath)) {
      fs.mkdirSync(origPath, { recursive: true });
    }
    if (!fs.existsSync(thumbsPath)) {
      fs.mkdirSync(thumbsPath, { recursive: true });
    }

    for (let i = 1; i <= gallery.count; i++) {
      const filename = `image-${String(i).padStart(2, '0')}.jpg`;
      const origFilepath = path.join(origPath, filename);
      const thumbFilepath = path.join(thumbsPath, filename);
      const color = colors[(i - 1) % colors.length];
      const text = `${gallery.name} ${i}`;
      
      // Create original image (larger)
      const origWidth = 1920;
      const origHeight = 1440;
      
      const origSvg = Buffer.from(`
        <svg width="${origWidth}" height="${origHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="rgb(${color.r},${color.g},${color.b})"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>
      `);
      
      // Create original image
      await sharp(origSvg)
        .resize(origWidth, origHeight)
        .toFormat('jpeg', { quality: 90 })
        .toFile(origFilepath);
      
      // Create thumbnail (smaller, square)
      const thumbSize = 400;
      const thumbSvg = Buffer.from(`
        <svg width="${thumbSize}" height="${thumbSize}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="rgb(${color.r},${color.g},${color.b})"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>
      `);
      
      await sharp(thumbSvg)
        .resize(thumbSize, thumbSize)
        .toFormat('jpeg', { quality: 85 })
        .toFile(thumbFilepath);
      
      console.log(`Created: ${origFilepath} and ${thumbFilepath}`);
    }
  }
  
  console.log('All placeholder images created!');
}

generateImages().catch(console.error);


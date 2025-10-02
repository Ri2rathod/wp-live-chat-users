import { readFile, writeFile } from 'fs/promises';
import { createCanvas, loadImage } from 'canvas';

async function createFavicons() {
  // Read the SVG
  const svgBuffer = await readFile('./public/favicon.svg');
  
  // Create 180x180 PNG for Apple Touch Icon
  const canvas = createCanvas(180, 180);
  const ctx = canvas.getContext('2d');
  
  // Draw gradient background with rounded corners
  const gradient = ctx.createLinearGradient(0, 0, 180, 180);
  gradient.addColorStop(0, '#5F7FFF');
  gradient.addColorStop(1, '#4A63CC');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, 180, 180, 39);
  ctx.fill();
  
  // Draw white chat bubble with slight transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(45, 56);
  ctx.quadraticCurveTo(45, 45, 56, 45);
  ctx.lineTo(124, 45);
  ctx.quadraticCurveTo(135, 45, 135, 56);
  ctx.lineTo(135, 90);
  ctx.quadraticCurveTo(135, 101, 124, 101);
  ctx.lineTo(79, 101);
  ctx.lineTo(56, 118);
  ctx.lineTo(56, 101);
  ctx.quadraticCurveTo(45, 101, 45, 90);
  ctx.closePath();
  ctx.fill();
  
  // Draw chat dots inside bubble
  ctx.fillStyle = '#5F7FFF';
  ctx.beginPath();
  ctx.arc(73, 73, 5.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(90, 73, 5.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(107, 73, 5.6, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw "WPLCU" text at bottom
  ctx.fillStyle = 'white';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '1px';
  ctx.fillText('WPLCU', 90, 143);
  
  // Save PNG
  const pngBuffer = canvas.toBuffer('image/png');
  await writeFile('./public/apple-touch-icon.png', pngBuffer);
  
  // Create 32x32 PNG for favicon
  const canvas32 = createCanvas(32, 32);
  const ctx32 = canvas32.getContext('2d');
  
  // Draw gradient background with rounded corners (scaled)
  const gradient32 = ctx32.createLinearGradient(0, 0, 32, 32);
  gradient32.addColorStop(0, '#5F7FFF');
  gradient32.addColorStop(1, '#4A63CC');
  ctx32.fillStyle = gradient32;
  ctx32.beginPath();
  ctx32.roundRect(0, 0, 32, 32, 7);
  ctx32.fill();
  
  // Draw white chat bubble with slight transparency (scaled)
  ctx32.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx32.beginPath();
  ctx32.moveTo(8, 10);
  ctx32.quadraticCurveTo(8, 8, 10, 8);
  ctx32.lineTo(22, 8);
  ctx32.quadraticCurveTo(24, 8, 24, 10);
  ctx32.lineTo(24, 16);
  ctx32.quadraticCurveTo(24, 18, 22, 18);
  ctx32.lineTo(14, 18);
  ctx32.lineTo(10, 21);
  ctx32.lineTo(10, 18);
  ctx32.quadraticCurveTo(8, 18, 8, 16);
  ctx32.closePath();
  ctx32.fill();
  
  // Draw chat dots inside bubble (scaled)
  ctx32.fillStyle = '#5F7FFF';
  ctx32.beginPath();
  ctx32.arc(13, 13, 1, 0, Math.PI * 2);
  ctx32.fill();
  ctx32.beginPath();
  ctx32.arc(16, 13, 1, 0, Math.PI * 2);
  ctx32.fill();
  ctx32.beginPath();
  ctx32.arc(19, 13, 1, 0, Math.PI * 2);
  ctx32.fill();
  
  // Draw "WPLCU" text at bottom (scaled)
  ctx32.fillStyle = 'white';
  ctx32.font = 'bold 5px Arial';
  ctx32.textAlign = 'center';
  ctx32.textBaseline = 'middle';
  ctx32.letterSpacing = '0.3px';
  ctx32.fillText('WPLCU', 16, 25);
  
  const favicon32Buffer = canvas32.toBuffer('image/png');
  await writeFile('./public/favicon-32x32.png', favicon32Buffer);
  
  console.log('✅ Favicon files created successfully!');
  console.log('- apple-touch-icon.png (180x180)');
  console.log('- favicon-32x32.png (32x32)');
}

createFavicons().catch(console.error);

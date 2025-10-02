import { readFile, writeFile } from 'fs/promises';
import { createCanvas, loadImage } from 'canvas';

async function createFavicons() {
  // Read the SVG
  const svgBuffer = await readFile('./public/favicon.svg');
  
  // Create 180x180 PNG for Apple Touch Icon
  const canvas = createCanvas(180, 180);
  const ctx = canvas.getContext('2d');
  
  // Draw blue background
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(0, 0, 180, 180, 36);
  ctx.fill();
  
  // Draw white chat bubble
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(54, 72);
  ctx.quadraticCurveTo(54, 54, 72, 54);
  ctx.lineTo(108, 54);
  ctx.quadraticCurveTo(126, 54, 126, 72);
  ctx.lineTo(126, 99);
  ctx.quadraticCurveTo(126, 117, 108, 117);
  ctx.lineTo(81, 117);
  ctx.lineTo(63, 135);
  ctx.lineTo(63, 117);
  ctx.quadraticCurveTo(54, 117, 54, 99);
  ctx.closePath();
  ctx.fill();
  
  // Draw eyes
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.arc(81, 84, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(99, 84, 5.4, 0, Math.PI * 2);
  ctx.fill();
  
  // Save PNG
  const pngBuffer = canvas.toBuffer('image/png');
  await writeFile('./public/apple-touch-icon.png', pngBuffer);
  
  // Create 32x32 PNG for favicon.ico (we'll save as PNG, browser will handle)
  const canvas32 = createCanvas(32, 32);
  const ctx32 = canvas32.getContext('2d');
  
  // Scale down the same design
  ctx32.fillStyle = '#2563eb';
  ctx32.beginPath();
  ctx32.roundRect(0, 0, 32, 32, 6.4);
  ctx32.fill();
  
  ctx32.fillStyle = 'white';
  ctx32.beginPath();
  ctx32.moveTo(9.6, 12.8);
  ctx32.quadraticCurveTo(9.6, 9.6, 12.8, 9.6);
  ctx32.lineTo(19.2, 9.6);
  ctx32.quadraticCurveTo(22.4, 9.6, 22.4, 12.8);
  ctx32.lineTo(22.4, 17.6);
  ctx32.quadraticCurveTo(22.4, 20.8, 19.2, 20.8);
  ctx32.lineTo(14.4, 20.8);
  ctx32.lineTo(11.2, 24);
  ctx32.lineTo(11.2, 20.8);
  ctx32.quadraticCurveTo(9.6, 20.8, 9.6, 17.6);
  ctx32.closePath();
  ctx32.fill();
  
  ctx32.fillStyle = '#2563eb';
  ctx32.beginPath();
  ctx32.arc(14.4, 15.04, 0.96, 0, Math.PI * 2);
  ctx32.fill();
  ctx32.beginPath();
  ctx32.arc(17.6, 15.04, 0.96, 0, Math.PI * 2);
  ctx32.fill();
  
  const favicon32Buffer = canvas32.toBuffer('image/png');
  await writeFile('./public/favicon-32x32.png', favicon32Buffer);
  
  console.log('✅ Favicon files created successfully!');
  console.log('- apple-touch-icon.png (180x180)');
  console.log('- favicon-32x32.png (32x32)');
}

createFavicons().catch(console.error);

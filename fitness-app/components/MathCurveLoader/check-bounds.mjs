import { curves } from './curve-definitions.js';

console.log('=== 检查所有曲线是否在0-100范围内 ===\n');

let allInBounds = true;
for (const curve of curves) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i <= 500; i++) {
    const pt = curve.point(i / 500, 1.0, curve.config);
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }
  const inBounds = minX >= 0 && maxX <= 100 && minY >= 0 && maxY <= 100;
  const margin = Math.min(minX, minY, 100 - maxX, 100 - maxY);
  const name = curve.name.padEnd(22);
  const info = `x:[${minX.toFixed(1)},${maxX.toFixed(1)}] y:[${minY.toFixed(1)},${maxY.toFixed(1)}] margin=${margin.toFixed(1)}`;
  console.log(`${name} ${info} ${inBounds ? 'OK' : 'OUT!'}`);
  if (!inBounds) allInBounds = false;
}

console.log(`\n所有曲线都在0-100范围内: ${allInBounds}`);

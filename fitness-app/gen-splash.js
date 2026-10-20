const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const OUTPUT_DIR = path.join(__dirname, "unpackage", "res", "splash");

const W = 1080;
const H = 1920;

async function createSplash() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const svg = `
    <svg width="${W}" height="${H}">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#F0F9FF;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#E0F2FE;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0EA5E9;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0284C7;stop-opacity:1" />
        </linearGradient>
      </defs>

      <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

      <circle cx="${W / 2}" cy="${H * 0.36}" r="180" fill="url(#iconGrad)" opacity="0.12"/>
      <circle cx="${W / 2}" cy="${H * 0.36}" r="140" fill="url(#iconGrad)" opacity="0.9"/>

      <text x="${W / 2}" y="${H * 0.36 + 55}" font-size="130" fill="white" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="bold">U</text>

      <text x="${W / 2}" y="${H * 0.58}" font-size="60" fill="#0F172A" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif" font-weight="700" letter-spacing="6">健身小助手</text>

      <rect x="${W / 2 - 50}" y="${H * 0.625}" width="100" height="5" rx="2.5" fill="#0EA5E9"/>

      <text x="${W / 2}" y="${H * 0.68}" font-size="28" fill="#64748B" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif" letter-spacing="3">开启清爽的运动一天吧</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, "splash.png"));

  console.log(`✅ 启动图已生成: ${path.join(OUTPUT_DIR, "splash.png")}`);
}

createSplash().catch(console.error);

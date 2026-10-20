const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcImagePath = 'C:\\Users\\zzy\\Desktop\\肌群图标.png';
const outputDir = path.join(__dirname, 'static', 'icons');

const iconsInfo = [
    { name: 'chest', row: 0, col: 0, label: '胸部肌群' },
    { name: 'back', row: 0, col: 1, label: '背部肌群' },
    { name: 'legs', row: 0, col: 2, label: '下肢肌群' },
    { name: 'shoulders', row: 0, col: 3, label: '肩部肌群' },
    { name: 'arms', row: 1, col: 0, label: '手臂肌群' },
    { name: 'core', row: 1, col: 1, label: '核心训练' },
    { name: 'cardio2', row: 1, col: 2, label: '全身有氧' },
];

async function splitIcons() {
    try {
        const metadata = await sharp(srcImagePath).metadata();
        const imgWidth = metadata.width;
        const imgHeight = metadata.height;
        console.log(`Image size: ${imgWidth}x${imgHeight}`);

        const colsRow0 = 4;
        const colsRow1 = 3;
        const marginX = Math.floor(imgWidth * 0.02);
        const marginTop = Math.floor(imgHeight * 0.08);
        const marginBottom = Math.floor(imgHeight * 0.08);
        const gapY = Math.floor(imgHeight * 0.05);

        const availableHeight = imgHeight - marginTop - marginBottom - gapY;
        const rowHeight = Math.floor(availableHeight / 2);

        const iconSize = Math.min(
            Math.floor((imgWidth - marginX * 2) / colsRow0),
            rowHeight
        );

        const totalWidthRow0 = iconSize * colsRow0;
        const startX = Math.floor((imgWidth - totalWidthRow0) / 2);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        for (const icon of iconsInfo) {
            const { row, col, name, label } = icon;
            
            let x;
            if (row === 0) {
                x = startX + col * iconSize;
            } else {
                const totalWidthRow1 = iconSize * colsRow1;
                const startXRow1 = Math.floor((imgWidth - totalWidthRow1) / 2);
                x = startXRow1 + col * iconSize;
            }
            
            const y = marginTop + row * (rowHeight + gapY);

            await sharp(srcImagePath)
                .extract({ left: x, top: y, width: iconSize, height: iconSize })
                .toFile(path.join(outputDir, `${name}.png`));
            
            console.log(`Saved: ${name}.png (${label})`);
        }

        console.log(`\nDone! All ${iconsInfo.length} icons saved to: ${outputDir}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

splitIcons();

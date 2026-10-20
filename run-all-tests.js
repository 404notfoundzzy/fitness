const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'fitness-server/src/main/resources/static/math-curve-loader-preview.html');
const PORT = 8901;

const server = http.createServer((req, res) => {
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(PORT, async () => {
  console.log(`HTTP服务器已启动: http://localhost:${PORT}`);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 430, height: 932 });

    page.on('console', msg => console.log('[浏览器]', msg.text()));
    page.on('pageerror', err => console.error('[页面错误]', err.message));

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('页面加载完成');

    // ===== 测试1: runSyncTest =====
    console.log('\n===== 运行 runSyncTest() =====\n');
    await page.evaluate(() => runSyncTest());

    // 等待同步测试完成
    await page.waitForFunction(() => {
      const divs = document.querySelectorAll('div[style*="position:fixed"][style*="z-index:9999"]');
      return divs.length > 0;
    }, { timeout: 20000 }).catch(() => console.log('同步测试面板等待超时'));

    const syncResults = await page.evaluate(() => {
      const divs = document.querySelectorAll('div[style*="position:fixed"][style*="z-index:9999"]');
      if (divs.length > 0) return divs[0].innerText;
      return '未找到结果';
    });
    console.log('\n===== runSyncTest 结果 =====\n');
    console.log(syncResults);

    // 关闭结果面板
    await page.evaluate(() => {
      const btns = document.querySelectorAll('div[style*="position:fixed"] button');
      btns.forEach(b => b.click());
    });
    await new Promise(r => setTimeout(r, 500));

    // ===== 测试2: runLogicTests =====
    console.log('\n===== 运行 runLogicTests() =====\n');
    await page.evaluate(() => runLogicTests());

    await page.waitForFunction(() => {
      const divs = document.querySelectorAll('div[style*="position:fixed"][style*="z-index:9999"]');
      return divs.length > 0;
    }, { timeout: 35000 }).catch(() => console.log('逻辑测试面板等待超时'));

    const logicResults = await page.evaluate(() => {
      const divs = document.querySelectorAll('div[style*="position:fixed"][style*="z-index:9999"]');
      if (divs.length > 0) return divs[0].innerText;
      return '未找到结果';
    });
    console.log('\n===== runLogicTests 结果 =====\n');
    console.log(logicResults);

    // 汇总
    const syncFail = (syncResults.match(/❌/g) || []).length;
    const logicFail = (logicResults.match(/❌/g) || []).length;
    const totalFail = syncFail + logicFail;
    console.log(`\n===== 总体结果 =====`);
    console.log(`runSyncTest 失败: ${syncFail}`);
    console.log(`runLogicTests 失败: ${logicFail}`);
    console.log(`总计失败: ${totalFail}`);
    process.exitCode = totalFail > 0 ? 1 : 0;

  } catch (err) {
    console.error('测试运行出错:', err.message);
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});

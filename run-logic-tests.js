const puppeteer = require('puppeteer-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const HTML_FILE = path.join(__dirname, 'fitness-server/src/main/resources/static/math-curve-loader-preview.html');
const PORT = 8899;

// 启动本地HTTP服务器
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

    // 捕获console输出
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log('[浏览器]', text);
    });

    // 捕获页面错误
    page.on('pageerror', err => {
      console.error('[页面错误]', err.message);
    });

    console.log('正在加载页面...');
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('页面加载完成');

    // 等待页面初始化
    await page.waitForFunction(() => typeof runLogicTests === 'function', { timeout: 10000 });
    console.log('runLogicTests函数已就绪');

    // 注入测试结果捕获器
    await page.evaluate(() => {
      window.__testResults = [];
      const origPush = Array.prototype.push;
      // 监听results数组的变化
    });

    // 运行测试
    console.log('\n===== 开始运行 runLogicTests() =====\n');
    await page.evaluate(() => runLogicTests());

    // 等待所有异步测试完成（最长等待25秒）
    console.log('\n等待异步测试完成...');
    await page.waitForFunction(() => {
      const resultDiv = document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');
      return resultDiv !== null;
    }, { timeout: 30000 });

    // 提取测试结果
    const testResults = await page.evaluate(() => {
      const resultDiv = document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');
      if (resultDiv) {
        return resultDiv.innerText;
      }
      return '未找到测试结果面板';
    });

    console.log('\n===== 测试结果 =====\n');
    console.log(testResults);

    // 检查是否有失败
    const hasFailure = testResults.includes('❌');
    process.exitCode = hasFailure ? 1 : 0;

  } catch (err) {
    console.error('测试运行出错:', err.message);
    process.exitCode = 2;
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('\n服务器已关闭');
  }
});

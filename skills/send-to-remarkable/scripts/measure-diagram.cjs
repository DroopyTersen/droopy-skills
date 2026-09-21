#!/usr/bin/env node
const fs = require('fs');
const {createRequire} = require('module');
const cliRequire = createRequire(require.resolve('@mermaid-js/mermaid-cli'));
const puppeteer = cliRequire('puppeteer');
(async () => {
  const browser = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    const page = await browser.newPage();
    await page.setContent(fs.readFileSync(process.argv[2], 'utf8'));
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const sizes = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim()).map(t => parseFloat(getComputedStyle(t).fontSize)).sort((a,b) => a-b);
      if (!sizes.length || sizes.some(n => !Number.isFinite(n))) throw Error('Cannot measure diagram labels');
      return {width:svg.viewBox.baseVal.width,height:svg.viewBox.baseVal.height,labelFontPx:sizes[Math.floor(sizes.length/2)],smallestFontPx:sizes[0]};
    });
    if (!(result.width > 0 && result.height > 0)) throw Error('Invalid diagram dimensions');
    process.stdout.write(JSON.stringify(result));
  } finally {await browser.close();}
})().catch(error => {console.error(error.message);process.exitCode=1});

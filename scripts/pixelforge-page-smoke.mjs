import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const siteRoot = path.resolve('.');
let localServer;
let target = process.argv[2] || '';
if (!target) {
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
  localServer = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      const relative = pathname.replace(/^\/+/, '') || 'pixelforge-ai.html';
      const filePath = path.resolve(siteRoot, relative);
      if (filePath !== siteRoot && !filePath.startsWith(`${siteRoot}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }
      const body = await fs.readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    localServer.once('error', reject);
    localServer.listen(0, '127.0.0.1', resolve);
  });
  target = `http://127.0.0.1:${localServer.address().port}/pixelforge-ai.html`;
}
const targetOrigin = new URL(target).origin;
const outputDir = path.resolve('website-audit', '2026-08-08');
await fs.mkdir(outputDir, { recursive: true });

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
];
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    });
    const pageErrors = [];
    const localRequestFailures = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('requestfailed', (request) => {
      if (request.url().startsWith(`${targetOrigin}/`)) {
        localRequestFailures.push(`${request.url()}: ${request.failure()?.errorText || 'failed'}`);
      }
    });

    const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 45_000 });
    await page.waitForTimeout(300);
    const checks = await page.evaluate(() => {
      const download = document.querySelector('a[href*="releases/latest/download/PixelForge-AI.exe"]');
      const nvidiaDownload = document.querySelector('a[href*="PixelForge-AI-NVIDIA_1.0.21_windows_x64.zip"]');
      const release = document.querySelector('a[href*="releases/tag/v1.0.21"]');
      const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((node) => {
          try { return JSON.parse(node.textContent || '{}'); } catch { return null; }
        })
        .filter(Boolean);
      const software = schemas
        .map((item) => item.mainEntity || item)
        .find((item) => item['@type'] === 'SoftwareApplication');
      const heroGridRect = document.querySelector('.pixelforge-hero-grid')?.getBoundingClientRect();
      return {
        title: document.title,
        h1: document.querySelector('h1')?.textContent?.trim() || '',
        visibleVersion: document.querySelector('.pixelforge-shell-version')?.textContent?.trim() || '',
        hasTrialCopy: document.body.innerText.includes('8 server-backed trial credits'),
        hasPackCopy: document.body.innerText.includes('$5 / 12, $10 / 30, or $20 / 72'),
        hasTargetDrivenCopy: document.body.innerText.includes('Same resolution, 1080p, 1440p, 4K, or 8K'),
        hasSixEngineCopy: document.body.innerText.includes('Six Local AI Enhancement Engines'),
        hasNvidiaCopy: document.body.innerText.includes('hardware-gated NVIDIA RTX VSR Ultra'),
        hasSmooth60Copy: document.body.innerText.includes('RIFE Smooth 60 FPS'),
        hasPreviewCopy: document.body.innerText.includes('three real source-frame numbers'),
        hasChoiceClarity: document.body.innerText.includes('The best overall starting point')
          && document.body.innerText.includes('The fastest compatible SDR path'),
        downloadHref: download?.href || '',
        nvidiaDownloadHref: nvidiaDownload?.href || '',
        releaseHref: release?.href || '',
        schemaVersion: software?.softwareVersion || '',
        schemaModified: software?.dateModified || '',
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        heroContentWithinViewport: Boolean(
          heroGridRect
            && heroGridRect.left >= -1
            && heroGridRect.right <= window.innerWidth + 1
        ),
        rootDiagnostics: {
          viewportWidth: window.innerWidth,
          htmlClientWidth: document.documentElement.clientWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyRectWidth: Math.round(document.body.getBoundingClientRect().width),
          bodyBefore: {
            content: getComputedStyle(document.body, '::before').content,
            width: getComputedStyle(document.body, '::before').width,
            left: getComputedStyle(document.body, '::before').left,
            right: getComputedStyle(document.body, '::before').right,
            position: getComputedStyle(document.body, '::before').position,
          },
          bodyAfter: {
            content: getComputedStyle(document.body, '::after').content,
            width: getComputedStyle(document.body, '::after').width,
            left: getComputedStyle(document.body, '::after').left,
            right: getComputedStyle(document.body, '::after').right,
            position: getComputedStyle(document.body, '::after').position,
          },
        },
        overflowOffenders: [...document.querySelectorAll('body *')]
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id || '',
              className: typeof element.className === 'string' ? element.className : '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            };
          })
          .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
          .slice(0, 12),
        oversizedLayoutBoxes: [...document.querySelectorAll('body *')]
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            id: element.id || '',
            className: typeof element.className === 'string' ? element.className : '',
            offsetWidth: element.offsetWidth,
            scrollWidth: element.scrollWidth,
            cssWidth: getComputedStyle(element).width,
            transform: getComputedStyle(element).transform,
            position: getComputedStyle(element).position,
          }))
          .filter((item) => item.offsetWidth > window.innerWidth + 1 || item.scrollWidth > window.innerWidth + 1)
          .slice(0, 12),
      };
    });
    const screenshot = path.join(outputDir, `pixelforge-v1021-${viewport.name}-viewport.png`);
    const fullPageScreenshot = path.join(outputDir, `pixelforge-v1021-${viewport.name}-full.png`);
    await page.screenshot({ path: screenshot, fullPage: false });
    await page.screenshot({ path: fullPageScreenshot, fullPage: true });
    const passed = Boolean(
      response?.ok()
      && checks.h1 === 'PixelForge AI / PixForge'
      && checks.visibleVersion === 'v1.0.21'
      && checks.hasTrialCopy
      && checks.hasPackCopy
      && checks.hasTargetDrivenCopy
      && checks.hasSixEngineCopy
      && checks.hasNvidiaCopy
      && checks.hasSmooth60Copy
      && checks.hasPreviewCopy
      && checks.hasChoiceClarity
      && checks.downloadHref.endsWith('/releases/latest/download/PixelForge-AI.exe')
      && checks.nvidiaDownloadHref.endsWith('/releases/latest/download/PixelForge-AI-NVIDIA_1.0.21_windows_x64.zip')
      && checks.releaseHref.endsWith('/releases/tag/v1.0.21')
      && checks.schemaVersion === '1.0.21'
      && checks.schemaModified === '2026-08-09'
      && checks.horizontalOverflow <= 1
      && checks.heroContentWithinViewport
      && pageErrors.length === 0
      && localRequestFailures.length === 0
    );
    results.push({
      viewport: viewport.name,
      status: response?.status() || 0,
      passed,
      ...checks,
      pageErrors,
      localRequestFailures,
      screenshot,
      fullPageScreenshot,
    });
    await page.close();
  }
} finally {
  await browser.close();
  if (localServer) await new Promise((resolve) => localServer.close(resolve));
}

console.log(JSON.stringify({ target, passed: results.every((item) => item.passed), results }, null, 2));
if (!results.every((item) => item.passed)) process.exitCode = 1;

#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const catalog = require('../data/package-catalog.json');
const IMAGE_WARNING_BYTES = 500 * 1024;
const VIDEO_FAILURE_BYTES = 20 * 1024 * 1024;
const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.m4v', '.mov', '.mp4', '.webm']);
const errors = [];
const warnings = [];
const checkedMedia = new Map();

function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectHtmlFiles(fullPath));
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(path.relative(ROOT, fullPath).replaceAll(path.sep, '/'));
    }
  }
  return files;
}

const packageFiles = fs.readdirSync(ROOT)
  .filter((name) => /^package-[a-z0-9-]+\.html$/i.test(name))
  .sort();
const relatedCaseStudies = fs.readdirSync(ROOT)
  .filter((name) => /^case-study-.*\.html$/i.test(name))
  .sort();
const previewFiles = collectHtmlFiles(path.join(ROOT, 'demos', 'preview-launch')).sort();
const commercialFiles = ['pricing.html', ...packageFiles, ...relatedCaseStudies, ...previewFiles];

function displayBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function localMediaPath(htmlFile, reference) {
  if (!reference || /^(?:data:|blob:|#)/i.test(reference)) return null;
  if (/^https?:\/\//i.test(reference)) {
    try {
      const url = new URL(reference);
      if (!/^(?:www\.)?knightlogics\.com$/i.test(url.hostname)) {
        errors.push(`${htmlFile}: uncontrolled external commercial media "${reference}"`);
        return null;
      }
      reference = url.pathname;
    } catch {
      errors.push(`${htmlFile}: malformed media URL "${reference}"`);
      return null;
    }
  }
  if (/^\/\//.test(reference)) {
    errors.push(`${htmlFile}: uncontrolled protocol-relative commercial media "${reference}"`);
    return null;
  }

  const withoutQuery = reference.split(/[?#]/, 1)[0];
  let decoded;
  try {
    decoded = decodeURIComponent(withoutQuery);
  } catch {
    errors.push(`${htmlFile}: invalid URL encoding in media reference "${reference}"`);
    return null;
  }
  return decoded.startsWith('/')
    ? path.join(ROOT, decoded.slice(1))
    : path.resolve(ROOT, path.dirname(htmlFile), decoded);
}

function mediaReferences(html) {
  const references = [];
  for (const match of html.matchAll(/<(img|video|source)\b[^>]*>/gi)) {
    const tag = match[0];
    const tagName = match[1].toLowerCase();
    const source = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/i);
    const poster = tag.match(/\bposter\s*=\s*["']([^"']+)["']/i);
    if (source) references.push({ tagName, reference: source[1] });
    if (poster) references.push({ tagName: 'poster', reference: poster[1] });
  }
  return references;
}

function checkMedia(htmlFile, reference, tagName) {
  const absolutePath = localMediaPath(htmlFile, reference);
  if (!absolutePath) return;
  const extension = path.extname(absolutePath).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension) && !VIDEO_EXTENSIONS.has(extension)) return;
  if (!absolutePath.startsWith(`${ROOT}${path.sep}`) && absolutePath !== ROOT) {
    errors.push(`${htmlFile}: local media escapes the site root: "${reference}"`);
    return;
  }
  if (!fs.existsSync(absolutePath)) {
    errors.push(`${htmlFile}: missing local media "${reference}"`);
    return;
  }

  const key = path.relative(ROOT, absolutePath).replaceAll(path.sep, '/');
  const bytes = fs.statSync(absolutePath).size;
  checkedMedia.set(key, bytes);
  if (IMAGE_EXTENSIONS.has(extension) && bytes > IMAGE_WARNING_BYTES) {
    warnings.push(`${htmlFile}: image "${reference}" is ${displayBytes(bytes)} (> 500 KB)`);
  }
  if ((tagName === 'video' || tagName === 'source') && VIDEO_EXTENSIONS.has(extension) && bytes > VIDEO_FAILURE_BYTES) {
    errors.push(`${htmlFile}: inline video "${reference}" is ${displayBytes(bytes)} (> 20 MB)`);
  }
}

function checkPackageProof(htmlFile, html) {
  const hasPlannedProof = /\bdata-planned-proof(?:\s|=|>)/i.test(html);
  const hasExplicitProof = /\bdata-proof(?:\s|=|>)/i.test(html);
  const body = html.split(/<body\b[^>]*>/i)[1] || '';
  if (!hasPlannedProof && !hasExplicitProof && !/<(?:img|video)\b/i.test(body)) {
    errors.push(`${htmlFile}: package page needs proof media or a data-planned-proof container`);
  }
}

function checkPreviewMetadata(htmlFile, html) {
  const titles = html.match(/<title>[^<]+<\/title>/gi) || [];
  const descriptions = html.match(/<meta\s+name=["']description["']\s+content=["'][^"']+["']\s*\/?>/gi) || [];
  const robots = html.match(/<meta\s+name=["']robots["']\s+content=["']noindex,\s*follow["']\s*\/?>/gi) || [];
  if (titles.length !== 1) errors.push(`${htmlFile}: expected exactly one valid title`);
  if (descriptions.length !== 1) errors.push(`${htmlFile}: expected exactly one meta description`);
  if (robots.length !== 1) errors.push(`${htmlFile}: expected meta robots noindex,follow`);
  if (!/Preview Launch<\/strong> demonstration — fictional business, not a live client\./i.test(html)) {
    errors.push(`${htmlFile}: missing fictional demonstration disclosure`);
  }
}

for (const pkg of catalog.packages.filter((item) => item.public && item.indexable)) {
  const assets = Array.isArray(pkg.proofAssets) ? pkg.proofAssets : [];
  if (!assets.length) {
    errors.push(`${pkg.id}: indexable package needs proofAssets or a planned-proof placeholder`);
    continue;
  }
  for (const asset of assets) {
    if (asset.type === 'planned') {
      if (!/^Planned (?:proof image|video):/i.test(asset.label || '')) {
        errors.push(`${pkg.id}: planned proof needs a precise planned image/video label`);
      }
    } else if (asset.path && /\.(?:avif|gif|jpe?g|png|svg|webp|m4v|mov|mp4|webm)$/i.test(asset.path)) {
      checkMedia('data/package-catalog.json', asset.path, asset.type === 'video' ? 'video' : 'img');
    }
  }
}

for (const htmlFile of commercialFiles) {
  const absolutePath = path.join(ROOT, htmlFile);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`${htmlFile}: expected commercial HTML file is missing`);
    continue;
  }
  const html = fs.readFileSync(absolutePath, 'utf8');
  for (const item of mediaReferences(html)) checkMedia(htmlFile, item.reference, item.tagName);
  if (packageFiles.includes(htmlFile)) checkPackageProof(htmlFile, html);
  if (previewFiles.includes(htmlFile)) checkPreviewMetadata(htmlFile, html);
}

for (const warning of [...new Set(warnings)].sort()) console.warn(`WARN ${warning}`);
for (const error of [...new Set(errors)].sort()) console.error(`ERROR ${error}`);
console.log(
  `Commercial media audit: ${commercialFiles.length} HTML files, ${checkedMedia.size} local media files, `
  + `${new Set(warnings).size} warning(s), ${new Set(errors).size} error(s).`,
);
if (errors.length) process.exitCode = 1;


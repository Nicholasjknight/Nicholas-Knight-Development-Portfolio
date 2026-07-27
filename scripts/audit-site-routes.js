#!/usr/bin/env node
'use strict';

/**
 * Manifest-driven crawl and static-route audit.
 *
 * This script is intentionally read-only. Content owners fix the actionable
 * page exceptions it reports; the audit never rewrites HTML.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'route-manifest.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const VERCEL_PATH = path.join(ROOT, 'vercel.json');
const ROBOTS_PATH = path.join(ROOT, 'robots.txt');
const EXPECTED_CLASSES = [
  'public-indexable',
  'public-noindex utility',
  'fictional demo',
  'fragment',
  'legacy redirect',
  'internal/admin',
];
const FULL_DOCUMENT_CLASSES = new Set(
  EXPECTED_CLASSES.filter((name) => !['fragment', 'legacy redirect'].includes(name))
);
const NOINDEX_CLASSES = new Set([
  'public-noindex utility',
  'fictional demo',
  'fragment',
  'internal/admin',
]);
const SKIP_WALK_DIRS = new Set([
  '.git',
  '.venv',
  '.vercel',
  'node_modules',
  'test-results',
]);
const MEDIA_TAGS = new Set(['audio', 'embed', 'iframe', 'img', 'source', 'track', 'video']);
const ALLOWED_HEAD_TAGS = new Set([
  'base',
  'link',
  'meta',
  'noscript',
  'script',
  'style',
  'template',
  'title',
]);

const errors = [];
const errorKeys = new Set();
const orphanRoutes = [];

function addError(category, entry, message, action) {
  const item = {
    category,
    file: entry?.file || null,
    route: entry?.route || null,
    message,
    action,
  };
  const key = JSON.stringify(item);
  if (!errorKeys.has(key)) {
    errorKeys.add(key);
    errors.push(item);
  }
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    addError('configuration', null, `${label} is missing or invalid JSON: ${error.message}`, `Repair ${label}.`);
    return {};
  }
}

function slash(value) {
  return value.replaceAll('\\', '/');
}

function cleanRoute(route) {
  if (!route) return '/';
  const value = route.startsWith('/') ? route : `/${route}`;
  return value.length > 1 && value.endsWith('/') ? value.slice(0, -1) : value;
}

function canonicalUrl(origin, route) {
  return route === '/' ? `${origin}/` : `${origin}${route}`;
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function normalizedText(value) {
  return decodeHtml(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseAttributes(source) {
  const attributes = {};
  const expression = /([^\s"'=<>`]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  for (const match of source.matchAll(expression)) {
    attributes[match[1].toLowerCase()] = decodeHtml(match[2] ?? match[3] ?? match[4] ?? '');
  }
  return attributes;
}

function tags(html, name) {
  const expression = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
  return [...html.matchAll(expression)].map((match) => ({
    source: match[0],
    attributes: parseAttributes(match[1]),
  }));
}

function metaValues(head, name) {
  return tags(head, 'meta')
    .filter((tag) => (tag.attributes.name || '').toLowerCase() === name)
    .map((tag) => tag.attributes.content || '');
}

function canonicalValues(head) {
  return tags(head, 'link')
    .filter((tag) => (tag.attributes.rel || '').toLowerCase().split(/\s+/).includes('canonical'))
    .map((tag) => tag.attributes.href || '');
}

function countMatches(source, expression) {
  return [...source.matchAll(expression)].length;
}

function walkHtml(directory, output = []) {
  for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
    if (item.isDirectory() && SKIP_WALK_DIRS.has(item.name)) continue;
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) {
      walkHtml(absolute, output);
    } else if (item.isFile() && item.name.toLowerCase().endsWith('.html')) {
      output.push(slash(path.relative(ROOT, absolute)));
    }
  }
  return output;
}

function pathExistsExact(relativePath) {
  const parts = slash(relativePath).split('/').filter(Boolean);
  let current = ROOT;
  for (const part of parts) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return false;
    const actual = fs.readdirSync(current).find((name) => name === part);
    if (!actual) return false;
    current = path.join(current, actual);
  }
  return fs.existsSync(current);
}

function fileRoute(file) {
  return `/${slash(file)}`;
}

function derivedCleanRoute(file) {
  const physical = fileRoute(file);
  if (physical === '/index.html') return '/';
  if (physical.endsWith('/index.html')) return physical.slice(0, -'index.html'.length);
  return physical.endsWith('.html') ? physical.slice(0, -'.html'.length) : physical;
}

function entryAliases(entry) {
  const aliases = new Set([entry.route, fileRoute(entry.file), ...(entry.aliases || [])]);
  if (entry.classification === 'legacy redirect') {
    for (const source of entry.sources || []) {
      if (!source.includes('(.*)') && !source.includes(':')) aliases.add(source);
    }
    return aliases;
  }
  aliases.add(derivedCleanRoute(entry.file));
  if (entry.file.endsWith('/index.html')) {
    aliases.add(derivedCleanRoute(entry.file).replace(/\/$/, ''));
  }
  return aliases;
}

function sourceRegex(source) {
  const wildcard = '__ROUTE_WILDCARD__';
  const parameter = '__ROUTE_PARAMETER__';
  let value = source
    .replaceAll('\\.', '.')
    .replaceAll('(.*)', wildcard)
    .replace(/:[A-Za-z][A-Za-z0-9_]*/g, parameter);
  value = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  value = value.replaceAll(wildcard, '.*').replaceAll(parameter, '[^/]+');
  return new RegExp(`^${value}$`);
}

function deploymentRuleMatches(source, route) {
  try {
    return sourceRegex(source).test(route);
  } catch {
    return false;
  }
}

function hasNoindexHeader(entry, headers) {
  const candidates = [...entryAliases(entry)];
  return headers.some((rule) => {
    const xRobots = (rule.headers || []).some(
      (header) =>
        String(header.key || '').toLowerCase() === 'x-robots-tag' &&
        String(header.value || '').toLowerCase().split(/[\s,]+/).includes('noindex')
    );
    return xRobots && candidates.some((route) => deploymentRuleMatches(rule.source || '', route));
  });
}

function stripExecutableContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script\s*>/gi, '$1</script>')
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style\s*>/gi, '$1</style>');
}

function headAudit(entry, html, origin, headers) {
  if (!FULL_DOCUMENT_CLASSES.has(entry.classification)) return null;

  const documentShell = stripExecutableContent(html);
  const headOpen = countMatches(documentShell, /<head(?:\s[^>]*)?>/gi);
  const headClose = countMatches(documentShell, /<\/head\s*>/gi);
  const bodyOpen = countMatches(documentShell, /<body(?:\s[^>]*)?>/gi);
  const bodyClose = countMatches(documentShell, /<\/body\s*>/gi);
  const htmlOpen = countMatches(documentShell, /<html(?:\s[^>]*)?>/gi);
  const htmlClose = countMatches(documentShell, /<\/html\s*>/gi);
  const doctype = countMatches(documentShell, /<!doctype\s+html\b[^>]*>/gi);
  const headMatch = documentShell.match(/<head(?:\s[^>]*)?>([\s\S]*?)<\/head\s*>/i);

  for (const [label, count] of [
    ['<!doctype html>', doctype],
    ['<html>', htmlOpen],
    ['</html>', htmlClose],
    ['<head>', headOpen],
    ['</head>', headClose],
    ['<body>', bodyOpen],
    ['</body>', bodyClose],
  ]) {
    if (count !== 1) {
      addError('head', entry, `expected one ${label}, found ${count}`, 'Repair the document shell and head markup.');
    }
  }
  if (!headMatch) return null;

  const head = headMatch[1];
  const titleOpen = countMatches(head, /<title(?:\s[^>]*)?>/gi);
  const titleClose = countMatches(head, /<\/title\s*>/gi);
  const titleMatches = [...head.matchAll(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title\s*>/gi)];
  if (titleOpen !== 1 || titleClose !== 1 || titleMatches.length !== 1 || !normalizedText(titleMatches[0]?.[1])) {
    addError(
      'head',
      entry,
      `expected one non-empty title, found ${titleMatches.length}`,
      'Add one valid <title>...</title> inside <head>.'
    );
  }

  if (tags(head, 'meta').filter((tag) => Object.hasOwn(tag.attributes, 'charset')).length !== 1) {
    addError('head', entry, 'expected one charset meta tag', 'Add one <meta charset="UTF-8"> inside <head>.');
  }
  if (metaValues(head, 'viewport').length !== 1) {
    addError('head', entry, 'expected one viewport meta tag', 'Add one viewport meta tag inside <head>.');
  }

  const safeHead = stripExecutableContent(head);
  const unexpected = new Set();
  for (const match of safeHead.matchAll(/<([A-Za-z][A-Za-z0-9:-]*)\b[^>]*>/g)) {
    const name = match[1].toLowerCase();
    if (!ALLOWED_HEAD_TAGS.has(name) && !name.includes('-')) unexpected.add(name);
  }
  for (const name of unexpected) {
    addError(
      'head',
      entry,
      `unexpected <${name}> element in <head>`,
      'Replace malformed generated tags with standard title and meta elements.'
    );
  }

  const descriptions = metaValues(head, 'description').map(normalizedText);
  const canonicals = canonicalValues(head).map((value) => value.trim());
  const robotsValues = metaValues(head, 'robots').map((value) => value.toLowerCase());
  const robotsTokens = new Set(robotsValues.flatMap((value) => value.split(/[\s,]+/).filter(Boolean)));
  if (robotsValues.length > 1) {
    addError('head', entry, `expected at most one robots meta tag, found ${robotsValues.length}`, 'Keep one robots policy.');
  }

  if (entry.classification === 'public-indexable') {
    if (descriptions.length !== 1 || !descriptions[0]) {
      addError(
        'head',
        entry,
        `expected one non-empty meta description, found ${descriptions.filter(Boolean).length}`,
        'Add one unique meta description.'
      );
    }
    if (canonicals.length !== 1) {
      addError(
        'canonical',
        entry,
        `expected one canonical, found ${canonicals.length}`,
        `Set the canonical to ${canonicalUrl(origin, entry.route)}.`
      );
    } else if (canonicals[0] !== canonicalUrl(origin, entry.route)) {
      addError(
        'canonical',
        entry,
        `canonical is ${canonicals[0]}, expected ${canonicalUrl(origin, entry.route)}`,
        'Use the manifest preferred route as the self-canonical.'
      );
    }
    if (robotsTokens.has('noindex') || robotsTokens.has('nofollow') || robotsTokens.has('none')) {
      addError('robots', entry, 'public route is not effectively index/follow', 'Remove noindex/nofollow from the page.');
    }
  } else if (NOINDEX_CLASSES.has(entry.classification)) {
    if (!robotsTokens.has('noindex') && !hasNoindexHeader(entry, headers)) {
      addError(
        'robots',
        entry,
        'route has no effective noindex policy',
        'Add a noindex meta tag or an X-Robots-Tag deployment header.'
      );
    }
  }

  return {
    title: normalizedText(titleMatches[0]?.[1]),
    description: descriptions[0] || '',
    canonical: canonicals[0] || '',
  };
}

function sitemapLocations(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeHtml(match[1].trim()));
}

function resolveReferencePath(baseFile, reference, origin) {
  let value = decodeHtml(reference).trim();
  if (
    !value ||
    value.startsWith('#') ||
    /^(?:mailto|tel|data|javascript|blob|about):/i.test(value) ||
    /{{|}}|<%|%>/.test(value)
  ) {
    return null;
  }

  if (value.startsWith('//')) value = `https:${value}`;
  if (/^https?:/i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.origin !== origin) return null;
      value = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return { malformed: true, value };
    }
  } else if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)) {
    return null;
  }

  value = value.split('#', 1)[0].split('?', 1)[0];
  if (!value) return null;
  try {
    value = decodeURIComponent(value);
  } catch {
    return { malformed: true, value };
  }
  if (value.startsWith('#')) return null;

  let route;
  if (value.startsWith('/')) {
    route = path.posix.normalize(value);
  } else {
    route = path.posix.normalize(`/${path.posix.dirname(slash(baseFile))}/${value}`);
  }
  if (value.endsWith('/') && !route.endsWith('/')) route += '/';
  return { route, value };
}

function localFileCandidates(route) {
  const relative = route.replace(/^\/+/, '');
  if (!relative) return ['index.html'];
  if (route.endsWith('/')) return [`${relative}index.html`];
  const extension = path.posix.extname(relative);
  if (extension) return [relative];
  return [relative, `${relative}.html`, `${relative}/index.html`];
}

function matchesDeploymentRoute(route, vercel) {
  return [...(vercel.redirects || []), ...(vercel.rewrites || [])].some((rule) =>
    deploymentRuleMatches(rule.source || '', route)
  );
}

function resolveTargetEntry(baseFile, reference, origin, aliasMap, redirectTargets) {
  const resolved = resolveReferencePath(baseFile, reference, origin);
  if (!resolved || resolved.malformed) return null;
  const variants = new Set([resolved.route, cleanRoute(resolved.route)]);
  if (resolved.route.endsWith('/')) variants.add(resolved.route.slice(0, -1));
  for (const route of variants) {
    const entry = aliasMap.get(route);
    if (!entry) continue;
    if (entry.classification === 'legacy redirect') {
      return redirectTargets.get(entry.redirectTo) || null;
    }
    return entry;
  }
  return null;
}

function collectTagReferences(html) {
  const source = stripExecutableContent(html);
  const references = [];
  const inlineCss = [];
  for (const match of source.matchAll(/<([A-Za-z][A-Za-z0-9:-]*)\b([^>]*)>/g)) {
    const tag = match[1].toLowerCase();
    const attributes = parseAttributes(match[2]);
    if (attributes.style) inlineCss.push(attributes.style);
    for (const attribute of ['href', 'src', 'poster']) {
      if (attributes[attribute]) {
        references.push({
          reference: attributes[attribute],
          kind: MEDIA_TAGS.has(tag) || attribute === 'poster' ? 'media' : 'link',
          tag,
          attribute,
        });
      }
    }
    if (attributes.srcset) {
      for (const candidate of attributes.srcset.split(',')) {
        const reference = candidate.trim().split(/\s+/)[0];
        if (reference) references.push({ reference, kind: 'media', tag, attribute: 'srcset' });
      }
    }
  }
  const styleBlocks = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)].map(
    (match) => match[1]
  );
  for (const css of [...styleBlocks, ...inlineCss]) {
    for (const match of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
      references.push({ reference: match[2], kind: 'media', tag: 'style', attribute: 'url' });
    }
  }
  return references;
}

function checkLocalReference(entry, baseFile, item, origin, aliasMap, vercel) {
  const resolved = resolveReferencePath(baseFile, item.reference, origin);
  if (!resolved) return;
  if (resolved.malformed) {
    addError(
      item.kind,
      entry,
      `malformed local reference ${item.reference}`,
      `Repair the ${item.attribute} value in ${baseFile}.`
    );
    return;
  }
  if (aliasMap.has(resolved.route) || aliasMap.has(cleanRoute(resolved.route))) return;
  if (matchesDeploymentRoute(resolved.route, vercel)) return;
  if (localFileCandidates(resolved.route).some(pathExistsExact)) return;
  addError(
    item.kind,
    entry,
    `${baseFile}: missing local ${item.kind} ${item.reference}`,
    `Fix or remove the broken ${item.attribute} reference.`
  );
}

function contextualLinks(entry, html, origin, aliasMap, redirectTargets) {
  const body = html.match(/<body(?:\s[^>]*)?>([\s\S]*?)<\/body\s*>/i)?.[1] || '';
  const context = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|header|nav|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const targets = new Set();
  for (const match of context.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const attributes = parseAttributes(match[1]);
    if (!attributes.href || (attributes.rel || '').toLowerCase().split(/\s+/).includes('nofollow')) continue;
    const label =
      normalizedText(match[2]) ||
      normalizedText(attributes['aria-label']) ||
      normalizedText(match[2].match(/<img\b[^>]*\balt=["']([^"']+)["']/i)?.[1]);
    if (!label) continue;
    const target = resolveTargetEntry(entry.file, attributes.href, origin, aliasMap, redirectTargets);
    if (
      target &&
      target.classification === 'public-indexable' &&
      target.route !== entry.route
    ) {
      targets.add(target.route);
    }
  }
  return targets;
}

function duplicateAudit(records, key, label) {
  const groups = new Map();
  for (const record of records) {
    const value = normalizedText(record.head?.[key]).toLowerCase();
    if (!value) continue;
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(record.entry);
  }
  for (const entries of groups.values()) {
    if (entries.length < 2) continue;
    const routes = entries.map((entry) => entry.route).join(', ');
    for (const entry of entries) {
      addError(
        'duplicate',
        entry,
        `duplicate ${label} shared by ${routes}`,
        `Give ${entry.route} a unique ${label}.`
      );
    }
  }
}

function robotsDisallows(robots, route) {
  const clean = route.replace(/\.html$/, '');
  return robots
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter((line) => /^disallow:/i.test(line))
    .map((line) => line.slice(line.indexOf(':') + 1).trim())
    .some((rule) => rule === route || rule === clean);
}

function main() {
  const manifest = readJson(MANIFEST_PATH, 'data/route-manifest.json');
  const vercel = readJson(VERCEL_PATH, 'vercel.json');
  const origin = String(manifest.origin || '').replace(/\/$/, '');
  const headers = Array.isArray(vercel.headers) ? vercel.headers : [];
  const entries = [];
  const manifestFiles = new Map();
  const manifestRoutes = new Map();

  if (manifest.schemaVersion !== 1) {
    addError('configuration', null, `unsupported route manifest schemaVersion ${manifest.schemaVersion}`, 'Use schemaVersion 1.');
  }
  if (!/^https:\/\/[^/]+$/i.test(origin)) {
    addError('configuration', null, `invalid HTTPS origin ${manifest.origin || '(missing)'}`, 'Set one HTTPS origin without a trailing slash.');
  }

  const routeGroups = manifest.routes || {};
  for (const classification of Object.keys(routeGroups)) {
    if (!EXPECTED_CLASSES.includes(classification)) {
      addError('manifest-drift', null, `unknown classification ${classification}`, 'Use one documented classification.');
    }
  }
  for (const classification of EXPECTED_CLASSES) {
    const group = routeGroups[classification];
    if (!Array.isArray(group)) {
      addError('manifest-drift', null, `missing routes["${classification}"] array`, 'Declare every classification group.');
      continue;
    }
    for (const rawEntry of group) {
      const entry = { ...rawEntry, classification };
      entries.push(entry);
      if (typeof entry.file !== 'string' || !entry.file.endsWith('.html') || entry.file.includes('\\')) {
        addError('manifest-drift', entry, 'file must be a forward-slash .html path', 'Correct the manifest file field.');
        continue;
      }
      if (typeof entry.route !== 'string' || !entry.route.startsWith('/')) {
        addError('manifest-drift', entry, 'route must begin with /', 'Correct the preferred route.');
      }
      if (manifestFiles.has(entry.file)) {
        addError(
          'manifest-drift',
          entry,
          `file is also classified as ${manifestFiles.get(entry.file).classification}`,
          'Keep exactly one manifest classification per HTML file.'
        );
      } else {
        manifestFiles.set(entry.file, entry);
      }
      if (manifestRoutes.has(entry.route)) {
        addError(
          'manifest-drift',
          entry,
          `preferred route is also used by ${manifestRoutes.get(entry.route).file}`,
          'Give each preferred route one owner.'
        );
      } else {
        manifestRoutes.set(entry.route, entry);
      }
      if (!pathExistsExact(entry.file)) {
        addError('manifest-drift', entry, 'manifest file does not exist with exact casing', 'Fix the path or restore the file.');
      }
      if (classification === 'public-indexable' && !entry.sitemap) {
        addError('sitemap', entry, 'public-indexable route did not opt into sitemap', 'Set sitemap to true or metadata.');
      }
      if (classification !== 'public-indexable' && entry.sitemap) {
        addError('sitemap', entry, 'non-indexable route opted into sitemap', 'Remove the sitemap setting.');
      }
      if (classification === 'public-indexable' && entry.route !== '/' && entry.route.endsWith('.html')) {
        addError('manifest-drift', entry, 'public preferred route exposes .html', 'Use the clean canonical route.');
      }
    }
  }

  const diskFiles = walkHtml(ROOT).sort();
  for (const file of diskFiles) {
    if (!manifestFiles.has(file)) {
      addError('manifest-drift', { file, route: fileRoute(file) }, 'HTML file is unclassified', 'Classify it in data/route-manifest.json.');
    }
  }
  for (const [file, entry] of manifestFiles) {
    if (!diskFiles.includes(file)) {
      addError('manifest-drift', entry, 'classified HTML file is absent from disk', 'Remove stale policy or restore the file.');
    }
  }

  const aliasMap = new Map();
  for (const entry of entries) {
    for (const alias of entryAliases(entry)) {
      const existing = aliasMap.get(alias);
      if (existing && existing !== entry && existing.classification !== 'legacy redirect') {
        addError(
          'manifest-drift',
          entry,
          `route alias ${alias} collides with ${existing.file}`,
          'Remove the duplicate preferred/physical route.'
        );
      } else {
        aliasMap.set(alias, entry);
      }
    }
  }
  const redirectTargets = new Map(
    entries
      .filter((entry) => entry.classification === 'public-indexable')
      .map((entry) => [entry.route, entry])
  );

  for (const entry of entries.filter((item) => item.classification === 'legacy redirect')) {
    if (!entry.redirectTo || !Array.isArray(entry.sources) || entry.sources.length === 0) {
      addError('redirect', entry, 'legacy redirect needs redirectTo and sources', 'Declare every platform redirect source.');
      continue;
    }
    if (!redirectTargets.has(entry.redirectTo)) {
      addError('redirect', entry, `redirect destination ${entry.redirectTo} is not public-indexable`, 'Use a preferred manifest route.');
    }
    for (const source of entry.sources) {
      const matches = (vercel.redirects || []).filter((rule) => rule.source === source);
      if (
        matches.length !== 1 ||
        matches[0].destination !== entry.redirectTo ||
        matches[0].permanent !== true
      ) {
        addError(
          'redirect',
          entry,
          `${source} is not one permanent redirect to ${entry.redirectTo}`,
          'Align vercel.json with the manifest redirect policy.'
        );
      }
    }
  }

  const sitemapXml = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, 'utf8') : '';
  const locations = sitemapLocations(sitemapXml);
  const locationSet = new Set(locations);
  if (locations.length !== locationSet.size) {
    addError('sitemap', null, 'sitemap.xml contains duplicate <loc> entries', 'Regenerate the sitemap.');
  }
  const expectedLocations = new Set(
    entries
      .filter((entry) => entry.classification === 'public-indexable')
      .map((entry) => canonicalUrl(origin, entry.route))
  );
  for (const location of expectedLocations) {
    if (!locationSet.has(location)) {
      addError('sitemap', redirectTargets.get(new URL(location).pathname), `missing sitemap entry ${location}`, 'Run node scripts/sync-sitemap.js.');
    }
  }
  for (const location of locationSet) {
    if (!expectedLocations.has(location)) {
      addError('sitemap', null, `non-public or unknown sitemap entry ${location}`, 'Remove it by regenerating from the manifest.');
    }
  }

  const records = [];
  const inbound = new Map(
    entries
      .filter((entry) => entry.classification === 'public-indexable')
      .map((entry) => [entry.route, new Set()])
  );

  for (const entry of entries) {
    if (!pathExistsExact(entry.file)) continue;
    const html = fs.readFileSync(path.join(ROOT, ...entry.file.split('/')), 'utf8');
    const head = headAudit(entry, html, origin, headers);
    records.push({ entry, html, head });

    if (entry.classification === 'fragment' && !hasNoindexHeader(entry, headers)) {
      addError(
        'robots',
        entry,
        'fragment route has no X-Robots-Tag noindex policy',
        'Add deployment-level noindex because fragments do not own a document head.'
      );
    }
    if (entry.classification !== 'legacy redirect') {
      const referenceBase = entry.classification === 'fragment' ? 'index.html' : entry.file;
      for (const item of collectTagReferences(html)) {
        checkLocalReference(entry, referenceBase, item, origin, aliasMap, vercel);
      }
    }
    if (entry.classification === 'public-indexable') {
      for (const target of contextualLinks(entry, html, origin, aliasMap, redirectTargets)) {
        inbound.get(target)?.add(entry.route);
      }
    }
  }

  const publicRecords = records.filter((record) => record.entry.classification === 'public-indexable');
  duplicateAudit(publicRecords, 'title', 'title');
  duplicateAudit(publicRecords, 'description', 'meta description');
  duplicateAudit(publicRecords, 'canonical', 'canonical');

  for (const [route, sources] of inbound) {
    if (route === '/' || sources.size > 0) continue;
    const entry = redirectTargets.get(route);
    orphanRoutes.push({ route, file: entry.file });
    addError(
      'orphan',
      entry,
      'public-indexable route has no contextual inbound link from another public page',
      'Content owner: add a relevant in-body link from an indexable page.'
    );
  }

  for (const entry of entries.filter((item) => NOINDEX_CLASSES.has(item.classification))) {
    const location = canonicalUrl(origin, entry.route);
    if (locationSet.has(location)) {
      addError('sitemap', entry, 'noindex route appears in sitemap.xml', 'Regenerate sitemap.xml from the manifest.');
    }
  }

  const requiredReachable = entries.filter((entry) => entry.requiredReachable);
  for (const entry of requiredReachable) {
    const physical = fileRoute(entry.file);
    const rewrite = (vercel.rewrites || []).find(
      (rule) => rule.source === entry.route && rule.destination.split('?', 1)[0] === physical
    );
    if (!rewrite && !(vercel.cleanUrls && derivedCleanRoute(entry.file) === entry.route)) {
      addError(
        'reachability',
        entry,
        `${entry.route} is not mapped to ${physical}`,
        'Add or restore the clean-route rewrite without making the page indexable.'
      );
    }
  }

  const robots = fs.existsSync(ROBOTS_PATH) ? fs.readFileSync(ROBOTS_PATH, 'utf8') : '';
  if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
    addError('robots', null, 'robots.txt does not advertise the canonical sitemap', 'Add the canonical Sitemap directive.');
  }
  for (const entry of entries.filter((item) => item.classification === 'internal/admin')) {
    if (!robotsDisallows(robots, entry.route) || !robotsDisallows(robots, fileRoute(entry.file))) {
      addError('robots', entry, 'internal/admin clean and physical routes are not both disallowed', 'Add both routes to robots.txt.');
    }
  }
  for (const entry of requiredReachable) {
    if (robotsDisallows(robots, entry.route) || robotsDisallows(robots, fileRoute(entry.file))) {
      addError('reachability', entry, 'required public utility is blocked by robots.txt', 'Allow crawling so noindex can be observed.');
    }
  }

  const counts = Object.fromEntries(
    EXPECTED_CLASSES.map((classification) => [
      classification,
      entries.filter((entry) => entry.classification === classification).length,
    ])
  );
  const report = {
    ok: errors.length === 0,
    counts,
    htmlFiles: diskFiles.length,
    sitemapUrls: locations.length,
    publicIndexableOrphans: orphanRoutes,
    errors,
  };

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    console.log(
      `Route inventory: ${diskFiles.length} HTML files; ` +
        EXPECTED_CLASSES.map((name) => `${name}=${counts[name]}`).join(', ')
    );
    console.log(`Sitemap inventory: ${locations.length} public-indexable URLs`);
    if (errors.length) {
      for (const error of errors) {
        const location = error.route || error.file || 'site policy';
        console.error(`ERROR [${error.category}] ${location}: ${error.message}`);
        console.error(`  ACTION: ${error.action}`);
      }
      if (orphanRoutes.length) {
        console.error('Content-owner links required:');
        for (const orphan of orphanRoutes) console.error(`  - ${orphan.route} (${orphan.file})`);
      }
      console.error(`Route audit failed with ${errors.length} actionable exception(s).`);
    } else {
      console.log('Route audit passed: heads, canonicals, robots, sitemap, links/media, duplicates, and drift.');
    }
  }
  return errors.length ? 1 : 0;
}

process.exitCode = main();

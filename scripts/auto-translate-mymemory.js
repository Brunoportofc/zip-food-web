/*
  Auto-translate missing locale keys using MyMemory API (no key required)
  Usage examples:
    node scripts/auto-translate-mymemory.js --from=pt --to=he
    node scripts/auto-translate-mymemory.js --from=pt --to=en
*/

const fs = require('fs');
const path = require('path');

// -------- Helpers --------
const ROOT = process.cwd();
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'i18n-mymemory-cache.json');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(CACHE_FILE)) fs.writeFileSync(CACHE_FILE, '{}', 'utf8');

const loadCache = () => JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
const saveCache = (cache) => fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function isUrl(text) {
  return /^(https?:\/\/|www\.|mailto:|tel:)/i.test(text);
}

function isNumericLike(text) {
  return /^[\d.,%]+$/.test(text.trim());
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function ensurePath(obj, pathStr) {
  const parts = pathStr.split('.');
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!obj[p] || typeof obj[p] !== 'object') obj[p] = {};
    obj = obj[p];
  }
  return { parent: obj, last: parts[parts.length - 1] };
}

function collectPlaceholders(text) {
  const tokens = new Set();
  // i18next style {{name}}
  (text.match(/\{{2}\s*[\w.-]+\s*\}{2}/g) || []).forEach(t => tokens.add(t));
  // {name}
  (text.match(/\{\s*[\w.-]+\s*\}/g) || []).forEach(t => tokens.add(t));
  // %s, %d, %1$s etc
  (text.match(/%\d*\$?[sdif]/g) || []).forEach(t => tokens.add(t));
  return Array.from(tokens);
}

function maskPlaceholders(text, phs) {
  let out = text;
  phs.forEach((ph, idx) => {
    const token = `__PH_${idx}__`;
    out = out.split(ph).join(token);
  });
  return out;
}

function unmaskPlaceholders(text, phs) {
  let out = text;
  phs.forEach((ph, idx) => {
    const token = `__PH_${idx}__`;
    out = out.split(token).join(ph);
  });
  return out;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function translateMyMemory(text, from, to, cache) {
  const key = `${from}|${to}|${text}`;
  if (cache[key]) return { translation: cache[key], cached: true };

  const phs = collectPlaceholders(text);
  const masked = maskPlaceholders(text, phs);

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(masked)}&langpair=${encodeURIComponent(from)}|${encodeURIComponent(to)}`;

  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        const data = await res.json();
        const status = data?.responseStatus;
        const translated = data?.responseData?.translatedText;
        if (status === 200 && typeof translated === 'string') {
          const final = unmaskPlaceholders(translated, phs);
          cache[key] = final;
          return { translation: final, cached: false };
        }
        lastErr = new Error(`API status ${status}`);
      }
    } catch (e) {
      lastErr = e;
    }
    await sleep(500 * attempt); // backoff simples
  }
  throw lastErr || new Error('Unknown translation error');
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
  const from = args.from || 'pt';
  const to = args.to || 'he';
  const schemaLang = args.schema; // opcional: usar outro locale como "esquema" de chaves

  const fromFile = path.join(LOCALES_DIR, `${from}.json`);
  const toFile = path.join(LOCALES_DIR, `${to}.json`);
  const schemaFile = schemaLang ? path.join(LOCALES_DIR, `${schemaLang}.json`) : null;

  if (!fs.existsSync(fromFile)) throw new Error(`Arquivo fonte não encontrado: ${fromFile}`);
  if (!fs.existsSync(toFile)) throw new Error(`Arquivo destino não encontrado: ${toFile}`);

  const src = readJson(fromFile);
  const dst = readJson(toFile);
  const schemaJson = schemaFile && fs.existsSync(schemaFile) ? readJson(schemaFile) : null;

  const flatSrc = flatten(src);
  const flatDst = flatten(dst);
  const flatSchema = schemaJson ? flatten(schemaJson) : null;

  // Conjunto de chaves a percorrer: união do arquivo fonte com o esquema (se houver)
  const allKeys = new Set([
    ...Object.keys(flatSrc || {}),
    ...(flatSchema ? Object.keys(flatSchema) : [])
  ]);

  let created = 0, translated = 0, skipped = 0, cacheHits = 0;
  const cache = loadCache();

  for (const pathKey of allKeys) {
    const hasFrom = Object.prototype.hasOwnProperty.call(flatSrc, pathKey);
    const hasSchema = flatSchema && Object.prototype.hasOwnProperty.call(flatSchema, pathKey);
    if (!hasFrom && !hasSchema) continue;

    // Determinar texto fonte e idioma de origem desta chave
    const srcVal = hasFrom ? flatSrc[pathKey] : flatSchema[pathKey];
    const srcLang = hasFrom ? from : (schemaLang || from);

    const { parent, last } = ensurePath(dst, pathKey);

    // Arrays de strings
    if (Array.isArray(srcVal)) {
      if (!Array.isArray(parent[last])) parent[last] = [];
      for (let i = 0; i < srcVal.length; i++) {
        if (typeof srcVal[i] !== 'string') continue;
        const current = parent[last][i];
        if (typeof current === 'string' && current.trim()) { skipped++; continue; }
        if (isUrl(srcVal[i]) || isNumericLike(srcVal[i])) {
          parent[last][i] = srcVal[i];
          created++;
          continue;
        }
        try {
          if (to === srcLang) {
            parent[last][i] = srcVal[i];
            created++;
          } else {
            const { translation, cached } = await translateMyMemory(srcVal[i], srcLang, to, cache);
            if (cached) cacheHits++;
            parent[last][i] = translation;
            created++; translated++;
          }
        } catch (e) {
          parent[last][i] = srcVal[i];
          created++; skipped++;
        }
      }
      continue;
    }

    if (srcVal && typeof srcVal === 'object') {
      if (!parent[last]) { parent[last] = {}; created++; }
      continue;
    }

    if (typeof srcVal !== 'string') continue;

    const currentVal = flatDst[pathKey];
    if (typeof currentVal === 'string' && currentVal.trim()) { skipped++; continue; }

    if (isUrl(srcVal) || isNumericLike(srcVal)) {
      parent[last] = srcVal; // copiar como está
      created++;
      continue;
    }

    try {
      if (to === srcLang) {
        parent[last] = srcVal; // copiar
        created++;
      } else {
        const { translation, cached } = await translateMyMemory(srcVal, srcLang, to, cache);
        if (cached) cacheHits++;
        parent[last] = translation;
        created++; translated++;
      }
    } catch (e) {
      parent[last] = srcVal; // fallback copy
      created++; skipped++;
    }
  }

  saveCache(cache);
  writeJson(toFile, dst);

  console.log(`✅ Tradução concluída (${from} -> ${to}${schemaLang ? ` | schema=${schemaLang}` : ''})`);
  console.log(`Chaves criadas/atualizadas: ${created}`);
  console.log(`Traduzidas: ${translated} | Usou cache: ${cacheHits} | Puladas: ${skipped}`);
  console.log(`Arquivo salvo: ${path.relative(ROOT, toFile)}`);
}

main().catch(err => {
  console.error('Erro ao traduzir:', err?.message || err);
  process.exitCode = 1;
});
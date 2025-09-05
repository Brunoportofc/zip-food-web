#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function loadJson(p) {
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function flatten(obj, prefix = '') {
  const out = {};
  const isObject = v => v && typeof v === 'object' && !Array.isArray(v);
  if (Array.isArray(obj)) {
    obj.forEach((val, idx) => {
      const key = prefix ? `${prefix}[${idx}]` : `[${idx}]`;
      if (isObject(val) || Array.isArray(val)) {
        Object.assign(out, flatten(val, key));
      } else {
        out[key] = true;
      }
    });
    return out;
  }
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (isObject(v) || Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = true;
    }
  }
  return out;
}

function diffKeys(baseObj, targetObj) {
  const base = flatten(baseObj);
  const target = flatten(targetObj);
  const missing = Object.keys(base).filter(k => !(k in target));
  const extra = Object.keys(target).filter(k => !(k in base));
  return { missing, extra };
}

function main() {
  const localesDir = path.join('src','i18n','locales');
  const base = process.argv[2] || 'pt';
  const target = process.argv[3] || 'he';
  const basePath = path.join(localesDir, `${base}.json`);
  const targetPath = path.join(localesDir, `${target}.json`);
  if (!fs.existsSync(basePath) || !fs.existsSync(targetPath)) {
    console.error('Arquivo não encontrado:', { basePath, targetPath });
    process.exit(1);
  }
  try {
    const baseJson = loadJson(basePath);
    const targetJson = loadJson(targetPath);
    const { missing, extra } = diffKeys(baseJson, targetJson);
    console.log(`Comparando ${target}.json contra ${base}.json`);
    console.log(`Faltando em ${target}: ${missing.length} chaves`);
    console.log(`Sobram em ${target}: ${extra.length} chaves`);
    const limit = 100;
    if (missing.length) {
      console.log('\n-- FALTANDO --');
      console.log(missing.slice(0, limit).join('\n'));
      if (missing.length > limit) console.log(`... (+${missing.length - limit} mais)`);
    }
    if (extra.length) {
      console.log('\n-- EXTRAS --');
      console.log(extra.slice(0, limit).join('\n'));
      if (extra.length > limit) console.log(`... (+${extra.length - limit} mais)`);
    }
  } catch (err) {
    console.error('Erro ao processar JSON:', err.message);
    process.exit(2);
  }
}

if (require.main === module) main();
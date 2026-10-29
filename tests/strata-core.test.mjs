import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const require = createRequire(import.meta.url);
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => mocks[name] ?? require(name) });
  return exports;
}
const kits = load('src/lib/strata-core-kits.ts');

test('album recommendations take precedence over artist choices, including editions', () => {
  const result = kits.getCoreKitRecommendation(' NIRVANA ', 'In Utero (Deluxe Edition)');
  assert.equal(result.match, 'album');
  assert.equal(result.presets[0].number, 5);
  assert.equal(result.presets[0].name, 'Deep Dark Birch');
  assert.equal(kits.getCoreKitRecommendation('Nirvana', 'Nevermind - Remastered').match, 'album');
  assert.equal(kits.getCoreKitRecommendation('Another artist', 'Nevermind').match, 'fallback');
});

test('artist matches use Core kit numbers and unknown artists are explicit fallbacks', () => {
  const tool = kits.getCoreKitRecommendation('Tool', 'Unknown album');
  assert.equal(tool.match, 'artist');
  assert.equal(tool.presets[0].number, 70);
  assert.equal(tool.presets[0].name, 'Rosetta Thule');
  const unknown = kits.getCoreKitRecommendation(null);
  assert.equal(unknown.match, 'fallback');
  assert.equal(unknown.presets[0].name, 'NY Maple Kit');
  assert.match(unknown.reason, /No artist or album match/);
});

test('recommendation card names the right module and explains unknown matches', () => {
  const { StrataCoreKitHint } = load('src/components/strata-core-kit.tsx', { '@/lib/strata-core-kits': kits });
  const html = renderToStaticMarkup(createElement(StrataCoreKitHint, { artistName: 'Tool' }));
  assert.match(html, /Alesis Strata Core/);
  assert.match(html, /Rosetta Thule/);
  assert.match(html, /#70/);
  assert.match(html, /not an official artist preset/);
  assert.equal(renderToStaticMarkup(createElement(StrataCoreKitHint, { artistName: 'Unknown' })), '');
  const fallback = renderToStaticMarkup(createElement(StrataCoreKitHint, { artistName: 'Unknown', showFallback: true }));
  assert.match(fallback, /No artist or album match yet/);
});

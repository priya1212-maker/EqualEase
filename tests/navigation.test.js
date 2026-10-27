import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the root stack has one Welcome route and one tab group', () => {
  const layout = source('../app/_layout.js');
  assert.match(layout, /<Stack\.Screen name="index"/);
  assert.match(layout, /<Stack\.Screen name="\(tabs\)"/);
  assert.equal(statSync(new URL('../app/(tabs)/_layout.js', import.meta.url)).isFile(), true);
});

test('the bottom navigation has Explore, Saved, and Report with accessible labels', () => {
  const layout = source('../app/(tabs)/_layout.js');
  assert.match(layout, /backBehavior="history"/);
  assert.match(layout, /useWindowDimensions/);
  assert.match(layout, /Math\.max\(68, 44 \+ Math\.ceil\(16 \* fontScale\)\)/);
  for (const [route, label] of [
    ['explore', 'Explore places'],
    ['saved', 'Saved Places'],
    ['report', 'Submit an accessibility report'],
  ]) {
    assert.match(layout, new RegExp(`name="${route}"`));
    assert.match(layout, new RegExp(`tabBarAccessibilityLabel: '${label}'`));
  }
});

test('place details are in the Explore stack so tab navigation remains available and back can pop', () => {
  const exploreLayout = source('../app/(tabs)/explore/_layout.js');
  const exploreScreen = source('../app/(tabs)/explore/index.js');
  const detailsRoute = '../app/(tabs)/explore/place/[id].js';
  assert.match(exploreLayout, /<Stack/);
  assert.equal(statSync(new URL(detailsRoute, import.meta.url)).isFile(), true);
  assert.match(exploreScreen, /pathname: '\/explore\/place\/\[id\]'/);
  assert.equal(statSync(new URL('../app/place/[id].js', import.meta.url), { throwIfNoEntry: false }), undefined);
});

test('Welcome enters the Explore tab and the tab routes keep their expected URL paths', () => {
  const welcome = source('../app/index.js');
  assert.match(welcome, /router\.push\('\/explore'\)/);
  assert.equal(statSync(fileURLToPath(new URL('../app/(tabs)/explore/index.js', import.meta.url))).isFile(), true);
  assert.equal(statSync(fileURLToPath(new URL('../app/(tabs)/saved.js', import.meta.url))).isFile(), true);
  assert.equal(statSync(fileURLToPath(new URL('../app/(tabs)/report.js', import.meta.url))).isFile(), true);
});

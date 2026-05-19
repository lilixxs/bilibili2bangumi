const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const packageVersion = readJson('package.json').version;
const manifestVersion = readJson('edge-extension/manifest.json').version;

if (manifestVersion !== packageVersion) {
  fail(`Version mismatch: package.json=${packageVersion}, edge-extension/manifest.json=${manifestVersion}`);
}

const userscript = readText('bilibili2bangumi.user.js');
const userscriptMatch = userscript.match(/\/\/ @version\s+([^\s]+)/);
if (!userscriptMatch) {
  fail('Missing userscript @version header');
} else if (userscriptMatch[1] !== packageVersion) {
  fail(`Version mismatch: package.json=${packageVersion}, bilibili2bangumi.user.js=${userscriptMatch[1]}`);
}

const popupHtml = readText('edge-extension/popup.html');
if (/版本\s+\d+\.\d+\.\d+/.test(popupHtml)) {
  fail('Popup HTML contains a hard-coded version; use chrome.runtime.getManifest().version instead');
}

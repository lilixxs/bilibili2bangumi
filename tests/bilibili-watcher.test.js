'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var vm = require('vm');

function FakeNode(options) {
  options = options || {};
  this.textContent = options.textContent || '';
  this.attrs = options.attrs || {};
  this.selectors = options.selectors || {};
  this.selectorAll = options.selectorAll || {};
}

FakeNode.prototype.getAttribute = function(name) {
  return this.attrs[name] || '';
};

FakeNode.prototype.querySelector = function(selector) {
  return this.selectors[selector] || null;
};

FakeNode.prototype.querySelectorAll = function(selector) {
  return this.selectorAll[selector] || [];
};

function loadBiliWatcher(fakeDocument) {
  var context = {
    BS: {
      Logger: { info: function() {} },
      UI: { createFloatingBall: function() {} }
    },
    document: fakeDocument,
    location: { href: 'https://www.bilibili.com/video/BV123' }
  };

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'src/core/bilibili-watcher.js'), 'utf8'),
    context
  );

  return context.BS.BiliWatcher;
}

function testExtractVideoInfoUsesOwnerUidInsteadOfFirstSpaceLink() {
  var title = new FakeNode({
    textContent: 'A UP 的番剧视频',
    attrs: { title: 'A UP 的番剧视频' }
  });
  var ownerName = new FakeNode({ textContent: 'A UP' });
  var ownerLink = new FakeNode({
    textContent: 'A UP',
    attrs: { href: 'https://space.bilibili.com/10001' }
  });
  var sidebarLink = new FakeNode({
    textContent: 'B UP',
    attrs: { href: 'https://space.bilibili.com/20002' }
  });
  var ownerRoot = new FakeNode({
    selectors: {
      '.up-name__text': ownerName,
      'a[href*="space.bilibili.com"]': ownerLink
    }
  });
  var fakeDocument = new FakeNode({
    title: 'fallback title',
    selectors: {
      'h1.video-title, h1[data-title], h1': title,
      '#v_upinfo': ownerRoot,
      '.up-name__text': ownerName
    },
    selectorAll: {
      'a[href*="space.bilibili.com"]': [sidebarLink, ownerLink]
    }
  });

  var info = loadBiliWatcher(fakeDocument).extractVideoInfo();

  assert.strictEqual(info.upName, 'A UP');
  assert.strictEqual(info.uid, '10001');
}

testExtractVideoInfoUsesOwnerUidInsteadOfFirstSpaceLink();

console.log('bilibili-watcher tests passed');

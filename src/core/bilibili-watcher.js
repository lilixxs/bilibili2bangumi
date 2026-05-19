// ===== BiliWatcher 模块 =====
BS.BiliWatcher = (function () {
  function extractTitle() {
    var title = '';
    var h1 = document.querySelector('h1.video-title, h1[data-title], h1');
    if (h1) {
      title = (h1.getAttribute('title') || h1.textContent || '').trim();
    }
    if (!title) {
      var og = document.querySelector('meta[property="og:title"]');
      title = og ? (og.getAttribute('content') || '').trim() : '';
    }
    if (!title) {
      title = (document.title || '').replace(/_哔哩哔哩_bilibili$/, '').trim();
    }
    return title;
  }

  function trimText(node) {
    return (node && node.textContent ? node.textContent : '').trim();
  }

  function extractUidFromHref(href) {
    var uidMatch = (href || '').match(/space\.bilibili\.com\/(\d+)/);
    return uidMatch ? uidMatch[1] : '';
  }

  function getOwnerRoot() {
    var selectors = [
      '#v_upinfo',
      '.up-info',
      '.up-info-container',
      '.up-panel-container',
      '.video-owner',
      '.owner',
      '.up-detail',
      '.up-detail-top'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var node = document.querySelector(selectors[i]);
      if (node) return node;
    }
    return null;
  }

  function findUpNameNode(scope) {
    var selectors = [
      '.up-name__text',
      '.up-name',
      '.username',
      '.up-detail-top .name',
      '.staff-name',
      'a[href*="space.bilibili.com"] span',
      '.video-owner-name',
      '.up-info .name',
      '[class*="up-name"]',
      '[class*="upName"]',
      '[class*="author"]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var node = scope.querySelector(selectors[i]);
      if (trimText(node)) return node;
    }
    return null;
  }

  function findOwnerLink(scope) {
    return scope ? scope.querySelector('a[href*="space.bilibili.com"]') : null;
  }

  function extractUpName() {
    var ownerRoot = getOwnerRoot();
    var node = ownerRoot ? findUpNameNode(ownerRoot) : null;
    if (!node) node = findUpNameNode(document);
    if (node) return trimText(node);
    return '';
  }

  function extractUid() {
    var ownerRoot = getOwnerRoot();
    var ownerLink = findOwnerLink(ownerRoot);
    var uid = ownerLink ? extractUidFromHref(ownerLink.getAttribute('href')) : '';
    if (uid) return uid;

    var ownerMidNode = ownerRoot && ownerRoot.querySelector('[data-mid]');
    if (ownerMidNode) {
      uid = ownerMidNode.getAttribute('data-mid') || '';
      if (uid) return uid;
    }

    var upName = extractUpName();
    var upLinks = document.querySelectorAll('a[href*="space.bilibili.com"]');
    for (var i = 0; i < upLinks.length; i++) {
      if (upName && trimText(upLinks[i]) === upName) {
        uid = extractUidFromHref(upLinks[i].getAttribute('href'));
        if (uid) return uid;
      }
    }

    return '';
  }

  function extractVideoInfo() {
    return {
      title: extractTitle(),
      upName: extractUpName(),
      uid: extractUid(),
      url: location.href
    };
  }

  function init() {
    BS.UI.createFloatingBall();
    if (typeof BS.VideoObserver !== 'undefined') {
      BS.VideoObserver.init();
    }
    BS.Logger.info('v__VERSION__ 已加载');
  }

  return {
    init: init,
    extractTitle: extractTitle,
    extractUpName: extractUpName,
    extractUid: extractUid,
    extractVideoInfo: extractVideoInfo
  };
})();

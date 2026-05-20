function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() { el.classList.remove('show'); }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
  var versionEl = document.getElementById('extension-version');
  if (versionEl && chrome.runtime && chrome.runtime.getManifest) {
    versionEl.textContent = chrome.runtime.getManifest().version;
  }

  var tokenInput = document.getElementById('access-token');
  var autoSyncSelect = document.getElementById('auto-sync-mode');
  var dedupCheckbox = document.getElementById('enable-dedup');
  var dedupHoursInput = document.getElementById('dedup-hours');
  var hideOnWideCheckbox = document.getElementById('hide-on-wide');

  function loadSettings() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].url.includes('bilibili.com')) {
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        world: 'MAIN',
        func: function() {
          var result = {};
          if (window.BS && window.BS.Config) {
            result.token = window.BS.Config.getAccessToken() || '';
            result.autoSyncMode = window.BS.Config.getAutoSyncMode() || 'off';
            result.enableDedup = window.BS.Config.getEnableDedup();
            result.dedupHours = window.BS.Config.getDedupHours();
            result.hideOnWide = window.BS.Config.getHideOnWide();
          }
          return result;
        }
      }, function(results) {
        if (results && results[0] && results[0].result) {
          var cfg = results[0].result;
          tokenInput.value = cfg.token || '';
          autoSyncSelect.value = cfg.autoSyncMode || 'off';
          dedupCheckbox.checked = cfg.enableDedup !== false;
          dedupHoursInput.value = cfg.dedupHours || 24;
          hideOnWideCheckbox.checked = cfg.hideOnWide || false;
        }
      });
    });
  }

  loadSettings();

  document.getElementById('save-settings').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs[0] || !tabs[0].url.includes('bilibili.com')) {
        showToast('请在B站页面使用');
        return;
      }

      var token = tokenInput.value.trim();
      var autoSyncMode = autoSyncSelect.value;
      var enableDedup = dedupCheckbox.checked;
      var dedupHours = parseInt(dedupHoursInput.value, 10) || 24;
      var hideOnWide = hideOnWideCheckbox.checked;

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        world: 'MAIN',
        func: function(cfg) {
          if (window.BS && window.BS.Config) {
            window.BS.Config.setAccessToken(cfg.token);
            window.BS.Config.setAutoSyncMode(cfg.autoSyncMode);
            window.BS.Config.setEnableDedup(cfg.enableDedup);
            window.BS.Config.setDedupHours(cfg.dedupHours);
            window.BS.Config.setHideOnWide(cfg.hideOnWide);
          }
        },
        args: [{
          token: token,
          autoSyncMode: autoSyncMode,
          enableDedup: enableDedup,
          dedupHours: dedupHours,
          hideOnWide: hideOnWide
        }]
      }, function() {
        showToast('设置已保存');
      });
    });
  });

  document.getElementById('open-settings').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].url.includes('bilibili.com')) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          world: 'MAIN',
          func: function() {
            if (window.BS && window.BS.UI) {
              window.BS.UI.showSettingsPanel();
            } else {
              alert('请在B站视频页面使用此功能');
            }
          }
        });
      } else {
        alert('请在B站视频页面使用此功能');
      }
    });
    window.close();
  });

  document.getElementById('open-github').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/Noneqin57/bilibili2bangumi' });
    window.close();
  });
});

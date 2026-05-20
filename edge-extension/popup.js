// Popup 脚本
document.addEventListener('DOMContentLoaded', function() {
  var versionEl = document.getElementById('extension-version');
  if (versionEl && chrome.runtime && chrome.runtime.getManifest) {
    versionEl.textContent = chrome.runtime.getManifest().version;
  }

  // 打开设置面板按钮
  document.getElementById('open-settings').addEventListener('click', function() {
    // 向当前标签页发送消息，打开设置面板
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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

  // 打开 GitHub 按钮
  document.getElementById('open-github').addEventListener('click', function() {
    chrome.tabs.create({ url: 'https://github.com/Noneqin57/bilibili2bangumi' });
    window.close();
  });
});

// ===== Config 模块 =====
BS.Config = (function () {
  var KEYS = {
    ACCESS_TOKEN: 'bgm_access_token',
    SYNC_HISTORY: 'bgm_sync_history',
    UP_WHITELIST: 'bgm_up_whitelist',
    HIDE_ON_WIDE: 'bgm_hide_on_wide',
    ENABLE_DEDUP: 'bgm_enable_dedup',
    AUTO_SYNC_MODE: 'bgm_auto_sync_mode',
    AUTO_SYNC_SUBJECT_MAP: 'bgm_auto_sync_subject_map',
    AUTO_SYNC_SIMILARITY_THRESHOLD: 'bgm_auto_sync_threshold',
    DEDUP_HOURS: 'bgm_dedup_hours',
    SUBJECT_NAMES: 'bgm_subject_names'
  };

  function get(key, fallback) {
    var val = BS.Platform.getValue(key, null);
    return val !== null ? val : fallback;
  }

  function set(key, value) {
    BS.Platform.setValue(key, value);
  }

  function getAccessToken() {
    return get(KEYS.ACCESS_TOKEN, '');
  }

  function setAccessToken(token) {
    set(KEYS.ACCESS_TOKEN, token || '');
  }

  function getSyncHistory() {
    return get(KEYS.SYNC_HISTORY, {});
  }

  function addSyncRecord(subjectId, ep, subjectName) {
    var history = getSyncHistory();
    history[subjectId + '_' + ep] = Date.now();
    set(KEYS.SYNC_HISTORY, history);
    if (subjectName) {
      var names = getSubjectNames();
      names[subjectId] = subjectName;
      set(KEYS.SUBJECT_NAMES, names);
    }
  }

  function getSubjectNames() {
    return get(KEYS.SUBJECT_NAMES, {});
  }

  function isRecentlySynced(subjectId, ep) {
    if (!getEnableDedup()) return false;

    var history = getSyncHistory();
    var key = subjectId + '_' + ep;
    var ts = history[key];
    if (!ts || typeof ts !== 'number') return false;
    var hours = getDedupHours();
    return (Date.now() - ts) < hours * 60 * 60 * 1000;
  }

  function getEnableDedup() {
    return get(KEYS.ENABLE_DEDUP, true);
  }

  function setEnableDedup(value) {
    set(KEYS.ENABLE_DEDUP, value);
  }

  function getDedupHours() {
    var val = get(KEYS.DEDUP_HOURS, 24);
    if (typeof val !== 'number' || val < 1) return 24;
    return val;
  }

  function setDedupHours(value) {
    var num = parseInt(value, 10);
    if (isNaN(num) || num < 1) num = 24;
    set(KEYS.DEDUP_HOURS, num);
  }

  function getUpWhitelist() {
    return get(KEYS.UP_WHITELIST, []);
  }

  function setUpWhitelist(whitelist) {
    set(KEYS.UP_WHITELIST, whitelist || []);
  }

  function addUp(upConfig) {
    var list = getUpWhitelist();
    for (var i = 0; i < list.length; i++) {
      if (list[i].upName === upConfig.upName) return false;
      if (upConfig.uid && list[i].uid && list[i].uid === upConfig.uid) return false;
    }
    list.push(upConfig);
    setUpWhitelist(list);
    return true;
  }

  function removeUp(identifier) {
    if (!identifier) return;
    var list = getUpWhitelist();
    var newList = list.filter(function(up) {
      return up.upName !== identifier && (!up.uid || up.uid !== identifier);
    });
    setUpWhitelist(newList);
  }

  function getUpConfig(identifier) {
    if (!identifier) return null;
    var list = getUpWhitelist();
    for (var i = 0; i < list.length; i++) {
      var up = list[i];
      if (up.enabled === false) continue;
      var mode = up.matchMode || 'both';
      var nameMatch = up.upName === identifier;
      var uidMatch = up.uid && up.uid === identifier;
      if (mode === 'name' && nameMatch) return up;
      if (mode === 'uid' && uidMatch) return up;
      if (mode === 'both' && (nameMatch || uidMatch)) return up;
    }
    return null;
  }

  function toggleUpEnabled(identifier) {
    if (!identifier) return;
    var list = getUpWhitelist();
    for (var i = 0; i < list.length; i++) {
      if (list[i].upName === identifier || (list[i].uid && list[i].uid === identifier)) {
        list[i].enabled = list[i].enabled === false ? true : false;
        setUpWhitelist(list);
        return;
      }
    }
  }

  function getHideOnWide() {
    return get(KEYS.HIDE_ON_WIDE, true);
  }

  function setHideOnWide(value) {
    set(KEYS.HIDE_ON_WIDE, value);
  }

  function getAutoSyncMode() {
    return get(KEYS.AUTO_SYNC_MODE, 'assist');
  }

  function setAutoSyncMode(value) {
    set(KEYS.AUTO_SYNC_MODE, value || 'assist');
  }

  function getAutoSyncSubjectMap() {
    return get(KEYS.AUTO_SYNC_SUBJECT_MAP, {});
  }

  function setAutoSyncSubjectMap(map) {
    set(KEYS.AUTO_SYNC_SUBJECT_MAP, map || {});
  }

  function getConfirmedSubjectId(upName, cleanTitle) {
    var map = getAutoSyncSubjectMap();
    var key = (upName || '') + '|' + (cleanTitle || '');
    return map[key] || null;
  }

  function confirmSubject(upName, cleanTitle, subjectId) {
    var map = getAutoSyncSubjectMap();
    var key = (upName || '') + '|' + (cleanTitle || '');
    map[key] = subjectId;
    setAutoSyncSubjectMap(map);
  }

  function getSimilarityThreshold() {
    return get(KEYS.AUTO_SYNC_SIMILARITY_THRESHOLD, 0.6);
  }

  function setSimilarityThreshold(value) {
    var num = parseFloat(value);
    if (isNaN(num) || num < 0.3 || num > 1.0) num = 0.6;
    set(KEYS.AUTO_SYNC_SIMILARITY_THRESHOLD, num);
  }

  function exportData() {
    var data = {
      version: '1.0',
      exportTime: new Date().toISOString(),
      whitelist: getUpWhitelist(),
      configs: {
        autoSyncMode: getAutoSyncMode(),
        enableDedup: getEnableDedup(),
        dedupHours: getDedupHours(),
        hideOnWide: getHideOnWide(),
        similarityThreshold: getSimilarityThreshold()
      }
    };
    return JSON.stringify(data, null, 2);
  }

  function importData(jsonStr) {
    try {
      var data = JSON.parse(jsonStr);
      if (data.whitelist && Array.isArray(data.whitelist)) {
        setUpWhitelist(data.whitelist);
      }
      if (data.configs) {
        if (data.configs.autoSyncMode) setAutoSyncMode(data.configs.autoSyncMode);
        if (typeof data.configs.enableDedup === 'boolean') setEnableDedup(data.configs.enableDedup);
        if (data.configs.dedupHours) setDedupHours(data.configs.dedupHours);
        if (typeof data.configs.hideOnWide === 'boolean') setHideOnWide(data.configs.hideOnWide);
        if (data.configs.similarityThreshold) setSimilarityThreshold(data.configs.similarityThreshold);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  return {
    getAccessToken: getAccessToken,
    setAccessToken: setAccessToken,
    getSyncHistory: getSyncHistory,
    addSyncRecord: addSyncRecord,
    isRecentlySynced: isRecentlySynced,
    getSubjectNames: getSubjectNames,
    getEnableDedup: getEnableDedup,
    setEnableDedup: setEnableDedup,
    getDedupHours: getDedupHours,
    setDedupHours: setDedupHours,
    getUpWhitelist: getUpWhitelist,
    setUpWhitelist: setUpWhitelist,
    addUp: addUp,
    removeUp: removeUp,
    getUpConfig: getUpConfig,
    toggleUpEnabled: toggleUpEnabled,
    getHideOnWide: getHideOnWide,
    setHideOnWide: setHideOnWide,
    getAutoSyncMode: getAutoSyncMode,
    setAutoSyncMode: setAutoSyncMode,
    getAutoSyncSubjectMap: getAutoSyncSubjectMap,
    setAutoSyncSubjectMap: setAutoSyncSubjectMap,
    getConfirmedSubjectId: getConfirmedSubjectId,
    confirmSubject: confirmSubject,
    getSimilarityThreshold: getSimilarityThreshold,
    setSimilarityThreshold: setSimilarityThreshold,
    exportData: exportData,
    importData: importData
  };
})();

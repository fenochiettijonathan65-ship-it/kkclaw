// ===== model-settings.js =====
// KKClaw Switch - OpenAI Style

console.log('[model-settings] script loaded, electronAPI =', typeof window.electronAPI, window.electronAPI ? 'OK' : 'NULL');
window.onerror = (msg, src, line, col, err) => {
  console.error(`[model-settings] ERROR: ${msg} at ${src}:${line}:${col}`, err);
};

// ===== SVG Icon System =====
const SVG_ICONS = {
  // Provider icons
  anthropic: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M9.5 2L15 14H11.5L10 11H6L9.5 2zM1 14L4.5 2H7L3.5 14H1z" fill="currentColor"/></svg>',
  openai: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M13.5 6.5a3.5 3.5 0 0 0-3-3.46A3.5 3.5 0 0 0 4 4.5a3.5 3.5 0 0 0-1.5 6.46A3.5 3.5 0 0 0 5.5 14a3.5 3.5 0 0 0 2.5-1.04A3.5 3.5 0 0 0 12 14a3.5 3.5 0 0 0 1.5-7.5z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  kkclaw: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  default: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>',

  // Status icons
  check: '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  loading: '<svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="20" stroke-dashoffset="10"/></svg>',

  // Action icons
  search: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M8.5 8.5l3.5 3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 10l6-6 2 2-6 6H2v-2z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  probe: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v3M7 9v3M2 7h3M9 7h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  speed: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="8" r="5" stroke="currentColor" stroke-width="1.2" fill="none"/><path d="M7 5v3l2 1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 4h8M5 4V3h4v1M4 4v7a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  back: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7a5 5 0 019-3M12 7a5 5 0 01-9 3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M11 1v3h-3M3 13v-3h3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fetch: '<svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v8M4 7l3 3 3-3M3 12h8" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  brain: '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1c2 0 4 1.5 4 4s-1 3-2 4c-.5.5-1 1.5-1 2H5c0-.5-.5-1.5-1-2C3 8 2 7 2 5s2-4 4-4z" stroke="currentColor" stroke-width="1" fill="none"/><path d="M5 11h2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>',
  remove: '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

function renderIcon(name, className) {
  const cls = className ? `icon ${className}` : 'icon';
  return `<span class="${cls}">${SVG_ICONS[name] || SVG_ICONS.default}</span>`;
}

// ===== State =====
let allModels = [], allProviders = [], currentModel = null, selectedPreset = null, editingProvider = null;
let contextMenuTarget = null;

// ===== i18n =====
let currentLang = 'zh';
const i18n = {
  zh: { providers:'服务商', models:'模型', testAll:'全部测速', refresh:'刷新',
    currentlyUsing:'当前使用', switchBtn:'切换', noModel:'未选择模型',
    noProviders:'暂无服务商', noProvidersHint:'点击 + 添加', presetTitle:'选择预设',
    presetHint:'选择预设后只需填写 API Key', relayHint:'没有 API Key？试试',
    providerName:'名称', notes:'备注', apiType:'接口类型', modelsOptional:'模型（可选）',
    addModel:'+ 添加模型', addBtn:'+ 添加', cancel:'取消', displayName:'显示名称',
    noModels:'暂无模型', noModelsHint:'请先添加服务商', saveChanges:'保存', test:'测速',
    delete:'删除', keySet:'已配置', keyNotSet:'未配置', edit:'编辑',
    testing:'测速中...', testComplete:'测速完成', refreshed:'已刷新',
    switched:'已切换到', added:'已添加', updated:'已更新', deleted:'已删除', removed:'已移除',
    enterName:'请输入名称', enterKey:'请输入 API Key', enterModelId:'请输入模型 ID',
    noChanges:'无更改', confirmDelete:'确认删除', confirmDeleteHint:'？所有模型将不可用',
    confirmRemove:'确认移除模型', probe:'探测', probing:'探测中...', probeDone:'探测完成', probeFailed:'探测失败',
    logs:'日志', logAll:'全部', logSuccess:'成功', logInfo:'信息', logWarn:'警告', logError:'错误',
    logRefresh:'刷新', logClear:'清除', logEmpty:'暂无日志', logCleared:'日志已清除',
    searchPlaceholder:'搜索供应商...',
    syncCc:'同步CC', switchStats:'切换统计', detectPackage:'套餐检测', queryQuota:'查询额度', syncPreset:'同步预设' },
  en: { providers:'Providers', models:'Models', testAll:'Test All', refresh:'Refresh',
    currentlyUsing:'Currently Using', switchBtn:'Switch', noModel:'No model selected',
    noProviders:'No providers', noProvidersHint:'Click + to add', presetTitle:'Provider Preset',
    presetHint:'Only need API Key', relayHint:"No API Key? Try",
    providerName:'Name', notes:'Notes', apiType:'API Type', modelsOptional:'Models (optional)',
    addModel:'+ Add Model', addBtn:'+ Add', cancel:'Cancel', displayName:'Display Name',
    noModels:'No models', noModelsHint:'Add a provider first', saveChanges:'Save', test:'Test',
    delete:'Delete', keySet:'Key set', keyNotSet:'No key', edit:'Edit',
    testing:'Testing...', testComplete:'Done!', refreshed:'Refreshed',
    switched:'Switched to', added:'Added', updated:'Updated', deleted:'Deleted', removed:'Removed',
    enterName:'Enter name', enterKey:'Enter API Key', enterModelId:'Enter model ID',
    noChanges:'No changes', confirmDelete:'Delete', confirmDeleteHint:'? All models unavailable.',
    confirmRemove:'Remove model', probe:'Probe', probing:'Probing...', probeDone:'Probe done', probeFailed:'Probe failed',
    logs:'Logs', logAll:'All', logSuccess:'Success', logInfo:'Info', logWarn:'Warn', logError:'Error',
    logRefresh:'Refresh', logClear:'Clear', logEmpty:'No logs yet', logCleared:'Logs cleared',
    searchPlaceholder:'Search providers...',
    syncCc:'Sync CC', switchStats:'Switch Stats', detectPackage:'Detect', queryQuota:'Quota', syncPreset:'Sync Preset' }
};
function t(k) { return i18n[currentLang][k] || i18n.en[k] || k; }
function toggleLang() { currentLang = currentLang==='zh'?'en':'zh'; document.getElementById('langBtn').textContent = currentLang==='zh'?'中/EN':'EN/中'; applyLang(); }
function applyLang() {
  document.querySelectorAll('[data-t]').forEach(el => { const k=el.getAttribute('data-t'); if(i18n[currentLang][k]) el.textContent=i18n[currentLang][k]; });
  const searchInput = document.getElementById('providerSearchInput');
  if(searchInput) searchInput.placeholder = t('searchPlaceholder');
  if(document.getElementById('panel-main').classList.contains('active')){ renderCurrentIndicator(); renderProviderList(); }
  if(document.getElementById('panel-models').classList.contains('active')){ loadModels(); }
}

// ===== Toast with Icons =====
function showToast(msg, type='info') {
  const toast = document.getElementById('toast');
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };
  const icon = icons[type] || icons.info;
  toast.textContent = `${icon} ${msg}`;
  toast.className = `toast toast-${type} show`;
  const duration = type === 'error' ? 5000 : 3000;
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== Loading Overlay =====
function showLoading() {
  document.getElementById('loadingOverlay')?.classList.add('show');
}

function hideLoading() {
  document.getElementById('loadingOverlay')?.classList.remove('show');
}

// ===== Info Panel (replaces alert) =====
function showInfoPanel(title, content) {
  document.getElementById('infoPanelTitle').textContent = title;
  document.getElementById('infoPanelBody').textContent = content;
  document.getElementById('infoOverlay').classList.add('show');
}

function closeInfoPanel() {
  document.getElementById('infoOverlay').classList.remove('show');
}

// ===== XSS Safety Helpers =====
function escHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
function encArg(v) { return encodeURIComponent(String(v ?? '')); }

// ===== Tab =====
function showTab(name) {
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.header-tab').forEach(el=>el.classList.remove('active'));
  const panel=document.getElementById(`panel-${name}`); if(panel) panel.classList.add('active');
  const tab=document.querySelector(`.header-tab[data-tab="${name}"]`); if(tab) tab.classList.add('active');
  if(name==='main') loadAll(); if(name==='models') loadModels(); if(name==='add') loadPresets(); if(name==='logs') loadLogs();
}

// ===== Search / Filter =====
let searchDebounceTimer = null;
function filterProviders(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll('.provider-card');
  cards.forEach(card => {
    const name = card.dataset.name?.toLowerCase() || '';
    const match = !q || name.includes(q);
    card.style.display = match ? 'flex' : 'none';
  });
}

function filterProvidersDebounced(query) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => filterProviders(query), 300);
}

// ===== KKCLAW Quota =====
async function analyzeKKCLAW(providerName) {
  if(!window.electronAPI) return null;
  try {
    const result = await window.electronAPI.invoke('model-analyze-kkclaw', providerName);
    return result.success ? result.analysis : null;
  } catch(e) {
    return null;
  }
}

function renderKKCLAWQuota(analysis, idx) {
  if(!analysis) return `<div class="kkclaw-quota" data-idx="${idx}" style="font-size:10px;color:var(--text-tertiary);">查询失败</div>`;
  const { series, quota, warnings } = analysis;

  if(!quota) {
    return `<div class="kkclaw-quota" data-idx="${idx}" style="font-size:10px;color:var(--text-tertiary);">无额度数据 (API Key可能无效)</div>`;
  }

  let statusClass = 'healthy', statusText = '';
  let tipHtml = '';

  if(quota) {
    const pct = quota.opusWeekly.percentage;
    if(pct >= 95) { statusClass = 'critical'; statusText = '严重'; }
    else if(pct >= 80) { statusClass = 'warning'; statusText = '注意'; }

    if(warnings.length > 0) {
      const w = warnings[0];
      tipHtml = `<div class="kkclaw-tip ${escHtml(w.level)}">${escHtml(w.message)}</div>`;
    } else {
      tipHtml = '<div class="kkclaw-tip">当前可以放心使用 Opus</div>';
    }
  }

  return `<div class="kkclaw-quota" data-idx="${idx}">
    ${series ? `<div class="kkclaw-series"><span class="status-dot ${statusClass}"></span>${escHtml(series.series)}</div>` : ''}
    ${quota ? `<div class="kkclaw-quota-bar">
      <div class="kkclaw-quota-label">Opus 本周额度 · 还剩 ${100-quota.opusWeekly.percentage}%</div>
      <div class="kkclaw-progress">
        <div class="kkclaw-progress-fill ${statusClass}" style="width:${quota.opusWeekly.percentage}%"></div>
      </div>
    </div>` : ''}
    ${tipHtml}
  </div>`;
}

async function loadAll() {
  if(!window.electronAPI) {
    renderCurrentIndicator();
    renderProviderList();
    return;
  }
  try {
    const s = await window.electronAPI.invoke('model-full-status');
    if(!s){
      renderCurrentIndicator();
      renderProviderList();
      return;
    }
    allModels=s.models||[]; allProviders=s.providers||[]; currentModel=s.current;
    renderCurrentIndicator(); renderProviderList();
  } catch (err) {
    console.error('[model-settings] loadAll failed:', err);
    showToast(`主进程通信失败: ${err?.message || err}`,'error');
    renderCurrentIndicator();
    renderProviderList();
  }
}

function renderCurrentIndicator() {
  const el=document.getElementById('currentIndicator');
  if(!currentModel){
    el.innerHTML=`<div class="empty-state" style="padding:12px;"><div class="empty-text">${t('noModel')}</div></div>`;
    return;
  }
  el.innerHTML=`
    <div class="current-icon" style="background:${currentModel.color}">${escHtml(currentModel.icon)}</div>
    <div class="current-info"><div class="current-label">${t('currentlyUsing')}</div>
    <div class="current-model-name">${escHtml(currentModel.shortName)}</div>
    <div class="current-provider-name">${escHtml(currentModel.provider)} · ${escHtml(currentModel.modelId)} · ${escHtml(currentModel.api || 'unknown')}</div></div>
    <button class="current-switch-btn" onclick="showTab('models')">${t('switchBtn')}</button>`;
}

function renderProviderList() {
  const el=document.getElementById('providerList');
  if(allProviders.length===0){
    el.innerHTML=`<div class="empty-state"><div class="empty-icon">${renderIcon('plus')}</div><div class="empty-text">${t('noProviders')}</div><div class="empty-hint">${t('noProvidersHint')}</div></div>`;
    return;
  }
  el.innerHTML=allProviders.map((p, idx) => {
    const cur=p.isCurrent, spd=renderSpeedBadge(p.speedTest);
    const n=encArg(p.name);
    const isKKCLAW = p.baseUrl?.includes('gptclubapi.xyz') || p.features?.includes('quota-query');

    // Status indicator
    let statusClass = 'untested';
    if (p.speedTest?.latencyMs) {
      const ms = p.speedTest.latencyMs;
      statusClass = ms < 1000 ? 'healthy' : ms < 3000 ? 'medium' : 'slow';
    }

    return `<div class="provider-card ${cur?'current':''} fade-in" data-name="${escHtml(p.name)}" onclick="switchProvider(decodeURIComponent('${n}'))" ondblclick="event.stopPropagation();editProvider(decodeURIComponent('${n}'))" oncontextmenu="event.preventDefault();showContextMenu(event.pageX, event.pageY, decodeURIComponent('${n}'))">
      <div class="provider-status-indicator ${statusClass}"></div>
      <span class="collapse-btn" onclick="toggleProviderCollapse('${escHtml(p.name)}', event)">▼</span><div class="drag-handle"><div class="drag-dot"><span></span><span></span></div><div class="drag-dot"><span></span><span></span></div><div class="drag-dot"><span></span><span></span></div></div>
      <div class="provider-icon" style="background:${p.color}">${escHtml(p.icon)}</div>
      <div class="provider-info"><div class="provider-name-row"><span class="provider-name">${escHtml(p.name)}</span>${cur?`<span class="provider-badge">${t('currentlyUsing')}</span>`:''}</div>
      <div class="provider-url">${escHtml(p.website||p.baseUrl||'')}</div>${isKKCLAW?`<div class="kkclaw-quota" data-idx="${idx}" style="margin-top:8px;font-size:10px;color:var(--text-tertiary);">${renderIcon('loading','spin')} 加载中...</div>`:''}</div>
      <div class="provider-right">${spd}<div class="provider-api">${escHtml(p.api || 'unknown')}</div><div class="provider-models-count">${p.modelCount} model${p.modelCount!==1?'s':''}</div>
      <div class="provider-actions-row"><button class="btn btn-ghost btn-sm" title="${t('probe')}" onclick="event.stopPropagation();probeProvider(decodeURIComponent('${n}'))">${renderIcon('probe')}</button>
      <button class="btn btn-speed btn-sm" onclick="event.stopPropagation();speedTest(decodeURIComponent('${n}'))">${renderIcon('speed')}</button>
      <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();editProvider(decodeURIComponent('${n}'))">${renderIcon('edit')}</button></div></div></div>`;
  }).join('');

  // Async load KKCLAW quota using data-idx
  allProviders.forEach((p, idx) => {
    const isKKCLAW = p.baseUrl?.includes('gptclubapi.xyz') || p.features?.includes('quota-query');
    if(isKKCLAW) loadKKCLAWQuota(p.name, idx);
  });
}

async function loadKKCLAWQuota(providerName, idx) {
  const analysis = await analyzeKKCLAW(providerName);
  const el = document.querySelector(`.kkclaw-quota[data-idx="${idx}"]`);
  if(el) {
    el.outerHTML = renderKKCLAWQuota(analysis, idx);
  }
}

function renderSpeedBadge(s) {
  if(!s) return '<div class="provider-speed">--</div>';
  if(s.status==='error') return '<div class="provider-speed slow">Error</div>';
  const ms=s.latencyMs, cls=ms<1000?'fast':ms<3000?'medium':'slow';
  return `<div class="provider-speed ${cls}">${ms}ms</div>`;
}

async function speedTest(name) { if(!electronAPI) return; showToast(`${t('testing')}`,'info'); const r=await window.electronAPI.invoke('model-speed-test',name); showToast(r.status==='ok'?`${name}: ${r.latencyMs}ms`:`${name}: Error`,'success'); loadAll(); }
async function speedTestAll() { if(!electronAPI) return; const btn=document.getElementById('speedTestAllBtn'); btn.classList.add('testing'); showToast(t('testing'),'info'); await window.electronAPI.invoke('model-speed-test-all'); btn.classList.remove('testing'); showToast(t('testComplete'),'success'); loadAll(); }

async function probeProvider(name) {
  if(!window.electronAPI) return;
  showToast(t('probing'),'info');
  const result = await window.electronAPI.invoke('model-probe-provider', name, { timeoutMs: 12000 });
  if(!result?.success){
    showToast(`${t('probeFailed')}: ${result?.error || 'unknown'}`,'error');
    return;
  }
  const recommended = result.recommendedApi || 'unknown';
  showToast(`${t('probeDone')}: ${name} -> ${recommended}`,'success');

  const tests = (result.tests || []).map(r => `${r.apiType} | ${r.status ?? 'ERR'} | ${r.verdict} | ${r.modelId}`);
  const report = [
    `${result.baseUrl || ''}`,
    `recommended: ${recommended}${result.reason ? ` (${result.reason})` : ''}`,
    `reachable: ${(result.summary?.reachableApis || []).join(', ') || '-'}`,
    '',
    ...tests
  ].join('\n');
  showInfoPanel(`探测 · ${name}`, report);
}

async function syncCCSwitch() {
  if(!window.electronAPI) return;
  const result = await window.electronAPI.invoke('model-sync-cc-switch');
  if(result?.success){
    showToast('已同步 CC Switch','success');
    await loadAll();
  } else {
    showToast(`同步失败: ${result?.error || 'unknown'}`,'error');
  }
}
window.syncCCSwitch = syncCCSwitch;

async function showSwitchStats() {
  if(!window.electronAPI) return;
  const state = await window.electronAPI.invoke('model-switch-state');
  const stats = await window.electronAPI.invoke('model-switch-stats');
  const history = await window.electronAPI.invoke('model-switch-history', 8);
  const lines = [
    `state: ${state?.state || 'unknown'} / progress ${state?.progress ?? 0}%`,
    `strategy: ${stats?.strategy || 'unknown'}`,
    `history: ${(history || []).length} records`,
    ''
  ];
  (history || []).forEach((h, idx) => {
    const t = (h.timestamp || '').replace('T', ' ').slice(0, 19);
    lines.push(`${idx + 1}. ${h.success ? '✅' : '❌'} ${h.targetModel || '-'} (${h.duration || 0}ms) ${t}`);
  });
  showInfoPanel('切换统计', lines.join('\n'));
}

// ===== Models =====
async function loadModels() {
  if(!window.electronAPI) return;
  const s=await window.electronAPI.invoke('model-full-status'); if(!s) return;
  allModels=s.models||[]; currentModel=s.current;
  const panel=document.getElementById('modelPanel'), groups={};
  for(const m of allModels){ if(!groups[m.provider]) groups[m.provider]=[]; groups[m.provider].push(m); }
  let html='';
  for(const [prov,models] of Object.entries(groups)){
    html+=`<div class="model-section-title">${escHtml(prov)}</div><div class="model-grid">`;
    for(const m of models){ const act=currentModel?.id===m.id; const mid=encArg(m.id); html+=`
      <div class="model-row ${act?'active':''}" onclick="switchModel(decodeURIComponent('${mid}'))">
        <div class="model-icon-sm" style="background:${m.color}">${escHtml(m.icon)}</div>
        <div class="model-name-text">${escHtml(m.shortName)}</div>
        <div class="model-tags">${m.reasoning?`<span class="model-tag reasoning">${renderIcon('brain')}</span>`:''}<span class="model-tag">${Math.round(m.contextWindow/1000)}K</span></div>
        <div class="model-check-mark">${act?renderIcon('check'):''}</div></div>`; }
    html+='</div>';
  }
  if(!allModels.length) html=`<div class="empty-state"><div class="empty-icon">${renderIcon('default')}</div><div class="empty-text">${t('noModels')}</div><div class="empty-hint">${t('noModelsHint')}</div></div>`;
  panel.innerHTML=html;
}

function normalizeSwitchResult(result){
  if (!result) return { success:false, model:null, error:'empty_response' };
  if (typeof result === 'object' && ('success' in result || 'model' in result || 'error' in result)) {
    return {
      success: !!result.success,
      model: result.model || null,
      error: result.error || null,
      noOp: !!result.noOp,
      resolvedApi: result.resolvedApi || result.model?.api || null,
      providerApi: result.providerApi || null,
      warning: result.warning || null,
      strategy: result.strategy || null
    };
  }
  return { success:true, model:result, error:null, noOp:false, resolvedApi: result?.api || null, providerApi: null, warning: null, strategy: null };
}

async function switchModel(id) {
  if(!window.electronAPI) return;
  showLoading();
  showToast('切换中...','info');
  const raw = await window.electronAPI.invoke('model-switch', id);
  hideLoading();
  const res = normalizeSwitchResult(raw);

  if (!res.success || !res.model) {
    showToast(`切换失败: ${res.error || 'unknown'}`,'error');
    await loadModels();
    return;
  }

  const current = await window.electronAPI.invoke('model-current');
  if (!current || current.id !== id) {
    showToast(`切换未生效: 目标 ${id}，当前 ${current?.id || 'unknown'}`,'error');
    await loadModels();
    return;
  }

  const protocol = res.resolvedApi || res.model?.api || 'unknown';
  const msg = res.noOp ? `已是当前模型 ${res.model.shortName} · ${protocol}` : `${t('switched')} ${res.model.shortName} · ${protocol}`;
  showToast(res.warning ? `${msg}（网关慢重载）` : msg, res.warning ? 'info' : 'success');
  await loadModels();
}

async function switchProvider(name) {
  if(!window.electronAPI) return;
  showLoading();
  showToast(`切换到 ${name}...`,'info');
  const raw = await window.electronAPI.invoke('model-switch-provider',name);
  hideLoading();
  const res = normalizeSwitchResult(raw);
  if(!res.success || !res.model){
    showToast(`切换失败: ${res.error || 'unknown'}`,'error');
    await loadAll();
    return;
  }

  const current = await window.electronAPI.invoke('model-current');
  if (!current || current.provider !== name) {
    showToast(`切换未生效: 目标 ${name}，当前 ${current?.provider || 'unknown'}`,'error');
    await loadAll();
    return;
  }

  const protocol = res.resolvedApi || res.model?.api || 'unknown';
  const msg = `${t('switched')} ${name} / ${res.model.shortName} · ${protocol}`;
  showToast(res.warning ? `${msg}（网关慢重载）` : msg, res.warning ? 'info' : 'success');
  await loadAll();
}

// ===== Edit Provider =====
async function editProvider(name) {
  if(!window.electronAPI) return;
  editingProvider=name; const s=await window.electronAPI.invoke('model-full-status');
  const p=s.providers.find(x=>x.name===name); if(!p) return;
  const models=allModels.filter(m=>m.provider===name);
  const n=encArg(name);
  const modelRows=models.map(m=>{
    const mid=encArg(m.modelId);
    return `<div class="model-edit-row"><div class="model-icon-sm" style="background:${m.color};width:22px;height:22px;font-size:9px;">${escHtml(m.icon)}</div>
    <div class="model-edit-name">${escHtml(m.shortName)}</div><div class="model-edit-id">${escHtml(m.modelId)}</div>
    <button class="btn btn-danger btn-sm" onclick="removeModel(decodeURIComponent('${n}'),decodeURIComponent('${mid}'))">${renderIcon('remove')}</button></div>`;
  }).join('');
  document.getElementById('editPanel').innerHTML=`
    <div class="edit-header"><button class="edit-back" onclick="showTab('main')">${renderIcon('back')}</button>
    <div class="edit-provider-icon" style="background:${p.color}">${escHtml(p.icon)}</div>
    <div><div class="edit-title">${escHtml(name)}</div><div style="font-size:10px;color:var(--text-secondary);">${escHtml(p.apiType)}</div></div></div>
    <div class="form-group"><label class="form-label">Base URL</label><input class="form-input" id="editBaseUrl" value="${escHtml(p.baseUrl||'')}"></div>
    <div class="form-group"><label class="form-label">API Key</label><input class="form-input" id="editApiKey" type="password" placeholder="${p.hasApiKey?'••••••••':''}">
    <div class="form-hint">${p.hasApiKey?`${renderIcon('check','status-ok')} ${t('keySet')}`:`${renderIcon('remove','status-err')} ${t('keyNotSet')}`}</div></div>
    <div style="display:flex;gap:6px;margin-top:10px;">
    <button class="btn btn-primary" onclick="saveProviderEdit()">${t('saveChanges')}</button>
    <button class="btn btn-ghost" onclick="probeProvider(decodeURIComponent('${n}'))">${renderIcon('probe')} ${t('probe')}</button>
    <button class="btn btn-speed" onclick="speedTest(decodeURIComponent('${n}'))">${renderIcon('speed')} ${t('test')}</button>
    <button class="btn btn-ghost" onclick="fetchProviderModels(decodeURIComponent('${n}'))">${renderIcon('fetch')} 获取模型</button>
    <button class="btn btn-ghost" onclick="detectPackage(decodeURIComponent('${n}'))">${t('detectPackage')}</button>
    <button class="btn btn-ghost" onclick="queryQuota(decodeURIComponent('${n}'))">${t('queryQuota')}</button>
    <button class="btn btn-ghost" onclick="syncPreset(decodeURIComponent('${n}'))">${t('syncPreset')}</button>
    <button class="btn btn-danger" onclick="deleteProvider(decodeURIComponent('${n}'))">${renderIcon('trash')} ${t('delete')}</button></div>
    <div class="divider"></div>
    <div style="font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">${t('models')} (${models.length})</div>
    ${modelRows}
    <div style="margin-top:8px;"><div class="form-row" style="margin-bottom:6px;">
    <input class="form-input" id="newModelId" placeholder="Model ID" style="font-size:11px;">
    <input class="form-input" id="newModelName" placeholder="${t('displayName')}" style="font-size:11px;">
    <button class="btn btn-ghost btn-sm" onclick="addModelToProvider(decodeURIComponent('${n}'))">${renderIcon('plus')}</button></div></div>`;
  document.querySelectorAll('.panel').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.header-tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('panel-edit').classList.add('active');
}

async function saveProviderEdit() { if(!editingProvider||!electronAPI) return; const b=document.getElementById('editBaseUrl').value.trim(),k=document.getElementById('editApiKey').value.trim(),u={}; if(b) u.baseUrl=b; if(k) u.apiKey=k; if(!Object.keys(u).length){showToast(t('noChanges'),'info');return;} const r=await window.electronAPI.invoke('model-update-provider',editingProvider,u); if(r.success){showToast(`${t('updated')} ${editingProvider}`,'success');showTab('main');}else showToast(r.error,'error'); }
async function deleteProvider(name) { if(!confirm(`${t('confirmDelete')} "${name}"${t('confirmDeleteHint')}`)) return; const r=await window.electronAPI.invoke('model-remove-provider',name); if(r.success){showToast(`${t('deleted')} ${name}`,'success');showTab('main');}else showToast(r.error,'error'); }
async function removeModel(prov,id) { if(!confirm(`${t('confirmRemove')} "${id}"?`)) return; const r=await window.electronAPI.invoke('model-remove-model',prov,id); if(r.success){showToast(t('removed'),'success');editProvider(prov);await loadAll();}else showToast(r.error,'error'); }
async function addModelToProvider(prov) { const id=document.getElementById('newModelId').value.trim(),name=document.getElementById('newModelName').value.trim(); if(!id) return showToast(t('enterModelId'),'error'); const r=await window.electronAPI.invoke('model-add-model',prov,{id,name:name||id}); if(r.success){showToast(`${t('added')} ${id}`,'success');editProvider(prov);await loadAll();}else showToast(r.error,'error'); }

async function fetchProviderModels(prov) {
  if(!window.electronAPI) return;
  showToast('正在获取模型列表...','info');
  const r=await window.electronAPI.invoke('model-fetch-models',prov);
  if(!r.success){ showToast(`获取失败: ${r.error}`,'error'); return; }
  if(!r.models.length){ showToast('未获取到模型','info'); return; }
  let added=0;
  let skipped=0;
  for(const m of r.models){
    try{
      const addResult = await window.electronAPI.invoke('model-add-model',prov,{id:m.id,name:m.name||m.id});
      if (addResult?.success) added++;
      else skipped++;
    }catch(e){
      skipped++;
    }
  }
  showToast(`获取到 ${r.models.length} 个模型，新增 ${added} 个，跳过 ${skipped} 个`,'success');
  editProvider(prov);
  await loadAll();
}

async function detectPackage(prov) {
  if(!window.electronAPI) return;
  const r = await window.electronAPI.invoke('model-detect-package', prov);
  if(!r?.success){
    showToast(`检测失败: ${r?.error || 'unknown'}`,'error');
    return;
  }
  const avail = r.available || {};
  const guess = r.guess || {};
  showInfoPanel(`套餐检测 · ${prov}`, [
    `Claude: ${avail.claude ? '✅' : '❌'}`,
    `Gemini: ${avail.gemini ? '✅' : '❌'}`,
    `Codex: ${avail.codex ? '✅' : '❌'}`,
    '',
    `套餐: ${guess.series || 'unknown'}`,
    `置信度: ${guess.confidence || 'unknown'}`
  ].join('\n'));
}

async function queryQuota(prov) {
  if(!window.electronAPI) return;
  const r = await window.electronAPI.invoke('model-query-quota', prov);
  if(!r?.success){
    showToast(`查询失败: ${r?.error || 'unknown'}`,'error');
    return;
  }
  const q = r.quota?.opusWeekly;
  if(!q){
    showInfoPanel(`额度查询 · ${prov}`, '暂无 Opus 周额度数据');
    return;
  }
  showInfoPanel(`额度查询 · ${prov}`, `Opus 周额度: ${q.used.toFixed(2)} / ${q.limit}\n使用率: ${q.percentage}%`);
}

async function syncPreset(prov) {
  if(!window.electronAPI) return;
  const r = await window.electronAPI.invoke('model-sync-preset', prov);
  if(!r?.success){
    showToast(`同步失败: ${r?.error || 'unknown'}`,'error');
    return;
  }
  showToast(`已同步预设模型 ${r.count || 0} 个`,'success');
  editProvider(prov);
  await loadAll();
}

// ===== Presets =====
async function loadPresets() { if(!electronAPI) return; const presets=await window.electronAPI.invoke('model-presets'); document.getElementById('presetGrid').innerHTML=presets.map(p=>`
  <div class="preset-card ${selectedPreset===p.key?'selected':''}" onclick="selectPreset('${p.key}', event)">
  <div class="preset-card-count">${p.modelCount}</div><div class="preset-card-icon" style="background:${p.color}">${escHtml(p.icon)}</div>
  <div class="preset-card-name">${escHtml(p.name)}</div><div class="preset-card-desc">${escHtml(p.description||'')}</div></div>`).join(''); }

function selectPreset(key, evt) { if(!window.electronAPI) return; window.electronAPI.invoke('model-presets').then(presets=>{ const p=presets.find(x=>x.key===key); if(!p) return; selectedPreset=key; document.getElementById('addName').value=p.name; document.getElementById('addBaseUrl').value=p.baseUrl; document.getElementById('addApiType').value=p.api; document.querySelectorAll('.preset-card').forEach(el=>el.classList.remove('selected')); evt?.target?.closest?.('.preset-card')?.classList.add('selected'); }); }

function addModelRow() { const c=document.getElementById('addModelRows'),r=document.createElement('div'); r.className='form-row'; r.style.marginBottom='6px'; r.innerHTML=`<input class="form-input" placeholder="Model ID" data-field="id"><input class="form-input" placeholder="${t('displayName')}" data-field="name">`; c.appendChild(r); }

async function submitProvider() {
  const name=document.getElementById('addName').value.trim(),baseUrl=document.getElementById('addBaseUrl').value.trim(),apiKey=document.getElementById('addApiKey').value.trim(),api=document.getElementById('addApiType').value;
  if(!name) return showToast(t('enterName'),'error'); if(!apiKey) return showToast(t('enterKey'),'error');
  let result; const fi=document.querySelector('#addModelRows .form-row input[data-field="id"]'),hm=fi&&fi.value.trim();
  if(selectedPreset&&!hm){ result=await window.electronAPI.invoke('model-add-from-preset',selectedPreset,apiKey,name,baseUrl||undefined); }
  else { const rows=document.querySelectorAll('#addModelRows .form-row'),models=[]; rows.forEach(r=>{const id=r.querySelector('[data-field="id"]').value.trim(),n=r.querySelector('[data-field="name"]').value.trim();if(id) models.push({id,name:n||id});}); result=await window.electronAPI.invoke('model-add-provider',name,{baseUrl,apiKey,api,models}); }
  if(result.success){showToast(`${t('added')} "${name}"`,'success');document.getElementById('addName').value='';document.getElementById('addBaseUrl').value='https://api.kk666.online/v1';document.getElementById('addApiKey').value='';selectedPreset=null;showTab('main');}else showToast(result.error,'error');
}

// ===== Utils =====
function refreshAll() { loadAll(); showToast(t('refreshed'),'info'); }
window.refreshAll = refreshAll;

// ===== Logs =====
let currentLogFilter = null;
let logEntries = [];

async function loadLogs() {
  if(!window.electronAPI) return;
  logEntries = await window.electronAPI.invoke('switch-log-list', 200, currentLogFilter);
  renderLogs();
}

function renderLogs() {
  const el = document.getElementById('logContainer');
  const filtered = currentLogFilter ? logEntries.filter(e => e.level === currentLogFilter) : logEntries;
  if(filtered.length === 0) {
    el.innerHTML = `<div class="log-empty">${t('logEmpty')}</div>`;
    return;
  }
  el.innerHTML = filtered.map(e => {
    const timeStr = e.time ? e.time.replace('T',' ').substring(5,19) : '';
    return `<div class="log-entry">
      <span class="log-time">${escHtml(timeStr)}</span>
      <span class="log-level log-level-${escHtml(e.level)}">${escHtml(e.level)}</span>
      <span class="log-action">${escHtml(e.action)}</span>
      <span class="log-detail">${escHtml(e.detail || '')}</span>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function filterLogs(level, btn) {
  currentLogFilter = level === 'all' ? null : level;
  document.querySelectorAll('.log-filter').forEach(f => f.classList.remove('active'));
  if(btn) btn.classList.add('active');
  if(logEntries.length > 0) {
    renderLogs();
  } else {
    loadLogs();
  }
}

function refreshLogs() { loadLogs(); }

async function showGatewayStatus() {
  if(!window.electronAPI) return;
  const status = await window.electronAPI.invoke('gateway-full-status');
  if(!status){
    showToast('网关状态不可用','error');
    return;
  }
  const health = await window.electronAPI.invoke('gateway-health-score').catch(() => null);
  const anomalies = await window.electronAPI.invoke('gateway-anomalies').catch(() => []);
  const metrics = await window.electronAPI.invoke('gateway-metrics').catch(() => null);
  const lines = [
    `Gateway: ${status?.isRunning ? 'running' : 'stopped'}`,
    `Health: ${health?.score ?? '--'} (${health?.status || 'unknown'})`,
    `Anomalies: ${(anomalies || []).length}`,
    `Uptime: ${status?.uptime || '--'}`,
    ''
  ];
  if (metrics?.summary) {
    lines.push(`Requests: ${metrics.summary.totalRequests || 0}`);
    lines.push(`Errors: ${metrics.summary.totalErrors || 0}`);
    lines.push(`Avg latency: ${metrics.summary.avgLatencyMs || 0}ms`);
  }
  alert(lines.join('\n'));
}

async function clearGatewayMetrics() {
  if(!window.electronAPI) return;
  const result = await window.electronAPI.invoke('gateway-clear-metrics');
  if(result?.success) showToast('监控数据已清理','success');
  else showToast('清理失败','error');
}

async function clearLogs() {
  if(!window.electronAPI) return;
  await window.electronAPI.invoke('switch-log-clear');
  logEntries = [];
  renderLogs();
  showToast(t('logCleared'), 'info');
}

// ===== Real-time log listener =====
if(window.electronAPI) {
  window.electronAPI.on('switch-log-entry', (entry) => {
    logEntries.push(entry);
    if(logEntries.length > 500) logEntries.splice(0, logEntries.length - 500);
    if(document.getElementById('panel-logs').classList.contains('active')) {
      renderLogs();
    }
  });
}

// ===== Init =====
async function initPanel() {
  if (!window.electronAPI) {
    // 某些环境下 contextBridge 注入稍慢，做一次短暂重试
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (window.electronAPI) break;
    }
  }

  if (!window.electronAPI) {
    console.error('[model-settings] electronAPI unavailable after retry');
    renderCurrentIndicator();
    renderProviderList();
    showToast('未连接到主进程，请重启 KKClaw','error');
    return;
  }

  await loadAll();
  window.electronAPI.on('model-changed',()=>{loadAll();loadModels();});
}

initPanel();

// 折叠/展开服务商卡片
function toggleProviderCollapse(name, event) {
  event.stopPropagation();
  const card = document.querySelector(`.provider-card[data-name="${name}"]`);
  if(card) card.classList.toggle('collapsed');
}

// ===== Expose functions to window for onclick handlers =====
window.toggleLang = toggleLang;
window.showTab = showTab;
window.filterProviders = filterProviders;
window.filterProvidersDebounced = filterProvidersDebounced;
window.speedTest = speedTest;
window.speedTestAll = speedTestAll;
window.showSwitchStats = showSwitchStats;
window.editProvider = editProvider;
window.saveProviderEdit = saveProviderEdit;
window.deleteProvider = deleteProvider;
window.removeModel = removeModel;
window.addModelToProvider = addModelToProvider;
window.addModelRow = addModelRow;
window.submitProvider = submitProvider;
window.toggleProviderCollapse = toggleProviderCollapse;
window.probeProvider = probeProvider;
window.filterLogs = filterLogs;
window.refreshLogs = refreshLogs;
window.showGatewayStatus = showGatewayStatus;
window.clearGatewayMetrics = clearGatewayMetrics;
window.clearLogs = clearLogs;
window.selectPreset = selectPreset;
window.showContextMenu = showContextMenu;
window.closeInfoPanel = closeInfoPanel;

// ===== Context Menu =====
function showContextMenu(x, y, providerName) {
  const menu = document.getElementById('contextMenu');
  contextMenuTarget = providerName;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  menu.classList.add('show');
}

function hideContextMenu() {
  document.getElementById('contextMenu').classList.remove('show');
  contextMenuTarget = null;
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.context-menu')) hideContextMenu();
  if (!e.target.closest('.info-panel') && e.target.classList.contains('info-overlay')) closeInfoPanel();
});

document.getElementById('contextMenu').addEventListener('click', async (e) => {
  const item = e.target.closest('.context-menu-item');
  if (!item || !contextMenuTarget) return;

  const action = item.dataset.action;
  const targetName = contextMenuTarget;
  hideContextMenu();

  switch(action) {
    case 'switch': await switchProvider(targetName); break;
    case 'edit': await editProvider(targetName); break;
    case 'probe': await probeProvider(targetName); break;
    case 'speed': await speedTest(targetName); break;
    case 'delete': await deleteProvider(targetName); break;
  }
});

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  // Escape closes panels
  if (e.key === 'Escape') {
    hideContextMenu();
    closeInfoPanel();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    switch(e.key.toLowerCase()) {
      case 'f':
        e.preventDefault();
        document.getElementById('providerSearchInput')?.focus();
        break;
      case 'r':
        e.preventDefault();
        refreshAll();
        break;
      case 'n':
        e.preventDefault();
        showTab('add');
        break;
    }
  }

  if (document.getElementById('panel-main').classList.contains('active')) {
    const cards = Array.from(document.querySelectorAll('.provider-card')).filter(c => c.style.display !== 'none');
    const focused = document.querySelector('.provider-card.keyboard-focus');
    let idx = focused ? cards.indexOf(focused) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, cards.length - 1);
      cards.forEach(c => c.classList.remove('keyboard-focus'));
      if (cards[idx]) {
        cards[idx].classList.add('keyboard-focus');
        cards[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
      cards.forEach(c => c.classList.remove('keyboard-focus'));
      if (cards[idx]) {
        cards[idx].classList.add('keyboard-focus');
        cards[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (e.key === 'Enter' && focused) {
      e.preventDefault();
      const name = focused.dataset.name;
      if (name) switchProvider(name);
    }
  }
});

// ===== Search Clear Button =====
const searchInput = document.getElementById('providerSearchInput');
if (searchInput) {
  const clearBtn = document.createElement('div');
  clearBtn.className = 'search-clear';
  clearBtn.innerHTML = '×';
  clearBtn.onclick = () => {
    searchInput.value = '';
    filterProviders('');
    clearBtn.classList.remove('show');
  };
  searchInput.parentElement.appendChild(clearBtn);

  searchInput.addEventListener('input', (e) => {
    clearBtn.classList.toggle('show', e.target.value.length > 0);
  });
}

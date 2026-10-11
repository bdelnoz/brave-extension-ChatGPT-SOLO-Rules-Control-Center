/*
################################################################################
# SCRIPT INFORMATION
################################################################################
# Script Name       : content-solo.js
# Script Path       : /content-solo.js
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Description       : 3-mode floating UI; account Custom Instructions manager plus public SOLO desired-state synchronization.
# Changelog         : V3.0.0 - Add functional rule unload/deactivation state sync, clearer Maxi labels and tighter top spacing.
#                     V2.0.2 - Add explicit selected-rule blue state and compact one-line rule metadata.
#                     V2.0.1 - Correct displayed public SOLO versions from authoritative rule metadata.
#                     V2.0.0 - Dynamic _RULES_SOLOLAST_* discovery, multi-select and current-chat Apply; Developer-only logging.
#                     V1.0.7 - Reload page after verified CI update; fetch SOLOLAST through GitHub Contents API by current blob SHA.
#                     V1.0.6 - Fix false-positive CI verification; require both server CI fields and overwrite fallback.
#                     V1.0.5 - Allow server-normalized trailing line breaks and read-back verification; fix DEBUG startup version.
#                     V1.0.4 - Surface authenticated 401 fallback results; preserve all UI.
#                     V1.0.3 - Session-authenticated CI PATCH and read-back; compact right-aligned Maxi modes.
#                     V1.0.2 - Always use latest SOLOLAST, Export-aligned reload, ephemeral DEBUG, chevron window toggle.
#                     V1.0.1 - Fix toolbar toggle and invalidated contexts, expose fresh CI version, DEBUG log controls and full Reload Ext.
#                     V1.0.0 - First clean personal-use POC.
################################################################################
*/
(() => {
  'use strict';
  if (window.__NOXOZ_SOLO_POC_V300__) return;
  window.__NOXOZ_SOLO_POC_V300__ = true;

  const VERSION = '3.0.0';
  const REPO_URL = 'https://github.com/bdelnoz/regles_contextualisation';
  const DONATE_URL = 'https://donate.stripe.com/6oUdRbfsifpQ8DzbbWfQI00';
  const RAW_URL = 'https://github.com/bdelnoz/regles_contextualisation/blob/main/_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md';
  const PUBLIC_RULE_PREFIX = '_RULES_SOLOLAST_';
  const STORAGE_KEY = 'noxoz_solo_control_center_v103_ui'; // Keep validated geometry across upgrades.
  const ACTIVE_RULES_KEY_PREFIX = 'noxoz_solo_active_public_rules_v300:';
  const ROOT_ID = 'noxoz-solo-rc-root';
  const VIEWPORT_MARGIN = 8;
  const DEFAULTS = {
    view: 'user', size: 'maxi', collapsed: false,
    user: {x: 0, y: 102, w: 261, h: 600},
    developer: {x: 0, y: 102, w: 261, h: 600},
    mini: {x: 358, y: 111}
  };
  const ui = structuredClone(DEFAULTS);
  const events = []; // Ephemeral session only: reset on every tab load / runtime reinjection.
  let panelVisible = true;
  const ci = {text: null, url: RAW_URL, fetchedAt: null, busy: false, sourceVersion: null, cacheAge: null};
  const publicRules = {items: [], selected: new Set(), active: new Set(), activeContextKey: null, busy: false, applying: false, listedAt: null, commitSha: null};
  let statusText = 'Ready';
  let statusKind = 'ready';
  let root, content, footer, statusArea, logOutput;
  let writingLayout = false;

  const clamp = (v, min, max) => Math.max(min, Math.min(v, max));
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const stamp = () => new Date().toLocaleTimeString('en-GB', {hour12:false});
  const isMini = () => ui.size === 'mini';
  const isDev = () => ui.view === 'developer';
  const debugActive = () => !isMini() && isDev();
  const line = (message, severity = 'INFO') => {
    // Developer diagnostics exist only while Maxi Developer is active.
    // User and Mini modes do not silently accumulate a hidden DEBUG history.
    if (!debugActive()) return;
    const formatted = `${stamp()} [${severity}] ${message}`;
    events.push(formatted);
    if (events.length > 500) events.splice(0, events.length - 500);
    if (severity === 'ERROR') console.error('[SOLO DEBUG]', formatted);
    else if (severity === 'WARN') console.warn('[SOLO DEBUG]', formatted);
    else console.debug('[SOLO DEBUG]', formatted);
    if (logOutput) {logOutput.textContent = events.join('\n'); logOutput.scrollTop = logOutput.scrollHeight;}
  };
  const status = (text, kind = 'ready') => {
    statusText = text;
    statusKind = kind;
    if (statusArea) { statusArea.textContent = `Status: ${text}`; statusArea.dataset.kind = kind; }
    line(text, kind === 'error' ? 'ERROR' : 'STATUS');
  };
  const el = (tag, cls, text, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  };
  const btn = (label, title, callback, parent, cls = '') => {
    const b = el('button', `solo-btn ${cls}`, label, parent);
    b.type = 'button';
    b.title = title || label;
    b.addEventListener('click', event => {event.stopPropagation(); callback(event);});
    b.addEventListener('pointerdown', event => event.stopPropagation());
    return b;
  };
  const linkButton = (label, title, url, parent, cls='') => {
    const a = el('a', `solo-btn solo-link ${cls}`, label, parent);
    a.title = title;
    a.href = url;
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    a.addEventListener('pointerdown', ev => ev.stopPropagation());
    return a;
  };
  const saveLayout = async () => {
    if (writingLayout) return;
    writingLayout = true;
    try { await chrome.storage.local.set({[STORAGE_KEY]: ui}); }
    catch (e) { line(`Could not persist layout: ${e.message}`, 'WARN'); }
    finally {writingLayout = false;}
  };
  const loadLayout = async () => {
    try {
      const data = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
      if (!data || typeof data !== 'object') return;
      if (data.view === 'developer' || data.view === 'user') ui.view = data.view;
      if (data.size === 'mini' || data.size === 'maxi') ui.size = data.size;
      for (const key of ['user','developer','mini']) {
        const incoming = data[key];
        if (!incoming) continue;
        for (const field of Object.keys(DEFAULTS[key])) {
          if (Number.isFinite(incoming[field])) ui[key][field] = incoming[field];
        }
      }
    } catch (e) {line(`Layout defaults in use: ${e.message}`, 'WARN');}
  };
  const bounds = () => {
    const w = Math.max(220, window.innerWidth);
    const h = Math.max(200, window.innerHeight);
    return {w, h};
  };
  const setGeometry = () => {
    if (!root) return;
    const b = bounds();
    const isSmall = isMini();
    root.classList.toggle('solo-mini', isSmall);
    root.classList.toggle('solo-developer', !isSmall && isDev());
    root.classList.toggle('solo-maxi', !isSmall);
    root.classList.toggle('solo-hidden', !panelVisible);
    const m = isSmall ? ui.mini : ui[ui.view];
    const minWidth = 230;
    const width = isSmall ? 126 : clamp(m.w, Math.min(minWidth,b.w-2*VIEWPORT_MARGIN), Math.max(180,b.w-2*VIEWPORT_MARGIN));
    if (!isSmall) m.w = width;
    const h = isSmall ? null : clamp(m.h, Math.min(260,b.h-2*VIEWPORT_MARGIN), Math.max(120,b.h-2*VIEWPORT_MARGIN));
    if (!isSmall) m.h = h;
    m.x = isSmall ? clamp(m.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN,b.w-width-VIEWPORT_MARGIN)) :
      clamp(m.x, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN,b.w-width-VIEWPORT_MARGIN));
    const realH = isSmall ? (root.getBoundingClientRect().height || 250) : h;
    m.y = clamp(m.y, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN,b.h-realH-VIEWPORT_MARGIN));
    Object.assign(root.style, {left:`${m.x}px`,top:`${m.y}px`,width:`${width}px`,height:isSmall?'auto':`${h}px`});
  };
  const setView = (view, size) => {
    const priorView = ui.view;
    const wasMaxi = !isMini();
    ui.view = view || ui.view;
    ui.size = size || ui.size;
    if (!isMini()) {
      const {w, h} = wasMaxi ? ui[priorView] : ui[ui.view];
      ui.user.w = ui.developer.w = w;
      ui.user.h = ui.developer.h = h;
      // Both Maxi modes must open fully at the right edge when switching.
      ui.user.x = ui.developer.x = Math.max(VIEWPORT_MARGIN, window.innerWidth - w - VIEWPORT_MARGIN);
      ui.user.y = ui.developer.y = clamp(ui[priorView].y, VIEWPORT_MARGIN,
        Math.max(VIEWPORT_MARGIN, window.innerHeight - h - VIEWPORT_MARGIN));
    }
    line(`Window mode change: view=${ui.view}, size=${ui.size}`, 'DEBUG');
    render();
    saveLayout();
  };
  const createTop = () => {
    const head = el('div','solo-head',null,root);
    const title = el('div','solo-heading',isMini() ? 'SOLO Control' : `SOLO Control Center @NoXoZ.be - v${VERSION}`,head);
    title.title = 'Drag to move window';
    if (isMini()) {
      btn('›','Expand to Maxi',()=>setView(ui.view,'maxi'),head,'solo-expand');
      attachDrag(head);
      return;
    }
    const row = el('div','solo-head-controls',null,head);
    if (isDev()) {
      btn('User','Switch to Maxi User',()=>setView('user','maxi'),row,'solo-mode-control');
      btn('Reload Ext','Reload extension (refresh page if needed)',reloadExtension,row,'solo-reload');
    } else btn('Dev','Switch to Maxi Developer',()=>setView('developer','maxi'),row,'solo-mode-control');
    btn('‹','Collapse to Mini',()=>setView(null,'mini'),row,'solo-chevron');
    btn('Maxi','Maxi window',()=>setView(null,'maxi'),row,'solo-mode-control solo-selected');
    btn('Mini','Compact Mini window',()=>setView(null,'mini'),row,'solo-mode-control');
    btn('‹','Shrink to Mini',()=>setView(null,'mini'),row,'solo-collapse');
    attachDrag(title);
  };
  const statusBar = (parent, mini=false) => {
    statusArea = el('div',mini?'solo-status solo-status-mini':'solo-status',`Status: ${statusText}`,parent);
    statusArea.dataset.kind = statusKind;
  };
  const addDonate = parent => linkButton(isMini()?'♡ Support ♡':'♡ Click to Support This Project ♡', 'Support via Stripe', DONATE_URL,parent,'solo-donate');
  const addAttribution = parent => el('div','solo-attribution',`@NoXoZ.be · v${VERSION}`,parent);

  const displayRuleName = name => name.startsWith(PUBLIC_RULE_PREFIX)
    ? name.slice(PUBLIC_RULE_PREFIX.length).replace(/\.[^.]+$/u, '')
    : name;
  const humanBytes = bytes => bytes >= 1024 ? `${Math.round(bytes / 1024)} KB` : `${bytes} B`;

  const chatContextKey = () => {
    try {
      const url = new URL(location.href);
      return `${ACTIVE_RULES_KEY_PREFIX}${url.origin}${url.pathname}`;
    } catch {
      return `${ACTIVE_RULES_KEY_PREFIX}${location.origin}${location.pathname}`;
    }
  };

  async function loadActiveRulesForCurrentChat() {
    const key = chatContextKey();
    publicRules.activeContextKey = key;
    try {
      const stored = (await chrome.storage.local.get(key))[key];
      publicRules.active = new Set(Array.isArray(stored) ? stored.filter(name => typeof name === 'string' && name.startsWith(PUBLIC_RULE_PREFIX)) : []);
      publicRules.selected = new Set(publicRules.active);
      line(`Loaded active public SOLO state: ${publicRules.active.size} rule(s).`, 'DEBUG');
    } catch (error) {
      publicRules.active = new Set();
      line(`Could not load active public SOLO state: ${error.message}`, 'WARN');
    }
  }

  async function saveActiveRulesForCurrentChat(names) {
    const key = chatContextKey();
    const clean = [...new Set(names)].filter(name => typeof name === 'string' && name.startsWith(PUBLIC_RULE_PREFIX));
    await chrome.storage.local.set({[key]: clean});
    publicRules.activeContextKey = key;
    publicRules.active = new Set(clean);
    return clean;
  }


  async function ensureActiveRulesContext(preserveSelection = false) {
    const key = chatContextKey();
    if (key === publicRules.activeContextKey) return;
    const wanted = preserveSelection ? new Set(publicRules.selected) : null;
    await loadActiveRulesForCurrentChat();
    if (wanted) publicRules.selected = wanted;
    line('Chat context changed; public SOLO active-state baseline reloaded.', 'DEBUG');
  }

  function renderPublicRules(parent) {
    el('div','solo-section-label','PUBLIC SOLO RULES',parent);
    btn('List Public SOLO Rules from GitHub','Discover every public file whose name starts with _RULES_SOLOLAST_',listPublicRules,parent,'solo-primary solo-wide');
    const hint = el('div','solo-hint','Live GitHub Contents API · prefix: _RULES_SOLOLAST_',parent);
    hint.title = REPO_URL;
    if (!publicRules.items.length) {
      el('p','solo-hint solo-guidance','Click List Public SOLO Rules from GitHub to discover the current public SOLOLAST files.',parent);
      return;
    }

    const list = el('div','solo-rule-list',null,parent);
    for (const rule of publicRules.items) {
      const selected = publicRules.selected.has(rule.name);
      const row = el('label',`solo-rule-row${selected ? ' solo-rule-selected' : ''}`,null,list);
      row.title = rule.name;
      row.setAttribute('aria-selected', selected ? 'true' : 'false');
      const checkbox = el('input','solo-rule-check',null,row);
      checkbox.type = 'checkbox';
      checkbox.checked = selected;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) publicRules.selected.add(rule.name);
        else publicRules.selected.delete(rule.name);
        render();
      });
      const text = el('span','solo-rule-text',null,row);
      const name = el('strong','solo-rule-name',displayRuleName(rule.name),text);
      name.title = rule.name;
      const metaText = `${rule.version || 'version unknown'} · ${humanBytes(rule.size || 0)} · ${String(rule.sha || '').slice(0,10)}`;
      const meta = el('span','solo-rule-meta',metaText,text);
      meta.title = `Version / size / Git blob: ${metaText}`;
    }
    const row = el('div','solo-actions solo-rule-actions',null,parent);
    btn('Select All','Select every listed public SOLO rule',()=>{publicRules.selected=new Set(publicRules.items.map(r=>r.name));render();},row,'solo-secondary');
    btn('Clear','Clear public SOLO rule selection',()=>{publicRules.selected.clear();render();},row,'solo-secondary');
    const apply = btn(`Apply Selected (${publicRules.selected.size})`,'Synchronize the selected public SOLO rules with the current ChatGPT conversation',applySelectedPublicRules,row,'solo-primary');
    apply.disabled = (publicRules.selected.size === 0 && publicRules.active.size === 0) || publicRules.applying;
  }

  function contentSection(parent) {
    el('div','solo-section-label','ACCOUNT CUSTOM INSTRUCTIONS',parent);
    btn('Update Account Custom Instructions','Fetch the current SOLOLAST Custom Instructions through the GitHub Contents API',fetchCI,parent,'solo-primary solo-wide');
    const hint = el('div','solo-hint','Current GitHub blob · read-only source',parent);
    hint.title = RAW_URL;
    if (ci.text) {
      const stampText = ci.fetchedAt ? new Date(ci.fetchedAt).toLocaleTimeString('en-GB',{hour12:false}) : 'now';
      el('div','solo-section-label',`PREVIEW · ${ci.sourceVersion || 'version unknown'} · ${ci.text.length} chars · ${stampText}`,parent);
      const area = el('textarea','solo-preview',null,parent);
      area.value = ci.text;
      area.readOnly = true;
      area.setAttribute('aria-label','Latest fetched Custom Instructions preview');
      const row = el('div','solo-actions',null,parent);
      btn('Apply CI (Session)','Update account CI automatically using the signed-in ChatGPT session',applyCI,row,'solo-primary');
      btn('Copy CI','Copy fetched Custom Instructions',copyCI,row,'solo-secondary');
    } else {
      el('p','solo-hint solo-guidance','Fetch the current account instructions first. Nothing is modified automatically.',parent);
    }

    renderPublicRules(parent);

    const row = el('div','solo-actions',null,parent);
    btn('About','About this release',toggleAbout,row,'solo-secondary');
    linkButton('GitHub SOLO','Open public SOLO rules on GitHub',REPO_URL,row,'solo-secondary');
    const about = el('div','solo-about',null,parent);
    about.id = 'noxoz-solo-about';
    about.hidden = true;
    about.textContent = `NoXoZ SOLO Control Center v${VERSION}. Personal-use extension. This release implements the working Account Custom Instructions manager plus dynamic public SOLO rule discovery and desired-state synchronization in the current chat. Selected rules become the requested active set; rules deselected after a previous Apply are explicitly deactivated for future replies. Public discovery is live from GitHub and no public rule list is hard-coded. Private rules and local folder selection remain for later releases.`;
  }

  function renderMini() {
    const body = el('div','solo-mini-body',null,root);
    btn('Update Custom Instructions','Fetch the latest public account Custom Instructions',fetchCI,body,'solo-primary solo-wide');
    if (ci.text) {
      btn('Apply CI','Update account CI automatically via signed-in session',applyCI,body,'solo-primary solo-wide');
      btn('Copy CI','Copy Custom Instructions',copyCI,body,'solo-wide');
    }
    btn('Public Rules','Open Maxi and list current public SOLO rules from GitHub',async()=>{setView(ui.view,'maxi');await listPublicRules();},body,'solo-primary solo-wide');
    if (publicRules.selected.size || publicRules.active.size) btn(`Apply Rules (${publicRules.selected.size})`,'Synchronize the selected public SOLO rules with the current chat',applySelectedPublicRules,body,'solo-primary solo-wide');
    statusBar(body,true);
    addAttribution(body);
    addDonate(body);
  }
  function renderMaxi() {
    statusBar(root);
    content = el('div','solo-content',null,root);
    contentSection(content);
    footer = el('div','solo-footer',null,root);
    addDonate(footer);
    if (isDev()) {
      const head = el('div','solo-dev-head',null,footer);
      el('strong','', 'DEVELOPER MODE',head);
      btn('Copy Log','Copy current session DEBUG log',copyLogs,head,'solo-dev-log-btn');
      btn('Save Log','Save current session DEBUG log as .log file',saveLogs,head,'solo-dev-log-btn');
      logOutput = el('pre','solo-dev-log',events.join('\n'),footer);
    }
    addHandles();
  }
  function render() {
    if (!root) return;
    root.replaceChildren();
    root.className = '';
    root.classList.add('noxoz-solo-floating');
    root.classList.toggle('solo-hidden', !panelVisible);
    statusArea = null;
    logOutput = null;
    createTop();
    if (isMini()) renderMini(); else renderMaxi();
    setGeometry();
  }

  function toggleAbout() {
    const panel = root.querySelector('#noxoz-solo-about');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    line(panel.hidden?'About hidden':'About displayed');
  }
  function messageAsync(message) {
    return new Promise((resolve,reject) => {
      try {
        chrome.runtime.sendMessage(message, result => {
          const error = chrome.runtime.lastError;
          if (error) return reject(new Error(error.message));
          resolve(result);
        });
      } catch (e) { reject(e); }
    });
  }
  async function fetchCI() {
    if (ci.busy) return;
    ci.busy = true;
    // Fail closed: never leave a previously fetched CI preview eligible for Apply
    // when a newer fetch is underway or has failed.
    ci.text = null;
    ci.sourceVersion = null;
    ci.fetchedAt = null;
    ci.cacheAge = null;
    status('Fetching latest public CI...','busy');
    render();
    try {
      line('New GitHub Contents API request: no-store + unique cache-buster; current main blob required.', 'DEBUG');
      const result = await messageAsync({type:'SOLO_GET_CI'});
      if (!result?.ok) throw new Error(result?.error || 'No response from background worker.');
      ci.text = result.text;
      ci.url = result.url;
      ci.fetchedAt = result.fetchedAt;
      const parsed = ci.text.match(/(?:CUSTOM INSTRUCTIONS\s+SOLO|\bCI)\s*0*(\d{1,5})\b/i);
      ci.sourceVersion = result.sourceVersion || (parsed ? `CI${parsed[1].padStart(3,'0')}` : null);
      ci.cacheAge = result.cacheAge || null;
      const sourceSha = result.sourceSha ? result.sourceSha.slice(0,12) : 'n/a';
      line(`Fetched ${ci.text.length} characters from current SOLOLAST blob; version=${ci.sourceVersion || 'unknown'}, blob=${sourceSha}, fetched=${ci.fetchedAt}`, 'DEBUG');
      // SOLOLAST is the authority, regardless of the historical CI revision
      // number. A new fetch replaces any older preview, including rollbacks.
      status(`CI loaded: ${ci.sourceVersion || 'version unknown'} · preview before replacement`, 'success');
      render();
    } catch (error) { status(`CI fetch failed: ${error.message}`,'error');render(); }
    finally {ci.busy = false;}
  }
  async function listPublicRules() {
    if (publicRules.busy) return;
    await ensureActiveRulesContext(false);
    publicRules.busy = true;
    const previousSelected = new Set(publicRules.selected);
    publicRules.items = [];
    publicRules.commitSha = null;
    status('Listing current public SOLO rules...','busy');
    render();
    try {
      const result = await messageAsync({type:'SOLO_LIST_PUBLIC_RULES'});
      if (!result?.ok) throw new Error(result?.error || 'No response from GitHub rule discovery.');
      const available = new Set(result.rules.map(rule => rule.name));
      publicRules.selected = new Set([...previousSelected].filter(name => available.has(name)));
      publicRules.items = result.rules;
      publicRules.listedAt = result.fetchedAt;
      publicRules.commitSha = result.commitSha;
      line(`Public rule discovery: ${result.rules.length} file(s), commit=${String(result.commitSha || '').slice(0,12)}.`, 'DEBUG');
      for (const rule of result.rules) line(`Rule listed: ${rule.name}, version=${rule.version || 'unknown'}, blob=${String(rule.sha || '').slice(0,12)}, bytes=${rule.size}.`, 'DEBUG');
      status(`Public SOLO rules listed: ${result.rules.length}.`,'success');
    } catch (error) {
      publicRules.items = [];
      publicRules.selected.clear();
      publicRules.commitSha = null;
      status(`Public SOLO list failed: ${error.message}`,'error');
    } finally {
      publicRules.busy = false;
      render();
    }
  }

  function buildPublicRulesStateSyncPrompt(rules, commitSha, previousActiveNames, desiredNames) {
    const previous = new Set(previousActiveNames);
    const desired = new Set(desiredNames);
    const ruleMap = new Map(rules.map(rule => [rule.name, rule]));
    const added = [...desired].filter(name => !previous.has(name));
    const kept = [...desired].filter(name => previous.has(name));
    const removed = [...previous].filter(name => !desired.has(name));

    const describe = names => names.length ? names.map(name => `- ${name}`).join('\n') : '- none';
    const addedSources = added.map((name,index) => {
      const rule = ruleMap.get(name);
      if (!rule) return `${index + 1}. ${name}\n   Metadata unavailable; do not claim this rule was loaded.`;
      return [
        `${index + 1}. ${rule.name}`,
        `   Detected version: ${rule.version || 'unknown'}`,
        `   Git blob SHA: ${rule.sha}`,
        `   Immutable GitHub source: ${rule.blobUrl}`
      ].join('\n');
    }).join('\n');

    return [
      'Synchronize the active public SOLO rule set for THIS CURRENT CHAT.',
      '',
      'This message is an explicit user request. The selected rules below are the complete desired active public SOLO set after this action.',
      '',
      'RULES TO DEACTIVATE / UNLOAD FOR FUTURE REPLIES:',
      describe(removed),
      '',
      'For every rule listed above, stop applying its instructions from this point forward. Do not use those deselected SOLO rules for future replies unless the user explicitly selects/applies them again. Historical chat messages remain in the conversation; this is a functional deactivation, not deletion of chat history.',
      '',
      'RULES TO KEEP ACTIVE WITHOUT RELOADING:',
      describe(kept),
      '',
      'Do not reload rules in the KEEP list. They are already active in this chat.',
      '',
      'RULES TO LOAD / APPLY NOW:',
      addedSources || '- none',
      '',
      'For each rule in the LOAD/APPLY list, open the exact immutable GitHub source, read the COMPLETE file, and apply its instructions to this current conversation. Do not rely on a cached earlier revision. Do not claim a rule is loaded unless you actually read it fully.',
      '',
      'DESIRED ACTIVE PUBLIC SOLO SET AFTER THIS ACTION:',
      describe([...desired]),
      '',
      `GitHub main commit selected by the extension: ${commitSha || 'not required for unload-only action'}`,
      '',
      'After processing, confirm the rules that were newly loaded, kept active, and deactivated. Do not reapply deselected rules.'
    ].join('\n');
  }

  function findChatComposer() {
    const selectors = [
      '#prompt-textarea',
      '[data-testid="prompt-textarea"]',
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[placeholder*="Message" i]',
      'textarea[placeholder*="Ask" i]',
      'textarea[placeholder*="Envoyer" i]'
    ];
    for (const selector of selectors) {
      for (const node of document.querySelectorAll(selector)) {
        if (!visible(node) || root?.contains(node) || node.closest('[role="dialog"]')) continue;
        return node;
      }
    }
    return null;
  }

  const composerText = node => {
    if (!node) return '';
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) return node.value || '';
    return node.innerText || node.textContent || '';
  };

  async function sendPromptToCurrentChat(text) {
    const composer = await waitFor(findChatComposer, 3500);
    if (!composer) throw new Error('ChatGPT composer was not found.');
    if (composerText(composer).trim()) throw new Error('ChatGPT composer is not empty. Send or clear the current draft first.');
    const beforeMessages = document.querySelectorAll('[data-message-author-role="user"]').length;
    writeText(composer, text);
    await sleep(180);
    const sendButton = await waitFor(() => {
      const candidates = [
        ...document.querySelectorAll('button[data-testid="send-button"]'),
        ...document.querySelectorAll('button[aria-label*="Send" i],button[aria-label*="Envoyer" i]')
      ];
      return candidates.find(button => visible(button) && !button.disabled && !root?.contains(button)) || null;
    }, 1800);
    if (sendButton) sendButton.click();
    else {
      composer.focus();
      composer.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
      composer.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
    }
    const confirmed = await waitFor(() => {
      const nowMessages = document.querySelectorAll('[data-message-author-role="user"]').length;
      return nowMessages > beforeMessages || !composerText(composer).trim();
    }, 4500);
    if (!confirmed) throw new Error('ChatGPT did not confirm that the Apply request was sent.');
  }

  async function applySelectedPublicRules() {
    if (publicRules.applying) return;
    await ensureActiveRulesContext(true);
    const names = [...publicRules.selected];
    const previousActive = [...publicRules.active];
    if (!names.length && !previousActive.length) return status('Select at least one public SOLO rule.','error');

    const desired = new Set(names);
    const previous = new Set(previousActive);
    const added = names.filter(name => !previous.has(name));
    const removed = previousActive.filter(name => !desired.has(name));
    const kept = names.filter(name => previous.has(name));

    publicRules.applying = true;
    status(`Synchronizing public SOLO state: ${names.length} active · ${removed.length} unload...`,'busy');
    render();
    try {
      let result = {ok:true, rules:[], commitSha:null};
      if (names.length) {
        result = await messageAsync({type:'SOLO_PREPARE_PUBLIC_RULES', names});
        if (!result?.ok) throw new Error(result?.error || 'Could not refresh selected public SOLO rules.');
        for (const rule of result.rules) line(`Apply source refreshed: ${rule.name}, version=${rule.version || 'unknown'}, blob=${String(rule.sha || '').slice(0,12)}, bytes=${rule.size}.`, 'DEBUG');
      }

      const prompt = buildPublicRulesStateSyncPrompt(result.rules || [], result.commitSha, previousActive, names);
      await sendPromptToCurrentChat(prompt);
      await sleep(300);
      await saveActiveRulesForCurrentChat(names);
      status(`SOLO state synchronized: ${names.length} active · ${removed.length} deactivated.`,'success');
      line(`Active SOLO state sync sent: added=${added.length}, kept=${kept.length}, removed=${removed.length}, desired=${names.length}, commit=${String(result.commitSha || '').slice(0,12) || 'n/a'}.`, 'DEBUG');
      if (removed.length) line(`Deactivated: ${removed.join(', ')}`, 'DEBUG');
      if (added.length) line(`Newly requested: ${added.join(', ')}`, 'DEBUG');
    } catch (error) {
      status(`Public SOLO Apply failed: ${error.message}`,'error');
    } finally {
      publicRules.applying = false;
      render();
    }
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text);return true; }
    catch {
      const node = el('textarea','solo-copy-buffer',null,root);
      node.value = text;
      node.select();
      const ok = document.execCommand('copy');
      node.remove();
      if (!ok) throw new Error('Clipboard access blocked by the browser.');
      return true;
    }
  }
  async function copyCI() {
    if (!ci.text) return status('Fetch CI first.','error');
    try {await copyText(ci.text); status('CI copied to clipboard.','success');}
    catch (error) {status(`Copy failed: ${error.message}`,'error');}
  }
  async function copyLogs() {
    try {await copyText(events.join('\n'));line('DEBUG log copied to clipboard.', 'DEBUG');status('Developer log copied.','success');}
    catch (error) {status(`Log copy failed: ${error.message}`,'error');}
  }
  async function saveLogs() {
    try {
      line('Save Log requested.', 'DEBUG');
      const result = await messageAsync({type:'SOLO_SAVE_DEBUG_LOG',content:events.join('\n')});
      if (!result?.ok) throw new Error(result?.error || 'Log download was not accepted.');
      line(`Log download accepted: ${result.filename}`, 'DEBUG');
      status(`Save Log requested: ${result.filename}`, 'success');
    } catch (error) {status(`Save Log failed: ${error.message}`, 'error');}
  }
  async function reloadExtension() {
    status('Reloading extension and ChatGPT tabs...', 'busy');
    line('Reload Ext clicked. DEBUG log will reset when this tab reloads.', 'DEBUG');
    try {
      // Exactly the ordering used by the working ChatGPT Export extension:
      // store the pending tab-refresh marker first, then request runtime.reload.
      // Waiting for the storage write prevents a lost marker on worker teardown.
      await chrome.storage.local.set({'noxoz.solo.pendingReload': {time:Date.now()}});
      const response = await messageAsync({type:'SOLO_DEV_RELOAD'});
      if (!response?.ok) throw new Error(response?.error || 'Reload was rejected.');
      line('Reload acknowledged; new runtime will refresh ChatGPT tabs.', 'DEBUG');
    } catch (e) {
      // If the message fails, do not leave a stale reload marker.
      try { await chrome.storage.local.remove('noxoz.solo.pendingReload'); } catch {}
      status(`Reload failed: ${e.message}`, 'error');
    }
  }

  // Interact only with visible, non-extension ChatGPT controls.
  const visible = e => {
    if (!(e instanceof HTMLElement) || root?.contains(e)) return false;
    const cs = window.getComputedStyle(e);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  };
  const norm = s => (s || '').trim().replace(/\s+/g,' ').toLowerCase();
  const elementLabel = e => norm([e.getAttribute('aria-label'),e.getAttribute('title'),e.textContent].filter(Boolean).join(' '));
  const choose = (nodes, re) => [...nodes].filter(visible).find(e => re.test(elementLabel(e)));
  const clickable = (re) => choose(document.querySelectorAll('button,[role="button"],[role="menuitem"],[role="tab"]'),re);
  const clickNode = node => {if (!node) return false;node.click();return true;};
  const findAny = re => choose(document.querySelectorAll('button,[role="button"],[role="menuitem"],[role="tab"]'),re);
  const waitFor = async (factory, timeout=3400) => {
    const started = Date.now();
    while (Date.now()-started < timeout) {
      const found = factory(); if (found) return found;
      await sleep(110);
    }
    return null;
  };
  async function openSettingsUI() {
    // First detect already-open Custom Instructions panels.
    if (findCustomTarget().length) return 'existing';
    // A direct route is not guaranteed; open account menu, then Settings / Customize ChatGPT.
    const profile = choose(document.querySelectorAll('button,[role="button"],a'),/^(?:profile|account|user menu|open profile menu|open account menu|settings and help)/i)
      || [...document.querySelectorAll('button,[role="button"]')].filter(visible).find(e=>
        /profile|account|user-menu|sidebar-bottom|user-button/i.test([e.getAttribute('data-testid'),e.getAttribute('id'),e.className].join(' ')));
    if (profile) { clickNode(profile); line('Clicked account/profile menu.'); await sleep(240); }
    let settings = await waitFor(() => findAny(/^(?:settings|paramètres|customize chatgpt|personnaliser chatgpt)(?:$|\s)/i),2400);
    if (!settings) {
      // Some ChatGPT layouts show their account menu as a button with the account name.
      const side = [...document.querySelectorAll('nav button, aside button, [data-testid*="sidebar"] button')]
        .filter(visible).filter(e => !/new chat|search|projects|upgrade|library/i.test(elementLabel(e)));
      const last = side.at(-1);
      if (last) {clickNode(last);await sleep(220);settings = await waitFor(() => findAny(/^(?:settings|paramètres|customize chatgpt)(?:$|\s)/i),1700);}
    }
    if (!settings) throw new Error('Could not open account Settings. Open Settings > Personalization > Custom instructions manually, then click Apply CI again.');
    clickNode(settings);line('Clicked ChatGPT Settings.');await sleep(220);
    if (findCustomTarget().length) return 'opened';
    const personalization = await waitFor(() => findAny(/^(?:personalization|personalisation)(?:$|\s)/i),3500);
    if (personalization) {clickNode(personalization);line('Opened Personalization.');await sleep(210);}
    if (findCustomTarget().length) return 'opened';
    const custom = await waitFor(() => findAny(/custom instructions|customize chatgpt|instructions personnalisées|instructions personnalis/),3500);
    if (custom) {clickNode(custom);line('Opened Custom Instructions editor.');await sleep(210);}
    return 'opened';
  }
  function findCustomTarget() {
    // Restrict to visible settings/dialog textareas. Never target the ChatGPT message composer.
    const dialogs = [...document.querySelectorAll('[role="dialog"],dialog,[data-testid*="settings"],[data-testid*="personalization"]')].filter(visible);
    // Never use the normal ChatGPT composer as a fallback. Without a settings panel,
    // stop rather than risk replacing a chat prompt or unrelated textbox.
    let editors = dialogs.flatMap(d => [...d.querySelectorAll('textarea,[role="textbox"],[contenteditable="true"]')]);
    editors = editors.filter(visible).filter(e => !/prompt|composer|message input|ask chatgpt|send message/i.test([
      e.getAttribute('data-testid'), e.getAttribute('placeholder'), e.getAttribute('aria-label'), e.id].join(' ')));
    // Some settings render as a single textarea before Custom Instructions dialog is shown.
    return [...new Set(editors)];
  }
  const writeText = (element, value) => {
    element.focus();
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(
        element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,'value').set;
      setter.call(element,value);
      try {element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));}
      catch {element.dispatchEvent(new Event('input',{bubbles:true}));}
    } else if (element.isContentEditable) {
      // ChatGPT's composer is currently a contenteditable editor. Prefer a native
      // edit command because framework editors observe that event path more
      // reliably than a direct textContent assignment. Fall back safely.
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      let inserted = false;
      try { inserted = document.execCommand('insertText', false, value); } catch {}
      if (!inserted) {
        element.textContent = value;
        try {element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:value}));}
        catch {element.dispatchEvent(new Event('input',{bubbles:true}));}
      }
      selection.removeAllRanges();
    } else throw new Error('Unsupported editable field.');
    element.dispatchEvent(new Event('change',{bubbles:true}));
  };
  const valueOf = e => 'value' in e ? e.value : e.textContent;
  async function applyCI() {
    if (!ci.text || ci.busy) return status('Fetch CI first.','error');
    const expectedText = ci.text;
    if (!window.confirm(`Replace your ChatGPT account Custom Instructions with ${ci.sourceVersion || 'the fetched SOLOLAST'} from GitHub? No backup is created.`)) {
      status('CI replacement cancelled.','ready');return;
    }
    ci.busy = true;
    status('Checking current SOLOLAST and authenticated ChatGPT session...','busy');
    try {
      line('Session-based apply: refreshing the current GitHub Contents object and using page-origin authenticated request.', 'DEBUG');
      const result = await messageAsync({type:'SOLO_APPLY_CI_SESSION', expectedText});
      if (result?.changed && result?.latest?.text) {
        ci.text = result.latest.text;
        ci.sourceVersion = result.latest.sourceVersion;
        ci.fetchedAt = result.latest.fetchedAt;
        ci.cacheAge = result.latest.cacheAge;
        line(`SOLOLAST changed before Apply: new version=${ci.sourceVersion || 'unknown'}; account not modified.`, 'WARN');
        status('SOLOLAST changed. Review fresh preview, then click Apply again.','warning');
        render(); return;
      }
      if (!result?.ok) {
        line(`Authenticated PATCH refused: stage=${result?.stage || 'unknown'}, authMethod=${result?.authMethod || 'n/a'}.`, 'DEBUG');
        throw new Error(result?.error || 'The authenticated update was refused.');
      }
      line(`Authenticated PATCH accepted: authMethod=${result.authMethod || 'n/a'}, independentlyVerified=${!!result.verified}, overwriteFallback=${!!result.overwriteFallbackUsed}.`, 'DEBUG');
      if (result.verified) {
        status(`Account CI overwritten and verified: ${ci.sourceVersion || 'SOLOLAST'}. Reloading page...`,'success');
        line('PATCH accepted; GET read-back matched BOTH CI fields. Reloading ChatGPT page so the updated account CI is active in the page session.', 'DEBUG');
        setTimeout(() => window.location.reload(), 500);
      } else {
        status(`Server accepted CI ${ci.sourceVersion || ''}; read-back unavailable. Check account settings.`,'warning');
        line(result.note || 'PATCH echoed exact text; independent verification unavailable.', 'WARN');
      }
    } catch (error) {
      status(`Authenticated CI update failed: ${error.message}`,'error');
    } finally {ci.busy = false;}
  }

  function attachDrag(handle) {
    handle.addEventListener('pointerdown', ev => {
      if (ev.button !== 0 || ev.target.closest('button,a')) return;
      const m = isMini()?ui.mini:ui[ui.view];
      const origin = {px:ev.clientX,py:ev.clientY,x:m.x,y:m.y};
      handle.setPointerCapture(ev.pointerId);
      const move = e => {m.x=origin.x+e.clientX-origin.px;m.y=origin.y+e.clientY-origin.py;setGeometry();};
      const up = () => {handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);saveLayout();};
      handle.addEventListener('pointermove',move);
      handle.addEventListener('pointerup',up);
      handle.addEventListener('pointercancel',up);
    });
  }
  function addHandles() {
    for (const edge of ['n','s','e','w','ne','nw','se','sw']) {
      const handle = el('div',`solo-resize solo-resize-${edge}`,null,root);
      handle.dataset.edge = edge;
      handle.setAttribute('aria-hidden','true');
      handle.addEventListener('pointerdown', ev => {
        if (ev.button !== 0 || isMini()) return;
        ev.stopPropagation();ev.preventDefault();
        const m = ui[ui.view], start={x:ev.clientX,y:ev.clientY,...m};
        const minW = 230;
        const minH = 260;
        handle.setPointerCapture(ev.pointerId);
        const move = e => {
          const dx=e.clientX-start.x,dy=e.clientY-start.y,b=bounds();
          if (edge.includes('e')) m.w=clamp(start.w+dx,minW,b.w-start.x-VIEWPORT_MARGIN);
          if (edge.includes('s')) m.h=clamp(start.h+dy,minH,b.h-start.y-VIEWPORT_MARGIN);
          if (edge.includes('w')) {
            const w=clamp(start.w-dx,minW,start.x+start.w-VIEWPORT_MARGIN);
            m.x=start.x+start.w-w;m.w=w;
          }
          if (edge.includes('n')) {
            const h=clamp(start.h-dy,minH,start.y+start.h-VIEWPORT_MARGIN);
            m.y=start.y+start.h-h;m.h=h;
          }
          setGeometry();
        };
        const up = () => {
          ui.user.w = ui.developer.w = m.w;
          ui.user.h = ui.developer.h = m.h;
          handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',up);handle.removeEventListener('pointercancel',up);saveLayout();
        };
        handle.addEventListener('pointermove',move);
        handle.addEventListener('pointerup',up);
        handle.addEventListener('pointercancel',up);
      });
    }
  }
  async function init() {
    // A reload can leave an orphaned panel until the ChatGPT tab refreshes.
    const stalePanel = document.getElementById(ROOT_ID);
    if (stalePanel) {stalePanel.remove();line('Removed an orphaned panel from the old extension context.','DEBUG');}
    root = el('section','noxoz-solo-floating',null,document.documentElement);
    root.id=ROOT_ID;
    root.setAttribute('aria-label','NoXoZ SOLO Control Center');
    await loadLayout();
    await loadActiveRulesForCurrentChat();
    // Initial layout always opens Maxi flush right; users can still drag it.
    const rightX = Math.max(VIEWPORT_MARGIN, window.innerWidth - ui.user.w - VIEWPORT_MARGIN);
    ui.user.x = ui.developer.x = rightX;
    line(`SOLO Control Center v${VERSION} initialized; new in-memory Developer DEBUG session.`, 'DEBUG');
    line('Account CI and public SOLO GitHub sources ready; only user-click operations permitted.');
    render();
    window.addEventListener('resize',setGeometry,{passive:true});
  }
  const initPromise = init();
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!['SOLO_TOGGLE_UI','SOLO_SHOW_UI','SOLO_HIDE_UI'].includes(message?.type)) return false;
    // Acknowledgement is essential to the Export-style recovery algorithm.
    initPromise.then(() => {
      if (!root || !root.isConnected) throw new Error('Floating panel is missing.');
      const before = panelVisible;
      if (message.type === 'SOLO_TOGGLE_UI') panelVisible = !panelVisible;
      else panelVisible = message.type === 'SOLO_SHOW_UI';
      root.classList.toggle('solo-hidden', !panelVisible);
      if (panelVisible) setGeometry();
      line(`Toolbar ${message.type}: ${before ? 'visible' : 'hidden'} -> ${panelVisible ? 'visible' : 'hidden'}`, 'DEBUG');
      sendResponse({ok:true,visible:panelVisible,version:VERSION});
    }).catch(error => sendResponse({ok:false,error:String(error.message || error)}));
    return true;
  });
  initPromise.catch(e => console.error('[NoXoZ SOLO]',e));
})();

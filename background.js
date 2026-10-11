/*
################################################################################
# SCRIPT INFORMATION
################################################################################
# Script Name       : background.js
# Script Path       : /background.js
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Description       : MV3 current-blob CI plus dynamic public SOLO rule discovery/preparation for desired-state synchronization.
# Changelog         : V3.0.0 - Support public SOLO desired-state synchronization/unload workflow; preserve fresh GitHub reads.
#                     V2.0.2 - Preserve authoritative version parsing; UI-only public-rule selection/compactness release.
#                     V2.0.1 - Fix public SOLO version detection by reading authoritative metadata fields only.
#                     V2.0.0 - Discover and refresh _RULES_SOLOLAST_* dynamically from an immutable GitHub main snapshot.
#                     V1.0.7 - Resolve SOLOLAST through GitHub Contents API current blob SHA; no stale RAW preview.
#                     V1.0.6 - Fix false-positive CI verification; require visible+traits fields and fallback overwrite.
#                     V1.0.5 - Allow server-normalized trailing line breaks and read-back verification; fix DEBUG startup version.
#                     V1.0.4 - Retry failed account PATCH/GET 401 with transient same-origin session accessToken.
#                     V1.0.3 - Authenticated CI update via active ChatGPT session, read-back verification.
#                     V1.0.2 - Follow ChatGPT Export reload/toolbar recovery, remove CI floor, reset session logs.
#                     V1.0.1 - Fix toolbar recovery, extension/tab reload, CI CDN freshness,
#                     and downloadable DEBUG diagnostic logs.
#                     V1.0.0 - First clean personal-use POC.
################################################################################
*/
'use strict';

const VERSION = '3.0.0';
const CI_RAW_URL = 'https://raw.githubusercontent.com/bdelnoz/regles_contextualisation/main/_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md';
const CI_API_URL = 'https://api.github.com/repos/bdelnoz/regles_contextualisation/contents/_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md';
const MAX_CI_BYTES = 30000;
const REPO_OWNER = 'bdelnoz';
const REPO_NAME = 'regles_contextualisation';
const RULE_PREFIX = '_RULES_SOLOLAST_';
const RULES_ROOT_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;
const MAIN_REF_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`;
const MAX_RULE_BYTES = 800000;
const MAX_RULE_SELECTION = 32;
const PENDING_RELOAD_KEY = 'noxoz.solo.pendingReload';
const CHAT_URLS = ['https://chatgpt.com/*', 'https://chat.openai.com/*'];
const isChatGPT = url => /^https:\/\/(?:chatgpt\.com|chat\.openai\.com)(?:\/|$)/.test(url || '');
const debug = (...args) => console.debug(`[SOLO Control v${VERSION}]`, ...args);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// The exact SOLOLAST alias is resolved from GitHub's Contents API on every
// button press. The API response carries the current blob SHA and file bytes,
// so the extension does not trust a previously cached raw.githubusercontent.com
// object. A failed fresh lookup clears the preview and fails closed.
async function getFreshCI(sender) {
  const sourcePage = sender.url || sender.tab?.url || sender.origin || '';
  if (!isChatGPT(sourcePage)) throw new Error('Requests are allowed only from ChatGPT tabs.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const requestUrl = `${CI_API_URL}?ref=main&solo_cache_bust=${encodeURIComponent(cacheBuster)}`;
  try {
    debug('Fetching current SOLOLAST through GitHub Contents API.');
    const response = await fetch(requestUrl, {
      method: 'GET', cache: 'no-store', credentials: 'omit', redirect: 'error', signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) throw new Error(`GitHub Contents API returned HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload || payload.type !== 'file' || payload.encoding !== 'base64' || typeof payload.content !== 'string')
      throw new Error('GitHub Contents API returned an unexpected SOLOLAST object.');
    const compact = payload.content.replace(/\s+/g, '');
    const binary = atob(compact);
    const rawBytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    const content = new TextDecoder('utf-8', {fatal:true}).decode(rawBytes);
    const bytes = new TextEncoder().encode(content).length;
    if (!content.trim() || bytes > MAX_CI_BYTES) throw new Error('Custom Instructions source is empty or larger than 30 KB.');
    if (!/^[0-9a-f]{40}$/i.test(payload.sha || '')) throw new Error('GitHub did not return a valid current blob SHA.');
    const version = content.match(/(?:CUSTOM INSTRUCTIONS\s+SOLO|\bCI)\s*0*(\d{1,5})\b/i);
    debug(`GitHub current blob: sha=${payload.sha.slice(0,12)}, bytes=${bytes}, version=${version ? version[1] : 'unknown'}`);
    return {
      ok: true,
      text: content,
      url: CI_RAW_URL,
      fetchedAt: new Date().toISOString(),
      sourceVersion: version ? `CI${String(version[1]).padStart(3,'0')}` : null,
      sourceSha: payload.sha,
      cacheAge: null,
      sourceTransport: 'github-contents-api'
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateChatGPTSender(sender) {
  const sourcePage = sender.url || sender.tab?.url || sender.origin || '';
  if (!isChatGPT(sourcePage)) throw new Error('Requests are allowed only from ChatGPT tabs.');
}

async function githubJSON(url, label) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const separator = url.includes('?') ? '&' : '?';
    const requestUrl = `${url}${separator}solo_cache_bust=${encodeURIComponent(`${Date.now()}-${Math.random().toString(36).slice(2)}`)}`;
    const response = await fetch(requestUrl, {
      method:'GET', cache:'no-store', credentials:'omit', redirect:'error', signal:controller.signal,
      headers:{
        'Accept':'application/vnd.github+json',
        'X-GitHub-Api-Version':'2022-11-28',
        'Cache-Control':'no-cache, no-store, max-age=0',
        'Pragma':'no-cache'
      }
    });
    if (!response.ok) throw new Error(`${label} returned HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timeout); }
}

function decodeGithubFile(payload, maxBytes, label) {
  if (!payload || payload.type !== 'file' || payload.encoding !== 'base64' || typeof payload.content !== 'string')
    throw new Error(`${label} returned an unexpected file object.`);
  const compact = payload.content.replace(/\s+/g,'');
  const binary = atob(compact);
  const rawBytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
  const content = new TextDecoder('utf-8',{fatal:true}).decode(rawBytes);
  const bytes = new TextEncoder().encode(content).length;
  if (!content.trim() || bytes > maxBytes) throw new Error(`${label} is empty or larger than ${Math.round(maxBytes/1024)} KB.`);
  if (!/^[0-9a-f]{40}$/i.test(payload.sha || '')) throw new Error(`${label} has no valid Git blob SHA.`);
  return {content, bytes};
}

function normalizeRuleVersionToken(name, token) {
  const upper = String(token || '').trim().toUpperCase();
  if (!upper) return null;

  const prefixed = upper.match(/^(CTX|SCRIPT|OP|SOLO)(\d{1,5})$/);
  if (prefixed) return `${prefixed[1]}${prefixed[2]}`;

  const v = upper.match(/^V(\d{1,5})$/);
  if (v) {
    if (name.includes('_CONTEXTUALISATION')) return `CTX${v[1]}`;
    return `V${v[1]}`;
  }

  const bare = upper.match(/^(\d{1,5})$/);
  if (bare) {
    if (name.includes('_CONTEXTUALISATION')) return `CTX${bare[1]}`;
    if (name.includes('_SCRIPTING') || name.includes('_RULESOPERATOR')) return `SOLO${bare[1]}`;
    return `V${bare[1]}`;
  }

  return null;
}

function detectRuleVersion(name, content) {
  const head = content.slice(0,16000);
  const metadataPatterns = [
    /^\s*(?:\*\*)?\s*Version\s*(?:\*\*)?\s*[:=]\s*(?:\*\*)?\s*(SOLO\d+|CTX\d+|OP\d+|SCRIPT\d+|V\d+|\d+)\b/im,
    /^\s*(?:\*\*)?\s*Nom canonique\s*(?:\*\*)?\s*[:=]\s*(?:\*\*)?\s*(SOLO\d+|CTX\d+|OP\d+|SCRIPT\d+|V\d+|\d+)\b/im,
    /^\s*(?:\*\*)?\s*Version actuelle\s*(?:\*\*)?\s*[:=]\s*(?:\*\*)?\s*(SOLO\d+|CTX\d+|OP\d+|SCRIPT\d+|V\d+|\d+)\b/im
  ];

  for (const pattern of metadataPatterns) {
    const match = head.match(pattern);
    if (match) return normalizeRuleVersionToken(name, match[1]);
  }

  return null;
}

async function getMainCommitSha(sender) {
  validateChatGPTSender(sender);
  const payload = await githubJSON(MAIN_REF_API, 'GitHub main ref');
  const sha = payload?.object?.sha;
  if (!/^[0-9a-f]{40}$/i.test(sha || '')) throw new Error('GitHub main ref did not return a valid commit SHA.');
  return sha;
}

function validatePublicRuleName(name) {
  return typeof name === 'string' && name.startsWith(RULE_PREFIX) && !name.includes('/') && !name.includes('\\') && name.length <= 180;
}

async function getRuleAtCommit(name, commitSha) {
  if (!validatePublicRuleName(name)) throw new Error(`Invalid public SOLO rule name: ${String(name)}`);
  const encodedName = encodeURIComponent(name);
  const payload = await githubJSON(`${RULES_ROOT_API}/${encodedName}?ref=${encodeURIComponent(commitSha)}`, `GitHub rule ${name}`);
  const decoded = decodeGithubFile(payload, MAX_RULE_BYTES, `Public SOLO rule ${name}`);
  return {
    name,
    version:detectRuleVersion(name, decoded.content),
    sha:payload.sha,
    size:decoded.bytes,
    commitSha,
    blobUrl:`https://github.com/${REPO_OWNER}/${REPO_NAME}/blob/${commitSha}/${encodedName}`
  };
}

async function listPublicRules(sender) {
  const commitSha = await getMainCommitSha(sender);
  const root = await githubJSON(`${RULES_ROOT_API}?ref=${encodeURIComponent(commitSha)}`, 'GitHub repository root');
  if (!Array.isArray(root)) throw new Error('GitHub repository root did not return a file list.');
  const names = root
    .filter(item => item?.type === 'file' && typeof item.name === 'string' && item.name.startsWith(RULE_PREFIX))
    .map(item => item.name)
    .sort((a,b)=>a.localeCompare(b));
  const rules = [];
  for (const name of names) rules.push(await getRuleAtCommit(name, commitSha));
  debug(`Public SOLO discovery: ${rules.length} file(s) at main ${commitSha.slice(0,12)}.`);
  return {ok:true, rules, commitSha, fetchedAt:new Date().toISOString(), prefix:RULE_PREFIX};
}

async function preparePublicRules(sender, names) {
  validateChatGPTSender(sender);
  if (!Array.isArray(names) || names.length < 1 || names.length > MAX_RULE_SELECTION)
    throw new Error(`Select between 1 and ${MAX_RULE_SELECTION} public SOLO rules.`);
  const unique = [...new Set(names)];
  if (unique.length !== names.length || unique.some(name => !validatePublicRuleName(name)))
    throw new Error('Invalid or duplicate public SOLO rule selection.');
  const commitSha = await getMainCommitSha(sender);
  const rules = [];
  for (const name of unique) rules.push(await getRuleAtCommit(name, commitSha));
  debug(`Prepared ${rules.length} public SOLO rule(s) from main ${commitSha.slice(0,12)}.`);
  return {ok:true, rules, commitSha, fetchedAt:new Date().toISOString()};
}

async function sendToTab(tabId, message) {
  const response = await chrome.tabs.sendMessage(tabId, message);
  if (!response?.ok) throw new Error(response?.error || 'Content script did not acknowledge the action.');
  return response;
}

// Matches the tested ChatGPT Export model: reinject a fresh content script when
// the old one disappeared or its extension context became invalid after reload.
// ChatGPT Export v7.0.0 behavior: allow the new content script to finish
// initialization before sending SHOW after a reinjection. This is not a reload.
async function sendWithRetry(tabId, message, attempts = 24, delayMs = 200) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { return await sendToTab(tabId, message); }
    catch (error) { lastError = error; if (attempt < attempts) await sleep(delayMs); }
  }
  throw lastError || new Error('CONTENT_SCRIPT_NOT_READY');
}

async function injectIntoTab(tabId) {
  // Recovery is invoked only after the old content script failed to respond.
  // Clear its old bootstrap sentinel so reinjecting the same extension version
  // can recover too (not only a version update).
  await chrome.scripting.executeScript({target:{tabId}, func:() => {
    document.getElementById('noxoz-solo-rc-root')?.remove();
    delete window.__NOXOZ_SOLO_POC_V102__;
    delete window.__NOXOZ_SOLO_POC_V103__;
    delete window.__NOXOZ_SOLO_POC_V104__;
    delete window.__NOXOZ_SOLO_POC_V106__;
    delete window.__NOXOZ_SOLO_POC_V107__;
    delete window.__NOXOZ_SOLO_POC_V200__;
    delete window.__NOXOZ_SOLO_POC_V300__;
  }});
  await chrome.scripting.insertCSS({target: {tabId}, files: ['solo-style.css']});
  await chrome.scripting.executeScript({target: {tabId}, files: ['content-solo.js']});
  debug(`Injected fresh content script into ChatGPT tab ${tabId}`);
}

async function handleToolbarClick(tab) {
  if (!Number.isInteger(tab?.id) || !isChatGPT(tab?.url)) return;
  try {
    const result = await sendToTab(tab.id, {type: 'SOLO_TOGGLE_UI', version: VERSION});
    debug(`Toolbar toggled tab ${tab.id}: visible=${result.visible}`);
  } catch (error) {
    debug(`Toolbar recovery on tab ${tab.id}: ${error.message}`);
    try {
      await injectIntoTab(tab.id);
      const result = await sendWithRetry(tab.id, {type: 'SOLO_SHOW_UI', version: VERSION});
      debug(`Toolbar recovered tab ${tab.id}: visible=${result.visible}`);
    } catch (inner) {
      console.error(`[SOLO Control v${VERSION}] Toolbar recovery failed on tab ${tab.id}`, inner);
    }
  }
}
chrome.action.onClicked.addListener(handleToolbarClick);

// Mirrors ChatGPT Export: a session-local pending marker is set by the UI
// before the worker acknowledges the reload, then the new worker refreshes
// ChatGPT tabs and lets their content scripts initialize from scratch.
let reloadPendingCheck = null;
async function recoverAfterExtensionReload() {
  if (reloadPendingCheck) return reloadPendingCheck;
  reloadPendingCheck = (async () => {
    const data = await chrome.storage.local.get(PENDING_RELOAD_KEY);
    const flag = data[PENDING_RELOAD_KEY];
    if (!flag?.time) return;
    // Prevent stale markers from refreshing tabs days later.
    await chrome.storage.local.remove(PENDING_RELOAD_KEY);
    if (Date.now() - flag.time > 120000) {debug('Stale reload marker ignored.'); return;}
    debug('Reload marker detected. Refreshing ChatGPT tabs with new content scripts.');
    const tabs = await chrome.tabs.query({url: CHAT_URLS});
    for (const tab of tabs) {
      if (!Number.isInteger(tab?.id)) continue;
      try {await chrome.tabs.reload(tab.id);debug(`Reloaded ChatGPT tab ${tab.id}`);}
      catch (error) {console.error(`[SOLO Control v${VERSION}] Could not refresh tab ${tab.id}`,error);}
    }
  })().catch(error => console.error(`[SOLO Control v${VERSION}] Post-reload tab refresh failed`,error))
    .finally(() => {reloadPendingCheck = null;});
  return reloadPendingCheck;
}
chrome.runtime.onInstalled.addListener(() => {void recoverAfterExtensionReload();});
// Service workers can start without onInstalled after browser restarts.
setTimeout(() => {void recoverAfterExtensionReload();}, 500);

// The authenticated account update runs exclusively in the FIRST-PARTY
// ChatGPT MAIN world. Cookie-based requests are attempted first. A verified
// HTTP 401 is retried only once with the accessToken returned by the active
// same-origin session endpoint; this token is used ONLY in this function's
// memory, never stored, logged, exported or returned to the extension worker.
// Requests target a fixed SAME-ORIGIN path and never follow redirects.
// This is an undocumented website API; failures never claim account changes.
async function updateCIInAuthenticatedPage(expectedText) {
  'use strict';
  const readJSON = async (response, stage) => {
    if (response.status === 401 || response.status === 403)
      return {error: `ChatGPT rejected ${stage} (HTTP ${response.status}).`};
    if (!response.ok) return {error: `${stage} returned HTTP ${response.status}.`};
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('application/json'))
      return {error: `${stage} did not return JSON; sign in to ChatGPT.`};
    try {return {data: await response.json()};}
    catch {return {error:`${stage} returned invalid JSON.`};}
  };
  try {
    if (location.origin !== 'https://chatgpt.com')
      return {ok:false, stage:'origin', error:'Open this extension on https://chatgpt.com/ while signed in.'};
    if (typeof expectedText !== 'string' || expectedText.length < 10 || expectedText.length > 30000)
      return {ok:false, stage:'input', error:'CI text was rejected before modification.'};

    const sessionResponse = await fetch('/api/auth/session', {
      method:'GET', credentials:'include', cache:'no-store', redirect:'error',
      headers:{'Accept':'application/json'}
    });
    const sessionResult = await readJSON(sessionResponse, 'ChatGPT session');
    if (sessionResult.error) return {ok:false, stage:'session', error:sessionResult.error};
    const accountId = sessionResult.data?.account?.id;
    if (typeof accountId !== 'string' || !accountId.trim())
      return {ok:false, stage:'session', error:'No active ChatGPT account ID. Sign in and retry.'};

    // Only the account ID has been inspected. Read the transient access token
    // if (and only if) an initial cookie-based request fails with HTTP 401.
    // Never access sessionToken or forward account/session data to the worker.
    const fixedPath = '/backend-api/user_system_messages';
    const accountHeaders = {'Accept':'application/json','chatgpt-account-id':accountId};
    const invoke = async (method, body, dualField = false) => {
      const headers = method === 'PATCH'
        ? {...accountHeaders,'Content-Type':'application/json'}
        : {...accountHeaders};
      const opts = {method, credentials:'include', cache:'no-store', redirect:'error', headers};
      if (method === 'PATCH') {
        // First attempt mirrors the captured ChatGPT request exactly:
        // traits_model_message only. If ChatGPT echoes traits but leaves the
        // visible about_model_message stale, a guarded second PATCH writes
        // both fields to force a real overwrite.
        opts.body = JSON.stringify(dualField
          ? {traits_model_message:body, about_model_message:body}
          : {traits_model_message:body});
      }
      let response = await fetch(fixedPath,opts);
      let authMethod = 'cookies';
      // A 401 is a refusal. Inspect the transient session access token only
      // now, and retry once with it against the same origin without redirects.
      if (response.status === 401) {
        const temporaryToken = sessionResult.data?.accessToken;
        if (typeof temporaryToken === 'string' && temporaryToken.length > 20) {
          response = await fetch(fixedPath,{
            ...opts,
            headers:{...headers,'Authorization':`Bearer ${temporaryToken}`}
          });
          authMethod = 'ephemeral-session-bearer-retry';
        }
      }
      return {response,authMethod};
    };

    // ChatGPT may remove trailing newline characters when storing CI text.
    // Accept ONLY terminal line-break normalization, not whitespace/content
    // differences elsewhere. The HAR shows a 1934-char request and a
    // 1933-char response differing solely by a final LF.
    const stripTerminalLineBreaks = text => text.replace(/(?:\r?\n)+$/u, '');
    const sameCI = (returned, submitted) =>
      typeof returned === 'string' &&
      (returned === submitted || stripTerminalLineBreaks(returned) === stripTerminalLineBreaks(submitted));

    // The captured successful manual response contains BOTH
    // traits_model_message and about_model_message with the same CI text.
    // V1.0.5 checked only traits_model_message and could therefore report a
    // false positive while the visible Custom Instructions field stayed stale.
    const fieldsMatch = data => ({
      traits: sameCI(data?.traits_model_message, expectedText),
      about: sameCI(data?.about_model_message, expectedText)
    });
    const acceptedBoth = state => state.traits && state.about;

    let patch = await invoke('PATCH',expectedText,false);
    let patchResult = await readJSON(patch.response,'Account CI PATCH');
    if (patchResult.error) {
      const detail = patch.response.status === 401
        ? (patch.authMethod === 'ephemeral-session-bearer-retry'
          ? 'Cookie request and ephemeral session Bearer retry were both rejected (HTTP 401).'
          : 'Cookie request was rejected (HTTP 401); no usable runtime session access token was provided.')
        : patchResult.error;
      return {ok:false, stage:'patch', authMethod:patch.authMethod, error:detail};
    }

    let patchFields = fieldsMatch(patchResult.data);
    let overwriteFallbackUsed = false;

    // If the legacy/internal traits field changed but the visible model field
    // did not, force an overwrite of both CI representations. This fallback is
    // used only after a successful first PATCH response proves divergence.
    if (!acceptedBoth(patchFields)) {
      overwriteFallbackUsed = true;
      const fallback = await invoke('PATCH',expectedText,true);
      const fallbackResult = await readJSON(fallback.response,'Account CI overwrite PATCH');
      if (fallbackResult.error) {
        return {ok:false, stage:'overwrite-patch', authMethod:fallback.authMethod,
          traitsMatched:patchFields.traits, aboutMatched:patchFields.about,
          error:`Initial PATCH did not synchronize both CI fields; overwrite fallback failed: ${fallbackResult.error}`};
      }
      patch = fallback;
      patchResult = fallbackResult;
      patchFields = fieldsMatch(patchResult.data);
      if (!acceptedBoth(patchFields))
        return {ok:false, stage:'overwrite-compare', authMethod:patch.authMethod,
          traitsMatched:patchFields.traits, aboutMatched:patchFields.about,
          error:'ChatGPT accepted the overwrite request but did not return both CI fields with the requested content.'};
    }

    const returnedTraits = patchResult.data?.traits_model_message;
    const returnedAbout = patchResult.data?.about_model_message;
    const serverNormalizedTerminalNewline =
      returnedTraits !== expectedText || returnedAbout !== expectedText;

    // A PATCH echo is not enough. Independently GET the object and require
    // BOTH fields to match before saying "verified".
    try {
      const check = await invoke('GET');
      const checkResult = await readJSON(check.response,'Account CI read-back');
      if (checkResult.error) return {ok:true, verified:false, patchConfirmed:true,
        authMethod:patch.authMethod, overwriteFallbackUsed,
        traitsMatched:true, aboutMatched:true, serverNormalizedTerminalNewline,
        note:`PATCH synchronized both CI fields, but independent read-back was unavailable: ${checkResult.error}`};

      const readBackFields = fieldsMatch(checkResult.data);
      if (acceptedBoth(readBackFields))
        return {ok:true, verified:true, patchConfirmed:true,
          authMethod:patch.authMethod, overwriteFallbackUsed,
          traitsMatched:true, aboutMatched:true, serverNormalizedTerminalNewline,
          note:'Account CI verified by GET: both traits_model_message and about_model_message match.'};

      return {ok:false, stage:'read-back', authMethod:patch.authMethod,
        overwriteFallbackUsed, traitsMatched:readBackFields.traits, aboutMatched:readBackFields.about,
        error:'Independent GET did not return the requested CI in both account fields. Update is not verified.'};
    } catch {
      return {ok:true, verified:false, patchConfirmed:true,
        authMethod:patch.authMethod, overwriteFallbackUsed,
        traitsMatched:true, aboutMatched:true, serverNormalizedTerminalNewline,
        note:'PATCH synchronized both CI fields; independent read-back failed (network or unsupported API).'};
    }
  } catch (error) {
    // Never include exception details, headers, account ID or token in logs.
    return {ok:false,stage:'network',error:`Browser request failed: ${String(error?.name || 'NetworkError')}.`};
  }
}

let applyingCI = false;
async function applyAuthenticatedCI(sender, expectedText) {
  if (applyingCI) throw new Error('Another CI update is currently running.');
  if (sender.frameId !== 0 || !Number.isInteger(sender.tab?.id) ||
      !/^https:\/\/chatgpt\.com(?:\/|$)/.test(sender.tab?.url || ''))
    throw new Error('Authenticated updates are allowed only from the main chatgpt.com tab.');
  if (typeof expectedText !== 'string' || expectedText.length < 10 || expectedText.length > MAX_CI_BYTES)
    throw new Error('Invalid preview content. Fetch CI first.');
  applyingCI = true;
  try {
    // A second mandatory fetch before any account write closes the gap between
    // preview and application. The user must review a changed version first.
    const latest = await getFreshCI(sender);
    if (latest.text !== expectedText)
      return {ok:false,changed:true,latest, error:'SOLOLAST changed since preview. Review the updated CI and click Apply again.'};
    const executions = await chrome.scripting.executeScript({
      target:{tabId:sender.tab.id, frameIds:[0]}, world:'MAIN',
      func:updateCIInAuthenticatedPage, args:[latest.text]
    });
    const result = executions?.[0]?.result;
    if (!result || typeof result.ok !== 'boolean')
      throw new Error('ChatGPT page did not return a valid CI update result.');
    debug('Authenticated CI update result:', {ok:result.ok,verified:!!result.verified,stage:result.stage || null,authMethod:result.authMethod || 'n/a'});
    return result;
  } finally {applyingCI = false;}
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;
  if (message.type === 'SOLO_GET_CI') {
    getFreshCI(sender).then(sendResponse)
      .catch(error => {debug('CI fetch failed:', error.message);sendResponse({ok:false,error:String(error.message || error)});});
    return true;
  }
  if (message.type === 'SOLO_APPLY_CI_SESSION') {
    applyAuthenticatedCI(sender, message.expectedText).then(sendResponse)
      .catch(error => sendResponse({ok:false,error:String(error.message || error)}));
    return true;
  }
  if (message.type === 'SOLO_LIST_PUBLIC_RULES') {
    listPublicRules(sender).then(sendResponse)
      .catch(error => {debug('Public SOLO discovery failed:', error.message);sendResponse({ok:false,error:String(error.message || error)});});
    return true;
  }
  if (message.type === 'SOLO_PREPARE_PUBLIC_RULES') {
    preparePublicRules(sender, message.names).then(sendResponse)
      .catch(error => {debug('Public SOLO preparation failed:', error.message);sendResponse({ok:false,error:String(error.message || error)});});
    return true;
  }
  if (message.type === 'SOLO_DEV_RELOAD') {
    if (!isChatGPT(sender.url || sender.tab?.url || sender.origin || '')) {
      sendResponse({ok:false,error:'Reload is available only from a ChatGPT tab.'});
      return false;
    }
    // Same acknowledged-then-reload lifecycle as ChatGPT Export. The content
    // script already wrote a pending marker before requesting this action.
    sendResponse({ok:true, version:VERSION});
    debug('Developer Reload Ext acknowledged; restarting extension runtime.');
    setTimeout(() => chrome.runtime.reload(), 150);
    return false;
  }
  if (message.type === 'SOLO_SAVE_DEBUG_LOG') {
    if (!isChatGPT(sender.url || sender.tab?.url || sender.origin || '')) {
      sendResponse({ok:false,error:'Log save is allowed only from a ChatGPT tab.'});
      return false;
    }
    const log = typeof message.content === 'string' ? message.content : '';
    if (!log || log.length > 250000) {
      sendResponse({ok:false,error:'Diagnostic log is empty or above the 250 KB limit.'});
      return false;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g,'-');
    const filename = `NoXoZ_SOLO_Control_Center_v${VERSION}_DEBUG_${stamp}.log`;
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(log)}`;
    chrome.downloads.download({url, filename, saveAs: true})
      .then(downloadId => sendResponse({ok:true, filename, downloadId}))
      .catch(error => sendResponse({ok:false,error:`Save Log failed: ${error.message}`}));
    return true;
  }
  return false;
});

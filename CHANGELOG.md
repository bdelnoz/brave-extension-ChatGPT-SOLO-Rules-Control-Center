<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
# Document Name     : CHANGELOG.md
# Document Path     : /CHANGELOG.md
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Short Description : Release history — newest first
# Change History    : V3.0.0 (2026-10-11) - Add desired-state public SOLO synchronization/unload and compact Maxi labels/layout.
#                     V2.0.2 (2026-10-11) - Add visible selected-rule blue state and compact one-line rule metadata.
#                     V2.0.1 (2026-10-11) - Fix public SOLO active-version detection from authoritative metadata.
#                     V2.0.0 (2026-10-11) - Dynamic public SOLO rule discovery and current-chat Apply.
#                     V1.0.7 (2026-10-11) - Stable account Custom Instructions baseline.
################################################################################
-->

# CHANGELOG

## v3.0.0 — 2026-10-11 — Desired-state public SOLO synchronization and functional unload

### Added

- **Functional rule unload/deactivation:** the checked public rules now represent the complete desired active public SOLO set for the current chat. Rules that were previously active but are later deselected are explicitly instructed to stop applying for future replies.
- **State difference calculation:** each Apply computes newly selected, kept-active and deselected rule sets. Kept rules are not reloaded; newly selected rules use fresh immutable GitHub sources.
- **Unload all:** if public SOLO rules were previously active through the extension, `Apply Selected (0)` can deactivate the whole managed public set.
- **Per-chat active-state memory:** only public SOLO filenames are stored for the current ChatGPT conversation path so later Apply actions can calculate load/keep/deactivate differences.

### Changed

- Maxi button label changed to **Update Account Custom Instructions**.
- Public discovery button changed to **List Public SOLO Rules from GitHub**.
- Reduced vertical spacing between Status and Account Custom Instructions in Maxi User and Maxi Developer.
- About/README/specifications now describe Apply as desired-state synchronization rather than additive-only loading.

### Preserved

- Stable account Custom Instructions behavior from V1.0.7 and later fixes.
- Live GitHub discovery, authoritative version parsing, selected-row blue highlighting, one-line rule metadata, 261px right-aligned Maxi geometry, Mini, toolbar toggle, Reload Ext, Donate, GitHub SOLO and Developer-only logs.
- GitHub READ ONLY STRICT.

## v2.0.2 — 2026-10-11 — Public SOLO Rule Selection Visibility and Compact Layout

### Fixed

- Selected public SOLO rules now change the entire rule row to a clearly different blue state immediately when checked; selection is no longer visible only through the checkbox/Apply counter.
- Public rule metadata is now displayed on the same line as the family name: family/name on the left, version / byte size / abbreviated Git blob SHA on the right. This reduces vertical space and keeps the rule list readable in the compact 261px Maxi layout.
- The V2.0.1 authoritative version parser is preserved unchanged, so current metadata resolves CTX239 / SOLO135 / SOLO420 rather than historical body references.

### Regression scope

- No change to GitHub discovery, Apply Selected semantics, Account CI, Mini/Maxi geometry, toolbar toggle, Reload Ext, Donate, or Developer-only logging.

## v2.0.1 — 2026-10-11 — Public SOLO Version Detection Fix

### Fixed

- Fixed Contextualisation being displayed as `CTX238` while the selected `_RULES_SOLOLAST_CONTEXTUALISATION.md` explicitly declares `Version : V239`.
- Version detection now reads only authoritative metadata fields (`Version`, `Nom canonique`, `Version actuelle`) near the document header.
- Historical references such as `CTX238` inside a V239 summary/body can no longer override the active version.
- The immutable Git commit/blob selection logic is unchanged; this was a parser/display/prompt-metadata defect, not stale GitHub content.

### Regression scope

- No change to Account CI behavior, GitHub discovery, Apply Selected, layout, toolbar toggle, Reload Ext, Donate, or Developer-only logging.

## v2.0.0 — 2026-10-11 — Dynamic Public SOLO Rules

### Added

- **List Public SOLO Rules**: live GitHub repository-root discovery of every public file whose filename starts exactly with `_RULES_SOLOLAST_`. No family list is hard-coded.
- Consistent GitHub snapshot: discovery is pinned to the current `main` commit SHA and each listed rule is read at that exact immutable commit.
- Rule checkboxes, Select All, Clear and **Apply Selected**.
- Displayed rule metadata: detected version, byte size and abbreviated Git blob SHA.
- Apply-time freshness: the current `main` commit and every selected rule are fetched again immediately before the current-chat Apply request.
- Current-chat automation: Apply writes and sends a purpose-built message through the ChatGPT composer containing immutable GitHub sources for the selected rules. An existing unsent composer draft blocks Apply instead of being overwritten.
- Mini `Public Rules` action opens Maxi and performs live discovery.

### Changed

- Developer diagnostics now run only while **Maxi Developer** is active. User and Mini modes no longer accumulate hidden DEBUG history.
- CI source labels now describe the GitHub Contents/current-blob mechanism used by the stable V1.0.7 implementation.
- About/README/SPECIFICATIONS updated to describe only currently implemented V2.0.0 functionality.

### Preserved

- Entire validated V1.0.7 Custom Instructions workflow, page refresh, toolbar toggle, Reload Ext, Mini/Maxi layout, right alignment, resizing, Copy CI, GitHub SOLO, Donate, Copy Log and Save Log.
- GitHub remains strictly read-only. No private rule content is included.

---

# Changelog — NoXoZ SOLO Control Center

## v1.0.7 — 2026-10-11 — Fresh current blob and post-update page reload

### Fixed

- **Fresh SOLOLAST on every Update Account CI click:** the extension now resolves `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md` through GitHub's Contents API with `ref=main`, `cache: no-store`, explicit no-cache headers and a unique request URL. The returned **current Git blob SHA** and Base64 file bytes are used directly. A stale previous preview is never reused when this lookup fails.
- **Apply re-check uses the same current-blob source:** Apply still performs its mandatory second source read before any account write. If the blob/content changed after preview, the account is not modified and the new preview must be reviewed first.
- **Automatic ChatGPT page refresh after verified overwrite:** once PATCH and independent GET confirm both Custom Instructions fields, the current ChatGPT page reloads automatically after a short delay so the page session picks up the updated account instructions.
- **Diagnostics:** DEBUG records the first 12 characters of the Git blob SHA, never the CI body, cookies or tokens.

### Preserved

- Authenticated overwrite, dual-field verification, transient Bearer retry only after 401, right-aligned 261px Maxi User/Developer, Mini, toolbar toggle, Reload Ext, Copy CI, GitHub SOLO, Donate, About, Copy Log and Save Log.


## v1.0.6 — 2026-10-11 — Real overwrite verification

### Fixed

- **Confirmed V1.0.5 false positive:** the extension could report `updated and verified` when `traits_model_message` matched the requested SOLOLAST content while the visible account Custom Instructions remained unchanged.
- **Dual-field verification:** PATCH and independent GET are now evaluated against both `traits_model_message` and `about_model_message`. The release may say **verified** only when both contain the requested CI text, allowing only terminal CR/LF normalization.
- **Overwrite fallback:** the first PATCH continues to mirror the captured manual ChatGPT request (`traits_model_message` only). If the response proves the two CI representations diverge, one guarded fallback PATCH sends the reviewed CI text to both fields before independent read-back.
- **Diagnostics:** DEBUG reports whether the guarded overwrite fallback was needed, without logging CI bodies, session tokens, cookies or account identifiers.

### Preserved

- Fresh GitHub `SOLOLAST` fetch before preview and before Apply, explicit owner confirmation, authenticated same-origin request flow, optional transient Bearer retry after 401, Mini / Maxi User / Maxi Developer, 261px right-aligned Maxi layouts, toolbar toggle, Reload Ext, Copy CI, GitHub SOLO, Donate, About, Copy Log and Save Log.
- Public package remains free of HAR files, `.private/`, `.docs/`, WHY and TEST_REPORT.

### Validation boundary

- The V1.0.6 logic is tested against simulated responses for: both fields already synchronized, traits-only divergence, guarded dual-field overwrite success, overwrite refusal, and read-back mismatch. Live persistence still depends on ChatGPT's undocumented internal API.

## v1.0.5 — 2026-10-11 — Server-normalized CI response and truthful DEBUG version

### Fixed

- **CI PATCH false failure:** a recorded successful `PATCH /backend-api/user_system_messages` response contains one fewer character than the submitted CI because ChatGPT strips its terminal LF. Compare requested and returned `traits_model_message` exactly, except for **terminal line-break characters only**; all other changes continue to be rejected. A 200 response is not automatically considered a verified account update.
- **Independent GET verification:** apply the same restricted terminal-line-break equivalence to GET read-back. Report **updated and verified** only if the independent GET matches, using this equivalence. Report **PATCH echoed expected content, read-back unavailable** if GET fails or is unsupported; no false independent-verification claim.
- **Developer DEBUG startup:** use the `VERSION` constant instead of the stale literal `v1.0.3`. Manifest, header and UI now report `v1.0.5` consistently.

### Preserved

- Entire v1.0.4 authenticated page-origin PATCH, optional ephemeral Bearer retry after 401, secure no-token logging, fresh RAW download on every action, confirmation, Mini, compact right-aligned Maxi User/Developer, toolbar toggle, Reload Ext, Copy CI, Donate, About, GitHub SOLO, DEBUG and Copy/Save Log.
- The full append-only release history below. No HAR, session token, `.private/`, `.docs/`, WHY or test report in this public package.

### Validation boundary

- The captured manual HAR proves that ChatGPT may strip one final LF while accepting the update with HTTP 200. Automated tests cover this behavior and disagreement scenarios. Real v1.0.5 authenticated persistence is **not** yet confirmed in the owner's Brave browser.

## v1.0.4 — 2026-10-11 — Authenticated CI HTTP 401 fallback

### Fixed

- **Account CI HTTP 401:** after the confirmed v1.0.3 error, allow one retry with the **runtime `accessToken` from the already-signed-in same-origin `/api/auth/session` response**, but only when the first cookie-authenticated PATCH receives HTTP 401. No hard-coded token, persistence, logging, exports or GitHub transmission. The fallback uses `Authorization: Bearer` only toward `https://chatgpt.com/backend-api/user_system_messages`; redirects are rejected.
- **Independent GET verification:** retry the read-back once on HTTP 401 with the same temporary session access token, if one is available. A successful PATCH is never reported as independently verified when GET fails.
- **Diagnostics:** annotate results with the non-sensitive authentication path (cookies or transient Bearer retry) and distinguish continued HTTP 401 from a verified write.

### Preserved

- All v1.0.3 layout and behavior: 261px right-aligned Maxi User/Developer, Mini, toolbar toggle, Reload Ext, always-fresh GitHub SOLOLAST, CI preview/confirm, Copy CI, Donate, GitHub SOLO, DEBUG/Copy Log/Save Log.
- Original README, specifications and prior release history. No WHY, TEST_REPORT, private folders or user HAR data in the release.

### Validation boundary

- Static checks and mocked authenticated requests are tested. The actual ChatGPT internal API response **must be verified in the owner's signed-in Brave session**. The HAR showed a successful first-party PATCH without a visible Bearer header, so the Bearer retry is an **experimental fallback, not an established requirement**.

## v1.0.3 — 2026-10-11 — Authenticated account CI and shared compact Maxi layout

### Added

- **Apply CI (Session):** on explicit confirmation, fetch the live `SOLOLAST` again, check that it matches the visible preview, and run the authenticated account PATCH directly in the active ChatGPT tab (same-origin browser cookies; no hard-coded tokens, token extraction, or credential storage).
- **Account verification:** compare the exact `traits_model_message` returned by PATCH, then attempt independent GET read-back. Report when GET read-back is unavailable or differs, instead of inventing success.
- **Session and error handling:** check active account using `/api/auth/session`; handle missing session, HTTP 401/403, unsupported internal API, changed source between preview and apply, and rejected server response. No automatic backup in this personal POC.

### Fixed

- **Shared compact Maxi size:** User and Developer open at the same 261 x 600 px (20% smaller width than former User 326 px), pinned to the browser's right side on mode switches; drag and 8-way resize remain available.
- **GitHub SOLO:** opens the public `bdelnoz/regles_contextualisation` rules repository, not the extension repository.
- **No manual settings navigation:** the Apply action no longer depends on locating the Settings button in the page DOM; **Copy CI** remains available upon owner request.

### Retained

- All existing Mini / Maxi User / Maxi Developer features, blue branding and icons, Reload Ext, toolbar show/hide recovery, Donate, About, DEBUG/Copy Log/Save Log, fresh GitHub reads and full prior changelog below.

### Validation caveat

- Static and offline simulated Chromium checks can validate request logic and UI, but only testing in a signed-in Brave session can establish that ChatGPT currently accepts this unofficial authenticated endpoint. Session tokens from the provided HAR are never embedded in the extension.

## v1.0.2 — 2026-10-11 — Dynamic SOLOLAST and export-aligned lifecycle

### Fixed

- **Latest account CI:** each click performs a fresh GitHub RAW request for `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md`, cache-busted and with `no-store`. The retrieved file determines the CI revision; no CI005 hard-coded minimum or CI004 block. A failed fetch never leaves the previous preview eligible for replacement.
- **Reload Extension:** followed ChatGPT Export's acknowledgement/reload and post-start tab-refresh ordering. The temporary marker is created before asking the worker to reload; restarted content scripts get a clean session.
- **Toolbar click:** use the same send / reinject / retry model as ChatGPT Export when the content script was invalidated.
- **DEBUG logs:** diagnostics run throughout the session, reset automatically on extension/tab reload or browser restart, never persist between sessions, and offer separate Copy Log / Save Log actions.
- **Compact/window controls:** right and left chevrons replace the round expand/collapse arrows.

### Packaging

- Removed `WHY.md` and `TEST_REPORT.md` from the delivered ZIP at the owner's direction. Developer test results remain outside all public deliverables.
- Documentation remains in English. Full prior release history below is preserved.

### Validation

- Node JavaScript syntax, JSON parsing, archive integrity, script lifecycle simulations and headless Chromium UI smoke checks. Live signed-in Brave settings integration remains unverified.

## v1.0.1 — 2026-10-11 — Critical lifecycle and debug fixes

### Fixed

- **Toolbar icon show/hide:** tab messaging now waits for an acknowledgement, detects missing/invalidated content scripts, reinjects CSS/JS when necessary, and explicitly reopens the panel; repeat clicks reliably toggle visibility on an active script.
- **Developer Reload Ext:** the MV3 worker acknowledges the action, stores a short-lived pending-reload marker, calls `chrome.runtime.reload()`, then refreshes ChatGPT tabs when the new worker initializes. This prevents orphaned content scripts after reload.
- **Fresh CI GitHub RAW:** uses a unique query string on each fetch in addition to `cache: no-store`, displays the detected source version and response cache age in verbose logs, and refuses to replace account instructions with CI004 when CI005+ is expected.
- **Stale CI fail-closed:** beginning a new fetch clears the previous preview; failed requests cannot leave old CI text eligible for Apply.
- **Developer diagnostics:** DEBUG console traces, separate **Copy Log** and **Save Log** buttons; saved logs are user-initiated `.log` downloads with a browser Save dialog.

### Preserved

- Three existing UI modes, blue branding/icon set, all original settings automation safeguards, Support/Donate, About/GitHub, window geometry and eight resize handles.
- Source and private rule policies; no GitHub write operations or private asset export.

### Validation

- Node syntax, JSON manifest, scripted background tests of the reload/toggle/recovery/cache-bust/download lifecycle, and headless Chromium offline UI mock.
- Still unverified: live Brave/ChatGPT authenticated page integration and actual server persistence of Custom Instructions.

## v1.0.0 — 2026-10-11 — First personal-use POC

### Added

- First installable Chromium Manifest V3 extension from an empty baseline.
- Toolbar S action toggles the floating panel on ChatGPT tabs.
- Three independent views: Mini, Maxi User, Maxi Developer, with persisted geometry and eight-direction Maxi resizing.
- Updated blue branding and original `S` toolbar icons from Branding v0.2.0.
- GitHub RAW read-only downloader for the verified `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md` source.
- Visible CI preview, explicit replacement confirmation, guarded settings navigation, editable-field ambiguity check, Save attempt with honest status, and Copy CI fallback.
- About and GitHub navigation; donated Stripe link identical to the provided ChatGPT Export v7.0.0 reference.
- Developer-only Reload Ext and temporary technical logs with Copy LOG.
- Public `README.md`, `SPECIFICATIONS.md`, `INSTALL.md`, `WHY.md`, `DONATE.md`, `PRIVACY.md`, and `TEST_REPORT.md`.

### Safety

- No remote GitHub writes, no private `.private/` content packaged or uploaded, no `.gitignore` replacement, no automatic account modification on extension startup, and no unsupported account-save success claim.

### Limitations

- UI automation depends on the current ChatGPT settings structure and must be verified with a signed-in test.
- Other SOLO management features remain outside this release.

*History begins with v1.0.0; there are no earlier functional releases of this project.*


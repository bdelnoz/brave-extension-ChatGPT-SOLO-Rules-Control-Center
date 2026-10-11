<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
# Document Name     : SPECIFICATIONS.md
# Document Path     : /SPECIFICATIONS.md
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Short Description : Implemented public specifications — v3.0.0
# Change History    : V3.0.0 (2026-10-11) - Define public SOLO desired-state synchronization/unload and revised Maxi labels/spacing.
#                     V2.0.2 (2026-10-11) - Selected-rule blue state and compact one-line metadata.
#                     V2.0.1 (2026-10-11) - Authoritative public SOLO version detection.
#                     V2.0.0 (2026-10-11) - Dynamic public SOLO discovery and Apply.
#                     V1.0.7 (2026-10-11) - Stable account Custom Instructions baseline.
################################################################################
-->

# NoXoZ SOLO Control Center — Implemented Specifications v3.0.0

This document describes only functionality implemented in the public V3.0.0 release. Historical brainstorming under the owner's local excluded `.docs/` directory is not a release specification.

## 1. Account Custom Instructions Manager

1. `Update Account Custom Instructions` must resolve the current `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md` through the GitHub Contents API on every click.
2. The extension must not trust a previous preview when a fresh lookup fails.
3. `Apply CI (Session)` must perform a second fresh lookup before account modification.
4. The signed-in ChatGPT session is used without hard-coded credentials. Runtime tokens are never persisted or logged.
5. A verified account update requires the stable server persistence checks from the V1.0.7 baseline and later fixes.
6. After a verified update, the active ChatGPT page reloads automatically.

## 2. Dynamic Public SOLO Rule Discovery

1. `List Public SOLO Rules from GitHub` queries the public GitHub repository live.
2. Discovery includes every file whose filename starts exactly with `_RULES_SOLOLAST_`.
3. Nothing is allowed before `_RULES`; no leading wildcard is part of the naming rule.
4. Everything after `_RULES_SOLOLAST_` is treated as the public rule identifier; known families are never hard-coded.
5. Root listing and rule reads are pinned to one current GitHub `main` commit SHA for a consistent snapshot.
6. The UI supports one, several or all selections through checkboxes.
7. Display metadata includes family/name, detected version, byte size and abbreviated blob SHA.
8. Version detection uses explicit metadata fields only (`Version`, `Nom canonique`, or `Version actuelle`). Historical prose must never override the active version.
9. A selected rule has an immediately visible alternate blue row state.
10. Rule rows remain vertically compact: name at left; version, size and blob metadata at right on the same line.

## 3. Desired-State Apply / Functional Unload

1. The current checkbox selection represents the **complete desired active public SOLO rule set** for the current ChatGPT conversation.
2. The extension tracks the public rule filenames previously applied through the extension for that conversation path.
3. On `Apply Selected`, the extension calculates three sets: newly selected, kept active, and deselected/deactivated.
4. Newly selected rules are resolved freshly from the current `main` commit before the request is sent.
5. The current chat request identifies exact filenames, detected versions, Git blob SHAs and immutable GitHub sources for newly loaded rules.
6. Rules already active and still selected are kept active without a reload.
7. Rules previously active but now deselected are explicitly instructed to stop applying for future replies.
8. Functional unload is contextual deactivation only; the extension does not delete historical messages or rewrite conversation history.
9. If a prior active set exists, an empty selection may be applied to deactivate all public SOLO rules managed by the extension.
10. After the Apply request is confirmed as sent, the desired active filename set becomes the extension's stored state for that chat path.
11. The extension does not claim that historical context has been physically removed.
12. If the ChatGPT composer contains an unsent draft, Apply must stop rather than overwrite it.
13. The extension never applies rules automatically at page load, browser start or extension reload.

## 4. Interface and diagnostics

1. Mini, Maxi User and Maxi Developer remain available.
2. Maxi User and Maxi Developer retain the stable shared right-aligned layout.
3. The status-to-content vertical gap is reduced in Maxi to preserve usable space.
4. Maxi label text uses `Update Account Custom Instructions` and `List Public SOLO Rules from GitHub`.
5. Mini provides compact access to Custom Instructions and Public Rules.
6. Developer logging runs only while Maxi Developer is active. User and Mini activity is not accumulated as hidden DEBUG history.
7. Copy Log and Save Log remain Developer-only.
8. GitHub SOLO opens the public `regles_contextualisation` repository.
9. Support/Donate and About remain available.

## 5. Explicit exclusions from V3.0.0

- Private `.private/` rule discovery.
- Local SOLO repository folder picker.
- Combined public/private selection.
- Explicit Reapply/RELOAD of already active rules.
- Persistent audit trail.
- Automatic rule application.

These items require later explicit development approval.

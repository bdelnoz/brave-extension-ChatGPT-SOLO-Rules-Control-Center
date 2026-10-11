<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
# Document Name     : README.md
# Document Path     : /README.md
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Short Description : NoXoZ SOLO Control Center — v3.0.0
# Change History    : V3.0.0 (2026-10-11) - Add desired-state public SOLO synchronization with functional unload/deactivation and compact Maxi wording/layout.
#                     V2.0.2 (2026-10-11) - Selected-rule blue state and compact one-line metadata.
#                     V2.0.1 (2026-10-11) - Authoritative public SOLO version detection.
#                     V2.0.0 (2026-10-11) - Dynamic public SOLO discovery and Apply.
#                     V1.0.7 (2026-10-11) - Stable account Custom Instructions baseline.
################################################################################
-->

# NoXoZ SOLO Control Center — v3.0.0

A compact floating control center for ChatGPT in Brave, Chromium and Google Chrome. The project is currently optimized for the owner's personal SOLO workflow.

## Implemented capabilities

### Account Custom Instructions

- **Update Account Custom Instructions** resolves `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md` from the current GitHub Contents API object on every click.
- Preview, explicitly apply, overwrite and verify the signed-in ChatGPT account Custom Instructions.
- Re-check GitHub immediately before account modification and automatically reload the ChatGPT page after verified persistence.
- Keep **Copy CI** as an explicit fallback.

### Public SOLO Rules from GitHub

- **List Public SOLO Rules from GitHub** discovers the repository root live and lists every public file whose filename starts exactly with `_RULES_SOLOLAST_`.
- The list is never hard-coded. A future `_RULES_SOLOLAST_*` file appears without an extension update.
- Each rule shows its detected version, byte size and abbreviated Git blob SHA on the same compact row as the rule name.
- Version detection reads explicit metadata fields (`Version`, `Nom canonique`, or `Version actuelle`) and never infers a version from historical text in the rule body.
- Selected rules are visibly highlighted in a stronger blue state.

### Apply Selected = desired active SOLO state

- The checked rules are treated as the **complete desired active public SOLO set** for the current chat.
- On Apply, the extension compares the current selection with the rule set previously applied through the extension in that chat.
- Newly selected rules are freshly resolved from the current GitHub `main` commit and referenced through immutable commit-pinned GitHub URLs.
- Rules that remain selected are explicitly kept active without being reloaded.
- Rules that were active but are now deselected are explicitly **deactivated/unloaded for future replies**.
- Functional unload does not delete historical chat messages; it tells the current chat to stop applying deselected SOLO rules from that point forward.
- If all rules are deselected while a prior active set exists, **Apply Selected (0)** can deactivate the entire public SOLO set.
- If the ChatGPT composer already contains a draft, Apply stops rather than overwriting it.

### Interface

- Mini, Maxi User and Maxi Developer.
- Maxi User and Maxi Developer share the same compact right-aligned geometry and resizing behavior.
- The gap between Status and Account Custom Instructions is reduced to save vertical space.
- Browser toolbar icon toggles the floating panel.
- `Reload Ext` remains Developer-only.
- **GitHub SOLO**, About and Support/Donate remain available.

### Developer logging

- Technical logs are active only while **Maxi Developer** is active.
- User and Mini modes do not accumulate hidden DEBUG events.
- Developer mode exposes **Copy Log** and **Save Log**.
- No CI body, access token or cookie is written to the diagnostic log.

## Persistent local state

The extension stores only non-sensitive UI geometry plus the filenames of the public SOLO rules last applied through the extension for the current ChatGPT conversation path. This state exists only to compute later keep/load/deactivate differences.

## Not implemented yet

Private SOLO rule discovery, local SOLO repository folder selection, combined public/private Apply, and explicit Reapply/RELOAD remain future user-approved iterations.

## GitHub policy

The extension reads the public SOLO repository only. It performs no GitHub write operation.

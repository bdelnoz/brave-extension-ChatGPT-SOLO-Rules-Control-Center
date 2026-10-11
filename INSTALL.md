<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
# Document Name     : INSTALL.md
# Document Path     : /INSTALL.md
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Short Description : Package and runtime validation notes
# Change History    : V3.0.0 (2026-10-11) - Add desired-state/unload validation and updated UI labels.
#                     V2.0.2 (2026-10-11) - Selected-rule blue state and compact one-line metadata.
#                     V2.0.1 (2026-10-11) - Authoritative public SOLO version detection.
#                     V2.0.0 (2026-10-11) - Dynamic public SOLO discovery and Apply.
#                     V1.0.7 (2026-10-11) - Stable account Custom Instructions baseline.
################################################################################
-->

# Package and runtime validation notes

This file is part of the public package. The project owner already knows how to load unpacked Chromium extensions; no delivery-time installation tutorial is required.

## Package structure

- One top-level folder whose name exactly matches the ZIP basename without `.zip`.
- `manifest.json`, JavaScript, CSS, icons and public Markdown documents live directly in that folder.
- Local owner folders such as `.docs/`, `.private/`, `.old/` and owner-controlled `.gitignore` are not replaced by this package.

## Quick runtime checks

1. Confirm Mini, Maxi User and Maxi Developer render and the toolbar icon hides/shows the panel.
2. Confirm `Update Account Custom Instructions` and `Apply CI (Session)` preserve the validated account-CI behavior.
3. Click **List Public SOLO Rules from GitHub**. The list must be created live and include only files beginning with `_RULES_SOLOLAST_`.
4. Apply several rules, then deselect one or more and Apply again. The generated current-chat request must mark deselected rules for functional deactivation and keep still-selected rules active without reload.
5. If all managed rules are active, clearing every checkbox and applying must produce an unload-all request rather than silently doing nothing.
6. If the ChatGPT composer contains an unsent draft, Apply must stop without replacing it.
7. In Maxi Developer, DEBUG/Copy Log/Save Log are available. User and Mini modes do not accumulate DEBUG history.

## Browser/API boundaries

- Public GitHub reads use unauthenticated Contents/Git ref APIs and are read-only.
- Account Custom Instructions use the signed-in ChatGPT session through the established implementation.
- Public SOLO state synchronization uses the visible ChatGPT composer and send action; it does not use a hidden conversation API.
- Functional unload means an explicit conversation instruction to stop applying deselected rule families. It is not deletion of prior messages.

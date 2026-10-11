<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
# Document Name     : PRIVACY.md
# Document Path     : /PRIVACY.md
# Project           : NoXoZ SOLO Control Center
# Author            : Bruno DELNOZ / NoXoZ.be
# Email             : bruno.delnoz@protonmail.com
# Version           : V3.0.0
# Date              : 2026-10-11 15:58:00 CEST
# Short Description : Privacy and data handling
# Change History    : V3.0.0 (2026-10-11) - Document desired-state rule filename storage and functional unload behavior.
#                     V2.0.2 (2026-10-11) - Selected-rule blue state and compact one-line metadata.
#                     V2.0.1 (2026-10-11) - Authoritative public SOLO version detection.
#                     V2.0.0 (2026-10-11) - Dynamic public SOLO discovery and Apply.
#                     V1.0.7 (2026-10-11) - Stable account Custom Instructions baseline.
################################################################################
-->

# Privacy and data handling

NoXoZ SOLO Control Center is currently a personal-use extension with no telemetry.

## GitHub

- GitHub access is read-only HTTPS GET against the public `bdelnoz/regles_contextualisation` repository.
- Account Custom Instructions and public rule discovery use GitHub APIs to resolve current public objects/commits instead of trusting a stale cached RAW alias.
- No pushes, commits, merges, issues, deletes or other GitHub writes are performed.
- No `.private/` file, local repository path, ChatGPT token, cookie or account identifier is sent to GitHub.

## ChatGPT account Custom Instructions

- Account changes occur only after explicit user actions.
- The extension uses the active ChatGPT session; credentials are not hard-coded.
- A runtime session token may be used transiently by the compatibility path but is never stored, logged, exported or sent to GitHub.
- Custom Instructions text is not added to DEBUG logs.

## Public SOLO state synchronization

- The extension discovers and validates selected public rules from GitHub.
- Apply sends a user-visible request into the current ChatGPT conversation containing public rule metadata and immutable public GitHub source links for rules that need loading.
- Deselected rules are named in the current-chat request so ChatGPT is explicitly instructed to stop applying them for future replies.
- Functional unload does not erase or alter historical messages.
- An existing unsent ChatGPT draft is never overwritten.

## Local storage and logs

- `chrome.storage.local` stores non-sensitive UI geometry/mode, the short-lived Reload Ext marker, and the filenames of public SOLO rules last applied through the extension for a given ChatGPT conversation path.
- No public rule file body is persisted as active-state data.
- Developer logs are memory-only and active only in Maxi Developer. They are exported only when **Copy Log** or **Save Log** is explicitly used.
- No persistent audit trail exists in V3.0.0.

## External links

- GitHub SOLO opens the public rules repository.
- Support/Donate opens the existing Stripe donation page.

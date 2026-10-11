<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
Document Name: README.md
Document Full Path & Name: /mnt/data2_78g/Security/scripts/Projects_web/brave-extension-ChatGPT-SOLO-Rules-Control-Center/README.md
Author: Bruno DELNOZ
Email: bruno.delnoz@protonmail.com
Version: v0.5.1
Date / Time: 2026-10-11 09:35
Project: NoXoZ SOLO Contextualization Rules Control Center
Short description: Documentation package overview, contents, and use.
################################################################################
-->

# SOLO Rules Control Center — Handover Documentation

**Date:** 2026-10-11  
**Baseline:** CTX239 / SCRIPT420 / OP135 / CI005  
**Functional baseline:** V0.5 (F01–F28 unchanged)  
**Documentation release:** v0.5.1  
**Extension code version:** V0.0.0 (not implemented)  

This repository documentation package contains the complete functional specifications, a separately proposed and nonbinding set of development phases, and a bootstrap for the chat `000. extension +++NoXoZ_SOLO_CONTEXT_RULES_CONTROL_CENTER_V0.0.0_20261011`.

## Documentation Files

1. `SPECIFICATIONS.md` — complete English functional specification of F01–F28, with traceable internal change history and acceptance boundaries.
2. `PHASES_DEV.md` — independent, nonbinding proposed groupings; the user controls the actual scope and order.
3. `BOOTSTRAP.md` — source references, safeguards, and startup instructions for the new chat.
4. `README.md` — this English documentation overview.
5. `CHANGELOG.md` — append-only documentation changes.
6. `INSTALL.md` — documented installation status and prerequisites, without pretending the extension exists yet.
7. `WHY.md` — the origin and purpose of the extension.

The original **French PDF files** are separate previous artifacts, not English translations and not included in this English Markdown package. French `*-fr.md` originals are preserved in the user's local repository by the user; this package neither edits nor replaces them. No extension code, private SOLO rules, or reference-extension archives are included.

## Existing Sources and Folder Conventions

The user's existing local repository is the working source. Public SOLO rule source content and public CI may be read from GitHub RAW; README/CHANGELOG for those rules are always read from local `.docs/`. Private rules remain in `.private/` locally and are never published to GitHub. Earlier versions can be found in `.old/` if available.

The Chrome/Brave/Chromium extension will use a floating interface with Mini, Maxi User, and Maxi Developer modes, taking inspiration from the user's three reference extensions. No code has been created for this new extension at the time of this documentation revision.

**GitHub: READ ONLY STRICT.** No remote write, commit, push, merge, or publication by the assistant or automation. The user decides and performs all GitHub write actions.

## Documentation Notes

- Every delivered Markdown file carries a SOLO420-compliant `DOCUMENT INFORMATION` metadata header.
- `SPECIFICATIONS.md` is a product specification, not a development schedule.
- The user decides which feature to implement and when; `PHASES_DEV.md` is advisory only.
- The Audit Trail (F19) must remain separate from temporary technical debugging logs and support external export/import.

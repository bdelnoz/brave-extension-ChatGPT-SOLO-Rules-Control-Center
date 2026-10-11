<!--
################################################################################
# DOCUMENT INFORMATION
################################################################################
Document Name: SPECIFICATIONS.md
Document Full Path & Name: /mnt/data2_78g/Security/scripts/Projects_web/brave-extension-ChatGPT-SOLO-Rules-Control-Center/SPECIFICATIONS.md
Author: Bruno DELNOZ
Email: bruno.delnoz@protonmail.com
Version: v0.5.1
Date / Time: 2026-10-11 09:35
Project: NoXoZ SOLO Contextualization Rules Control Center
Short description: Complete functional requirements (F01–F28), interfaces, safeguards, and reference scope.
################################################################################
-->

# SOLO Rules Control Center

## Functional Specifications — V0.5.1 (documentation revision; feature baseline V0.5 unchanged)

**Short name:** SOLO Rules Control Center  
**Full name:** NoXoZ SOLO Contextualization Rules Control Center  
**Publisher:** NoXoZ.be  
**Supported browsers:** Brave, Chrome, Chromium  
**Reference SOLO baseline:** CTX239 / SCRIPT420 / OP135 / CI005  
**Date:** 2026-10-11  
**Status:** Functional specifications awaiting approval. This document does not request any changes to the extension or the rules.

### Purpose

The primary goal is to enable **viewing, comparing, and updating the ChatGPT account's Custom Instructions** using the public SOLO reference. The extension then expands this capability to viewing and applying public and private SOLO families and modes, checking their apparent state in conversations, and tracing operations.

The functions below are listed **by functional importance**, not by implementation stages. Identifiers **F01 through F28** remain unchanged to preserve established references.

---

## 1. Features

### Core Features

#### 1. F03 — Custom Instructions Manager

**Status: accepted.**

- Read the public `_CUSTINST_SOLOLAST_CUSTOM_INSTRUCTIONS.md` file from GitHub RAW.
- Display its full contents, filename, version, and available date.
- Provide **README** and **CHANGELOG** buttons for its associated local documents.
- Display the Custom Instructions currently configured in the account, where the ChatGPT interface permits it.
- Compare the account's Custom Instructions against the GitHub version.
- Save a local copy of the account's Custom Instructions before any replacement.
- Offer an **Update Account CI** button, with confirmation before changing anything.
- Display the update result and, where possible, verify the saved content by reading it again.
- Provide a separate **Apply Custom Instructions** button to request application of the CI in the current conversation, without necessarily changing the account settings.

**Mandatory distinction:** “Update Account CI” changes the account's CI; “Apply Custom Instructions” acts on the current conversation. These are two different actions.

#### 2. F26 — Set SOLO Local Location

**Status: accepted — fundamental feature.**

- Provide a **Set SOLO Local Location** button.
- Allow selection of the root of the existing local SOLO repository.
- Use that location to find the repository files and the `.private/`, `.docs/`, `.old/`, and `.gitignore` paths and their contents.
- Retain the reference to the selected location for as long as the browser allows.
- Allow the selected directory to be changed.
- Clearly report a missing or inaccessible directory.
- Do not require any additional local or remote repository.

#### 3. F01 — Public Rules Manager

**Status: accepted.**

- Access the public SOLO GitHub repository in read-only mode.
- List only public rule **families and files**, not each individual numbered rule.
- Display the family name, filename, current version, and available date.
- Open the selected rule's complete **RAW** contents.
- Display two separate buttons beside each file: **README** and **CHANGELOG**.
- Read those two documents exclusively from the local repository under `.docs/`, never from GitHub.
- Explicitly report missing or inaccessible local documents.
- Do not modify any remote file.

#### 4. F02 — Private Rules Manager

**Status: accepted.**

- Use the local SOLO directory defined by the user.
- Look for private families and files in `.private/`.
- Prompt the user to set the local directory if none has been selected.
- List the private families, files, versions, and available dates.
- Display the full **RAW** contents of selected private files.
- Display **README** and **CHANGELOG** buttons beside each file, reading the associated local documents under `.docs/`.
- Report missing or inaccessible local documents.
- Never search GitHub for private rules.
- Never publish a private file.

#### 5. F04 — Public Rules Loader

**Status: accepted.**

- Display the available public SOLO families.
- Allow one or more families to be selected using checkboxes.
- Treat the general **CTX** family as required by default for a SOLO load consistent with the baseline.
- In particular, allow **SCRIPT** and **OP** to be selected.
- Provide an **Apply** button.
- Use the public GitHub RAW contents corresponding to the selected families.
- Request their application to the current ChatGPT conversation.
- Support explicit reapplication of these families through **F28**, without automatic reloading.
- Respect the SOLO principle that an already loaded family must not be reloaded without an explicit **RELOAD** request, notably through the voluntary reapplication command **F28**.
- Display an action report: requested elements, transmitted elements, response received, and any errors.

#### 6. F28 — Reapply SOLO Rules (reapplication to a chat)

**Status: accepted.**

- Provide a **Reapply SOLO Rules** button for the current ChatGPT conversation.
- Allow reuse of the public and private families, versions, and modes associated with that conversation, insofar as the relevant information and files are actually available.
- Allow the user to explicitly select the elements to reapply, including selections combining several families and modes.
- Before acting, display a summary of the relevant rules and modes, their sources, and their known versions.
- Actually request reapplication of the selected elements to the **target conversation**, after user confirmation.
- Treat this voluntary action as an explicit **RELOAD** request for the specified elements, without violating the rule against automatically reloading SOLO families.
- **Never automatically reapply** rules when a tab opens, a page reloads, or the browser resumes.
- Never invent a version or assume that a missing source file can be accessed: show unavailable elements and let the user correct the selection.
- Do not modify the account's Custom Instructions through this action; account CI management belongs exclusively to **F03**.
- Display the observed result of the request and record the operation in **F19 — Audit Trail**.
- Strictly separate public and private sources: private rules never pass through GitHub.

#### 7. F06 — Private Rules Loader

**Status: accepted.**

- List the private families present in the local repository under `.private/`.
- Allow multiple families to be selected with checkboxes.
- Read private files exclusively from the local repository.
- Request their application to the selected ChatGPT conversation **only following an explicit user action**.
- Allow combinations of public and private rules.
- Never use GitHub as a destination for private files.

#### 8. F05 — Public Mode Selector

**Status: accepted.**

- List the modes available in the public CTX family and, subsequently, in other applicable families.
- Display each mode's **name** and a **short definition**.
- Allow multiple modes to be selected.
- Provide an **Apply Modes** button.
- Allow a mode to be applied without loading its entire family when its instructions and dependencies permit it.
- For a future enhancement, and only on explicit instruction, provide a structured index of modes and submodes.
- Do not modify any existing source rule without an explicit user instruction.

#### 9. F07 — Private Mode Selector

**Status: accepted.**

- List the identifiable modes and submodes in local private rules.
- Display each mode's name and short definition.
- Allow multiple selection.
- Allow an individual private mode to be applied without transmitting its entire family when its instructions and dependencies permit it.
- Allow public and private modes to be combined.
- Never send private source files to GitHub.

#### 10. F27 — Combined Apply

**Status: accepted.**

- Allow multiple public families to be selected simultaneously.
- Allow multiple private families to be selected simultaneously.
- Allow multiple public and private modes to be selected simultaneously.
- Permit any compatible combination of these elements.
- Display a readable summary before application.
- Provide an **Apply Selected** button.
- Request application of only the selected and necessary elements.
- Allow an individual mode to be applied when its dependencies are satisfied.

#### 11. F15 — Privacy Check

**Status: accepted.**

This feature replaces the name “Privacy Guard”.

- Examine the local repository's `.gitignore`.
- Verify that `.private/`, `.docs/`, and other files or directories that must be excluded are appropriately protected against publication.
- Flag sensitive files already tracked by Git, since a `.gitignore` rule does not protect them.
- Check, **read-only**, whether excluded content is present in the public remote repository.
- Display an **OK / WARNING / ERROR** result with details of any anomalies.
- Never automatically correct the remote Git repository or perform any remote write operation.

**Absolute golden rule: no private SOLO file or explicitly excluded content may ever be sent to or published on GitHub.**

#### 12. F19 — Audit Trail

**Status: accepted — persistent history, viewing, export, and import.**

**Objective:** provide a viewable and recoverable history of operations performed with the SOLO Rules Control Center extension, separate from technical debugging logs.

**Permanent audit trail:**

- Record the extension's main operations chronologically: viewing rules, selecting and applying families or modes, changing CI, reading or changing the local location, running diagnostics, importing and exporting audit trails, and significant errors.
- For every event, retain at least the **date**, **time**, **action type**, **result**, **relevant families or modes**, their **versions** when known, and the **conversation identifier** when available and useful.
- Preserve the history after closing the extension window, closing Brave/Chrome/Chromium, reloading the extension, and restarting the computer, insofar as the extension's local data remain available.
- Keep the audit accessible independently of temporary debugging logs.
- Never automatically record complete conversation text, full private rule contents, secrets, or Custom Instructions in plain text in the audit trail: record only the metadata necessary for traceability.

**Maxi Dev interface:**

- Provide an **Audit Trail** button in **Maxi Developer** mode.
- When clicked, display the saved audit trail with date, time, action, and result.
- Preserve the usual technical-log area, separately from the audit trail.
- Allow users to view and scroll through events, and eventually search and filter them.
- Provide an **Export Audit Trail** button beside the button that opens the journal, as well as an **Import Audit Trail** button.

**External export:**

- The **Export Audit Trail** button must generate a downloadable file containing the complete history in a readable, reimportable text format.
- Offer a **`.audit.log`** file by default; an additional **`.md`** export may also be offered.
- Allow the user to choose the destination directory through the browser's save/download process where available.
- Do not force a predefined directory or send anything to GitHub.
- Clearly display the filename and confirm the export result.

**Import and recovery:**

- The **Import Audit Trail** button opens a file picker for a previously exported local file.
- Check that the file contains a readable SOLO audit before importing it.
- Restore the imported history to the extension's viewable audit trail.
- If a history already exists, offer **merging without duplicates** or **replacement after confirmation**, to prevent accidental loss of events.
- Report format or import errors without deleting the existing audit trail.
- Thus allow history recovery after uninstallation/reinstallation, browser cleanup, or installation changes, provided the exported file was saved externally.

**Temporary technical logs:**

- Technical logs currently visible in developer mode remain separate from the audit trail.
- They serve occasional diagnostics, do not require permanent retention, and may disappear after a reload or cleanup.
- Their lifespan never affects the retained audit history.

**Confidentiality:** audit data and exported files remain local. No GitHub synchronization or remote publication. The user may request that the audit history be cleared after confirmation.

#### 13. F25 — About

**Status: accepted.**

- Provide an **About** button in the interface.
- Display an **About SOLO** section explaining the SOLO system, its families, modes, and principles.
- Display an **About Extension** section covering SOLO Rules Control Center, its author, version, and features.
- The detailed content of these presentations remains to be provided and approved by the user.

#### 14. F09 — Chat Inspector

**Status: accepted.**

- Identify the current ChatGPT conversation.
- Display the SOLO families associated with that conversation.
- Indicate their versions when known.
- Display modes that were selected, requested, or declared active.
- Distinguish elements that were **selected**, **sent**, and **declared loaded**.
- Clearly mark unverified information, without claiming access to the model's internal state.
- Provide access to **F28 — Reapply SOLO Rules** to explicitly request reapplication of known or selected elements.

### Additional Features

#### 15. F12 — Token Analyzer

**Status: accepted.**

- Provide a **Token Analyzer** tool.
- Allow selection of multiple rule families, files, and modes.
- Display the exact or estimated token count of each selected element, depending on the available method.
- Display the combined total for the selection.
- Distinguish the volume of complete rules from that of mode-specific instructions.
- Warn about volumes that may exceed the applicable capacity or limits of a conversation.

#### 16. F17 — Auto-Diagnostics

**Status: accepted — Maxi Developer.**

- Provide an **Auto-Diagnostics** button in developer mode.
- Check the ChatGPT interface elements required for the extension's functions.
- Report expected buttons, fields, menus, or other elements that are missing or have changed.
- Display detailed results in the developer interface.
- Do not perform any destructive action during checks.
- Use the existing technical-log area to display diagnostic information.

#### 17. F13 — Chat Recovery & Bootstrap

**Status: accepted additional feature.**

- Prepare a bootstrap to resume work in a new ChatGPT conversation.
- Reuse the families, versions, and modes known to the extension.
- Support any supplementary deliverables needed for resumption: text, Markdown, ZIP, or PDF.
- Do not claim to retrieve a previous conversation in full when the data are unavailable.

### Reserved Features

#### 18. F14 — Integrity Checker

**Status: future TODO.**

- Verify the consistency of SOLO versions.
- Check `SOLOLAST` aliases.
- Verify the structure of files and ZIP archives.
- Report missing mandatory README or CHANGELOG documents.
- Verify SHA-256 checksums when relevant.

#### 19. F20 — Diff Viewer

**Status: future TODO.**

- Compare the current public version available on GitHub with a previous version archived locally under `.old/`.
- Compare two private versions available locally.
- Display line-by-line additions, deletions, and changes.
- Do not modify any compared file.

#### 20. F11 — Snapshot & Rollback

**Status: future TODO.**

Support saving earlier states of SOLO configurations and restoring them locally.

#### 21. F21 — Emergency Restore

**Status: TODO, to be reconsidered.**

Potentially restore Custom Instructions or extension preferences from a local backup. No “automatic injection” mechanism is planned as an initial feature.

#### 22. F22 — Update Impact Analyzer

**Status: future TODO.**

Assess the potential impact of a new SOLO rule version on other families, modes, and associated local elements.

#### 23. F10 — Rule Conflict Detector

**Status: future TODO.**

Analyze possible contradictions, repetitions, and incompatibilities among selected rule families and modes.

#### 24. F23 — SOLO Rule Engine

**Status: long-term vision.**

Future functionality for orchestrating rule and mode dependencies, priorities, exclusions, and combinations.

#### 25. F24 — Install SOLO Rules

**Status: public feature envisaged for the future.**

- Provide an **Install SOLO Rules** button.
- Explain which public elements will be downloaded and installed.
- Ask the user to select a local destination directory.
- Retrieve **public** SOLO rules from NoXoZ's GitHub repository.
- Install the public families, necessary aliases, and public Custom Instructions locally.
- Then allow them to be selected and applied in local mode without requiring the user to have a remote Git repository.
- Later consider broader adaptation and an English-language interface for public users.

**Permanent prohibition:** no private rule is distributed by this function.

#### 26. F16 — Multi-AI Support

**Status: long-term TODO.**

In the future, support adapting SOLO Rules Control Center to other AI assistants, notably Claude and Gemini. The current intended integration is ChatGPT Web.

#### 27. F18 — Project Binding

**Status: optional TODO.**

At a later stage, associate a set of rules and modes with a ChatGPT project.

#### 28. F08 — SOLO Profiles

**Status: reserved idea, not currently accepted.**

Creating predefined profiles of rules and modes has not been requested. The user selects directly which elements to apply. This idea remains documented as a possibility.

---

## 2. User Interface

The SOLO Rules Control Center interface must follow the functional and visual identity of the existing **NoXoZ AI Voice Control v8.12.4**, **ChatGPT Export v7.0.0**, and **NoXoZ WebActivity Tracker v1.5.10** extensions, as shown in the provided examples.

### 2.1 — Mini

- Compact floating window.
- Access to the main controls and essential status indicators.
- Easy switching to Maxi User display.

### 2.2 — Maxi User

- Main interface for viewing SOLO families, files, versions, and modes.
- Multiple selection with checkboxes.
- Access to **Apply**, **Reapply SOLO Rules**, **RAW**, **README**, **CHANGELOG**, **CI**, and **About**.
- Movable and resizable floating window.

### 2.3 — Maxi Developer

- All Maxi User functions, plus diagnostic tools.
- Display of **temporary technical logs**.
- **Auto-Diagnostics** button.
- Separate **Audit Trail**, **Export Audit Trail**, and **Import Audit Trail** buttons.
- Persistent audit trail separate from technical logs, with history viewing.

### 2.4 — Cross-Cutting Interface Requirements

- Floating window integrated into ChatGPT Web, **without a Side Panel** and **without a separate Button mode**.
- Preserve the visual identity of existing NoXoZ extensions.
- Clearly display the version, status, and errors.
- Preferably retain the selected display mode, position, and size whenever the extension's stored data allow it.
- Coexist with other NoXoZ extensions without interference.
- Provide an **About** button with **About SOLO** and **About Extension** sections.

---

## 3. Data Sources and Confidentiality

### 3.1 — Local SOLO Repository

- The local repository selected by the user is the **primary working reference**.
- Read private rules from `.private/`.
- Always read public and private README and CHANGELOG files locally from `.docs/`.
- Retrieve earlier versions from `.old/` when available.
- Allow the repository to be used without requiring the creation of another repository or ownership of a remote Git repository.

### 3.2 — Public GitHub Repository

- GitHub provides only the **public RAW rules**, their published version information, and public Custom Instructions.
- GitHub is **STRICTLY READ ONLY** for the extension and the assistant.
- Any remote creation, modification, deletion, publication, commit, push, merge, or other write operation is prohibited.
- README and CHANGELOG files are **not** retrieved from GitHub: they come from the local repository.

### 3.3 — Private Rules

- **No private rule, no content from `.private/`, and no explicitly excluded content may ever be sent to or published on GitHub. Never.**
- No private file is included in a public package.
- No implicit external synchronization of private sources is authorized.
- Applying a private rule to a ChatGPT conversation is possible only after explicit user selection and action.
- Access to ChatGPT for an explicitly requested application must never be interpreted as authorization to publish anything on GitHub.

### 3.4 — Audit Persistence and Export

- Preferences and the reference to the local directory must be recoverable between sessions for as long as the extension's data remain available.
- The **Audit Trail** persists across sessions and is independent of temporary technical logs.
- The user can **download an external export** to a location of their choice where the browser permits it, and **import** that file to restore the history after browser cleanup, removal, or reinstallation.
- F19 export/import applies to **the audit trail**, not to the entire SOLO repository.
- Full contents of conversations, private rules, and CI must not automatically appear in plain text in the audit trail.

---

## 4. Status of Actions Performed in ChatGPT

The Chat Inspector must distinguish the following states:

- **Selected:** element selected in the extension.
- **Requested:** application requested by the user.
- **Sent:** transmission to the conversation was observed.
- **Declared Loaded:** ChatGPT stated that the elements had been loaded.
- **Unverified:** loading or effective application could not be established.

The extension must report facts it can observe without guaranteeing that the model will follow each rule in the future. This limitation must not prevent users from submitting rules or directly asking ChatGPT to correct its behavior.

---

## 5. Interface References

The provided archives and screenshots of NoXoZ extensions serve as presentation references for the new interface: **AI Voice Control**, **ChatGPT Export**, and **WebActivity Tracker**. In particular, they demonstrate floating windows, Mini / Maxi User / Maxi Developer formats, controls, statuses, technical logs, and dragging or resizing behavior.

The new extension must maintain an experience consistent with these references without changing existing extensions.

---

## 6. Functional Points to Be Clarified by the User

- Final presentation and wording of the **About SOLO** and **About Extension** sections.
- Short descriptions of modes and submodes.
- Expected behavior of **Apply** and **Reapply SOLO Rules** actions, including their selection summaries.
- Presentation of **Token Analyzer** results.
- Presentation of F19 history, optional filters, and import behavior when existing data are present (merge or confirmed replacement).
- Final button labels and layout.
- Possible decision to enable any features currently reserved.

**This document defines the extension's expected behavior. It does not impose a method, a sequence, or an organization of work.**

---

**Final status: functional specifications V0.5.1 (same F01–F28 requirements as V0.5) — awaiting approval.**

## 7. Specification Completeness and Acceptance Boundaries

The following items clarify the documentary status and do **not** add, remove, or reprioritize any of the 28 functional features defined above.

### 7.1 Existing Verified State

- The user provided an existing local repository directory, a `.gitignore`, and folders named `.old/`, `icons/`, and `.zip/`.
- The project is at **extension version V0.0.0**; no implemented extension functionality has been supplied or validated for this project.
- Existing NoXoZ extensions are reference examples, not source files to change as part of this specification.

### 7.2 Inputs and Outputs

- **Inputs:** public SOLO RAW files; local public/private SOLO files; local `.docs/` files; current ChatGPT page state where accessible; explicit user selections; and audit files chosen for import.
- **Outputs:** readable catalogs and RAW views; explicit application or reapplication requests in a chat; results of Custom Instructions operations; diagnostic reports; token counts/estimates; and locally exportable/importable audit history.

### 7.3 Files, Directories, and Interfaces

- **Local paths:** repository root selected by the user; `.private/`, `.docs/`, `.old/`, and `.gitignore` when present.
- **Remote access:** HTTPS public GitHub RAW, strictly read only.
- **Browser interface:** a floating ChatGPT Web panel with Mini, Maxi User and Maxi Developer presentations. Button actions are specified in F01–F28; no command-line interface has been requested.
- **Extension architecture and file layout:** undecided; no assumption about the implementation is authorized by this specification.

### 7.4 Nonfunctional and Safety Requirements

- GitHub remains **READ ONLY STRICT**, including for automated tools and connectors.
- Private SOLO rule sources never go to GitHub or public delivery archives; applying a selected rule to ChatGPT requires an explicit user action.
- No automatic full conversation capture, private source capture, or CI plaintext logging occurs in the Audit Trail.
- The interface must coexist with installed NoXoZ extensions without unwanted interference and must not imply model-internal verification it cannot perform.
- Local README and CHANGELOG files remain the only documentation sources for public and private rules.

### 7.5 Functional Acceptance Criteria

- Each accepted feature is assessed against its own enumerated requirements in Section 1 when the user chooses to implement it.
- In particular, F03 must distinguish **Update Account CI** from **Apply Custom Instructions**; F19 must preserve and export/import audit history; and F28 must only reapply on an explicit request.
- An unavailable file, denied local permission, or unsupported ChatGPT interface operation must be reported rather than presented as successful.
- No delivery is considered implemented or tested merely because it is specified here.

### 7.6 Task Boundary and Out-of-Scope Items

- This document describes intended product behavior, not a development schedule, technical design, or authorization to implement features.
- Reserved and rejected features remain in the list for traceability, with their stated statuses unchanged.
- The user alone chooses what to implement and when. No extension source code, GitHub publication, or reconfiguration of other extensions is requested here.

## 8. Internal Specification Changelog (Append-Only)

The entries below document known specification revisions; the original V0.5 text did not contain an internal changelog. No undocumented historical details are asserted.

- **V0.1 — 2026-10-11:** Initial functional brainstorming and first documented feature list (F01–F23).
- **V0.2 — 2026-10-11:** Consolidated full functional list through F27 and the floating-interface conventions.
- **V0.3 — 2026-10-11:** Expanded F19 for persistent Audit Trail viewing, export, and import.
- **V0.4 — 2026-10-11:** Reordered the features by functional importance without changing their identifiers.
- **V0.5 — 2026-10-11:** Introduced F28 (Reapply SOLO Rules), retained F01–F27, and maintained the priority-based presentation.
- **V0.5.1 — 2026-10-11 09:35 (Bruno DELNOZ):** Added SOLO420-compliant document metadata and specification-completeness/acceptance sections; retained all 28 features, their wording, identifiers, order, statuses, and original functional scope.

---
name: session-close
description: Use when André says "save", "save everything", "save everything everywhere", "update", "update memory", or "update everything" — triggers memory update, handoff doc, security check, skill candidate review, and proactive questions before exit
---

# Session Close

Triggered by: **"save"** / **"save everything"** / **"save everything everywhere"** / **"update"** / **"update memory"** / **"update everything"**

Run all steps in order. Do not skip steps.

---

## Step 1 — Security check (ALWAYS FIRST)

Before touching git, scan everything done this session:

- Any credentials, API keys, tokens, or passwords written anywhere?
- Any personal data (names, addresses, health, finances) in tracked files?
- Any file that should be gitignored but isn't?

**Rules — non-negotiable:**
- NEVER commit anything containing credentials, secrets, or personal data to any repo — especially not public ones
- Secrets live locally in the project folder, always gitignored (`.env`, `config.local.*`, etc.)
- Highly sensitive secrets (passwords, encryption keys, financial data) → `Maggie-Vault.dmg` in Documents (encrypted, mount before use)
- If something MUST be public to make a tool work: use environment variables or authenticated secrets management — never hardcode
- André is still learning what's safe to publish — **take full responsibility** for catching issues he may overlook
- When in doubt: keep it local and inform André explicitly

If any concern is found: **stop, flag it to André, do not proceed with commit until resolved.**

---

## Step 2 — Commit scope review

```bash
cd /Volumes/Maggie-Data/Skylab && git status
```

For **every untracked file** shown, make an explicit decision — do not silently skip:

| Decision | When |
|---|---|
| **Commit** | Safe, relevant to the session, appropriate for the repo |
| **Gitignore** | Should never be tracked (personal data, secrets, build output, internal docs) |
| **Leave alone** | Not related to this session, or status unclear — note it in the handoff |

For **modified tracked files**: verify the change is intentional and safe before staging.

State your decisions to André before committing. If anything is ambiguous, ask.

---

## Step 3 — Commit

Commit what passed Steps 1 and 2. Use a descriptive message.

If nothing to commit, say so explicitly.

---

## Step 4 — History spot-check

Check commits made this session for anything sensitive that may have slipped in:

```bash
cd /Volumes/Maggie-Data/Skylab && git log --oneline -10
```

For each commit made this session, briefly verify:
- No credentials, tokens, or keys in the diff
- No personal data (names, addresses, financial info) that shouldn't be public
- No files that should have been gitignored

If something is found: rewrite history with `git filter-repo` and inform André.
This catches what Step 1 misses — things that crept into history in earlier commits or previous sessions.

---

## Step 5 — Inbox status

```bash
ls /Volumes/Maggie-Data/Skylab/Maggie/_Inbox-Team/
ls /Volumes/Maggie-Data/Skylab/Maggie/_Inbox-Owner/
```

**_Inbox-Team/:** Anything unprocessed? If yes — note it in the handoff and flag to André.

**_Inbox-Owner/:** List any deliverables created *this session* so André knows what to review. Format:
> "New in _Inbox-Owner/ this session: [filename] — [one line on what it is]"

If both are clear and nothing new was created, say so in one line.

---

## Step 6 — Update memory

Check each memory type and write/update as needed:

- **user/** — anything new learned about André's preferences or working style
- **feedback/** — corrections André made, or approaches he confirmed
- **project/** — status changes, decisions made, what's next
- **reference/** — new external systems, tools, or locations learned

Update `MEMORY.md` index. Keep entries under ~150 chars each.

---

## Step 7 — Write handoff doc

Save to `docs/handoff-YYYY-MM-DD-<topic>.md` (gitignored — write freely).

Include:
- What was completed this session
- Current state of any in-progress work
- Exact next steps for the next session
- Open questions or pending decisions

---

## Step 7.5 — Ingest handoff into History

After writing the handoff doc, run:

```bash
python3 /Volumes/Maggie-Data/Skylab/Maggie/scripts/journal/ingest_handoff.py --file <absolute-path-to-handoff>
```

This calls Gemma to summarize the session and writes a card to `history_entries` in maggie.db.
It's idempotent — safe to run twice. If Gemma is unavailable, the entry is written without a summary.

---

## Step 8 — Flag skill candidates

Review the session. Did any workflow repeat, feel brittle, or need too much re-explanation?

If yes: note the candidate and suggest it to André.
If no: say so briefly.

---

## Step 9 — Proactive questions

Before closing, ask André:

> "Before we wrap up:
> - Anything from this session that felt unclear or unresolved?
> - Anything you meant to bring up but didn't?
> - Any decision we made that you want to revisit?"

One round. Not an interrogation.

---

## Common mistakes

- Skipping the security check because "nothing sensitive was touched" — always check
- Committing because André said to, without verifying what's in the files — André defers security to you
- Silently skipping untracked files instead of making an explicit decision per file
- Missing sensitive content in history because it was committed in a previous session — Step 4 catches this
- Forgetting to list new _Inbox-Owner/ deliverables — André needs to know what to review
- Forgetting to update `MEMORY.md` index after writing memory files
- Handoff next steps too vague to act on without re-reading the whole session
- Skipping Step 9 because the session felt clean — ask anyway

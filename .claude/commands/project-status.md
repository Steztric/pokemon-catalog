Read `agent-context/implementation-status.md` and report the current project status.

Your response must cover, in order:

1. **Overall status** — one sentence: what phase the project is in and what that means in plain terms.

2. **Phase table** — reproduce the phase status table from the file. Show each phase number, name, and status. Highlight any `in-progress` or `blocked` rows.

3. **Current focus** — summarise what is actively being worked on, taken directly from the "Current Focus" section of the status file.

4. **What's next** — identify the next `not-started` phase whose blockers are all `complete`, and state what it involves (one sentence, cross-referencing `implementation-plan.md` if useful).

5. **Blockers** — list anything in the "Known Issues and Blockers" section. If empty, say so explicitly.

6. **Deviations** — list anything in the "Decisions and Deviations" section that departed from the architecture or plan. If empty, say so.

Do not scan the codebase or infer status from file existence. The status file is the authoritative source. If the status file appears inconsistent with observable reality (e.g. a phase is marked complete but its acceptance criteria are clearly not met), note the discrepancy rather than silently correcting it.

If $ARGUMENTS is non-empty, treat it as a phase number or name and focus the report on that phase only, pulling detail from `implementation-plan.md` for context.

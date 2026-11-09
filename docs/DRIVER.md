# Driver

Read docs/STATE.md, then only the part of docs/PLAN.md for the next milestone. Do that milestone and nothing else.

Method: write the tests first (test-driven-development), then the smallest code that passes (surgical-patch). Do not rewrite working files. Do not re-read files you already know. Do not print long outputs.

Skills: use the game-creator skills listed for that milestone in docs/PLAN.md (add-feature, design-game, game-designer, game-assets, add-assets, improve-game, game-qa, review-game, use-template, phaser, game-architecture). Read a skill's SKILL.md before first using it.

Never run make-game, quick-game, viral-game, monetize-game, add-multiplayer or scaffold-gateables.

If a game-creator skill wants to add analytics, accounts, leaderboards, ads, tracking, third-party runtime requests or NASA logos, skip that step and note it in STATE.md. CLAUDE.md wins any conflict.

Use the caveman skill for all replies, commit messages (caveman-commit), and STATE.md notes. NEVER apply caveman style to game text, Archive entries, artifacts.json, UI labels, alt text, captions or code comments that players or reviewers read. Those stay in full plain English at grade 4 to 5.

Use caveman-explore instead of reading whole folders.

Done means: type check, tests and tools/validate-data.ts all pass (verification-before-completion), and the exit condition in PLAN.md is met. Run game-qa once at the end.

Fix your own failures up to 3 attempts (systematic-debugging). If still failing, or if you hit a decision in GDD Section 16 (e.g. the Phaser version), write the question in STATE.md and stop.

Never fill written_by, verified_by or last_verified, and never add facts to entries.

Finish:
1. Update STATE.md (done, next, open questions).
2. Before finishing: if STATE.md or PLAN.md is over 100 lines, run caveman-compress on it.
3. End with caveman-commit: make one git commit.
4. Reply with at most 5 lines.

If you stop for a blocker (a failure after 3 attempts, or a decision only the team can make), put a line `BLOCKED: <reason>` at the top of STATE.md. Do not write BLOCKED for open questions you can work around; note them and continue.

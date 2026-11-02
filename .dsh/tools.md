## DSH tool mapping

Use the tools actually available in this session. Tool namespaces may differ; use the declared names and schemas, not Claude Code command syntax.

| Action | DSH tool or behavior |
| --- | --- |
| Invoke a skill | `skill` with its bare name: `superpowers:brainstorming` becomes `brainstorming`. |
| Read / create / edit files | `read`, `write`, `edit`; follow the host's encoding rules and use encoding-safe tools when required. |
| Search contents / discover paths | `grep`, `glob`. |
| Run a command | `pwsh` on Windows, or the shell tool the host exposes. Pass the working directory explicitly. |
| Ask the user | `ask_user_question`. |
| Track tasks | `todo_write`; long-running objectives may use `create_goal` and `update_goal` when the host permits. |
| Delegate work | `subagent` or `subagent_fork`, then `send_message`. Supply the role and prompt template yourself; named Claude agents are not DSH agent types. |
| Fetch / search the web | `web_fetch`, `web_search`. |
| Read background output | `job_output` with the returned job ID; stop unneeded jobs with `job_kill`. |

If delegation is unavailable or disabled by the provider, work inline and report that limitation. Do not retry via another delegation tool to bypass the restriction. Use `workflow` only when the user explicitly requests a workflow or large multi-agent orchestration and the host allows it.

Load helper files relative to the resource base returned by `skill`, not the current workspace. Run `.sh` helpers through Git Bash on Windows only when it is available; PowerShell does not interpret Bash scripts. Node helpers run through Node.js.

The bootstrap is skill guidance, not a permission grant. System/developer instructions and explicit user or project rules (including AGENTS.md skill-complexity limits) take precedence. Do not enable all workflows for small tasks, change sandbox permissions, delete files, commit, or push merely because a skill suggests it; follow the current host and user rules. This plugin neither installs tools nor grants permissions.

All existing skill bodies are shared with the other harnesses. References to Claude-specific session logs, plugin commands, or agent types are not DSH APIs. For session diagnostics, inspect DSH's actual session storage and available tools; do not assume Claude paths exist or fabricate a transcript.

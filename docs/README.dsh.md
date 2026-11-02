# Superpowers for DeepSeek Harness

This repository can be installed as a local DSH plugin bundle. It uses the
existing `skills/` directory directly and leaves the OpenCode and Pi entry
points intact. No skill copy or build step is required.

## Install locally

Use the CLI belonging to the DSH application you actually run:

```powershell
dsh plugin --profile desktop add "E:\others\superpowers"
```

If Desktop's CLI is not on PATH, use its bundled launcher:

```powershell
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add "E:\others\superpowers"
```

Substitute your checkout path. For a standalone Web installation, select
`--profile web` instead. The installed package is named `superpowers`, not
`superpowers-dsh` or `@blugart-dev/dsh-superpowers`.

Restart DSH after installation, then open a new session. The plugin manager
should show these two entries:

| Entry | Purpose |
| --- | --- |
| `superpowers-dsh-skills` | Registers the repository's skills with DSH's native filesystem provider. |
| `superpowers-dsh-bootstrap` | Adds `using-superpowers` and the DSH tool mapping to runtime context. |

Both entries are enabled by default and can be disabled independently. Disable
only bootstrap to keep the skills available without automatic startup guidance.

## Behavior and precedence

The provider mounts only this repository's skill directory. It uses DSH's
bundled-skill rank, so project and user skills with the same name take precedence.
DSH parses frontmatter, supplies resource paths, watches skill files, and cleans
up the provider when the plugin is disabled. Skills are loaded by bare name:
`skill({"name":"brainstorming"})`.

Bootstrap uses `systemPrompt.context`, not a system instruction section. DSH
owns delivery and replacement of runtime-context snapshots; repeated prompt
assembly contributes one named bootstrap entry, also available after compaction.
The skill body is not rewritten. Template expressions remain literal.

Existing host instructions, AGENTS.md complexity limits, and user preferences
remain authoritative. The plugin does not enable tools, loosen permissions,
install a workflow gate, or edit user instruction files. A provider that disables
subagents still disables them. Bash helper scripts require Bash on Windows.

## Updating

DSH stores a local link to this checkout. Updating the checkout updates the
installed skill source; it does not download updates automatically. Keep the DSH
adapter changes in your own branch before merging upstream changes. Do not use
`pnpm update superpowers` to update a local link from an unrelated npm package.

DSH watches skill files, but restart the application after updating the checkout
so the bootstrap and module code are refreshed together. No scheduled updater,
Git commit, or remote push is created by installation.

## Compatibility and verification

The adapter targets DSH `>=0.2.1-rc.5 <0.3.0-0`; earlier versions are not verified.
DSH supplies the optional peer `@deepseek-ai/dsh-skill-filesystem` through its
runtime resolver. Declaring this peer is required for local-link resolution;
it is optional so other harnesses do not install a DSH runtime.
Do not install another copy of DSH into this repository just to satisfy Node's
standalone module resolver.

Run the unit and existing Pi/OpenCode regression tests with Node 24:

```powershell
node --test tests/dsh/test-dsh-plugin.mjs tests/pi/test-pi-extension.mjs
node tests/opencode/test-bootstrap-caching.mjs .opencode/plugins/superpowers.js present
node tests/opencode/test-session-bootstrap.mjs .opencode/plugins/superpowers.js
node tests/opencode/test-skill-registration.mjs .opencode/plugins/superpowers.js
```

Run the integration test against Desktop's real SDK (no model request or server
is started):

```powershell
$env:ELECTRON_RUN_AS_NODE = '1'
$env:DSH_TEST_PROFILE_DIR = "$env:USERPROFILE\.dsh\profiles\desktop"
$env:DSH_TEST_NODE_MODULES = "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\app.asar\dsh\node_modules"
& "$env:LOCALAPPDATA\Programs\DeepSeek Harness\DeepSeek Harness.exe" --test --test-isolation=none tests/dsh/test-dsh-runtime.mjs
```

The test checks that every skill is registered with unchanged content and a valid
resource base, repeated context assembly does not duplicate bootstrap, bootstrap
is absent from system sections, and disabling the plugin removes its registrations.
This validates integration plumbing; it does not assert that every model will
follow every workflow. A behavioral smoke test is a new session asking to build
a small feature: check whether the appropriate skill is loaded before coding,
subject to the project's skill-use rules.

## Uninstall

```powershell
dsh plugin --profile desktop remove superpowers
```

Restart DSH. Removing the profile dependency does not delete this source checkout.

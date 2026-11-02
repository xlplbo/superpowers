import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('DSH bundle preserves the existing OpenCode and Pi entry points', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.name, 'superpowers');
  assert.equal(pkg.main, '.opencode/plugins/superpowers.js');
  assert.deepEqual(pkg.pi.skills, ['./skills']);
  assert.deepEqual(pkg.pi.extensions, ['./.pi/extensions/superpowers.ts']);
  assert.equal(pkg.dsh.bundle.patch, './.dsh/cordis.patch.yml');
  assert.equal(pkg.engines, undefined, 'DSH requirements must not restrict other harnesses');
  assert.equal(pkg.dsh.engines.dsh, '>=0.2.1-rc.5 <0.3.0-0');
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-skill-filesystem'], '>=0.2.1-rc.5 <0.3.0-0');
  assert.equal(pkg.peerDependenciesMeta['@deepseek-ai/dsh-skill-filesystem'].optional, true);
  const patch = await read('.dsh/cordis.patch.yml');
  assert.match(patch, /id: superpowers-dsh-skills/);
  assert.match(patch, /name: \.\/skills\.js/);
  assert.match(patch, /id: superpowers-dsh-bootstrap/);
  assert.match(patch, /name: \.\/bootstrap\.js/);
});

test('bootstrap includes the unchanged skill body and the DSH tool mapping', async () => {
  const plugin = await import(new URL('.dsh/bootstrap.js', root));
  const contexts = [];
  plugin.apply({ systemPrompt: { context: (entry) => contexts.push(entry) } });
  assert.deepEqual(plugin.inject, ['systemPrompt']);
  assert.equal(contexts.length, 1);
  const context = contexts[0];
  assert.equal(context.name, 'superpowers:bootstrap');
  assert.equal(context.interpolate, false);
  assert.equal(typeof context.order, 'number');
  const body = (await read('skills/using-superpowers/SKILL.md'))
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim();
  assert.ok(context.text.includes(body));
  assert.ok(context.text.includes((await read('.dsh/tools.md')).trim()));
  assert.ok(context.text.includes(fileURLToPath(new URL('skills/using-superpowers/', root))));
  assert.match(context.text, /already loaded/);
  assert.match(context.text, /AGENTS\.md/);
  assert.equal(context.text.split('superpowers:using-superpowers bootstrap for DSH').length, 2);
});

test('bootstrap preserves literal template expressions and rejects malformed skills', async () => {
  const { createBootstrap } = await import(new URL('.dsh/bootstrap.js', root));
  const output = createBootstrap('---\r\nname: test\r\n---\r\n\r\nKeep {{literal}}', 'Mapping', 'C:/skills');
  assert.match(output, /Keep \{\{literal\}\}/);
  assert.doesNotMatch(output, /name: test/);
  assert.throws(() => createBootstrap('Missing frontmatter', 'Mapping', '/skills'), /frontmatter/);
  assert.throws(() => createBootstrap('---\nname: test\n---\n', 'Mapping', '/skills'), /empty/);
});

test('DSH mapping uses real tools and preserves host permission boundaries', async () => {
  const text = await read('.dsh/tools.md');
  for (const tool of ['skill', 'read', 'write', 'edit', 'pwsh', 'grep', 'glob', 'todo_write', 'subagent', 'web_fetch']) {
    assert.ok(text.includes('`' + tool + '`'), `missing ${tool}`);
  }
  assert.match(text, /superpowers:brainstorming/);
  assert.match(text, /AGENTS\.md/);
  assert.match(text, /unavailable|disabled/);
  assert.match(text, /explicitly requests/);
});

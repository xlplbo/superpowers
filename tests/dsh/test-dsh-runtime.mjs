import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
const sdkRoot = process.env.DSH_TEST_NODE_MODULES;
if (!sdkRoot) throw new Error('Set DSH_TEST_NODE_MODULES to the installed DSH node_modules directory');
const requireSdk = createRequire(join(sdkRoot, '__superpowers_test__.cjs'));
const sdkUrl = (name) => pathToFileURL(requireSdk.resolve(name)).href;
const { Context } = await import(sdkUrl('@deepseek-ai/cordis'));
const { createRuntimeResolution, loadProfileDirectory, PluginPackages } = await import(sdkUrl('@deepseek-ai/dsh-app-boot'));
const installAnchor = join(sdkRoot, '..', 'package.json');
const profileDir = process.env.DSH_TEST_PROFILE_DIR ?? process.env.DSH_PROFILE_DIR;
if (!profileDir) throw new Error('Set DSH_TEST_PROFILE_DIR to the profile containing the local superpowers link');
const profile = loadProfileDirectory('dsh', profileDir, installAnchor);
assert.equal(profile.skippedBundles.some((entry) => entry.packageName === 'superpowers'), false);
assert.ok(profile.layers.some((entry) => entry.packageName === 'superpowers'));
const resolution = await createRuntimeResolution({ installAnchor, profile });
const ctx = new Context();
const packages = ctx.plugin(PluginPackages, { resolution });
await packages.await();
const { SkillRegistry } = await import(sdkUrl('@deepseek-ai/dsh-skill'));
const { SystemPrompt, renderContextSnapshot } = await import(sdkUrl('@deepseek-ai/dsh-system-prompt'));
const skillsPlugin = await import(new URL('.dsh/skills.js', root));
const bootstrapPlugin = await import(new URL('.dsh/bootstrap.js', root));

test('installed DSH registers every skill, preserves resources, and disposes the bundle', async () => {
  const registry = ctx.plugin(SkillRegistry);
  const prompt = ctx.plugin(SystemPrompt, { includeHarnessIdentity: false });
  await Promise.all([registry.await(), prompt.await()]);
  const skills = ctx.plugin(skillsPlugin);
  const bootstrap = ctx.plugin(bootstrapPlugin);
  try {
    await Promise.all([skills.await(), bootstrap.await()]);
    const directories = (await readdir(new URL('skills/', root), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
    const summaries = await ctx.skills.list();
    assert.deepEqual(summaries.map((skill) => skill.name).sort(), directories);
    for (const name of directories) {
      const loaded = await ctx.skills.get(name);
      assert.equal(loaded.provider, 'superpowers-dsh');
      assert.equal(loaded.source, 'bundled');
      assert.deepEqual(loaded.resourceBase, {
        kind: 'directory', path: fileURLToPath(new URL(`skills/${name}`, root)),
      });
      const raw = await readFile(new URL(`skills/${name}/SKILL.md`, root), 'utf8');
      assert.equal(loaded.content, raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '').trim());
    }
    assert.equal(await ctx.skills.get('../package.json'), undefined);
    for (let turn = 0; turn < 3; turn++) {
      const assembly = await ctx.systemPrompt.assemble();
      assert.equal(assembly.sections.some((entry) => entry.text.includes('superpowers:using-superpowers')), false);
      const snapshot = renderContextSnapshot(assembly);
      assert.equal(snapshot.split('superpowers:using-superpowers bootstrap for DSH').length, 2);
      assert.match(snapshot, /DSH tool mapping/);
    }
    await skills.dispose();
    await bootstrap.dispose();
    assert.deepEqual(await ctx.skills.list(), []);
    assert.doesNotMatch(renderContextSnapshot(await ctx.systemPrompt.assemble()), /superpowers:using-superpowers/);
    console.log(`Validated ${directories.length} skills against the installed DSH SDK`);
  } finally {
    await skills.dispose();
    await bootstrap.dispose();
    await prompt.dispose();
    await registry.dispose();
    await packages.dispose();
  }
});

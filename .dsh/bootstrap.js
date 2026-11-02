import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const name = 'superpowers-dsh-bootstrap';
export const inject = ['systemPrompt'];

export function createBootstrap(skillText, mapping, resourceBase) {
  const match = skillText.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Superpowers bootstrap requires YAML frontmatter');
  const body = match[1].trim();
  if (!body) throw new Error('Superpowers bootstrap skill is empty');
  return `<EXTREMELY_IMPORTANT>
superpowers:using-superpowers bootstrap for DSH

You have superpowers. The using-superpowers skill below is already loaded; do not load it again just to bootstrap this session. Load other skills with DSH's skill tool.
Base directory for using-superpowers resources: ${resourceBase}

${body}

${mapping.trim()}
</EXTREMELY_IMPORTANT>`;
}

export function apply(ctx) {
  const skillDir = new URL('../skills/using-superpowers/', import.meta.url);
  const text = createBootstrap(
    readFileSync(new URL('SKILL.md', skillDir), 'utf8'),
    readFileSync(new URL('./tools.md', import.meta.url), 'utf8'),
    fileURLToPath(skillDir),
  );
  ctx.systemPrompt.context({
    name: 'superpowers:bootstrap',
    order: 950,
    interpolate: false,
    text,
  });
}

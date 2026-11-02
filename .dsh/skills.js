import { fileURLToPath } from 'node:url';
import * as filesystemSkills from '@deepseek-ai/dsh-skill-filesystem';

export const name = 'superpowers-dsh-skills';
export const inject = ['skills'];

export function apply(ctx) {
  return ctx.plugin(filesystemSkills, {
    providerName: 'superpowers-dsh',
    includeDefaultRoots: false,
    bundledSkillDir: fileURLToPath(new URL('../skills/', import.meta.url)),
  });
}

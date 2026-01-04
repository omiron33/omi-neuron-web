import fs from 'node:fs/promises';
import path from 'node:path';

export const renderTemplate = (template: string, values: Record<string, string>): string => {
  let output = template;
  for (const [key, value] of Object.entries(values)) {
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return output;
};

export async function writeTemplateFile(
  filePath: string,
  template: string,
  values: Record<string, string>,
  force = false
): Promise<void> {
  const resolved = path.resolve(filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  try {
    await fs.access(resolved);
    if (!force) {
      throw new Error(`File already exists: ${resolved}`);
    }
  } catch {
    // File does not exist; continue.
  }

  const content = renderTemplate(template, values);
  await fs.writeFile(resolved, content, 'utf8');
}

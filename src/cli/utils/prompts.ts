import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function confirmPrompt(message: string): Promise<boolean> {
  const rl = createInterface({ input, output });
  const answer = await rl.question(`${message} (y/N): `);
  rl.close();
  return answer.trim().toLowerCase() === 'y';
}

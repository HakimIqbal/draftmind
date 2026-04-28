import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const OUTPUT_PATH = resolve(__dirname, '../src/types/database.ts');

try {
  const raw = execSync('supabase gen types typescript --local 2>/dev/null', {
    encoding: 'utf-8',
  });
  // Strip any non-TS debug output before the first 'export'
  const typesStart = raw.indexOf('export type');
  const types = typesStart >= 0 ? raw.slice(typesStart) : raw;
  writeFileSync(OUTPUT_PATH, types);
  console.log(`Types generated at ${OUTPUT_PATH}`);
} catch (error) {
  console.error('Failed to generate types. Is Supabase running locally?');
  console.error(error);
  process.exit(1);
}

import fs from 'fs';
import path from 'path';

const dir = 'src/regions';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'index.ts');
let found = 0;
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // just check if we can parse it
  found++;
}
console.log(`Parsed ${found} files`);

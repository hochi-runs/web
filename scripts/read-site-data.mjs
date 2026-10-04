import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Read the project's typed data without evaluating any CMS environment file. */
export async function readSiteData(name) {
  let source = await readFile(path.join(root, 'src/data', name + '.ts'), 'utf8');
  if (name === 'releases') {
    const catalog = await readFile(path.join(root, 'src/data/bandcamp-catalog.json'), 'utf8');
    source = source.replace('import bandcampCatalog from "./bandcamp-catalog.json";', 'const bandcampCatalog = ' + catalog + ';');
    source = source.replace('"../lib/merge-catalog.mjs"', JSON.stringify(pathToFileURL(path.join(root, 'src/lib/merge-catalog.mjs')).href));
  }
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import('data:text/javascript;base64,' + Buffer.from(outputText).toString('base64'));
}

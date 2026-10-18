const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const root = process.cwd();
const dirs = fs.readdirSync(path.join(root,'pages')).filter(d=>fs.existsSync(path.join(root,'pages',d,`${d}.ts`)));
const serviceFiles = fs.existsSync(path.join(root,'services')) ? fs.readdirSync(path.join(root,'services')).filter(f=>f.endsWith('.ts')).map(f=>path.join('services',f)) : [];
const typeFiles = fs.existsSync(path.join(root,'types')) ? fs.readdirSync(path.join(root,'types')).filter(f=>f.endsWith('.ts')).map(f=>path.join('types',f)) : [];
const files = ['app.ts', ...dirs.map(d=>path.join('pages',d,`${d}.ts`)), ...serviceFiles, ...typeFiles, 'components/bottom-nav/bottom-nav.ts'];
for (const rel of files) {
  const input = path.join(root, rel);
  const out = esbuild.transformSync(fs.readFileSync(input, 'utf8'), {loader:'ts', format:'cjs', target:'es2018'}).code;
  fs.writeFileSync(input.replace(/\.ts$/, '.js'), out, 'utf8');
  console.log(rel.replace(/\.ts$/, '.js'));
}

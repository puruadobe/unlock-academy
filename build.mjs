import { build } from "esbuild";
await build({ entryPoints: [new URL("./src/scene3d.js", import.meta.url).pathname], bundle: true, minify: true, format: "iife", outfile: new URL("./public/scene.js", import.meta.url).pathname, target: ["es2020"], legalComments: "eof" });
import { readFile, writeFile } from 'node:fs/promises';
const base = new URL('./public/', import.meta.url);
const bundlePath = new URL('scene.js', base);
await writeFile(bundlePath, (await readFile(bundlePath, 'utf8')).replace(/[ \t]+$/gm, ''));
let html = await readFile(new URL('index.html', base), 'utf8');
const css = await readFile(new URL('style.css', base), 'utf8');
html = html.replace(/<link rel="stylesheet" href="style\.css"\s*\/?>/, () => '<style>' + css + '</style>');
for (const file of ['rooms.js', 'engine.js', 'draft.js', 'scene.js', 'evidence-visuals.js', 'app.js', 'studio-ai.js', 'multiplayer.js']) {
  const script = await readFile(new URL(file, base), 'utf8');
  html = html.replace('<script src="' + file + '"></script>', () => '<script>\n' + script.replace(/<\/script/gi, '<\\/script') + '\n</script>');
}
if (/<script\s+src=|<link\s+rel="stylesheet"/.test(html)) throw Error('Standalone build still references external assets');
await writeFile(new URL('./Unlock-Academy.html', import.meta.url), html);
console.log('Standalone app built with all assets embedded.');

// serve.js
// Prévisualisation locale d'un site généré (les modules JS ne marchent pas en file://).
//   node serve.js immo        → http://localhost:8080
//   node serve.js immo 3000   → http://localhost:3000

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const nomSite = process.argv[2];
const port = Number(process.argv[3] ?? 8080);

if (!nomSite) {
  console.error('Usage : node serve.js <nom-du-site> [port]');
  process.exit(1);
}

const racineSite = join(dirname(fileURLToPath(import.meta.url)), 'dist', nomSite);
const typesMime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function trouverFichier(cheminUrl) {
  // normalize + contrôle du préfixe : empêche de sortir du dossier du site avec "../"
  const chemin = normalize(join(racineSite, decodeURIComponent(cheminUrl)));
  if (!chemin.startsWith(racineSite)) return null;
  try {
    const infos = await stat(chemin);
    return infos.isDirectory() ? join(chemin, 'index.html') : chemin;
  } catch {
    return null;
  }
}

createServer(async (requete, reponse) => {
  const cheminUrl = new URL(requete.url, 'http://localhost').pathname;
  const fichier = await trouverFichier(cheminUrl);

  try {
    if (!fichier) throw new Error('introuvable');
    const contenu = await readFile(fichier);
    reponse.writeHead(200, { 'Content-Type': typesMime[extname(fichier)] ?? 'application/octet-stream' });
    reponse.end(contenu);
  } catch {
    const page404 = await readFile(join(racineSite, '404.html')).catch(() => 'Page introuvable');
    reponse.writeHead(404, { 'Content-Type': typesMime['.html'] });
    reponse.end(page404);
  }
}).listen(port, () => {
  console.log(`Site "${nomSite}" disponible sur http://localhost:${port}`);
});

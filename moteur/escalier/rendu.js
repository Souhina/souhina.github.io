// moteur/escalier/rendu.js
// Rendus SVG d'un escalier calculé par geometrie.js : plan coté, coupe développée le long de la
// ligne de marche, et axonométrie sous un angle choisi (vue « 3D » sans bibliothèque).
// Fonctions pures qui renvoient du texte SVG : utilisables dans Node (tests) et le navigateur.
// Les couleurs viennent de classes CSS (moteur/style.css), donc des thèmes jour et nuit.

const nombre = (valeur, decimales = 0) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimales, minimumFractionDigits: 0 }).format(valeur);
const f = (valeur) => Math.round(valeur * 100) / 100;
const echapper = (texte) => String(texte).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const points = (liste) => liste.map(([x, y]) => `${f(x)},${f(y)}`).join(' ');

// En-tête commun : rôle image, titre et description pour les lecteurs d'écran.
function svg({ id, viewBox, titre, description, contenu }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="esc-svg" viewBox="${viewBox.map(f).join(' ')}" role="img" aria-labelledby="${id}-titre ${id}-desc">
  <title id="${id}-titre">${echapper(titre)}</title>
  <desc id="${id}-desc">${echapper(description)}</desc>
  <defs>
    <marker id="${id}-fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="esc-fleche"/></marker>
  </defs>
${contenu}
</svg>`;
}

// Cote : ligne avec deux traits d'extrémité et la valeur au milieu (coordonnées SVG).
function cote([x1, y1], [x2, y2], texte, taille, decalage = 0) {
  const longueur = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / longueur;
  const ny = (x2 - x1) / longueur;
  const a = [x1 + nx * decalage, y1 + ny * decalage];
  const b = [x2 + nx * decalage, y2 + ny * decalage];
  const tic = taille * 0.45;
  const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const lisible = angle > 90 || angle < -90 ? angle + 180 : angle;
  const milieu = [(a[0] + b[0]) / 2 + nx * taille * 0.55, (a[1] + b[1]) / 2 + ny * taille * 0.55];
  return `  <g class="esc-cote">
    <line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" vector-effect="non-scaling-stroke"/>
    <line x1="${f(a[0] - nx * tic)}" y1="${f(a[1] - ny * tic)}" x2="${f(a[0] + nx * tic)}" y2="${f(a[1] + ny * tic)}" vector-effect="non-scaling-stroke"/>
    <line x1="${f(b[0] - nx * tic)}" y1="${f(b[1] - ny * tic)}" x2="${f(b[0] + nx * tic)}" y2="${f(b[1] + ny * tic)}" vector-effect="non-scaling-stroke"/>
    <text x="${f(milieu[0])}" y="${f(milieu[1])}" font-size="${f(taille)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${f(lisible)} ${f(milieu[0])} ${f(milieu[1])})">${echapper(texte)}</text>
  </g>`;
}

const metres = (cm) => `${nombre(cm / 100, 2)} m`;
const cms = (cm) => `${nombre(cm, 1)} cm`;

// --- Plan coté ---

export function planSvg(esc, textes, id = 'esc-plan') {
  const rects = esc.tremie.rectangles;
  const tous = [...esc.niveaux.flatMap((niveau) => niveau.poly), ...rects.flatMap((r) => [[r.x0, r.y0], [r.x1, r.y1]])];
  const minX = Math.min(...tous.map((p) => p[0]));
  const maxX = Math.max(...tous.map((p) => p[0]));
  const minY = Math.min(...tous.map((p) => p[1]));
  const maxY = Math.max(...tous.map((p) => p[1]));
  const taille = Math.max(maxX - minX, maxY - minY) / 32;
  const marge = taille * 6;
  // Plan : y vers le haut, donc SVG (x, −y).
  const P = ([x, y]) => [x, -y];
  const contenu = [];
  for (const r of rects) contenu.push(`  <rect class="esc-tremie" x="${f(r.x0)}" y="${f(-r.y1)}" width="${f(r.x1 - r.x0)}" height="${f(r.y1 - r.y0)}" vector-effect="non-scaling-stroke"/>`);
  for (const niveau of esc.niveaux) {
    const poly = niveau.poly.map(P);
    // Numéro décalé à côté de la ligne de marche : en dessous si la marche est plus longue que large
    // dans le sens vertical du dessin, à droite sinon.
    const largeurPoly = Math.max(...poly.map((p) => p[0])) - Math.min(...poly.map((p) => p[0]));
    const hauteurPoly = Math.max(...poly.map((p) => p[1])) - Math.min(...poly.map((p) => p[1]));
    const verticale = hauteurPoly > largeurPoly;
    const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length + (verticale || niveau.type === 'palier' ? 0 : taille * 1.3);
    const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length + (verticale || niveau.type === 'palier' ? taille * 1.1 : 0);
    contenu.push(`  <polygon class="esc-${niveau.type}" points="${points(poly)}" vector-effect="non-scaling-stroke"/>`);
    contenu.push(`  <text class="esc-numero" x="${f(cx)}" y="${f(cy)}" font-size="${f(taille * 0.8)}" text-anchor="middle" dominant-baseline="middle">${niveau.type === 'palier' ? echapper(textes.palier) : niveau.niveau}</text>`);
  }
  const ligne = esc.ligne.map(P);
  contenu.push(`  <polyline class="esc-ligne" points="${points(ligne)}" marker-end="url(#${id}-fleche)" vector-effect="non-scaling-stroke"/>`);
  contenu.push(`  <circle class="esc-depart" cx="${f(ligne[0][0])}" cy="${f(ligne[0][1])}" r="${f(taille * 0.35)}"/>`);
  contenu.push(`  <text class="esc-etiquette" x="${f(ligne[0][0] - taille * 0.6)}" y="${f(ligne[0][1])}" font-size="${f(taille * 0.75)}" text-anchor="end" dominant-baseline="middle">${echapper(textes.depart)}</text>`);
  // Cotes d'encombrement (sous et à gauche du dessin) et emmarchement.
  const enc = esc.encombrement;
  contenu.push(cote([enc.x0, -enc.y0 + marge * 0.55], [enc.x1, -enc.y0 + marge * 0.55], metres(enc.x1 - enc.x0), taille));
  contenu.push(cote([enc.x0 - marge * 0.85, -enc.y0], [enc.x0 - marge * 0.85, -enc.y1], metres(enc.y1 - enc.y0), taille));
  const premiere = esc.niveaux[0];
  if (premiere?.type === 'marche') {
    const [a, b] = [P(premiere.poly[0]), P(premiere.poly[1])];
    contenu.push(cote(a, b, `${textes.gironCote} ${cms(esc.giron)}`, taille * 0.8, taille * 0.2));
  }
  const viewBox = [minX - marge, -maxY - marge, maxX - minX + 2 * marge, maxY - minY + 2 * marge];
  return svg({ id, viewBox, titre: textes.titrePlan, description: textes.descriptionPlan(esc), contenu: contenu.join('\n') });
}

// --- Coupe développée le long de la ligne de marche ---

export function coupeSvg(esc, textes, id = 'esc-coupe') {
  const c = esc.config;
  const H = c.hauteur;
  const fin = esc.longueurLigne;
  const sMin = -c.debordNez - 60;
  const sMax = fin + 120;
  const taille = Math.max(sMax - sMin, H) / 34;
  const marge = taille * 5;
  const Z = (z) => -z;
  const contenu = [];
  // Sol et plancher haut (sauf sous la trémie).
  contenu.push(`  <line class="esc-sol" x1="${f(sMin)}" y1="0" x2="${f(sMax)}" y2="0" vector-effect="non-scaling-stroke"/>`);
  const tremie = esc.tremieSurLigne;
  const plancher = tremie ? [[sMin, tremie.s0], [tremie.s1, sMax]] : [[sMin, sMax]];
  for (const [a, b] of plancher) {
    if (b - a > 0.5) contenu.push(`  <rect class="esc-plancher" x="${f(a)}" y="${f(Z(H))}" width="${f(b - a)}" height="${f(c.epaisseurPlancher)}" vector-effect="non-scaling-stroke"/>`);
  }
  // Marches et palier.
  for (const niveau of esc.profil) {
    contenu.push(`  <rect class="esc-${niveau.type}" x="${f(niveau.s0)}" y="${f(Z(niveau.z))}" width="${f(niveau.s1 - niveau.s0)}" height="${f(c.epaisseurMarche)}" vector-effect="non-scaling-stroke"/>`);
    if (c.fermee) contenu.push(`  <rect class="esc-contremarche" x="${f(niveau.s0 + c.debordNez)}" y="${f(Z(niveau.z - c.epaisseurMarche))}" width="1.8" height="${f(esc.hauteurMarche - c.epaisseurMarche)}" vector-effect="non-scaling-stroke"/>`);
  }
  // Ligne d'échappée visée : au-dessus de chaque nez de marche.
  const nez = esc.profil.filter((niveau) => niveau.z + c.echappeeVisee <= H + 30).map((niveau) => [niveau.s0, Z(niveau.z + c.echappeeVisee)]);
  if (nez.length > 1) contenu.push(`  <polyline class="esc-echappee-visee" points="${points(nez)}" vector-effect="non-scaling-stroke"/>`);
  // Échappée minimale mesurée.
  if (esc.echappee.minimum !== null) {
    const s = esc.echappee.position;
    const bas = esc.sousFace - esc.echappee.minimum;
    const classe = esc.echappee.minimum >= c.echappeeVisee ? 'esc-mesure' : 'esc-mesure esc-alerte';
    contenu.push(`  <g class="${classe}">
    <line x1="${f(s)}" y1="${f(Z(bas))}" x2="${f(s)}" y2="${f(Z(esc.sousFace))}" marker-start="url(#${id}-fleche)" marker-end="url(#${id}-fleche)" vector-effect="non-scaling-stroke"/>
    <text x="${f(s + taille * 0.5)}" y="${f(Z(esc.sousFace) + taille * 1.4)}" font-size="${f(taille)}" dominant-baseline="middle">${echapper(textes.echappeeMini)} ${metres(esc.echappee.minimum)}</text>
  </g>`);
  }
  contenu.push(cote([sMax - taille, 0], [sMax - taille, Z(H)], `${metres(H)} (${esc.contremarches} × ${cms(esc.hauteurMarche)})`, taille, -taille * 1.2));
  const viewBox = [sMin - marge * 0.3, Z(H + 60) - marge * 0.3, sMax - sMin + marge, H + 60 + marge * 1.2];
  return svg({ id, viewBox, titre: textes.titreCoupe, description: textes.descriptionCoupe(esc), contenu: contenu.join('\n') });
}

// --- Axonométrie ---

const LUMIERE = (() => {
  const l = [-0.55, -0.75, 0];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

function normale(face) {
  // Méthode de Newell : robuste pour les polygones plans quelconques.
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < face.length; i += 1) {
    const [x1, y1, z1] = face[i];
    const [x2, y2, z2] = face[(i + 1) % face.length];
    nx += (y1 - y2) * (z1 + z2);
    ny += (z1 - z2) * (x1 + x2);
    nz += (x1 - x2) * (y1 + y2);
  }
  const n = Math.hypot(nx, ny, nz) || 1;
  return [nx / n, ny / n, nz / n];
}

const centre = (liste) => liste.reduce((s, p) => [s[0] + p[0] / liste.length, s[1] + p[1] / liste.length, s[2] + p[2] / liste.length], [0, 0, 0]);
const scalaire = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function axoSvg(esc, textes, { azimut = 225, elevation = 30, plancher = true, sol = true } = {}, id = 'esc-axo') {
  const a = (azimut * Math.PI) / 180;
  const e = (elevation * Math.PI) / 180;
  const D = [Math.cos(e) * Math.cos(a), Math.cos(e) * Math.sin(a), Math.sin(e)];
  const droite = [-Math.sin(a), Math.cos(a), 0];
  const haut = [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)];
  const projeter = (p) => [scalaire(p, droite), -scalaire(p, haut)];

  const groupes = [
    ...(sol ? esc.environnement.filter((piece) => piece.type === 'sol').map((piece) => ({ piece, couche: 0 })) : []),
    ...esc.pieces.map((piece) => ({ piece, couche: 1 })),
    ...(plancher ? esc.environnement.filter((piece) => piece.type === 'plancher').map((piece) => ({ piece, couche: 2 })) : []),
  ];
  const faces = [];
  for (const { piece, couche } of groupes) {
    const milieu = centre(piece.faces.flat());
    for (const face of piece.faces) {
      let n = normale(face);
      const cf = centre(face);
      // Normale tournée vers l'extérieur de la pièce.
      if (piece.faces.length > 1 && scalaire(n, [cf[0] - milieu[0], cf[1] - milieu[1], cf[2] - milieu[2]]) < 0) n = n.map((v) => -v);
      if (piece.faces.length === 1 && n[2] < 0) n = n.map((v) => -v);
      if (scalaire(n, D) <= 1e-6) continue;
      const orientation = n[2] > 0.7 ? 'dessus' : n[2] < -0.7 ? 'dessous' : scalaire(n, LUMIERE) > 0 ? 'clair' : 'sombre';
      faces.push({ couche, profondeur: scalaire(cf, D), type: piece.type, orientation, points: face.map(projeter) });
    }
  }
  faces.sort((x, y) => x.couche - y.couche || x.profondeur - y.profondeur);
  const xs = faces.flatMap((face) => face.points.map((p) => p[0]));
  const ys = faces.flatMap((face) => face.points.map((p) => p[1]));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const marge = Math.max(maxX - minX, maxY - minY) * 0.04;
  const contenu = faces.map((face) => `  <polygon class="esc-f esc-f-${face.type} esc-f-${face.orientation}" points="${points(face.points)}" vector-effect="non-scaling-stroke"/>`);
  const viewBox = [minX - marge, minY - marge, maxX - minX + 2 * marge, maxY - minY + 2 * marge];
  return svg({ id, viewBox, titre: textes.titreVue(azimut, elevation), description: textes.descriptionVue(esc), contenu: contenu.join('\n') });
}

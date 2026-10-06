// moteur/escalier/geometrie.js
// Moteur géométrique : transforme une configuration (modele.js) en grandeurs (hauteur de marche,
// giron, reculement, échappée…) et en pièces 3D (marches, contremarches, palier, limons, poteaux,
// plancher haut et sol). Les rendus (rendu.js) dessinent ces pièces sans rien recalculer.
//
// Repère : x et y au sol, z vers le haut, en centimètres. L'escalier part de x = 0 en montant vers
// +x ; un quart tournant « à gauche » tourne vers +y. « À droite » est le symétrique (y → −y).
// Module pur : aucune dépendance au navigateur. Ce n'est pas un plan d'exécution.

import { normaliser } from './modele.js';

const EPAISSEUR_CONTREMARCHE = 1.8;
const SECTION_POTEAU = 9;
const DEPASSEMENT_LIMON = 5; // le limon dépasse de 5 cm au-dessus de la ligne des nez
const PAS_ECHAPPEE = 2; // échantillonnage de la ligne de marche, en cm

// Repères de confort affichés dans le tableau « Points à vérifier » (pas des obligations).
export const REPERES = Object.freeze({
  hauteurMarche: [16, 18],
  gironMin: 24,
  blondel: [60, 64],
  largeurMin: 80,
});

// --- Faces 3D ---

// Repère local d'une volée : origine au sol, direction de montée, direction de la largeur.
function versMonde(volee, u, w, z) {
  return [volee.ox + u * volee.dx + w * volee.lx, volee.oy + u * volee.dy + w * volee.ly, z];
}

// Pavé (6 faces) donné dans le repère local d'une volée.
function pave(volee, u0, u1, w0, w1, z0, z1) {
  const p = (u, w, z) => versMonde(volee, u, w, z);
  return [
    [p(u0, w0, z1), p(u1, w0, z1), p(u1, w1, z1), p(u0, w1, z1)],
    [p(u0, w0, z0), p(u0, w1, z0), p(u1, w1, z0), p(u1, w0, z0)],
    [p(u0, w0, z0), p(u1, w0, z0), p(u1, w0, z1), p(u0, w0, z1)],
    [p(u0, w1, z0), p(u0, w1, z1), p(u1, w1, z1), p(u1, w1, z0)],
    [p(u0, w0, z0), p(u0, w0, z1), p(u0, w1, z1), p(u0, w1, z0)],
    [p(u1, w0, z0), p(u1, w1, z0), p(u1, w1, z1), p(u1, w0, z1)],
  ];
}

const REPERE_MONDE = { ox: 0, oy: 0, dx: 1, dy: 0, lx: 0, ly: 1 };
const paveMonde = (x0, x1, y0, y1, z0, z1) => pave(REPERE_MONDE, x0, x1, y0, y1, z0, z1);

// Prisme : profil (u, z) dans le plan vertical de la volée, épaissi de w0 à w1 dans la largeur.
function prisme(volee, profil, w0, w1) {
  const a = profil.map(([u, z]) => versMonde(volee, u, w0, z));
  const b = profil.map(([u, z]) => versMonde(volee, u, w1, z));
  const faces = [a, [...b].reverse()];
  for (let i = 0; i < profil.length; i += 1) {
    const j = (i + 1) % profil.length;
    faces.push([a[i], a[j], b[j], b[i]]);
  }
  return faces;
}

function sansDoublons(points) {
  return points.filter((point, index) => {
    const precedent = points[(index - 1 + points.length) % points.length];
    return Math.hypot(point[0] - precedent[0], point[1] - precedent[1]) > 0.01;
  });
}

// --- Calcul principal ---

export function calculerEscalier(configuration) {
  const c = normaliser(configuration);
  const erreurs = [];
  const H = c.hauteur;
  const L = c.largeur;
  const d = c.debordNez;
  const e = c.epaisseurMarche;

  // Hauteurs (contremarches) et giron.
  const n = c.contremarches ?? Math.max(3, Math.round(H / c.hauteurVisee));
  const h = H / n;
  const g = c.giron ?? c.blondel - 2 * h;
  if (g < 15) erreurs.push('giron');
  const quart = c.forme === 'quart-palier';
  const k = quart ? Math.min(n - 1, Math.max(1, c.avantPalier ?? Math.round(n / 2))) : null;

  // Volées (repère « à gauche », symétrie appliquée à la fin).
  const X0 = quart ? (k - 1) * g : 0;
  const volees = quart
    ? [
      { ox: 0, oy: 0, dx: 1, dy: 0, lx: 0, ly: 1, premier: 1, marches: k - 1, fin: k },
      { ox: X0, oy: L, dx: 0, dy: 1, lx: 1, ly: 0, premier: k + 1, marches: n - k - 1, fin: n },
    ]
    : [{ ox: 0, oy: 0, dx: 1, dy: 0, lx: 0, ly: 1, premier: 1, marches: n - 1, fin: n }];

  // Ligne de marche (au milieu de l'emmarchement) : abscisse curviligne s.
  const tournant = X0 + L / 2;
  const longueurLigne = quart ? X0 + L + (n - k - 1) * g : (n - 1) * g;
  const pointLigne = (s) => (!quart || s <= tournant ? [s, L / 2] : [tournant, L / 2 + (s - tournant)]);

  // Niveaux : chaque marche et le palier, avec leur étendue sur la ligne de marche.
  const niveaux = [];
  volees.forEach((volee, indexVolee) => {
    const debut = indexVolee === 0 ? 0 : X0 + L;
    for (let j = 0; j < volee.marches; j += 1) {
      niveaux.push({ niveau: volee.premier + j, type: 'marche', volee: indexVolee, j, s0: debut + j * g - d, s1: debut + (j + 1) * g, z: (volee.premier + j) * h });
    }
  });
  if (quart) niveaux.push({ niveau: k, type: 'palier', s0: X0 - d, s1: X0 + L, z: k * h });
  niveaux.sort((a, b) => a.niveau - b.niveau);

  const hauteurSous = (s) => {
    if (s >= longueurLigne) return H;
    let z = 0;
    for (const niveau of niveaux) if (s >= niveau.s0 && s <= niveau.s1) z = Math.max(z, niveau.z);
    return z;
  };

  // Trémie : ouverture du plancher haut, mesurée le long de la ligne de marche depuis le bord
  // d'arrivée. Sur un quart tournant, elle passe au-dessus du palier puis, si besoin, de la
  // première volée : elle devient alors une trémie en L (deux rectangles).
  const largeurTremie = c.tremieLargeur ?? L;
  const yArrivee = quart ? L + (n - k - 1) * g : 0;
  const rectanglesTremie = (longueur) => {
    if (longueur <= 0) return [];
    const debut = longueurLigne - longueur;
    if (!quart) return [{ x0: debut, x1: longueurLigne, y0: (L - largeurTremie) / 2, y1: (L + largeurTremie) / 2 }];
    const colonne = { x0: X0 + (L - largeurTremie) / 2, x1: X0 + (L + largeurTremie) / 2, y0: debut >= X0 + L ? L + (debut - X0 - L) : 0, y1: yArrivee };
    return debut >= X0 ? [colonne] : [colonne, { x0: debut, x1: X0 + (L - largeurTremie) / 2, y0: (L - largeurTremie) / 2, y1: (L + largeurTremie) / 2 }];
  };
  const sousFace = H - c.epaisseurPlancher;
  const dansRectangle = ([x, y], r) => x >= r.x0 - 1e-9 && x <= r.x1 + 1e-9 && y >= r.y0 - 1e-9 && y <= r.y1 + 1e-9;
  const dansTremie = (point, rects) => rects.some((r) => dansRectangle(point, r));

  function echappeePour(rects) {
    let minimum = Infinity;
    let position = null;
    for (let s = 0; s <= longueurLigne; s += PAS_ECHAPPEE) {
      if (dansTremie(pointLigne(s), rects)) continue;
      const libre = sousFace - hauteurSous(s);
      if (libre < minimum) { minimum = libre; position = s; }
    }
    return { minimum, position };
  }

  // Longueur de trémie conseillée : la plus courte qui garde l'échappée visée sur toute la ligne de marche.
  let longueurConseillee = null;
  for (let longueur = 0; longueur <= Math.ceil(longueurLigne); longueur += 1) {
    if (echappeePour(rectanglesTremie(longueur)).minimum >= c.echappeeVisee) { longueurConseillee = longueur; break; }
  }
  const longueurTremie = Math.min(c.tremieLongueur ?? longueurConseillee ?? Math.ceil(longueurLigne), Math.ceil(longueurLigne));
  const rectsTremie = rectanglesTremie(longueurTremie);
  const echappee = echappeePour(rectsTremie);

  // --- Pièces 3D ---
  const pieces = [];
  const ajouter = (type, nom, faces) => pieces.push({ type, nom, faces });
  const Hv = c.hauteurLimon * Math.sqrt(1 + (h / g) ** 2);
  const t = c.epaisseurLimon;

  volees.forEach((volee, indexVolee) => {
    for (let j = 0; j < volee.marches; j += 1) {
      const niveau = volee.premier + j;
      ajouter('marche', `Marche ${niveau}`, pave(volee, j * g - d, (j + 1) * g, 0, L, niveau * h - e, niveau * h));
      if (c.fermee) ajouter('contremarche', `Contremarche ${niveau}`, pave(volee, j * g, j * g + EPAISSEUR_CONTREMARCHE, 0, L, (niveau - 1) * h, niveau * h - e));
    }
    // Contremarche du palier ou de l'arrivée, au bout de la volée.
    if (c.fermee) {
      const haut = volee.fin === n ? H - c.epaisseurPlancher : volee.fin * h - e;
      ajouter('contremarche', `Contremarche ${volee.fin}`, pave(volee, volee.marches * g, volee.marches * g + EPAISSEUR_CONTREMARCHE, 0, L, (volee.fin - 1) * h, haut));
    }
    if (volee.marches < 1) return;
    const a = volee.premier;
    const zBas = (a - 1) * h;
    const ue = volee.marches * g;
    if (c.structure === 'deux-limons') {
      const haut = (u) => a * h + DEPASSEMENT_LIMON + (u * h) / g;
      const u0 = -d;
      const u5 = ((zBas - (a * h + DEPASSEMENT_LIMON - Hv)) * g) / h;
      const profil = sansDoublons([
        [u0, Math.max(zBas, haut(u0) - Hv)],
        [u0, haut(u0)],
        [ue, haut(ue)],
        [ue, haut(ue) - Hv],
        ...(u5 > u0 ? [[u5, zBas]] : []),
      ]);
      ajouter('limon', `Limon ${indexVolee + 1}, côté 1`, prisme(volee, profil, -t, 0));
      ajouter('limon', `Limon ${indexVolee + 1}, côté 2`, prisme(volee, profil, L, L + t));
    } else {
      // Limon central : il touche l'arrière de chaque marche, par-dessous.
      const haut = (u) => a * h - e + ((u - g) * h) / g;
      const u0 = (e * g) / h;
      const u5 = u0 + (Hv * g) / h;
      const profil = sansDoublons([
        [u0, zBas],
        [ue, haut(ue)],
        [ue, Math.max(zBas, haut(ue) - Hv)],
        [Math.min(u5, ue), zBas],
      ]);
      ajouter('limon', `Limon central ${indexVolee + 1}`, prisme(volee, profil, L / 2 - t, L / 2 + t));
    }
  });

  if (quart) {
    ajouter('palier', 'Palier', paveMonde(X0 - d, X0 + L, 0, L, k * h - e, k * h));
    const s = SECTION_POTEAU;
    ajouter('poteau', 'Poteau du palier (angle intérieur)', paveMonde(X0 - s, X0, L, L + s, 0, k * h + DEPASSEMENT_LIMON));
    ajouter('poteau', 'Poteau du palier (angle extérieur)', paveMonde(X0 + L, X0 + L + s, -s, 0, 0, k * h - e));
  }

  // Environnement : sol et plancher haut percé de la trémie (rendus 3D seulement).
  const xs = pieces.flatMap((piece) => piece.faces.flat().map((point) => point[0]));
  const ys = pieces.flatMap((piece) => piece.faces.flat().map((point) => point[1]));
  const boite = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  const marge = 40;
  const xsT = rectsTremie.flatMap((r) => [r.x0, r.x1]);
  const ysT = rectsTremie.flatMap((r) => [r.y0, r.y1]);
  const zone = quart
    ? { x0: Math.min(boite.x0, ...xsT) - marge, x1: Math.max(boite.x1, ...xsT) + marge, y0: Math.min(boite.y0, ...ysT) - marge, y1: Math.max(boite.y1, ...ysT) + 120 }
    : { x0: Math.min(boite.x0, ...xsT) - marge, x1: Math.max(boite.x1, ...xsT) + 120, y0: Math.min(boite.y0, ...ysT) - marge, y1: Math.max(boite.y1, ...ysT) + marge };
  const environnement = [];
  environnement.push({ type: 'sol', nom: 'Sol', faces: [paveMonde(zone.x0, zone.x1, zone.y0, zone.y1, -3, 0)[0]] });
  const coupesX = [...new Set([zone.x0, zone.x1, ...xsT].filter((x) => x >= zone.x0 && x <= zone.x1))].sort((a, b) => a - b);
  const coupesY = [...new Set([zone.y0, zone.y1, ...ysT].filter((y) => y >= zone.y0 && y <= zone.y1))].sort((a, b) => a - b);
  for (let i = 0; i < coupesX.length - 1; i += 1) {
    for (let j = 0; j < coupesY.length - 1; j += 1) {
      const centre = [(coupesX[i] + coupesX[i + 1]) / 2, (coupesY[j] + coupesY[j + 1]) / 2];
      if (coupesX[i + 1] - coupesX[i] < 0.5 || coupesY[j + 1] - coupesY[j] < 0.5 || dansTremie(centre, rectsTremie)) continue;
      environnement.push({ type: 'plancher', nom: 'Plancher haut', faces: paveMonde(coupesX[i], coupesX[i + 1], coupesY[j], coupesY[j + 1], sousFace, H) });
    }
  }

  // Symétrie pour un virage à droite.
  const miroir = quart && c.sens === 'droite';
  const retourner = (point) => (miroir ? [point[0], -point[1], point[2]] : point);
  for (const piece of [...pieces, ...environnement]) piece.faces = piece.faces.map((face) => face.map(retourner));
  const rect2D = (r) => (miroir ? { ...r, y0: -r.y1, y1: -r.y0 } : r);

  // Empreintes au sol (vue en plan) : marches et palier, dans l'ordre de montée.
  const empreintes = niveaux.map((niveau) => {
    if (niveau.type === 'palier') return { ...niveau, poly: [[X0 - d, 0], [X0 + L, 0], [X0 + L, L], [X0 - d, L]] };
    const volee = volees[niveau.volee];
    const p = (u, w) => versMonde(volee, u, w, 0).slice(0, 2);
    return { ...niveau, poly: [p(niveau.j * g - d, 0), p((niveau.j + 1) * g, 0), p((niveau.j + 1) * g, L), p(niveau.j * g - d, L)] };
  }).map((niveau) => ({ ...niveau, poly: niveau.poly.map(([x, y]) => [x, miroir ? -y : y]) }));
  const ligne = [pointLigne(0), ...(quart ? [pointLigne(tournant)] : []), pointLigne(longueurLigne)].map(([x, y]) => [x, miroir ? -y : y]);

  // Encombrement au sol (marches, palier et nez compris).
  const tousPoints = empreintes.flatMap((niveau) => niveau.poly);
  const encombrement = tousPoints.length
    ? { x0: Math.min(...tousPoints.map((p) => p[0])), x1: Math.max(...tousPoints.map((p) => p[0])), y0: Math.min(...tousPoints.map((p) => p[1])), y1: Math.max(...tousPoints.map((p) => p[1])) }
    : { x0: 0, x1: 0, y0: 0, y1: L };

  // --- Repères et quantités ---
  const blondel = 2 * h + g;
  const angle = (Math.atan(h / g) * 180) / Math.PI;
  const statut = (condition) => (condition ? 'ok' : 'hors');
  const points = [
    { id: 'hauteurMarche', valeur: h, statut: statut(h >= REPERES.hauteurMarche[0] - 1e-9 && h <= REPERES.hauteurMarche[1] + 1e-9) },
    { id: 'giron', valeur: g, statut: statut(g >= REPERES.gironMin) },
    { id: 'blondel', valeur: blondel, statut: statut(blondel >= REPERES.blondel[0] - 1e-9 && blondel <= REPERES.blondel[1] + 1e-9) },
    { id: 'largeur', valeur: L, statut: statut(L >= REPERES.largeurMin) },
    { id: 'echappee', valeur: Number.isFinite(echappee.minimum) ? echappee.minimum : null, statut: Number.isFinite(echappee.minimum) ? statut(echappee.minimum >= c.echappeeVisee - 1e-9) : 'ok' },
    { id: 'gardeCorps', valeur: null, statut: 'verifier' },
  ];

  const marchesSeules = niveaux.filter((niveau) => niveau.type === 'marche').length;
  const limons = pieces.filter((piece) => piece.type === 'limon');
  const longueurPiece = (piece) => {
    const pts = piece.faces[0];
    let max = 0;
    for (const a of pts) for (const b of pts) max = Math.max(max, Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]));
    return max;
  };
  const longueursLimons = limons.map(longueurPiece);
  const volumeBois = (
    marchesSeules * L * (g + d) * e
    + (quart ? (L + d) * L * e : 0)
    + (c.fermee ? n * L * (h - e) * EPAISSEUR_CONTREMARCHE : 0)
    + longueursLimons.reduce((total, longueur) => total + longueur * c.hauteurLimon * (c.structure === 'deux-limons' ? t : 2 * t), 0)
  ) / 1e6;
  const quantites = {
    marches: marchesSeules,
    palier: quart ? 1 : 0,
    contremarches: c.fermee ? n : 0,
    limons: limons.length,
    longueurLimonMax: longueursLimons.length ? Math.ceil(Math.max(...longueursLimons) / 10) * 10 : 0,
    poteaux: pieces.filter((piece) => piece.type === 'poteau').length,
    volumeBois,
  };

  return {
    config: c,
    erreurs,
    contremarches: n,
    hauteurMarche: h,
    giron: g,
    blondel,
    angle,
    avantPalier: k,
    longueurLigne,
    encombrement,
    niveaux: empreintes,
    ligne,
    tremie: { rectangles: rectsTremie.map(rect2D), longueur: longueurTremie, largeur: largeurTremie, longueurConseillee, enL: rectsTremie.length > 1 },
    sousFace,
    echappee: { minimum: Number.isFinite(echappee.minimum) ? echappee.minimum : null, position: echappee.position },
    profil: niveaux.map(({ niveau, type, s0, s1, z }) => ({ niveau, type, s0, s1, z })),
    tremieSurLigne: (() => {
      // Portion de la ligne de marche sous la trémie (pour la coupe développée).
      let debut = null;
      let fin = null;
      for (let s = 0; s <= longueurLigne; s += 1) {
        if (dansTremie(pointLigne(s), rectsTremie)) { debut ??= s; fin = s; }
      }
      return debut === null ? null : { s0: debut, s1: fin };
    })(),
    points,
    quantites,
    pieces,
    environnement,
  };
}

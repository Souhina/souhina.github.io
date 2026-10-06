// moteur/plan.js
// Éditeur de plan de pièce : dessin à la souris ou au doigt sur une grille SVG,
// et tableau de coordonnées pour ajuster au centimètre ou travailler au clavier.
// Unité interne : le centimètre. La forme validée est mémorisée dans le navigateur
// pour être réutilisée d'un calculateur à l'autre (peinture, carrelage…).

import { aire, perimetre, estSimple } from './geometrie.js';
import { lireNombre } from './nombres.js';
import {
  TYPES_OUVERTURE,
  nomsOuvertures,
  normaliserOuvertures,
  totauxOuvertures,
  insererAngle,
  supprimerAngle,
  longueurCote,
  emplacementLibre,
} from './ouvertures.js';
import { CLE_CHANTIER, chargerChantier, creerPiece, pieceActive, nomLibre, natureDe, idActif, definirActive } from './chantier.js';
import { disposer, geometrie, versEnsemble, aimanter as aimanterPiece, chevauchements } from './ensemble.js';
import { infosPiece, mursCommuns, piecesDePortee, mesures, normaliserNiveaux, niveauDe, normaliserElements, TYPES_ELEMENT, ELEMENTS_PAR_NATURE } from './chantier-plan.js';
import { TYPES_MUR, normaliserMurs, insererAngleMurs, supprimerAngleMurs, contourExterieur, normaleExterieure, totauxMurs } from './murs.js';
import { T } from './langue.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const PAS_AIMANT = 5; // les angles s'alignent sur une grille de 5 cm
const metresFr = { format: (valeur) => new Intl.NumberFormat(T().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valeur) };

// Formes de départ. Pour un mur (vue de face), largeur = longueur du mur et longueur = hauteur sous
// l'égout ; le pignon ajoute une pointe d'environ 35 % de la longueur. Pour un pan de toit dessiné à plat,
// largeur = longueur à l'égout et longueur = profondeur ; trapèze = pan de croupe, triangle = croupe.
const modeles = {
  rectangle: (largeur = 400, longueur = 300) => [[0, 0], [largeur, 0], [largeur, longueur], [0, longueur]],
  l: () => [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]],
  pignon: (largeur = 800, longueur = 250) => {
    const pointe = Math.round(largeur * 0.35);
    return [[0, pointe], [Math.round(largeur / 2), 0], [largeur, pointe], [largeur, pointe + longueur], [0, pointe + longueur]];
  },
  trapeze: (largeur = 1000, longueur = 400) => {
    const retrait = Math.min(longueur, Math.floor(largeur / 2) - 10);
    return [[retrait, 0], [largeur - retrait, 0], [largeur, longueur], [0, longueur]];
  },
  triangle: (largeur = 800, longueur = 400) => [[Math.round(largeur / 2), 0], [largeur, longueur], [0, longueur]],
};
// Forme et nom par défaut d'un nouvel objet, selon sa nature.
const DEPART_PAR_NATURE = {
  piece: () => modeles.rectangle(),
  zone: () => modeles.rectangle(500, 400),
  mur: () => modeles.rectangle(500, 250),
  pan: () => modeles.rectangle(1000, 450),
};

export function nomAngle(index) {
  return index < 26 ? String.fromCharCode(65 + index) : `P${index + 1}`;
}

const aimanter = (valeur) => Math.round(valeur / PAS_AIMANT) * PAS_AIMANT;
const metres = (centimetres) => `${metresFr.format(centimetres / 100)} m`;
const distance = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

// Le plan appartient à la pièce active du chantier (voir chantier.js), mémorisé sous chantier-v1.
function lireChantier() {
  return chargerChantier((cle) => {
    try {
      return localStorage.getItem(cle);
    } catch {
      return null;
    }
  });
}

function ecrireChantier(chantier) {
  try {
    localStorage.setItem(CLE_CHANTIER, JSON.stringify(chantier));
  } catch {
    // Navigation privée ou stockage plein : le chantier fonctionne quand même, sans mémorisation.
  }
}

function elementSvg(nom, attributs, parent) {
  const element = document.createElementNS(SVGNS, nom);
  for (const [cle, valeur] of Object.entries(attributs)) element.setAttribute(cle, valeur);
  parent.appendChild(element);
  return element;
}

export function creerEditeurPlan(racine, surChangement) {
  // Plan de la pièce (le plan d'ensemble a ses propres éléments, placés avant dans le cadre).
  const svg = racine.querySelector('.plan-svg:not(.ensemble-svg)');
  const corpsTableau = racine.querySelector('.plan-coordonnees tbody');
  const resume = racine.querySelector('#plan-resume');
  const champLargeur = racine.querySelector('#plan-largeur');
  const champLongueur = racine.querySelector('#plan-longueur');

  const corpsOuvertures = racine.querySelector('.plan-ouvertures tbody');
  const corpsMurs = racine.querySelector('.plan-murs tbody');
  const corpsElements = racine.querySelector('.plan-elements tbody');
  const compteurOuvertures = racine.querySelector('.plan-ouvertures-nombre');
  const choixPiece = racine.querySelector('#piece-active');
  const nomPiece = racine.querySelector('#piece-nom');
  const statutPiece = racine.querySelector('#pieces-statut');
  const hauteurPiece = racine.querySelector('#piece-hauteur');
  const nature = racine.dataset.nature || 'piece';
  const chantier = lireChantier();
  if (!chantier.pieces.some((piece) => natureDe(piece) === nature)) {
    const premiere = creerPiece(nomLibre(chantier, T().natures[nature].base, nature), DEPART_PAR_NATURE[nature](), [], 2.5, [], undefined, [], nature);
    chantier.pieces.push(premiere);
    definirActive(chantier, premiere.id, nature);
  }
  const depart = pieceActive(chantier, nature);

  const etat = {
    chantier,
    points: depart.points.map((point) => [...point]),
    ouvertures: depart.ouvertures.map((ouverture) => ({ ...ouverture })),
    murs: depart.murs.map((mur) => ({ ...mur })),
    elements: (depart.elements ?? []).map((element) => ({ ...element })),
    ouvertureGlissee: null, // index de l'ouverture déplacée le long de son mur
    ferme: true,
    vue: null,
    appui: null, // index de l'angle sous le pointeur au moment de l'appui
    glisse: false,
  };
  let imageEnAttente = null;

  // Chantier tel qu'il est à l'écran : la pièce active avec ses modifications en cours.
  function chantierCourant() {
    const active = pieceActive(etat.chantier, nature);
    const enCours = {
      ...active,
      points: etat.points.map((point) => [...point]),
      ouvertures: etat.ouvertures.map((ouverture) => ({ ...ouverture })),
      murs: normaliserMurs(etat.murs, etat.points.length),
      elements: normaliserElements(etat.elements),
    };
    return { ...etat.chantier, pieces: etat.chantier.pieces.map((piece) => (piece.id === active.id ? enCours : piece)) };
  }

  function informations() {
    if (!etat.ferme || etat.points.length < 3) {
      return { valide: false, message: T().plan.formeOuverte };
    }
    if (!estSimple(etat.points)) {
      return { valide: false, message: T().plan.formeCroisee };
    }
    const chantier = chantierCourant();
    return infosPiece(chantier.pieces.find((piece) => piece.id === idActif(etat.chantier, nature)), chantier);
  }

  // Plans de toutes les pièces concernées par un calcul : la pièce, son niveau ou tout le chantier.
  function infosPortee(portee) {
    if (portee === 'piece' || !informations().valide) return [informations()];
    const chantier = chantierCourant();
    const communs = mursCommuns(chantier);
    return piecesDePortee(chantier, portee, idActif(etat.chantier, nature)).map((piece) => infosPiece(piece, chantier, communs));
  }

  function calculerVue() {
    const contour = nature === 'piece' && etat.ferme && etat.points.length >= 3 ? contourExterieur(etat.points, normaliserMurs(etat.murs, etat.points.length)) : etat.points;
    const xs = [...etat.points, ...contour].map((point) => point[0]);
    const ys = [...etat.points, ...contour].map((point) => point[1]);
    // En dessin libre, la zone couvre au moins 10 m × 7 m pour pouvoir placer les angles.
    const minX = Math.min(0, ...xs);
    const minY = Math.min(0, ...ys);
    const maxX = Math.max(etat.ferme ? 100 : 1000, ...xs);
    const maxY = Math.max(etat.ferme ? 100 : 700, ...ys);
    // Marge autour de la forme : au moins 70 px à l'écran pour que les cotes ne soient pas coupées,
    // y compris celles des murs verticaux, plus larges. Marge = 70 × (étendue + 2 × marge) ÷ largeur affichée.
    const largeurEcran = svg.getBoundingClientRect().width || 800;
    const margeCotes = largeurEcran > 200 ? (70 * (maxX - minX)) / (largeurEcran - 140) : 0;
    const marge = Math.max(Math.max(maxX - minX, maxY - minY) * 0.1 + 30, margeCotes);
    etat.vue = { x: minX - marge, y: minY - marge, largeur: maxX - minX + 2 * marge, hauteur: maxY - minY + 2 * marge };
  }

  function rendreSvg() {
    const { x, y, largeur, hauteur } = etat.vue;
    svg.setAttribute('viewBox', `${x} ${y} ${largeur} ${hauteur}`);
    svg.replaceChildren();
    // Taille d'un pixel écran en centimètres de plan : repères et textes gardent la même
    // taille à l'écran, et les angles restent assez grands pour être attrapés au doigt.
    const cadre = svg.getBoundingClientRect();
    const pixelsParCm = cadre.width > 0 ? Math.min(cadre.width / largeur, cadre.height / hauteur) : 800 / largeur;
    const echelle = 4 / pixelsParCm; // 1 unité d’échelle = 4 px à l’écran

    const grille = elementSvg('g', { class: 'plan-grille' }, svg);
    for (let gx = Math.ceil(x / 50) * 50; gx <= x + largeur; gx += 50) {
      elementSvg('line', { x1: gx, y1: y, x2: gx, y2: y + hauteur, class: gx % 100 === 0 ? 'metre' : '' }, grille);
    }
    for (let gy = Math.ceil(y / 50) * 50; gy <= y + hauteur; gy += 50) {
      elementSvg('line', { x1: x, y1: gy, x2: x + largeur, y2: gy, class: gy % 100 === 0 ? 'metre' : '' }, grille);
    }

    const points = etat.points;
    // Murs : épaisseur dessinée vers l'extérieur, un quadrilatère par côté (angles extérieurs raccordés).
    const murs = nature === 'piece' && etat.ferme && points.length >= 3 ? normaliserMurs(etat.murs, points.length) : null;
    if (murs) {
      const exterieur = contourExterieur(points, murs);
      murs.forEach((mur, i) => {
        const j = (i + 1) % points.length;
        elementSvg('polygon', {
          points: [points[i], points[j], exterieur[j], exterieur[i]].map((point) => point.join(',')).join(' '),
          class: `plan-mur plan-mur-${mur.type}`,
        }, svg);
      });
    }
    if (points.length > 1) {
      elementSvg(etat.ferme ? 'polygon' : 'polyline', {
        points: points.map((point) => point.join(',')).join(' '),
        class: etat.ferme ? 'plan-forme' : 'plan-trace',
      }, svg);
    }

    const nombreCotes = etat.ferme ? points.length : points.length - 1;
    // Centre moyen des angles : sert à placer chaque cote du côté extérieur du mur.
    const centreX = points.reduce((somme, point) => somme + point[0], 0) / (points.length || 1);
    const centreY = points.reduce((somme, point) => somme + point[1], 0) / (points.length || 1);
    for (let i = 0; i < nombreCotes; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const longueur = distance(a, b);
      if (longueur === 0) continue;
      const milieuX = (a[0] + b[0]) / 2;
      const milieuY = (a[1] + b[1]) / 2;
      let nx = -(b[1] - a[1]) / longueur;
      let ny = (b[0] - a[0]) / longueur;
      if ((milieuX - centreX) * nx + (milieuY - centreY) * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      // Décalage plus grand pour les murs proches de la verticale, où le texte est large.
      const decalage = echelle * (4 + 7 * Math.abs(nx)) + (murs ? murs[i].epaisseur : 0);
      const cote = elementSvg('text', {
        x: milieuX + nx * decalage,
        y: milieuY + ny * decalage,
        class: 'plan-cote',
        'font-size': echelle * 3.4,
      }, svg);
      cote.textContent = metres(longueur);

      if (etat.ferme) {
        // Poignée d'ajout d'angle au milieu de la plus grande partie libre du mur, jamais sur une ouverture.
        const occupes = etat.ouvertures
          .filter((ouverture) => ouverture.cote === i)
          .map((ouverture) => [ouverture.position, ouverture.position + ouverture.largeur])
          .sort((u, v) => u[0] - v[0]);
        let libre = [0, 0];
        let debut = 0;
        for (const [gauche, droite] of [...occupes, [longueur, longueur]]) {
          if (gauche - debut > libre[1] - libre[0]) libre = [debut, gauche];
          debut = Math.max(debut, droite);
        }
        const t = (libre[0] + libre[1]) / 2;
        const milieu = elementSvg('circle', {
          cx: a[0] + ((b[0] - a[0]) * t) / longueur,
          cy: a[1] + ((b[1] - a[1]) * t) / longueur,
          r: echelle * 2,
          class: 'plan-milieu',
          'data-milieu': i,
          'data-distance': t,
        }, svg);
        elementSvg('title', {}, milieu).textContent = T().plan.ajouterAngleEntre(nomAngle(i), nomAngle((i + 1) % points.length));
      }
    }

    // Ouvertures : trait épais sur le mur, avec une zone de prise plus large pour le doigt.
    if (etat.ferme) {
      const noms = nomsOuvertures(etat.ouvertures);
      etat.ouvertures.forEach((ouverture, index) => {
        const a = points[ouverture.cote];
        const b = points[(ouverture.cote + 1) % points.length];
        const longueur = distance(a, b);
        if (!longueur) return;
        const ux = (b[0] - a[0]) / longueur;
        const uy = (b[1] - a[1]) / longueur;
        const x1 = a[0] + ux * ouverture.position;
        const y1 = a[1] + uy * ouverture.position;
        const x2 = a[0] + ux * (ouverture.position + ouverture.largeur);
        const y2 = a[1] + uy * (ouverture.position + ouverture.largeur);
        const groupe = elementSvg('g', { class: `plan-ouverture plan-ouverture-${ouverture.type}`, 'data-ouverture': index }, svg);
        elementSvg('title', {}, groupe).textContent = T().ouvertures.titreDessin(noms[index], T().ouvertures.types[ouverture.type].toLowerCase(), ouverture.largeur, ouverture.hauteur);
        // Baie : l'ouverture traverse le mur sur toute son épaisseur.
        const epaisseurMur = normaliserMurs(etat.murs, points.length)[ouverture.cote].epaisseur;
        const [ex, ey] = normaleExterieure(points, ouverture.cote).map((composante) => composante * epaisseurMur);
        elementSvg('polygon', { points: [[x1, y1], [x2, y2], [x2 + ex, y2 + ey], [x1 + ex, y1 + ey]].map((point) => point.join(',')).join(' '), class: 'plan-ouverture-baie' }, groupe);
        elementSvg('line', { x1, y1, x2, y2, class: 'plan-ouverture-fond' }, groupe);
        elementSvg('line', { x1, y1, x2, y2, class: 'plan-ouverture-trait' }, groupe);
        elementSvg('line', { x1, y1, x2, y2, class: 'plan-ouverture-prise' }, groupe);
        // Étiquette vers l'intérieur de la pièce.
        let nx = -uy;
        let ny = ux;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        if ((centreX - mx) * nx + (centreY - my) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        const etiquette = elementSvg('text', { x: mx + nx * echelle * 4, y: my + ny * echelle * 4, class: 'plan-ouverture-nom', 'font-size': echelle * 3 }, svg);
        etiquette.textContent = noms[index];
      });
    }

    // Ouvertures partagées : posées dans la pièce voisine, sur le mur commun (non modifiables ici).
    if (etat.ferme && points.length >= 3 && estSimple(points)) {
      const infos = informations();
      for (const ouverture of infos.ouvertures.filter((element) => element.partagee)) {
        const a = points[ouverture.cote];
        const b = points[(ouverture.cote + 1) % points.length];
        const longueur = distance(a, b);
        if (!longueur) continue;
        const ux = (b[0] - a[0]) / longueur;
        const uy = (b[1] - a[1]) / longueur;
        const groupe = elementSvg('g', { class: `plan-ouverture-partagee plan-ouverture-${ouverture.type}` }, svg);
        elementSvg('title', {}, groupe).textContent = T().ouvertures.partagee;
        elementSvg('line', {
          x1: a[0] + ux * ouverture.position, y1: a[1] + uy * ouverture.position,
          x2: a[0] + ux * (ouverture.position + ouverture.largeur), y2: a[1] + uy * (ouverture.position + ouverture.largeur),
          class: 'plan-ouverture-trait',
        }, groupe);
      }
      // Éléments à déduire : rectangles hachurés.
      for (const element of normaliserElements(etat.elements)) {
        const rectangle = elementSvg('rect', { x: element.x, y: element.y, width: element.largeur, height: element.longueur, class: `plan-element plan-element-${element.type}` }, svg);
        elementSvg('title', {}, rectangle).textContent = T().elements.types[element.type];
      }
    }

    // Poignées d'ajout d'angle au premier plan, pour rester accessibles même sous une ouverture.
    svg.append(...svg.querySelectorAll('.plan-milieu'));

    points.forEach((point, index) => {
      const angle = elementSvg('circle', { cx: point[0], cy: point[1], r: echelle * 2.75, class: 'plan-angle', 'data-angle': index }, svg);
      elementSvg('title', {}, angle).textContent = T().plan.angleDessin(nomAngle(index));
      const lettre = elementSvg('text', {
        x: point[0] + echelle * 4,
        y: point[1] + echelle * 4,
        class: 'plan-lettre',
        'font-size': echelle * 3.4,
      }, svg);
      lettre.textContent = nomAngle(index);
    });
  }

  function rendreTableau() {
    corpsTableau.replaceChildren();
    etat.points.forEach((point, index) => {
      const ligne = document.createElement('tr');

      const entete = document.createElement('th');
      entete.scope = 'row';
      entete.textContent = nomAngle(index);
      ligne.append(entete);

      for (const axe of [0, 1]) {
        const cellule = document.createElement('td');
        const saisie = document.createElement('input');
        saisie.type = 'text';
        saisie.inputMode = 'numeric';
        saisie.autocomplete = 'off';
        saisie.value = String(point[axe]);
        saisie.dataset.index = index;
        saisie.dataset.axe = axe;
        saisie.setAttribute('aria-label', T().plan.anglePosition(nomAngle(index), axe));
        cellule.append(saisie);
        ligne.append(cellule);
      }

      const celluleCote = document.createElement('td');
      celluleCote.className = 'plan-longueur';
      ligne.append(celluleCote);

      const celluleAction = document.createElement('td');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = T().pieces.supprimer;
      bouton.dataset.supprimer = index;
      bouton.setAttribute('aria-label', T().plan.supprimerAngle(nomAngle(index)));
      bouton.disabled = etat.ferme && etat.points.length <= 3;
      celluleAction.append(bouton);
      ligne.append(celluleAction);

      corpsTableau.append(ligne);
    });
    mettreAJourLongueurs();
  }

  function rendreOuvertures() {
    if (!corpsOuvertures) return;
    corpsOuvertures.replaceChildren();
    const noms = nomsOuvertures(etat.ouvertures);
    const nombreCotes = etat.points.length;
    if (compteurOuvertures) compteurOuvertures.textContent = etat.ouvertures.length ? ` (${etat.ouvertures.length})` : '';

    etat.ouvertures.forEach((ouverture, index) => {
      const ligne = document.createElement('tr');
      const entete = document.createElement('th');
      entete.scope = 'row';
      entete.textContent = noms[index];
      ligne.append(entete);

      const liste = (champ, options, libelle) => {
        const cellule = document.createElement('td');
        const choix = document.createElement('select');
        choix.dataset.ouverture = index;
        choix.dataset.champ = champ;
        choix.setAttribute('aria-label', `${noms[index]}, ${libelle}`);
        for (const [valeur, texte] of options) {
          const option = document.createElement('option');
          option.value = valeur;
          option.textContent = texte;
          option.selected = String(ouverture[champ]) === String(valeur);
          choix.append(option);
        }
        cellule.append(choix);
        ligne.append(cellule);
      };
      liste('type', Object.keys(TYPES_OUVERTURE).map((cle) => [cle, T().ouvertures.types[cle]]), T().ouvertures.etiquetteType);
      liste('cote', Array.from({ length: nombreCotes }, (_, i) => [i, `${nomAngle(i)} → ${nomAngle((i + 1) % nombreCotes)}`]), T().ouvertures.etiquetteMur);

      for (const [champ, libelle] of [['largeur', T().ouvertures.etiquetteLargeur], ['hauteur', T().ouvertures.etiquetteHauteur], ['position', T().ouvertures.etiquettePosition]]) {
        const cellule = document.createElement('td');
        const saisie = document.createElement('input');
        saisie.type = 'text';
        saisie.inputMode = 'numeric';
        saisie.autocomplete = 'off';
        saisie.value = String(Math.round(ouverture[champ]));
        saisie.dataset.ouverture = index;
        saisie.dataset.champ = champ;
        saisie.setAttribute('aria-label', `${noms[index]}, ${libelle}`);
        cellule.append(saisie);
        ligne.append(cellule);
      }

      const celluleAction = document.createElement('td');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.textContent = T().pieces.supprimer;
      bouton.dataset.supprimerOuverture = index;
      bouton.setAttribute('aria-label', T().ouvertures.supprimer(noms[index]));
      celluleAction.append(bouton);
      ligne.append(celluleAction);
      corpsOuvertures.append(ligne);
    });
  }

  // Tableau des éléments à déduire : position du coin de départ et dimensions, en cm.
  function rendreElements() {
    if (!corpsElements) return;
    corpsElements.replaceChildren();
    normaliserElements(etat.elements).forEach((element, index) => {
      const nom = `${T().elements.types[element.type]} ${index + 1}`;
      const ligne = document.createElement('tr');
      const entete = document.createElement('th');
      entete.scope = 'row';
      entete.textContent = nom;
      ligne.append(entete);
      for (const [cle, etiquette] of [['x', T().elements.etiquetteX], ['y', T().elements.etiquetteY], ['largeur', T().elements.etiquetteLargeur], ['longueur', T().elements.etiquetteLongueur]]) {
        const cellule = document.createElement('td');
        const saisie = document.createElement('input');
        saisie.type = 'text';
        saisie.inputMode = 'numeric';
        saisie.autocomplete = 'off';
        saisie.value = String(element[cle]);
        saisie.dataset.element = index;
        saisie.dataset.cle = cle;
        saisie.setAttribute('aria-label', etiquette(nom));
        cellule.append(saisie);
        ligne.append(cellule);
      }
      const action = document.createElement('td');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.dataset.supprimerElement = index;
      bouton.textContent = T().pieces.supprimer;
      bouton.setAttribute('aria-label', T().elements.supprimer(nom));
      action.append(bouton);
      ligne.append(action);
      corpsElements.append(ligne);
    });
  }

  // Tableau des murs : un par côté, longueur intérieure, type et épaisseur.
  function rendreMurs() {
    if (!corpsMurs) return;
    corpsMurs.replaceChildren();
    if (!etat.ferme || etat.points.length < 3) return;
    const n = etat.points.length;
    normaliserMurs(etat.murs, n).forEach((mur, index) => {
      const nom = `${nomAngle(index)} → ${nomAngle((index + 1) % n)}`;
      const ligne = document.createElement('tr');
      const entete = document.createElement('th');
      entete.scope = 'row';
      entete.textContent = nom;
      const longueur = document.createElement('td');
      longueur.className = 'plan-mur-longueur';
      longueur.textContent = metres(distance(etat.points[index], etat.points[(index + 1) % n]));
      const celluleType = document.createElement('td');
      const choix = document.createElement('select');
      choix.dataset.mur = index;
      choix.setAttribute('aria-label', T().murs.etiquetteType(nom));
      for (const [cle, libelle] of Object.entries(T().murs.types)) {
        const option = document.createElement('option');
        option.value = cle;
        option.textContent = libelle;
        option.selected = cle === mur.type;
        choix.append(option);
      }
      celluleType.append(choix);
      const celluleEpaisseur = document.createElement('td');
      const saisie = document.createElement('input');
      saisie.type = 'text';
      saisie.inputMode = 'decimal';
      saisie.autocomplete = 'off';
      saisie.dataset.mur = index;
      saisie.value = String(mur.epaisseur).replace('.', T().separateurDecimal);
      saisie.setAttribute('aria-label', T().murs.etiquetteEpaisseur(nom));
      celluleEpaisseur.append(saisie);
      ligne.append(entete, longueur, celluleType, celluleEpaisseur);
      corpsMurs.append(ligne);
    });
  }

  // Met à jour les valeurs du tableau sans le reconstruire (glisser sur le plan, recalage).
  function mettreAJourSaisiesOuvertures() {
    corpsOuvertures?.querySelectorAll('input[data-ouverture]').forEach((saisie) => {
      if (saisie === document.activeElement) return;
      const ouverture = etat.ouvertures[Number(saisie.dataset.ouverture)];
      if (ouverture) saisie.value = String(Math.round(ouverture[saisie.dataset.champ]));
    });
  }

  function mettreAJourLongueurs() {
    const points = etat.points;
    corpsTableau.querySelectorAll('.plan-longueur').forEach((cellule, index) => {
      const dernier = index === points.length - 1;
      if (dernier && !etat.ferme) {
        cellule.textContent = '—';
        return;
      }
      const suivant = (index + 1) % points.length;
      cellule.textContent = T().plan.cote(nomAngle(index), nomAngle(suivant), metres(distance(points[index], points[suivant])));
    });
  }

  function mettreAJourSaisies() {
    corpsTableau.querySelectorAll('input[data-index]').forEach((saisie) => {
      if (saisie === document.activeElement) return;
      saisie.value = String(etat.points[Number(saisie.dataset.index)][Number(saisie.dataset.axe)]);
    });
  }

  function changer({ recadrer = true, tableau = true } = {}) {
    // Les ouvertures restent dans leur côté, même quand un angle bouge.
    etat.ouvertures = etat.ferme ? normaliserOuvertures(etat.ouvertures, etat.points) : [];
    if (etat.ferme) etat.murs = normaliserMurs(etat.murs, etat.points.length);
    if (recadrer) calculerVue();
    rendreSvg();
    if (tableau) {
      rendreTableau();
      rendreOuvertures();
      rendreMurs();
      rendreElements();
    } else {
      corpsMurs?.querySelectorAll('.plan-mur-longueur').forEach((cellule, index) => {
        const n = etat.points.length;
        if (etat.points[index]) cellule.textContent = metres(distance(etat.points[index], etat.points[(index + 1) % n]));
      });
      mettreAJourLongueurs();
      mettreAJourSaisies();
      mettreAJourSaisiesOuvertures();
    }

    const infos = informations();
    const phraseMurs = infos.valide && nature === 'piece' ? T().murs.resume(metresFr.format(infos.surfaceHorsTout)) : '';
    const phraseOuvertures = infos.valide && infos.nombreOuvertures
      ? T().plan.resumeOuvertures(infos.descriptionOuvertures, metresFr.format(infos.surfaceOuvertures))
      : '';
    resume.textContent = infos.valide
      ? (nature === 'piece'
        ? T().plan.resume(metresFr.format(infos.surface), metresFr.format(infos.perimetre)) + phraseMurs + phraseOuvertures
        : T().natures[nature].resume(metresFr.format(infos.surface), metresFr.format(infos.longueur), metresFr.format(infos.hauteur), infos.nombreElements, metresFr.format(infos.surfaceElements)))
      : infos.message;
    rendreStatut(infos);
    if (infos.valide) {
      const piece = pieceActive(etat.chantier, nature);
      piece.points = etat.points.map((point) => [...point]);
      piece.ouvertures = etat.ouvertures.map((ouverture) => ({ ...ouverture }));
      piece.murs = etat.murs.map((mur) => ({ ...mur }));
      piece.elements = normaliserElements(etat.elements);
      ecrireChantier(etat.chantier);
    }
    surChangement(infos);
    if (racine.dataset.vue === 'ensemble') rendreEnsemble({ tableau: true, recadrer: false });
  }

  // Ligne d'état sous le sélecteur : l'internaute voit que sa pièce l'a suivi d'un calculateur à l'autre.
  // Pas d'aria-live : seul le résultat principal du calculateur est annoncé (le sélecteur la référence).
  function rendreStatut(infos = informations()) {
    if (!statutPiece) return;
    const piece = pieceActive(etat.chantier, nature);
    const surfaceFr = new Intl.NumberFormat(T().locale, { maximumFractionDigits: 2 });
    const parties = [`${T().natures[nature].actif} : ${piece.nom}`];
    if (!infos.valide) parties.push(T().pieces.formeACompleter);
    else {
      parties.push(`${surfaceFr.format(infos.surface)} m²`);
      if (nature === 'piece') parties.push(T().pieces.ouvertures(infos.nombreOuvertures ?? 0));
      else if (nature === 'mur') parties.push(T().pieces.ouvertures(infos.nombreElements ?? 0));
      else if (infos.nombreElements) parties.push(T().pieces.elements(infos.nombreElements));
    }
    statutPiece.textContent = parties.join(' · ');
  }

  // --- Pièces du chantier ---
  function rendrePieces() {
    if (!choixPiece) return;
    const active = pieceActive(etat.chantier, nature);
    choixPiece.replaceChildren(...etat.chantier.pieces.filter((piece) => natureDe(piece) === nature).map((piece) => {
      const option = document.createElement('option');
      option.value = piece.id;
      option.textContent = piece.nom;
      option.selected = piece.id === active.id;
      return option;
    }));
    if (nomPiece && document.activeElement !== nomPiece) nomPiece.value = active.nom;
    if (hauteurPiece && document.activeElement !== hauteurPiece) hauteurPiece.value = String(active.hauteur).replace('.', T().separateurDecimal);
    const choixNiveau = racine.querySelector('#piece-niveau');
    if (choixNiveau) {
      choixNiveau.replaceChildren(...normaliserNiveaux(etat.chantier.niveaux).map((niveau) => {
        const option = document.createElement('option');
        option.value = niveau.id;
        option.textContent = niveau.nom;
        option.selected = niveau.id === niveauDe(active, etat.chantier);
        return option;
      }));
    }
    const supprimer = racine.querySelector('[data-piece-action="supprimer"]');
    if (supprimer) supprimer.disabled = etat.chantier.pieces.length <= 1;
  }

  function activerPiece(id) {
    definirActive(etat.chantier, id, nature);
    const piece = pieceActive(etat.chantier, nature);
    etat.points = piece.points.map((point) => [...point]);
    etat.ouvertures = piece.ouvertures.map((ouverture) => ({ ...ouverture }));
    etat.murs = piece.murs.map((mur) => ({ ...mur }));
    etat.elements = (piece.elements ?? []).map((element) => ({ ...element }));
    etat.ferme = true;
    rendrePieces();
    changer();
  }

  choixPiece?.addEventListener('change', () => activerPiece(choixPiece.value));

  nomPiece?.addEventListener('input', () => {
    const nom = nomPiece.value.trim().slice(0, 60);
    if (!nom) return;
    pieceActive(etat.chantier, nature).nom = nom;
    const option = choixPiece?.querySelector(`option[value="${pieceActive(etat.chantier, nature).id}"]`);
    if (option) option.textContent = nom;
    rendreStatut();
    ecrireChantier(etat.chantier);
    surChangement(informations());
  });

  hauteurPiece?.addEventListener('input', () => {
    const hauteur = lireNombre(hauteurPiece.value);
    if (!(hauteur > 0 && hauteur <= 20)) {
      hauteurPiece.setAttribute('aria-invalid', 'true');
      return;
    }
    hauteurPiece.removeAttribute('aria-invalid');
    definirHauteur(hauteur);
  });

  function definirHauteur(hauteur) {
    const piece = pieceActive(etat.chantier, nature);
    if (piece.hauteur === hauteur) return;
    piece.hauteur = hauteur;
    rendrePieces();
    ecrireChantier(etat.chantier);
    surChangement(informations());
  }

  racine.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-piece-action]');
    if (!bouton) return;
    const action = bouton.dataset.pieceAction;
    const active = pieceActive(etat.chantier, nature);
    let nouvelle = null;
    const niveauCible = racine.dataset.vue === 'ensemble' && niveauAffiche ? niveauAffiche : niveauDe(active, etat.chantier);
    if (action === 'ajouter') nouvelle = creerPiece(nomLibre(etat.chantier, T().natures[nature].base, nature), DEPART_PAR_NATURE[nature](), [], active.hauteur, [], niveauCible, [], nature);
    if (action === 'dupliquer') nouvelle = creerPiece(T().pieces.copie(active.nom).slice(0, 60), active.points, active.ouvertures, active.hauteur, active.murs, niveauCible, active.elements, nature);
    if (nouvelle) {
      etat.chantier.pieces.push(nouvelle);
      activerPiece(nouvelle.id);
      nomPiece?.focus();
      nomPiece?.select();
    }
    if (action === 'supprimer' && etat.chantier.pieces.filter((piece) => natureDe(piece) === nature).length > 1) {
      if (!window.confirm(T().pieces.confirmerSuppression(active.nom))) return;
      etat.chantier.pieces = etat.chantier.pieces.filter((piece) => piece.id !== active.id);
      activerPiece(etat.chantier.pieces[0].id);
      choixPiece?.focus();
    }
  });

  function positionSurPlan(evenement) {
    const matrice = svg.getScreenCTM();
    if (!matrice) return null;
    const point = new DOMPoint(evenement.clientX, evenement.clientY).matrixTransform(matrice.inverse());
    return [aimanter(point.x), aimanter(point.y)];
  }

  // Déplacement d'une ouverture : le pointeur est projeté sur le mur, l'ouverture suit.
  function deplacerOuverture(evenement) {
    const ouverture = etat.ouvertures[etat.ouvertureGlissee];
    const matrice = svg.getScreenCTM();
    if (!ouverture || !matrice) return;
    const pointeur = new DOMPoint(evenement.clientX, evenement.clientY).matrixTransform(matrice.inverse());
    const a = etat.points[ouverture.cote];
    const b = etat.points[(ouverture.cote + 1) % etat.points.length];
    const longueur = longueurCote(etat.points, ouverture.cote);
    const projection = ((pointeur.x - a[0]) * (b[0] - a[0]) + (pointeur.y - a[1]) * (b[1] - a[1])) / longueur;
    const position = Math.min(Math.max(0, aimanter(projection - ouverture.largeur / 2)), Math.max(0, longueur - ouverture.largeur));
    if (position === ouverture.position) return;
    ouverture.position = position;
    etat.glisse = true;
    if (imageEnAttente === null) {
      imageEnAttente = requestAnimationFrame(() => {
        imageEnAttente = null;
        changer({ recadrer: false, tableau: false });
      });
    }
  }

  // Déplacement d'un angle
  svg.addEventListener('pointerdown', (evenement) => {
    const ouvertureVisee = evenement.target.closest('[data-ouverture]');
    etat.ouvertureGlissee = ouvertureVisee ? Number(ouvertureVisee.dataset.ouverture) : null;
    if (ouvertureVisee) {
      etat.appui = null;
      etat.glisse = false;
      evenement.preventDefault();
      svg.setPointerCapture(evenement.pointerId);
      return;
    }
    const angle = evenement.target.closest('[data-angle]');
    etat.appui = angle ? Number(angle.dataset.angle) : null;
    etat.glisse = false;
    if (angle) {
      evenement.preventDefault();
      svg.setPointerCapture(evenement.pointerId);
    }
  });

  svg.addEventListener('pointermove', (evenement) => {
    if (etat.ouvertureGlissee !== null && svg.hasPointerCapture(evenement.pointerId)) {
      deplacerOuverture(evenement);
      return;
    }
    if (etat.appui === null || !svg.hasPointerCapture(evenement.pointerId)) return;
    const position = positionSurPlan(evenement);
    if (!position) return;
    const actuel = etat.points[etat.appui];
    if (position[0] === actuel[0] && position[1] === actuel[1]) return;
    etat.points[etat.appui] = position;
    etat.glisse = true;
    // Un seul rendu par image, même si le pointeur envoie beaucoup d'événements.
    if (imageEnAttente === null) {
      imageEnAttente = requestAnimationFrame(() => {
        imageEnAttente = null;
        changer({ recadrer: false, tableau: false });
      });
    }
  });

  function terminerGlisse() {
    etat.ouvertureGlissee = null;
    if (etat.glisse) changer({ tableau: false });
  }
  svg.addEventListener('pointerup', terminerGlisse);
  svg.addEventListener('pointercancel', terminerGlisse);

  // Clics : ajout d'un angle (dessin libre), fermeture, insertion sur un côté
  svg.addEventListener('click', (evenement) => {
    if (etat.glisse) {
      etat.glisse = false;
      return;
    }

    const milieu = evenement.target.closest('[data-milieu]');
    if (milieu) {
      const index = Number(milieu.dataset.milieu);
      const a = etat.points[index];
      const b = etat.points[(index + 1) % etat.points.length];
      // Le nouvel angle se place à l'endroit de la poignée (milieu de la partie libre du mur).
      const rapport = Number(milieu.dataset.distance) / longueurCote(etat.points, index);
      const nouveauPoint = [aimanter(a[0] + (b[0] - a[0]) * rapport), aimanter(a[1] + (b[1] - a[1]) * rapport)];
      etat.ouvertures = insererAngle(etat.ouvertures, etat.points, index, nouveauPoint);
      etat.murs = insererAngleMurs(normaliserMurs(etat.murs, etat.points.length), index);
      etat.points.splice(index + 1, 0, nouveauPoint);
      changer();
      return;
    }

    if (etat.ferme) return;

    if (etat.appui !== null) {
      if (etat.appui === 0 && etat.points.length >= 3) {
        etat.ferme = true;
        changer();
      }
      return;
    }

    const position = positionSurPlan(evenement);
    if (!position) return;
    etat.points.push(position);
    changer({ recadrer: false });
  });

  // Saisie des coordonnées
  corpsTableau.addEventListener('input', (evenement) => {
    const saisie = evenement.target;
    if (saisie.dataset.index === undefined) return;
    const valeur = lireNombre(saisie.value);
    if (valeur === null || Number.isNaN(valeur)) {
      saisie.setAttribute('aria-invalid', 'true');
      return;
    }
    saisie.removeAttribute('aria-invalid');
    etat.points[Number(saisie.dataset.index)][Number(saisie.dataset.axe)] = Math.round(valeur);
    changer({ tableau: false });
  });

  corpsTableau.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-supprimer]');
    if (!bouton) return;
    const index = Number(bouton.dataset.supprimer);
    if (etat.ferme) {
      etat.ouvertures = supprimerAngle(etat.ouvertures, etat.points, index);
      etat.murs = supprimerAngleMurs(normaliserMurs(etat.murs, etat.points.length), index);
    }
    etat.points.splice(index, 1);
    changer();
    const suivant = corpsTableau.querySelectorAll('[data-supprimer]')[Math.min(index, etat.points.length - 1)];
    (suivant && !suivant.disabled ? suivant : racine.querySelector('[data-action="ajouter"]'))?.focus();
  });

  // Modèles et ajout d'un angle au clavier
  racine.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-modele], [data-action="ajouter"]');
    if (!bouton) return;

    if (bouton.dataset.action === 'ajouter') {
      const n = etat.points.length;
      if (n === 0) return;
      const a = etat.points[n - 1];
      const b = etat.ferme ? etat.points[0] : [a[0] + 100, a[1]];
      const nouveauPoint = [aimanter((a[0] + b[0]) / 2), aimanter((a[1] + b[1]) / 2)];
      if (etat.ferme) {
        etat.ouvertures = insererAngle(etat.ouvertures, etat.points, n - 1, nouveauPoint);
        etat.murs = insererAngleMurs(normaliserMurs(etat.murs, etat.points.length), n - 1);
      }
      etat.points.push(nouveauPoint);
      changer();
      return;
    }

    const modele = bouton.dataset.modele;
    // Nouvelle forme : les ouvertures et les murs de l'ancienne n'ont plus de sens.
    etat.ouvertures = [];
    etat.murs = [];
    etat.elements = [];
    if (['rectangle', 'pignon', 'trapeze', 'triangle'].includes(modele)) {
      const largeur = lireNombre(champLargeur.value);
      const longueur = lireNombre(champLongueur.value);
      if (!(largeur > 0 && longueur > 0)) {
        resume.textContent = T().plan.rectangleManquant;
        champLargeur.focus();
        return;
      }
      etat.points = modeles[modele](Math.round(largeur), Math.round(longueur));
      etat.ferme = true;
    } else if (modele === 'l') {
      etat.points = modeles.l();
      etat.ferme = true;
    } else {
      etat.points = [];
      etat.ferme = false;
    }
    changer();
  });

  // Ajout : l'ouverture est centrée dans le plus grand espace libre ; on la déplace ensuite.
  racine.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-ajout-ouverture]');
    if (!bouton) return;
    if (!etat.ferme || etat.points.length < 3) {
      resume.textContent = T().ouvertures.formeOuverte;
      return;
    }
    const type = bouton.dataset.ajoutOuverture;
    const { largeur, hauteur } = TYPES_OUVERTURE[type];
    const { cote, position } = emplacementLibre(etat.ouvertures, etat.points, largeur);
    etat.ouvertures.push({ type, cote, largeur, hauteur, position: aimanter(position) });
    changer({ recadrer: false });
    corpsOuvertures?.querySelector('tr:last-child select')?.focus();
  });

  corpsOuvertures?.addEventListener('change', (evenement) => {
    const choix = evenement.target;
    if (choix.tagName !== 'SELECT' || choix.dataset.ouverture === undefined) return;
    const ouverture = etat.ouvertures[Number(choix.dataset.ouverture)];
    if (!ouverture) return;
    if (choix.dataset.champ === 'cote') ouverture.cote = Number(choix.value);
    else {
      // Nouveau type : on reprend ses dimensions courantes, que l'internaute ajuste ensuite.
      ouverture.type = choix.value;
      ouverture.largeur = TYPES_OUVERTURE[choix.value].largeur;
      ouverture.hauteur = TYPES_OUVERTURE[choix.value].hauteur;
    }
    changer({ recadrer: false });
    corpsOuvertures.querySelector(`select[data-ouverture="${choix.dataset.ouverture}"][data-champ="${choix.dataset.champ}"]`)?.focus();
  });

  corpsOuvertures?.addEventListener('input', (evenement) => {
    const saisie = evenement.target;
    if (saisie.tagName !== 'INPUT' || saisie.dataset.ouverture === undefined) return;
    const valeur = lireNombre(saisie.value);
    if (valeur === null || Number.isNaN(valeur) || valeur < 0) {
      saisie.setAttribute('aria-invalid', 'true');
      return;
    }
    saisie.removeAttribute('aria-invalid');
    const ouverture = etat.ouvertures[Number(saisie.dataset.ouverture)];
    if (ouverture) ouverture[saisie.dataset.champ] = Math.round(valeur);
    changer({ recadrer: false, tableau: false });
  });

  corpsOuvertures?.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-supprimer-ouverture]');
    if (!bouton) return;
    etat.ouvertures.splice(Number(bouton.dataset.supprimerOuverture), 1);
    changer({ recadrer: false });
    (corpsOuvertures.querySelector('[data-supprimer-ouverture]') ?? racine.querySelector('[data-ajout-ouverture]'))?.focus();
  });

  // Murs : type (l'épaisseur courante du type est reprise) et épaisseur saisie au clavier.
  corpsMurs?.addEventListener('change', (evenement) => {
    const choix = evenement.target;
    if (choix.tagName !== 'SELECT' || choix.dataset.mur === undefined) return;
    etat.murs = normaliserMurs(etat.murs, etat.points.length);
    etat.murs[Number(choix.dataset.mur)] = { type: choix.value, epaisseur: TYPES_MUR[choix.value].epaisseur };
    changer({ recadrer: true });
    corpsMurs.querySelector(`select[data-mur="${choix.dataset.mur}"]`)?.focus();
  });
  corpsMurs?.addEventListener('input', (evenement) => {
    const saisie = evenement.target;
    if (saisie.tagName !== 'INPUT' || saisie.dataset.mur === undefined) return;
    const valeur = lireNombre(saisie.value);
    if (!(valeur >= 1 && valeur <= 100)) {
      saisie.setAttribute('aria-invalid', 'true');
      return;
    }
    saisie.removeAttribute('aria-invalid');
    etat.murs = normaliserMurs(etat.murs, etat.points.length);
    etat.murs[Number(saisie.dataset.mur)].epaisseur = valeur;
    changer({ recadrer: true, tableau: false });
  });
  // Éléments à déduire : ajout (dans l'angle de départ de la pièce), dimensions, suppression.
  racine.querySelector('#element-ajouter')?.addEventListener('click', () => {
    const type = racine.querySelector('#element-type').value;
    etat.elements = [...normaliserElements(etat.elements), { type, x: 10, y: 10, ...TYPES_ELEMENT[type] }];
    changer();
    corpsElements?.querySelector('tr:last-child input')?.focus();
  });
  corpsElements?.addEventListener('input', (evenement) => {
    const saisie = evenement.target;
    if (saisie.tagName !== 'INPUT') return;
    const valeur = lireNombre(saisie.value);
    const minimum = saisie.dataset.cle === 'largeur' || saisie.dataset.cle === 'longueur' ? 1 : -100000;
    if (valeur === null || Number.isNaN(valeur) || valeur < minimum) {
      saisie.setAttribute('aria-invalid', 'true');
      return;
    }
    saisie.removeAttribute('aria-invalid');
    etat.elements = normaliserElements(etat.elements);
    etat.elements[Number(saisie.dataset.element)][saisie.dataset.cle] = Math.round(valeur);
    changer({ tableau: false });
  });
  corpsElements?.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-supprimer-element]');
    if (!bouton) return;
    etat.elements = normaliserElements(etat.elements).filter((_, index) => index !== Number(bouton.dataset.supprimerElement));
    changer();
    racine.querySelector('#element-ajouter')?.focus();
  });

  racine.querySelector('#murs-appliquer')?.addEventListener('click', () => {
    const type = racine.querySelector('#murs-tous').value;
    etat.murs = etat.points.map(() => ({ type, epaisseur: TYPES_MUR[type].epaisseur }));
    changer({ recadrer: true });
  });

  // --- Plan d'ensemble : toutes les pièces du chantier, placées les unes par rapport aux autres ---
  const sectionEnsemble = racine.querySelector('.ensemble');
  const svgEnsemble = racine.querySelector('.ensemble-svg');
  const resumeEnsemble = racine.querySelector('#ensemble-resume');
  const corpsPositions = racine.querySelector('.ensemble-positions tbody');
  const boutonsVue = racine.querySelectorAll('[data-vue]');
  let vueEnsemble = null;
  let glisseEnsemble = null;
  let aimantEnsemble = null;
  let imageEnsemble = null;

  // Positions de toutes les pièces ; une pièce encore jamais placée est posée automatiquement.
  // Niveau affiché dans le plan d'ensemble (celui de la pièce active par défaut).
  let niveauAffiche = null;
  const piecesAffichees = () => {
    const niveau = niveauAffiche ?? niveauDe(pieceActive(etat.chantier, nature), etat.chantier);
    return etat.chantier.pieces.filter((piece) => ['piece', 'zone'].includes(natureDe(piece)) && niveauDe(piece, etat.chantier) === niveau);
  };

  function positionsEnsemble() {
    const positions = disposer(piecesAffichees());
    let nouvelles = false;
    for (const piece of piecesAffichees()) {
      if (!piece.position) {
        piece.position = positions.get(piece.id);
        nouvelles = true;
      }
    }
    if (nouvelles) ecrireChantier(etat.chantier);
    return positions;
  }

  function changerVue(vue) {
    racine.dataset.vue = vue;
    if (sectionEnsemble) sectionEnsemble.hidden = vue !== 'ensemble';
    boutonsVue.forEach((bouton) => bouton.setAttribute('aria-pressed', String(bouton.dataset.vue === vue)));
    // Retour à la pièce : actualisation complète (dessin à sa taille réelle, tableaux, résumé).
    if (vue === 'ensemble') {
      niveauAffiche = niveauDe(pieceActive(etat.chantier, nature), etat.chantier);
      rendreEnsemble({ tableau: true });
    }
    else changer();
  }

  function rendreEnsemble({ tableau = false, recadrer = true } = {}) {
    if (!svgEnsemble) return;
    const positions = positionsEnsemble();
    const pieces = piecesAffichees();
    rendreNiveaux();
    if (!pieces.length) {
      svgEnsemble.replaceChildren();
      svgEnsemble.setAttribute('viewBox', '0 0 1000 600');
      resumeEnsemble.textContent = T().niveaux.vide;
      if (tableau) rendrePositions();
      return;
    }
    const formes = pieces.map((piece) => ({ piece, ...geometrie(piece, positions.get(piece.id)) }));
    if (recadrer || !vueEnsemble) {
      const tous = formes.flatMap((forme) => forme.exterieur);
      const xs = tous.map((point) => point[0]);
      const ys = tous.map((point) => point[1]);
      const marge = Math.max((Math.max(...xs) - Math.min(...xs) + Math.max(...ys) - Math.min(...ys)) * 0.06, 60);
      vueEnsemble = { x: Math.min(...xs) - marge, y: Math.min(...ys) - marge, largeur: Math.max(...xs) - Math.min(...xs) + 2 * marge, hauteur: Math.max(...ys) - Math.min(...ys) + 2 * marge };
    }
    const { x, y, largeur, hauteur } = vueEnsemble;
    svgEnsemble.setAttribute('viewBox', `${x} ${y} ${largeur} ${hauteur}`);
    svgEnsemble.replaceChildren();
    const cadre = svgEnsemble.getBoundingClientRect();
    const pixelsParCm = cadre.width > 0 ? Math.min(cadre.width / largeur, cadre.height / hauteur) : 800 / largeur;
    const echelle = 4 / pixelsParCm;

    const grille = elementSvg('g', { class: 'plan-grille' }, svgEnsemble);
    for (let gx = Math.ceil(x / 100) * 100; gx <= x + largeur; gx += 100) elementSvg('line', { x1: gx, y1: y, x2: gx, y2: y + hauteur, class: 'metre' }, grille);
    for (let gy = Math.ceil(y / 100) * 100; gy <= y + hauteur; gy += 100) elementSvg('line', { x1: x, y1: gy, x2: x + largeur, y2: gy, class: 'metre' }, grille);

    const paires = chevauchements(pieces, positions);
    const enConflit = new Set(paires.flat());
    for (const forme of formes) {
      const { piece, interieur, exterieur, murs } = forme;
      const active = piece.id === idActif(etat.chantier, nature);
      const surfaceElements = normaliserElements(piece.elements).reduce((total, element) => total + element.largeur * element.longueur, 0);
      const surface = metresFr.format(Math.max(0, aire(piece.points) - surfaceElements) / 10000);
      const groupe = elementSvg('g', {
        class: `ensemble-piece${natureDe(piece) === 'zone' ? ' ensemble-zone' : ''}${active ? ' ensemble-active' : ''}${enConflit.has(piece.id) ? ' ensemble-conflit' : ''}`,
        'data-piece': piece.id,
      }, svgEnsemble);
      elementSvg('title', {}, groupe).textContent = T().ensemble.titrePiece(piece.nom, surface);
      if (natureDe(piece) === 'piece') {
        murs.forEach((mur, i) => {
          const j = (i + 1) % interieur.length;
          elementSvg('polygon', { points: [interieur[i], interieur[j], exterieur[j], exterieur[i]].map((point) => point.join(',')).join(' '), class: `plan-mur plan-mur-${mur.type}` }, groupe);
        });
      }
      elementSvg('polygon', { points: interieur.map((point) => point.join(',')).join(' '), class: 'ensemble-sol' }, groupe);
      for (const element of normaliserElements(piece.elements)) {
        const coins = [[element.x, element.y], [element.x + element.largeur, element.y], [element.x + element.largeur, element.y + element.longueur], [element.x, element.y + element.longueur]]
          .map((coin) => versEnsemble(coin, positions.get(piece.id)));
        elementSvg('polygon', { points: coins.map((coin) => coin.join(',')).join(' '), class: `plan-element plan-element-${element.type}` }, groupe);
      }
      const cx = interieur.reduce((somme, point) => somme + point[0], 0) / interieur.length;
      const cy = interieur.reduce((somme, point) => somme + point[1], 0) / interieur.length;
      const nom = elementSvg('text', { x: cx, y: cy - echelle * 2, class: 'ensemble-nom', 'font-size': echelle * 3.6 }, groupe);
      nom.textContent = piece.nom;
      const aire_ = elementSvg('text', { x: cx, y: cy + echelle * 3, class: 'ensemble-surface', 'font-size': echelle * 3 }, groupe);
      aire_.textContent = `${surface} m²`;
    }

    const nomDe = (id) => pieces.find((piece) => piece.id === id)?.nom ?? '';
    const m = mesures(etat.chantier, niveauAffiche ?? niveauDe(pieceActive(etat.chantier, nature), etat.chantier));
    let texte = T().ensemble.resume(pieces.length, metresFr.format(m.surfaceHabitable), pieces.some((piece) => piece.id === idActif(etat.chantier, nature)) ? pieceActive(etat.chantier, nature).nom : '—')
      + T().ensemble.mesures(metresFr.format(m.emprise), metresFr.format(m.longueurFacades));
    if (paires.length) texte += T().ensemble.chevauchement(nomDe(paires[0][0]), nomDe(paires[0][1]));
    if (aimantEnsemble) texte += T().ensemble.aimantee(nomDe(aimantEnsemble.avec));
    resumeEnsemble.textContent = texte;
    if (tableau) rendrePositions();
    else mettreAJourPositions();
  }

  // Tableau des positions : placement et sélection au clavier.
  function rendrePositions() {
    if (!corpsPositions) return;
    corpsPositions.replaceChildren();
    for (const piece of piecesAffichees()) {
      const ligne = document.createElement('tr');
      const entete = document.createElement('th');
      entete.scope = 'row';
      entete.textContent = piece.nom;
      ligne.append(entete);
      for (const axe of ['x', 'y']) {
        const cellule = document.createElement('td');
        const saisie = document.createElement('input');
        saisie.type = 'text';
        saisie.inputMode = 'numeric';
        saisie.autocomplete = 'off';
        saisie.value = String(piece.position[axe]);
        saisie.dataset.piece = piece.id;
        saisie.dataset.axe = axe;
        saisie.setAttribute('aria-label', axe === 'x' ? T().ensemble.etiquetteX(piece.nom) : T().ensemble.etiquetteY(piece.nom));
        cellule.append(saisie);
        ligne.append(cellule);
      }
      const celluleRotation = document.createElement('td');
      const choix = document.createElement('select');
      choix.dataset.piece = piece.id;
      choix.setAttribute('aria-label', T().ensemble.etiquetteRotation(piece.nom));
      T().ensemble.rotations.forEach((libelle, quart) => {
        const option = document.createElement('option');
        option.value = String(quart);
        option.textContent = libelle;
        option.selected = quart === piece.position.rotation;
        choix.append(option);
      });
      celluleRotation.append(choix);
      const celluleAction = document.createElement('td');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.dataset.selectionner = piece.id;
      const active = piece.id === idActif(etat.chantier, nature);
      bouton.setAttribute('aria-pressed', String(active));
      bouton.textContent = active ? T().ensemble.selectionnee : T().ensemble.selectionner;
      celluleAction.append(bouton);
      ligne.append(celluleRotation, celluleAction);
      corpsPositions.append(ligne);
    }
  }

  function mettreAJourPositions() {
    corpsPositions?.querySelectorAll('input[data-piece]').forEach((saisie) => {
      if (saisie === document.activeElement) return;
      const piece = etat.chantier.pieces.find((element) => element.id === saisie.dataset.piece);
      if (piece?.position) saisie.value = String(piece.position[saisie.dataset.axe]);
    });
  }

  // Niveaux : choix du niveau affiché, ajout et renommage.
  const choixNiveauAffiche = racine.querySelector('#ensemble-niveau');
  const nomNiveau = racine.querySelector('#niveau-nom');
  function rendreNiveaux() {
    const niveaux = normaliserNiveaux(etat.chantier.niveaux);
    const courant = niveauAffiche ?? niveauDe(pieceActive(etat.chantier, nature), etat.chantier);
    if (choixNiveauAffiche) {
      choixNiveauAffiche.replaceChildren(...niveaux.map((niveau) => {
        const option = document.createElement('option');
        option.value = niveau.id;
        option.textContent = niveau.nom;
        option.selected = niveau.id === courant;
        return option;
      }));
    }
    if (nomNiveau && document.activeElement !== nomNiveau) nomNiveau.value = niveaux.find((niveau) => niveau.id === courant)?.nom ?? '';
  }
  choixNiveauAffiche?.addEventListener('change', () => {
    niveauAffiche = choixNiveauAffiche.value;
    rendreEnsemble({ tableau: true });
  });
  nomNiveau?.addEventListener('input', () => {
    const courant = niveauAffiche ?? niveauDe(pieceActive(etat.chantier, nature), etat.chantier);
    etat.chantier.niveaux = normaliserNiveaux(etat.chantier.niveaux).map((niveau) => (niveau.id === courant ? { ...niveau, nom: nomNiveau.value.slice(0, 60) || niveau.nom } : niveau));
    ecrireChantier(etat.chantier);
    rendreNiveaux();
    rendrePieces();
  });
  racine.querySelector('[data-ensemble="niveau-ajouter"]')?.addEventListener('click', () => {
    const niveaux = normaliserNiveaux(etat.chantier.niveaux);
    const niveau = { id: `n${Date.now().toString(36)}`, nom: T().niveaux.nouveau(niveaux.length) };
    etat.chantier.niveaux = [...niveaux, niveau];
    niveauAffiche = niveau.id;
    ecrireChantier(etat.chantier);
    rendreEnsemble({ tableau: true });
    rendrePieces();
    nomNiveau?.focus();
  });
  racine.querySelector('#piece-niveau')?.addEventListener('change', (evenement) => {
    pieceActive(etat.chantier, nature).niveau = evenement.target.value;
    niveauAffiche = evenement.target.value;
    ecrireChantier(etat.chantier);
    changer();
  });

  // Rotation d'un quart de tour autour du centre de la pièce.
  function tournerActive() {
    const piece = pieceActive(etat.chantier, nature);
    const avant = geometrie(piece, piece.position).interieur;
    const centre = (points) => points.reduce((s, p) => [s[0] + p[0] / points.length, s[1] + p[1] / points.length], [0, 0]);
    const [ax, ay] = centre(avant);
    const tournee = { ...piece.position, rotation: (piece.position.rotation + 1) % 4 };
    const [bx, by] = centre(geometrie(piece, tournee).interieur);
    piece.position = { ...tournee, x: Math.round(tournee.x + ax - bx), y: Math.round(tournee.y + ay - by) };
    aimantEnsemble = null;
    ecrireChantier(etat.chantier);
    rendreEnsemble({ tableau: true });
  }

  boutonsVue.forEach((bouton) => bouton.addEventListener('click', () => changerVue(bouton.dataset.vue)));
  racine.querySelector('[data-ensemble="tourner"]')?.addEventListener('click', tournerActive);
  racine.querySelector('[data-ensemble="modifier"]')?.addEventListener('click', () => {
    changerVue('piece');
    racine.querySelector('[data-vue="piece"]')?.focus();
  });

  // Toucher une pièce la sélectionne (le calcul porte sur elle) ; la faire glisser la déplace.
  svgEnsemble?.addEventListener('pointerdown', (evenement) => {
    const groupe = evenement.target.closest('[data-piece]');
    const matrice = svgEnsemble.getScreenCTM();
    if (!groupe || !matrice) return;
    if (groupe.dataset.piece !== idActif(etat.chantier, nature)) activerPiece(groupe.dataset.piece);
    const depart = new DOMPoint(evenement.clientX, evenement.clientY).matrixTransform(matrice.inverse());
    glisseEnsemble = { depart: [depart.x, depart.y], origine: { ...pieceActive(etat.chantier, nature).position }, bouge: false };
    aimantEnsemble = null;
    svgEnsemble.setPointerCapture(evenement.pointerId);
    evenement.preventDefault();
  });
  svgEnsemble?.addEventListener('pointermove', (evenement) => {
    if (!glisseEnsemble || !svgEnsemble.hasPointerCapture(evenement.pointerId)) return;
    const matrice = svgEnsemble.getScreenCTM();
    const point = new DOMPoint(evenement.clientX, evenement.clientY).matrixTransform(matrice.inverse());
    const dx = point.x - glisseEnsemble.depart[0];
    const dy = point.y - glisseEnsemble.depart[1];
    if (!glisseEnsemble.bouge && Math.hypot(dx, dy) * matrice.a < 4) return;
    glisseEnsemble.bouge = true;
    const piece = pieceActive(etat.chantier, nature);
    // Seuil d'aimantation : 14 px à l'écran, convertis en centimètres de plan.
    const seuil = 14 / matrice.a;
    const autres = piecesAffichees().filter((autre) => autre.id !== piece.id).map((autre) => ({ piece: autre, position: autre.position }));
    const resultat = aimanterPiece(piece, { ...glisseEnsemble.origine, x: Math.round(glisseEnsemble.origine.x + dx), y: Math.round(glisseEnsemble.origine.y + dy) }, autres, seuil);
    piece.position = resultat.position;
    aimantEnsemble = resultat.aimant;
    if (imageEnsemble === null) {
      imageEnsemble = requestAnimationFrame(() => {
        imageEnsemble = null;
        rendreEnsemble({ recadrer: false });
      });
    }
  });
  const finGlisseEnsemble = () => {
    if (!glisseEnsemble) return;
    const bouge = glisseEnsemble.bouge;
    glisseEnsemble = null;
    if (bouge) ecrireChantier(etat.chantier);
    rendreEnsemble({ tableau: true, recadrer: bouge });
  };
  svgEnsemble?.addEventListener('pointerup', finGlisseEnsemble);
  svgEnsemble?.addEventListener('pointercancel', finGlisseEnsemble);

  corpsPositions?.addEventListener('input', (evenement) => {
    const saisie = evenement.target;
    if (saisie.tagName !== 'INPUT') return;
    const valeur = lireNombre(saisie.value);
    if (valeur === null || Number.isNaN(valeur)) {
      saisie.setAttribute('aria-invalid', 'true');
      return;
    }
    saisie.removeAttribute('aria-invalid');
    const piece = etat.chantier.pieces.find((element) => element.id === saisie.dataset.piece);
    piece.position = { ...piece.position, [saisie.dataset.axe]: Math.round(valeur) };
    aimantEnsemble = null;
    ecrireChantier(etat.chantier);
    rendreEnsemble();
  });
  corpsPositions?.addEventListener('change', (evenement) => {
    const choix = evenement.target;
    if (choix.tagName !== 'SELECT') return;
    const piece = etat.chantier.pieces.find((element) => element.id === choix.dataset.piece);
    piece.position = { ...piece.position, rotation: Number(choix.value) };
    ecrireChantier(etat.chantier);
    rendreEnsemble();
  });
  corpsPositions?.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-selectionner]');
    if (!bouton) return;
    activerPiece(bouton.dataset.selectionner);
    corpsPositions.querySelector(`[data-selectionner="${bouton.dataset.selectionner}"]`)?.focus();
  });

  // --- Mur vu de face : « Partir des murs du plan » ---
  // Crée la face d'un mur d'une pièce (longueur du mur, hauteur de la pièce, ouvertures posées à leur
  // place) ou de toutes les façades du plan d'ensemble. Fenêtres posées avec une allège de 1 m, à ajuster.
  const choixDepuis = racine.querySelector('#depuis-mur');
  const statutDepuis = racine.querySelector('#depuis-statut');
  const ALLEGE = 100;
  const versElement = (ouverture, decalage, hauteurMur) => ({
    type: ouverture.type === 'fenetre' ? 'fenetre' : 'porte',
    x: Math.round(decalage + ouverture.position),
    y: Math.max(0, Math.round(hauteurMur - ouverture.hauteur - (ouverture.type === 'fenetre' ? ALLEGE : 0))),
    largeur: ouverture.largeur,
    longueur: ouverture.hauteur,
  });
  function rendreDepuis() {
    if (!choixDepuis) return;
    const pieces = etat.chantier.pieces.filter((piece) => natureDe(piece) === 'piece');
    const options = [];
    const nombreFacades = pieces.reduce((total, piece) => total + infosPiece(piece, etat.chantier).murs.filter((mur) => mur.type === 'exterieur' && mur.partage === 0).length, 0);
    if (nombreFacades > 0) options.push(['facade', T().depuisPlan.facade(nombreFacades)]);
    for (const piece of pieces) {
      piece.points.forEach((point, i) => {
        const suivant = piece.points[(i + 1) % piece.points.length];
        options.push([`${piece.id}|${i}`, T().depuisPlan.murPiece(piece.nom, nomAngle(i), nomAngle((i + 1) % piece.points.length), metresFr.format(distance(point, suivant) / 100))]);
      });
    }
    choixDepuis.replaceChildren(...options.map(([valeur, libelle]) => {
      const option = document.createElement('option');
      option.value = valeur;
      option.textContent = libelle;
      return option;
    }));
    racine.querySelector('#depuis-creer').disabled = !options.length;
    if (!options.length) statutDepuis.textContent = T().depuisPlan.aucun;
  }
  racine.querySelector('#depuis-creer')?.addEventListener('click', () => {
    const valeur = choixDepuis.value;
    if (!valeur) return;
    const communs = mursCommuns(etat.chantier);
    let longueur = 0;
    let hauteur = 0;
    let nom = '';
    const elements = [];
    const nouveaux = [];
    if (valeur === 'facade') {
      // Une face par mur extérieur non commun : longueur extérieure du mur, hauteur de la pièce, ses ouvertures.
      for (const piece of etat.chantier.pieces.filter((element) => natureDe(element) === 'piece')) {
        const infos = infosPiece(piece, etat.chantier, communs);
        const exterieur = contourExterieur(piece.points, normaliserMurs(piece.murs, piece.points.length));
        infos.murs.forEach((mur, i) => {
          if (mur.type !== 'exterieur' || mur.partage > 0) return;
          const j = (i + 1) % piece.points.length;
          const longueurFace = Math.round(distance(exterieur[i], exterieur[j]));
          const hauteurFace = Math.round(piece.hauteur * 100);
          // Les ouvertures se placent depuis l'angle intérieur ; l'angle extérieur est décalé de l'épaisseur du mur voisin.
          const longueurMur = distance(piece.points[i], piece.points[j]) || 1;
          const sens = [(piece.points[j][0] - piece.points[i][0]) / longueurMur, (piece.points[j][1] - piece.points[i][1]) / longueurMur];
          const decalage = Math.round((piece.points[i][0] - exterieur[i][0]) * sens[0] + (piece.points[i][1] - exterieur[i][1]) * sens[1]);
          const ouvertures = infos.ouvertures.filter((element) => element.cote === i && !element.partagee).map((ouverture) => versElement(ouverture, decalage, hauteurFace));
          nouveaux.push(creerPiece(T().depuisPlan.nomMur(piece.nom, nomAngle(i), nomAngle(j)).slice(0, 60), modeles.rectangle(longueurFace, hauteurFace), [], piece.hauteur, [], undefined, ouvertures.filter((element) => element.x + element.largeur <= longueurFace), 'mur'));
        });
      }
    } else {
      const [id, cote] = valeur.split('|');
      const piece = etat.chantier.pieces.find((element) => element.id === id);
      const i = Number(cote);
      const infos = infosPiece(piece, etat.chantier, communs);
      longueur = Math.round(distance(piece.points[i], piece.points[(i + 1) % piece.points.length]));
      hauteur = Math.round(piece.hauteur * 100);
      nom = T().depuisPlan.nomMur(piece.nom, nomAngle(i), nomAngle((i + 1) % piece.points.length));
      for (const ouverture of infos.ouvertures.filter((element) => element.cote === i)) elements.push(versElement(ouverture, 0, hauteur));
    }
    if (valeur !== 'facade') nouveaux.push(creerPiece(nom.slice(0, 60), modeles.rectangle(longueur, hauteur), [], hauteur / 100, [], undefined, elements.filter((element) => element.x + element.largeur <= longueur), 'mur'));
    if (!nouveaux.length) return;
    etat.chantier.pieces.push(...nouveaux);
    activerPiece(nouveaux[0].id);
    statutDepuis.textContent = nouveaux.length > 1 ? T().depuisPlan.creees(nouveaux.length) : T().depuisPlan.cree(nouveaux[0].nom);
  });
  if (nature === 'mur') rendreDepuis();

  // Recalcule la taille des repères quand la largeur d'affichage change (rotation, fenêtre).
  if ('ResizeObserver' in window) new ResizeObserver(() => rendreSvg()).observe(svg);
  if ('ResizeObserver' in window && svgEnsemble) new ResizeObserver(() => { if (racine.dataset.vue === 'ensemble') rendreEnsemble(); }).observe(svgEnsemble);
  racine.dataset.vue = 'piece';

  rendrePieces();
  changer();

  // Utilisé par les calculateurs : un champ lié à la hauteur de la pièce la met à jour.
  return { definirHauteur, infosPortee };
}

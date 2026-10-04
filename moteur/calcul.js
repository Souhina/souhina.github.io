// moteur/calcul.js
// Script commun à tous les calculateurs, exécuté dans le navigateur.
// Rôle : lire les champs, les valider, récupérer le plan de la pièce si le calculateur
// en utilise un, appeler la formule et afficher les résultats. Gère aussi l'ajout au devis.

import { lireNombre, formater, versSaisie } from './nombres.js';
import * as geo from './geometrie.js';
import { creerEditeurPlan } from './plan.js';
import { ajouterLignes } from './panier.js';
import { appliquerOuvertures } from './ouvertures.js';
import { evaluerAideAuChoix } from './aide-choix.js';
import { CLE_CHANTIER, chargerChantier } from './chantier.js';
import { mesures } from './chantier-plan.js';
import { equivalentImperial, lireReglageImperial } from './nombres.js';
import { T } from './langue.js';

function afficherErreur(champ, zoneErreur, message) {
  zoneErreur.textContent = message;
  zoneErreur.hidden = message === '';
  if (message === '') champ.removeAttribute('aria-invalid');
  else champ.setAttribute('aria-invalid', 'true');
}

// Remplit un modèle comme "{surface} m², carreaux {largeurCarreau} × {longueurCarreau} cm"
// avec les valeurs saisies et les résultats, formatés en français.
// {cle:libelle} affiche le libellé de l'option choisie dans une liste (par exemple « Plaque hydrofuge »).
function remplirModele(modele, valeurs, resultats, champs = []) {
  return modele
    .replace(/\{(\w+)(:libelle)?\}/g, (tout, cle, libelle, position) => {
      if (libelle) {
        const option = champs.find((champ) => champ.id === cle)?.options?.find((element) => element.valeur === valeurs[cle]);
        if (!option) return '';
        // En milieu de phrase, le libellé prend une minuscule : « Plaque hydrofuge (pièces humides) ».
        return position === 0 ? option.libelle : option.libelle.charAt(0).toLowerCase() + option.libelle.slice(1);
      }
      const valeur = cle in resultats ? resultats[cle] : valeurs[cle];
      return typeof valeur === 'number' && Number.isFinite(valeur) ? formater(valeur) : '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

// Équivalent impérial affiché entre parenthèses sous un résultat, si l'internaute l'a demandé :
// - résultat dans une unité convertible : « 12,5 m² » → « (134,5 sq ft) » ;
// - conditionnement (clé equivalent) : « 4 » sacs de 25 kg → « (4 × 25 kg = 4 × 55 lb) ».
function afficherEquivalent(resultat, valeur, valeurs) {
  const zone = document.getElementById(`eq-${resultat.id}`);
  if (!zone) return;
  const reglage = lireReglageImperial();
  let texte = '';
  if (reglage.actif && typeof valeur === 'number' && Number.isFinite(valeur) && valeur > 0) {
    if (resultat.equivalent) {
      const taille = valeurs?.[resultat.equivalent.champ];
      const unitaire = equivalentImperial(taille, resultat.equivalent.unite, reglage);
      if (unitaire) texte = `(${formater(valeur)} × ${formater(taille, 'nombre', resultat.equivalent.unite)} = ${formater(valeur)} × ${unitaire})`;
    } else if (resultat.format === 'nombre' || !resultat.format) {
      const equivalent = equivalentImperial(valeur, resultat.unite, reglage);
      if (equivalent) texte = `(${equivalent})`;
    }
  }
  zone.textContent = texte;
  zone.hidden = !texte;
}

function annoncer(zone, message) {
  // Vider puis remplir : un message identique au précédent est tout de même annoncé.
  zone.textContent = '';
  requestAnimationFrame(() => {
    zone.textContent = message;
  });
}

// Point d'entrée appelé par chaque page de calculateur.
export function demarrer(calculer, config) {
  const formulaire = document.getElementById('formulaire');
  const attente = document.getElementById('attente');
  const barre = document.getElementById('barre-valeur');
  const texteAttente = attente.textContent;
  let plan = null;
  let dernierCalcul = null;

  // Dimensions : dessinées sur le plan, ou saisies (calculateurs avec plan.saisie). Mémorisé par calculateur.
  const CLE_MODE = 'mode-dimensions-v1';
  const enDessin = () => !config.plan || !config.planSaisie || formulaire.querySelector('input[name="mode-dimensions"]:checked')?.value === 'dessin';
  function appliquerMode() {
    if (!config.planSaisie) return;
    const dessin = enDessin();
    document.getElementById('plan').dataset.mode = dessin ? 'dessin' : 'saisie';
    // En mode dessin, les champs de dimension (saisie: true) laissent la place au plan.
    for (const champ of config.champs.filter((element) => element.saisie)) {
      const bloc = document.getElementById(`champ-${champ.id}`)?.closest('.champ');
      if (bloc) bloc.hidden = dessin;
    }
  }
  if (config.planSaisie) {
    try {
      const memorise = JSON.parse(localStorage.getItem(CLE_MODE) ?? '{}')[config.slug];
      if (memorise === 'dessin') document.getElementById('mode-dessin').checked = true;
    } catch {
      // Stockage indisponible : saisie des dimensions par défaut.
    }
    formulaire.addEventListener('change', (evenement) => {
      if (evenement.target.name !== 'mode-dimensions') return;
      try {
        const modes = JSON.parse(localStorage.getItem(CLE_MODE) ?? '{}');
        localStorage.setItem(CLE_MODE, JSON.stringify({ ...modes, [config.slug]: evenement.target.value }));
      } catch {
        // Stockage indisponible : le choix vaut pour la page en cours.
      }
      appliquerMode();
      mettreAJour();
    });
  }

  function lireValeurs() {
    const valeurs = {};
    let complet = true;

    for (const champ of config.champs) {
      const saisie = formulaire.elements[champ.id];
      // Dimension remplacée par le dessin : ni lue ni exigée.
      if (champ.saisie && enDessin()) {
        valeurs[champ.id] = null;
        continue;
      }

      if (champ.type === 'case') {
        valeurs[champ.id] = saisie.checked ? 1 : 0;
        continue;
      }
      if (champ.type === 'choix') {
        valeurs[champ.id] = Number(saisie.value);
        continue;
      }

      const zoneErreur = document.getElementById(`erreur-${champ.id}`);
      const nombre = lireNombre(saisie.value);
      let message = '';

      if (nombre === null) {
        if (champ.requis) complet = false;
        valeurs[champ.id] = 0;
      } else if (Number.isNaN(nombre)) {
        message = T().formulaire.saisirNombre;
      } else if (champ.min !== undefined && nombre < champ.min) {
        message = T().formulaire.minimum(formater(champ.min));
      } else if (champ.max !== undefined && nombre > champ.max) {
        message = T().formulaire.maximum(formater(champ.max));
      } else {
        valeurs[champ.id] = nombre;
      }

      afficherErreur(saisie, zoneErreur, message);
      if (message !== '') complet = false;
    }

    return complet ? valeurs : null;
  }

  // Portée du calcul, pour les calculateurs avec plan : cette pièce, tout le niveau ou tout le chantier.
  const CLE_PORTEE = 'portee-calcul-v1';
  const portee = () => formulaire.querySelector('input[name="portee-calcul"]:checked')?.value ?? 'piece';
  try {
    const memorisee = localStorage.getItem(CLE_PORTEE);
    const choix = memorisee && formulaire.querySelector(`input[name="portee-calcul"][value="${memorisee}"]`);
    if (choix) choix.checked = true;
  } catch {
    // Stockage indisponible : portée par défaut.
  }
  formulaire.addEventListener('change', (evenement) => {
    if (evenement.target.name !== 'portee-calcul') return;
    try {
      localStorage.setItem(CLE_PORTEE, evenement.target.value);
    } catch {
      // Stockage indisponible : le choix vaut pour la page en cours.
    }
  });

  // Calcul pour une pièce : ses ouvertures, ses retours de tableau et sa hauteur.
  function calculerPour(valeurs, infos) {
    const valeursPiece = { ...appliquerOuvertures(config.champs, valeurs, infos) };
    if (infos?.piece) for (const champ of champsLies) valeursPiece[champ.id] = infos.piece.hauteur;
    let resultats = null;
    try {
      resultats = calculer(valeursPiece, infos, geo) ?? null;
    } catch (erreur) {
      console.error('Erreur dans la formule du calculateur :', erreur);
    }
    return { valeurs: valeursPiece, resultats };
  }

  // Un résultat s'additionne d'une pièce à l'autre, sauf les pourcentages, les textes et ceux
  // marqués cumul: false (épaisseur, longueur d'un lé…).
  const cumulable = (resultat) => resultat.cumul !== false && resultat.format !== 'pourcent' && resultat.format !== 'texte';

  function cumuler(parPiece) {
    const total = {};
    for (const resultat of config.resultats) {
      const valeurs = parPiece.map((piece) => piece.resultats[resultat.id]);
      if (cumulable(resultat)) {
        const nombres = valeurs.filter((valeur) => typeof valeur === 'number' && Number.isFinite(valeur));
        total[resultat.id] = nombres.length ? Math.round(nombres.reduce((somme, valeur) => somme + valeur, 0) * 10000) / 10000 : null;
      } else {
        // Identique dans toutes les pièces : on l'affiche ; sinon, « selon la pièce ».
        total[resultat.id] = valeurs.every((valeur) => valeur === valeurs[0]) ? valeurs[0] : undefined;
      }
    }
    return total;
  }

  const detailPieces = document.getElementById('detail-pieces');
  function afficherDetail(parPiece) {
    if (!detailPieces) return;
    detailPieces.hidden = !parPiece;
    detailPieces.replaceChildren();
    if (!parPiece) return;
    const principal = config.resultats.find((resultat) => resultat.id === config.principal);
    const titre = document.createElement('caption');
    titre.textContent = T().portee.detail;
    const corps = document.createElement('tbody');
    for (const piece of parPiece) {
      const ligne = document.createElement('tr');
      const nom = document.createElement('th');
      nom.scope = 'row';
      nom.textContent = piece.infos.piece.nom;
      const valeur = document.createElement('td');
      valeur.textContent = formater(piece.resultats[principal.id], principal.format, principal.unite);
      ligne.append(nom, valeur);
      corps.append(ligne);
    }
    detailPieces.append(titre, corps);
  }

  function mettreAJour() {
    const valeurs = lireValeurs();
    const planPret = !config.plan || !enDessin() || (plan !== null && plan.valide);
    let resultats = null;
    let valeursCalcul = valeurs;
    let parPiece = null;
    let message = '';

    if (valeurs && planPret && config.plan && enDessin() && editeur && portee() !== 'piece') {
      // Plusieurs pièces : un calcul par pièce, puis les totaux.
      const calculs = editeur.infosPortee(portee()).map((infos) => ({ infos, ...calculerPour(valeurs, infos) }));
      parPiece = calculs.filter((calcul) => calcul.resultats && !calcul.resultats.erreur);
      const exclues = calculs.filter((calcul) => !calcul.resultats || calcul.resultats.erreur);
      if (exclues.length) message = exclues.map((calcul) => T().portee.exclue(calcul.infos.piece.nom, calcul.resultats?.erreur ?? texteAttente)).join(' ');
      if (parPiece.length) {
        resultats = cumuler(parPiece);
        valeursCalcul = parPiece[0].valeurs;
      } else {
        parPiece = null;
      }
    } else if (valeurs && planPret) {
      const calcul = calculerPour(valeurs, config.plan && enDessin() ? plan : null);
      valeursCalcul = calcul.valeurs;
      resultats = calcul.resultats;
    }

    // Une formule peut signaler un problème précis : { erreur: 'message' }.
    if (resultats?.erreur) {
      attente.textContent = resultats.erreur;
      resultats = null;
    } else {
      attente.textContent = message || texteAttente;
    }
    dernierCalcul = resultats ? { valeurs: valeursCalcul, resultats, parPiece } : null;
    attente.hidden = resultats !== null && !message;
    afficherDetail(resultats ? parPiece : null);
    for (const resultat of config.resultats) {
      const sortie = document.getElementById(`res-${resultat.id}`);
      const brut = resultats?.[resultat.id];
      const texte = !resultats
        ? '—'
        : brut === undefined && parPiece
          ? T().portee.variable
          : resultat.format === 'texte'
            ? (typeof brut === 'string' && brut ? brut : '—')
            : formater(brut, resultat.format, resultat.unite);
      sortie.textContent = texte;
      afficherEquivalent(resultat, resultats?.[resultat.id], valeursCalcul);
      // Barre fixe en bas d'écran sur mobile : elle reprend le résultat principal.
      if (resultat.id === config.principal && barre) barre.textContent = texte;
    }
  }

  // Aide au choix : chaque réponse réévalue les règles et préremplit les champs visés.
  if (config.aideAuChoix) {
    const zoneRecommandation = document.getElementById('aide-choix-resultat');
    formulaire.addEventListener('change', (evenement) => {
      if (!evenement.target.name?.startsWith('aide-')) return;
      const reponses = {};
      for (const question of config.aideAuChoix.questions) {
        reponses[question.id] = formulaire.querySelector(`input[name="aide-${question.id}"]:checked`)?.value ?? '';
      }
      const { valeurs, phrase } = evaluerAideAuChoix(config.aideAuChoix, reponses, config.champs);
      for (const [idChamp, valeur] of Object.entries(valeurs)) {
        const champ = config.champs.find((element) => element.id === idChamp);
        const saisie = formulaire.elements[idChamp];
        if (champ?.type === 'case') saisie.checked = Boolean(valeur);
        else if (saisie) saisie.value = String(valeur);
      }
      zoneRecommandation.textContent = phrase;
      mettreAJour();
    });
  }

  formulaire.addEventListener('input', mettreAJour);
  document.addEventListener('reglage-unites', mettreAJour);
  formulaire.addEventListener('submit', (evenement) => evenement.preventDefault());
  // Le reset remet les valeurs par défaut après l'événement : on recalcule à l'image suivante.
  formulaire.addEventListener('reset', () => requestAnimationFrame(mettreAJour));

  if (config.devis?.length) {
    const bouton = document.getElementById('ajouter-devis');
    const statut = document.getElementById('devis-statut');
    const champPiece = document.getElementById('nom-piece');

    bouton.addEventListener('click', () => {
      if (!dernierCalcul) {
        annoncer(statut, T().devis.aucunResultat);
        return;
      }
      const avecComplements = document.getElementById('devis-complements')?.checked ?? true;
      // Une série de lignes par pièce (calcul sur un niveau ou tout le chantier), sinon une seule :
      // pièce active du plan, ou zone saisie pour un calculateur sans plan.
      const calculs = dernierCalcul.parPiece
        ? dernierCalcul.parPiece.map((calcul) => ({ nomPiece: calcul.infos.piece.nom, valeurs: calcul.valeurs, resultats: calcul.resultats, infos: calcul.infos }))
        : [{ nomPiece: (config.plan && enDessin() ? plan?.piece?.nom : champPiece?.value.trim()) ?? '', valeurs: dernierCalcul.valeurs, resultats: dernierCalcul.resultats, infos: config.plan && enDessin() ? plan : null }];
      const lignes = calculs.flatMap(({ nomPiece, valeurs: valeursPiece, resultats: resultatsPiece, infos }) => config.devis
        .filter((ligne) => avecComplements || !ligne.complement)
        .map((ligne, index) => ({
          designation: ligne.designation,
          piece: nomPiece.slice(0, 60),
          achat: ligne.achat ?? '',
          lot: ligne.lot,
          unite: ligne.unite,
          quantite: resultatsPiece[ligne.resultat],
          prixUnitaire: ligne.prixChamp ? valeursPiece[ligne.prixChamp] ?? 0 : 0,
          detail: [
            ligne.detail ? remplirModele(ligne.detail, valeursPiece, resultatsPiece, config.champs) : '',
            index === 0 && infos?.nombreOuvertures && config.champs.some((champ) => champ.remplacePar) ? `ouvertures : ${infos.descriptionOuvertures}` : '',
          ].filter(Boolean).join(', '),
          origine: config.titre,
        }))
        .filter((ligne) => typeof ligne.quantite === 'number' && Number.isFinite(ligne.quantite) && ligne.quantite > 0));

      if (lignes.length === 0) {
        annoncer(statut, T().devis.aucuneQuantite);
        return;
      }
      ajouterLignes(lignes);
      annoncer(statut, calculs.length > 1 ? T().portee.ajoutees(lignes.length, calculs.length) : T().devis.lignesAjoutees(lignes.length));
    });
  }

  // Champs remplacés par les ouvertures du plan : lecture seule, valeur du plan affichée,
  // et retour à la saisie manuelle (valeur conservée) dès qu'il n'y a plus d'ouverture.
  function afficherChampsRemplaces() {
    for (const champ of config.champs.filter((element) => element.remplacePar)) {
      const saisie = formulaire.elements[champ.id];
      const note = document.getElementById(`auto-${champ.id}`);
      const actif = Boolean(plan?.valide && plan.ouvertures?.length);
      if (actif && !saisie.readOnly) saisie.dataset.valeurManuelle = saisie.value;
      if (!actif && saisie.readOnly) saisie.value = saisie.dataset.valeurManuelle ?? saisie.value;
      saisie.readOnly = actif;
      if (actif) saisie.value = formater(plan[champ.remplacePar]).replace(/[\u00a0\u202f]/g, ' ');
      if (note) note.hidden = !actif;
    }
  }

  // Champs liés à la pièce (lienPiece: 'hauteur') : ils prennent la hauteur de la pièce active,
  // et la modifient quand l'internaute les change, pour tous les calculateurs.
  const champsLies = config.champs.filter((champ) => champ.lienPiece === 'hauteur');
  let editeur = null;
  function afficherPiece() {
    const etiquette = document.getElementById('devis-piece');
    if (etiquette) etiquette.textContent = plan?.piece?.nom ? `(${plan.piece.nom})` : '';
    for (const champ of champsLies) {
      const saisie = formulaire.elements[champ.id];
      if (plan?.piece && saisie !== document.activeElement) saisie.value = String(plan.piece.hauteur).replace('.', T().separateurDecimal);
    }
  }
  for (const champ of champsLies) {
    formulaire.elements[champ.id].addEventListener('input', (evenement) => {
      const hauteur = lireNombre(evenement.target.value);
      if (hauteur > 0 && hauteur <= 20) editeur?.definirHauteur(hauteur);
    });
  }

  // Suggestions issues du plan d'ensemble (clé suggestionChantier) : affichées sous le champ, avec un
  // bouton « Reprendre » ; la saisie reste celle de l'internaute. Seulement si le chantier enregistré
  // a des murs typés (au moins un mur extérieur ou porteur), signe que le plan a été renseigné.
  const champsSuggeres = config.champs.filter((champ) => champ.suggestionChantier);
  if (champsSuggeres.length) {
    let chantier = null;
    try {
      if (localStorage.getItem(CLE_CHANTIER) !== null) chantier = chargerChantier((cle) => localStorage.getItem(cle));
    } catch {
      chantier = null;
    }
    const renseigne = chantier?.pieces.some((piece) => piece.murs.some((mur) => mur.type !== 'cloison'));
    const valeursPlan = renseigne ? mesures(chantier) : null;
    for (const champ of champsSuggeres) {
      const zone = document.getElementById(`suggestion-${champ.id}`);
      const valeur = valeursPlan?.[champ.suggestionChantier];
      if (!zone || !(valeur > 0)) continue;
      const texte = document.createElement('span');
      texte.textContent = `${T().suggestion[champ.suggestionChantier](formater(valeur))} `;
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'bouton-suggestion';
      bouton.textContent = T().suggestion.reprendre;
      bouton.addEventListener('click', () => {
        formulaire.elements[champ.id].value = versSaisie(valeur);
        texte.textContent = `${T().suggestion.repris} `;
        mettreAJour();
      });
      zone.replaceChildren(texte, bouton);
      zone.hidden = false;
    }
  }

  // Barre de résultat fixe (mobile) : elle s'efface quand l'emplacement publicitaire est à l'écran,
  // pour ne jamais recouvrir une annonce, puis réapparaît.
  const barreFixe = document.querySelector('.barre-resultat');
  const pubContenu = document.querySelector('.pub-contenu');
  if (barreFixe && pubContenu && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entree]) => barreFixe.classList.toggle('barre-masquee', entree.isIntersecting)).observe(pubContenu);
  }

  appliquerMode();

  if (config.plan) {
    // L'éditeur appelle ce rappel dès son initialisation, puis à chaque modification du plan.
    editeur = creerEditeurPlan(document.getElementById('plan'), (infos) => {
      plan = infos;
      afficherChampsRemplaces();
      afficherPiece();
      mettreAJour();
    });
    // Premier calcul avec l'éditeur prêt : nécessaire quand la portée mémorisée couvre plusieurs pièces.
    mettreAJour();
  } else {
    mettreAJour();
  }
}

// moteur/pdf.js
// Génération d'un PDF A4 sans bibliothèque externe : texte en Helvetica (police standard
// intégrée à tous les lecteurs PDF), filets, liens cliquables et pagination.
// Module pur, sans DOM : il fonctionne dans le navigateur et dans test.js.

import { equivalentImperial, formater, formaterEuros } from './nombres.js';
import { T } from './langue.js';

const LARGEUR_PAGE = 595.28;
const HAUTEUR_PAGE = 841.89;
const MARGE = 42;

// Caractères hors Latin-1 disponibles dans l'encodage WinAnsi des polices standard.
const WIN_ANSI = {
  '€': 0x80, '‚': 0x82, '„': 0x84, '…': 0x85, '•': 0x95, '–': 0x96, '—': 0x97,
  '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, 'Œ': 0x8c, 'œ': 0x9c,
};

// Largeurs Helvetica (millièmes de corps) des caractères les plus fréquents ;
// les chiffres ont tous la même largeur, ce qui aligne exactement les montants.
const LARGEURS = { ' ': 278, ',': 278, '.': 278, ':': 278, '/': 278, '(': 333, ')': 333, '-': 333, '×': 584, '%': 889, '€': 556, 'i': 222, 'l': 222, 'j': 222, 'f': 278, 't': 278, 'r': 333, 'm': 833, 'w': 722, 'I': 278, 'M': 833, 'W': 944 };

function largeurCaractere(caractere) {
  if (caractere in LARGEURS) return LARGEURS[caractere];
  if (/[0-9]/.test(caractere)) return 556;
  if (/[A-ZÀ-Ý]/.test(caractere)) return 667;
  return 556;
}

export function largeurTexte(texte, taille, gras = false) {
  let total = 0;
  for (const caractere of normaliser(texte)) total += largeurCaractere(caractere);
  return (total * taille * (gras ? 1.04 : 1)) / 1000;
}

// Espaces insécables produites par Intl → espaces simples.
function normaliser(texte) {
  return String(texte ?? '').replace(/[\u00a0\u202f\u2009]/g, ' ');
}

// Chaîne PDF : octets WinAnsi, avec échappement des parenthèses et barres obliques inverses.
function chainePdf(texte) {
  let resultat = '';
  for (const caractere of normaliser(texte)) {
    let code = WIN_ANSI[caractere] ?? caractere.codePointAt(0);
    if (code > 0xff || (code < 0x20 && code !== 0x09)) code = 0x3f; // « ? » pour l'inconnu
    const octet = String.fromCharCode(code);
    resultat += octet === '(' || octet === ')' || octet === '\\' ? '\\' + octet : octet;
  }
  return `(${resultat})`;
}

const chiffre = (valeur) => (Math.round(valeur * 100) / 100).toString();
const couleurPdf = ([r, v, b]) => `${chiffre(r / 255)} ${chiffre(v / 255)} ${chiffre(b / 255)}`;

export function hexVersRvb(hex) {
  const valeur = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')?.[1] ?? '000000';
  return [0, 2, 4].map((position) => parseInt(valeur.slice(position, position + 2), 16));
}

function creerDocument() {
  const pages = [];
  let page = null;

  const document = {
    nouvellePage() {
      page = { operations: [], liens: [] };
      pages.push(page);
    },
    // y est mesuré depuis le haut de la page, plus naturel pour la mise en page.
    texte(x, y, contenu, { taille = 10, gras = false, couleur = [0, 0, 0], alignement = 'gauche' } = {}) {
      let depart = x;
      if (alignement === 'droite') depart = x - largeurTexte(contenu, taille, gras);
      page.operations.push(
        `BT /${gras ? 'F2' : 'F1'} ${chiffre(taille)} Tf ${couleurPdf(couleur)} rg ${chiffre(depart)} ${chiffre(HAUTEUR_PAGE - y)} Td ${chainePdf(contenu)} Tj ET`
      );
    },
    filet(x1, y1, x2, y2, { epaisseur = 0.5, couleur = [0, 0, 0] } = {}) {
      page.operations.push(
        `${chiffre(epaisseur)} w ${couleurPdf(couleur)} RG ${chiffre(x1)} ${chiffre(HAUTEUR_PAGE - y1)} m ${chiffre(x2)} ${chiffre(HAUTEUR_PAGE - y2)} l S`
      );
    },
    lien(x, y, largeur, hauteur, url) {
      page.liens.push({ x, y, largeur, hauteur, url });
    },
    get nombrePages() {
      return pages.length;
    },
    allerPage(index) {
      page = pages[index];
    },

    // Assemblage des objets PDF, de la table xref et du trailer.
    enOctets() {
      const objets = [];
      const reserver = () => objets.push(null) - 1;
      const definir = (index, contenu) => {
        objets[index] = contenu;
      };

      const catalogue = reserver();
      const arbre = reserver();
      const policeNormale = reserver();
      const policeGrasse = reserver();
      definir(policeNormale, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      definir(policeGrasse, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

      const references = [];
      for (const pageCourante of pages) {
        const flux = pageCourante.operations.join('\n');
        const contenu = reserver();
        definir(contenu, `<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`);

        const annotations = pageCourante.liens.map((lien) => {
          const index = reserver();
          const rect = [lien.x, HAUTEUR_PAGE - lien.y - lien.hauteur, lien.x + lien.largeur, HAUTEUR_PAGE - lien.y].map(chiffre).join(' ');
          definir(index, `<< /Type /Annot /Subtype /Link /Rect [${rect}] /Border [0 0 0] /A << /S /URI /URI ${chainePdf(lien.url)} >> >>`);
          return `${index + 1} 0 R`;
        });

        const objetPage = reserver();
        definir(
          objetPage,
          `<< /Type /Page /Parent ${arbre + 1} 0 R /MediaBox [0 0 ${LARGEUR_PAGE} ${HAUTEUR_PAGE}] ` +
            `/Resources << /Font << /F1 ${policeNormale + 1} 0 R /F2 ${policeGrasse + 1} 0 R >> >> ` +
            `/Contents ${contenu + 1} 0 R${annotations.length ? ` /Annots [${annotations.join(' ')}]` : ''} >>`
        );
        references.push(`${objetPage + 1} 0 R`);
      }

      definir(arbre, `<< /Type /Pages /Kids [${references.join(' ')}] /Count ${references.length} >>`);
      definir(catalogue, `<< /Type /Catalog /Pages ${arbre + 1} 0 R >>`);

      // Tous les caractères sont des octets (0-255) : la longueur de la chaîne est la taille en octets.
      let sortie = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
      const positions = [];
      objets.forEach((contenu, index) => {
        positions.push(sortie.length);
        sortie += `${index + 1} 0 obj\n${contenu}\nendobj\n`;
      });
      const debutXref = sortie.length;
      sortie += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n`;
      for (const position of positions) sortie += `${String(position).padStart(10, '0')} 00000 n \n`;
      sortie += `trailer\n<< /Size ${objets.length + 1} /Root ${catalogue + 1} 0 R >>\nstartxref\n${debutXref}\n%%EOF\n`;

      const octets = new Uint8Array(sortie.length);
      for (let i = 0; i < sortie.length; i++) octets[i] = sortie.charCodeAt(i) & 0xff;
      return octets;
    },
  };

  document.nouvellePage();
  return document;
}

function couper(texte, largeurMax, taille, gras = false) {
  let resultat = normaliser(texte);
  if (largeurTexte(resultat, taille, gras) <= largeurMax) return resultat;
  while (resultat.length > 1 && largeurTexte(resultat + '…', taille, gras) > largeurMax) resultat = resultat.slice(0, -1);
  return resultat.trimEnd() + '…';
}

// Découpe un texte en lignes qui tiennent dans la largeur donnée (adresse sur plusieurs lignes).
function envelopper(texte, largeurMax, taille) {
  const lignes = [];
  for (const paragraphe of normaliser(texte).split(/\r?\n/)) {
    let courante = '';
    for (const mot of paragraphe.split(' ')) {
      const essai = courante ? `${courante} ${mot}` : mot;
      if (largeurTexte(essai, taille) > largeurMax && courante) {
        lignes.push(courante);
        courante = mot;
      } else {
        courante = essai;
      }
    }
    if (courante) lignes.push(courante);
  }
  return lignes;
}

const totalLigne = (ligne) => (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0);

// Récapitulatif des besoins d'un chantier.
// site : { nom, adresse (URL du site), accent (#hex) } ; chantier : { nom, adresse, etabliPar } facultatifs ;
// tva : { active, taux } ; lienPartage : URL qui rouvre le récapitulatif en ligne ; date : Date.
// regroupement : 'lot' (corps de métier, par défaut) ou 'piece'.
// imperial : { actif, gallon } — ajoute l'équivalent impérial au détail des lignes en unité convertible.
// achats : { id: url } ; une ligne dont la clé achat y figure reçoit un lien « Acheter (lien partenaire) ».
export function genererRecapitulatif({ lignes, chantier = {}, tva = { active: false, taux: 20 }, site, lienPartage = '', date = new Date(), regroupement = 'lot', imperial = { actif: false }, achats = {} }) {
  const pdf = creerDocument();
  const accent = hexVersRvb(site.accent);
  const encre = [23, 24, 26];
  const gris = [85, 88, 92];
  const filetClair = [201, 198, 192];
  const droite = LARGEUR_PAGE - MARGE;
  const avecPrix = lignes.some((ligne) => Number(ligne.prixUnitaire) > 0);
  const colonnes = avecPrix
    ? { designation: 300, quantite: 400, prix: 480, total: droite }
    : { designation: 420, quantite: droite };

  let y = MARGE + 8;

  // En-tête
  pdf.texte(MARGE, y, site.nom, { taille: 22, gras: true, couleur: encre });
  pdf.texte(droite, y, T().pdf.etabliLe(date.toLocaleDateString(T().locale)), { taille: 9, couleur: gris, alignement: 'droite' });
  y += 26;
  pdf.texte(MARGE, y, T().pdf.titre, { taille: 15, gras: true, couleur: encre });
  y += 10;
  pdf.filet(MARGE, y, droite, y, { epaisseur: 2, couleur: accent });
  y += 22;

  // Informations du chantier : seules celles renseignées apparaissent.
  const infos = [
    ['Chantier', chantier.nom],
    ['Adresse', chantier.adresse],
    [T().chantier.etabliPar, chantier.etabliPar],
  ].filter(([, valeur]) => valeur && String(valeur).trim());
  for (const [libelle, valeur] of infos) {
    pdf.texte(MARGE, y, libelle, { taille: 9, gras: true, couleur: gris });
    const lignesTexte = envelopper(valeur, droite - MARGE - 90, 10);
    lignesTexte.forEach((ligneTexte, index) => pdf.texte(MARGE + 90, y + index * 13, ligneTexte, { taille: 10, couleur: encre }));
    y += Math.max(1, lignesTexte.length) * 13 + 4;
  }
  if (infos.length) y += 10;

  function entetesColonnes() {
    pdf.texte(MARGE, y, 'DÉSIGNATION', { taille: 7.5, gras: true, couleur: gris });
    pdf.texte(colonnes.quantite, y, 'QUANTITÉ', { taille: 7.5, gras: true, couleur: gris, alignement: 'droite' });
    if (avecPrix) {
      pdf.texte(colonnes.prix, y, 'PRIX UNITAIRE', { taille: 7.5, gras: true, couleur: gris, alignement: 'droite' });
      pdf.texte(colonnes.total, y, 'TOTAL', { taille: 7.5, gras: true, couleur: gris, alignement: 'droite' });
    }
    y += 8;
    pdf.filet(MARGE, y, droite, y, { epaisseur: 0.8, couleur: encre });
    y += 16;
  }

  function verifierPlace(hauteur) {
    if (y + hauteur <= HAUTEUR_PAGE - MARGE - 40) return;
    pdf.nouvellePage();
    y = MARGE + 8;
    entetesColonnes();
  }

  entetesColonnes();

  // Lignes regroupées par corps de métier, dans l'ordre d'apparition.
  // Groupes : corps de métier ou pièce ; l'autre information passe dans le détail de chaque ligne.
  const parPiece = regroupement === 'piece';
  const parLot = new Map();
  for (const ligne of lignes) {
    const groupe = parPiece ? ligne.piece || T().devis.sansPiece : ligne.lot || T().devis.divers;
    if (!parLot.has(groupe)) parLot.set(groupe, []);
    const equivalent = imperial.actif ? equivalentImperial(Number(ligne.quantite), ligne.unite, imperial) : null;
    parLot.get(groupe).push({ ...ligne, detail: [parPiece ? ligne.lot : ligne.piece, ligne.detail, equivalent ? `soit ${equivalent}` : ''].filter(Boolean).join(', ') });
  }

  let totalGeneral = 0;
  for (const [lot, lignesDuLot] of parLot) {
    verifierPlace(50);
    pdf.texte(MARGE, y, lot.toUpperCase(), { taille: 8.5, gras: true, couleur: accent });
    y += 16;

    let sousTotal = 0;
    for (const ligne of lignesDuLot) {
      const urlAchat = ligne.achat ? achats[ligne.achat] : '';
      const hauteur = (ligne.detail ? 30 : 20) + (urlAchat ? 11 : 0);
      verifierPlace(hauteur);
      pdf.texte(MARGE, y, couper(ligne.designation, colonnes.designation - MARGE - 10, 10, true), { taille: 10, gras: true, couleur: encre });
      const quantite = `${formater(Number(ligne.quantite) || 0)} ${ligne.unite ?? ''}`.trim();
      pdf.texte(colonnes.quantite, y, quantite, { taille: 10, couleur: encre, alignement: 'droite' });
      if (avecPrix) {
        pdf.texte(colonnes.prix, y, formaterEuros(Number(ligne.prixUnitaire) || 0), { taille: 10, couleur: encre, alignement: 'droite' });
        pdf.texte(colonnes.total, y, formaterEuros(totalLigne(ligne)), { taille: 10, couleur: encre, alignement: 'droite' });
      }
      if (ligne.detail) pdf.texte(MARGE, y + 12, couper(ligne.detail, colonnes.designation - MARGE - 10, 8), { taille: 8, couleur: gris });
      if (urlAchat) {
        const yAchat = y + (ligne.detail ? 23 : 12);
        const libelle = T().achat.acheterPdf;
        pdf.texte(MARGE, yAchat, libelle, { taille: 8, couleur: accent });
        pdf.lien(MARGE, yAchat - 8, largeurTexte(libelle, 8), 11, urlAchat);
      }
      y += hauteur - 8;
      pdf.filet(MARGE, y, droite, y, { epaisseur: 0.4, couleur: filetClair });
      y += 14;
      sousTotal += totalLigne(ligne);
    }

    if (avecPrix) {
      verifierPlace(20);
      pdf.texte(colonnes.prix, y, `Sous-total ${lot}`, { taille: 9, gras: true, couleur: gris, alignement: 'droite' });
      pdf.texte(colonnes.total, y, formaterEuros(sousTotal), { taille: 10, gras: true, couleur: encre, alignement: 'droite' });
      y += 22;
    } else {
      y += 6;
    }
    totalGeneral += sousTotal;
  }

  if (avecPrix) {
    verifierPlace(70);
    y += 4;
    pdf.filet(colonnes.quantite - 60, y, droite, y, { epaisseur: 0.8, couleur: encre });
    y += 18;
    const totaux = tva.active
      ? [
          [T().devis.totalHt, totalGeneral],
          [T().devis.tvaA(String(tva.taux).replace('.', T().separateurDecimal)), (totalGeneral * tva.taux) / 100],
          ['Total TTC', totalGeneral * (1 + tva.taux / 100)],
        ]
      : [['Total', totalGeneral]];
    totaux.forEach(([libelle, montant], index) => {
      const dernier = index === totaux.length - 1;
      pdf.texte(colonnes.prix, y, libelle, { taille: dernier ? 11 : 9.5, gras: dernier, couleur: encre, alignement: 'droite' });
      pdf.texte(colonnes.total, y, formaterEuros(montant), { taille: dernier ? 13 : 10, gras: dernier, couleur: dernier ? accent : encre, alignement: 'droite' });
      y += dernier ? 20 : 15;
    });
  }

  // Lien de partage, cliquable
  if (lienPartage) {
    verifierPlace(40);
    y += 12;
    const libelle = T().pdf.ouvrirEnLigne;
    pdf.texte(MARGE, y, libelle, { taille: 10, gras: true, couleur: accent });
    pdf.filet(MARGE, y + 2, MARGE + largeurTexte(libelle, 10, true), y + 2, { epaisseur: 0.6, couleur: accent });
    pdf.lien(MARGE, y - 10, largeurTexte(libelle, 10, true), 14, lienPartage);
    y += 14;
    pdf.texte(MARGE, y, T().pdf.avertissement, { taille: 7.5, couleur: gris });
  }

  // Pied de page de chaque page : adresse du site (cliquable) et pagination.
  const adresseAffichee = String(site.adresse ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const mention = T().pdf.mention(site.nom, adresseAffichee);
  for (let index = 0; index < pdf.nombrePages; index++) {
    pdf.allerPage(index);
    const basPage = HAUTEUR_PAGE - MARGE + 10;
    pdf.filet(MARGE, basPage - 14, droite, basPage - 14, { epaisseur: 0.4, couleur: filetClair });
    pdf.texte(MARGE, basPage, mention, { taille: 8, couleur: gris });
    if (site.adresse) pdf.lien(MARGE, basPage - 9, largeurTexte(mention, 8), 12, site.adresse);
    pdf.texte(droite, basPage, `Page ${index + 1} sur ${pdf.nombrePages}`, { taille: 8, couleur: gris, alignement: 'droite' });
  }

  return pdf.enOctets();
}

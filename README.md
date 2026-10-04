# Moteur de calculateurs

Un seul code pour produire plusieurs sites statiques de calculateurs.
Chaque site n'est qu'un dossier de configuration ; le moteur (HTML, CSS, JS) est commun.
Un bug corrigé dans `moteur/` est corrigé sur tous les sites au prochain `build`.

Aucune dépendance : Node.js 18 ou plus suffit.

## Arborescence

```
moteur-calculateurs/
├── build.js              génère dist/<site>/ pour chaque dossier de sites/
├── test.js               vérifie les formules de tous les calculateurs
├── serve.js              prévisualisation locale
├── moteur/
│   ├── calcul.js         script navigateur : lecture, validation, calcul, affichage, ajout au devis
│   ├── nombres.js        lecture et formatage des nombres en français
│   ├── geometrie.js      aire, périmètre, validité d'une forme, découpe, calepinage
│   ├── plan.js           éditeur de plan (dessin SVG + tableau de coordonnées + ouvertures)
│   ├── ouvertures.js     ouvertures du plan : totaux, validation, recalage (module pur)
│   ├── murs.js           murs des pièces : types, épaisseurs, contour hors tout (module pur)
│   ├── ensemble.js       plan d'ensemble : position, aimantation, chevauchements (module pur)
│   ├── chantier-plan.js  niveaux, murs communs, tableaux, éléments, mesures (module pur)
│   ├── chantier.js       pièces du chantier : lecture, migration des anciens plans (module pur)
│   ├── aide-choix.js     aide au choix du produit : règles et validation (module pur)
│   ├── langue.js         langue active de l'interface (navigateur et génération)
│   ├── langues/fr.js     textes de l'interface en français, langue par défaut
│   ├── panier.js         récapitulatif cumulé (page /devis/, chantier, lien de partage, CSV)
│   ├── pdf.js            génération du récapitulatif PDF, sans bibliothèque externe
│   ├── theme.js          bouton « Mode nuit » (sites avec themeNuit)
│   ├── gabarits.js       gabarits HTML, SEO (JSON-LD, sitemap), mentions légales
│   └── style.css         styles communs, pilotés par des variables CSS
└── sites/
    ├── immo/             Pierre Angulaire, charte Maison de pierre
    │   ├── site.js       nom, domaine, thème, éditeur, monétisation
    │   └── calculateurs/
    │       └── rentabilite-locative.js
    ├── revente/          Marge Revente, charte Atelier (arrondis 4 px)
    │   ├── site.js
    │   └── calculateurs/
    │       └── marge-revente.js
    └── travaux/          Métré, chartes Béton brut (jour) et Nuit de chantier (nuit)
        ├── site.js       devis: true active le devis, themeNuit le mode nuit
        └── calculateurs/
            ├── peinture.js
            ├── carrelage.js
            ├── plaques-platre.js   plaques, rails, montants et vis (cloison ou doublage)
            ├── laine-de-verre.js   épaisseur selon R et λ, couches, rouleaux ou panneaux
            ├── laine-de-roche.js
            ├── isolation-sol.js    panneaux sous chape, film et bande périphérique
            ├── plancher-chauffant.js  tube, boucles et couronnes selon le pas de pose
            ├── parquet.js          paquets selon la pose, sous-couche, plinthes
            ├── moquette.js         lés découpés sur la forme réelle, sens le plus économique
            ├── lino.js
            ├── papier-peint.js     lés, lés par rouleau selon le raccord, colle
            ├── tenture.js          tissu mural au mètre, pose horizontale ou en lés
            ├── parement.js         plaquettes, angles, mortier-colle
            ├── enduit-facade.js    surface avec pignons, sacs selon l'épaisseur
            ├── plinthes.js         plinthes bois, MDF ou carrelage, angles, colle
            ├── terrasse.js, cloture.js, pavage.js, gravier.js           aménagements extérieurs
            ├── carrelage-mural.js, gouttieres.js, plafond-suspendu.js, isolation-soufflee.js
            ├── lambris-bardage.js, couverture-plaques.js, plancher-bois.js, isolation-exterieur.js
            ├── reseau-plomberie.js, puissance-chauffage.js, reseau-electrique.js
            ├── toit-plat.js, drainage.js, peinture-facade.js
            ├── terrassement.js, treillis-soude.js, escalier.js, pente.js
            ├── vmc.js              débits de l'arrêté du 24 mars 1982, article 3
            ├── ballon-eau-chaude.js besoins par foyer (guide technique de l'ADEME)
            ├── beton.js            volume, toupie, sacs prêts à gâcher ou ciment + sable + gravier
            ├── mur-blocs.js        parpaings, briques, béton cellulaire, carreaux de plâtre, angles, mortier
            ├── chape.js            ragréage, mortier de chape ou chape fluide, primaire, bande
            ├── linteaux.js         longueurs avec appuis, arrondies aux longueurs vendues
            ├── charpente.js        chevrons et contre-liteaux (pas de calcul de section)
            ├── tuiles.js           tuiles, faîtières, rives, liteaux, écran, closoir
            └── ardoises.js         ardoises au m² selon format et recouvrement, crochets, liteaux
```

## Commandes

```bash
node test.js             # à lancer avant chaque mise en ligne
node build.js            # construit tous les sites
node build.js immo       # construit un seul site
node serve.js immo       # http://localhost:8080
```

## Ajouter un calculateur

Créer un fichier dans `sites/<site>/calculateurs/`. Il est détecté automatiquement.

| Clé | Rôle |
|---|---|
| `slug` | adresse de la page : `/slug/` (minuscules, chiffres, tirets) |
| `titre`, `description` | titre de page et meta description |
| `intro`, `explication`, `faq` | contenu rédactionnel, indispensable pour le référencement |
| `champs` | `id`, `label`, `unite`, `requis`, `min`, `max`, `defaut`, `aide` |
| `resultats` | `id`, `label`, `format` (`euros`, `pourcent`, `nombre`), `principal` |
| `calculer(v)` | reçoit `{ idChamp: nombre }`, renvoie `{ idResultat: nombre ou null }` |
| `exemples` | entrées et résultats attendus, contrôlés par `test.js` |

Règles pour `calculer` :

- elle doit être **autonome** : le moteur la recopie dans le navigateur avec `toString()`, donc aucune variable ni fonction définie en dehors d'elle ; `test.js` détecte ce cas ;
- elle doit être **pure** : mêmes entrées, même résultat, sans accès au DOM ;
- elle renvoie `null` quand un calcul est impossible (division par zéro) : la page affiche alors « — » ;
- un champ facultatif vide vaut `0`.

## Chartes graphiques

Toute la charte d'un site est dans le bloc `theme` de son `site.js`. Chaque clé devient une
variable CSS (`couleurFond` → `--couleur-fond`) ; `moteur/style.css` n'utilise que ces variables.

| Groupe | Clés |
|---|---|
| Couleurs | `couleurFond`, `couleurSurface`, `couleurTexte`, `couleurDiscret`, `couleurLigne`, `couleurBordureChamp`, `couleurLien`, `couleurFocus`, `couleurAccent`, `couleurErreur`, `couleurSucces` |
| Typographie | `policeTitres`, `policeTexte`, `policeChiffres`, `titresGraisse`, `titresStyle`, `titresEtirement`, `titresInterlettrage`, `surtitreInterlettrage` |
| Formes | `trait`, `rayon`, `rayonBouton`, `rayonChamp` |
| Champs | `champFond`, `champBordure`, `champBordureBas`, `champRetrait` (champs soulignés : bordure `0 solid transparent`, bordure basse `2px solid …`) |
| Bouton principal | `boutonFond`, `boutonTexte`, `boutonFondSurvol`, `boutonTexteSurvol`, `boutonCasse`, `boutonInterlettrage` |
| Résultat | `resultatsFond`, `resultatsTexte`, `resultatsDiscret`, `resultatsBordure`, `resultatsFilet` |
| Plan | `planFond`, `planGrille`, `planGrilleMetre`, `planTrait` |
| Teintes | `teintes: { carrelage: '#0E6E82', … }`, une couleur par calculateur |

Autres réglages du site :

- `marqueHtml` : logo en HTML (par exemple le point orange de « Métré. ») ; sinon `nom` est affiché.
- `themeNuit` : mêmes clés que `theme`. La page suit le réglage clair ou sombre de l'appareil,
  un bouton « Mode nuit » permet de forcer l'un ou l'autre (choix mémorisé), et l'impression
  repasse toujours en jour pour que le devis reste lisible sur papier.

Dans un calculateur, `rubrique` affiche le surtitre « Calculateur · … » et `teinte` choisit la
couleur du surtitre, du filet du résultat et du fond du plan. La teinte doit exister dans
`theme.teintes` (et `themeNuit.teintes`) : `build.js` s'arrête sinon.

Polices : uniquement des polices système, pour zéro requête réseau. Bahnschrift et Palatino
Linotype sont installées sous Windows ; sur macOS et Android, les polices de secours prennent le
relais. Pour Pierre Angulaire, auto-héberger Playfair Display (licence OFL) donnera la même Didone
partout.

Sur mobile, une barre fixe en bas d'écran reprend le résultat principal et mène au détail.

## Types de champ

| `type` | Rendu | Valeur reçue par `calculer` |
|---|---|---|
| `nombre` (par défaut) | champ texte, saisie à la française | nombre, `0` si facultatif et vide |
| `case` | case à cocher | `1` ou `0` |
| `choix` | liste déroulante, `options: [{ valeur, libelle }]` | la `valeur` numérique choisie |

## Calculateurs avec plan (`plan: true`)

La page affiche l'éditeur de plan au-dessus du formulaire. La forme est mémorisée dans le
navigateur et reprise automatiquement par les autres calculateurs du site.

`calculer(v, plan, geo)` reçoit alors :

- `plan.points` : angles de la pièce en cm, `plan.surface` en m², `plan.perimetre` en m ;
- `geo` : les fonctions de `moteur/geometrie.js`, dont `geo.calepiner(points, { largeur, longueur, joint, type, decalage })`.

Les `exemples` d'un calculateur avec plan fournissent une clé `plan` (liste d'angles en cm).

### Ouvertures placées sur le plan

Sous le plan, la section « Portes et fenêtres » ajoute des portes (83 × 204 cm), fenêtres
(120 × 135 cm) et portes-fenêtres (120 × 215 cm). Ces dimensions courantes sont à vérifier sur
place et restent modifiables. Chaque ouverture se place sur un mur : elle arrive dans le plus
grand espace libre, se déplace en la faisant glisser le long du mur (souris ou doigt), et se
règle au centimètre dans le tableau (type, mur, largeur, hauteur, distance depuis l'angle).
Quand on ajoute ou supprime un angle, les ouvertures suivent leur mur.

Le plan transmis à `calculer` contient alors, en plus de `points`, `surface` et `perimetre` :

| Clé | Contenu |
|---|---|
| `ouvertures` | liste `{ type, cote, largeur, hauteur, position }` (cm) |
| `surfaceOuvertures` | surface totale des ouvertures (m²) |
| `largeurPortes` | largeur des portes et portes-fenêtres, ouvertures au sol (m) |
| `largeurPortesFenetres` | largeur des portes-fenêtres seules (m) |
| `nombrePortes` | nombre de portes intérieures (seuils) |
| `nombreOuvertures`, `descriptionOuvertures` | nombre total et texte « 1 porte, 2 fenêtres » |

Un champ manuel déclare la valeur du plan qui le remplace, sans toucher à `calculer` :

```js
{ id: 'ouvertures', remplacePar: 'surfaceOuvertures', label: 'Surface des portes et fenêtres', unite: 'm²' }
```

Quand le plan contient des ouvertures, ce champ passe en lecture seule, affiche la valeur du
plan avec la mention « Calculé d'après les ouvertures placées sur le plan », et la formule
reçoit cette valeur. Sans ouverture, la saisie manuelle revient, avec la valeur que
l'internaute avait tapée. `remplacePar` n'est accepté que dans un calculateur avec plan
(`build.js` le vérifie). La ligne principale du devis mentionne les ouvertures dans son détail.

Utilisations actuelles : peinture et carrelage mural (surface), papier peint et tenture
(portes-fenêtres seules : les portes et fenêtres courantes restent tapissées autour), plinthes
et parquet (largeur des portes, et nombre de portes pour les barres de seuil).

Les exemples de test peuvent contenir `ouvertures: [...]` à côté de `plan`.

### Murs et épaisseurs

La pièce reste dessinée à ses cotes intérieures ; chaque côté reçoit un mur, dessiné vers
l'extérieur avec son épaisseur. Section « Murs et épaisseurs » sous le plan : type de chaque mur
(mur extérieur, mur porteur intérieur, cloison), épaisseur en centimètres, et « Appliquer à tous
les murs ». Épaisseurs proposées, à vérifier selon le bâtiment : mur extérieur 30 cm (maçonnerie
de 20 cm et doublage isolé), mur porteur 20 cm, cloison 7 cm (72/48). Les ouvertures traversent le
mur sur toute son épaisseur ; les murs suivent les angles ajoutés ou supprimés.

Le plan transmis à `calculer` contient alors `murs` (liste `{ type, epaisseur, longueur }`),
`longueurMursExterieurs`, `longueurMursPorteurs`, `longueurCloisons` (m, longueurs intérieures),
`surfaceHorsTout` et `perimetreHorsTout` (pièce murs compris). Le contour extérieur raccorde
proprement les angles, même entre murs d'épaisseurs différentes. Logique dans `moteur/murs.js`,
module pur testé par `test.js`. Les murs sont enregistrés avec la pièce ; une pièce enregistrée
avant reçoit des cloisons de 7 cm.

C'est la première étape du plan d'ensemble : l'assemblage des pièces viendra s'appuyer sur ces
épaisseurs (aimantation, murs communs).

### Plan d'ensemble

Dans le cadre du plan de chaque calculateur, deux vues : « Cette pièce » (dessin et réglage de la
pièce active) et « Plan d'ensemble » (toutes les pièces du chantier, avec leurs murs).

En vue d'ensemble :

- toucher une pièce la sélectionne : elle devient la pièce active, et le calculateur recalcule sur
  elle ;
- la faire glisser la déplace ; près d'une autre pièce, elle se cale à l'épaisseur du mur qui les
  sépare (le plus épais des deux murs déclarés) et ses extrémités s'alignent ;
- « Tourner la pièce d'un quart de tour » la fait pivoter autour de son centre ;
- « Modifier la forme de cette pièce » revient à la vue de la pièce ;
- les chevauchements (pièces superposées, ou trop proches pour leur mur) sont signalés en rouge et
  dans le résumé ;
- « Placer les pièces au clavier » : position, rotation et sélection de chaque pièce dans un tableau.

Chaque pièce garde son plan propre ; le plan d'ensemble n'enregistre que sa position
(`position: { x, y, rotation }` dans `chantier-v1`). Une pièce jamais placée est posée
automatiquement à droite des autres. Logique dans `moteur/ensemble.js`, module pur testé par
`test.js`.

### Un plan pour toutes les surfaces : pièces, zones, murs, pans de toit

Le même éditeur dessine quatre natures d'objets, rangées dans le chantier avec une sélection active
par nature :

| Nature | Calculateurs | Ce qui est dessiné |
|---|---|---|
| `piece` | peinture, sols… et plancher bois, isolation soufflée, puissance de chauffage | plan intérieur (murs, ouvertures, hauteur) |
| `zone` | dalle béton, treillis, terrasse, pavage, gravier, terrassement | zone extérieure, sans murs ; visible dans le plan d'ensemble |
| `mur` | plaques, blocs, parement, lambris, laines, enduit, peinture de façade, ITE | face du mur vue de face, pignon possible, portes et fenêtres posées sur la face |
| `pan` | tuiles, ardoises, couverture en plaques, chevrons, toit plat | pan vu du dessus ; la pente donne la surface réelle |

Déclaration dans un calculateur : `plan: { nature: 'zone', saisie: true }`. Avec `saisie: true`, un choix
« Saisir les dimensions / Dessiner sur un plan » (mémorisé par calculateur) garde la saisie habituelle ;
les champs de dimension marqués `saisie: true` sont masqués et ne sont plus exigés en mode dessin, et la
formule reçoit alors `plan` (sinon `null`). `plan: true` reste la forme des calculateurs à plan seul.

Le plan d'une zone, d'un mur ou d'un pan fournit `surface` (éléments déduits), `surfaceBrute`,
`surfaceElements`, `perimetre`, `longueur` et `largeur`/`hauteur` (dimensions hors tout), `nombreElements`,
`nombrePortes`, `nombreFenetres`. Modèles : pignon pour un mur, trapèze (croupe) et triangle pour un pan.
« Partir des murs du plan » (murs) crée la face d'un mur d'une pièce, ou une face par façade du plan
d'ensemble, avec ses ouvertures (allège de 1 m pour les fenêtres, à ajuster). « Tous les murs », « Toutes
les zones », « Tous les pans » additionnent les objets de la nature.

Toitures dessinées : surface réelle = surface vue du dessus ÷ cos(pente) ; rampant = profondeur ÷ cos(pente) ;
faîtage = bord haut du pan, partagé avec le pan opposé quand la toiture a deux pans (un triangle n'en a pas) ;
liteaux = surface ÷ pureau. Rives, noues et arêtiers restent ceux de la saisie.

`test.js` vérifie, pour les 23 calculateurs, qu'un dessin identique à la saisie donne les mêmes résultats,
et contrôle trois formes non rectangulaires calculées à la main (dalle en L, mur à pignon, pan de croupe).

### Chantier assemblé : niveaux, murs communs, calcul sur plusieurs pièces

- **Niveaux** : chaque pièce appartient à un niveau (« Niveau » dans le bloc des pièces). La vue
  d'ensemble affiche un niveau à la fois (« Niveau affiché »), qu'on peut renommer ; « Nouveau
  niveau » en ajoute un. Une pièce créée en vue d'ensemble va sur le niveau affiché.
- **Murs communs** : deux côtés de pièces d'un même niveau qui se font face à l'épaisseur du mur
  près (1 cm) forment un mur commun. Les ouvertures d'une pièce y apparaissent dans la pièce voisine
  (en pointillés, modifiables seulement depuis leur pièce) et sont déduites des deux côtés.
- **Retours de tableau** : pour chaque ouverture dans un mur extérieur ou porteur, profondeur = épaisseur
  du mur, sur les deux côtés et le dessus (et l'appui pour une fenêtre). Valeur `surfaceTableaux` du plan,
  utilisable par `remplacePar` ; la peinture l'ajoute à la surface des murs.
- **Éléments à déduire** : trémie d'escalier, gaine, conduit, placés en rectangle dans la pièce ; leur
  surface est retirée de `plan.surface` (`surfaceBrute` reste disponible). Les calculateurs qui
  calepinent à partir du dessin (carrelage, lés de moquette ou de lino) ne les retirent pas : la
  quantité reste un peu prudente.
- **Mesures d'ensemble** (résumé de la vue d'ensemble) : surface habitable, emprise au sol murs compris,
  longueur de façades (murs extérieurs non communs), longueur de cloisons (chaque cloison commune
  comptée une fois).
- **« Calculer pour »** : cette pièce, tout le niveau ou tout le chantier (choix mémorisé). Un calcul par
  pièce, avec sa hauteur et ses ouvertures, puis les totaux ; « Détail par pièce » sous les résultats ;
  « Ajouter au devis » ajoute les lignes de chaque pièce. Un résultat qui ne s'additionne pas
  (pourcentage, texte, ou `cumul: false` sur le résultat, comme la longueur d'un lé) s'affiche s'il est
  identique partout, sinon « selon la pièce ».
- **Suggestions pour les calculateurs sans plan** : un champ peut porter
  `suggestionChantier: 'longueurFacades' | 'longueurCloisons' | 'surfaceTableauxExterieurs'`. Si le
  chantier enregistré a des murs extérieurs ou porteurs, la valeur du plan d'ensemble s'affiche sous le
  champ avec un bouton « Reprendre » ; la saisie reste celle de l'internaute. Utilisé par l'enduit, la
  peinture de façade et l'isolation par l'extérieur (longueur des façades, retours de tableau) et par
  les plaques de plâtre (longueur des cloisons).

Logique dans `moteur/chantier-plan.js`, module pur testé par `test.js`.

### Plusieurs pièces dans un chantier

En tête du plan, le bloc « Pièces du chantier » choisit la pièce active et permet de la
renommer, de régler sa hauteur sous plafond, d'en créer une nouvelle, de la dupliquer ou de la
supprimer. Chaque pièce garde son plan, ses ouvertures et sa hauteur ; la pièce active est la
même dans tous les calculateurs.

Un champ déclaré `lienPiece: 'hauteur'` (hauteur sous plafond de la peinture, du papier peint,
de la tenture) prend la hauteur de la pièce active, et la modifie pour toute la pièce quand on
le change. `build.js` n'accepte `lienPiece` que dans un calculateur avec plan.

Chaque ligne ajoutée au devis porte sa pièce : la pièce active pour un calculateur avec plan,
ou la « Pièce ou zone » saisie pour un calculateur sans plan (béton, clôture…). Le récapitulatif
affiche une colonne Pièce et se regroupe au choix par corps de métier ou par pièce (choix
mémorisé) ; le PDF suit ce regroupement, le CSV a une colonne Pièce, et le lien de partage
transporte la pièce de chaque ligne (les liens envoyés auparavant restent lisibles).

Le plan transmis à `calculer` contient `piece` : `{ id, nom, hauteur }`.

Stockage : `chantier-v1` (`{ version, active, pieces: [{ id, nom, hauteur, points, ouvertures }] }`)
et `devis-regroupement-v1`. Un plan enregistré par une version précédente (`plan-piece-v2`, ou
`plan-piece-v1` sans ouvertures) devient automatiquement « Pièce 1 ». La logique est dans
`moteur/chantier.js`, module pur testé par `test.js`.

## Devis

Dans `site.js`, `devis: true` ajoute le lien « Mon devis » et la page `/devis/`.
Dans un calculateur, chaque ligne de `devis` associe un résultat à une ligne du devis :

```js
devis: [
  { resultat: 'cartons', designation: 'Carrelage', unite: 'carton', lot: 'Sols', prixChamp: 'prixCarton' },
],
```

`prixChamp` (facultatif) préremplit le prix unitaire avec un champ du calculateur.
Les lignes à quantité nulle ne sont pas ajoutées.

## Corps de métier

Dans `site.js`, `lots` liste les corps de métier dans l'ordre d'affichage :

```js
lots: [
  { id: 'platrerie-isolation', nom: 'Plâtrerie et isolation', description: '…' },
],
```

Chaque calculateur indique le sien avec `lot: 'platrerie-isolation'`, et peut fixer sa
place dans la liste avec `ordre` (par exemple l'isolation du sol avant le revêtement). L'accueil regroupe les
calculateurs par corps de métier, et chaque corps de métier qui a au moins un calculateur obtient
sa page `/corps-de-metier/<id>/`, ajoutée au sitemap. Les lignes du récapitulatif prennent
automatiquement le nom du corps de métier de leur calculateur.

## Récapitulatif PDF et lien de partage

Sur la page `/devis/`, l'internaute peut renseigner, s'il le souhaite, le nom du chantier,
son adresse et le nom de la personne qui l'établit : seules les informations remplies
apparaissent dans le PDF. Le bouton « Télécharger le récapitulatif (PDF) » produit
directement le fichier (lignes regroupées par corps de métier, détail du calcul, prix et
totaux s'ils sont renseignés, adresse du site en pied de page).

Le lien de partage encode tout le récapitulatif dans l'ancre de l'adresse (`#r=…`), jamais
envoyée au serveur. En l'ouvrant, le destinataire choisit d'ouvrir le récapitulatif, de
l'ajouter au sien ou de l'ignorer. Le PDF contient ce lien, cliquable.

Le détail de chaque ligne vient d'un modèle dans le calculateur :

```js
{ resultat: 'cartons', detail: '{surface} m², carreaux {largeurCarreau} × {longueurCarreau} cm', … }
```

Chaque `{clé}` doit être un champ ou un résultat du calculateur : `build.js` le vérifie.
`{clé:libelle}` affiche le libellé de l'option choisie dans une liste (par exemple
`Plaque {typePlaque:libelle}` donne « Plaque hydrofuge (pièces humides) »).

## Navigation

L'en-tête tient sur une ligne : logo, bouton « Calculateurs », mode nuit, équivalents impériaux et
« Mon devis » (« Devis » sur les très petits écrans). Le bouton ouvre un panneau, un `<details>` natif
utilisable sans JavaScript, qui contient :

- une recherche (activée par `appli.js`), sans accents ni majuscules, sur le titre, la rubrique, le
  corps de métier et la description de chaque calculateur ; Entrée ouvre le premier résultat ;
- les calculateurs **par type de chantier**, en titres dépliables (tous dépliés en colonnes sur grand
  écran) ;
- les pages **par corps de métier**, conservées pour les artisans et le référencement.

Échap ou un clic à l'extérieur ferme le panneau. Les types se déclarent dans `site.js` :

```js
typesChantier: [
  { id: 'sols', nom: 'Sols', calculateurs: ['chape-ragreage', 'quantite-carrelage', …] },
  …
],
```

Un calculateur peut figurer dans plusieurs types. `build.js` refuse un slug inconnu et signale les
calculateurs rangés dans aucun type. Un site sans `typesChantier` n'a pas de panneau.

## Langues de l'interface (préparation de la version anglaise)

Tous les textes de l'interface du moteur (boutons, messages, libellés du récapitulatif et du PDF,
mentions, confidentialité, installation) sont dans `moteur/langues/fr.js`, la langue par défaut.
Le contenu des calculateurs (titres, champs, explications) reste dans leurs propres fichiers.
`moteur/langue.js` choisit la langue : celle de `<html lang>` dans le navigateur, celle de la page
en cours à la génération. Les formats de nombres, de dates et le séparateur décimal (saisie et
affichage) suivent la langue.

Ajouter une langue, par exemple l'anglais :

1. copier `moteur/langues/fr.js` en `moteur/langues/en.js`, traduire chaque texte en gardant les
   mêmes clés, régler `code`, `locale`, `ogLocale`, `separateurDecimal` et les segments `chemins`
   (adresses des pages fixes : `devis`, `corpsDeMetier`, `mentionsLegales`, `confidentialite`) ;
2. déclarer la langue dans `site.js` : `langues: ['fr', 'en']` (la première est la langue par
   défaut, servie à la racine) ;
3. facultatif : une adresse traduite par calculateur, `slugs: { en: 'tile-calculator' }` ; sans
   elle, la page anglaise reprend le slug français sous `/en/`.

`build.js` génère alors chaque page une fois par langue (`/en/…`), avec des liens internes
préfixés, les balises `hreflang` réciproques et `x-default`, et un sitemap qui liste chaque version
avec ses alternatives. Les formules, les widgets et la page 404 restent communs. `test.js` vérifie
que chaque fichier de langue a exactement les mêmes clés que `fr.js` ; `build.js` refuse une langue
sans fichier, une adresse en double dans une langue, ou un slug traduit pour une langue non déclarée.

Aucun contenu anglais n'est fourni : le mécanisme est prêt, la traduction reste à faire (textes de
l'interface, puis contenu des calculateurs et de `site.js`).

## Widget intégrable

`build.js` génère pour chaque calculateur une page `/widget/<slug>/` : le calculateur seul, sans
en-tête, pied de page, publicité, barre mobile ni ajout au devis, avec un lien discret vers la page
d'origine. `?theme=nuit` impose le thème sombre (clair par défaut), sans toucher au réglage de
l'internaute. Ces pages portent `noindex` et un lien canonique vers la page du calculateur ; elles
sont absentes du sitemap et du cache hors ligne.

Chaque page de calculateur propose « Intégrer ce calculateur sur votre site » : choix du thème, code
à copier et bouton « Copier le code ». Le code contient l'`<iframe>`, un lien texte visible vers la
page d'origine placé hors de l'iframe, et un petit script qui ajuste la hauteur de l'iframe. Le
widget envoie sa hauteur par `postMessage` (message de type `calculateur-hauteur`) ; le script
d'intégration ignore tout message qui ne vient pas de l'origine du site (`site.domaine`).

Le code d'intégration utilise `site.domaine` : il sera juste une fois le vrai nom de domaine
renseigné dans `site.js`.

## Liens d'achat dans le récapitulatif

Une ligne de devis peut porter `achat: 'cle'`, qui renvoie au lien d'affiliation de même `id`
dans `monetisation.affiliation` :

```js
// site.js
affiliation: [{ id: 'carrelage', texte: '…', libelleLien: 'Voir les carrelages', url: 'https://…', pages: ['quantite-carrelage'] }],
// calculateur
devis: [{ resultat: 'cartons', achat: 'carrelage', designation: 'Carrelage', unite: 'carton' }],
```

Dans `/devis/`, la ligne affiche un lien « Acheter » (nouvel onglet, `rel="sponsored noopener"`)
suivi de la mention « Lien partenaire » ; dans le PDF, « Acheter (lien partenaire) » est cliquable.
Sans affiliation configurée pour cette clé, aucun lien n'apparaît. Le moteur n'ajoute ni cookie ni
traceur : c'est un lien simple. Le lien de partage transporte la clé d'achat.

`build.js` vérifie le format des clés, l'unicité des `id` et les liens en `https://`, et signale par
un avertissement les clés d'achat sans lien configuré. Clés déjà posées sur Métré : `carrelage`,
`peinture`, `parquet`, `plaques-platre`, `isolant`, `papier-peint`.

## Aide au choix du produit

Clé facultative `aideAuChoix` : 2 à 4 questions fermées et des règles qui préremplissent des
champs de type liste ou case. Le bloc « Aidez-moi à choisir » (replié par défaut) présente les
questions en boutons radio ; chaque réponse remplit les champs visés et affiche une phrase qui
explique la recommandation. Les champs restent modifiables.

```js
aideAuChoix: {
  questions: [{ id: 'humide', question: 'La pièce est-elle humide ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] }, …],
  regles: [
    { si: { feu: 'oui' }, alors: { typePlaque: { valeur: 3, raison: 'car une résistance au feu est demandée' } } },
    …
    { si: {}, alors: { typePlaque: { valeur: 0, raison: 'aucun besoin particulier' } } },
  ],
}
```

Les règles sont classées par priorité : pour chaque champ, la première règle applicable l'emporte ;
une règle sans condition sert de défaut. `build.js` vérifie que chaque condition vise une question
et une réponse existantes, et chaque champ une valeur existante. Premier cas : plaques de plâtre
(feu, puis pièce humide, puis acoustique, qui coche aussi l'isolant acoustique). Logique dans
`moteur/aide-choix.js`, module pur testé par `test.js`.

Calculateurs équipés (26) : plaques de plâtre, béton, parpaings et briques, chape et ragréage,
parquet, plancher chauffant, puissance de chauffage, terrassement, gravier, carrelage, isolation
soufflée, pavés, terrasse, clôture, plaques de couverture, moquette, lino, plafond suspendu,
peinture, peinture de façade, enduit de façade, laine de verre, laine de roche, isolation du sol,
isolation par l’extérieur, carrelage mural.

Champs ajoutés pour l’aide : `finition` (peinture), `typePeinture` (peinture de façade),
`typeEnduit` (enduit), `isolant` (isolation du sol, informatif), `colle`, `spec`, `surfaceSpec`,
`surfaceKitSpec` (carrelage mural, avec le résultat `kitsSpec`). Deux champs changent le calcul
quand ils ne valent pas 0 : `paroi` (laines minérales : sa valeur est la résistance visée, qui
remplace `resistance`, et le résultat `resistanceVisee` l’affiche) et `isolant` (isolation par
l’extérieur : sa valeur est le λ, qui remplace `lambda`). Les seuils de `paroi` sont ceux des aides
à la rénovation : à revérifier chaque année.

Dans la phrase de recommandation, l’initiale du libellé passe en minuscule, sauf pour un sigle
(« C2 », « R = 6 »).

## Chutes selon le type de pose (revêtements en lames)

Le parquet propose cinq poses, présentées en vignettes illustrées (`presentation: 'vignettes'` sur
un champ de type choix, chaque option portant un `schema` SVG ; schémas partagés dans
`sites/travaux/partage/poses.js`) :

| Pose | Calcul des chutes |
|---|---|
| Droite, à coupe perdue | lames posées rangée par rangée sur la pièce dessinée ; la chute de fin de rangée (au moins 30 cm) démarre la suivante |
| Droite, joints réguliers | calepinage décalé d'une demi-lame (`geo.calepiner`) |
| Diagonale, bâtons rompus, point de Hongrie | forfait courant des distributeurs (15, 12 et 15 %), à vérifier : il n'existe pas de valeur normative |

Sous le résultat s'affichent le « Taux de chute appliqué » et sa « Source » (résultat au format
`texte`). Un « Taux de chute personnalisé » (réglages avancés) remplace le calcul ou le forfait, et
une réserve facultative couvre la casse. Le lambris et bardage propose les poses droite, en
diagonale et en chevrons, avec le même affichage du taux et de sa source.

## Équivalents impériaux

`unitesImperiales: true` dans `site.js` ajoute un interrupteur « ft/lb » à côté du mode nuit et un
bloc « Unités de mesure » dans le pied de page (case à cocher et choix du gallon britannique ou
américain). Le réglage est désactivé par défaut et mémorisé (`unites-imperiales-v1`).

Une fois activé, l'équivalent s'affiche entre parenthèses sous les résultats, sans rien changer aux
calculs ni aux adresses des pages :

- résultat dans une unité convertible (m, cm, mm, m², m³, kg, t, L) : « 12,5 m² (134,5 sq ft) » ;
- conditionnement, déclaré par la clé `equivalent` du résultat :

```js
{ id: 'sacsCiment', equivalent: { champ: 'poidsSacCiment', unite: 'kg' }, label: 'Sacs de ciment', format: 'nombre' }
```

affiche « 26 (26 × 35 kg = 26 × 77 lb) » : les produits restent ceux vendus en France.
`build.js` vérifie que `champ` existe et que `unite` est convertible. Toutes les conversions passent
par `equivalentImperial()` de `moteur/nombres.js`. Le PDF suit le réglage (« soit 3 880 lb » dans le
détail des lignes en unité convertible).

## Envoyer le récapitulatif

Sur la page `/devis/`, sans serveur et sans collecter d'adresse :

- **Envoyer par e-mail** ouvre la messagerie de l'appareil (`mailto:`) : sujet « Récapitulatif des
  besoins – nom du chantier », corps avec le résumé texte (lignes groupées comme à l'écran, pièce,
  quantités, montants et totaux) et le lien de partage. Au-delà de 1 800 caractères
  (`LIMITE_MAILTO`), le lien est retiré, le PDF est téléchargé et le message invite à le joindre ;
  si le résumé seul est encore trop long, il est abrégé et renvoie au PDF.
- **Partager…** n'apparaît que si l'appareil propose le partage natif (`navigator.share`, surtout
  sur mobile) : le PDF est joint quand `navigator.canShare({ files })` l'accepte, sinon le partage
  envoie le résumé et le lien.

`resumeTexte()` et `lienMailto()` sont des fonctions pures de `moteur/panier.js`, testées par `test.js`.

## Guide enrichi, maillage interne et fraîcheur

Clés facultatives d'un calculateur, rendues dans cet ordre après l'explication :

| Clé | Rendu |
|---|---|
| `erreurs` | liste de textes : « Erreurs fréquentes » |
| `conseils` | liste de textes : « Conseils de mise en œuvre » |
| `normes` | liste `{ titre, url?, description? }` : « Normes de référence », avec lien si `url` (https) |
| `lies` | liste de slugs : « Calculateurs liés » ; à défaut, les autres calculateurs du même corps de métier |
| `majLe` | `'AAAA-MM-JJ'` : date de vérification des valeurs et des prix |

`majLe` s'affiche sous le calculateur (« Valeurs vérifiées le 30 septembre 2026 »), passe dans le
JSON-LD (`dateModified`) et dans le `<lastmod>` du sitemap. Chaque page de calculateur et de corps
de métier a un fil d'Ariane visible (Accueil › Corps de métier › Calculateur) et son JSON-LD
`BreadcrumbList`.

`build.js` refuse : une liste vide ou contenant un texte vide, une norme sans titre ou avec un
lien qui n'est pas en https, un slug de `lies` inconnu ou pointant vers le calculateur lui-même,
une date `majLe` invalide ou dans le futur. Exemple complet : `peinture.js`.

## Produits d'accompagnement et articles au forfait

Une ligne de devis marquée `complement: true` (joint de carrelage, mortier, primaire…) est
précédée dans la page d'une case « Ajouter aussi les produits d'accompagnement », cochée par
défaut : l'internaute peut n'envoyer que les produits principaux.

La page récapitulatif propose « Ajouter un article sans calculateur » : désignation, corps de
métier, quantité, unité et prix, pour tout ce qui se compte à la pièce (portes, sanitaires,
appareillage).

## Avertissement normatif

Pour les lots réglementés (fondations, électricité, plomberie, gaz), ajouter au calculateur :

```js
avertissement: 'Ce calculateur estime des quantités de matériaux. Il ne dimensionne pas l’installation : la section des câbles et le nombre de circuits relèvent de la norme NF C 15-100 et d’un professionnel qualifié.',
```

Le texte s'affiche en tête de page, avant le formulaire.

## Ajouter un site

1. Copier `sites/immo/` sous un nouveau nom.
2. Modifier `site.js` : nom, domaine, thème, éditeur, hébergeur.
3. Remplacer les calculateurs.
4. `node test.js && node build.js <nom>`.

## Mise en ligne

Hébergement statique gratuit (Cloudflare Pages, Netlify, GitHub Pages avec domaine personnalisé) :

- commande de build : `node build.js <nom-du-site>`
- dossier publié : `dist/<nom-du-site>`

Les chemins sont absolus (`/assets/...`) : le site doit être servi à la racine d'un domaine ou sous-domaine.

## Emplacements publicitaires

Dans `site.js`, `monetisation.pubLaterale` et `monetisation.pubContenu` réservent les emplacements :

| Largeur d'écran | Emplacements affichés |
|---|---|
| 1 600 px et plus | bandeau gauche et bandeau droit (160 × 600), de part et d'autre du contenu |
| 1 280 à 1 600 px | bandeau droit seul ; la colonne de contenu se resserre |
| moins de 1 280 px | un emplacement dans le contenu, après l'explication du calcul (300 × 250 sur mobile, 728 × 90 sur tablette) |

Les bandeaux font partie de la mise en page : ils ne recouvrent jamais le contenu et restent
visibles au défilement. Aucune publicité sur le récapitulatif, la page d'erreur et à l'impression.
`apercu: true` affiche les emplacements vides en pointillés ; coller le code de la régie dans
`gauche`, `droite` et `code`, puis passer `apercu` à `false` avant la mise en ligne.

## Application installable (PWA)

Chaque site s'installe sur l'écran d'accueil d'un téléphone comme une application : l'icône
ouvre directement le site en plein écran. `build.js` génère pour chaque site :

- `manifest.webmanifest` : nom, icônes, couleurs et raccourcis (appui long sur l'icône sous Android),
  réglés par le bloc `application` de `site.js` ;
- `sw.js` : un service worker qui met tout le site en cache ; les calculateurs et le récapitulatif
  fonctionnent ensuite sans réseau. La version du cache change à chaque génération modifiée :
  les visiteurs sont prévenus par un bandeau et choisissent quand recharger ;
- `icones/` : copiées depuis `sites/<site>/icones/` (192 et 512 px, version masquable pour Android,
  icône Apple 180 px, favicon 32 px).

Mise à jour : quand une nouvelle version du site est mise en ligne, le nouveau service worker
se met en cache puis attend. Un bandeau « Nouvelle version disponible » propose alors
« Recharger » (ou « Plus tard ») ; la nouvelle version ne prend la main qu'à ce moment, et
l'ancien cache est supprimé. Les données locales (plan, récapitulatif, chantier, réglages)
ne sont jamais touchées. La vérification se refait quand l'appli revient au premier plan.

Le pied de page propose l'installation : bouton direct quand le navigateur le permet (Android,
Chrome, Edge), consigne « Partager › Sur l'écran d'accueil » sur iPhone. Le bloc disparaît quand
le site est déjà ouvert comme application.

Le service worker exige HTTPS en ligne (fourni d'office par Cloudflare Pages, Netlify ou GitHub
Pages) ; en local, `http://localhost` suffit.

## Régie publicitaire (Google AdSense) et consentement

Depuis le 16 janvier 2024, Google exige une plateforme de consentement (CMP) certifiée et
intégrée au TCF de l'IAB pour diffuser des annonces en Europe. Une bannière faite maison ne
suffit pas : le site utilise la CMP certifiée et gratuite fournie par AdSense.

1. Créer le compte AdSense et faire valider le site (il doit être en ligne, avec du contenu).
2. Dans `site.js`, renseigner `monetisation.adsense.client` (`ca-pub-…`) et, pour chaque
   emplacement, l'identifiant du bloc d'annonces (`data-ad-slot`) : `gauche` et `droite` en
   display 160 × 600, `contenu` en display adaptatif. Passer `apercu` à `false`.
3. Dans AdSense › Confidentialité et messages › Europe, créer et publier le message RGPD, en
   activant le bouton « Ne pas autoriser » au premier niveau : la CNIL exige que refuser soit
   aussi simple qu'accepter.
4. `node build.js` génère alors le script AdSense, les blocs d'annonces, le fichier `ads.txt`
   exigé par Google et le lien « Gérer mes choix de cookies » en pied de page.

La page `/confidentialite/` est générée pour chaque site ; elle s'adapte selon qu'une régie
est active ou non. Compléter l'adresse de contact dans `editeur.email`.

## À faire avant de monétiser

- Compléter les **mentions légales** (`editeur`, `hebergeur` dans `site.js`) : obligatoires pour un site édité à titre professionnel.
- Publicité : la régie dépose des cookies, il faut une **bannière de consentement** conforme aux règles de la CNIL, placée dans `monetisation.scriptEntete`.
- Affiliation : les liens sont affichés avec la mention « Lien partenaire » et `rel="sponsored"`. Garder cette mention.
- Déclarer les revenus générés selon ton statut.

## Accessibilité

- HTML sémantique, sans `<div>` : `fieldset`, `legend`, `dl`, `output`, `details`, `aside`, `table`.
- Plan : chaque angle est modifiable au clavier dans le tableau « Ajuster les angles au centimètre près » ; le résumé (surface, périmètre ou erreur) est annoncé aux lecteurs d'écran. Les angles font 22 px à l'écran pour être attrapés au doigt, et seul un appui sur un angle bloque le défilement tactile.
- Chaque champ a un `label`, une aide et une zone d'erreur reliées par `aria-describedby`, et `aria-invalid` en cas d'erreur.
- Seul le résultat principal est annoncé par les lecteurs d'écran à chaque saisie ; les autres ont `aria-live="off"` pour éviter les annonces en rafale.
- Saisie au format français acceptée (`1 250,50`), focus visible, lien d'évitement.

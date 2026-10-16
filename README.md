# Campus Matériel

Projet final du module **Framework JS**, réalisé avec **Angular**.

Campus Matériel est une application monopage qui permet aux étudiants de consulter le matériel
de l'établissement et de le réserver, et à un responsable de gérer le catalogue.
Il n'y a pas de serveur : les données sont enregistrées dans le `localStorage` du navigateur.

---

## Sommaire

1. [Technologies utilisées](#technologies-utilisées)
2. [Installation et lancement](#installation-et-lancement)
3. [Comptes de démonstration](#comptes-de-démonstration)
4. [Routes de l'application](#routes-de-lapplication)
5. [Organisation du code](#organisation-du-code)
6. [Choix techniques](#choix-techniques)
7. [Le trajet d'une réservation](#le-trajet-dune-réservation)
8. [Scénario de test](#scénario-de-test)
9. [Fonctionnalités réalisées](#fonctionnalités-réalisées)
10. [Limites connues](#limites-connues)

---

## Technologies utilisées

| Outil | Utilisation dans le projet |
| --- | --- |
| Angular 21 (composants standalone) | Framework de l'application |
| TypeScript (mode strict) | Langage du projet |
| Angular Router | Navigation, guards, chargement différé de l'espace de gestion |
| Signals (`signal`, `computed`, `effect`) | État partagé et réactivité |
| Reactive Forms | Formulaire de création / modification du matériel |
| RxJS + `toSignal` | Lecture des filtres dans l'URL |
| `localStorage` | Persistance du catalogue, des réservations et de la session |
| Three.js (WebGL) | Carrousel 3D du catalogue (objets en 3D), chargé à part avec `@defer` |
| CSS simple | Mise en forme, sans bibliothèque de composants |

---

## Installation et lancement

### Prérequis

- **Node.js** : version `20.19` ou plus, `22.12` ou plus, ou `24` et plus (versions demandées par Angular 21)
- **npm** (installé avec Node.js)

Vérifier les versions :

```bash
node -v
npm -v
```

### Installer le projet

```bash
git clone https://github.com/Detruni/Campus-Mat-riel.git
cd Campus-Mat-riel
npm install
```

> `npm ci` fonctionne aussi : il installe exactement les versions du fichier `package-lock.json`.

### Lancer l'application

```bash
npm start
```

Puis ouvrir **http://localhost:4200** dans le navigateur.

### Construire la version de production

```bash
npm run build
```

Les fichiers sont générés dans `dist/campus-materiel/browser`.
Pour le développement et la démonstration, `npm start` suffit.

---

## Comptes de démonstration

La connexion est **simulée** : sur la page `/login`, on clique simplement sur un compte.
Il n'y a pas de mot de passe.

| Compte | Rôle | Ce qu'il peut faire |
| --- | --- | --- |
| **Alice Martin** (id 1) | Étudiant | Consulter le catalogue, réserver, voir et annuler ses réservations |
| **Yanis Bernard** (id 2) | Étudiant | Pareil qu'Alice (sert à vérifier que chacun ne voit que ses réservations) |
| **Camille Dupont** (id 3) | Responsable | Consulter le catalogue, ajouter, modifier et supprimer du matériel |

Les comptes et le catalogue de départ viennent du fichier fourni
`src/app/data/donnees-initiales.ts` (6 équipements, 4 catégories, aucune réservation au départ).

---

## Routes de l'application

| Route | Contenu | Accès |
| --- | --- | --- |
| `/` | Redirige vers `/catalogue`, qui renvoie vers `/login` si personne n'est connecté | Selon la session |
| `/login` | Choix du compte de démonstration + réinitialisation des données | Public |
| `/catalogue` | Carrousel 3D des équipements, recherche par nom et filtre par catégorie | Utilisateur connecté |
| `/materiels/:id` | Fiche détaillée (réservation possible pour un étudiant) | Utilisateur connecté |
| `/mes-reservations` | Réservations de l'étudiant connecté | Étudiant |
| `/gestion` | Liste de gestion du catalogue (chargée à la demande) | Responsable |
| `/gestion/nouveau` | Création d'un équipement | Responsable |
| `/gestion/:id/modifier` | Modification d'un équipement | Responsable |
| `/acces-refuse` | Explication d'un refus d'accès | Public |
| toute autre adresse | Page introuvable (404) | Public |

Le catalogue accepte aussi des paramètres dans l'URL, par exemple
`/catalogue?q=portable&categorie=Informatique`.

**Règles d'accès :**

- un visiteur qui ouvre une page privée est redirigé vers `/login`, puis renvoyé vers la page
  demandée une fois connecté ;
- un utilisateur connecté sans le bon rôle est redirigé vers `/acces-refuse` ;
- les liens du menu sont adaptés au rôle, mais ce sont les **guards** qui protègent vraiment les
  pages : taper l'URL à la main est aussi contrôlé.

---

## Organisation du code

```
src/app/
├── app.ts / app.html / app.css      Composant racine : menu, bandeau d'erreur, <router-outlet>
├── app.config.ts                    provideRouter + withComponentInputBinding
├── app.routes.ts                    Déclaration des routes et des guards
│
├── data/
│   └── donnees-initiales.ts         Données et types fournis pour le projet
│
├── services/                        Logique et état partagé (pas d'affichage)
│   ├── stockage.service.ts          Lecture / écriture du localStorage avec gestion des erreurs
│   ├── session.service.ts           Compte connecté, rôle, connexion et déconnexion
│   ├── catalogue.service.ts         Liste du matériel : ajouter, modifier, supprimer
│   ├── reservation.service.ts       Réservations : réserver, annuler, disponibilité
│   └── resultat.ts                  Type { ok, message } renvoyé par les actions
│
├── guards/
│   └── acces.guard.ts               connexionGuard et roleGuard('student' | 'manager')
│
├── components/                      Composants réutilisables
│   ├── carrousel-3d/                Carrousel du catalogue (input / output)
│   │   ├── carrousel-3d.ts          Composant Angular : capsule, boutons, clavier
│   │   ├── scene-carrousel.ts       Scène Three.js : pochettes, animation, glisser
│   │   └── modeles-3d.ts            Objets en 3D (ordinateur, projecteur, appareil photo...)
│   └── badge-disponibilite/         Pastille « Disponible » / « Réservé »
│
└── pages/                           Un dossier par page
    ├── connexion/
    ├── catalogue/
    ├── fiche-materiel/
    ├── mes-reservations/
    ├── acces-refuse/
    ├── page-introuvable/
    └── gestion/                     Chargé à la demande (lazy loading)
        ├── gestion.routes.ts
        ├── liste-gestion/
        └── formulaire-equipement/   Formulaire commun création / modification + validateurs
```

---

## Choix techniques

### État partagé avec des services et des signals

La session, le catalogue et les réservations sont chacun gérés par un service `providedIn: 'root'`.
Tous les composants utilisent donc **la même instance**, et il n'y a pas de copies de liste qui
pourraient se contredire.

Chaque service garde son état dans un `signal` privé et expose une version en lecture seule
(`asReadonly()`). Les modifications passent toujours par les méthodes du service
(`reserver()`, `annuler()`, `ajouter()`...). Les listes sont mises à jour sans les modifier sur place
(`[...liste, nouvel]`, `filter`, `map`) pour que le signal prévienne bien les vues.

### Disponibilité calculée

Il n'existe **aucun champ `disponible`** sur un équipement. Le service des réservations calcule
un `computed` avec les identifiants des équipements réservés :

```ts
readonly idsReserves = computed(() => new Set(this.etat().map(r => r.equipementId)));
```

Un équipement est disponible s'il n'est pas dans cet ensemble. Comme tout est déduit des
réservations actives, la disponibilité ne peut pas être fausse.

### Persistance dans le localStorage

| Clé | Contenu |
| --- | --- |
| `campus-materiel.equipements` | Le catalogue |
| `campus-materiel.reservations` | Les réservations actives |
| `campus-materiel.session` | L'id du compte connecté (supprimé à la déconnexion) |

- Au démarrage, chaque service lit sa clé. **Si la clé n'existe pas**, on part d'une copie
  (`structuredClone`) des données initiales. Un tableau vide enregistré est gardé tel quel.
- Les données lues sont vérifiées (structure et types). Si elles sont abîmées ou illisibles, un
  message s'affiche et les données de départ sont utilisées.
- Un `effect()` dans le constructeur de chaque service enregistre automatiquement l'état à chaque
  changement. Si l'écriture échoue (stockage plein ou bloqué), un bandeau rouge prévient l'utilisateur.

### Navigation et protections

- `routerLinkActive` + `ariaCurrentWhenActive` signalent le lien de la page courante.
- `connexionGuard` vérifie qu'un compte est connecté ; `roleGuard('student')` et
  `roleGuard('manager')` vérifient en plus le rôle. Ils renvoient `true` ou une redirection (`UrlTree`).
- À la déconnexion, le service redirige lui-même vers `/login`, car un guard ne se relance pas
  tout seul quand la session change.
- L'espace `/gestion` est chargé **à la demande** avec `loadChildren`. On peut le vérifier dans
  l'onglet *Réseau* des outils de développement : un fichier `chunk-....js` (gestion-routes) n'est
  téléchargé qu'à la première ouverture de la gestion.
- `withComponentInputBinding()` fait arriver le paramètre `:id` directement dans l'input `id` des
  composants. Le paramètre est du texte : il est vérifié avant d'être utilisé (`/materiels/abc`
  affiche « Équipement introuvable »).

### Communication entre composants

`Carrousel3d` reçoit la liste des équipements et les réservations avec `input()` et **ne réserve
rien lui-même** : quand on clique sur « Réserver », il émet l'id avec `output()`. C'est la page
`Catalogue` (le parent) qui appelle le service et affiche le message.

```html
<app-carrousel-3d
  [equipements]="equipementsVisibles()"
  [reserves]="reservations.idsReserves()"
  [mesReservations]="mesIds()"
  [peutReserver]="session.estEtudiant()"
  (reserver)="reserver($event)"
/>
```

### Le catalogue en carrousel 3D

La page Catalogue présente les équipements dans un carrousel inspiré des pochettes d'albums :

- chaque équipement est un **objet en 3D** (ordinateur portable, vidéoprojecteur, appareil photo,
  microphone, enceinte) posé devant une pochette à la couleur de sa catégorie, avec une pastille
  portant son nom et une étiquette « Disponible » ou « Réservé » ;
- l'équipement du milieu est de face et tourne doucement, les voisins sont inclinés sur les côtés ;
- le fond change de couleur selon la catégorie de l'équipement affiché ;
- sous la pochette, une **capsule** affiche le nom, la catégorie, la localisation, la disponibilité
  et les boutons **Voir la fiche** et **Réserver** (pour les étudiants).

On change d'équipement avec les flèches de la capsule, les flèches gauche / droite du clavier
(quand le carrousel a le focus), en glissant la souris ou le doigt, ou en cliquant sur une pochette
voisine. `Entrée` ou un double-clic sur la pochette du milieu ouvre la fiche.

La recherche et le filtre s'appliquent au carrousel. Les objets 3D sont construits avec des formes
simples dans `modeles-3d.ts` (aucun fichier 3D à télécharger). Grâce à `@defer`, le carrousel et
Three.js sont téléchargés à part : le reste de l'application ne s'en trouve pas alourdi.

Le canvas 3D est décoratif (`aria-hidden`) : toutes les informations et actions sont de vrais
textes, liens et boutons dans la capsule, annoncés aux lecteurs d'écran (`aria-live`). Si le
système demande de réduire les animations, le carrousel change d'équipement sans animation.

### Formulaire réactif partagé

`FormulaireEquipement` sert à la fois pour `/gestion/nouveau` et `/gestion/:id/modifier` :
sans `id` on crée, avec un `id` on pré-remplit le formulaire (`setValue`) puis on modifie.

| Champ | Règle |
| --- | --- |
| Nom | Obligatoire, au moins 3 caractères |
| Catégorie | Obligatoire (liste des catégories fournies) |
| Description | Obligatoire, au moins 10 caractères |
| Localisation | Obligatoire |

Des validateurs personnalisés (`validateurs.ts`) ne comptent pas les espaces au début et à la fin :
un nom composé uniquement d'espaces est refusé. Les messages apparaissent quand on quitte un champ
ou quand on essaie d'enregistrer (`markAllAsTouched`), et **les valeurs saisies restent dans le
formulaire** en cas d'erreur.

---

## Le trajet d'une réservation

Exemple : Alice clique sur « Réserver » dans la capsule du carrousel, sur l'ordinateur portable 01.

1. **Clic** : `Carrousel3d` émet l'id `101` avec son `output` `reserver`.
2. **Le parent reçoit la demande** : `Catalogue.reserver(101)` appelle `ReservationService.reserver(101)`.
3. **Contrôles** dans le service :
   - un étudiant est bien connecté ;
   - l'équipement n'a pas déjà une réservation active (`estDisponible`).
   Si un contrôle échoue, le service renvoie `{ ok: false, message }` et rien n'est modifié.
4. **Mise à jour de l'état** : une réservation `{ id: crypto.randomUUID(), equipementId: 101, etudiantId: 1 }`
   est ajoutée au signal des réservations.
5. **Sauvegarde** : l'`effect()` du service voit le changement et écrit la liste dans le `localStorage`.
6. **Actualisation des vues** : les `computed` qui dépendent des réservations sont recalculés
   (`idsReserves`, `mesReservations`). La pochette et la capsule passent en « Réservé », la fiche détaillée et la page
   « Mes réservations » sont à jour, sans rechargement. Un message de confirmation s'affiche.

L'annulation suit le même chemin : on vérifie que la réservation appartient bien à l'étudiant
connecté, on la retire du signal, l'`effect` sauvegarde et l'équipement redevient disponible tout de suite.

---

## Scénario de test

Pour repartir d'une situation propre, cliquer sur **« Réinitialiser les données de démonstration »**
en bas de la page `/login` (ou vider le `localStorage` dans les outils de développement).

### Parcours principal

| # | Action | Résultat attendu |
| --- | --- | --- |
| 1 | Sans être connecté, ouvrir directement `http://localhost:4200/mes-reservations` | La page de connexion s'affiche (l'URL contient `returnUrl=/mes-reservations`) |
| 2 | Choisir **Alice Martin**, aller dans le **Catalogue** et cliquer sur **Réserver** dans la capsule (« 01. ordinateur portable 01 ») | Après la connexion, on arrive directement sur « Mes réservations » (la page demandée). Dans le catalogue : message « Réservation enregistrée. », l'étiquette de la pochette passe à « Réservé » et la capsule affiche « Réservé par vous » |
| 3 | Ouvrir **Mes réservations**, puis recharger la page (F5) | L'ordinateur portable 01 est listé avec un lien vers sa fiche et un bouton Annuler. Il est toujours là après le rechargement, et Alice est toujours connectée |
| 4 | **Se déconnecter**, se connecter avec **Yanis Bernard**, ouvrir « Mes réservations » | Aucune réservation : Yanis ne voit pas celle d'Alice |
| 4 bis | Ouvrir la fiche `/materiels/101` | Pastille « Réservé » et message : l'équipement est déjà réservé par un autre étudiant, pas de bouton Réserver. Dans le catalogue, la capsule indique « Déjà réservé » à la place du bouton Réserver |
| 5 | Se déconnecter, se connecter avec **Camille Dupont**, aller dans **Gestion**, cliquer sur **Modifier** pour un équipement | Le formulaire est pré-rempli. Vider le nom et cliquer sur Enregistrer : message d'erreur, les autres champs gardent leurs valeurs. Corriger puis enregistrer : retour à la liste avec « … a été modifié. » |
| 6 | Dans Gestion, cliquer sur **Supprimer** pour « Ordinateur portable 01 » | Suppression refusée avec l'explication : l'équipement est réservé, l'étudiant doit d'abord annuler |
| 7 | Se reconnecter avec **Alice Martin**, ouvrir « Mes réservations » et cliquer sur **Annuler** | Message « Réservation annulée… », la liste est vide et l'ordinateur 01 est de nouveau « Disponible » dans le catalogue |
| 8a | Ouvrir une URL inconnue, par exemple `/nimporte-quoi` | Page « Page introuvable » |
| 8b | Ouvrir `/materiels/999` (ou `/materiels/abc`) | Message « Équipement introuvable » |
| 8c | Connecté avec Alice (étudiante), ouvrir `/gestion` à la main | Page « Accès refusé » qui explique que le compte n'a pas les droits |

### Vérifications complémentaires

- **Recherche sans résultat** : taper `zzz` dans la recherche du catalogue : message « Aucun
  équipement ne correspond à vos critères » et bouton pour effacer les filtres.
- **Filtre conservé** : filtrer par « Audio » puis recharger la page : le filtre est toujours appliqué
  (il est dans l'URL).
- **Compteur par catégorie** : la liste déroulante affiche le nombre d'équipements de chaque catégorie.
- **Création** : en tant que Camille, « Ajouter un équipement », laisser des champs vides puis
  enregistrer : chaque champ affiche son message. Remplir correctement : le nouvel équipement
  apparaît avec un nouvel identifiant (107 pour le premier ajout).
- **Responsable sur Mes réservations** : avec Camille, ouvrir `/mes-reservations` → « Accès refusé ».
- **Déconnexion** : se déconnecter depuis une page privée ramène sur `/login`, et le bouton
  Précédent ne permet plus d'afficher la page privée (le guard renvoie vers la connexion).
- **Erreur de stockage** : dans la console du navigateur, taper
  `localStorage.setItem('campus-materiel.reservations', '{oops')` puis recharger :
  un bandeau rouge indique que les données n'ont pas pu être lues et les données de départ sont utilisées.
- **Chargement différé** : ouvrir l'onglet Réseau (filtre JS), se connecter avec Camille et cliquer
  sur Gestion : un nouveau fichier JavaScript est téléchargé à ce moment-là.

---

## Fonctionnalités réalisées

**Socle demandé**

- [x] Connexion simulée avec 2 étudiants et 1 responsable, session conservée au rechargement
- [x] Catalogue avec recherche par nom, filtre par catégorie, disponibilité et message si aucun résultat
- [x] Fiche détaillée avec gestion d'un identifiant inexistant
- [x] Réservation (une seule réservation active par équipement) et annulation
- [x] Page « Mes réservations » avec lien vers la fiche et bouton d'annulation
- [x] Disponibilité calculée à partir des réservations (aucun champ `disponible`)
- [x] Espace responsable : création, modification, suppression avec confirmation
- [x] Suppression refusée et expliquée pour un équipement réservé
- [x] Un seul formulaire réactif pour la création et la modification, avec messages de validation
- [x] Guards sur les routes privées, page d'accès refusé, page 404
- [x] Chargement différé de l'espace de gestion
- [x] Liens actifs dans le menu
- [x] Communication parent / enfant (`input` / `output`) avec le carrousel
- [x] Catalogue présenté en carrousel 3D (Three.js), chargé à la demande avec `@defer`
- [x] Persistance dans le `localStorage`, données initiales chargées uniquement s'il n'y a rien d'enregistré
- [x] Messages pour : liste vide, recherche sans résultat, équipement inexistant, accès refusé,
      saisie invalide, équipement déjà réservé, erreur de lecture ou d'écriture du stockage

**Extensions facultatives**

- [x] Filtres du catalogue conservés dans l'URL
- [x] Retour à la page demandée après la connexion (seulement vers des pages connues de l'application)
- [x] Compteur d'équipements par catégorie
- [x] Réinitialisation des données de démonstration

**Accessibilité de base** : labels reliés aux champs, vrais liens pour naviguer et boutons pour
les actions, focus visible au clavier, messages annoncés (`role="status"`, `aria-live`),
champs en erreur signalés avec `aria-invalid`, titre d'onglet différent pour chaque page.

---

## Limites connues

- **Ce n'est pas une vraie sécurité** : la connexion est simulée et les guards ne font que contrôler
  la navigation dans le navigateur. N'importe qui peut modifier le `localStorage`. Dans une vraie
  application, les droits seraient vérifiés par un serveur.
- **Pas de synchronisation** : les données restent dans le navigateur utilisé. Si l'application est
  ouverte dans deux onglets, une modification faite dans l'un n'apparaît dans l'autre qu'après un
  rechargement.
- **Identifiants des nouveaux équipements** : l'id est le plus grand id existant + 1. Si on supprime
  le dernier équipement ajouté, son numéro peut être réutilisé par le suivant.
- **Pas de dates** : comme demandé dans le sujet, une réservation n'a ni date de début ni date de
  fin, elle dure jusqu'à son annulation.
- **Déploiement** : une fois le build mis sur un serveur, celui-ci doit renvoyer `index.html` pour
  toutes les routes, sinon un rechargement sur `/catalogue` par exemple donnera une erreur 404 du serveur.
- **Pas de tests automatisés** : les vérifications se font avec le scénario ci-dessus.
- **Carrousel 3D** : il demande un navigateur compatible WebGL et peut être lent sur un ordinateur
  sans carte graphique. Sans WebGL, la 3D n'est pas affichée mais la capsule (nom, disponibilité,
  boutons précédent / suivant, Voir la fiche, Réserver) reste utilisable.

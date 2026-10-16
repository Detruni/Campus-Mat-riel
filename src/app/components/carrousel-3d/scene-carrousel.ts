import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Scène Three.js du carrousel : une "pochette" par élément avec un objet en 3D devant.
 * La classe ne connaît pas Angular ni les équipements : on lui donne des éléments déjà
 * prêts (textes, couleurs, modèle 3D) et elle prévient quand l'utilisateur change d'élément.
 */

export interface ElementCarrousel {
  cle: number;
  // Nom lu par les lecteurs d'écran (boutons de navigation)
  libelle: string;
  // Textes de la pastille ronde collée sur la pochette
  pastille: string;
  petitTexte: string;
  couleur: string;
  couleurPastille: string;
  // Étiquette rectangulaire en bas à droite (disponible, réservé...)
  etiquette?: { texte: string; couleur: string };
  // Couleurs du fond de la page quand l'élément est au centre
  fond: [string, string];
  modele: () => THREE.Group;
}

export interface RappelsCarrousel {
  // Demande de changement d'élément (clic sur une pochette voisine, glisser)
  aller(indice: number): void;
  // Double-clic sur la pochette du centre
  ouvrir(indice: number): void;
}

const TAILLE_POCHETTE = 2;
// Distance entre deux pochettes : assez grande pour qu'elles ne se chevauchent pas
const ECART = 3.1;
const ECHELLE_OBJET = 3;
// Après ce délai sans action (en ms), l'animation s'arrête pour économiser la batterie
const DELAI_REPOS = 8000;

interface Pochette {
  groupe: THREE.Group;
  modele: THREE.Group;
  // Petite inclinaison propre à chaque pochette, pour un rendu moins "rangé"
  penche: number;
}

export class SceneCarrousel {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  private readonly horloge = new THREE.Timer();
  private readonly raycaster = new THREE.Raycaster();
  private readonly environnement: THREE.Texture;
  private readonly observateur: ResizeObserver;
  private readonly nettoyages: (() => void)[] = [];
  private readonly sansAnimation = matchMedia('(prefers-reduced-motion: reduce)').matches;

  private pochettes: Pochette[] = [];
  private indice = 0;
  // Position affichée, qui rejoint l'indice en douceur (c'est elle qui crée l'animation)
  private position = 0;
  private glisse: { x: number; depart: number; deplace: boolean } | null = null;
  // Défilement à la molette : quantité accumulée et moment du dernier changement d'élément
  private accumulation = 0;
  private dernierPas = 0;
  private minuteurDefilement = 0;
  // Vitesse de déplacement lissée : sert à pencher les pochettes pendant le mouvement
  private vitesse = 0;
  private positionPrecedente = 0;

  // Zone libre de l'écran (en pixels, depuis le haut du canvas) entre les textes du haut et la capsule
  private zoneLibre = { haut: 0, bas: 0 };
  // Position visée par la caméra : elle la rejoint en douceur quand la zone libre change
  private readonly cameraVisee = new THREE.Vector3(0, 0, 8.8);

  // Mise en pause : moment de la dernière action et visibilité du canvas à l'écran
  private derniereActivite = performance.now();
  private visible = true;
  private readonly observateurVisibilite: IntersectionObserver;

  constructor(private readonly conteneur: HTMLElement, private readonly rappels: RappelsCarrousel) {
    // Lève une erreur si WebGL n'est pas disponible : le composant affiche alors la liste
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral garde des couleurs vives (ACES a tendance à les délaver)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const canvas = this.renderer.domElement;
    canvas.classList.add('toile-carrousel');
    // Le canvas est décoratif : les informations sont données en texte par le composant
    canvas.setAttribute('aria-hidden', 'true');
    conteneur.appendChild(canvas);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.environnement = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.environnement;
    this.scene.environmentIntensity = 0.35;

    this.scene.add(new THREE.HemisphereLight('#ffffff', '#c9b8ff', 0.9));
    const lumiere = new THREE.DirectionalLight('#ffffff', 1.8);
    lumiere.position.set(2.5, 4, 6);
    lumiere.castShadow = true;
    lumiere.shadow.mapSize.set(1024, 1024);
    lumiere.shadow.camera.left = -8;
    lumiere.shadow.camera.right = 8;
    lumiere.shadow.camera.top = 4;
    lumiere.shadow.camera.bottom = -4;
    lumiere.shadow.normalBias = 0.02;
    this.scene.add(lumiere);

    // La caméra est placée un peu haut : la pochette descend entre les filtres et la capsule
    this.camera.position.set(0, 0, 8.8);

    this.brancherEvenements(canvas);
    // Inutile de dessiner la scène quand elle est hors de l'écran (page défilée sur mobile)
    this.observateurVisibilite = new IntersectionObserver(([entree]) => {
      this.visible = entree.isIntersecting;
      this.reveiller();
    });
    this.observateurVisibilite.observe(conteneur);

    this.observateur = new ResizeObserver(() => this.redimensionner());
    this.observateur.observe(conteneur);
    this.redimensionner();

    this.renderer.setAnimationLoop(() => this.image());
  }

  /** Reconstruit les pochettes (appelé quand la liste filtrée ou les disponibilités changent). */
  // Toute action relance l'animation si elle était en pause
  reveiller(): void {
    this.derniereActivite = performance.now();
  }

  afficher(elements: ElementCarrousel[]): void {
    this.reveiller();
    for (const pochette of this.pochettes) {
      this.scene.remove(pochette.groupe);
      liberer(pochette.groupe);
    }
    this.pochettes = elements.map((element, i) => this.creerPochette(element, i));
    this.pochettes.forEach(p => this.scene.add(p.groupe));
    // Si la liste a raccourci, on se place sur le dernier élément qui existe
    this.allerA(Math.min(this.indice, Math.max(elements.length - 1, 0)), true);
  }

  /**
   * Défilement à la molette. Un cran de molette (ou un geste suffisant sur un pavé tactile)
   * fait passer à l'élément suivant ; pendant le geste, les pochettes s'amorcent déjà
   * un peu dans le sens du défilement.
   * Renvoie false si on est déjà au bout (la page peut alors défiler normalement).
   */
  defiler(delta: number): boolean {
    this.reveiller();
    const max = this.pochettes.length - 1;
    if ((delta < 0 && this.indice <= 0) || (delta > 0 && this.indice >= max)) return false;

    this.accumulation += delta;
    clearTimeout(this.minuteurDefilement);
    this.minuteurDefilement = window.setTimeout(() => (this.accumulation = 0), 200);

    const maintenant = performance.now();
    if (Math.abs(this.accumulation) >= 60 && maintenant - this.dernierPas > 220) {
      this.dernierPas = maintenant;
      const pas = Math.sign(this.accumulation);
      this.accumulation = 0;
      this.rappels.aller(THREE.MathUtils.clamp(this.indice + pas, 0, max));
    }
    return true;
  }

  allerA(indice: number, immediat = false): void {
    this.reveiller();
    this.indice = indice;
    if (immediat || this.sansAnimation) this.position = indice;
  }

  detruire(): void {
    this.renderer.setAnimationLoop(null);
    clearTimeout(this.minuteurDefilement);
    this.observateur.disconnect();
    this.observateurVisibilite.disconnect();
    this.nettoyages.forEach(nettoyer => nettoyer());
    liberer(this.scene);
    this.environnement.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------------------------------------------------------------------------

  private creerPochette(element: ElementCarrousel, i: number): Pochette {
    const { couleur, couleurPastille } = element;
    const groupe = new THREE.Group();

    // La pochette : un carré épais avec un vernis brillant, comme un vinyle sous plastique
    const carre = new THREE.Mesh(
      new RoundedBoxGeometry(TAILLE_POCHETTE, TAILLE_POCHETTE, 0.06, 4, 0.03),
      new THREE.MeshPhysicalMaterial({ color: couleur, roughness: 0.7, clearcoat: 0.6, clearcoatRoughness: 0.25 })
    );
    carre.receiveShadow = true;
    groupe.add(carre);

    // Grand cercle clair au centre, derrière l'objet
    const disque = new THREE.Mesh(
      new THREE.CircleGeometry(0.78, 64),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(couleur).lerp(new THREE.Color('#ffffff'), 0.4), roughness: 0.8 })
    );
    disque.position.set(0, -0.05, 0.032);
    disque.receiveShadow = true;
    groupe.add(disque);

    // Pastille ronde façon autocollant
    const pastille = new THREE.Mesh(
      new THREE.CircleGeometry(0.36, 48),
      new THREE.MeshBasicMaterial({ map: texturePastille(element, couleurPastille), toneMapped: false })
    );
    pastille.position.set(-0.56, 0.56, 0.036);
    pastille.rotation.z = 0.12;
    groupe.add(pastille);

    if (element.etiquette) {
      const etiquette = new THREE.Mesh(
        new THREE.PlaneGeometry(0.62, 0.2),
        new THREE.MeshBasicMaterial({ map: textureEtiquette(element.etiquette.texte, element.etiquette.couleur), toneMapped: false })
      );
      // En haut à droite : l'objet qui tourne devant ne la cache jamais
      etiquette.position.set(0.56, 0.78, 0.036);
      groupe.add(etiquette);
    }

    // L'objet en 3D, posé devant la pochette
    const modele = element.modele();
    modele.scale.setScalar(ECHELLE_OBJET);
    // On avance l'objet d'au moins son "rayon" (vu de dessus) : en tournant sur lui-même,
    // il ne peut ainsi jamais rentrer dans la pochette.
    const boite = new THREE.Box3().setFromObject(modele);
    const rayon = Math.hypot(
      Math.max(Math.abs(boite.min.x), Math.abs(boite.max.x)),
      Math.max(Math.abs(boite.min.z), Math.abs(boite.max.z))
    );
    modele.position.set(0, -0.62, rayon + 0.08);
    modele.traverse(objet => {
      if (objet instanceof THREE.Mesh) objet.castShadow = true;
    });
    groupe.add(modele);

    groupe.userData['indice'] = i;
    groupe.traverse(objet => (objet.userData['indice'] = i));

    return { groupe, modele, penche: ((element.cle * 37) % 9 - 4) * 0.012 };
  }

  private image(): void {
    this.horloge.update();
    const dt = Math.min(this.horloge.getDelta(), 0.1);
    const temps = this.horloge.getElapsed();

    // Après quelques secondes sans action, la rotation ralentit doucement jusqu'à s'arrêter,
    // puis on ne redessine plus rien tant que la scène est immobile (économie de batterie).
    const inactif = performance.now() - this.derniereActivite;
    const entrain = this.sansAnimation ? 0 : THREE.MathUtils.clamp((DELAI_REPOS - inactif) / 1500, 0, 1);
    if (!this.visible || (entrain === 0 && this.estImmobile())) return;

    // La position rejoint l'indice demandé en ralentissant à l'arrivée
    if (!this.glisse) {
      // Le début d'un geste de molette décale déjà légèrement les pochettes
      const amorce = this.sansAnimation ? 0 : THREE.MathUtils.clamp(this.accumulation / 300, -0.2, 0.2);
      this.position += (this.indice + amorce - this.position) * Math.min(1, dt * 6);
    }

    // Vitesse du mouvement, lissée pour éviter les à-coups
    if (dt > 0) {
      const instantanee = (this.position - this.positionPrecedente) / dt;
      this.vitesse += (instantanee - this.vitesse) * Math.min(1, dt * 8);
    }
    this.positionPrecedente = this.position;
    const elan = this.sansAnimation ? 0 : THREE.MathUtils.clamp(this.vitesse, -4, 4);

    this.pochettes.forEach((pochette, i) => {
      const d = i - this.position;
      const distance = Math.abs(d);
      const g = pochette.groupe;
      g.visible = distance < 3.5;

      // Les voisines s'écartent, reculent, rapetissent un peu et tournent vers le centre
      const proximite = Math.min(distance, 1);
      g.position.x = d * ECART;
      g.position.z = -Math.min(distance, 3) * 1.6;
      g.position.y = Math.sin(temps * 1.2 + i) * 0.03 * entrain;
      g.scale.setScalar(1 - proximite * 0.16);
      // Pendant le mouvement les pochettes penchent dans le sens du déplacement, comme des cartes qu'on fait glisser
      g.rotation.y = THREE.MathUtils.clamp(-d * 0.55, -0.9, 0.9) + elan * 0.09;
      g.rotation.x = Math.abs(elan) * 0.025;
      g.rotation.z = pochette.penche * proximite - elan * 0.02;

      // L'objet du centre tourne doucement sur lui-même
      const auCentre = distance < 0.5;
      if (auCentre && !this.sansAnimation) {
        pochette.modele.rotation.y += dt * 0.7 * entrain;
      } else {
        // Les autres reviennent doucement de trois quarts
        let angle = pochette.modele.rotation.y % (Math.PI * 2);
        if (angle > Math.PI) angle -= Math.PI * 2;
        pochette.modele.rotation.y = angle + (0.35 - angle) * Math.min(1, dt * 3);
      }
    });

    // La caméra rejoint son cadrage en douceur (par exemple quand un message apparaît en haut)
    if (this.sansAnimation) this.camera.position.copy(this.cameraVisee);
    else this.camera.position.lerp(this.cameraVisee, Math.min(1, dt * 5));

    this.renderer.render(this.scene, this.camera);
  }

  // Plus rien ne bouge : pochettes à leur place, caméra cadrée, aucun geste en cours
  private estImmobile(): boolean {
    return !this.glisse
      && this.accumulation === 0
      && Math.abs(this.indice - this.position) < 0.002
      && Math.abs(this.vitesse) < 0.01
      && this.camera.position.distanceTo(this.cameraVisee) < 0.002;
  }

  private brancherEvenements(canvas: HTMLCanvasElement): void {
    const ecouter = <K extends keyof HTMLElementEventMap>(type: K, action: (e: HTMLElementEventMap[K]) => void) => {
      canvas.addEventListener(type, action);
      this.nettoyages.push(() => canvas.removeEventListener(type, action));
    };

    ecouter('pointerdown', e => {
      this.reveiller();
      canvas.setPointerCapture(e.pointerId);
      this.glisse = { x: e.clientX, depart: this.position, deplace: false };
    });

    ecouter('pointermove', e => {
      this.reveiller();
      if (!this.glisse) {
        canvas.style.cursor = this.pochetteSous(e) !== null ? 'pointer' : 'grab';
        return;
      }
      const dx = e.clientX - this.glisse.x;
      if (Math.abs(dx) > 5) this.glisse.deplace = true;
      // On suit le doigt / la souris pendant le glisser
      const max = Math.max(this.pochettes.length - 1, 0);
      this.position = THREE.MathUtils.clamp(this.glisse.depart - dx / 260, -0.3, max + 0.3);
    });

    ecouter('pointerup', e => {
      const glisse = this.glisse;
      this.glisse = null;
      if (!glisse) return;

      if (glisse.deplace) {
        // À la fin du glisser, on s'arrête sur la pochette la plus proche
        const max = Math.max(this.pochettes.length - 1, 0);
        this.rappels.aller(THREE.MathUtils.clamp(Math.round(this.position), 0, max));
        return;
      }
      const indice = this.pochetteSous(e);
      if (indice !== null && indice !== this.indice) this.rappels.aller(indice);
    });

    ecouter('dblclick', e => {
      const indice = this.pochetteSous(e);
      if (indice !== null && indice === this.indice) this.rappels.ouvrir(indice);
    });
  }

  private pochetteSous(e: MouseEvent): number | null {
    const zone = this.renderer.domElement.getBoundingClientRect();
    const pointeur = new THREE.Vector2(
      ((e.clientX - zone.left) / zone.width) * 2 - 1,
      -((e.clientY - zone.top) / zone.height) * 2 + 1
    );
    this.raycaster.setFromCamera(pointeur, this.camera);
    const visibles = this.pochettes.filter(p => p.groupe.visible).map(p => p.groupe);
    const touche = this.raycaster.intersectObjects(visibles, true)[0];
    return touche ? (touche.object.userData['indice'] as number) : null;
  }

  /**
   * La page indique où se trouve l'espace libre (entre la zone du haut et la capsule).
   * La caméra se recule et se décale pour que la pochette du centre tienne dans cet espace.
   */
  cadrer(haut: number, bas: number): void {
    this.reveiller();
    this.zoneLibre = { haut, bas };
    this.calculerCamera();
  }

  private redimensionner(): void {
    const largeur = this.conteneur.clientWidth;
    const hauteur = this.conteneur.clientHeight;
    if (largeur === 0 || hauteur === 0) return;
    this.renderer.setSize(largeur, hauteur);
    this.camera.aspect = largeur / hauteur;
    this.camera.updateProjectionMatrix();
    this.calculerCamera();
    // Le canvas est effacé quand il change de taille : il faut le redessiner
    this.reveiller();
  }

  private calculerCamera(): void {
    const hauteur = this.conteneur.clientHeight;
    if (hauteur === 0) return;

    // Sans information (ou zone trop petite), on utilise toute la hauteur du canvas
    let { haut, bas } = this.zoneLibre;
    if (bas - haut < hauteur * 0.25) {
      haut = 0;
      bas = hauteur;
    }

    // La pochette occupe 85 % de la zone libre, sans dépasser 55 % de l'écran
    // (75 % quand la scène est seule, comme sur mobile, où les textes sont au-dessus et en dessous)
    const sceneSeule = haut === 0 && bas === hauteur;
    const fraction = Math.min(((bas - haut) * 0.85) / hauteur, sceneSeule ? 0.75 : 0.55);
    const tangente = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    // Recul nécessaire pour que la pochette prenne cette fraction de la hauteur
    const recul = TAILLE_POCHETTE / (fraction * 2 * tangente);

    // Décalage vertical : le centre de la zone libre n'est pas forcément le centre de l'écran
    const unitesParPixel = (2 * recul * tangente) / hauteur;
    const ecartPixels = (haut + bas) / 2 - hauteur / 2;
    this.cameraVisee.set(0, ecartPixels * unitesParPixel, recul);
  }
}

// -----------------------------------------------------------------------------

function textureCanvas(largeur: number, hauteur: number, dessin: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  dessin(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// Coupe le nom en lignes qui tiennent dans la pastille
function decouper(ctx: CanvasRenderingContext2D, texte: string, largeurMax: number): string[] {
  const lignes: string[] = [];
  let ligne = '';
  for (const mot of texte.split(' ')) {
    const essai = ligne ? `${ligne} ${mot}` : mot;
    if (ctx.measureText(essai).width > largeurMax && ligne) {
      lignes.push(ligne);
      ligne = mot;
    } else {
      ligne = essai;
    }
  }
  if (ligne) lignes.push(ligne);
  return lignes.slice(0, 3);
}

function texturePastille(element: ElementCarrousel, couleur: string): THREE.CanvasTexture {
  return textureCanvas(512, 512, ctx => {
    ctx.fillStyle = couleur;
    ctx.beginPath();
    ctx.arc(256, 256, 256, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.font = '800 64px "Libre Franklin", system-ui, sans-serif';
    const lignes = decouper(ctx, element.pastille.toLowerCase(), 380);
    const debut = 256 - (lignes.length - 1) * 34;
    lignes.forEach((ligne, i) => ctx.fillText(ligne, 256, debut + i * 68));

    ctx.font = '600 34px "Libre Franklin", system-ui, sans-serif';
    ctx.fillText(element.petitTexte.toLowerCase(), 256, 430);
  });
}

function textureEtiquette(texte: string, couleur: string): THREE.CanvasTexture {
  return textureCanvas(310, 100, ctx => {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 310, 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 298, 88);
    ctx.fillStyle = couleur;
    ctx.fillRect(12, 12, 286, 76);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 40px "Libre Franklin", system-ui, sans-serif';
    ctx.fillText(texte.toUpperCase(), 155, 52);
  });
}

function liberer(racine: THREE.Object3D): void {
  racine.traverse(objet => {
    if (!(objet instanceof THREE.Mesh)) return;
    objet.geometry.dispose();
    const matieres = Array.isArray(objet.material) ? objet.material : [objet.material];
    for (const matiere of matieres) {
      for (const valeur of Object.values(matiere)) {
        if (valeur instanceof THREE.Texture) valeur.dispose();
      }
      matiere.dispose();
    }
  });
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Categorie } from '../../data/donnees-initiales';
import { creerModele } from './modeles-3d';

/**
 * Scène Three.js du carrousel : une "pochette" par équipement avec l'objet en 3D devant.
 * La classe ne connaît pas Angular : le composant lui donne la liste des éléments et
 * l'indice à afficher, et elle le prévient quand l'utilisateur change d'élément.
 */

export interface ElementCarrousel {
  id: number;
  nom: string;
  categorie: Categorie;
  disponible: boolean;
}

export interface RappelsCarrousel {
  // Demande de changement d'élément (clic sur une pochette voisine, glisser, flèches)
  aller(indice: number): void;
  ouvrir(id: number): void;
}

// Couleurs des pochettes par catégorie : [fond de la pochette, pastille]
export const COULEURS_CATEGORIES: Record<Categorie, [string, string]> = {
  Informatique: ['#6f6cf5', '#ffd23f'],
  Projection: ['#ff7a1a', '#f05a9d'],
  Photo: ['#f5b400', '#ef3e36'],
  Audio: ['#39b85a', '#5b5bf0']
};

const TAILLE_POCHETTE = 2;
const ECART = 2.35;
const ECHELLE_OBJET = 3;

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
  private elements: ElementCarrousel[] = [];
  private indice = 0;
  // Position affichée, qui rejoint l'indice en douceur (c'est elle qui crée l'animation)
  private position = 0;
  private glisse: { x: number; depart: number; deplace: boolean } | null = null;

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

    this.camera.position.set(0, 0.15, 7.2);

    this.brancherEvenements(canvas);
    this.observateur = new ResizeObserver(() => this.redimensionner());
    this.observateur.observe(conteneur);
    this.redimensionner();

    this.renderer.setAnimationLoop(() => this.image());
  }

  /** Reconstruit les pochettes (appelé quand la liste filtrée ou les disponibilités changent). */
  afficher(elements: ElementCarrousel[], indice: number): void {
    for (const pochette of this.pochettes) {
      this.scene.remove(pochette.groupe);
      liberer(pochette.groupe);
    }
    this.elements = elements;
    this.pochettes = elements.map((element, i) => this.creerPochette(element, i));
    this.pochettes.forEach(p => this.scene.add(p.groupe));
    this.allerA(indice, true);
  }

  allerA(indice: number, immediat = false): void {
    this.indice = indice;
    if (immediat || this.sansAnimation) this.position = indice;
  }

  detruire(): void {
    this.renderer.setAnimationLoop(null);
    this.observateur.disconnect();
    this.nettoyages.forEach(nettoyer => nettoyer());
    liberer(this.scene);
    this.environnement.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  // ---------------------------------------------------------------------------

  private creerPochette(element: ElementCarrousel, i: number): Pochette {
    const [couleur, couleurPastille] = COULEURS_CATEGORIES[element.categorie];
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

    // Pastille ronde façon autocollant, avec le nom de l'équipement
    const pastille = new THREE.Mesh(
      new THREE.CircleGeometry(0.36, 48),
      new THREE.MeshBasicMaterial({ map: texturePastille(element, couleurPastille), toneMapped: false })
    );
    pastille.position.set(-0.56, 0.56, 0.036);
    pastille.rotation.z = 0.12;
    groupe.add(pastille);

    // Étiquette rectangulaire en bas à droite : disponible ou réservé
    const etiquette = new THREE.Mesh(
      new THREE.PlaneGeometry(0.62, 0.2),
      new THREE.MeshBasicMaterial({ map: textureEtiquette(element.disponible), toneMapped: false })
    );
    etiquette.position.set(0.58, -0.76, 0.036);
    groupe.add(etiquette);

    // L'objet en 3D, posé devant la pochette
    const modele = creerModele(element.nom, element.categorie);
    modele.scale.setScalar(ECHELLE_OBJET);
    modele.position.set(0, -0.62, 0.45);
    modele.traverse(objet => {
      if (objet instanceof THREE.Mesh) objet.castShadow = true;
    });
    groupe.add(modele);

    groupe.userData['indice'] = i;
    groupe.traverse(objet => (objet.userData['indice'] = i));

    return { groupe, modele, penche: ((element.id * 37) % 9 - 4) * 0.012 };
  }

  private image(): void {
    this.horloge.update();
    const dt = Math.min(this.horloge.getDelta(), 0.1);
    const temps = this.horloge.getElapsed();

    // La position rejoint l'indice demandé en ralentissant à l'arrivée
    if (!this.glisse) {
      this.position += (this.indice - this.position) * Math.min(1, dt * 6);
    }

    this.pochettes.forEach((pochette, i) => {
      const d = i - this.position;
      const distance = Math.abs(d);
      const g = pochette.groupe;
      g.visible = distance < 3.5;

      // Les voisines s'écartent, reculent et tournent vers le centre
      g.position.x = d * ECART + Math.sign(d) * Math.min(distance, 1) * 0.35;
      g.position.z = -Math.min(distance, 3) * 1.4;
      g.position.y = Math.sin(temps * 1.2 + i) * (this.sansAnimation ? 0 : 0.03);
      g.rotation.y = THREE.MathUtils.clamp(-d * 0.55, -0.9, 0.9);
      g.rotation.z = pochette.penche * Math.min(distance, 1);

      // L'objet du centre tourne doucement sur lui-même
      const auCentre = distance < 0.5;
      if (auCentre && !this.sansAnimation) {
        pochette.modele.rotation.y += dt * 0.7;
      } else {
        // Les autres reviennent doucement de trois quarts
        let angle = pochette.modele.rotation.y % (Math.PI * 2);
        if (angle > Math.PI) angle -= Math.PI * 2;
        pochette.modele.rotation.y = angle + (0.35 - angle) * Math.min(1, dt * 3);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  private brancherEvenements(canvas: HTMLCanvasElement): void {
    const ecouter = <K extends keyof HTMLElementEventMap>(type: K, action: (e: HTMLElementEventMap[K]) => void) => {
      canvas.addEventListener(type, action);
      this.nettoyages.push(() => canvas.removeEventListener(type, action));
    };

    ecouter('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      this.glisse = { x: e.clientX, depart: this.position, deplace: false };
    });

    ecouter('pointermove', e => {
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
      if (indice !== null && indice === this.indice) this.rappels.ouvrir(this.elements[indice].id);
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

  private redimensionner(): void {
    const largeur = this.conteneur.clientWidth;
    const hauteur = this.conteneur.clientHeight;
    if (largeur === 0 || hauteur === 0) return;
    this.renderer.setSize(largeur, hauteur);
    this.camera.aspect = largeur / hauteur;
    // Sur un écran étroit on recule la caméra pour garder la pochette entière
    this.camera.position.z = largeur < 640 ? 8.2 : 7.2;
    this.camera.updateProjectionMatrix();
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
    const lignes = decouper(ctx, element.nom.toLowerCase(), 380);
    const debut = 256 - (lignes.length - 1) * 34;
    lignes.forEach((ligne, i) => ctx.fillText(ligne, 256, debut + i * 68));

    ctx.font = '600 34px "Libre Franklin", system-ui, sans-serif';
    ctx.fillText(`n° ${element.id} · ${element.categorie.toLowerCase()}`, 256, 430);
  });
}

function textureEtiquette(disponible: boolean): THREE.CanvasTexture {
  return textureCanvas(310, 100, ctx => {
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 310, 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 298, 88);
    ctx.fillStyle = disponible ? '#15803d' : '#b91c1c';
    ctx.fillRect(12, 12, 286, 76);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 40px "Libre Franklin", system-ui, sans-serif';
    ctx.fillText(disponible ? 'DISPONIBLE' : 'RÉSERVÉ', 155, 52);
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

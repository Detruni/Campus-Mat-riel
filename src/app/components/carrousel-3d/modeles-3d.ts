import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Categorie } from '../../data/donnees-initiales';

/**
 * Petits modèles 3D construits à partir de formes simples (boîtes, cylindres...).
 * Pas de fichier 3D à télécharger : tout est généré dans le navigateur.
 * Chaque modèle est posé sur y = 0 et regarde vers +z (vers le visiteur).
 */

function matiere(couleur: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color: couleur, roughness: 0.5, metalness: 0.1, ...options });
}

function bloc(l: number, h: number, p: number, mat: THREE.Material, arrondi = 0.012): THREE.Mesh {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(l, h, p, 3, Math.min(arrondi, l / 2, h / 2, p / 2)), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylindre(rayon: number, hauteur: number, mat: THREE.Material, segments = 32): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rayon, rayon, hauteur, segments), mat);
  mesh.castShadow = true;
  return mesh;
}

// Écran allumé : un dégradé dessiné dans un canvas
function textureEcran(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  const degrade = ctx.createLinearGradient(0, 0, 256, 160);
  degrade.addColorStop(0, '#1d4ed8');
  degrade.addColorStop(0.55, '#7c3aed');
  degrade.addColorStop(1, '#06b6d4');
  ctx.fillStyle = degrade;
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(18, 130, 220, 12);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ordinateur(): THREE.Group {
  const g = new THREE.Group();
  const coque = matiere('#3a3f47', { metalness: 0.75, roughness: 0.3 });

  const base = bloc(0.46, 0.022, 0.32, coque, 0.008);
  base.position.y = 0.011;
  const clavier = bloc(0.4, 0.004, 0.15, matiere('#15171b', { roughness: 0.8 }), 0.002);
  clavier.position.set(0, 0.023, -0.02);
  const pave = bloc(0.13, 0.003, 0.08, matiere('#23272e'), 0.002);
  pave.position.set(0, 0.023, 0.105);

  // L'écran tourne autour de la charnière, à l'arrière de la base
  const charniere = new THREE.Group();
  charniere.position.set(0, 0.022, -0.155);
  charniere.rotation.x = -0.28;
  const capot = bloc(0.46, 0.3, 0.014, coque, 0.008);
  capot.position.y = 0.15;
  const image = textureEcran();
  const ecran = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.26),
    new THREE.MeshStandardMaterial({ map: image, emissiveMap: image, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.2 })
  );
  ecran.position.set(0, 0.15, 0.0075);
  charniere.add(capot, ecran);

  g.add(base, clavier, pave, charniere);
  return g;
}

function projecteur(): THREE.Group {
  const g = new THREE.Group();
  const blanc = matiere('#eef0f3', { roughness: 0.35 });

  const corps = bloc(0.42, 0.14, 0.32, blanc, 0.03);
  corps.position.y = 0.085;
  const facade = bloc(0.42, 0.1, 0.01, matiere('#9aa3ad', { metalness: 0.6, roughness: 0.3 }), 0.004);
  facade.position.set(0, 0.085, 0.162);

  const bague = cylindre(0.06, 0.05, matiere('#2a2d33', { metalness: 0.6, roughness: 0.3 }));
  bague.rotation.x = Math.PI / 2;
  bague.position.set(-0.1, 0.085, 0.18);
  const lentille = cylindre(0.045, 0.01, matiere('#0b1020', { metalness: 0.9, roughness: 0.05, emissive: '#3b82f6', emissiveIntensity: 0.35 }));
  lentille.rotation.x = Math.PI / 2;
  lentille.position.set(-0.1, 0.085, 0.206);

  // Grille d'aération sur le dessus
  const grille = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const fente = bloc(0.12, 0.004, 0.012, matiere('#7b828c'), 0.002);
    fente.position.set(0.09, 0.157, -0.08 + i * 0.03);
    grille.add(fente);
  }

  for (const [x, z] of [[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]]) {
    const pied = cylindre(0.015, 0.016, matiere('#1f2329'));
    pied.position.set(x, 0.008, z);
    g.add(pied);
  }

  g.add(corps, facade, bague, lentille, grille);
  return g;
}

function appareilPhoto(): THREE.Group {
  const g = new THREE.Group();
  const noir = matiere('#1b1d21', { roughness: 0.7 });

  const corps = bloc(0.27, 0.17, 0.1, noir, 0.02);
  corps.position.y = 0.085;
  const viseur = bloc(0.1, 0.06, 0.09, noir, 0.015);
  viseur.position.set(0, 0.19, -0.005);
  const poignee = bloc(0.06, 0.15, 0.05, matiere('#2a2c31', { roughness: 0.9 }), 0.02);
  poignee.position.set(0.11, 0.08, 0.045);

  const objectif = cylindre(0.065, 0.13, matiere('#26282d', { metalness: 0.5, roughness: 0.35 }));
  objectif.rotation.x = Math.PI / 2;
  objectif.position.set(-0.02, 0.085, 0.115);
  const bague = cylindre(0.068, 0.02, matiere('#c0392b', { metalness: 0.4, roughness: 0.4 }));
  bague.rotation.x = Math.PI / 2;
  bague.position.set(-0.02, 0.085, 0.15);
  const verre = cylindre(0.05, 0.005, matiere('#0a0f1f', { metalness: 1, roughness: 0.05, emissive: '#6d28d9', emissiveIntensity: 0.25 }));
  verre.rotation.x = Math.PI / 2;
  verre.position.set(-0.02, 0.085, 0.182);

  const declencheur = cylindre(0.014, 0.012, matiere('#b8bec7', { metalness: 0.9, roughness: 0.2 }));
  declencheur.position.set(0.1, 0.177, 0.02);

  g.add(corps, viseur, poignee, objectif, bague, verre, declencheur);
  return g;
}

function microphone(): THREE.Group {
  const g = new THREE.Group();
  const metal = matiere('#2d3036', { metalness: 0.85, roughness: 0.25 });

  const socle = cylindre(0.085, 0.018, metal);
  socle.position.y = 0.009;
  const tige = cylindre(0.008, 0.2, metal, 16);
  tige.position.y = 0.11;
  const fourche = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 8, 24, Math.PI), metal);
  fourche.position.y = 0.21;
  fourche.rotation.z = Math.PI;

  const capsule = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.042, 0.1, 8, 24),
    matiere('#9aa1ab', { metalness: 0.9, roughness: 0.35 })
  );
  capsule.castShadow = true;
  capsule.position.y = 0.27;
  const anneau = cylindre(0.044, 0.02, matiere('#111317', { metalness: 0.6 }));
  anneau.position.y = 0.25;
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.006, 12, 12), new THREE.MeshBasicMaterial({ color: '#22d3ee' }));
  voyant.position.set(0, 0.235, 0.044);

  g.add(socle, tige, fourche, capsule, anneau, voyant);
  return g;
}

function enceinte(): THREE.Group {
  const g = new THREE.Group();

  const caisse = bloc(0.24, 0.34, 0.2, matiere('#25272c', { roughness: 0.85 }), 0.035);
  caisse.position.y = 0.17;

  const membrane = (rayon: number, y: number) => {
    const groupe = new THREE.Group();
    const bord = new THREE.Mesh(new THREE.TorusGeometry(rayon, rayon * 0.12, 12, 32), matiere('#3b3f46', { metalness: 0.5 }));
    const cone = new THREE.Mesh(new THREE.ConeGeometry(rayon * 0.95, rayon * 0.5, 32, 1, true), matiere('#111216', { roughness: 0.9, side: THREE.DoubleSide }));
    cone.rotation.x = -Math.PI / 2;
    cone.position.z = -rayon * 0.1;
    const cache = new THREE.Mesh(new THREE.SphereGeometry(rayon * 0.28, 16, 16), matiere('#5b616b', { metalness: 0.7, roughness: 0.3 }));
    cache.scale.z = 0.5;
    groupe.add(bord, cone, cache);
    groupe.position.set(0, y, 0.102);
    return groupe;
  };

  const poignee = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 10, 24, Math.PI), matiere('#4b5059', { metalness: 0.7 }));
  poignee.position.y = 0.34;
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.006, 0.004), new THREE.MeshBasicMaterial({ color: '#38bdf8' }));
  led.position.set(0, 0.03, 0.101);

  g.add(caisse, membrane(0.075, 0.13), membrane(0.035, 0.27), poignee, led);
  return g;
}

// Modèle de secours pour un équipement qu'on ne sait pas représenter
function boite(): THREE.Group {
  const g = new THREE.Group();
  const carton = bloc(0.32, 0.22, 0.24, matiere('#c9a77c', { roughness: 0.9 }), 0.01);
  carton.position.y = 0.11;
  const scotch = bloc(0.33, 0.005, 0.05, matiere('#a8865c', { roughness: 0.6 }), 0.002);
  scotch.position.y = 0.222;
  g.add(carton, scotch);
  return g;
}

/**
 * Petit personnage pour les comptes de démonstration.
 * Les étudiants portent une casquette, le responsable un nœud papillon et des lunettes.
 */
export function creerAvatar(couleur: string, responsable: boolean): THREE.Group {
  const g = new THREE.Group();
  const tenue = matiere(couleur, { roughness: 0.6 });
  const peau = matiere('#f6d7bd', { roughness: 0.7 });
  const noir = matiere('#141414', { roughness: 0.4 });

  const corps = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.12, 8, 24), tenue);
  corps.position.y = 0.17;
  corps.castShadow = true;

  const tete = new THREE.Mesh(new THREE.SphereGeometry(0.105, 32, 32), peau);
  tete.position.y = 0.39;
  tete.castShadow = true;

  for (const x of [-0.038, 0.038]) {
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.013, 16, 16), noir);
    oeil.position.set(x, 0.405, 0.095);
    const joue = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 16), matiere('#ff9fb2'));
    joue.scale.set(1, 0.6, 0.4);
    joue.position.set(x * 1.6, 0.375, 0.088);
    g.add(oeil, joue);
  }

  // Sourire : un petit arc de tore
  const sourire = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 8, 16, Math.PI), noir);
  sourire.rotation.z = Math.PI;
  sourire.position.set(0, 0.372, 0.1);
  g.add(sourire);

  for (const x of [-0.12, 0.12]) {
    const bras = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.1, 6, 12), tenue);
    bras.position.set(x, 0.18, 0);
    bras.rotation.z = x > 0 ? -0.35 : 0.35;
    bras.castShadow = true;
    g.add(bras);
  }

  if (responsable) {
    // Nœud papillon
    for (const x of [-0.025, 0.025]) {
      const aile = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.04, 16), matiere('#ffd23f'));
      aile.rotation.z = x > 0 ? Math.PI / 2 : -Math.PI / 2;
      aile.position.set(x, 0.29, 0.085);
      g.add(aile);
    }
    // Lunettes rondes
    for (const x of [-0.038, 0.038]) {
      const verre = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 8, 24), noir);
      verre.position.set(x, 0.405, 0.1);
      g.add(verre);
    }
  } else {
    // Casquette : un dôme et une visière
    const calotte = new THREE.Mesh(new THREE.SphereGeometry(0.108, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), matiere('#ffd23f'));
    calotte.position.y = 0.41;
    const visiere = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 32, 1, false, -Math.PI / 2, Math.PI), matiere('#ffd23f'));
    visiere.position.set(0, 0.415, 0.06);
    visiere.rotation.x = 0.15;
    g.add(calotte, visiere);
  }

  g.add(corps, tete);

  // Le personnage est plus haut que les objets : on le réduit un peu pour qu'il ne cache pas la pastille
  const personnage = new THREE.Group();
  g.scale.setScalar(0.8);
  personnage.add(g);
  return personnage;
}

export function creerModele(nom: string, categorie: Categorie): THREE.Group {
  switch (categorie) {
    case 'Informatique':
      return ordinateur();
    case 'Projection':
      return projecteur();
    case 'Photo':
      return appareilPhoto();
    case 'Audio':
      // Deux objets très différents dans la même catégorie : on regarde le nom
      return /micro/i.test(nom) ? microphone() : enceinte();
    default:
      return boite();
  }
}

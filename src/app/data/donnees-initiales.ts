/**
 * Campus Matériel — données de départ pour Angular.
 * Emplacement conseillé : src/app/data/donnees-initiales.ts
 *
 * Ces comptes servent uniquement à simuler une connexion.
 * Aucun mot de passe ni véritable contrôle d'identité n'est fourni.
 * Les identifiants sont stables : ne pas utiliser l'indice du tableau.
 */
export type Role = 'student' | 'manager';
export type Categorie = 'Informatique' | 'Projection' | 'Photo' | 'Audio';

export interface Compte {
  id: number;
  nom: string;
  role: Role;
}

export interface Equipement {
  id: number;
  nom: string;
  categorie: Categorie;
  description: string;
  localisation: string;
}

export interface Reservation {
  id: string;
  equipementId: number;
  etudiantId: number;
}

export const CATEGORIES: Categorie[] = [
  'Informatique', 'Projection', 'Photo', 'Audio'
];

export const COMPTES_INITIAUX: Compte[] = [
  { id: 1, nom: 'Alice Martin', role: 'student' },
  { id: 2, nom: 'Yanis Bernard', role: 'student' },
  { id: 3, nom: 'Camille Dupont', role: 'manager' }
];

// Chaque entrée représente un exemplaire physique distinct.
export const EQUIPEMENTS_INITIAUX: Equipement[] = [
  {
    id: 101,
    nom: 'Ordinateur portable 01',
    categorie: 'Informatique',
    description: 'Ordinateur portable avec chargeur et souris USB.',
    localisation: 'Salle informatique B201'
  },
  {
    id: 102,
    nom: 'Ordinateur portable 02',
    categorie: 'Informatique',
    description: 'Second ordinateur portable avec chargeur et souris USB.',
    localisation: 'Salle informatique B201'
  },
  {
    id: 103,
    nom: 'Vidéoprojecteur mobile',
    categorie: 'Projection',
    description: 'Vidéoprojecteur avec câble HDMI et télécommande.',
    localisation: 'Réserve B204'
  },
  {
    id: 104,
    nom: 'Appareil photo numérique',
    categorie: 'Photo',
    description: 'Appareil photo avec objectif, batterie et carte mémoire.',
    localisation: 'Studio C102'
  },
  {
    id: 105,
    nom: 'Microphone USB',
    categorie: 'Audio',
    description: 'Microphone de bureau avec pied et câble USB.',
    localisation: 'Studio C102'
  },
  {
    id: 106,
    nom: 'Enceinte portable',
    categorie: 'Audio',
    description: 'Enceinte rechargeable avec câble audio et alimentation.',
    localisation: 'Réserve B204'
  }
];

// Au premier lancement, tout le matériel est disponible.
// Chaque entrée représente une réservation active.
// Annuler une réservation consiste à retirer cette entrée.
export const RESERVATIONS_INITIALES: Reservation[] = [];

/**
 * Exemple de règle à implémenter dans le service de données :
 * un équipement est disponible si aucune réservation active
 * ne possède son equipementId. Ne pas ajouter de champ disponible.
 *
 * Initialiser localStorage avec ces données uniquement si la clé
 * n'existe pas. Un tableau vide enregistré est une donnée valide.
 * Copier les données initiales avant modification (structuredClone).
 * Pour un nouvel équipement, générer un id unique, pas length + 1.
 * Pour une réservation, on peut utiliser crypto.randomUUID().
 */

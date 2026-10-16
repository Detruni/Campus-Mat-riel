import { Categorie, Compte, Equipement } from '../../data/donnees-initiales';
import { FONDS_CATEGORIES } from '../../services/ambiance.service';
import { creerAvatar, creerModele } from './modeles-3d';
import { ElementCarrousel } from './scene-carrousel';

/**
 * Transforme les données de l'application en éléments affichables par le carrousel.
 * Chaque page appelle la fonction qui la concerne.
 */

// Couleurs des pochettes par catégorie : [pochette, pastille]
const POCHETTES: Record<Categorie, [string, string]> = {
  Informatique: ['#6f6cf5', '#ffd23f'],
  Projection: ['#ff7a1a', '#f05a9d'],
  Photo: ['#f5b400', '#ef3e36'],
  Audio: ['#39b85a', '#5b5bf0']
};

export function elementsEquipements(equipements: Equipement[], reserves: Set<number>): ElementCarrousel[] {
  return equipements.map(e => {
    const disponible = !reserves.has(e.id);
    const [couleur, couleurPastille] = POCHETTES[e.categorie];
    return {
      cle: e.id,
      libelle: e.nom,
      pastille: e.nom,
      petitTexte: `n° ${e.id} · ${e.categorie}`,
      couleur,
      couleurPastille,
      etiquette: disponible
        ? { texte: 'Disponible', couleur: '#15803d' }
        : { texte: 'Réservé', couleur: '#b91c1c' },
      fond: FONDS_CATEGORIES[e.categorie],
      modele: () => creerModele(e.nom, e.categorie)
    };
  });
}

// Une ambiance différente pour chaque compte de démonstration
const STYLES_COMPTES: { couleur: string; pastille: string; tenue: string; fond: [string, string] }[] = [
  { couleur: '#6f6cf5', pastille: '#ffd23f', tenue: '#ff5a8a', fond: ['#ff9a3d', '#f6a6c8'] },
  { couleur: '#39b85a', pastille: '#f05a9d', tenue: '#5b5bf0', fond: ['#f07ab8', '#b58cff'] },
  { couleur: '#ff7a1a', pastille: '#5b5bf0', tenue: '#141414', fond: ['#8f8cff', '#c9b6ff'] }
];

export function elementsComptes(comptes: Compte[], libelles: Record<string, string>): ElementCarrousel[] {
  return comptes.map((compte, i) => {
    const style = STYLES_COMPTES[i % STYLES_COMPTES.length];
    return {
      cle: compte.id,
      libelle: compte.nom,
      pastille: compte.nom,
      petitTexte: libelles[compte.role],
      couleur: style.couleur,
      couleurPastille: style.pastille,
      etiquette: { texte: libelles[compte.role], couleur: '#141414' },
      fond: style.fond,
      modele: () => creerAvatar(style.tenue, compte.role === 'manager')
    };
  });
}

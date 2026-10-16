import { Injectable, effect, inject, signal } from '@angular/core';
import { CATEGORIES, EQUIPEMENTS_INITIAUX, Equipement } from '../data/donnees-initiales';
import { StockageService } from './stockage.service';

const CLE_EQUIPEMENTS = 'campus-materiel.equipements';

// Données d'un formulaire : tout sauf l'identifiant, qui est géré par le service
export type DonneesEquipement = Omit<Equipement, 'id'>;

function estEquipement(valeur: unknown): valeur is Equipement {
  const e = valeur as Equipement;
  return typeof e === 'object' && e !== null
    && typeof e.id === 'number'
    && typeof e.nom === 'string'
    && CATEGORIES.includes(e.categorie)
    && typeof e.description === 'string'
    && typeof e.localisation === 'string';
}

function estListeEquipements(valeur: unknown): valeur is Equipement[] {
  return Array.isArray(valeur) && valeur.every(estEquipement);
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly stockage = inject(StockageService);

  private readonly etat = signal<Equipement[]>(
    this.stockage.lire(CLE_EQUIPEMENTS, EQUIPEMENTS_INITIAUX, estListeEquipements)
  );
  readonly equipements = this.etat.asReadonly();

  constructor() {
    // Chaque modification du catalogue est sauvegardée automatiquement
    effect(() => this.stockage.ecrire(CLE_EQUIPEMENTS, this.etat()));
  }

  trouver(id: number): Equipement | undefined {
    return this.etat().find(e => e.id === id);
  }

  ajouter(donnees: DonneesEquipement): Equipement {
    const equipement: Equipement = { id: this.nouvelId(), ...donnees };
    this.etat.update(liste => [...liste, equipement]);
    return equipement;
  }

  modifier(id: number, donnees: DonneesEquipement): boolean {
    if (!this.trouver(id)) return false;

    this.etat.update(liste => liste.map(e =>
      e.id === id ? { ...e, ...donnees, id } : e
    ));
    return true;
  }

  supprimer(id: number): void {
    this.etat.update(liste => liste.filter(e => e.id !== id));
  }

  // On prend le plus grand id + 1 (et pas length + 1, qui peut créer des doublons après une suppression)
  private nouvelId(): number {
    return Math.max(100, ...this.etat().map(e => e.id)) + 1;
  }
}

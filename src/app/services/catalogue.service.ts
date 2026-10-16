import { Injectable, effect, inject, signal } from '@angular/core';
import { CATEGORIES, EQUIPEMENTS_INITIAUX, Equipement } from '../data/donnees-initiales';
import { ReservationService } from './reservation.service';
import { Resultat } from './resultat';
import { StockageService } from './stockage.service';

const CLE_EQUIPEMENTS = 'campus-materiel.equipements';
// Dernier identifiant attribué : il n'est jamais réutilisé, même après une suppression
const CLE_DERNIER_ID = 'campus-materiel.dernier-id';

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
  private readonly reservations = inject(ReservationService);

  private readonly etat = signal<Equipement[]>(
    this.stockage.lire(CLE_EQUIPEMENTS, EQUIPEMENTS_INITIAUX, estListeEquipements)
  );
  readonly equipements = this.etat.asReadonly();

  // Si aucun compteur n'est enregistré, on part du plus grand id existant
  private readonly dernierId = signal<number>(
    this.stockage.lire(CLE_DERNIER_ID, this.plusGrandId(), (v): v is number => typeof v === 'number')
  );

  constructor() {
    // Chaque modification du catalogue est sauvegardée automatiquement
    effect(() => this.stockage.ecrire(CLE_EQUIPEMENTS, this.etat()));
    effect(() => this.stockage.ecrire(CLE_DERNIER_ID, this.dernierId()));

    // Un autre onglet a modifié le catalogue : on relit les données enregistrées
    this.stockage.surveiller(CLE_EQUIPEMENTS, () =>
      this.etat.set(this.stockage.lire(CLE_EQUIPEMENTS, EQUIPEMENTS_INITIAUX, estListeEquipements))
    );
    this.stockage.surveiller(CLE_DERNIER_ID, () =>
      this.dernierId.set(this.stockage.lire(CLE_DERNIER_ID, this.plusGrandId(), (v): v is number => typeof v === 'number'))
    );
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

  supprimer(id: number): Resultat {
    const equipement = this.trouver(id);
    if (!equipement) {
      return { ok: false, message: "Cet équipement n'existe plus." };
    }

    // Règle métier : on ne supprime pas un équipement qui a une réservation active
    if (!this.reservations.estDisponible(id)) {
      return {
        ok: false,
        message: `Suppression refusée : « ${equipement.nom} » est actuellement réservé. `
          + "L'étudiant doit d'abord annuler sa réservation."
      };
    }

    this.etat.update(liste => liste.filter(e => e.id !== id));
    return { ok: true, message: `« ${equipement.nom} » a été supprimé du catalogue.` };
  }

  // Remet le catalogue de départ (bouton de la page de connexion)
  reinitialiser(): void {
    this.etat.set(structuredClone(EQUIPEMENTS_INITIAUX));
    this.dernierId.set(this.plusGrandId());
  }

  // Nouvel identifiant : le compteur + 1 (et pas length + 1, qui crée des doublons après une suppression).
  // Le compteur est enregistré, donc un numéro supprimé n'est jamais redonné à un autre équipement.
  private nouvelId(): number {
    const id = Math.max(this.dernierId(), this.plusGrandId()) + 1;
    this.dernierId.set(id);
    return id;
  }

  private plusGrandId(): number {
    return Math.max(100, ...this.etat().map(e => e.id));
  }
}

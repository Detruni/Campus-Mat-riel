import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { RESERVATIONS_INITIALES, Reservation } from '../data/donnees-initiales';
import { StockageService } from './stockage.service';

const CLE_RESERVATIONS = 'campus-materiel.reservations';

function estReservation(valeur: unknown): valeur is Reservation {
  const r = valeur as Reservation;
  return typeof r === 'object' && r !== null
    && typeof r.id === 'string'
    && typeof r.equipementId === 'number'
    && typeof r.etudiantId === 'number';
}

function estListeReservations(valeur: unknown): valeur is Reservation[] {
  return Array.isArray(valeur) && valeur.every(estReservation);
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly stockage = inject(StockageService);

  // Chaque entrée = une réservation active. Annuler revient à retirer l'entrée.
  private readonly etat = signal<Reservation[]>(
    this.stockage.lire(CLE_RESERVATIONS, RESERVATIONS_INITIALES, estListeReservations)
  );
  readonly reservations = this.etat.asReadonly();

  // Pas de champ "disponible" sur l'équipement : on le déduit des réservations,
  // comme ça les deux informations ne peuvent jamais se contredire.
  readonly idsReserves = computed(() => new Set(this.etat().map(r => r.equipementId)));

  constructor() {
    effect(() => this.stockage.ecrire(CLE_RESERVATIONS, this.etat()));
  }

  estDisponible(equipementId: number): boolean {
    return !this.idsReserves().has(equipementId);
  }
}

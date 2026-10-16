import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { RESERVATIONS_INITIALES, Reservation } from '../data/donnees-initiales';
import { Resultat } from './resultat';
import { SessionService } from './session.service';
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
  private readonly session = inject(SessionService);

  // Chaque entrée = une réservation active. Annuler revient à retirer l'entrée.
  private readonly etat = signal<Reservation[]>(
    this.stockage.lire(CLE_RESERVATIONS, RESERVATIONS_INITIALES, estListeReservations)
  );
  readonly reservations = this.etat.asReadonly();

  // Pas de champ "disponible" sur l'équipement : on le déduit des réservations,
  // comme ça les deux informations ne peuvent jamais se contredire.
  readonly idsReserves = computed(() => new Set(this.etat().map(r => r.equipementId)));

  // Uniquement les réservations de l'étudiant connecté
  readonly mesReservations = computed(() => {
    const utilisateur = this.session.utilisateur();
    if (!utilisateur) return [];
    return this.etat().filter(r => r.etudiantId === utilisateur.id);
  });

  constructor() {
    effect(() => this.stockage.ecrire(CLE_RESERVATIONS, this.etat()));
  }

  estDisponible(equipementId: number): boolean {
    return !this.idsReserves().has(equipementId);
  }

  reinitialiser(): void {
    this.etat.set(structuredClone(RESERVATIONS_INITIALES));
  }


  /**
   * Trajet d'une réservation :
   * 1. on vérifie que c'est bien un étudiant connecté
   * 2. on vérifie que l'équipement n'a pas déjà une réservation active
   * 3. on ajoute la réservation dans le signal
   * 4. l'effect du constructeur l'enregistre dans le localStorage
   * 5. les computed (disponibilité, mes réservations) mettent les vues à jour
   */
  reserver(equipementId: number): Resultat {
    const utilisateur = this.session.utilisateur();
    if (!utilisateur || utilisateur.role !== 'student') {
      return { ok: false, message: 'Seuls les étudiants peuvent réserver du matériel.' };
    }

    if (!this.estDisponible(equipementId)) {
      return {
        ok: false,
        message: 'Cet équipement est déjà réservé, il ne peut pas être réservé une seconde fois.'
      };
    }

    const reservation: Reservation = {
      id: crypto.randomUUID(),
      equipementId,
      etudiantId: utilisateur.id
    };
    this.etat.update(liste => [...liste, reservation]);
    return { ok: true, message: 'Réservation enregistrée.' };
  }

  annuler(reservationId: string): Resultat {
    const utilisateur = this.session.utilisateur();
    const reservation = this.etat().find(r => r.id === reservationId);

    if (!reservation) {
      return { ok: false, message: "Cette réservation n'existe plus." };
    }
    // Un étudiant ne peut annuler que ses propres réservations
    if (!utilisateur || reservation.etudiantId !== utilisateur.id) {
      return { ok: false, message: 'Vous ne pouvez annuler que vos propres réservations.' };
    }

    this.etat.update(liste => liste.filter(r => r.id !== reservationId));
    return { ok: true, message: 'Réservation annulée, le matériel est de nouveau disponible.' };
  }
}

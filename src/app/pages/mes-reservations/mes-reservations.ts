import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
import { Resultat } from '../../services/resultat';

@Component({
  selector: 'app-mes-reservations',
  imports: [RouterLink],
  templateUrl: './mes-reservations.html',
  styleUrl: './mes-reservations.css'
})
export class MesReservations {
  private readonly catalogue = inject(CatalogueService);
  private readonly reservations = inject(ReservationService);

  readonly message = signal<Resultat | null>(null);

  // On associe chaque réservation à son équipement pour afficher le nom
  readonly lignes = computed(() =>
    this.reservations.mesReservations().map(reservation => ({
      reservation,
      equipement: this.catalogue.trouver(reservation.equipementId)
    }))
  );

  annuler(reservationId: string): void {
    this.message.set(this.reservations.annuler(reservationId));
  }
}

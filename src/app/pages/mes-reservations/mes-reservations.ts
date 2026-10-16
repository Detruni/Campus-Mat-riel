import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Carrousel3d } from '../../components/carrousel-3d/carrousel-3d';
import { elementsEquipements } from '../../components/carrousel-3d/elements';
import { Equipement } from '../../data/donnees-initiales';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
import { Resultat } from '../../services/resultat';

@Component({
  selector: 'app-mes-reservations',
  imports: [RouterLink, Carrousel3d],
  templateUrl: './mes-reservations.html'
})
export class MesReservations {
  private readonly catalogue = inject(CatalogueService);
  private readonly reservations = inject(ReservationService);
  private readonly router = inject(Router);

  readonly message = signal<Resultat | null>(null);
  readonly indice = signal(0);

  // On associe chaque réservation à son équipement pour afficher le nom
  readonly lignes = computed(() =>
    this.reservations.mesReservations().map(reservation => ({
      reservation,
      equipement: this.catalogue.trouver(reservation.equipementId)
    }))
  );

  readonly courante = computed(() => this.lignes()[this.indice()]);

  // Pochettes du carrousel (une réservation dont l'équipement aurait disparu n'a pas de pochette)
  readonly elements = computed(() =>
    elementsEquipements(
      this.lignes().map(l => l.equipement).filter((e): e is Equipement => e !== undefined),
      this.reservations.idsReserves()
    )
  );

  annuler(reservationId: string): void {
    this.message.set(this.reservations.annuler(reservationId));
  }

  ouvrir(indice: number): void {
    const equipement = this.lignes()[indice]?.equipement;
    if (equipement) this.router.navigate(['/materiels', equipement.id]);
  }

  numero(n: number): string {
    return String(n).padStart(2, '0');
  }
}

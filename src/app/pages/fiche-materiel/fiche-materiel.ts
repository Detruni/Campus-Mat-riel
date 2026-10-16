import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeDisponibilite } from '../../components/badge-disponibilite/badge-disponibilite';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
import { Resultat } from '../../services/resultat';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-fiche-materiel',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './fiche-materiel.html',
  styleUrl: './fiche-materiel.css'
})
export class FicheMateriel {
  // Rempli par le routeur grâce à withComponentInputBinding (/materiels/:id)
  readonly id = input.required<string>();

  readonly catalogue = inject(CatalogueService);
  readonly reservations = inject(ReservationService);
  readonly session = inject(SessionService);

  // Le paramètre arrive sous forme de texte : on vérifie que c'est bien un nombre
  readonly equipement = computed(() => {
    const texte = this.id();
    if (!/^\d+$/.test(texte)) return undefined;
    return this.catalogue.trouver(Number(texte));
  });

  readonly disponible = computed(() => {
    const equipement = this.equipement();
    return equipement ? this.reservations.estDisponible(equipement.id) : false;
  });

  // Réservation de l'étudiant connecté sur cet équipement, s'il en a une
  readonly maReservation = computed(() => {
    const equipement = this.equipement();
    if (!equipement) return undefined;
    return this.reservations.mesReservations().find(r => r.equipementId === equipement.id);
  });

  readonly message = signal<Resultat | null>(null);

  reserver(equipementId: number): void {
    this.message.set(this.reservations.reserver(equipementId));
  }

  annuler(reservationId: string): void {
    this.message.set(this.reservations.annuler(reservationId));
  }
}

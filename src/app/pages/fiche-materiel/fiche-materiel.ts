import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeDisponibilite } from '../../components/badge-disponibilite/badge-disponibilite';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
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
}

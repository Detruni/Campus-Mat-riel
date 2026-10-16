import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeDisponibilite } from '../../../components/badge-disponibilite/badge-disponibilite';
import { Equipement } from '../../../data/donnees-initiales';
import { CatalogueService } from '../../../services/catalogue.service';
import { MessageService } from '../../../services/message.service';
import { ReservationService } from '../../../services/reservation.service';
import { Resultat } from '../../../services/resultat';

@Component({
  selector: 'app-liste-gestion',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './liste-gestion.html',
  styleUrl: './liste-gestion.css'
})
export class ListeGestion {
  readonly catalogue = inject(CatalogueService);
  readonly reservations = inject(ReservationService);
  // Message éventuel laissé par le formulaire après un enregistrement
  readonly message = signal<Resultat | null>(inject(MessageService).recuperer());

  supprimer(equipement: Equipement): void {
    // Si l'équipement est réservé, inutile de demander confirmation :
    // le service va refuser et on affiche directement l'explication.
    const disponible = this.reservations.estDisponible(equipement.id);
    if (disponible && !confirm(`Supprimer définitivement « ${equipement.nom} » ?`)) {
      return;
    }
    this.message.set(this.catalogue.supprimer(equipement.id));
  }
}

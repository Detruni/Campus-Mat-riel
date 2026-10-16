import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Equipement } from '../../data/donnees-initiales';
import { BadgeDisponibilite } from '../badge-disponibilite/badge-disponibilite';

// Contenu de la capsule du catalogue pour un équipement.
// Elle ne réserve rien elle-même : elle prévient le parent avec l'output "reserver".
@Component({
  selector: 'app-capsule-equipement',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './capsule-equipement.html'
})
export class CapsuleEquipement {
  readonly equipement = input.required<Equipement>();
  readonly numero = input('');
  readonly disponible = input.required<boolean>();
  readonly peutReserver = input(false);
  readonly reserveParMoi = input(false);

  readonly reserver = output<number>();
}

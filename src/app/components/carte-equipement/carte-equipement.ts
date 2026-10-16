import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Equipement } from '../../data/donnees-initiales';
import { BadgeDisponibilite } from '../badge-disponibilite/badge-disponibilite';

// Carte d'un équipement dans la liste du catalogue.
// Elle ne réserve rien elle-même : elle prévient le parent avec l'output "reserver".
@Component({
  selector: 'app-carte-equipement',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './carte-equipement.html',
  styleUrl: './carte-equipement.css'
})
export class CarteEquipement {
  readonly equipement = input.required<Equipement>();
  readonly disponible = input.required<boolean>();
  readonly peutReserver = input(false);
  readonly reserveParMoi = input(false);

  readonly reserver = output<number>();
}

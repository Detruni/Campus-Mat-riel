import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Equipement } from '../../data/donnees-initiales';
import { BadgeDisponibilite } from '../badge-disponibilite/badge-disponibilite';

// Carte d'un équipement dans la liste du catalogue.
// Elle ne fait qu'afficher ce que le parent lui donne.
@Component({
  selector: 'app-carte-equipement',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './carte-equipement.html',
  styleUrl: './carte-equipement.css'
})
export class CarteEquipement {
  readonly equipement = input.required<Equipement>();
  readonly disponible = input.required<boolean>();
}

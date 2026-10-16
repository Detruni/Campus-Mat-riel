import { Injectable, inject, signal } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { Categorie } from '../data/donnees-initiales';

export type Couleurs = [string, string];

// Couleurs du fond selon la catégorie affichée (elles contrastent avec la pochette)
export const FONDS_CATEGORIES: Record<Categorie, Couleurs> = {
  Informatique: ['#ff9a3d', '#f6a6c8'],
  Projection: ['#8f8cff', '#c9b6ff'],
  Photo: ['#f0442b', '#ff9f1c'],
  Audio: ['#f07ab8', '#b58cff']
};

export const FOND_PAR_DEFAUT: Couleurs = ['#ff9a3d', '#f6a6c8'];

/**
 * Couleurs du grand fond de l'application. Les pages (ou le carrousel) les changent
 * selon ce qu'elles affichent ; à chaque navigation on repart des couleurs par défaut.
 */
@Injectable({ providedIn: 'root' })
export class AmbianceService {
  private readonly etat = signal<Couleurs>(FOND_PAR_DEFAUT);
  readonly couleurs = this.etat.asReadonly();

  constructor() {
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationStart))
      .subscribe(() => this.etat.set(FOND_PAR_DEFAUT));
  }

  definir(couleurs: Couleurs): void {
    this.etat.set(couleurs);
  }
}

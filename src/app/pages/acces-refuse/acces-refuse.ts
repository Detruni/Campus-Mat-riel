import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-acces-refuse',
  imports: [RouterLink],
  template: `
    <section class="page-message">
      <h1>Accès refusé</h1>
      @if (session.utilisateur(); as utilisateur) {
        <p>
          Votre compte <strong>{{ utilisateur.nom }}</strong> n'a pas les droits
          nécessaires pour ouvrir cette page.
        </p>
      } @else {
        <p>Cette page demande d'être connecté avec un compte autorisé.</p>
      }
      <p class="actions">
        <a routerLink="/catalogue" class="bouton">Retour au catalogue</a>
        <a routerLink="/login" class="bouton bouton-secondaire">Changer de compte</a>
      </p>
    </section>
  `
})
export class AccesRefuse {
  readonly session = inject(SessionService);
}

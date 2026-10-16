import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-introuvable',
  imports: [RouterLink],
  template: `
    <section class="page-message">
      <h1>Page introuvable</h1>
      <p>L'adresse demandée ne correspond à aucune page de l'application.</p>
      <p class="actions">
        <a routerLink="/" class="bouton">Retour à l'accueil</a>
      </p>
    </section>
  `
})
export class PageIntrouvable {}

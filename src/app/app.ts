import { Component, Injector, afterNextRender, inject, signal } from '@angular/core';
import {
  NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet
} from '@angular/router';
import { filter } from 'rxjs';
import { FondAmbiance } from './components/fond-ambiance/fond-ambiance';
import { LIBELLES_ROLES, SessionService } from './services/session.service';
import { StockageService } from './services/stockage.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FondAmbiance],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly session = inject(SessionService);
  readonly stockage = inject(StockageService);
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  // Page en cours de chargement (les pages en 3D sont téléchargées à leur première ouverture)
  readonly chargement = signal(false);
  // Adresse d'une page qui n'a pas pu être chargée (connexion coupée, serveur arrêté...)
  readonly pageEnErreur = signal<string | null>(null);
  private minuteurChargement = 0;

  readonly libellesRoles = LIBELLES_ROLES;

  private cheminPrecedent = '';

  constructor() {
    this.router.events.subscribe(e => {
      if (e instanceof NavigationStart) {
        this.pageEnErreur.set(null);
        // On attend un peu avant d'afficher l'indicateur : inutile s'il s'agit d'une page déjà chargée
        clearTimeout(this.minuteurChargement);
        this.minuteurChargement = window.setTimeout(() => this.chargement.set(true), 150);
      } else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) {
        clearTimeout(this.minuteurChargement);
        this.chargement.set(false);
        // Plutôt qu'un écran blanc, on explique le problème et on propose de réessayer
        if (e instanceof NavigationError) this.pageEnErreur.set(e.url);
      }
    });

    // Accessibilité : après un changement de page, le focus va sur le titre principal
    // (sinon un lecteur d'écran ou un utilisateur au clavier reste sur le lien cliqué).
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        const chemin = e.urlAfterRedirects.split('?')[0];
        // Premier affichage ou simple changement de filtre (?q=...) : on ne bouge pas le focus
        const memePage = this.cheminPrecedent === '' || chemin === this.cheminPrecedent;
        this.cheminPrecedent = chemin;
        if (memePage) return;

        afterNextRender(() => this.focaliserTitre(), { injector: this.injector });
      });
  }

  reessayer(): void {
    const url = this.pageEnErreur();
    // Le navigateur garde en mémoire l'échec du téléchargement d'un module :
    // on recharge donc complètement la page demandée (les données sont dans le localStorage).
    if (url) window.location.assign(url);
  }

  private focaliserTitre(): void {
    const titre = document.querySelector<HTMLElement>('main h1');
    if (!titre) return;
    // tabindex="-1" : le titre peut recevoir le focus sans entrer dans l'ordre de tabulation
    titre.setAttribute('tabindex', '-1');
    titre.focus({ preventScroll: true });
  }
}

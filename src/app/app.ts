import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  readonly libellesRoles = LIBELLES_ROLES;

  private cheminPrecedent = '';

  constructor() {
    // Accessibilité : après un changement de page, le focus va sur le titre principal
    // (sinon un lecteur d'écran ou un utilisateur au clavier reste sur le lien cliqué).
    inject(Router).events
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

  private focaliserTitre(): void {
    const titre = document.querySelector<HTMLElement>('main h1');
    if (!titre) return;
    // tabindex="-1" : le titre peut recevoir le focus sans entrer dans l'ordre de tabulation
    titre.setAttribute('tabindex', '-1');
    titre.focus({ preventScroll: true });
  }
}

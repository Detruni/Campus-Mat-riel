import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LIBELLES_ROLES, SessionService } from '../../services/session.service';

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.html',
  styleUrl: './connexion.css'
})
export class Connexion {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly libellesRoles = LIBELLES_ROLES;

  choisir(id: number): void {
    if (this.session.connecter(id)) {
      // replaceUrl : le bouton Précédent ne ramène pas sur la page de connexion
      this.router.navigateByUrl('/catalogue', { replaceUrl: true });
    }
  }
}

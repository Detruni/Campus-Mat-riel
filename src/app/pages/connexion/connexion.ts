import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LIBELLES_ROLES, SessionService } from '../../services/session.service';

// On ne revient que vers une page connue de l'application (jamais vers une adresse externe).
// Les droits sont de toute façon revérifiés par le guard de la page de destination.
function cheminDeRetour(valeur: string | null): string {
  const autorises = /^\/(catalogue(\?[^#]*)?|materiels\/\d+|mes-reservations|gestion(\/nouveau|\/\d+\/modifier)?)$/;
  return valeur !== null && autorises.test(valeur) ? valeur : '/catalogue';
}

@Component({
  selector: 'app-connexion',
  templateUrl: './connexion.html',
  styleUrl: './connexion.css'
})
export class Connexion {
  readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly libellesRoles = LIBELLES_ROLES;

  choisir(id: number): void {
    if (this.session.connecter(id)) {
      const retour = cheminDeRetour(this.route.snapshot.queryParamMap.get('returnUrl'));
      // replaceUrl : le bouton Précédent ne ramène pas sur la page de connexion
      this.router.navigateByUrl(retour, { replaceUrl: true });
    }
  }
}

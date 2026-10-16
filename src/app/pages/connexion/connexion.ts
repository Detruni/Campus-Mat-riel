import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
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
  private readonly catalogue = inject(CatalogueService);
  private readonly reservations = inject(ReservationService);

  readonly libellesRoles = LIBELLES_ROLES;
  readonly messageReinitialisation = signal('');

  choisir(id: number): void {
    if (this.session.connecter(id)) {
      const retour = cheminDeRetour(this.route.snapshot.queryParamMap.get('returnUrl'));
      // replaceUrl : le bouton Précédent ne ramène pas sur la page de connexion
      this.router.navigateByUrl(retour, { replaceUrl: true });
    }
  }

  // Pratique pour rejouer le scénario de démonstration depuis le début
  reinitialiser(): void {
    if (!confirm('Remettre le catalogue de départ et supprimer toutes les réservations ?')) return;

    this.catalogue.reinitialiser();
    this.reservations.reinitialiser();
    this.messageReinitialisation.set('Les données de démonstration ont été réinitialisées.');
  }
}

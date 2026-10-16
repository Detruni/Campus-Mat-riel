import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../data/donnees-initiales';
import { SessionService } from '../services/session.service';

// Pages réservées aux utilisateurs connectés (peu importe le rôle)
export const connexionGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.estConnecte()) return true;

  // On garde l'adresse demandée pour pouvoir y revenir après la connexion
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Pages réservées à un rôle précis : étudiant ou responsable
export function roleGuard(role: Role): CanActivateFn {
  return (_, state) => {
    const session = inject(SessionService);
    const router = inject(Router);

    if (!session.estConnecte()) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    return session.utilisateur()?.role === role
      ? true
      : router.parseUrl('/acces-refuse');
  };
}

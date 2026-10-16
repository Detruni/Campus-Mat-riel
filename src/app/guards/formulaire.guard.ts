import { CanDeactivateFn } from '@angular/router';

// Une page qui peut avoir des modifications non enregistrées
export interface PageAvecFormulaire {
  peutQuitter(): boolean;
}

// canDeactivate : avant de quitter le formulaire, on demande confirmation s'il a été modifié
export const formulaireGuard: CanDeactivateFn<PageAvecFormulaire> = page => page.peutQuitter();

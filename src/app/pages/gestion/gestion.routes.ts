import { Routes } from '@angular/router';
import { formulaireGuard } from '../../guards/formulaire.guard';
import { FormulaireEquipement } from './formulaire-equipement/formulaire-equipement';
import { ListeGestion } from './liste-gestion/liste-gestion';

// Routes de l'espace responsable, chargées seulement à la première visite de /gestion
export const GESTION_ROUTES: Routes = [
  { path: '', component: ListeGestion, title: 'Gestion du catalogue - Campus Matériel' },
  // "nouveau" avant ":id/modifier" pour éviter toute confusion entre les deux
  {
    path: 'nouveau',
    component: FormulaireEquipement,
    canDeactivate: [formulaireGuard],
    title: 'Nouvel équipement - Campus Matériel'
  },
  {
    path: ':id/modifier',
    component: FormulaireEquipement,
    canDeactivate: [formulaireGuard],
    title: 'Modifier un équipement - Campus Matériel'
  }
];

import { Routes } from '@angular/router';
import { connexionGuard } from './guards/acces.guard';
import { AccesRefuse } from './pages/acces-refuse/acces-refuse';
import { Catalogue } from './pages/catalogue/catalogue';
import { Connexion } from './pages/connexion/connexion';
import { PageIntrouvable } from './pages/page-introuvable/page-introuvable';

export const routes: Routes = [
  // Le guard du catalogue renvoie vers /login si personne n'est connecté
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
  { path: 'login', component: Connexion, title: 'Connexion - Campus Matériel' },
  {
    path: 'catalogue',
    component: Catalogue,
    canActivate: [connexionGuard],
    title: 'Catalogue - Campus Matériel'
  },
  { path: 'acces-refuse', component: AccesRefuse, title: 'Accès refusé - Campus Matériel' },
  // Toujours en dernier
  { path: '**', component: PageIntrouvable, title: 'Page introuvable - Campus Matériel' }
];

import { Routes } from '@angular/router';
import { connexionGuard, roleGuard } from './guards/acces.guard';
import { AccesRefuse } from './pages/acces-refuse/acces-refuse';
import { PageIntrouvable } from './pages/page-introuvable/page-introuvable';

// Les pages qui affichent le carrousel 3D sont chargées à la demande (loadComponent) :
// Three.js n'est donc pas dans le fichier de démarrage de l'application.
export const routes: Routes = [
  // Le guard du catalogue renvoie vers /login si personne n'est connecté
  { path: '', redirectTo: 'catalogue', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/connexion/connexion').then(m => m.Connexion),
    title: 'Connexion - Campus Matériel'
  },
  {
    path: 'catalogue',
    canActivate: [connexionGuard],
    loadComponent: () => import('./pages/catalogue/catalogue').then(m => m.Catalogue),
    title: 'Catalogue - Campus Matériel'
  },
  {
    path: 'materiels/:id',
    canActivate: [connexionGuard],
    loadComponent: () => import('./pages/fiche-materiel/fiche-materiel').then(m => m.FicheMateriel),
    title: 'Fiche matériel - Campus Matériel'
  },
  {
    path: 'mes-reservations',
    canActivate: [roleGuard('student')],
    loadComponent: () => import('./pages/mes-reservations/mes-reservations').then(m => m.MesReservations),
    title: 'Mes réservations - Campus Matériel'
  },
  {
    // Espace responsable chargé à la demande (lazy loading)
    path: 'gestion',
    canActivate: [roleGuard('manager')],
    loadChildren: () => import('./pages/gestion/gestion.routes').then(m => m.GESTION_ROUTES)
  },
  { path: 'acces-refuse', component: AccesRefuse, title: 'Accès refusé - Campus Matériel' },
  // Toujours en dernier
  { path: '**', component: PageIntrouvable, title: 'Page introuvable - Campus Matériel' }
];

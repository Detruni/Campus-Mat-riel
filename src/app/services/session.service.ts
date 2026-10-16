import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { COMPTES_INITIAUX, Compte, Role } from '../data/donnees-initiales';
import { StockageService } from './stockage.service';

const CLE_SESSION = 'campus-materiel.session';

export const LIBELLES_ROLES: Record<Role, string> = {
  student: 'Étudiant',
  manager: 'Responsable'
};

/**
 * Session simulée : on choisit simplement un compte de démonstration.
 * Il n'y a aucun mot de passe, ce n'est donc pas une vraie sécurité.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly stockage = inject(StockageService);
  private readonly router = inject(Router);

  readonly comptes = COMPTES_INITIAUX;

  private readonly etat = signal<Compte | null>(this.restaurer());
  readonly utilisateur = this.etat.asReadonly();

  readonly estConnecte = computed(() => this.etat() !== null);
  readonly estEtudiant = computed(() => this.etat()?.role === 'student');
  readonly estResponsable = computed(() => this.etat()?.role === 'manager');

  constructor() {
    // Connexion ou déconnexion dans un autre onglet : cet onglet suit le même compte.
    // Les guards ne se relancent pas tout seuls, on renvoie donc vers une page sûre.
    this.stockage.surveiller(CLE_SESSION, () => {
      const avant = this.etat();
      const apres = this.restaurer();
      if (avant?.id === apres?.id) return;
      this.etat.set(apres);
      this.router.navigateByUrl(apres ? '/catalogue' : '/login', { replaceUrl: true });
    });
  }

  connecter(id: number): boolean {
    const compte = this.comptes.find(c => c.id === id);
    if (!compte) return false;

    this.etat.set(compte);
    // On ne garde que l'id : le compte est retrouvé dans la liste au rechargement
    this.stockage.ecrire(CLE_SESSION, compte.id);
    return true;
  }

  deconnecter(): void {
    this.etat.set(null);
    this.stockage.supprimer(CLE_SESSION);
    // Les guards ne se relancent pas quand le signal change,
    // il faut donc quitter la page privée nous-mêmes.
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private restaurer(): Compte | null {
    const id = this.stockage.lire<number | null>(
      CLE_SESSION,
      null,
      (v): v is number | null => v === null || typeof v === 'number'
    );
    return this.comptes.find(c => c.id === id) ?? null;
  }
}

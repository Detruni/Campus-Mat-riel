import { Injectable, signal } from '@angular/core';

/**
 * Centralise les accès au localStorage.
 * Les autres services passent par ici pour ne pas répéter les try/catch
 * et pour qu'un problème de stockage soit affiché à l'utilisateur.
 */
@Injectable({ providedIn: 'root' })
export class StockageService {
  private readonly etatErreur = signal<string | null>(null);
  readonly erreur = this.etatErreur.asReadonly();

  /**
   * Lit une valeur enregistrée.
   * Si la clé n'existe pas encore, on part d'une copie des données initiales.
   * Attention : un tableau vide enregistré est une vraie donnée, on le garde.
   */
  lire<T>(cle: string, initial: T, estValide: (valeur: unknown) => valeur is T): T {
    if (typeof window === 'undefined') return structuredClone(initial);

    try {
      const brut = localStorage.getItem(cle);
      if (brut === null) return structuredClone(initial);

      const valeur: unknown = JSON.parse(brut);
      if (estValide(valeur)) return valeur;

      this.etatErreur.set(
        'Les données enregistrées sont abîmées : les données de départ ont été rechargées.'
      );
    } catch {
      this.etatErreur.set(
        'Impossible de lire les données enregistrées : les données de départ sont utilisées.'
      );
    }
    return structuredClone(initial);
  }

  ecrire(cle: string, valeur: unknown): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(cle, JSON.stringify(valeur));
    } catch {
      // Stockage plein ou bloqué par le navigateur (navigation privée par exemple)
      this.etatErreur.set(
        "L'enregistrement local a échoué : vos dernières modifications seront perdues au rechargement."
      );
    }
  }

  supprimer(cle: string): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(cle);
    } catch {
      this.etatErreur.set("Impossible de supprimer la donnée enregistrée.");
    }
  }

  fermerErreur(): void {
    this.etatErreur.set(null);
  }
}

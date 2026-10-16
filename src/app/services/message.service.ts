import { Injectable, signal } from '@angular/core';
import { Resultat } from './resultat';

/**
 * Permet à une page de laisser un message à la page suivante.
 * Exemple : le formulaire enregistre un équipement, puis la liste de gestion affiche « … a été modifié ».
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  private readonly enAttente = signal<Resultat | null>(null);

  transmettre(message: Resultat): void {
    this.enAttente.set(message);
  }

  // Renvoie le message en attente et le retire, pour qu'il ne s'affiche qu'une fois
  recuperer(): Resultat | null {
    const message = this.enAttente();
    this.enAttente.set(null);
    return message;
  }
}

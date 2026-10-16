import { Component, computed, inject, signal } from '@angular/core';
import { CarteEquipement } from '../../components/carte-equipement/carte-equipement';
import { CATEGORIES } from '../../data/donnees-initiales';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
import { Resultat } from '../../services/resultat';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-catalogue',
  imports: [CarteEquipement],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css'
})
export class Catalogue {
  readonly catalogue = inject(CatalogueService);
  readonly reservations = inject(ReservationService);
  readonly session = inject(SessionService);

  readonly categories = CATEGORIES;

  readonly recherche = signal('');
  readonly categorie = signal('');
  readonly message = signal<Resultat | null>(null);

  // La liste affichée est recalculée dès que la recherche, le filtre ou le catalogue changent
  readonly equipementsVisibles = computed(() => {
    const texte = this.recherche().trim().toLocaleLowerCase();
    const categorie = this.categorie();

    return this.catalogue.equipements().filter(e =>
      e.nom.toLocaleLowerCase().includes(texte)
      && (categorie === '' || e.categorie === categorie)
    );
  });

  // Appelé quand une carte émet "reserver"
  reserver(equipementId: number): void {
    this.message.set(this.reservations.reserver(equipementId));
  }

  estReserveParMoi(equipementId: number): boolean {
    return this.reservations.mesReservations().some(r => r.equipementId === equipementId);
  }

  effacerFiltres(): void {
    this.recherche.set('');
    this.categorie.set('');
  }
}

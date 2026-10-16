import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { Carrousel3d } from '../../components/carrousel-3d/carrousel-3d';
import { CATEGORIES, Categorie } from '../../data/donnees-initiales';
import { CatalogueService } from '../../services/catalogue.service';
import { ReservationService } from '../../services/reservation.service';
import { Resultat } from '../../services/resultat';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-catalogue',
  imports: [Carrousel3d],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.css'
})
export class Catalogue {
  readonly catalogue = inject(CatalogueService);
  readonly reservations = inject(ReservationService);
  readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = CATEGORIES;

  // Les filtres sont lus dans l'URL (?q=...&categorie=...) :
  // on peut recharger la page ou partager le lien sans les perdre.
  readonly recherche = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('q') ?? '')),
    { initialValue: '' }
  );
  readonly categorie = toSignal(
    this.route.queryParamMap.pipe(map(p => {
      const valeur = p.get('categorie') ?? '';
      // Une catégorie inconnue dans l'URL est simplement ignorée
      return CATEGORIES.includes(valeur as Categorie) ? valeur : '';
    })),
    { initialValue: '' }
  );
  readonly message = signal<Resultat | null>(null);

  // Ids des équipements réservés par l'étudiant connecté
  readonly mesIds = computed(() => new Set(this.reservations.mesReservations().map(r => r.equipementId)));

  // La liste affichée est recalculée dès que la recherche, le filtre ou le catalogue changent
  readonly equipementsVisibles = computed(() => {
    const texte = this.recherche().trim().toLocaleLowerCase();
    const categorie = this.categorie();

    return this.catalogue.equipements().filter(e =>
      e.nom.toLocaleLowerCase().includes(texte)
      && (categorie === '' || e.categorie === categorie)
    );
  });

  // Nombre d'équipements par catégorie, affiché dans la liste déroulante
  readonly compteurs = computed(() => {
    const compteurs: Partial<Record<Categorie, number>> = {};
    for (const e of this.catalogue.equipements()) {
      compteurs[e.categorie] = (compteurs[e.categorie] ?? 0) + 1;
    }
    return compteurs;
  });

  changerFiltres(filtres: { q?: string | null; categorie?: string | null }): void {
    // null retire le paramètre de l'URL ; replaceUrl évite une entrée d'historique à chaque lettre
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filtres,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  // Appelé quand le carrousel émet "reserver"
  reserver(equipementId: number): void {
    this.message.set(this.reservations.reserver(equipementId));
  }


  effacerFiltres(): void {
    this.changerFiltres({ q: null, categorie: null });
  }
}

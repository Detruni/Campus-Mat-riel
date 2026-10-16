import {
  Component, ElementRef, OnDestroy, afterNextRender, computed, effect, inject, input, output, signal, untracked, viewChild
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Categorie, Equipement } from '../../data/donnees-initiales';
import { BadgeDisponibilite } from '../badge-disponibilite/badge-disponibilite';
import { ElementCarrousel, SceneCarrousel } from './scene-carrousel';

// Couleurs du fond de la scène selon la catégorie de l'équipement affiché.
// Elles sont choisies pour contraster avec la couleur de la pochette (violet sur orange, etc.)
const FONDS: Record<Categorie, [string, string]> = {
  Informatique: ['#ff9a3d', '#f6a6c8'],
  Projection: ['#8f8cff', '#c9b6ff'],
  Photo: ['#f0442b', '#ff9f1c'],
  Audio: ['#f07ab8', '#b58cff']
};

/**
 * Carrousel du catalogue : les équipements défilent en 3D, celui du milieu est mis en avant.
 * Comme la carte d'équipement, il ne réserve rien lui-même : il émet "reserver" vers le parent.
 */
@Component({
  selector: 'app-carrousel-3d',
  imports: [RouterLink, BadgeDisponibilite],
  templateUrl: './carrousel-3d.html',
  styleUrl: './carrousel-3d.css'
})
export class Carrousel3d implements OnDestroy {
  readonly equipements = input.required<Equipement[]>();
  readonly reserves = input.required<Set<number>>();
  readonly mesReservations = input<Set<number>>(new Set());
  readonly peutReserver = input(false);

  readonly reserver = output<number>();

  private readonly zoneScene = viewChild.required<ElementRef<HTMLDivElement>>('scene');
  private readonly router = inject(Router);
  private scene?: SceneCarrousel;

  readonly indice = signal(0);
  readonly webglIndisponible = signal(false);

  readonly courant = computed(() => this.equipements()[this.indice()]);
  readonly fond = computed(() => FONDS[this.courant()?.categorie ?? 'Informatique']);

  private readonly elements = computed<ElementCarrousel[]>(() =>
    this.equipements().map(e => ({
      id: e.id,
      nom: e.nom,
      categorie: e.categorie,
      disponible: !this.reserves().has(e.id)
    }))
  );

  constructor() {
    afterNextRender(() => {
      try {
        this.scene = new SceneCarrousel(this.zoneScene().nativeElement, {
          aller: indice => this.aller(indice),
          ouvrir: id => this.router.navigate(['/materiels', id])
        });
      } catch {
        // Pas de WebGL : on garde la capsule et les boutons, sans la 3D
        this.webglIndisponible.set(true);
        return;
      }
      // On attend la police des pastilles avant de dessiner les textures
      document.fonts.load('800 64px "Libre Franklin"')
        .catch(() => undefined)
        .finally(() => this.scene?.afficher(this.elements(), this.indice()));
    });

    // Recherche, filtre ou réservation : on redessine les pochettes
    effect(() => {
      const elements = this.elements();
      // Si la liste a raccourci, on revient sur un élément qui existe
      const indice = Math.min(untracked(this.indice), Math.max(elements.length - 1, 0));
      this.indice.set(indice);
      this.scene?.afficher(elements, indice);
    });
  }

  ngOnDestroy(): void {
    this.scene?.detruire();
  }

  aller(indice: number): void {
    const max = this.equipements().length - 1;
    const nouvel = Math.min(Math.max(indice, 0), max);
    this.indice.set(nouvel);
    this.scene?.allerA(nouvel);
  }

  precedent(): void {
    this.aller(this.indice() - 1);
  }

  suivant(): void {
    this.aller(this.indice() + 1);
  }

  clavier(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.precedent();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.suivant();
    } else if (e.key === 'Enter' && this.courant()) {
      this.router.navigate(['/materiels', this.courant().id]);
    }
  }

  // Seul le défilement horizontal (pavé tactile) change d'équipement : la page reste défilable
  private dernierDefilement = 0;
  molette(e: WheelEvent): void {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 20) return;
    e.preventDefault();
    const maintenant = Date.now();
    if (maintenant - this.dernierDefilement < 450) return;
    this.dernierDefilement = maintenant;
    if (e.deltaX > 0) this.suivant();
    else this.precedent();
  }

  numero(n: number): string {
    return String(n).padStart(2, '0');
  }
}

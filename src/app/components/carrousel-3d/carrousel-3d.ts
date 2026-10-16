import {
  Component, ElementRef, OnDestroy, afterNextRender, effect, inject, input, output, signal, viewChild
} from '@angular/core';
import { AmbianceService } from '../../services/ambiance.service';
import { ElementCarrousel, SceneCarrousel } from './scene-carrousel';

/**
 * Carrousel en plein écran, utilisé par plusieurs pages (connexion, catalogue, réservations...).
 * Il affiche les pochettes en 3D et la navigation ; le contenu de la capsule et la zone
 * du haut (filtres, messages) sont fournis par la page avec <ng-content>.
 *
 * L'indice est piloté par la page : [(indice)]="indice" (input "indice" + output "indiceChange").
 */
@Component({
  selector: 'app-carrousel-3d',
  templateUrl: './carrousel-3d.html',
  styleUrl: './carrousel-3d.css'
})
export class Carrousel3d implements OnDestroy {
  readonly elements = input.required<ElementCarrousel[]>();
  readonly indice = input.required<number>();
  readonly libelle = input('Carrousel');
  // Sur une page à un seul élément (la fiche), on masque les flèches
  readonly navigation = input(true);

  readonly indiceChange = output<number>();
  readonly ouvrir = output<number>();

  private readonly zoneScene = viewChild.required<ElementRef<HTMLDivElement>>('scene');
  private readonly ambiance = inject(AmbianceService);
  private scene?: SceneCarrousel;

  readonly webglIndisponible = signal(false);

  constructor() {
    afterNextRender(() => {
      try {
        this.scene = new SceneCarrousel(this.zoneScene().nativeElement, {
          aller: indice => this.aller(indice),
          ouvrir: indice => this.ouvrir.emit(indice)
        });
      } catch {
        // Pas de WebGL : la capsule et les boutons restent utilisables, sans la 3D
        this.webglIndisponible.set(true);
        return;
      }
      // On attend la police des pastilles avant de dessiner les textures
      document.fonts.load('800 64px "Libre Franklin"')
        .catch(() => undefined)
        .finally(() => this.scene?.afficher(this.elements(), this.indice()));
    });

    // La liste a changé (filtre, réservation...) : on redessine les pochettes
    effect(() => {
      const elements = this.elements();
      const indice = Math.min(this.indice(), Math.max(elements.length - 1, 0));
      if (indice !== this.indice()) this.indiceChange.emit(indice);
      this.scene?.afficher(elements, indice);
    });

    // L'indice a changé : la scène glisse jusqu'à la bonne pochette et le fond change de couleur
    effect(() => {
      const indice = this.indice();
      this.scene?.allerA(indice);
      const element = this.elements()[indice];
      if (element) this.ambiance.definir(element.fond);
    });
  }

  ngOnDestroy(): void {
    this.scene?.detruire();
  }

  aller(indice: number): void {
    const max = this.elements().length - 1;
    const nouvel = Math.min(Math.max(indice, 0), max);
    if (nouvel !== this.indice()) this.indiceChange.emit(nouvel);
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
    } else if (e.key === 'Enter' && this.elements().length > 0) {
      this.ouvrir.emit(this.indice());
    }
  }

  // Seul le défilement horizontal (pavé tactile) change d'élément : la page reste défilable
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
}

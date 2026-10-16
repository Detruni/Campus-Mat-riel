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
  private readonly zoneCapsule = viewChild.required<ElementRef<HTMLDivElement>>('capsule');
  private readonly zoneHaut = viewChild.required<ElementRef<HTMLDivElement>>('haut');
  private readonly zoneBas = viewChild.required<ElementRef<HTMLDivElement>>('bas');
  // Surveille la taille des zones de texte pour recadrer la 3D (message qui apparaît, etc.)
  private observateur?: ResizeObserver;
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
        .finally(() => {
          this.scene?.afficher(this.elements());
          this.scene?.allerA(this.indice(), true);
        });

      this.observateur = new ResizeObserver(() => this.cadrer());
      for (const zone of [this.zoneScene(), this.zoneHaut(), this.zoneBas()]) {
        this.observateur.observe(zone.nativeElement);
      }
      this.cadrer();
    });

    // La liste a changé (filtre, réservation...) : on redessine les pochettes.
    // Cet effet ne lit que la liste : un simple changement d'indice ne reconstruit pas
    // les pochettes (sinon elles sauteraient à leur place au lieu de glisser).
    effect(() => {
      const elements = this.elements();
      this.scene?.afficher(elements);
    });

    // L'indice a changé : la scène glisse jusqu'à la bonne pochette et le fond change de couleur
    effect(() => {
      const elements = this.elements();
      // Si la liste a raccourci (filtre, annulation...), on revient sur un élément qui existe
      const indice = Math.min(this.indice(), Math.max(elements.length - 1, 0));
      if (indice !== this.indice()) {
        this.indiceChange.emit(indice);
        return;
      }
      this.scene?.allerA(indice);
      const element = elements[indice];
      if (element) this.ambiance.definir(element.fond);
      this.animerCapsule();
    });
  }

  ngOnDestroy(): void {
    this.observateur?.disconnect();
    this.scene?.detruire();
  }

  // Indique à la scène l'espace libre entre la zone du haut et la capsule,
  // pour que la pochette du centre ne soit jamais cachée par du texte.
  private cadrer(): void {
    const scene = this.zoneScene().nativeElement.getBoundingClientRect();
    const bas = this.zoneBas().nativeElement;

    // Sur mobile les textes sont au-dessus et en dessous de la scène : tout le canvas est libre
    if (getComputedStyle(bas).position !== 'absolute') {
      this.scene?.cadrer(0, scene.height);
      return;
    }

    const marge = 16;
    const haut = this.zoneHaut().nativeElement.getBoundingClientRect();
    this.scene?.cadrer(haut.bottom - scene.top + marge, bas.getBoundingClientRect().top - scene.top - marge);
  }

  // Le texte de la capsule glisse et apparaît à chaque changement d'élément
  private animerCapsule(): void {
    const capsule = this.zoneCapsule().nativeElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    capsule.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );
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

  // Molette (verticale ou horizontale) : le carrousel défile comme sur un site de pochettes d'albums.
  // Sur mobile la page est empilée, on laisse donc la molette faire défiler la page.
  private dernierDefilement = 0;
  molette(e: WheelEvent): void {
    if (matchMedia('(max-width: 760px)').matches) return;

    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    // deltaMode 1 = défilement en lignes (certaines souris) : on le convertit en pixels
    const pixels = e.deltaMode === 1 ? delta * 40 : delta;

    if (this.scene) {
      if (this.scene.defiler(pixels)) e.preventDefault();
      return;
    }

    // Sans 3D : un cran de molette = un élément
    if (Math.abs(pixels) < 10) return;
    e.preventDefault();
    const maintenant = Date.now();
    if (maintenant - this.dernierDefilement < 400) return;
    this.dernierDefilement = maintenant;
    if (pixels > 0) this.suivant();
    else this.precedent();
  }
}

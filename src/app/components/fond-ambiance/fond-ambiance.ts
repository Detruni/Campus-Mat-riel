import { Component, inject } from '@angular/core';
import { AmbianceService } from '../../services/ambiance.service';

// Grand fond coloré derrière toute l'application (purement décoratif)
@Component({
  selector: 'app-fond-ambiance',
  template: '',
  host: {
    'aria-hidden': 'true',
    '[style.--fond-a]': 'ambiance.couleurs()[0]',
    '[style.--fond-b]': 'ambiance.couleurs()[1]'
  },
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;
      /* Les couleurs glissent d'une ambiance à l'autre grâce à @property (styles.css) */
      transition: --fond-a 0.9s ease, --fond-b 0.9s ease;
      background: radial-gradient(circle at 50% 46%,
        var(--fond-b) 0 14%,
        var(--fond-a) 28%,
        var(--fond-b) 44%,
        var(--fond-a) 60%,
        var(--fond-b) 78%,
        var(--fond-a) 100%);
    }

    /* Grain léger par-dessus, pour un rendu papier imprimé */
    :host::after {
      content: "";
      position: absolute;
      inset: 0;
      opacity: 0.3;
      mix-blend-mode: multiply;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    }
  `
})
export class FondAmbiance {
  readonly ambiance = inject(AmbianceService);
}

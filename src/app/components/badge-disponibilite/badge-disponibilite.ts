import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge-disponibilite',
  template: `
    @if (disponible()) {
      <span class="badge badge-disponible">Disponible</span>
    } @else {
      <span class="badge badge-reserve">Réservé</span>
    }
  `,
  styles: `
    .badge-disponible {
      background: var(--succes-fond);
      border-color: var(--succes);
      color: var(--succes);
    }
    .badge-reserve {
      background: var(--danger-fond);
      border-color: var(--danger);
      color: var(--danger);
    }
  `
})
export class BadgeDisponibilite {
  readonly disponible = input.required<boolean>();
}

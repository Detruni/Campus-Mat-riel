import { ValidatorFn } from '@angular/forms';

// Validators.required accepte "   " : ici on ignore les espaces au début et à la fin
export const obligatoire: ValidatorFn = control =>
  String(control.value ?? '').trim().length > 0 ? null : { obligatoire: true };

// Longueur minimale, espaces de début et de fin non comptés.
// Un champ vide est laissé au validateur "obligatoire" pour ne pas afficher deux messages.
export function longueurMin(min: number): ValidatorFn {
  return control => {
    const longueur = String(control.value ?? '').trim().length;
    return longueur === 0 || longueur >= min ? null : { longueurMin: { min, actuelle: longueur } };
  };
}

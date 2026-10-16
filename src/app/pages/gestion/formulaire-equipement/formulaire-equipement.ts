import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, Categorie } from '../../../data/donnees-initiales';
import { PageAvecFormulaire } from '../../../guards/formulaire.guard';
import { CatalogueService, DonneesEquipement } from '../../../services/catalogue.service';
import { MessageService } from '../../../services/message.service';
import { Resultat } from '../../../services/resultat';
import { longueurMin, obligatoire } from './validateurs';

type Champ = 'nom' | 'categorie' | 'description' | 'localisation';

const LIBELLES: Record<Champ, string> = {
  nom: 'Le nom',
  categorie: 'La catégorie',
  description: 'La description',
  localisation: 'La localisation'
};

/**
 * Un seul formulaire pour la création et la modification :
 * - /gestion/nouveau       -> pas d'id, on crée
 * - /gestion/:id/modifier  -> id fourni par le routeur, on pré-remplit et on modifie
 */
@Component({
  selector: 'app-formulaire-equipement',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './formulaire-equipement.html',
  styleUrl: './formulaire-equipement.css'
})
export class FormulaireEquipement implements OnInit, PageAvecFormulaire {
  readonly id = input<string>();

  private readonly catalogue = inject(CatalogueService);
  private readonly router = inject(Router);
  private readonly messages = inject(MessageService);

  readonly categories = CATEGORIES;
  readonly enModification = computed(() => this.id() !== undefined);
  readonly introuvable = signal(false);
  readonly erreurEnvoi = signal(false);

  readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [obligatoire, longueurMin(3)]
    }),
    categorie: new FormControl<Categorie | ''>('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [obligatoire, longueurMin(10)]
    }),
    localisation: new FormControl('', {
      nonNullable: true,
      validators: [obligatoire]
    })
  });

  ngOnInit(): void {
    const id = this.id();
    if (id === undefined) return;

    const equipement = /^\d+$/.test(id) ? this.catalogue.trouver(Number(id)) : undefined;
    if (!equipement) {
      this.introuvable.set(true);
      return;
    }

    // Mode modification : on remplit le formulaire avec la fiche existante
    this.form.setValue({
      nom: equipement.nom,
      categorie: equipement.categorie,
      description: equipement.description,
      localisation: equipement.localisation
    });
  }

  // Message à afficher sous un champ, seulement après que l'utilisateur l'a quitté
  messageErreur(champ: Champ): string | null {
    const control = this.form.controls[champ];
    if (!control.touched || control.valid) return null;

    if (control.hasError('obligatoire') || control.hasError('required')) {
      return `${LIBELLES[champ]} est obligatoire.`;
    }
    const min = control.getError('longueurMin')?.min;
    if (min) {
      return `${LIBELLES[champ]} doit contenir au moins ${min} caractères.`;
    }
    return `${LIBELLES[champ]} n'est pas valide.`;
  }

  // Passe à true après un enregistrement réussi : on peut alors quitter sans confirmation
  private enregistre = false;

  // Appelé par formulaireGuard quand on essaie de quitter la page
  peutQuitter(): boolean {
    if (this.enregistre || !this.form.dirty) return true;
    return confirm('Les modifications de ce formulaire ne sont pas enregistrées. Quitter quand même ?');
  }

  enregistrer(): void {
    if (this.form.invalid) {
      // On affiche toutes les erreurs ; les valeurs saisies restent dans le formulaire
      this.form.markAllAsTouched();
      this.erreurEnvoi.set(true);
      return;
    }
    this.erreurEnvoi.set(false);

    const valeurs = this.form.getRawValue();
    const donnees: DonneesEquipement = {
      nom: valeurs.nom.trim(),
      categorie: valeurs.categorie as Categorie,
      description: valeurs.description.trim(),
      localisation: valeurs.localisation.trim()
    };

    let message: Resultat;
    const id = this.id();
    if (id !== undefined) {
      const ok = this.catalogue.modifier(Number(id), donnees);
      message = ok
        ? { ok: true, message: `« ${donnees.nom} » a été modifié.` }
        : { ok: false, message: "La modification a échoué : l'équipement n'existe plus." };
    } else {
      const cree = this.catalogue.ajouter(donnees);
      message = { ok: true, message: `« ${cree.nom} » a été ajouté au catalogue (id ${cree.id}).` };
    }

    // Le message est confié au MessageService, la liste de gestion l'affichera
    this.messages.transmettre(message);
    this.enregistre = true;
    this.router.navigate(['/gestion']);
  }
}

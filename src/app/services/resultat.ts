// Réponse renvoyée par les actions des services (réserver, annuler, supprimer...)
// pour que la page puisse afficher un message clair à l'utilisateur.
export interface Resultat {
  ok: boolean;
  message: string;
}

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const ruolo = localStorage.getItem('ruolo');

  if (ruolo === "ADMIN") {
    return true; // È un amministratore, può passare
  } else {
    router.navigate(['/Home']); // Un utente normale viene rimandato in Home
    return false;
  }
};

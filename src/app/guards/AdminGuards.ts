import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const ruolo = localStorage.getItem('ruolo');

  if (ruolo === "ADMIN") {
    return true;
  } else {
    router.navigate(['/Home']);
    return false;
  }
};

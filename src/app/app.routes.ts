import { Routes } from '@angular/router';
import { authGuard } from './guards/AuthGuards';
import { adminGuard } from './guards/AdminGuards';

import { HomeComponent } from './pages/Home/HomeComponent';
import { LoginComponent } from './pages/Login/LoginComponent';
import { ProfiloComponent } from './pages/Profilo/ProfiloComponent';
import { GaraComponent } from './pages/Gara/GaraComponent';
import { PreferitiComponent } from './pages/Preferiti/PreferitiComponent';
import { AdminComponent } from './pages/Admin/admincomponent';

export const routes: Routes = [
  // Ora component punta alla CLASSE del componente, non alla tastiera!
  { path: 'Home', component: HomeComponent },
  { path: 'Login', component: LoginComponent },

  // Rotte protette dal Login
  { path: 'Profilo', component: ProfiloComponent, canActivate: [authGuard] },
  { path: 'Gara', component: GaraComponent, canActivate: [authGuard] },
  { path: 'Preferiti', component: PreferitiComponent, canActivate: [authGuard] },

  // Rotta protetta solo per l'Admin
  { path: 'AdminPanel', component: AdminComponent, canActivate: [authGuard, adminGuard] },

  // Default redirect
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  // Fallback per pagine inesistenti (opzionale)
  { path: '**', redirectTo: '/Home' }
];

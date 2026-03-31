import { Routes } from '@angular/router';

// Guard di sicurezza
import { authGuard } from './guards/AuthGuards';
import { adminGuard } from './guards/AdminGuards';

// Componenti delle pagine
import { HomeComponent } from './pages/Home/HomeComponent';
import { LoginComponent } from './pages/Login/LoginComponent';
import { RegistrazioneComponent } from './pages/Registrazione/RegistrazioneComponent';
import { ProfiloComponent } from './pages/Profilo/ProfiloComponent';
import { ConfrontoComponent } from './pages/Confronto/ConfrontoComponent';
import { PreferitiComponent } from './pages/Preferiti/PreferitiComponent';
import { AdminComponent } from './pages/Admin/AdminComponent';

export const routes: Routes = [
  // --- ROTTE PUBBLICHE (Accessibili a tutti) ---
  { path: 'Home', component: HomeComponent },
  { path: 'Login', component: LoginComponent },
  { path: 'Registrazione', component: RegistrazioneComponent },

  // --- ROTTE PROTETTE (Richiedono Login) ---
  {
    path: 'Profilo',
    component: ProfiloComponent,
    canActivate: [authGuard]
  },
  {
    path: 'Confronto',
    component: ConfrontoComponent,
    canActivate: [authGuard]
  },
  {
    path: 'Preferiti',
    component: PreferitiComponent,
    canActivate: [authGuard]
  },

  // --- ROTTE ADMIN (Richiedono Login + Ruolo ADMIN) ---
  {
    path: 'AdminPanel',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard]
  },

  // --- REDIRECT E FALLBACK ---
  // Se l'URL è vuoto, vai in Home
  { path: '', redirectTo: '/Home', pathMatch: 'full' },

  // Se l'URL non esiste (404), rimanda in Home
  { path: '**', redirectTo: '/Home' }
];

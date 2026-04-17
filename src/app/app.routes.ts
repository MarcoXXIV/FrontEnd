import { Routes } from '@angular/router';

import { authGuard } from './guards/AuthGuards';
import { adminGuard } from './guards/AdminGuards';

import { HomeComponent } from './pages/Home/HomeComponent';
import { LoginComponent } from './pages/Login/LoginComponent';
import { RegistrazioneComponent } from './pages/Registrazione/RegistrazioneComponent';
import { ProfiloComponent } from './pages/Profilo/ProfiloComponent';
import { ConfrontoComponent } from './pages/Confronto/ConfrontoComponent';
import { PreferitiComponent } from './pages/Preferiti/PreferitiComponent';
import { AdminComponent } from './pages/Admin/AdminComponent';
import { InfoAutoComponent } from './pages/InfoAuto/InfoAutoComponent';

export const routes: Routes = [
  {
    path: 'Home',
    component: HomeComponent,
    data: { navbarMode: 'default' },
  },
  {
    path: 'Login',
    component: LoginComponent,
    data: { navbarMode: 'accedere' },
  },
  {
    path: 'Registrazione',
    component: RegistrazioneComponent,
    data: { navbarMode: 'accedere' },
  },
  {
    path: 'info-auto/:id',
    component: InfoAutoComponent,
    data: { navbarMode: 'default' },
  },
  {
    path: 'Profilo',
    component: ProfiloComponent,
    canActivate: [authGuard],
    data: { navbarMode: 'Profilo' },
  },
  {
    path: 'Confronto',
    component: ConfrontoComponent,
    canActivate: [authGuard],
    data: { navbarMode: 'default' },
  },
  {
    path: 'Preferiti',
    component: PreferitiComponent,
    canActivate: [authGuard],
    data: { navbarMode: 'preferiti' },
  },
  {
    path: 'Admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
    data: { navbarMode: 'admin' },
  },
  { path: '', redirectTo: '/Home', pathMatch: 'full' },
  { path: '**', redirectTo: '/Home' },
];

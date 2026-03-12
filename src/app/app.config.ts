import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core'; // provideZoneChangeDetection è standard ora
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // <-- AGGIUNGI QUESTO

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideBrowserGlobalErrorListeners()
  ]
};

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, filter, take } from 'rxjs';

import { AuthService } from '../../services/AuthService';
import { NavbarActionService } from '../../services/NavbarActionService';
import { RecensioniService } from '../../services/RecensioniService';
import { PreferitiService } from '../../services/PreferitiService';
import { ConfrontoService } from '../../services/ConfrontoService';

type AdminSection = 'nuova-auto' | 'utenti' | 'gestione-auto';
type NavbarMode = 'default' | 'Profilo' | 'empty' | 'admin' | 'preferiti' | 'accedere';
type ToastType = 'success' | 'error';

type QuickActionId =
  | 'home'
  | 'profilo'
  | 'preferiti'
  | 'svuota-preferiti'
  | 'admin'
  | 'logout'
  | 'login'
  | 'reset-cronologia'
  | 'reset-recensioni'
  | 'nuova-auto'
  | 'utenti'
  | 'gestione-auto';

interface QuickAction {
  id: QuickActionId;
  icon: string;
  label: string;
  active?: boolean;
  variant?: 'default' | 'accent' | 'danger';
  sticker?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './NavbarComponent.html',
  styleUrls: ['./NavbarComponent.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  loggedIn = false;
  admin = false;
  navbarMode: NavbarMode = 'default';
  adminSection: AdminSection = 'nuova-auto';

  showToast = false;
  toastMsg = '';
  toastType: ToastType = 'success';

  private routerSub?: Subscription;
  private toastTimeout?: ReturnType<typeof setTimeout>;
  private toastRestartTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private navbarActionService: NavbarActionService,
    private recensioniService: RecensioniService,
    private preferitiService: PreferitiService,
    private confrontoService: ConfrontoService,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.aggiornaStato();
    this.aggiornaNavbarMode();

    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.aggiornaStato();
        this.aggiornaNavbarMode();
      });

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.syncAuthState);
    }
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();

    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.syncAuthState);
    }

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    if (this.toastRestartTimeout) {
      clearTimeout(this.toastRestartTimeout);
    }
  }

  private syncAuthState = (): void => {
    this.aggiornaStato();
    this.aggiornaNavbarMode();
  };

  private triggerToast(msg: string, type: ToastType = 'success', duration: number = 3500): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    if (this.toastRestartTimeout) {
      clearTimeout(this.toastRestartTimeout);
    }

    this.showToast = false;
    this.toastMsg = msg;
    this.toastType = type;
    this.cd.detectChanges();

    this.toastRestartTimeout = setTimeout(() => {
      this.showToast = true;
      this.cd.detectChanges();

      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
        this.cd.detectChanges();
      }, duration);
    }, 35);
  }

  private confirmAction(confirmMessage: string, action: () => void): void {
    const conferma = confirm(confirmMessage);

    if (!conferma) {
      return;
    }

    try {
      action();
    } catch (error) {
      console.error('Errore durante l’azione:', error);
      this.triggerToast('Si è verificato un errore durante l’operazione.', 'error');
    }
  }

  private refreshCurrentRoute(): void {
    const currentUrl = this.router.url;

    this.router.navigateByUrl('/Home', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }

  private extractNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    if (value == null) return 0;

    return (
      Number(value.count ?? value.total ?? value.totale ?? value.data ?? value.value ?? 0) || 0
    );
  }

  aggiornaStato(): void {
    this.loggedIn = this.authService.isLoggedIn();
    this.admin = localStorage.getItem('ruolo') === 'ADMIN';
  }

  aggiornaNavbarMode(): void {
    let route = this.activatedRoute.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.navbarMode = (route.snapshot.data['navbarMode'] || 'default') as NavbarMode;

    const section = route.snapshot.queryParamMap.get('section');
    if (section === 'nuova-auto' || section === 'utenti' || section === 'gestione-auto') {
      this.adminSection = section;
    } else {
      this.adminSection = 'nuova-auto';
    }
  }

  isAdmin(): boolean {
    return this.admin;
  }

  isProfileNavbar(): boolean {
    return this.loggedIn && this.navbarMode === 'Profilo';
  }

  isPreferitiNavbar(): boolean {
    return this.loggedIn && this.navbarMode === 'preferiti';
  }

  isEmptyNavbar(): boolean {
    return this.navbarMode === 'empty';
  }

  isAdminNavbar(): boolean {
    return this.loggedIn && this.admin && this.navbarMode === 'admin';
  }

  isDefaultNavbar(): boolean {
    return this.loggedIn && this.navbarMode === 'default';
  }

  isOnHome(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/Home');
  }

  isOnProfilo(): boolean {
    return this.router.url.startsWith('/Profilo');
  }

  isOnPreferiti(): boolean {
    return this.router.url.startsWith('/Preferiti');
  }

  isOnAdmin(): boolean {
    return this.router.url.startsWith('/Admin');
  }

  isOnLogin(): boolean {
    return this.router.url.startsWith('/Login');
  }

  isAdminSection(section: AdminSection): boolean {
    return this.adminSection === section;
  }

  shouldShowBottomMobileNavbar(): boolean {
    return !this.isEmptyNavbar();
  }

  getGuestDesktopLeftActions(): QuickAction[] {
    if (this.isEmptyNavbar()) {
      return [];
    }

    return [
      {
        id: 'home',
        icon: '🏠',
        label: 'Home',
        active: this.isOnHome(),
      },
    ];
  }

  getGuestDesktopRightActions(): QuickAction[] {
    if (this.isEmptyNavbar()) {
      return [];
    }

    return [
      {
        id: 'preferiti',
        icon: '❤️',
        label: 'Preferiti',
        active: false,
      },
      {
        id: 'profilo',
        icon: '👤',
        label: 'Profilo',
        active: false,
      },
    ];
  }

  getDesktopLeftActions(): QuickAction[] {
    if (this.isEmptyNavbar()) {
      return [];
    }

    if (!this.loggedIn) {
      return this.getGuestDesktopLeftActions();
    }

    return [
      {
        id: 'home',
        icon: '🏠',
        label: 'Home',
        active: this.isOnHome(),
      },
    ];
  }

  getDesktopRightActions(): QuickAction[] {
    if (this.isEmptyNavbar()) {
      return [];
    }

    if (!this.loggedIn) {
      return this.getGuestDesktopRightActions();
    }

    if (this.isAdminNavbar()) {
      return [
        {
          id: 'nuova-auto',
          icon: '➕',
          label: 'Aggiungi auto',
          active: this.isAdminSection('nuova-auto'),
          variant: 'accent',
        },
        {
          id: 'utenti',
          icon: '👥',
          label: 'Gestione utenti',
          active: this.isAdminSection('utenti'),
        },
        {
          id: 'gestione-auto',
          icon: '🚗',
          label: 'Gestione auto',
          active: this.isAdminSection('gestione-auto'),
        },
        {
          id: 'logout',
          icon: '🚪',
          label: 'Esci',
          variant: 'danger',
        },
      ];
    }

    if (this.isProfileNavbar()) {
      const actions: QuickAction[] = [
        {
          id: 'preferiti',
          icon: '❤️',
          label: 'Preferiti',
          active: this.isOnPreferiti(),
        },
        {
          id: 'reset-cronologia',
          icon: '🧹',
          label: 'Pulisci cronologia',
        },
        {
          id: 'reset-recensioni',
          icon: '⭐',
          label: 'Rimuovi recensioni',
        },
      ];

      if (this.isAdmin()) {
        actions.push({
          id: 'admin',
          icon: '🛠️',
          label: 'Admin',
          active: this.isOnAdmin(),
        });
      }

      actions.push({
        id: 'logout',
        icon: '🚪',
        label: 'Esci',
        variant: 'danger',
      });

      return actions;
    }

    if (this.isPreferitiNavbar()) {
      const actions: QuickAction[] = [
        {
          id: 'profilo',
          icon: '👤',
          label: 'Profilo',
          active: this.isOnProfilo(),
        },
        {
          id: 'preferiti',
          icon: '❤️',
          label: 'Preferiti',
          active: true,
          variant: 'accent',
        },
        {
          id: 'svuota-preferiti',
          icon: '🗑️',
          label: 'Svuota preferiti',
          variant: 'danger',
        },
      ];

      if (this.isAdmin()) {
        actions.push({
          id: 'admin',
          icon: '🛠️',
          label: 'Admin',
          active: this.isOnAdmin(),
        });
      }

      return actions;
    }

    const actions: QuickAction[] = [
      {
        id: 'preferiti',
        icon: '❤️',
        label: 'Preferiti',
        active: this.isOnPreferiti(),
      },
      {
        id: 'profilo',
        icon: '👤',
        label: 'Profilo',
        active: this.isOnProfilo(),
      },
    ];

    if (this.isAdmin()) {
      actions.push({
        id: 'admin',
        icon: '🛠️',
        label: 'Admin',
        active: this.isOnAdmin(),
      });
    }

    return actions;
  }

  getGuestMobileActions(): QuickAction[] {
    return [
      {
        id: 'home',
        icon: '🏠',
        label: 'Home',
        active: this.isOnHome(),
      },
      {
        id: 'preferiti',
        icon: '❤️',
        label: 'Preferiti',
        active: false,
      },
      {
        id: 'profilo',
        icon: '👤',
        label: 'Profilo',
        active: false,
      },
      {
        id: 'login',
        icon: '🔐',
        label: 'Accedi',
        active: this.isOnLogin(),
        variant: 'accent',
      },
    ];
  }

  getMobileActions(): QuickAction[] {
    if (this.isEmptyNavbar()) {
      return [];
    }

    if (!this.loggedIn) {
      return this.getGuestMobileActions();
    }

    if (this.isAdminNavbar()) {
      return [
        {
          id: 'home',
          icon: '🏠',
          label: 'Home',
          active: this.isOnHome(),
        },
        {
          id: 'nuova-auto',
          icon: '➕',
          label: 'Aggiungi',
          active: this.isAdminSection('nuova-auto'),
          variant: 'accent',
        },
        {
          id: 'utenti',
          icon: '👥',
          label: 'Utenti',
          active: this.isAdminSection('utenti'),
        },
        {
          id: 'gestione-auto',
          icon: '🚗',
          label: 'Auto',
          active: this.isAdminSection('gestione-auto'),
        },
        {
          id: 'logout',
          icon: '🚪',
          label: 'Esci',
          variant: 'danger',
        },
      ];
    }

    if (this.isProfileNavbar()) {
      const actions: QuickAction[] = [
        {
          id: 'home',
          icon: '🏠',
          label: 'Home',
          active: this.isOnHome(),
        },
        {
          id: 'preferiti',
          icon: '❤️',
          label: 'Preferiti',
          active: this.isOnPreferiti(),
        },
        {
          id: 'profilo',
          icon: '👤',
          label: 'Profilo',
          active: true,
          variant: 'accent',
        },
        {
          id: 'reset-cronologia',
          icon: '🧹',
          label: 'Cronologia',
        },
        {
          id: 'reset-recensioni',
          icon: '⭐',
          label: 'Recensioni',
        },
      ];

      if (this.isAdmin()) {
        actions.push({
          id: 'admin',
          icon: '🛠️',
          label: 'Admin',
          active: this.isOnAdmin(),
        });
      }

      actions.push({
        id: 'logout',
        icon: '🚪',
        label: 'Esci',
        variant: 'danger',
      });

      return actions;
    }

    if (this.isPreferitiNavbar()) {
      const actions: QuickAction[] = [
        {
          id: 'home',
          icon: '🏠',
          label: 'Home',
          active: this.isOnHome(),
        },
        {
          id: 'profilo',
          icon: '👤',
          label: 'Profilo',
          active: this.isOnProfilo(),
        },
        {
          id: 'preferiti',
          icon: '❤️',
          label: 'Preferiti',
          active: true,
          variant: 'accent',
        },
        {
          id: 'svuota-preferiti',
          icon: '🗑️',
          label: 'Svuota',
          variant: 'danger',
        },
      ];

      if (this.isAdmin()) {
        actions.push({
          id: 'admin',
          icon: '🛠️',
          label: 'Admin',
          active: this.isOnAdmin(),
        });
      }

      return actions;
    }

    const actions: QuickAction[] = [
      {
        id: 'home',
        icon: '🏠',
        label: 'Home',
        active: this.isOnHome(),
      },
      {
        id: 'preferiti',
        icon: '❤️',
        label: 'Preferiti',
        active: this.isOnPreferiti(),
      },
      {
        id: 'profilo',
        icon: '👤',
        label: 'Profilo',
        active: this.isOnProfilo(),
      },
    ];

    if (this.isAdmin()) {
      actions.push({
        id: 'admin',
        icon: '🛠️',
        label: 'Admin',
        active: this.isOnAdmin(),
      });
    }

    return actions;
  }

  private getProfileMobileSideActions(): QuickAction[] {
    return this.getMobileActions().filter((action) => action.id !== 'profilo');
  }

  getProfileMobileStartActions(): QuickAction[] {
    const actions = this.getProfileMobileSideActions();
    const splitIndex = Math.ceil(actions.length / 2);
    return actions.slice(0, splitIndex);
  }

  getProfileMobileEndActions(): QuickAction[] {
    const actions = this.getProfileMobileSideActions();
    const splitIndex = Math.ceil(actions.length / 2);
    return actions.slice(splitIndex);
  }

  handleAction(actionId: QuickActionId): void {
    if (!this.loggedIn) {
      if (actionId === 'preferiti') {
        this.triggerToast('Devi autenticarti per accedere ai preferiti.', 'error');
        return;
      }

      if (actionId === 'profilo') {
        this.triggerToast('Devi autenticarti per accedere al profilo.', 'error');
        return;
      }

      if (actionId === 'admin') {
        this.triggerToast('Devi autenticarti per accedere all’area admin.', 'error');
        return;
      }

      if (actionId === 'login') {
        this.vaiLogin();
        return;
      }
    }

    switch (actionId) {
      case 'home':
        this.vaiHome();
        break;
      case 'profilo':
        this.vaiProfilo();
        break;
      case 'preferiti':
        this.vaiPreferiti();
        break;
      case 'svuota-preferiti':
        this.svuotaPreferiti();
        break;
      case 'admin':
        this.vaiAdmin();
        break;
      case 'logout':
        this.logout();
        break;
      case 'login':
        this.vaiLogin();
        break;
      case 'reset-cronologia':
        this.resetCronologiaProfilo();
        break;
      case 'reset-recensioni':
        this.resetRecensioniProfilo();
        break;
      case 'nuova-auto':
        this.vaiAdminSezione('nuova-auto');
        break;
      case 'utenti':
        this.vaiAdminSezione('utenti');
        break;
      case 'gestione-auto':
        this.vaiAdminSezione('gestione-auto');
        break;
    }
  }

  trackByActionId(_: number, action: QuickAction): string {
    return action.id;
  }

  vaiLogin(): void {
    this.router.navigate(['/Login']);
  }

  vaiRegistrazione(): void {
    this.router.navigate(['/Registrazione']);
  }

  vaiProfilo(): void {
    this.router.navigate(['/Profilo']);
  }

  vaiPreferiti(): void {
    this.router.navigate(['/Preferiti']);
  }

  vaiAdmin(): void {
    this.router.navigate(['/Admin'], {
      queryParams: { section: 'nuova-auto' },
    });
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }

  vaiAdminSezione(section: AdminSection): void {
    this.router.navigate(['/Admin'], {
      queryParams: { section },
    });
  }

  logout(): void {
    this.confirmAction('Vuoi effettuare il logout?', () => {
      try {
        this.authService.logout();
        this.loggedIn = false;
        this.admin = false;

        this.router
          .navigate(['/Home'])
          .then((navigated) => {
            if (navigated) {
              this.triggerToast('Logout effettuato con successo.', 'success');
            } else {
              this.triggerToast(
                'Logout eseguito, ma non è stato possibile aprire la Home.',
                'error',
              );
            }
          })
          .catch((err) => {
            console.error('Errore dopo il logout:', err);
            this.triggerToast(
              'Logout eseguito, ma si è verificato un errore di navigazione.',
              'error',
            );
          });
      } catch (err) {
        console.error('Errore durante il logout:', err);
        this.triggerToast('Errore durante il logout.', 'error');
      }
    });
  }

  svuotaPreferiti(): void {
    this.preferitiService
      .getConteggio()
      .pipe(take(1))
      .subscribe({
        next: (count: any) => {
          const totale = this.extractNumericValue(count);

          if (totale <= 0) {
            this.triggerToast('I preferiti sono vuoti. Non c’è niente da svuotare.', 'error');
            return;
          }

          this.confirmAction('Vuoi rimuovere tutti i preferiti?', () => {
            this.preferitiService
              .svuotaTutti()
              .pipe(take(1))
              .subscribe({
                next: () => {
                  this.triggerToast(
                    'Tutti i preferiti sono stati rimossi con successo.',
                    'success',
                  );

                  if (this.isOnPreferiti()) {
                    setTimeout(() => this.refreshCurrentRoute(), 3500);
                  }
                },
                error: (err) => {
                  console.error('Errore durante lo svuotamento dei preferiti:', err);
                  this.triggerToast('Errore durante lo svuotamento dei preferiti.', 'error');
                },
              });
          });
        },
        error: (err) => {
          console.error('Errore verifica preferiti:', err);
          this.triggerToast('Impossibile verificare i preferiti.', 'error');
        },
      });
  }

  resetCronologiaProfilo(): void {
    this.confrontoService
      .getMioTotale()
      .pipe(take(1))
      .subscribe({
        next: (totale: any) => {
          const numero = this.extractNumericValue(totale);

          if (numero <= 0) {
            this.triggerToast('La cronologia è vuota. Non c’è niente da eliminare.', 'error');
            return;
          }

          this.confirmAction('Vuoi eliminare tutta la cronologia delle sfide?', () => {
            this.navbarActionService.requestResetCronologia();
            this.triggerToast('eliminazione cronologia inviata con successo.', 'success');
          });
        },
        error: (err) => {
          console.error('Errore verifica cronologia:', err);
          this.triggerToast('Impossibile verificare la cronologia.', 'error');
        },
      });
  }

  resetRecensioniProfilo(): void {
    this.recensioniService
      .getMieRecensioni()
      .pipe(take(1))
      .subscribe({
        next: (recensioni) => {
          if (!recensioni || recensioni.length === 0) {
            this.triggerToast('Non ci sono recensioni da eliminare.', 'error');
            return;
          }

          this.confirmAction('Vuoi eliminare definitivamente tutte le tue recensioni?', () => {
            this.recensioniService
              .eliminaTutteLeRecensioni()
              .pipe(take(1))
              .subscribe({
                next: () => {
                  this.navbarActionService.requestResetRecensioni();
                  this.triggerToast('Recensioni eliminate con successo.', 'success');
                },
                error: (err) => {
                  console.error("Errore durante l'eliminazione:", err);
                  this.triggerToast("Errore tecnico durante l'eliminazione.", 'error');
                },
              });
          });
        },
        error: (err) => {
          console.error('Errore verifica recensioni:', err);
          this.triggerToast('Impossibile verificare le recensioni.', 'error');
        },
      });
  }
}

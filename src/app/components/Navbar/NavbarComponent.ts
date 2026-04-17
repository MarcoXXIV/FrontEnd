import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/AuthService';
import { NavbarActionService } from '../../services/NavbarActionService';
import { RecensioniService } from '../../services/RecensioniService';

type AdminSection = 'nuova-auto' | 'utenti' | 'gestione-auto';
type NavbarMode = 'default' | 'Profilo' | 'empty' | 'admin' | 'preferiti' | 'accedere';

type QuickActionId =
  | 'home'
  | 'profilo'
  | 'preferiti'
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
  toastType: 'success' | 'error' = 'error';

  private routerSub?: Subscription;
  private toastTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private navbarActionService: NavbarActionService,
    private recensioniService: RecensioniService,
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
  }

  private syncAuthState = (): void => {
    this.aggiornaStato();
    this.aggiornaNavbarMode();
  };

  private triggerToast(msg: string, type: 'success' | 'error' = 'error'): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
    }, 3500);
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
        { id: 'logout', icon: '🚪', label: 'Esci', variant: 'danger' },
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

      actions.push({ id: 'logout', icon: '🚪', label: 'Esci', variant: 'danger' });
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

  getProfileMobileStartActions(): QuickAction[] {
    return this.getMobileActions().filter(
      (action) => action.id === 'home' || action.id === 'preferiti',
    );
  }

  getProfileMobileEndActions(): QuickAction[] {
    return this.getMobileActions().filter(
      (action) =>
        action.id !== 'home' &&
        action.id !== 'preferiti' &&
        action.id !== 'profilo',
    );
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
    this.authService.logout();
    this.loggedIn = false;
    this.admin = false;
    this.router.navigate(['/Home']);
  }

  resetCronologiaProfilo(): void {
    const conferma = confirm('Vuoi eliminare tutta la cronologia delle sfide?');
    if (!conferma) return;

    this.navbarActionService.requestResetCronologia();
  }

  resetRecensioniProfilo(): void {
    const conferma = confirm('Vuoi eliminare definitivamente tutte le tue recensioni?');
    if (!conferma) return;

    this.recensioniService.eliminaTutteLeRecensioni().subscribe({
      next: () => {
        this.navbarActionService.requestResetRecensioni();
        console.log('Recensioni eliminate e UI sincronizzata');
      },
      error: (err) => {
        console.error("Errore durante l'eliminazione:", err);
        this.triggerToast("Errore tecnico durante l'eliminazione.", 'error');
      },
    });
  }
}

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterModule,
  Router,
  NavigationEnd,
  ActivatedRoute
} from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/AuthService';
import { NavbarActionService } from '../../services/NavbarActionService';
import { RecensioniService } from '../../services/RecensioniService';

type AdminSection = 'nuova-auto' | 'utenti' | 'gestione-auto';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './NavbarComponent.html',
  styleUrls: ['./NavbarComponent.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  loggedIn: boolean = false;
  admin: boolean = false;
  navbarMode: 'default' | 'Profilo' | 'empty' | 'admin' | 'preferiti' = 'default';
  adminSection: AdminSection = 'nuova-auto';

  sidebarOpen: boolean = false;

  private routerSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private navbarActionService: NavbarActionService,
    private recensioniService: RecensioniService
  ) {}

  ngOnInit(): void {
    this.aggiornaStato();
    this.aggiornaNavbarMode();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.aggiornaStato();
        this.aggiornaNavbarMode();
        this.closeSidebar();
      });

    window.addEventListener('storage', this.syncAuthState);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    window.removeEventListener('storage', this.syncAuthState);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 980 && this.sidebarOpen) {
      this.closeSidebar();
    }
  }

  private syncAuthState = (): void => {
    this.aggiornaStato();
    this.aggiornaNavbarMode();
  };

  aggiornaStato(): void {
    this.loggedIn = this.authService.isLoggedIn();
    this.admin = localStorage.getItem('ruolo') === 'ADMIN';
    this.cd.detectChanges();
  }

  aggiornaNavbarMode(): void {
    let route = this.activatedRoute.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.navbarMode = route.snapshot.data['navbarMode'] || 'default';

    const section = route.snapshot.queryParamMap.get('section');
    if (
      section === 'nuova-auto' ||
      section === 'utenti' ||
      section === 'gestione-auto'
    ) {
      this.adminSection = section;
    } else {
      this.adminSection = 'nuova-auto';
    }

    this.cd.detectChanges();
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

  isDefaultMobileNavbar(): boolean {
    return this.loggedIn && this.navbarMode === 'default';
  }

  shouldShowMobileSidebar(): boolean {
    return (
      this.isProfileNavbar() ||
      this.isPreferitiNavbar() ||
      this.isAdminNavbar() ||
      this.isDefaultMobileNavbar()
    );
  }

  isSidebarNavbar(): boolean {
    return (
      this.isProfileNavbar() ||
      this.isPreferitiNavbar() ||
      this.isAdminNavbar()
    );
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

  isAdminSection(section: AdminSection): boolean {
    return this.adminSection === section;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  vaiLogin(): void {
    this.closeSidebar();
    this.router.navigate(['/Login']);
  }

  vaiRegistrazione(): void {
    this.closeSidebar();
    this.router.navigate(['/Registrazione']);
  }

  vaiProfilo(): void {
    this.closeSidebar();
    this.router.navigate(['/Profilo']);
  }

  vaiPreferiti(): void {
    this.closeSidebar();
    this.router.navigate(['/Preferiti']);
  }

  vaiAdmin(): void {
    this.closeSidebar();
    this.router.navigate(['/Admin'], {
      queryParams: { section: 'nuova-auto' }
    });
  }

  vaiHome(): void {
    this.closeSidebar();
    this.router.navigate(['/Home']);
  }

  vaiAdminSezione(section: AdminSection): void {
    this.closeSidebar();
    this.router.navigate(['/Admin'], {
      queryParams: { section }
    });
  }

  logout(): void {
    this.closeSidebar();
    this.authService.logout();
    this.loggedIn = false;
    this.admin = false;
    this.cd.detectChanges();
    this.router.navigate(['/Home']);
  }

  resetCronologiaProfilo(): void {
    const conferma = confirm('Vuoi eliminare tutta la cronologia delle sfide?');
    if (!conferma) return;

    this.closeSidebar();
    this.navbarActionService.requestResetCronologia();
  }

  resetRecensioniProfilo(): void {
    const conferma = confirm('Vuoi eliminare definitivamente tutte le tue recensioni?');
    if (!conferma) return;

    this.closeSidebar();

    this.recensioniService.eliminaTutteLeRecensioni().subscribe({
      next: () => {
+        this.navbarActionService.requestResetRecensioni();

        console.log('Recensioni eliminate e UI sincronizzata');
      },
      error: (err) => {
        console.error('Errore durante l\'eliminazione:', err);
        alert('Errore tecnico durante l\'eliminazione.');
      }
    });
  }
}

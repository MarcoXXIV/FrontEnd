import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/AuthService';
import { NavbarActionService } from '../../services/NavbarActionService';

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
  navbarMode: 'default' | 'Profilo' | 'empty' | 'admin' = 'default';
  adminSection: AdminSection = 'nuova-auto';

  private routerSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private navbarActionService: NavbarActionService
  ) {}

  ngOnInit(): void {
    this.aggiornaStato();
    this.aggiornaNavbarMode();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.aggiornaStato();
        this.aggiornaNavbarMode();
      });

    window.addEventListener('storage', this.syncAuthState);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    window.removeEventListener('storage', this.syncAuthState);
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

  isEmptyNavbar(): boolean {
    return this.navbarMode === 'empty';
  }

  isAdminNavbar(): boolean {
    return this.loggedIn && this.admin && this.navbarMode === 'admin';
  }

  isOnProfilo(): boolean {
    return this.router.url.startsWith('/Profilo');
  }

  isAdminSection(section: AdminSection): boolean {
    return this.adminSection === section;
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
      queryParams: { section: 'nuova-auto' }
    });
  }

  vaiAdminSezione(section: AdminSection): void {
    this.router.navigate(['/Admin'], {
      queryParams: { section }
    });
  }

  logout(): void {
    this.authService.logout();
    this.loggedIn = false;
    this.admin = false;
    this.cd.detectChanges();
    this.router.navigate(['/Home']);
  }

  resetCronologiaProfilo(): void {
    const conferma = confirm('Vuoi eliminare tutta la cronologia delle sfide?');
    if (!conferma) return;

    this.navbarActionService.requestResetCronologia();
  }
}

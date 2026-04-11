import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/AuthService';

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

  private routerSub?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.aggiornaStato();

    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.aggiornaStato();
      }
    });

    window.addEventListener('storage', this.syncAuthState);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    window.removeEventListener('storage', this.syncAuthState);
  }

  private syncAuthState = (): void => {
    this.aggiornaStato();
  };

  aggiornaStato(): void {
    this.loggedIn = this.authService.isLoggedIn();
    this.admin = localStorage.getItem('ruolo') === 'ADMIN';
    this.cd.detectChanges();
  }

  isAdmin(): boolean {
    return this.admin;
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
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
    this.router.navigate(['/Admin']);
  }
}

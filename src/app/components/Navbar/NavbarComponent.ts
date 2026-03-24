import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './NavbarComponent.html',
  styleUrls: ['./NavbarComponent.css']
})
export class NavbarComponent {

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  isAdmin(): boolean {
    return localStorage.getItem('ruolo') === 'ADMIN';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

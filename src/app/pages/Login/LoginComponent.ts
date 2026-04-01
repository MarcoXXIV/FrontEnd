import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { LoginRequest } from '../../models/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './LoginComponent.html',
  styleUrl: './LoginComponent.css'
})
export class LoginComponent {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  showPassword = false;
  loading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = 'Inserisci tutte le credenziali.';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login OK:', response);

        localStorage.setItem('token', response.token);

        const ruoloUpper = response.ruolo ? response.ruolo.toUpperCase() : 'USER';
        localStorage.setItem('ruolo', ruoloUpper);

        this.loading = false;

        if (ruoloUpper === 'ADMIN') {
          console.log('Accesso Admin rilevato - Reindirizzamento alla Home');
          this.router.navigate(['/Home']);
        } else {
          console.log('Accesso Utente standard - Reindirizzamento alla Home');
          this.router.navigate(['/Home']);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Errore login:', err);

        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Email o Password errate.';
        } else {
          this.errorMessage = 'Il server non risponde. Riprova più tardi.';
        }
      }
    });
  }

  goToRegister(): void {
    this.router.navigate(['/Registrazione']);
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }
}

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
  styleUrl: './LoginComponent.css' //
})
export class LoginComponent {

  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  loading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    if (!this.credentials.email || !this.credentials.password) {
      this.errorMessage = "Inserisci tutte le credenziali.";
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login OK:', response);
        this.loading = false;
        // Navigazione verso la rotta definita in app.routes.ts
        this.router.navigate(['/Home']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = "Email o Password errate.";
        } else {
          this.errorMessage = "Il server non risponde. Riprova più tardi.";
        }
      }
    });
  }

  goToRegister(): void {
    // Navigazione verso la rotta 'Registrazione' (Case-Sensitive)
    this.router.navigate(['/Registrazione']);
  }
}

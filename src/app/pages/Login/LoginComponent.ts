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
  styleUrls: ['./LoginComponent.css']
})
export class LoginComponent {

  // Modello per il form (Two-way binding con ngModel)
  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  loading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.loading = true;
    this.errorMessage = null;

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login effettuato con successo!', response);
        this.loading = false;
        this.router.navigate(['/Home']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = "Email o Password non valide.";
        } else {
          this.errorMessage = "Errore del server. Riprova più tardi.";
        }
        console.error('Errore Login:', err);
      }
    });
  }

  // Metodo rapido per andare alla registrazione
  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}

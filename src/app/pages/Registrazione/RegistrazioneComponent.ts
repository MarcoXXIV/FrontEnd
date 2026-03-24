import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { RegisterRequest } from '../../models/RegisterRequest';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './RegistrazioneComponent.html',
  styleUrls: ['./RegistrazioneComponent.css']
})
export class RegisterComponent {

  // Modello basato sulla tua interfaccia
  user: RegisterRequest = {
    nome: '',
    cognome: '',
    email: '',
    password: ''
  };

  confermaPassword: string = '';
  loading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister(): void {
    if (this.user.password !== this.confermaPassword) {
      this.errorMessage = "Le password non coincidono!";
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.register(this.user).subscribe({
      next: (res) => {
        console.log('Registrazione completata e login effettuato!', res);
        this.loading = false;
        this.router.navigate(['/Home']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 409) {
          this.errorMessage = "Questa email è già registrata.";
        } else {
          this.errorMessage = "Errore durante la registrazione. Riprova.";
        }
        console.error(err);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

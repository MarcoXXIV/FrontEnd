import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { RegisterRequest } from '../../models/RegisterRequest';

@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './RegistrazioneComponent.html',
  styleUrl: './RegistrazioneComponent.css'
})
export class RegistrazioneComponent {

  user: RegisterRequest = {
    nome: '',
    cognome: '',
    email: '',
    password: ''
  };

  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  confermaPassword: string = '';
  loading: boolean = false;
  errorMessage: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onRegister(): void {
    // Validazione base lato client
    if (this.user.password !== this.confermaPassword) {
      this.errorMessage = "Le password non coincidono!";
      return;
    }

    if (!this.user.email.includes('@')) {
      this.errorMessage = "Inserisci un'email valida.";
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    this.authService.register(this.user).subscribe({
      next: (res) => {
        console.log('Utente creato con successo:', res);
        this.loading = false;
        // Dopo la registrazione l'AuthService ha già salvato il token,
        // quindi possiamo mandare l'utente direttamente in Home.
        this.router.navigate(['/Home']);
      },
      error: (err) => {
        this.loading = false;
        // Gestione errore email duplicata (solitamente 400 o 409 dal backend)
        if (err.status === 400 || err.status === 409) {
          this.errorMessage = "Questa email è già associata a un account.";
        } else {
          this.errorMessage = "Errore durante la creazione dell'account.";
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/Login']);
  }
}

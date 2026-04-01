import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
export class RegistrazioneComponent implements OnInit {

  user: RegisterRequest = {
    nome: '',
    cognome: '',
    email: '',
    password: ''
  };

  confermaPassword: string = '';
  showPassword = false;
  loading: boolean = false;
  errorMessage: string | null = null;

  // Statistica fittizia o reale per l'header stile Admin
  pilotiIscritti: number = 1240;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Eventuale logica di inizializzazione
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }

  goToLogin(): void {
    this.router.navigate(['/Login']);
  }

  onRegister(): void {
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
        this.loading = false;
        this.router.navigate(['/Home']);
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400 || err.status === 409) {
          this.errorMessage = "Questa email è già associata a un account.";
        } else {
          this.errorMessage = "Errore durante la creazione dell'account.";
        }
        this.cd.detectChanges();
      }
    });
  }
}

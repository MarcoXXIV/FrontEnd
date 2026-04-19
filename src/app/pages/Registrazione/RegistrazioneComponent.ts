import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../services/AuthService';
import { RegisterRequest } from '../../models/RegisterRequest';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-registrazione',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './RegistrazioneComponent.html',
  styleUrls: ['./RegistrazioneComponent.css'],
})
export class RegistrazioneComponent implements OnDestroy {
  user: RegisterRequest = {
    nome: '',
    cognome: '',
    email: '',
    password: '',
  };

  confermaPassword = '';
  showPassword = false;
  loading = false;
  checkingEmail = false;

  fieldErrors = {
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confermaPassword: '',
  };

  notification = {
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  };

  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
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

  validateNomeField(): boolean {
    const nome = this.user.nome?.trim() || '';
    this.fieldErrors.nome = '';

    if (!nome) {
      this.fieldErrors.nome = 'Inserisci il nome.';
      return false;
    }

    if (nome.length < 2) {
      this.fieldErrors.nome = 'Il nome deve contenere almeno 2 caratteri.';
      return false;
    }

    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/;
    if (!regex.test(nome)) {
      this.fieldErrors.nome = 'Il nome contiene caratteri non validi.';
      return false;
    }

    return true;
  }

  validateCognomeField(): boolean {
    const cognome = this.user.cognome?.trim() || '';
    this.fieldErrors.cognome = '';

    if (!cognome) {
      this.fieldErrors.cognome = 'Inserisci il cognome.';
      return false;
    }

    if (cognome.length < 2) {
      this.fieldErrors.cognome = 'Il cognome deve contenere almeno 2 caratteri.';
      return false;
    }

    const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ' ]+$/;
    if (!regex.test(cognome)) {
      this.fieldErrors.cognome = 'Il cognome contiene caratteri non validi.';
      return false;
    }

    return true;
  }

  validateEmailField(): boolean {
    const email = this.user.email?.trim() || '';
    this.fieldErrors.email = '';

    if (!email) {
      this.fieldErrors.email = 'Inserisci l’email.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      this.fieldErrors.email = 'Inserisci un indirizzo email valido.';
      return false;
    }

    return true;
  }

  validatePasswordField(): boolean {
    const password = this.user.password || '';
    this.fieldErrors.password = '';

    if (!password.trim()) {
      this.fieldErrors.password = 'Inserisci la password.';
      return false;
    }

    if (password.length < 8) {
      this.fieldErrors.password = 'La password deve contenere almeno 8 caratteri.';
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      this.fieldErrors.password = 'La password deve contenere almeno una lettera maiuscola.';
      return false;
    }

    if (!/[a-z]/.test(password)) {
      this.fieldErrors.password = 'La password deve contenere almeno una lettera minuscola.';
      return false;
    }

    if (!/\d/.test(password)) {
      this.fieldErrors.password = 'La password deve contenere almeno un numero.';
      return false;
    }

    return true;
  }

  validateConfermaPasswordField(): boolean {
    const conferma = this.confermaPassword || '';
    this.fieldErrors.confermaPassword = '';

    if (!conferma.trim()) {
      this.fieldErrors.confermaPassword = 'Conferma la password.';
      return false;
    }

    if (this.user.password !== conferma) {
      this.fieldErrors.confermaPassword = 'Le password non coincidono.';
      return false;
    }

    return true;
  }

  onEmailBlur(): void {
    if (!this.validateEmailField()) return;
    this.checkEmailExists(false);
  }

  onRegister(): void {
    if (this.loading || this.checkingEmail) return;

    this.clearFieldErrors();

    const nomeValid = this.validateNomeField();
    const cognomeValid = this.validateCognomeField();
    const emailValid = this.validateEmailField();
    const passwordValid = this.validatePasswordField();
    const confermaValid = this.validateConfermaPasswordField();

    if (!(nomeValid && cognomeValid && emailValid && passwordValid && confermaValid)) {
      this.showNotification(
        'error',
        'Controlla i campi',
        'Correggi gli errori evidenziati prima di continuare.',
      );
      return;
    }

    this.checkEmailExists(true);
  }

  private checkEmailExists(andThenRegister: boolean): void {
    const email = this.user.email.trim().toLowerCase();

    this.checkingEmail = true;
    this.fieldErrors.email = '';

    this.authService
      .checkEmailExists(email)
      .pipe(finalize(() => (this.checkingEmail = false)))
      .subscribe({
        next: (response) => {
          if (response.exists) {
            this.fieldErrors.email = 'Questa email è già associata a un account.';

            if (andThenRegister) {
              this.showNotification(
                'error',
                'Email già registrata',
                'Usa un’altra email oppure accedi con questo account.',
              );
            }
            return;
          }

          if (andThenRegister) {
            this.executeRegister();
          }
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.error ||
            'Non riesco a controllare se l’email è già registrata. Riprova tra poco.';

          this.showNotification('error', 'Verifica email non disponibile', message);
        },
      });
  }

  private executeRegister(): void {
    const payload: RegisterRequest = {
      nome: this.user.nome.trim(),
      cognome: this.user.cognome.trim(),
      email: this.user.email.trim().toLowerCase(),
      password: this.user.password,
    };

    this.loading = true;

    this.authService
      .register(payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => {
          this.showNotification(
            'success',
            'Registrazione completata',
            'Account creato con successo. Verrai reindirizzato alla Home.',
          );

          setTimeout(() => {
            this.router.navigate(['/Home']);
          }, 1500);
        },
        error: (err) => {
          const message = this.extractRegisterError(err);

          if (err?.status === 409) {
            this.fieldErrors.email = 'Questa email è già associata a un account.';
          }

          if (err?.error?.validationErrors) {
            const validationErrors = err.error.validationErrors;
            this.fieldErrors.nome = validationErrors.nome || '';
            this.fieldErrors.cognome = validationErrors.cognome || '';
            this.fieldErrors.email = validationErrors.email || this.fieldErrors.email;
            this.fieldErrors.password = validationErrors.password || '';
          }

          this.showNotification('error', 'Registrazione fallita', message);
        },
      });
  }

  private extractRegisterError(err: any): string {
    const backendError = err?.error;

    if (typeof backendError === 'string' && backendError.trim()) {
      return backendError;
    }

    if (backendError?.message) {
      return backendError.message;
    }

    if (backendError?.errore) {
      return backendError.errore;
    }

    if (backendError?.validationErrors) {
      return Object.values(backendError.validationErrors).join(' • ');
    }

    if (err?.status === 409) {
      return 'Questa email è già associata a un account.';
    }

    if (err?.status === 400) {
      return 'Dati non validi. Controlla nome, cognome, email e password.';
    }

    if (err?.status === 0) {
      return 'Impossibile contattare il server. Verifica la connessione.';
    }

    return 'Errore durante la registrazione. Riprova più tardi.';
  }

  private clearFieldErrors(): void {
    this.fieldErrors = {
      nome: '',
      cognome: '',
      email: '',
      password: '',
      confermaPassword: '',
    };
  }

  showNotification(type: 'success' | 'error', title: string, message: string): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notification = {
      show: true,
      type,
      title,
      message,
    };

    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 4000);
  }

  closeNotification(): void {
    this.notification.show = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
}

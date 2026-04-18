import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { RegisterRequest } from '../../models/RegisterRequest';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';
import { UtenteService} from '../../services/UtenteService';

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
    private utenteService: UtenteService,
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
    const valid = this.validateEmailField();
    if (!valid) return;

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

    const formValid = nomeValid && cognomeValid && emailValid && passwordValid && confermaValid;

    if (!formValid) {
      this.showNotification(
        'error',
        'Controlla i campi',
        'Correggi gli errori evidenziati prima di continuare.',
      );
      return;
    }

    this.checkEmailExists(true);
  }

  private checkEmailExists(showToastIfExists: boolean): void {
    const email = this.user.email.trim().toLowerCase();
    this.checkingEmail = true;
    this.fieldErrors.email = '';

    this.utenteService.findByEmail(email).subscribe({
      next: (response: any) => {
        this.checkingEmail = false;

        const exists =
          typeof response === 'boolean'
            ? response
            : typeof response?.exists === 'boolean'
              ? response.exists
              : typeof response?.presente === 'boolean'
                ? response.presente
                : false;

        if (exists) {
          this.fieldErrors.email = 'Questa email è già associata a un account.';

          if (showToastIfExists) {
            this.showNotification(
              'error',
              'Email già registrata',
              'Usa un’altra email oppure accedi con questo account.',
            );
          }
          return;
        }

        if (showToastIfExists) {
          this.executeRegister();
        }
      },
      error: () => {
        this.checkingEmail = false;
        this.showNotification(
          'error',
          'Verifica email non disponibile',
          'Non riesco a controllare se l’email è già registrata. Riprova tra poco.',
        );
      },
    });
  }

  private executeRegister(): void {
    this.loading = true;

    const payload: RegisterRequest = {
      nome: this.user.nome.trim(),
      cognome: this.user.cognome.trim(),
      email: this.user.email.trim().toLowerCase(),
      password: this.user.password,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;

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
        this.loading = false;

        const message = this.extractRegisterError(err);

        if (err?.status === 409) {
          this.fieldErrors.email = 'Questa email è già associata a un account.';
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

    if (backendError?.errors) {
      const errors = backendError.errors;

      if (Array.isArray(errors)) {
        return errors.join(' • ');
      }

      if (typeof errors === 'object') {
        const messages: string[] = [];

        Object.keys(errors).forEach((key) => {
          const value = errors[key];
          if (Array.isArray(value)) {
            messages.push(...value);
          } else if (typeof value === 'string') {
            messages.push(value);
          }
        });

        if (messages.length > 0) {
          return messages.join(' • ');
        }
      }
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

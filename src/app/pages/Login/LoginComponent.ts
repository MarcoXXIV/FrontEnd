import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/AuthService';
import { LoginRequest } from '../../models/LoginRequest';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './LoginComponent.html',
  styleUrls: ['./LoginComponent.css']
})
export class LoginComponent implements OnDestroy {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  showPassword = false;
  loading = false;

  fieldErrors = {
    email: '',
    password: ''
  };

  notification = {
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  };

  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/Registrazione']);
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }

  validateEmailField(): boolean {
    const email = this.credentials.email?.trim() || '';
    this.fieldErrors.email = '';

    if (!email) {
      this.fieldErrors.email = 'Inserisci la tua email.';
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
    const password = this.credentials.password || '';
    this.fieldErrors.password = '';

    if (!password.trim()) {
      this.fieldErrors.password = 'Inserisci la password.';
      return false;
    }

    if (password.length < 6) {
      this.fieldErrors.password = 'La password deve contenere almeno 6 caratteri.';
      return false;
    }

    return true;
  }

  validateForm(): boolean {
    const emailValid = this.validateEmailField();
    const passwordValid = this.validatePasswordField();
    return emailValid && passwordValid;
  }

  onLogin(): void {
    if (this.loading) return;

    this.clearFieldErrors();

    const isValid = this.validateForm();
    if (!isValid) {
      this.showNotification(
        'error',
        'Controlla i campi',
        'Correggi gli errori evidenziati prima di continuare.'
      );
      return;
    }

    this.loading = true;

    const payload: LoginRequest = {
      email: this.credentials.email.trim(),
      password: this.credentials.password
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.loading = false;

        localStorage.setItem('token', response.token);
        const ruoloUpper = response.ruolo ? response.ruolo.toUpperCase() : 'USER';
        localStorage.setItem('ruolo', ruoloUpper);

        this.showNotification(
          'success',
          'Accesso effettuato',
          'Login riuscito. Verrai reindirizzato alla Home.'
        );

        setTimeout(() => {
          this.router.navigate(['/Home']);
        }, 1400);
      },
      error: (err) => {
        this.loading = false;

        const message = this.extractLoginError(err);

        if (err?.status === 401 || err?.status === 403) {
          this.fieldErrors.password = 'Email o password errate.';
        }

        this.showNotification('error', 'Accesso non riuscito', message);
      }
    });
  }

  private clearFieldErrors(): void {
    this.fieldErrors = {
      email: '',
      password: ''
    };
  }

  private extractLoginError(err: any): string {
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

    if (err?.status === 401 || err?.status === 403) {
      return 'Email o password errate.';
    }

    if (err?.status === 404) {
      return 'Account non trovato.';
    }

    if (err?.status === 0) {
      return 'Impossibile contattare il server. Verifica la connessione.';
    }

    return 'Errore durante il login. Riprova più tardi.';
  }

  showNotification(type: 'success' | 'error', title: string, message: string): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    this.notification = {
      show: true,
      type,
      title,
      message
    };

    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 3500);
  }

  closeNotification(): void {
    this.notification.show = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }
}

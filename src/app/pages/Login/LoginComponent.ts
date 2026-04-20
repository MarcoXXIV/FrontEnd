import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';
import { AuthService } from '../../services/AuthService';
import { LoginRequest } from '../../models/LoginRequest';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './LoginComponent.html',
  styleUrls: ['./LoginComponent.css'],
})
export class LoginComponent implements OnDestroy {
  credentials: LoginRequest = {
    email: '',
    password: '',
  };

  showPassword = false;
  loading = false;
  checkingEmail = false;

  forgotPasswordModalOpen = false;
  resetPasswordEmail = '';
  resetEmailError = '';
  checkingResetEmail = false;
  sendingResetPassword = false;

  fieldErrors = {
    email: '',
    password: '',
  };

  notification = {
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  };

  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;
  private redirectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }

    document.body.style.overflow = '';
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

  onEmailInput(): void {
    this.fieldErrors.email = '';
  }

  onPasswordInput(): void {
    this.fieldErrors.password = '';
  }

  onEmailBlur(): void {
    if (!this.validateEmailField()) {
      return;
    }

    const email = this.credentials.email.trim().toLowerCase();
    if (!email) {
      return;
    }

    this.checkingEmail = true;

    this.authService.checkEmailExists(email).subscribe({
      next: (response) => {
        this.checkingEmail = false;

        if (!response.exists) {
          this.fieldErrors.email =
            'Questa email non risulta registrata. Controllala oppure crea un account.';
        }
      },
      error: () => {
        this.checkingEmail = false;
      },
    });
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
        'Correggi gli errori evidenziati prima di continuare.',
      );
      return;
    }

    const payload: LoginRequest = {
      email: this.credentials.email.trim().toLowerCase(),
      password: this.credentials.password,
    };

    this.loading = true;
    this.authService.logout();

    this.authService.checkEmailExists(payload.email).subscribe({
      next: (check) => {
        if (!check.exists) {
          this.loading = false;
          this.fieldErrors.email = 'Email non trovata. Controllala oppure registrati.';
          this.showNotification(
            'error',
            'Email non trovata',
            'Questa email non risulta registrata. Controllala oppure vai in registrazione.',
          );
          return;
        }

        this.executeLogin(payload);
      },
      error: () => {
        this.loading = false;
        this.showNotification(
          'error',
          'Errore verifica email',
          'Non è stato possibile verificare l’email. Riprova tra poco.',
        );
      },
    });
  }

  private executeLogin(payload: LoginRequest): void {
    this.authService.login(payload).subscribe({
      next: () => {
        this.loading = false;

        this.showNotification(
          'success',
          'Accesso effettuato',
          'Login riuscito. Verrai reindirizzato alla Home.',
        );

        this.redirectTimeout = setTimeout(() => {
          this.router.navigate(['/Home']);
        }, 1400);
      },
      error: (err) => {
        this.loading = false;
        this.authService.logout();

        if (err?.status === 401) {
          this.fieldErrors.password = 'Password errata. Riprova.';
        }

        if (err?.status === 404) {
          this.fieldErrors.email = 'Email non trovata. Controllala oppure registrati.';
        }

        if (err?.status === 400 && !this.fieldErrors.email && !this.fieldErrors.password) {
          this.fieldErrors.email = 'Verifica i dati inseriti.';
        }

        const message = this.extractLoginError(err);
        this.showNotification('error', 'Accesso non riuscito', message);
      },
    });
  }

  openForgotPasswordModal(): void {
    this.resetPasswordEmail = this.credentials.email?.trim().toLowerCase() || '';
    this.resetEmailError = '';
    this.checkingResetEmail = false;
    this.sendingResetPassword = false;
    this.forgotPasswordModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeForgotPasswordModal(force: boolean = false): void {
    if (this.sendingResetPassword && !force) return;

    this.forgotPasswordModalOpen = false;
    this.resetPasswordEmail = '';
    this.resetEmailError = '';
    this.checkingResetEmail = false;
    this.sendingResetPassword = false;
    document.body.style.overflow = '';
  }

  onResetEmailInput(): void {
    this.resetEmailError = '';
  }

  onResetEmailBlur(): void {
    if (!this.validateResetEmailField()) {
      return;
    }

    const email = this.resetPasswordEmail.trim().toLowerCase();
    if (!email) {
      return;
    }

    this.checkingResetEmail = true;

    this.authService.checkEmailExists(email).subscribe({
      next: (response) => {
        this.checkingResetEmail = false;

        if (!response.exists) {
          this.resetEmailError = 'Questa email non risulta registrata.';
        }
      },
      error: () => {
        this.checkingResetEmail = false;
      },
    });
  }

  validateResetEmailField(): boolean {
    const email = this.resetPasswordEmail?.trim() || '';
    this.resetEmailError = '';

    if (!email) {
      this.resetEmailError = 'Inserisci la tua email.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      this.resetEmailError = 'Inserisci un indirizzo email valido.';
      return false;
    }

    return true;
  }

  submitForgotPassword(): void {
    if (this.sendingResetPassword) return;

    const isValid = this.validateResetEmailField();
    if (!isValid) return;

    const email = this.resetPasswordEmail.trim().toLowerCase();
    this.sendingResetPassword = true;
    this.resetEmailError = '';

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.sendingResetPassword = false;

        if (response?.esito) {
          this.closeForgotPasswordModal(true);
          this.credentials.password = '';

          this.showNotification(
            'success',
            'Email inviata',
            response.message ||
              'Controlla la tua posta in arrivo. Ti abbiamo inviato una password temporanea.',
          );
        } else {
          this.resetEmailError = 'Non è stato possibile completare il reset password.';
          this.showNotification(
            'error',
            'Errore Reset',
            response?.message || 'Non è stato possibile completare il reset password.',
          );
        }
      },
      error: (err) => {
        this.sendingResetPassword = false;

        if (err?.status === 404) {
          this.resetEmailError = 'Questa email non risulta registrata.';
          return;
        }

        if (err?.status === 400) {
          this.resetEmailError = 'Inserisci un indirizzo email valido.';
          return;
        }

        console.error('Errore forgot password:', err);

        this.showNotification(
          'error',
          'Errore Reset',
          'Si è verificato un problema tecnico durante l’invio. Riprova tra qualche istante.',
        );
      },
    });
  }

  private clearFieldErrors(): void {
    this.fieldErrors = {
      email: '',
      password: '',
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

    if (err?.status === 401) {
      return 'Password errata. Riprova.';
    }

    if (err?.status === 404) {
      return 'Email non trovata. Controllala oppure registrati.';
    }

    if (err?.status === 400) {
      return 'Dati non validi. Verifica email e password.';
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
      message,
    };

    this.notificationTimeout = setTimeout(() => {
      this.notification.show = false;
    }, 3500);
  }

  closeNotification(): void {
    this.notification.show = false;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }
}

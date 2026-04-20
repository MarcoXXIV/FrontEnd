import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { UtenteService } from '../../services/UtenteService';
import { ConfrontoService } from '../../services/ConfrontoService';
import { RecensioniService } from '../../services/RecensioniService';
import { PreferitiService } from '../../services/PreferitiService';
import { NavbarActionService } from '../../services/NavbarActionService';
import { ToastService } from '../../services/ToastService';
import { UtenteModel } from '../../models/UtenteModel';
import { ConfrontoModel } from '../../models/ConfrontoModel';
import { RecensioneModel } from '../../models/RecensioneModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './ProfiloComponent.html',
  styleUrls: ['./ProfiloComponent.css']
})
export class ProfiloComponent implements OnInit, OnDestroy {
  utente?: UtenteModel;
  mieSfide: ConfrontoModel[] = [];
  totaleSfide = 0;
  totalePreferiti = 0;
  mieRecensioni: RecensioneModel[] = [];

  vecchiaPsw = '';
  nuovaPsw = '';
  confermaNuovaPsw = '';

  showOldPsw = false;
  showNewPsw = false;

  loading = true;
  savingProfile = false;
  changingPassword = false;

  notification = {
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  };

  private notificationTimeout: ReturnType<typeof setTimeout> | null = null;
  private subs: Subscription = new Subscription();

  constructor(
    private utenteService: UtenteService,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService,
    private preferitiService: PreferitiService,
    private navbarActionService: NavbarActionService,
    private toastService: ToastService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.caricaTutto();

    this.subs.add(
      this.navbarActionService.resetCronologia$.subscribe(() => {
        this.confrontoService.eliminaCronologia().subscribe({
          next: () => {
            this.mieSfide = [];
            this.totaleSfide = 0;
            this.toastService.success('Cronologia eliminata dal database!');
            this.showNotification('success', 'Cronologia eliminata', 'La cronologia è stata eliminata con successo.');
            this.cd.detectChanges();
          },
          error: () => {
            this.toastService.error('Errore tecnico nell’eliminazione della cronologia.');
            this.showNotification('error', 'Errore', 'Non è stato possibile eliminare la cronologia.');
          }
        });
      })
    );

    this.subs.add(
      this.navbarActionService.resetRecensioni$.subscribe(() => {
        this.mieRecensioni = [];
        this.showNotification('success', 'Recensioni aggiornate', 'L’elenco recensioni è stato aggiornato.');
        this.cd.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  caricaTutto(): void {
    this.loading = true;

    forkJoin({
      utente: this.utenteService.getProfilo().pipe(catchError(() => of(null))),
      sfide: this.confrontoService.getMieiConfronti().pipe(catchError(() => of([]))),
      recensioni: this.recensioniService.getMieRecensioni().pipe(catchError(() => of([]))),
      totaleSfide: this.confrontoService.getMioTotale().pipe(catchError(() => of(0))),
      preferitiCount: this.preferitiService.getConteggio().pipe(catchError(() => of(0)))
    })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.utente = res.utente || undefined;
          this.mieSfide = res.sfide as ConfrontoModel[];
          this.mieRecensioni = res.recensioni as RecensioneModel[];
          this.totaleSfide = Number(res.totaleSfide);
          this.totalePreferiti = Number(res.preferitiCount);
        },
        error: () => {
          this.showNotification('error', 'Errore caricamento', 'Non è stato possibile caricare il profilo.');
        }
      });
  }

  eliminaRecensione(recensione: RecensioneModel): void {
    const idA1 = recensione.auto1?.id;
    const idA2 = recensione.auto2?.id;

    if (!idA1 || !idA2) {
      this.toastService.error('Dati auto mancanti per l’eliminazione.');
      this.showNotification('error', 'Dati mancanti', 'Dati auto mancanti per l’eliminazione.');
      return;
    }

    if (confirm(`Vuoi eliminare la recensione per ${recensione.auto1?.marca} vs ${recensione.auto2?.marca}?`)) {
      this.recensioniService.eliminaRecensione(idA1, idA2).subscribe({
        next: () => {
          this.mieRecensioni = this.mieRecensioni.filter(
            r => !(r.auto1?.id === idA1 && r.auto2?.id === idA2)
          );

          this.toastService.success('Recensione eliminata con successo!');
          this.showNotification('success', 'Recensione eliminata', 'La recensione è stata eliminata con successo.');
          this.cd.detectChanges();
        },
        error: (err) => {
          const msg = typeof err?.error === 'string' ? err.error : 'Errore durante l’eliminazione.';
          this.toastService.error(msg);
          this.showNotification('error', 'Eliminazione non riuscita', msg);
        }
      });
    }
  }

  salvaModificheBase(): void {
    if (!this.utente || this.savingProfile) return;

    const nome = this.utente.nome?.trim();
    const cognome = this.utente.cognome?.trim();

    if (!nome || !cognome) {
      this.showNotification('error', 'Campi obbligatori', 'Nome e cognome sono obbligatori.');
      return;
    }

    this.savingProfile = true;

    const payload = {
      ...this.utente,
      nome,
      cognome
    };

    this.utenteService.aggiornaProfilo(payload)
      .pipe(
        finalize(() => {
          this.savingProfile = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: (updated) => {
          this.utente = updated;
          this.toastService.success('Profilo aggiornato con successo!');
          this.showNotification('success', 'Profilo aggiornato', 'Le informazioni account sono state salvate.');
        },
        error: (err) => {
          const msg = typeof err?.error === 'string' ? err.error : 'Errore durante l’aggiornamento del profilo.';
          this.toastService.error(msg);
          this.showNotification('error', 'Aggiornamento fallito', msg);
        }
      });
  }

  aggiornaPassword(event: Event): void {
    event.preventDefault();

    if (this.changingPassword) return;

    if (!this.vecchiaPsw || !this.nuovaPsw || !this.confermaNuovaPsw) {
      this.showNotification('error', 'Campi mancanti', 'Compila tutti i campi password.');
      return;
    }

    if (this.nuovaPsw.length < 6) {
      this.showNotification('error', 'Password troppo corta', 'La nuova password deve contenere almeno 6 caratteri.');
      return;
    }

    if (this.nuovaPsw !== this.confermaNuovaPsw) {
      this.showNotification('error', 'Password non coincidenti', 'Le nuove password non coincidono.');
      return;
    }

    if (this.vecchiaPsw === this.nuovaPsw) {
      this.showNotification('error', 'Password invariata', 'La nuova password deve essere diversa da quella attuale.');
      return;
    }

    this.changingPassword = true;

    this.utenteService.cambiaPassword(this.vecchiaPsw, this.nuovaPsw)
      .pipe(
        finalize(() => {
          this.changingPassword = false;
          this.cd.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.vecchiaPsw = '';
          this.nuovaPsw = '';
          this.confermaNuovaPsw = '';
          this.toastService.success('Password modificata correttamente!');
          this.showNotification('success', 'Password aggiornata', 'Le credenziali sono state aggiornate con successo.');
        },
        error: (err) => {
          const msg = typeof err?.error === 'string'
            ? err.error
            : 'Errore: la vecchia password è errata oppure la modifica non è riuscita.';

          this.toastService.error(msg);
          this.showNotification('error', 'Modifica password fallita', msg);
        }
      });
  }

  trackByRecensione(index: number, item: RecensioneModel): number {
    return item.id ?? index;
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
      this.cd.detectChanges();
    }, 3500);

    this.cd.detectChanges();
  }

  closeNotification(): void {
    this.notification.show = false;

    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }

    this.cd.detectChanges();
  }
}

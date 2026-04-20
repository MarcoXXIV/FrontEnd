import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UtenteService } from '../../services/UtenteService';
import { ConfrontoService } from '../../services/ConfrontoService';
import { RecensioniService } from '../../services/RecensioniService';
import { PreferitiService } from '../../services/PreferitiService';
import { AuthService } from '../../services/AuthService';
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
  mieisfide: ConfrontoModel[] = [];
  totaleSfide = 0;
  totalePreferiti = 0;
  mieRecensioni: RecensioneModel[] = [];

  vecchiaPsw = '';
  nuovaPsw = '';
  confermaNuovaPsw = '';

  showOldPsw = false;
  showNewPsw = false;
  loading = true;

  private subs: Subscription = new Subscription();

  constructor(
    private utenteService: UtenteService,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService,
    private preferitiService: PreferitiService,
    private authService: AuthService,
    private navbarActionService: NavbarActionService,
    private toastService: ToastService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.caricaTutto();

    this.subs.add(
      this.navbarActionService.resetCronologia$.subscribe(() => {
        this.confrontoService.eliminaCronologia().subscribe({
          next: () => {
            this.mieisfide = [];
            this.totaleSfide = 0;
            this.toastService.success('Cronologia eliminata dal database!');
            this.cd.detectChanges();
          },
          error: () => {
            this.toastService.error('Errore tecnico nell’eliminazione della cronologia.');
          }
        });
      })
    );

    this.subs.add(
      this.navbarActionService.resetRecensioni$.subscribe(() => {
        this.mieRecensioni = [];
        this.cd.detectChanges();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  caricaTutto(): void {
    this.loading = true;

    forkJoin({
      utente: this.utenteService.getProfilo().pipe(catchError(() => of(null))),
      sfide: this.confrontoService.getMieiConfronti().pipe(catchError(() => of([]))),
      recensioni: this.recensioniService.getMieRecensioni().pipe(catchError(() => of([]))),
      totaleSfide: this.confrontoService.getMioTotale().pipe(catchError(() => of(0))),
      preferitiCount: this.preferitiService.getConteggio().pipe(catchError(() => of(0)))
    }).subscribe({
      next: (res) => {
        this.utente = res.utente || undefined;
        this.mieisfide = res.sfide;
        this.mieRecensioni = res.recensioni;
        this.totaleSfide = Number(res.totaleSfide);
        this.totalePreferiti = Number(res.preferitiCount);
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  eliminaRecensione(recensione: RecensioneModel): void {
    const idA1 = recensione.auto1?.id;
    const idA2 = recensione.auto2?.id;

    if (!idA1 || !idA2) {
      this.toastService.error('Dati auto mancanti per l’eliminazione.');
      return;
    }

    if (confirm(`Vuoi eliminare la recensione per ${recensione.auto1?.marca} vs ${recensione.auto2?.marca}?`)) {
      this.recensioniService.eliminaRecensione(idA1, idA2).subscribe({
        next: () => {
          this.mieRecensioni = this.mieRecensioni.filter(
            r => !(r.auto1?.id === idA1 && r.auto2?.id === idA2)
          );
          this.toastService.success('Recensione eliminata con successo!');
          this.cd.detectChanges();
        },
        error: (err) => {
          const msg = err?.error || 'Errore durante l’eliminazione.';
          this.toastService.error(msg);
        }
      });
    }
  }

  salvaModificheBase(): void {
    if (!this.utente) return;

    this.utenteService.aggiornaProfilo(this.utente).subscribe({
      next: (updated) => {
        this.utente = updated;
        this.toastService.success('Profilo aggiornato con successo!');
      },
      error: (err) => {
        const msg = err?.error || 'Errore durante l’aggiornamento.';
        this.toastService.error(msg);
      }
    });
  }

  aggiornaPassword(event: Event): void {
    event.preventDefault();

    if (!this.vecchiaPsw || !this.nuovaPsw || !this.confermaNuovaPsw) {
      this.toastService.error('Compila tutti i campi password.');
      return;
    }

    if (this.nuovaPsw !== this.confermaNuovaPsw) {
      this.toastService.error('Le nuove password non coincidono.');
      return;
    }

    this.utenteService.cambiaPassword(this.vecchiaPsw, this.nuovaPsw).subscribe({
      next: () => {
        this.toastService.success('Password modificata correttamente!');
        this.vecchiaPsw = '';
        this.nuovaPsw = '';
        this.confermaNuovaPsw = '';
        this.cd.detectChanges();
      },
      error: (err) => {
        const msg = err?.error || 'Errore: la vecchia password è errata.';
        this.toastService.error(msg);
      }
    });
  }

  pulisciCronologia(): void {
    if (this.totaleSfide <= 0) {
      this.toastService.error('La cronologia è vuota. Non c’è niente da eliminare.');
      return;
    }

    this.confrontoService.eliminaCronologia().subscribe({
      next: () => {
        this.mieisfide = [];
        this.totaleSfide = 0;
        this.toastService.success('Cronologia resettata!');
        this.cd.detectChanges();
      },
      error: () => {
        this.toastService.error('Errore nella pulizia della cronologia.');
      }
    });
  }

  trackByRecensione(index: number, item: RecensioneModel): number {
    return item.id ?? index;
  }
}

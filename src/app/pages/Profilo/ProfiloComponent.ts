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
import { UtenteModel } from '../../models/UtenteModel';
import { ConfrontoModel } from '../../models/ConfrontoModel';
import { RecensioneModel } from '../../models/RecensioneModel';
import {NavbarComponent} from '../../components/Navbar/NavbarComponent';

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

  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  private resetSub?: Subscription;

  constructor(
    private utenteService: UtenteService,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService,
    private preferitiService: PreferitiService,
    private authService: AuthService,
    private navbarActionService: NavbarActionService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.caricaTutto();

    this.resetSub = this.navbarActionService.resetCronologia$.subscribe(() => {
      this.pulisciCronologia();
    });
  }

  ngOnDestroy(): void {
    this.resetSub?.unsubscribe();
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }

  logout(): void {
    this.authService.logout();
    this.cd.detectChanges();
    this.router.navigate(['/Home']);
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
      this.triggerToast('Dati auto mancanti per l\'eliminazione', 'error');
      return;
    }

    if (confirm(`Vuoi eliminare la recensione per ${recensione.auto1?.marca} vs ${recensione.auto2?.marca}?`)) {
      this.recensioniService.eliminaRecensione(idA1, idA2).subscribe({
        next: () => {
          this.mieRecensioni = this.mieRecensioni.filter(r =>
            !(r.auto1?.id === idA1 && r.auto2?.id === idA2)
          );
          this.triggerToast('Recensione eliminata con successo!', 'success');
          this.cd.detectChanges();
        },
        error: () => this.triggerToast('Errore durante l\'eliminazione.', 'error')
      });
    }
  }

  salvaModificheBase(): void {
    if (!this.utente) return;

    this.utenteService.aggiornaProfilo(this.utente).subscribe({
      next: (updated) => {
        this.utente = updated;
        this.triggerToast('Profilo aggiornato con successo!', 'success');
      },
      error: () => this.triggerToast('Errore durante l\'aggiornamento.', 'error')
    });
  }

  aggiornaPassword(event: Event): void {
    event.preventDefault();

    if (!this.vecchiaPsw || !this.nuovaPsw || !this.confermaNuovaPsw) {
      this.triggerToast('Compila tutti i campi password.', 'error');
      return;
    }

    if (this.nuovaPsw !== this.confermaNuovaPsw) {
      this.triggerToast('Le nuove password non coincidono.', 'error');
      return;
    }

    this.utenteService.cambiaPassword(this.vecchiaPsw, this.nuovaPsw).subscribe({
      next: () => {
        this.triggerToast('Password modificata correttamente!', 'success');
        this.vecchiaPsw = '';
        this.nuovaPsw = '';
        this.confermaNuovaPsw = '';
        this.cd.detectChanges();
      },
      error: () => this.triggerToast('Errore: La vecchia password è errata.', 'error')
    });
  }

  pulisciCronologia(): void {
    if (confirm('Vuoi eliminare tutta la cronologia delle sfide?')) {
      this.confrontoService.eliminaCronologia().subscribe({
        next: () => {
          this.mieisfide = [];
          this.totaleSfide = 0;
          this.triggerToast('Cronologia resettata!', 'success');
          this.cd.detectChanges();
        },
        error: () => this.triggerToast('Errore nella pulizia.', 'error')
      });
    }
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;
    this.cd.detectChanges();

    setTimeout(() => {
      this.showToast = false;
      this.cd.detectChanges();
    }, 3500);
  }

  trackByRecensione(index: number, item: RecensioneModel): number {
    return item.id ?? index;
  }
}

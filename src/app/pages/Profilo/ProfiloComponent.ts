import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { UtenteService } from '../../services/UtenteService';
import { ConfrontoService } from '../../services/ConfrontoService';
import { RecensioniService } from '../../services/RecensioniService';
import { PreferitiService } from '../../services/PreferitiService';
import { UtenteModel } from '../../models/UtenteModel';
import { ConfrontoModel } from '../../models/ConfrontoModel';
import { RecensioneModel } from '../../models/RecensioneModel';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ProfiloComponent.html',
  styleUrls: ['./ProfiloComponent.css']
})
export class ProfiloComponent implements OnInit {
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

  // Logica Pop-up Toast
  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  constructor(
    private utenteService: UtenteService,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService,
    private preferitiService: PreferitiService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.caricaTutto();
  }

  vaiHome(): void {
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

  eliminaRecensione(confrontoId?: number): void {
    if (!confrontoId) return;
    if (confirm('Sei sicuro di voler eliminare definitivamente questa recensione?')) {
      this.recensioniService.eliminaRecensione(confrontoId).subscribe({
        next: () => {
          this.mieRecensioni = this.mieRecensioni.filter(r => r.confronto?.id !== confrontoId);
          this.triggerToast('Recensione eliminata con successo!', 'success');
          this.cd.detectChanges();
        },
        error: () => this.triggerToast('Errore nell\'eliminazione.', 'error')
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
    event.stopPropagation();

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
        this.vecchiaPsw = ''; this.nuovaPsw = ''; this.confermaNuovaPsw = '';
        this.cd.detectChanges();
      },
      error: () => {
        this.triggerToast('Errore: La vecchia password è errata.', 'error');
      }
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
    return item.confronto?.id ?? index;
  }
}

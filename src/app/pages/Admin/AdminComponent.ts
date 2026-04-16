import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AutoService } from '../../services/AutoService';
import { AdminService } from '../../services/AdminService';
import { AutoModel } from '../../models/AutoModel';
import { UtenteModel } from '../../models/UtenteModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

type AdminSection = 'utenti' | 'nuova-auto' | 'gestione-auto';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './AdminComponent.html',
  styleUrls: ['./AdminComponent.css']
})
export class AdminComponent implements OnInit, OnDestroy {
  listaUtenti: UtenteModel[] = [];
  listaAuto: AutoModel[] = [];
  sezioneAttiva: AdminSection = 'nuova-auto';

  nuovaAuto: AutoModel = this.getResetForm();
  autoInModificaId: number | null = null;

  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  private toastTimeout?: ReturnType<typeof setTimeout>;
  private afterToastTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private autoService: AutoService,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const section = params['section'];
      if (
        section === 'utenti' ||
        section === 'nuova-auto' ||
        section === 'gestione-auto'
      ) {
        this.setSezione(section);
      }
    });

    this.caricaUtenti();
    this.caricaAuto();
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (this.afterToastTimeout) clearTimeout(this.afterToastTimeout);
  }

  get isModifica(): boolean {
    return this.autoInModificaId !== null;
  }

  setSezione(nome: AdminSection): void {
    this.sezioneAttiva = nome;

    if (nome === 'utenti' && this.listaUtenti.length === 0) {
      this.caricaUtenti();
    }

    if (nome === 'gestione-auto' && this.listaAuto.length === 0) {
      this.caricaAuto();
    }
  }

  caricaUtenti(): void {
    this.adminService.getAllUtenti().subscribe({
      next: (data: UtenteModel[]) => {
        this.listaUtenti = [...data];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.triggerToast('Errore caricamento utenti.', 'error');
      }
    });
  }

  modificaRuolo(idUtente: number | undefined, nuovoRuolo: string): void {
    if (!idUtente || !nuovoRuolo) return;

    this.adminService.cambiaRuolo(idUtente, nuovoRuolo).subscribe({
      next: (res: UtenteModel) => {
        const index = this.listaUtenti.findIndex(u => u.id === idUtente);

        if (index !== -1) {
          this.listaUtenti[index] = res;
          this.listaUtenti = [...this.listaUtenti];
        }

        this.triggerToast('Ruolo aggiornato con successo!', 'success');
      },
      error: (err: any) => {
        console.error(err);
        const msg = err?.error || 'Errore durante l’aggiornamento del ruolo.';
        this.triggerToast(msg, 'error');
      }
    });
  }

  eliminaUtente(id: number | undefined): void {
    if (!id) return;

    if (confirm("Eliminare definitivamente l'utente?")) {
      const copiaBackup = [...this.listaUtenti];
      this.listaUtenti = this.listaUtenti.filter(u => u.id !== id);

      this.adminService.eliminaUtente(id).subscribe({
        next: () => {
          this.triggerToast('Utente eliminato con successo!', 'success');
        },
        error: (err: any) => {
          console.error(err);
          this.listaUtenti = copiaBackup;
          this.triggerToast("Errore durante l'eliminazione server-side.", 'error');
        }
      });
    }
  }

  caricaAuto(): void {
    this.autoService.getAllAuto().subscribe({
      next: (data: AutoModel[]) => {
        this.listaAuto = [...data];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.triggerToast('Errore caricamento catalogo auto.', 'error');
      }
    });
  }

  salvaAuto(): void {
    if (this.isModifica && this.autoInModificaId !== null) {
      this.autoService.aggiornaAuto(this.autoInModificaId, this.nuovaAuto).subscribe({
        next: (res: AutoModel) => {
          const index = this.listaAuto.findIndex(a => a.id === this.autoInModificaId);

          if (index !== -1) {
            this.listaAuto[index] = res;
            this.listaAuto = [...this.listaAuto];
          }

          this.annullaModifica(false);
          this.setSezione('gestione-auto');

          this.triggerToast(
            'Auto aggiornata con successo!',
            'success',
            2200
          );

          if (this.afterToastTimeout) clearTimeout(this.afterToastTimeout);
          this.afterToastTimeout = setTimeout(() => {
            this.router.navigate(['/Admin']);
          }, 2200);
        },
        error: (err: any) => {
          console.error(err);
          const msg = err?.error || "Errore durante l'aggiornamento dell'auto.";
          this.triggerToast(msg, 'error');
        }
      });

      return;
    }

    this.autoService.aggiungiAuto(this.nuovaAuto).subscribe({
      next: (res: AutoModel) => {
        this.listaAuto = [res, ...this.listaAuto];
        this.nuovaAuto = this.getResetForm();
        this.setSezione('gestione-auto');
        this.triggerToast('Auto aggiunta con successo!', 'success');
      },
      error: (err: any) => {
        console.error(err);
        const msg = err?.error || "Errore durante l'inserimento dell'auto.";
        this.triggerToast(msg, 'error');
      }
    });
  }

  modificaAuto(auto: AutoModel): void {
    this.autoInModificaId = auto.id ?? null;
    this.nuovaAuto = {
      ...this.getResetForm(),
      ...auto
    };

    this.setSezione('nuova-auto');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    this.triggerToast('Dati auto caricati nel form di modifica.', 'success');
  }

  annullaModifica(mostraToast: boolean = false): void {
    this.autoInModificaId = null;
    this.nuovaAuto = this.getResetForm();

    if (mostraToast) {
      this.triggerToast('Modifica annullata.', 'success');
    }
  }

  eliminaAuto(id: number | undefined): void {
    if (!id) return;

    if (confirm('Sei sicuro di voler rimuovere questa auto dal catalogo?')) {
      const copiaBackup = [...this.listaAuto];
      this.listaAuto = this.listaAuto.filter(a => a.id !== id);

      this.autoService.eliminaAuto(id).subscribe({
        next: () => {
          if (this.autoInModificaId === id) {
            this.annullaModifica(false);
          }
          this.triggerToast('Auto rimossa dal catalogo con successo!', 'success');
        },
        error: (err: any) => {
          console.error(err);
          this.listaAuto = copiaBackup;
          const msg = err?.error || "Errore nell'eliminazione dell'auto.";
          this.triggerToast(msg, 'error');
        }
      });
    }
  }

  private triggerToast(
    msg: string,
    type: 'success' | 'error',
    duration: number = 3500
  ): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;
    this.cd.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cd.detectChanges();
    }, duration);
  }

  private getResetForm(): AutoModel {
    return {
      id: undefined,
      marca: '',
      modello: '',
      anno: new Date().getFullYear(),
      prezzo: 0,
      categoria: '',
      codice: '',
      cilindri: 0,
      cv: 0,
      cilindrata: 0,
      coppia: 0,
      alimentazione: '',
      trazione: '',
      euro: '',
      velocitaMax: 0,
      accelerazione0100: 0,
      accelerazione100200: 0,
      accelerazione80140: 0,
      pesoKg: 0,
      rapportoPesoPotenza: 0,
      consumoMedio: 0,
      co2: 0
    } as AutoModel;
  }
}

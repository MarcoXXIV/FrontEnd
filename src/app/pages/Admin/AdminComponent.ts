import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AutoService } from '../../services/AutoService';
import { AdminService } from '../../services/AdminService';
import { AutoModel } from '../../models/AutoModel';
import { UtenteModel } from '../../models/UtenteModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './AdminComponent.html',
  styleUrls: ['./AdminComponent.css']
})
export class AdminComponent implements OnInit {
  listaUtenti: UtenteModel[] = [];
  listaAuto: AutoModel[] = [];
  sezioneAttiva: 'utenti' | 'nuova-auto' | 'gestione-auto' = 'nuova-auto';

  nuovaAuto: any = this.getResetForm();

  constructor(
    private autoService: AutoService,
    private adminService: AdminService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Sottoscrizione ai parametri della query per cambiare sezione dalla Navbar
    this.route.queryParams.subscribe(params => {
      const section = params['section'];
      if (section) {
        this.setSezione(section);
      }
    });

    this.caricaUtenti();
    this.caricaAuto();
  }

  setSezione(nome: 'utenti' | 'nuova-auto' | 'gestione-auto'): void {
    this.sezioneAttiva = nome;

    if (nome === 'utenti' && this.listaUtenti.length === 0) {
      this.caricaUtenti();
    }

    if (nome === 'gestione-auto' && this.listaAuto.length === 0) {
      this.caricaAuto();
    }
    this.cd.detectChanges();
  }

  caricaUtenti(): void {
    this.adminService.getAllUtenti().subscribe({
      next: (data: UtenteModel[]) => {
        this.listaUtenti = [...data];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert('Errore caricamento utenti.');
      }
    });
  }

  modificaRuolo(idUtente: number | undefined, nuovoRuolo: string): void {
    if (!idUtente) return;
    this.adminService.cambiaRuolo(idUtente, nuovoRuolo).subscribe({
      next: (res: UtenteModel) => {
        const index = this.listaUtenti.findIndex(u => u.id === idUtente);
        if (index !== -1) {
          this.listaUtenti[index] = res;
          this.listaUtenti = [...this.listaUtenti];
        }
        alert('Ruolo aggiornato!');
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        alert('Errore durante l’aggiornamento del ruolo.');
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
          this.cd.detectChanges();
        },
        error: (err: any) => {
          this.listaUtenti = copiaBackup;
          alert("Errore durante l'eliminazione server-side.");
          this.cd.detectChanges();
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
        alert('Errore caricamento catalogo auto.');
      }
    });
  }

  aggiungiAuto(): void {
    this.autoService.aggiungiAuto(this.nuovaAuto as AutoModel).subscribe({
      next: (res: AutoModel) => {
        alert('Auto aggiunta!');
        this.listaAuto = [res, ...this.listaAuto];
        this.nuovaAuto = this.getResetForm();
        this.setSezione('gestione-auto');
      },
      error: (err: any) => {
        console.error(err);
        alert("Errore durante l'inserimento dell'auto.");
      }
    });
  }

  eliminaAuto(id: number | undefined): void {
    if (!id) return;
    if (confirm('Sei sicuro di voler rimuovere questa auto dal catalogo?')) {
      const copiaBackup = [...this.listaAuto];
      this.listaAuto = this.listaAuto.filter(a => a.id !== id);
      this.autoService.eliminaAuto(id).subscribe({
        next: () => {
          this.cd.detectChanges();
        },
        error: (err: any) => {
          this.listaAuto = copiaBackup;
          alert("Errore nell'eliminazione dell'auto.");
          this.cd.detectChanges();
        }
      });
    }
  }

  private getResetForm() {
    return {
      marca: '', modello: '', anno: new Date().getFullYear(),
      prezzo: 0, categoria: '', codice: '', cilindri: 0,
      cv: 0, cilindrata: 0, coppia: 0, alimentazione: '',
      trazione: '', euro: '', velocitaMax: 0, accelerazione0100: 0,
      accelerazione100200: 0, accelerazione80140: 0, pesoKg: 0,
      rapportoPesoPotenza: 0, consumoMedio: 0, co2: 0
    };
  }
}

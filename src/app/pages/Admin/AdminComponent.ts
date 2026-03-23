import { Component, OnInit } from '@angular/core';
import { AutoService } from '../../services/AutoService';
import { UtenteService } from '../../services/UtenteService';
import { AutoModel } from '../../models/AutoModel';
import { UtenteModel } from '../../models/UtenteModel';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admincomponent.html',
  styleUrls: ['./admincomponent.css']
})

export class AdminComponent implements OnInit {
  listaAuto: AutoModel[] = [];
  listaUtenti: UtenteModel[] = [];
  sezioneAttiva: 'auto' | 'utenti' | 'nuova-auto' = 'auto';

  nuovaAuto: any = {
    marca: '',
    modello: '',
    anno: new Date().getFullYear(),
    prezzo: 0,
    categoria: '',
    cv: 0,
    velocitaMax: 0,
    accelerazione0100: 0.0,
    accelerazione100200: 0.0,
    accelerazione80140: 0.0,
    cilindri: 0,
    pesoKg: 0,
    consumoMedio: 0.0,
    coppia: 0,
    trazione: '',
    rapportoPesoPotenza: 0.0,
    cilindrata: 0,
    alimentazione: '',
    codice: '',
    euro: '',
    co2: 0
  };

  constructor(
    private autoService: AutoService,
    private utenteService: UtenteService
  ) {}

  ngOnInit(): void {
  }

  setSezione(nome: 'utenti' | 'nuova-auto') {
    this.sezioneAttiva = nome;
    if (nome === 'utenti') this.caricaUtenti();
  }


  caricaUtenti() {
    this.utenteService.getAllUtenti().subscribe({
      next: (data: UtenteModel[]) => {
        this.listaUtenti = data;
        console.log("Utenti caricati:", data);
      },
      error: (err) => alert("Errore nel caricamento utenti: " + err.error)
    });
  }

  aggiungiAuto() {
    this.autoService.aggiungiAuto(this.nuovaAuto).subscribe({
      next: (res) => {
        alert("Auto aggiunta con successo!");
        this.resetForm();
      },
      error: (err) => {
        alert("Errore durante il salvataggio: " + err.error);
        console.error(err);
      }
    });
  }

  eliminaAuto(id: number) {
    if (confirm("Confermi l'eliminazione definitiva?")) {
      this.autoService.eliminaAuto(id).subscribe({
        next: () => {
          alert("Auto eliminata con successo!");
        },
        error: (err) => {
          console.error("Errore eliminazione:", err);
          alert("Si è verificato un errore durante l'eliminazione.");
        }
      });
    }
  }

  private resetForm() {
    this.nuovaAuto = {
      marca: '',
      modello: '',
      anno: new Date().getFullYear(),
      prezzo: 0,
      categoria: '',
      cv: 0,
      velocitaMax: 0,
      accelerazione0100: 0.0,
      accelerazione100200: 0.0,
      accelerazione80140: 0.0,
      cilindri: 0,
      pesoKg: 0,
      consumoMedio: 0.0,
      coppia: 0,
      trazione: '',
      rapportoPesoPotenza: 0.0,
      cilindrata: 0,
      alimentazione: '',
      codice: '',
      euro: '',
      co2: 0
    };
  }


  eliminaUtente(id: number) {
    if (confirm("Sei sicuro di voler eliminare questo utente? L'azione è irreversibile.")) {
      this.utenteService.eliminaUtente(id).subscribe({
        next: () => {
          alert("Utente eliminato!");
          this.caricaUtenti(); // Refresh della lista
        },
        error: (err) => alert("Errore: " + err.error)
      });
    }
  }

  stats = {
    totaleAuto: 0,
    autoPiuPotente: '',
    mediaPrezzi: 0,
    numeroUtenti: 0
  };

  calcolaStats() {
    this.stats.totaleAuto = this.listaAuto.length;
    this.stats.numeroUtenti = this.listaUtenti.length;
    if(this.listaAuto.length > 0) {
      const top = this.listaAuto.reduce((prev, current) => (prev.cv > current.cv) ? prev : current);
      this.stats.autoPiuPotente = `${top.marca} ${top.modello} (${top.cv} CV)`;
    }
  }

}

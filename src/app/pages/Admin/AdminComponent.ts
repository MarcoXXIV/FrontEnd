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
  templateUrl: './AdminComponent.html',
  styleUrl: './AdminComponent.css'
})
export class AdminComponent implements OnInit {
  listaUtenti: UtenteModel[] = [];
  listaAuto: AutoModel[] = []; // Aggiunta lista auto per la gestione
  sezioneAttiva: 'utenti' | 'nuova-auto' | 'gestione-auto' = 'utenti';

  nuovaAuto: any = this.getResetForm();

  constructor(
    private autoService: AutoService,
    private utenteService: UtenteService
  ) {}

  ngOnInit(): void {
    this.caricaUtenti();
    this.caricaAuto(); // Carica anche le auto all'inizializzazione
  }

  setSezione(nome: 'utenti' | 'nuova-auto' | 'gestione-auto') {
    this.sezioneAttiva = nome;
    if (nome === 'utenti') this.caricaUtenti();
    if (nome === 'gestione-auto') this.caricaAuto();
  }

  // --- GESTIONE UTENTI ---
  caricaUtenti() {
    this.utenteService.getAllUtenti().subscribe({
      next: (data) => this.listaUtenti = data,
      error: () => alert("Errore caricamento utenti.")
    });
  }

  modificaRuolo(idUtente: number | undefined, nuovoRuolo: string) {
    if (!idUtente) return;
    this.utenteService.cambiaRuolo(idUtente, nuovoRuolo).subscribe({
      next: () => {
        alert("Ruolo aggiornato!");
        this.caricaUtenti();
      }
    });
  }

  eliminaUtente(id: number | undefined) {
    if (id && confirm("Eliminare definitivamente l'utente?")) {
      this.utenteService.eliminaUtente(id).subscribe({
        next: () => this.caricaUtenti()
      });
    }
  }

  // --- GESTIONE AUTO ---
  caricaAuto() {
    this.autoService.getAllAuto().subscribe({
      next: (data) => this.listaAuto = data,
      error: () => alert("Errore caricamento catalogo auto.")
    });
  }

  aggiungiAuto() {
    this.autoService.aggiungiAuto(this.nuovaAuto as AutoModel).subscribe({
      next: () => {
        alert("Auto aggiunta!");
        this.nuovaAuto = this.getResetForm();
        this.caricaAuto(); // Rinfresca la lista
      }
    });
  }


  eliminaAuto(id: number | undefined) {
    if (id && confirm("Sei sicuro di voler rimuovere questa auto dal catalogo?")) {
      this.autoService.eliminaAuto(id).subscribe({
        next: (messaggio) => {
          alert(messaggio); // Mostra il testo confermato dal backend
          this.caricaAuto(); // Ricarica la lista per riflettere i cambiamenti
        },
        error: (err) => alert("Errore nell'eliminazione dell'auto.")
      });
    }
  }

  private getResetForm() {
    return {
      marca: '', modello: '', anno: new Date().getFullYear(),
      prezzo: 0, cv: 0, velocitaMax: 0, accelerazione0100: 0,
      categoria: '', alimentazione: '', trazione: '', codice: ''
    };
  }
}

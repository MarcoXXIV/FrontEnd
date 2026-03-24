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
  styleUrls: ['./AdminComponent.css']
})
export class AdminComponent implements OnInit {
  listaUtenti: UtenteModel[] = [];
  sezioneAttiva: 'utenti' | 'nuova-auto' = 'utenti'; // Parte subito sugli utenti

  nuovaAuto: any = this.getResetForm();

  constructor(
    private autoService: AutoService,
    private utenteService: UtenteService
  ) {}

  ngOnInit(): void {
    this.caricaUtenti(); // Carica gli utenti appena entri
  }

  setSezione(nome: 'utenti' | 'nuova-auto') {
    this.sezioneAttiva = nome;
    if (nome === 'utenti') this.caricaUtenti();
  }

  caricaUtenti() {
    this.utenteService.getAllUtenti().subscribe({
      next: (data) => this.listaUtenti = data,
      error: (err) => alert("Errore nel caricamento utenti")
    });
  }

  aggiungiAuto() {
    this.autoService.aggiungiAuto(this.nuovaAuto).subscribe({
      next: () => {
        alert("Auto aggiunta con successo!");
        this.nuovaAuto = this.getResetForm(); // Svuota il form
      },
      error: (err) => alert("Errore durante il salvataggio")
    });
  }

  eliminaUtente(id: number | undefined) {
    if (id && confirm("Sei sicuro di voler eliminare questo utente?")) {
      this.utenteService.eliminaUtente(id).subscribe({
        next: () => this.caricaUtenti(), // Ricarica la lista dopo l'eliminazione
        error: (err) => alert("Errore nell'eliminazione")
      });
    }
  }

  private getResetForm() {
    return {
      marca: '', modello: '', anno: new Date().getFullYear(),
      prezzo: 0, cv: 0, velocitaMax: 0, accelerazione0100: 0,
      alimentazione: '', trazione: ''
    };
  }
}

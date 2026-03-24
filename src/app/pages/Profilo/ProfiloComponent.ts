import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtenteService } from '../../services/UtenteService';
import { UtenteModel } from '../../models/UtenteModel';

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ProfiloComponent.html',
  styleUrls: ['./ProfiloComponent.css']
})
export class ProfiloComponent implements OnInit {

  utente?: UtenteModel;

  // Variabili per il cambio password
  vecchiaPsw: string = '';
  nuovaPsw: string = '';
  confermaNuovaPsw: string = '';

  loading: boolean = true;
  messaggioOk: string | null = null;
  messaggioErrore: string | null = null;

  constructor(private utenteService: UtenteService) { }

  ngOnInit(): void {
    this.caricaDatiUtente();
  }

  caricaDatiUtente(): void {
    this.utenteService.getProfilo().subscribe({
      next: (data) => {
        this.utente = data;
        this.loading = false;
      },
      error: (err) => {
        this.messaggioErrore = "Impossibile caricare il profilo.";
        this.loading = false;
      }
    });
  }

  /**
   * Aggiorna Nome e Cognome dell'utente
   */
  salvaModificheBase(): void {
    if (!this.utente) return;

    this.utenteService.aggiornaProfilo(this.utente).subscribe({
      next: (updated) => {
        this.utente = updated;
        this.mostraFeedback("Profilo aggiornato con successo!", true);
      },
      error: () => this.mostraFeedback("Errore durante l'aggiornamento.", false)
    });
  }

  /**
   * Gestisce il cambio password con validazione locale
   */
  aggiornaPassword(): void {
    if (this.nuovaPsw !== this.confermaNuovaPsw) {
      this.mostraFeedback("Le nuove password non coincidono.", false);
      return;
    }

    this.utenteService.cambiaPassword(this.vecchiaPsw, this.nuovaPsw).subscribe({
      next: (res) => {
        this.mostraFeedback("Password cambiata correttamente!", true);
        this.resetCampiPassword();
      },
      error: (err) => this.mostraFeedback("Vecchia password errata o errore server.", false)
    });
  }

  private mostraFeedback(msg: string, isOk: boolean): void {
    if (isOk) {
      this.messaggioOk = msg;
      this.messaggioErrore = null;
    } else {
      this.messaggioErrore = msg;
      this.messaggioOk = null;
    }
    // Nasconde il messaggio dopo 3 secondi
    setTimeout(() => {
      this.messaggioOk = null;
      this.messaggioErrore = null;
    }, 3000);
  }

  private resetCampiPassword(): void {
    this.vecchiaPsw = '';
    this.nuovaPsw = '';
    this.confermaNuovaPsw = '';
  }
}

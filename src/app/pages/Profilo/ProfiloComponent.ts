import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UtenteService } from '../../services/UtenteService';
import { ConfrontoService } from '../../services/ConfrontoService';
import { RecensioniService } from '../../services/RecensioniService'; // 1. Importa il service recensioni
import { UtenteModel } from '../../models/UtenteModel';
import { ConfrontoModel } from '../../models/ConfrontoModel';
import { RecensioneModel } from '../../models/RecensioneModel'; // 2. Importa il modello recensioni

@Component({
  selector: 'app-profilo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ProfiloComponent.html',
  styleUrl: './ProfiloComponent.css'
})
export class ProfiloComponent implements OnInit {

  utente?: UtenteModel;

  // --- Dati Sfide ---
  mieisfide: ConfrontoModel[] = [];
  totaleSfide: number = 0;

  // --- Dati Recensioni ---
  mieRecensioni: RecensioneModel[] = []; // 3. Variabile per la lista recensioni

  // Variabili cambio password
  vecchiaPsw: string = '';
  nuovaPsw: string = '';
  confermaNuovaPsw: string = '';

  loading: boolean = true;
  messaggioOk: string | null = null;
  messaggioErrore: string | null = null;

  constructor(
    private utenteService: UtenteService,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService // 4. Iniettalo
  ) { }

  ngOnInit(): void {
    this.caricaTutto();
  }

  /**
   * Carica tutti i dati della dashboard utente
   */
  caricaTutto(): void {
    this.loading = true;

    // Carica Dati Profilo
    this.utenteService.getProfilo().subscribe({
      next: (data) => {
        this.utente = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });

    // Carica Cronologia Sfide
    this.confrontoService.getMieiConfronti().subscribe({
      next: (data) => this.mieisfide = data
    });

    // Carica Conteggio Totale
    this.confrontoService.getMioTotale().subscribe({
      next: (count) => this.totaleSfide = count
    });

    // 5. Carica le recensioni scritte dall'utente
    this.recensioniService.getMieRecensioni().subscribe({
      next: (data) => this.mieRecensioni = data,
      error: (err) => console.error("Errore caricamento recensioni", err)
    });
  }

  /**
   * Elimina una recensione specifica dal profilo
   */
  eliminaRecensione(confrontoId: number): void {
    if (confirm("Vuoi eliminare questa recensione?")) {
      this.recensioniService.eliminaRecensione(confrontoId).subscribe({
        next: () => {
          // Aggiorna la lista locale rimuovendo quella eliminata
          this.mieRecensioni = this.mieRecensioni.filter(r => r.confronto?.id !== confrontoId);
          this.mostraFeedback("Recensione eliminata.", true);
        },
        error: () => this.mostraFeedback("Errore nell'eliminazione.", false)
      });
    }
  }

  // --- METODI GESTIONE PROFILO (Già esistenti) ---

  salvaModificheBase(): void {
    if (!this.utente) return;
    this.utenteService.aggiornaProfilo(this.utente).subscribe({
      next: (updated) => {
        this.utente = updated;
        this.mostraFeedback("Profilo aggiornato!", true);
      },
      error: () => this.mostraFeedback("Errore aggiornamento.", false)
    });
  }

  aggiornaPassword(): void {
    if (this.nuovaPsw !== this.confermaNuovaPsw) {
      this.mostraFeedback("Password non coincidenti.", false);
      return;
    }
    this.utenteService.cambiaPassword(this.vecchiaPsw, this.nuovaPsw).subscribe({
      next: () => {
        this.mostraFeedback("Password aggiornata!", true);
        this.resetCampiPassword();
      },
      error: () => this.mostraFeedback("Errore: vecchia password errata.", false)
    });
  }

  pulisciCronologia(): void {
    if (confirm("Eliminare tutta la cronologia?")) {
      this.confrontoService.eliminaCronologia().subscribe({
        next: (msg) => {
          this.mieisfide = [];
          this.totaleSfide = 0;
          this.mostraFeedback(msg, true);
        }
      });
    }
  }

  private mostraFeedback(msg: string, isOk: boolean): void {
    if (isOk) this.messaggioOk = msg; else this.messaggioErrore = msg;
    setTimeout(() => { this.messaggioOk = null; this.messaggioErrore = null; }, 3000);
  }

  private resetCampiPassword(): void {
    this.vecchiaPsw = ''; this.nuovaPsw = ''; this.confermaNuovaPsw = '';
  }
}

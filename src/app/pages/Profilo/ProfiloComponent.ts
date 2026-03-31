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

  caricaTutto(): void {
    this.loading = true;

    // 1. Carichiamo prima l'utente. Solo quando abbiamo l'utente, carichiamo il resto.
    this.utenteService.getProfilo().subscribe({
      next: (data) => {
        this.utente = data;
        console.log("DEBUG - Utente caricato:", this.utente);

        // 2. Ora che abbiamo l'ID dell'utente, carichiamo le sue attività
        this.caricaAttivita();

        this.loading = false;
      },
      error: (err) => {
        console.error("Errore nel caricamento profilo:", err);
        this.loading = false;
      }
    });
  }

  private caricaAttivita() {
    this.confrontoService.getMieiConfronti().subscribe(data => {
      this.mieisfide = data;
      console.log("DEBUG - Sfide caricate:", data);
    });

    this.recensioniService.getMieRecensioni().subscribe(data => {
      this.mieRecensioni = data;
      console.log("DEBUG - Recensioni caricate:", data);
    });

    this.confrontoService.getMioTotale().subscribe(count => this.totaleSfide = count);
  }

  private caricaDatiSecondari(): void {
    // Carica Cronologia
    this.confrontoService.getMieiConfronti().subscribe(data => this.mieisfide = data);
    // Carica Totale
    this.confrontoService.getMioTotale().subscribe(count => this.totaleSfide = count);
    // Carica Recensioni
    this.recensioniService.getMieRecensioni().subscribe(data => this.mieRecensioni = data);
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

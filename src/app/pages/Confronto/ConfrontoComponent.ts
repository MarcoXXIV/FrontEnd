import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necessario per il form della recensione
import { ConfrontoService } from '../../services/ConfrontoService';
import { RecensioniService } from '../../services/RecensioniService'; // Importa il service
import { ConfrontoModel } from '../../models/ConfrontoModel';

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule, FormsModule], // Aggiunto FormsModule
  templateUrl: './ConfrontoComponent.html',
  styleUrl: './ConfrontoComponent.css'
})
export class ConfrontoComponent implements OnInit {

  risultato?: ConfrontoModel;
  loading: boolean = true;
  errore: string | null = null;

  // --- Variabili per la Nuova Recensione ---
  voto: number = 5; // Valore di default
  commento: string = '';
  recensioneInviata: boolean = false;
  messaggioFeedback: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private confrontoService: ConfrontoService,
    private recensioniService: RecensioniService, // Iniettato
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id1 = +params['idAuto1'];
      const id2 = +params['idAuto2'];

      if (id1 && id2) {
        this.eseguiSfida(id1, id2);
      } else {
        this.loading = false;
        this.errore = "Parametri insufficienti per avviare la sfida.";
      }
    });
  }

  private eseguiSfida(id1: number, id2: number): void {
    this.loading = true;
    this.errore = null;

    this.confrontoService.eseguiBattaglia(id1, id2).subscribe({
      next: (data) => {
        this.risultato = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 400) {
          this.errore = err.error || "Hai già effettuato questo confronto.";
        } else {
          this.errore = "Errore durante il calcolo della sfida.";
        }
      }
    });
  }


  inviaRecensione(): void {
    if (!this.risultato || !this.risultato.id) return;

    if (this.voto < 1 || this.voto > 10) {
      this.messaggioFeedback = "Il voto deve essere compreso tra 1 e 10.";
      return;
    }

    this.recensioniService.aggiungiRecensione(this.risultato.id, this.voto, this.commento).subscribe({
      next: (res) => {
        this.recensioneInviata = true;
        this.messaggioFeedback = "Grazie per il tuo feedback!";
        this.voto = 0;
        this.commento = '';
      },
      error: (err) => {
        this.messaggioFeedback = "Errore durante l'invio della recensione.";
        console.error(err);
      }
    });
  }

  tornaAllaHome(): void {
    this.router.navigate(['/Home']);
  }
}

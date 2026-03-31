import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferitiService } from '../../services/PreferitiService';
import { PreferitoModel } from '../../models/PreferitoModel';
import { AutoCardComponent } from '../../components/auto-card/auto-cardComponent';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './PreferitiComponent.html',
  styleUrl: './PreferitiComponent.css'
})
export class PreferitiComponent implements OnInit {

  listaPreferiti: PreferitoModel[] = [];
  totalePreferiti: number = 0; // <--- Nuova variabile per il conteggio
  loading: boolean = true;
  messaggio: string = '';

  constructor(private preferitiService: PreferitiService) {}

  ngOnInit(): void {
    this.caricaPreferiti();
    this.aggiornaConteggio(); // <--- Carica il numero totale all'avvio
  }


  caricaPreferiti(): void {
    this.loading = true;
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (data) => {
        this.listaPreferiti = data;
        this.loading = false;
        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Non hai ancora salvato nessun confronto nei preferiti.";
        }
      },
      error: (err) => {
        this.loading = false;
        this.messaggio = "Errore nel recupero dei preferiti.";
        console.error(err);
      }
    });
  }


  aggiornaConteggio(): void {
    this.preferitiService.getConteggio().subscribe({
      next: (count) => this.totalePreferiti = count,
      error: (err) => console.error("Errore nel recupero del conteggio:", err)
    });
  }


  rimuoviPreferito(confrontoId: number): void {
    this.preferitiService.togglePreferito(confrontoId).subscribe({
      next: () => {
        // 1. Filtriamo la lista locale (per velocità della UI)
        this.listaPreferiti = this.listaPreferiti.filter(p => p.confronto?.id !== confrontoId);

        // 2. Aggiorniamo il contatore dal server per sicurezza
        this.aggiornaConteggio();

        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Lista preferiti svuotata.";
        }
      },
      error: (err) => console.error("Errore durante la rimozione:", err)
    });
  }
}

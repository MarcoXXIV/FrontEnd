import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreferitiService } from '../../services/PreferitiService';
import { PreferitoModel } from '../../models/PreferitoModel';
import { ConfrontoCardComponent } from '../../components/confronto-card/confronto-cardComponent';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, ConfrontoCardComponent, RouterModule],
  templateUrl: './PreferitiComponent.html',
  styleUrl: './PreferitiComponent.css'
})
export class PreferitiComponent implements OnInit {

  listaPreferiti: PreferitoModel[] = [];
  totalePreferiti: number = 0;
  loading: boolean = true;
  messaggio: string = '';

  constructor(private preferitiService: PreferitiService) {}

  ngOnInit(): void {
    this.caricaPreferiti();
    this.aggiornaConteggio();
  }

  caricaPreferiti(): void {
    this.loading = true;
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (data) => {
        this.listaPreferiti = data;
        this.loading = false;
        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Il tuo garage è attualmente vuoto.";
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
      error: (err) => console.error("Errore conteggio:", err)
    });
  }

  rimuoviPreferito(confrontoId: number): void {
    this.preferitiService.togglePreferito(confrontoId).subscribe({
      next: () => {
        this.listaPreferiti = this.listaPreferiti.filter(p => p.confronto?.id !== confrontoId);
        this.aggiornaConteggio();
        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Garage svuotato.";
        }
      },
      error: (err) => console.error("Errore rimozione:", err)
    });
  }
}

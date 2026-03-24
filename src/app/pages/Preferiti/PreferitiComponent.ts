import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferitiService } from '../../services/PreferitiService';
import { PreferitoModel } from '../../models/PreferitoModel';
import { AutoCardComponent } from '../../components/auto-card/auto-cardComponent';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, AutoCardComponent],
  templateUrl: './PreferitiComponent.html',
  styleUrls: ['./PreferitiComponent.css']
})
export class PreferitiComponent implements OnInit {

  listaPreferiti: PreferitoModel[] = [];
  loading: boolean = true;
  messaggio: string = '';

  constructor(private preferitiService: PreferitiService) {}

  ngOnInit(): void {
    this.caricaPreferiti();
  }

  /**
   * Recupera i preferiti dell'utente dal server
   */
  caricaPreferiti(): void {
    this.loading = true;
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (data) => {
        this.listaPreferiti = data;
        this.loading = false;
        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Non hai ancora salvato nessun bolide nei preferiti.";
        }
      },
      error: (err) => {
        this.loading = false;
        this.messaggio = "Errore nel recupero dei preferiti. Assicurati di essere loggato.";
        console.error(err);
      }
    });
  }

  /**
   * Rimuove un preferito dalla lista (Aggiorna la UI senza ricaricare la pagina)
   */
  rimuoviPreferito(idAuto: number): void {
    this.preferitiService.togglePreferito(idAuto).subscribe({
      next: () => {
        this.listaPreferiti = this.listaPreferiti.filter(p => p.id !== idAuto);

        if (this.listaPreferiti.length === 0) {
          this.messaggio = "Lista preferiti svuotata.";
        }
      },
      error: (err) => console.error("Errore durante la rimozione:", err)
    });
  }
}

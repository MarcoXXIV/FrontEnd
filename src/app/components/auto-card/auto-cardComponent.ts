import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PreferitiService } from '../../services/PreferitiService';
import { ConfrontoModel } from '../../models/ConfrontoModel';

@Component({
  selector: 'app-auto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-cardComponent.html',
  styleUrl: './auto-cardComponent.css' // Usato singolare per standard Angular 17+
})
export class AutoCardComponent {
  // Riceve l'intero oggetto Confronto dal componente padre
  @Input() confronto!: ConfrontoModel;

  // Emette l'ID del confronto al padre (es. per aprire il dettaglio o una gara)
  @Output() selezionaConfronto = new EventEmitter<number>();

  isPreferito: boolean = false;

  constructor(private preferitiService: PreferitiService) {}

  toggleLike(event: Event): void {
    event.stopPropagation(); // Evita che il click sul cuore attivi il click della card intera

    if (!this.confronto || !this.confronto.id) {
      console.warn("Impossibile aggiungere ai preferiti: ID confronto mancante.");
      return;
    }

    this.preferitiService.togglePreferito(this.confronto.id).subscribe({
      next: (response) => {
        this.isPreferito = !this.isPreferito;
        console.log('Stato preferito aggiornato:', response);
      },
      error: (err) => {
        console.error("Errore durante il toggle del preferito:", err);
      }
    });
  }

  onCardClick(): void {
    if (this.confronto && this.confronto.id) {
      this.selezionaConfronto.emit(this.confronto.id);
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoModel } from '../../models/AutoModel'; // Usa il modello dell'auto singola

@Component({
  selector: 'app-auto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-cardComponent.html',
  styleUrl: './auto-cardComponent.css'
})
export class AutoCardComponent {
  // Cambiato da 'confronto' a 'auto' per allinearsi con HomeComponent.html
  @Input() auto!: AutoModel;

  // Cambiato da 'selezionaConfronto' a 'selezionaSfida' per allinearsi con HomeComponent.html
  @Output() seleziona = new EventEmitter<number>();

  // Se vuoi gestire i preferiti dell'auto singola (opzionale)
  isPreferito: boolean = false;

  onCardClick(): void {
    if (this.auto && this.auto.id) {
      // Emette l'ID dell'auto singola
      this.seleziona.emit(this.auto.id);
    }
  }
}

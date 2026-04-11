import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoModel } from '../../models/AutoModel';

@Component({
  selector: 'app-auto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-cardComponent.html',
  styleUrl: './auto-cardComponent.css'
})
export class AutoCardComponent {
  @Input() auto!: AutoModel;

  @Output() seleziona = new EventEmitter<number>();
  @Output() apriDettaglio = new EventEmitter<number>();

  isPreferito: boolean = false;

  onCardClick(): void {
    if (this.auto && this.auto.id) {
      this.apriDettaglio.emit(this.auto.id);
    }
  }

  onAggiungiAlConfronto(event: MouseEvent): void {
    event.stopPropagation();

    if (this.auto && this.auto.id) {
      this.seleziona.emit(this.auto.id);
    }
  }
}

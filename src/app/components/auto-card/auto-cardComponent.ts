import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoModel } from '../../models/AutoModel';

@Component({
  selector: 'app-auto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-cardComponent.html',
  styleUrls: ['./auto-cardComponent.css']
})
export class AutoCardComponent implements OnChanges {
  @Input() auto!: AutoModel;
  @Input() selezionata: boolean = false;

  @Output() seleziona = new EventEmitter<AutoModel>();
  @Output() apriDettaglio = new EventEmitter<number>();

  isSelezionata: boolean = false;
  immagineSrc: string = '/assets/img/Errore.png';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['auto']) {
      this.impostaImmagine();
    }

    if (changes['selezionata']) {
      this.isSelezionata = this.selezionata;
    }
  }

  private impostaImmagine(): void {
    this.immagineSrc = this.auto?.codice
      ? `/assets/img/${this.auto.codice}.png`
      : '/assets/img/Errore.png';
  }

  onImageError(): void {
    this.immagineSrc = '/assets/img/Errore.png';
  }

  onCardClick(): void {
    if (this.auto?.id) {
      this.apriDettaglio.emit(this.auto.id);
    }
  }

  onAggiungiAlConfronto(event: MouseEvent): void {
    event.stopPropagation();

    if (this.auto?.id) {
      this.seleziona.emit(this.auto);
    }
  }
}

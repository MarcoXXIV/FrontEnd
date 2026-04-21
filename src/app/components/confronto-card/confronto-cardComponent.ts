import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importa il router se serve navigare
import { PreferitoModel } from '../../models/PreferitoModel';

@Component({
  selector: 'app-confronto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confronto-cardComponent.html',
  styleUrl: './confronto-cardComponent.css'
})
export class ConfrontoCardComponent {
  @Input() preferito!: PreferitoModel;
  @Output() rimuovi = new EventEmitter<number>();

  constructor(private router: Router) {}

  onRemoveClick(event: Event): void {
    event.stopPropagation();
    if (this.preferito.confronto?.id) {
      this.rimuovi.emit(this.preferito.confronto.id);
    }
  }

  onCardClick(): void {
    if (this.preferito.confronto?.id) {
      this.router.navigate(['/Confronto'], {
        queryParams: {
          idAuto1: this.preferito.confronto.auto1.id,
          idAuto2: this.preferito.confronto.auto2.id
        }
      });
    }
  }
}

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutoModel } from '../../models/AutoModel';
import { PreferitiService } from '../../services/PreferitiService';

@Component({
  selector: 'app-auto-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auto-cardComponent.html',
  styleUrls: ['./auto-cardComponent.css']
})
export class AutoCardComponent {
  // Riceve i dati dell'auto dal componente Home
  @Input() auto!: AutoModel;

  // Emette l'ID al padre (Home) quando si clicca la card per la sfida
  @Output() selezionaSfida = new EventEmitter<number>();

  isPreferito: boolean = false;

  constructor(private preferitiService: PreferitiService) {} // <--- Iniezione corretta

  toggleLike(event: Event): void {
    event.stopPropagation(); // Impedisce che il click sul cuore attivi la selezione della card

    if (!this.auto.id) return;

    this.preferitiService.togglePreferito(this.auto.id).subscribe({
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
    if (this.auto.id) {
      this.selezionaSfida.emit(this.auto.id);
    }
  }
}

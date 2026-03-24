import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filtri',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filtriComponent.html',
  styleUrls: ['./filtriComponent.css']
})
export class FiltriComponent {
  // Variabili legate agli input HTML
  marca: string = '';
  modello: string = '';

  @Output() cercaCambiato = new EventEmitter<{marca: string, modello: string}>();

  inviaFiltri() {
    this.cercaCambiato.emit({
      marca: this.marca,
      modello: this.modello
    });
  }
}

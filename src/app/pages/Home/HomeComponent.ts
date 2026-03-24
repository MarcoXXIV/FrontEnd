import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoService } from '../../services/AutoService';
import { AutoModel } from '../../models/AutoModel';
import { AutoCardComponent } from '../../components/auto-card/auto-cardComponent';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCardComponent],
  templateUrl: './HomeComponent.html',
  styleUrls: ['./HomeComponent.css']
})
export class HomeComponent implements OnInit {

  listaAuto: AutoModel[] = [];
  autoFiltrate: AutoModel[] = [];

  autoSelezionate: number[] = [];

  filtroMarca: string = '';
  filtroModello: string = '';

  // Stati della UI
  loading: boolean = true;
  messaggio: string = '';

  constructor(
    private autoService: AutoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.caricaCatalogo();
  }

  caricaCatalogo(): void {
    this.loading = true;
    this.autoService.getAllAuto().subscribe({
      next: (data) => {
        this.listaAuto = data;
        this.autoFiltrate = data;
        this.loading = false;
      },
      error: (err) => {
        console.error("Errore caricamento catalogo", err);
        this.loading = false;
        this.messaggio = "Impossibile caricare il catalogo al momento.";
      }
    });
  }

  eseguiRicerca(): void {
    if (!this.filtroMarca && !this.filtroModello) {
      this.autoFiltrate = this.listaAuto;
      return;
    }

    this.autoService.searchAuto(this.filtroMarca, this.filtroModello).subscribe({
      next: (risultati) => {
        this.autoFiltrate = risultati;
        if (risultati.length === 0) {
          this.messaggio = "Nessun bolide trovato con questi criteri.";
        } else {
          this.messaggio = '';
        }
      }
    });
  }

  gestisciSelezione(idAuto: number): void {
    const index = this.autoSelezionate.indexOf(idAuto);

    if (index > -1) {
      this.autoSelezionate.splice(index, 1);
    } else if (this.autoSelezionate.length < 2) {
      this.autoSelezionate.push(idAuto);
    }

    if (this.autoSelezionate.length === 2) {
      this.router.navigate(['/confronto'], {
        queryParams: {
          idAuto1: this.autoSelezionate[0],
          idAuto2: this.autoSelezionate[1]
        }
      });
      this.autoSelezionate = [];
    }
  }

  filtraPerCategoria(cat: string): void {
    this.loading = true;
    this.autoService.getAutoByCategoria(cat).subscribe(data => {
      this.autoFiltrate = data;
      this.loading = false;
    });
  }

  gestisciFiltri(criteri: any) {
    this.autoFiltrate = this.listaAuto.filter(auto => {
      return (!criteri.marca || auto.marca.toLowerCase().includes(criteri.marca.toLowerCase())) &&
        (!criteri.prezzoMax || auto.prezzo <= criteri.prezzoMax) &&
        (!criteri.alimentazione || auto.alimentazione === criteri.alimentazione);
    });
  }
}

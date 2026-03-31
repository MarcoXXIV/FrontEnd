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
  imports: [CommonModule, FormsModule],
  templateUrl: './HomeComponent.html',
  styleUrl: './HomeComponent.css'
})
export class HomeComponent implements OnInit {
  listaAuto: AutoModel[] = [];
  autoFiltrate: AutoModel[] = [];
  autoSelezionate: number[] = [];

  filtroMarca: string = '';
  filtroModello: string = '';
  loading: boolean = true;
  messaggio: string = '';

  constructor(private autoService: AutoService, private router: Router) {}

  ngOnInit(): void {
    this.caricaCatalogo();
  }

  caricaCatalogo(): void {
    this.loading = true;
    this.autoService.getRandom10().subscribe({
      next: (data) => {
        this.listaAuto = data;
        this.autoFiltrate = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.messaggio = "Errore nel caricamento del catalogo.";
      }
    });
  }

  eseguiRicerca(): void {
    this.loading = true;
    this.autoService.searchAuto(this.filtroMarca, this.filtroModello).subscribe({
      next: (risultati) => {
        this.autoFiltrate = risultati;
        this.messaggio = risultati.length === 0 ? "Nessun bolide trovato." : "";
        this.loading = false;
      }
    });
  }

  gestisciSelezione(idAuto: number): void {
    const index = this.autoSelezionate.indexOf(idAuto);

    if (index > -1) {
      this.autoSelezionate.splice(index, 1);
    } else {
      this.autoSelezionate.push(idAuto);
    }

    if (this.autoSelezionate.length === 2) {
      this.router.navigate(['/Confronto'], {
        queryParams: {
          idAuto1: this.autoSelezionate[0],
          idAuto2: this.autoSelezionate[1]
        }
      });
      this.autoSelezionate = [];
    }
  }

  caricaPerCategoria(categoria: string): void {
    this.loading = true;
    this.autoService.getAutoByCategoria(categoria).subscribe({
      next: (data) => {
        this.autoFiltrate = data;
        this.loading = false;
        this.messaggio = data.length > 0 ? `Categoria: ${categoria}` : "Nessuna auto in questa categoria.";
      },
      error: () => {
        this.loading = false;
        this.messaggio = "Errore nel recupero della categoria.";
      }
    });
  }

  caricaTopAccelerazione(): void {
    this.loading = true;
    this.autoService.getTopAccelerazione().subscribe({
      next: (data) => {
        this.autoFiltrate = data;
        this.loading = false;
        this.messaggio = "Top 10 Accelerazione (0-100 km/h)";
      },
      error: () => {
        this.loading = false;
        this.messaggio = "Errore nel recupero della classifica accelerazione.";
      }
    });
  }

  caricaTopGreen(): void {
    this.loading = true;
    this.autoService.getTopGreen().subscribe({
      next: (data) => {
        this.autoFiltrate = data;
        this.loading = false;
        this.messaggio = "Top 10 Auto Green";
      },
      error: () => {
        this.loading = false;
        this.messaggio = "Errore nel recupero della classifica Green.";
      }
    });
  }

  filtraPerCategoria(cat: string): void {
    this.autoFiltrate = this.listaAuto.filter(a => a.categoria === cat);
  }

  gestisciFiltri(criteri: any) {
    this.autoFiltrate = this.listaAuto.filter(auto => {
      return (!criteri.marca || auto.marca.toLowerCase().includes(criteri.marca.toLowerCase())) &&
        (!criteri.prezzoMax || auto.prezzo <= criteri.prezzoMax) &&
        (!criteri.alimentazione || auto.alimentazione === criteri.alimentazione);
    });
  }
}

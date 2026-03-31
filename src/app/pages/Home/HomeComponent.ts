import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Importa ChangeDetectorRef
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
  styleUrl: './HomeComponent.css'
})
export class HomeComponent implements OnInit {
  listaAuto: AutoModel[] = [];
  autoFiltrate: AutoModel[] = [];
  autoSelezionate: number[] = [];

  filtroMarca: string = '';
  filtroModello: string = '';
  loading: boolean = false;
  messaggio: string = '';

  constructor(
    private autoService: AutoService,
    private router: Router,
    private cd: ChangeDetectorRef // Iniezione del Change Detector
  ) {}

  ngOnInit(): void {
    this.caricaCatalogo();
  }

  // Metodo generico per gestire la risposta e forzare la UI
  private gestisciRisposta(data: AutoModel[], msg: string = ''): void {
    this.autoFiltrate = [...data];
    this.messaggio = msg;
    this.loading = false;
    this.cd.detectChanges(); // FORZA l'aggiornamento della grafica
  }

  caricaCatalogo(): void {
    this.loading = true;
    this.messaggio = '';
    this.autoService.getRandom10().subscribe({
      next: (data) => {
        this.listaAuto = data;
        this.gestisciRisposta(data);
      },
      error: (err) => {
        console.error("Errore API:", err);
        this.loading = false;
        this.messaggio = "Impossibile caricare i bolidi.";
        this.cd.detectChanges();
      }
    });
  }

  eseguiRicerca(): void {
    this.loading = true;
    this.messaggio = '';
    this.autoService.searchAuto(this.filtroMarca, this.filtroModello).subscribe({
      next: (risultati) => {
        const msg = risultati.length === 0 ? "Nessun bolide trovato." : `Risultati per: ${this.filtroMarca}`;
        this.gestisciRisposta(risultati, msg);
      },
      error: () => {
        this.loading = false;
        this.messaggio = "Errore durante la ricerca.";
        this.cd.detectChanges();
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

    this.cd.detectChanges(); // Aggiorna i badge di selezione

    if (this.autoSelezionate.length === 2) {
      this.router.navigate(['/Confronto'], {
        queryParams: { idAuto1: this.autoSelezionate[0], idAuto2: this.autoSelezionate[1] }
      });
      this.autoSelezionate = [];
    }
  }

  caricaPerCategoria(categoria: string): void {
    if (!categoria) {
      this.caricaCatalogo();
      return;
    }
    this.loading = true;
    this.autoService.getAutoByCategoria(categoria).subscribe({
      next: (data) => this.gestisciRisposta(data, `Categoria: ${categoria}`),
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  caricaTopGreen(): void {
    this.loading = true;
    this.autoService.getTopGreen().subscribe({
      next: (data) => this.gestisciRisposta(data, "Classifica Eco Friendly (Minor CO2)"),
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  caricaTopAccelerazione(): void {
    this.loading = true;
    this.autoService.getTopAccelerazione().subscribe({
      next: (data) => this.gestisciRisposta(data, "Top 10 Accelerazione 0-100 km/h"),
      error: () => {
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }
}

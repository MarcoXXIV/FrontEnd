import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';

import { AutoService } from '../../services/AutoService';
import { AutoModel } from '../../models/AutoModel';
import { AutoCardComponent } from '../../components/auto-card/auto-cardComponent';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCardComponent, NavbarComponent],
  templateUrl: './HomeComponent.html',
  styleUrl: './HomeComponent.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  listaAuto: AutoModel[] = [];
  autoFiltrate: AutoModel[] = [];
  autoSelezionate: number[] = [];

  filtroMarca: string = '';
  filtroModello: string = '';
  loading: boolean = false;
  messaggio: string = '';

  utenteLoggato: boolean = false;
  isAdminUser: boolean = false;

  private routerSub?: Subscription;

  constructor(
    private autoService: AutoService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.aggiornaStatoUtente();
    this.caricaCatalogo();

    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.aggiornaStatoUtente();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private aggiornaStatoUtente(): void {
    this.utenteLoggato = !!localStorage.getItem('token');
    this.isAdminUser = localStorage.getItem('ruolo') === 'ADMIN';
    this.cd.detectChanges();
  }

  private gestisciRisposta(data: AutoModel[], msg: string = ''): void {
    this.listaAuto = [...data];
    this.autoFiltrate = [...data];
    this.messaggio = msg;
    this.loading = false;
    this.cd.detectChanges();
  }

  caricaCatalogo(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.getRandom10().subscribe({
      next: (data) => {
        this.gestisciRisposta(data, 'Esplora il catalogo. Per sfidare 2 auto serve il login.');
      },
      error: (err) => {
        console.error('Errore API random:', err);
        this.loading = false;
        this.messaggio = 'Impossibile caricare i bolidi.';
        this.cd.detectChanges();
      }
    });
  }

  eseguiRicerca(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.searchAuto(this.filtroMarca, this.filtroModello).subscribe({
      next: (risultati) => {
        const msg = risultati.length === 0
          ? 'Nessun bolide trovato.'
          : `Risultati trovati${this.filtroMarca ? ' per marca: ' + this.filtroMarca : ''}${this.filtroModello ? ' / modello: ' + this.filtroModello : ''}`;

        this.gestisciRisposta(risultati, msg);
      },
      error: (err) => {
        console.error('Errore ricerca:', err);
        this.loading = false;
        this.messaggio = 'Errore durante la ricerca.';
        this.cd.detectChanges();
      }
    });
  }

  resetRicerca(): void {
    this.filtroMarca = '';
    this.filtroModello = '';
    this.autoSelezionate = [];
    this.caricaCatalogo();
  }

  gestisciSelezione(idAuto: number): void {
    const index = this.autoSelezionate.indexOf(idAuto);

    if (index > -1) {
      this.autoSelezionate.splice(index, 1);
      this.cd.detectChanges();
      return;
    }

    if (this.autoSelezionate.length < 2) {
      this.autoSelezionate.push(idAuto);
    }

    this.cd.detectChanges();

    if (this.autoSelezionate.length === 2) {
      if (!this.utenteLoggato) {
        this.messaggio = 'Per avviare una sfida devi effettuare il login.';
        this.cd.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/Login']);
        }, 400);

        return;
      }

      const [id1, id2] = this.autoSelezionate;

      this.router.navigate(['/Confronto'], {
        queryParams: { idAuto1: id1, idAuto2: id2 }
      });

      this.autoSelezionate = [];
    }
  }

  apriInfoAuto(idAuto: number): void {
    console.log('Navigo verso info auto con id:', idAuto);
    if (!idAuto) return;
    this.router.navigate(['/info-auto', idAuto]);
  }


  caricaPerCategoria(categoria: string): void {
    if (!categoria) {
      this.caricaCatalogo();
      return;
    }

    this.loading = true;
    this.messaggio = '';

    this.autoService.getAutoByCategoria(categoria).subscribe({
      next: (data) => this.gestisciRisposta(data, `Categoria selezionata: ${categoria}`),
      error: (err) => {
        console.error('Errore categoria:', err);
        this.loading = false;
        this.messaggio = 'Errore nel caricamento della categoria.';
        this.cd.detectChanges();
      }
    });
  }

  caricaTopGreen(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.getTopGreen().subscribe({
      next: (data) => this.gestisciRisposta(data, 'Classifica Eco Friendly (minor CO2)'),
      error: (err) => {
        console.error('Errore top green:', err);
        this.loading = false;
        this.messaggio = 'Errore nel caricamento della classifica green.';
        this.cd.detectChanges();
      }
    });
  }

  caricaTopAccelerazione(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.getTopAccelerazione().subscribe({
      next: (data) => this.gestisciRisposta(data, 'Top 10 accelerazione 0-100 km/h'),
      error: (err) => {
        console.error('Errore top accelerazione:', err);
        this.loading = false;
        this.messaggio = 'Errore nel caricamento della classifica accelerazione.';
        this.cd.detectChanges();
      }
    });
  }

  trackByAutoId(index: number, auto: AutoModel): number {
    return auto.id ?? index;
  }
}

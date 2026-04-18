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
  styleUrl: './HomeComponent.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  listaAuto: AutoModel[] = [];
  autoFiltrate: AutoModel[] = [];
  autoPaginata: AutoModel[] = [];

  autoSelezionate: AutoModel[] = [];

  filtroMarca: string = '';
  filtroModello: string = '';
  loading: boolean = false;
  messaggio: string = '';

  utenteLoggato: boolean = false;
  isAdminUser: boolean = false;

  paginaCorrente: number = 1;
  readonly autoPerPagina: number = 12;
  totalePagine: number = 0;
  pagine: number[] = [];

  marchiDisponibili: string[] = [];
  modelliDisponibili: string[] = [];

  compareMobileAperto: boolean = false;

  private routerSub?: Subscription;

  constructor(
    private autoService: AutoService,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.aggiornaStatoUtente();
    this.caricaCatalogo();

    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.aggiornaStatoUtente();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  get confrontoCompleto(): boolean {
    return this.autoSelezionate.length === 2;
  }

  get primoSelezionato(): AutoModel | null {
    return this.autoSelezionate[0] ?? null;
  }

  get secondoSelezionato(): AutoModel | null {
    return this.autoSelezionate[1] ?? null;
  }

  isAutoSelezionata(id?: number): boolean {
    if (!id) return false;
    return this.autoSelezionate.some((auto) => auto.id === id);
  }

  toggleCompareMobile(): void {
    this.compareMobileAperto = !this.compareMobileAperto;
    this.cd.detectChanges();
  }

  chiudiCompareMobile(): void {
    this.compareMobileAperto = false;
    this.cd.detectChanges();
  }

  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  private aggiornaStatoUtente(): void {
    this.utenteLoggato = !!localStorage.getItem('token');
    this.isAdminUser = localStorage.getItem('ruolo') === 'ADMIN';
    this.cd.detectChanges();
  }

  private estraiValoriUnici(values: Array<string | null | undefined>): string[] {
    return [
      ...new Set(
        values
          .map((v) => (v ?? '').trim())
          .filter((v): v is string => v.length > 0),
      ),
    ].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }

  private aggiornaSuggerimenti(data: AutoModel[]): void {
    this.marchiDisponibili = this.estraiValoriUnici(data.map((auto) => auto.marca));
    this.aggiornaModelliDisponibili(data);
  }

  private aggiornaModelliDisponibili(source: AutoModel[] = this.listaAuto): void {
    const marcaRicercata = this.filtroMarca.trim().toLowerCase();

    const modelli = source
      .filter((auto) => {
        const marca = (auto.marca ?? '').trim().toLowerCase();
        return !marcaRicercata || marca.includes(marcaRicercata);
      })
      .map((auto) => auto.modello);

    this.modelliDisponibili = this.estraiValoriUnici(modelli);

    const modelloAttuale = this.filtroModello.trim().toLowerCase();
    const modelloAncoraValido = this.modelliDisponibili.some(
      (m) => m.toLowerCase() === modelloAttuale,
    );

    if (this.filtroModello && !modelloAncoraValido) {
      this.filtroModello = '';
    }
  }

  onMarcaChange(value: string): void {
    this.filtroMarca = value;
    this.aggiornaModelliDisponibili();
  }

  private gestisciRisposta(data: AutoModel[], msg: string = ''): void {
    this.listaAuto = [...data];
    this.autoFiltrate = [...data];
    this.messaggio = msg;
    this.loading = false;

    this.aggiornaSuggerimenti(this.listaAuto);

    this.paginaCorrente = 1;
    this.aggiornaPaginazione();

    this.cd.detectChanges();
  }

  private aggiornaPaginazione(): void {
    this.totalePagine = Math.ceil(this.autoFiltrate.length / this.autoPerPagina);

    if (this.totalePagine === 0) {
      this.autoPaginata = [];
      this.pagine = [];
      return;
    }

    if (this.paginaCorrente > this.totalePagine) {
      this.paginaCorrente = this.totalePagine;
    }

    const start = (this.paginaCorrente - 1) * this.autoPerPagina;
    const end = start + this.autoPerPagina;

    this.autoPaginata = this.autoFiltrate.slice(start, end);
    this.pagine = Array.from({ length: this.totalePagine }, (_, i) => i + 1);
  }

  vaiAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalePagine || pagina === this.paginaCorrente) {
      return;
    }

    this.paginaCorrente = pagina;
    this.aggiornaPaginazione();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cd.detectChanges();
  }

  paginaPrecedente(): void {
    if (this.paginaCorrente > 1) {
      this.vaiAPagina(this.paginaCorrente - 1);
    }
  }

  paginaSuccessiva(): void {
    if (this.paginaCorrente < this.totalePagine) {
      this.vaiAPagina(this.paginaCorrente + 1);
    }
  }

  get indiceInizio(): number {
    if (this.autoFiltrate.length === 0) return 0;
    return (this.paginaCorrente - 1) * this.autoPerPagina + 1;
  }

  get indiceFine(): number {
    return Math.min(this.paginaCorrente * this.autoPerPagina, this.autoFiltrate.length);
  }

  caricaCatalogo(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.getAllAuto().subscribe({
      next: (data) => {
        this.gestisciRisposta(
          data,
          'Esplora il catalogo e seleziona due auto per il confronto.',
        );
      },
      error: (err) => {
        console.error('Errore API random:', err);
        this.loading = false;
        this.messaggio = 'Impossibile caricare i bolidi.';
        this.cd.detectChanges();
      },
    });
  }

  eseguiRicerca(): void {
    this.loading = true;
    this.messaggio = '';

    this.autoService.searchAuto(this.filtroMarca, this.filtroModello).subscribe({
      next: (risultati) => {
        const msg =
          risultati.length === 0
            ? 'Nessun bolide trovato.'
            : `Risultati trovati${this.filtroMarca ? ' per marca: ' + this.filtroMarca : ''}${this.filtroModello ? ' / modello: ' + this.filtroModello : ''}`;

        this.gestisciRisposta(risultati, msg);
      },
      error: (err) => {
        console.error('Errore ricerca:', err);
        this.loading = false;
        this.messaggio = 'Errore durante la ricerca.';
        this.cd.detectChanges();
      },
    });
  }

  resetRicerca(): void {
    this.filtroMarca = '';
    this.filtroModello = '';
    this.autoSelezionate = [];
    this.compareMobileAperto = false;
    this.paginaCorrente = 1;
    this.caricaCatalogo();
  }

  gestisciSelezione(auto: AutoModel): void {
    if (!auto?.id) return;

    const index = this.autoSelezionate.findIndex((item) => item.id === auto.id);

    if (index > -1) {
      this.autoSelezionate.splice(index, 1);

      if (this.autoSelezionate.length === 0) {
        this.compareMobileAperto = false;
      }

      this.messaggio =
        this.autoSelezionate.length === 0
          ? 'Selezione confronto svuotata.'
          : 'Auto rimossa dal confronto.';

      this.cd.detectChanges();
      return;
    }

    if (this.autoSelezionate.length >= 2) {
      this.messaggio = 'Hai già selezionato 2 auto per il confronto.';
      this.cd.detectChanges();
      return;
    }

    this.autoSelezionate = [...this.autoSelezionate, auto];

    if (this.isMobileView()) {
      this.compareMobileAperto = true;
    }

    if (this.autoSelezionate.length === 2) {
      this.messaggio = this.utenteLoggato
        ? 'Confronto pronto.'
        : 'Confronto pronto. Se non sei loggato verrai portato al login.';
    } else {
      this.messaggio = 'Prima auto aggiunta. Selezionane un’altra.';
    }

    this.cd.detectChanges();
  }

  rimuoviDalConfronto(idAuto: number, event?: MouseEvent): void {
    event?.stopPropagation();

    this.autoSelezionate = this.autoSelezionate.filter((auto) => auto.id !== idAuto);

    if (this.autoSelezionate.length === 0) {
      this.compareMobileAperto = false;
    }

    this.messaggio =
      this.autoSelezionate.length === 0
        ? 'Selezione confronto svuotata.'
        : 'Auto rimossa dal confronto.';

    this.cd.detectChanges();
  }

  vaiAlConfronto(): void {
    if (!this.confrontoCompleto) {
      this.messaggio = 'Seleziona due auto per avviare il confronto.';
      this.cd.detectChanges();
      return;
    }

    if (!this.utenteLoggato) {
      this.messaggio = 'Per avviare una sfida devi effettuare il login.';
      this.cd.detectChanges();

      setTimeout(() => {
        this.router.navigate(['/Login']).then(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        });
      }, 250);

      return;
    }

    const [auto1, auto2] = this.autoSelezionate;

    this.router
      .navigate(['/Confronto'], {
        queryParams: { idAuto1: auto1.id, idAuto2: auto2.id },
      })
      .then(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
        this.autoSelezionate = [];
        this.compareMobileAperto = false;
      });
  }

  apriInfoAuto(idAuto: number): void {
    if (!idAuto) return;

    this.router.navigate(['/info-auto', idAuto]).then(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
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
      },
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
      },
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
      },
    });
  }

  trackByAutoId(index: number, auto: AutoModel): number {
    return auto.id ?? index;
  }
}

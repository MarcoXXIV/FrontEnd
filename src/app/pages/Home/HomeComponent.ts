import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

import { AutoService } from '../../services/AutoService';
import { AutoModel } from '../../models/AutoModel';
import { AutoCardComponent } from '../../components/auto-card/auto-cardComponent';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCardComponent, NavbarComponent],
  templateUrl: './HomeComponent.html',
  styleUrls: ['./HomeComponent.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  catalogoCompleto: AutoModel[] = [];

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

  showToast: boolean = false;
  toastMsg: string = '';
  toastType: 'success' | 'error' = 'success';

  private routerSub?: Subscription;
  private apiSub?: Subscription;
  private toastTimeout?: ReturnType<typeof setTimeout>;

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
    this.apiSub?.unsubscribe();

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
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

  get indiceInizio(): number {
    if (this.autoFiltrate.length === 0) return 0;
    return (this.paginaCorrente - 1) * this.autoPerPagina + 1;
  }

  get indiceFine(): number {
    return Math.min(this.paginaCorrente * this.autoPerPagina, this.autoFiltrate.length);
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

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.cd.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cd.detectChanges();
    }, 3500);
  }

  private isMobileView(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  private aggiornaStatoUtente(): void {
    this.utenteLoggato = !!localStorage.getItem('token');
    this.isAdminUser = localStorage.getItem('ruolo') === 'ADMIN';
    this.cd.detectChanges();
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLocaleLowerCase('it');
  }

  private estraiValoriUnici(values: Array<string | null | undefined>): string[] {
    return [
      ...new Set(values.map((v) => (v ?? '').trim()).filter((v): v is string => v.length > 0)),
    ].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }

  private marcaEsistente(marca: string): boolean {
    const marcaNorm = this.normalize(marca);
    return this.marchiDisponibili.some((m) => this.normalize(m) === marcaNorm);
  }

  private trovaMarcaCanonica(input: string): string {
    const valore = input.trim();
    const normalized = this.normalize(valore);

    if (!normalized) return '';

    const exact = this.marchiDisponibili.find((m) => this.normalize(m) === normalized);
    if (exact) return exact;

    const startsWithMatches = this.marchiDisponibili.filter((m) =>
      this.normalize(m).startsWith(normalized),
    );

    if (startsWithMatches.length === 1) {
      return startsWithMatches[0];
    }

    return valore;
  }

  private aggiornaSuggerimenti(): void {
    this.marchiDisponibili = this.estraiValoriUnici(
      this.catalogoCompleto.map((auto) => auto.marca),
    );
    this.aggiornaModelliDisponibili();
  }

  private aggiornaModelliDisponibili(): void {
    const marcaCanonica = this.trovaMarcaCanonica(this.filtroMarca);
    const marcaNorm = this.normalize(marcaCanonica);

    if (!marcaNorm || !this.marcaEsistente(marcaCanonica)) {
      this.modelliDisponibili = [];
      this.filtroModello = '';
      return;
    }

    const modelli = this.catalogoCompleto
      .filter((auto) => this.normalize(auto.marca) === marcaNorm)
      .map((auto) => auto.modello);

    this.modelliDisponibili = this.estraiValoriUnici(modelli);

    const modelloAttuale = this.normalize(this.filtroModello);
    const modelloAncoraValido = this.modelliDisponibili.some(
      (m) => this.normalize(m) === modelloAttuale,
    );

    if (this.filtroModello && !modelloAncoraValido) {
      this.filtroModello = '';
    }
  }

  onMarcaChange(value: string): void {
    this.filtroMarca = value;
    this.filtroModello = '';
    this.aggiornaModelliDisponibili();
  }

  onMarcaBlur(): void {
    const marcaCanonica = this.trovaMarcaCanonica(this.filtroMarca);

    if (marcaCanonica && this.marcaEsistente(marcaCanonica)) {
      this.filtroMarca = marcaCanonica;
      this.aggiornaModelliDisponibili();
      this.cd.detectChanges();
    }
  }

  private gestisciRisultati(data: AutoModel[], msg: string = ''): void {
    this.autoFiltrate = [...data];
    this.messaggio = msg;

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

  private eseguiRichiesta<T>(
    request$: Observable<T>,
    onSuccess: (data: T) => void,
    errorMessage: string,
  ): void {
    this.apiSub?.unsubscribe();
    this.loading = true;
    this.messaggio = '';
    this.cd.detectChanges();

    this.apiSub = request$
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
          this.cd.detectChanges();
        }),
      )
      .subscribe({
        next: onSuccess,
        error: (err) => {
          console.error(errorMessage, err);
          this.messaggio = errorMessage;
        },
      });
  }

  caricaCatalogo(): void {
    this.eseguiRichiesta(
      this.autoService.getAllAuto(),
      (data) => {
        this.catalogoCompleto = [...data];
        this.aggiornaSuggerimenti();
        this.gestisciRisultati(
          this.catalogoCompleto,
          'Esplora il catalogo e seleziona due auto per il confronto.',
        );
      },
      'Impossibile caricare i bolidi.',
    );
  }

  eseguiRicerca(): void {
    if (!this.catalogoCompleto.length) {
      this.caricaCatalogo();
      return;
    }

    const marcaInput = this.filtroMarca.trim();
    const marcaCanonica = this.trovaMarcaCanonica(marcaInput);
    const marcaNorm = this.normalize(marcaCanonica);
    const modelloNorm = this.normalize(this.filtroModello);

    if (marcaCanonica && this.marcaEsistente(marcaCanonica)) {
      this.filtroMarca = marcaCanonica;
      this.aggiornaModelliDisponibili();
    }

    const risultati = this.catalogoCompleto.filter((auto) => {
      const marcaAuto = this.normalize(auto.marca);
      const modelloAuto = this.normalize(auto.modello);

      const matchMarca = !marcaInput
        ? true
        : this.marcaEsistente(marcaCanonica)
          ? marcaAuto === marcaNorm
          : marcaAuto.includes(this.normalize(marcaInput));

      const matchModello = !modelloNorm ? true : modelloAuto === modelloNorm;

      return matchMarca && matchModello;
    });

    const msg =
      risultati.length === 0
        ? 'Nessun bolide trovato.'
        : `Risultati trovati${this.filtroMarca ? ' per marca: ' + this.filtroMarca : ''}${this.filtroModello ? ' / modello: ' + this.filtroModello : ''}`;

    this.gestisciRisultati(risultati, msg);
  }

  resetRicerca(): void {
    this.filtroMarca = '';
    this.filtroModello = '';
    this.modelliDisponibili = [];

    this.autoSelezionate = [];
    this.compareMobileAperto = false;
    this.paginaCorrente = 1;

    this.showToast = false;
    this.toastMsg = '';

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.gestisciRisultati(
      this.catalogoCompleto,
      'Esplora il catalogo e seleziona due auto per il confronto.',
    );
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
      this.triggerToast(
        'Puoi aggiungere solo 2 auto al confronto. Rimuovi una delle auto selezionate per inserirne un’altra.',
        'error',
      );
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

      this.triggerToast('Confronto pronto. Ora puoi aprire la sfida.', 'success');
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
      this.triggerToast('Seleziona due auto per avviare il confronto.', 'error');
      this.cd.detectChanges();
      return;
    }

    if (!this.utenteLoggato) {
      this.messaggio = 'Per avviare una sfida devi effettuare il login.';
      this.triggerToast('Devi effettuare il login prima di iniziare il confronto.', 'error');
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
      this.gestisciRisultati(
        this.catalogoCompleto,
        'Esplora il catalogo e seleziona due auto per il confronto.',
      );
      return;
    }

    this.eseguiRichiesta(
      this.autoService.getAutoByCategoria(categoria),
      (data) => this.gestisciRisultati(data, `Categoria selezionata: ${categoria}`),
      'Errore nel caricamento della categoria.',
    );
  }

  caricaTopGreen(): void {
    this.eseguiRichiesta(
      this.autoService.getTopGreen(),
      (data) => this.gestisciRisultati(data, 'Classifica Eco Friendly (minor CO2)'),
      'Errore nel caricamento della classifica green.',
    );
  }

  caricaTopAccelerazione(): void {
    this.eseguiRichiesta(
      this.autoService.getTopAccelerazione(),
      (data) => this.gestisciRisultati(data, 'Top 10 accelerazione 0-100 km/h'),
      'Errore nel caricamento della classifica accelerazione.',
    );
  }

  trackByAutoId(index: number, auto: AutoModel): number {
    return auto.id ?? index;
  }
}

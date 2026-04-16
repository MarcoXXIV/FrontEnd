import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';

import { AutoService } from '../../services/AutoService';
import { PreferitiService } from '../../services/PreferitiService';
import { RecensioniService } from '../../services/RecensioniService';
import { ConfrontoService } from '../../services/ConfrontoService';

import { AutoModel } from '../../models/AutoModel';
import { RecensioneModel } from '../../models/RecensioneModel';
import { GaraAnimationComponent } from '../../components/gara/garaComponent';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

interface ParametroConfronto {
  label: string;
  key: keyof AutoModel;
  unit?: string;
  invert?: boolean;
  isText?: boolean;
}

type GaraModalita =
  | 'accelerazione0100'
  | 'accelerazione100200'
  | 'accelerazione80140';

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule, FormsModule, GaraAnimationComponent, RouterModule, NavbarComponent],
  templateUrl: './ConfrontoComponent.html',
  styleUrls: ['./ConfrontoComponent.css']
})
export class ConfrontoComponent implements OnInit, OnDestroy {
  auto1?: AutoModel;
  auto2?: AutoModel;

  immagineSrc1 = '/assets/img/Errore.png';
  immagineSrc2 = '/assets/img/Errore.png';

  recensioniCoppia: RecensioneModel[] = [];
  mediaRecensioni: number | null = null;

  loading = true;
  garaInCorso = false;
  garaTrigger = 0;
  isPreferito = false;
  idConfronto?: number;
  errore = '';

  voto = 5;
  commento = '';
  recensioneInviata = false;

  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any;

  private queryParamsSub?: Subscription;

  soglieConfronto: Partial<Record<keyof AutoModel, number>> = {};

  garaMode: GaraModalita = 'accelerazione0100';

  opzioniGara: { key: GaraModalita; label: string }[] = [
    { key: 'accelerazione0100', label: '0-100 km/h' },
    { key: 'accelerazione100200', label: '100-200 km/h' },
    { key: 'accelerazione80140', label: '80-140 km/h' }
  ];

  elencoParametri: ParametroConfronto[] = [
    { label: 'Potenza', key: 'cv', unit: 'CV', invert: false },
    { label: 'Velocità Max', key: 'velocitaMax', unit: 'km/h', invert: false },
    { label: '0-100 km/h', key: 'accelerazione0100', unit: 's', invert: true },
    { label: '100-200 km/h', key: 'accelerazione100200', unit: 's', invert: true },
    { label: '80-140 km/h', key: 'accelerazione80140', unit: 's', invert: true },
    { label: 'Coppia', key: 'coppia', unit: 'Nm', invert: false },
    { label: 'Cilindrata', key: 'cilindrata', unit: 'cc', invert: false },
    { label: 'Peso', key: 'pesoKg', unit: 'kg', invert: true },
    { label: 'Rapporto Peso/Potenza', key: 'rapportoPesoPotenza', unit: 'kg/cv', invert: true },
    { label: 'Consumo Medio', key: 'consumoMedio', unit: 'l/100km', invert: true },
    { label: 'Emissioni CO2', key: 'co2', unit: 'g/km', invert: true },
    { label: 'Prezzo', key: 'prezzo', unit: '€', invert: true },
    { label: 'Alimentazione', key: 'alimentazione', isText: true },
    { label: 'Trazione', key: 'trazione', isText: true },
    { label: 'Categoria', key: 'categoria', isText: true },
    { label: 'Classe Euro', key: 'euro', isText: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private autoService: AutoService,
    private preferitiService: PreferitiService,
    private recensioniService: RecensioniService,
    private confrontoService: ConfrontoService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.queryParamsSub = this.route.queryParams.subscribe(params => {
      const id1 = Number(params['idAuto1']);
      const id2 = Number(params['idAuto2']);

      if (!id1 || !id2) {
        this.loading = false;
        this.errore = 'Parametri non validi.';
        return;
      }

      this.inizializzaConfronto(id1, id2);
    });
  }

  ngOnDestroy(): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.queryParamsSub?.unsubscribe();
  }

  inizializzaConfronto(id1: number, id2: number): void {
    this.loading = true;
    this.errore = '';

    forkJoin({
      a1: this.autoService.getAutoById(id1),
      a2: this.autoService.getAutoById(id2),
      confronto: this.confrontoService.eseguiBattaglia(id1, id2)
    }).subscribe({
      next: res => {
        this.auto1 = res.a1;
        this.auto2 = res.a2;
        this.idConfronto = res.confronto?.id;

        this.impostaImmagini();
        this.calcolaSoglieDinamiche();
        this.caricaRecensioniCoppia();
        this.caricaMediaRecensioni();
        this.checkStatoPreferito(id1, id2);

        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errore = 'Errore nel caricamento del confronto.';
        this.cd.detectChanges();
      }
    });
  }

  private impostaImmagini(): void {
    this.immagineSrc1 = this.auto1?.codice
      ? `/assets/img/${this.auto1.codice}.png`
      : '/assets/img/Errore.png';

    this.immagineSrc2 = this.auto2?.codice
      ? `/assets/img/${this.auto2.codice}.png`
      : '/assets/img/Errore.png';
  }

  onImageError(side: number): void {
    if (side === 1) {
      this.immagineSrc1 = '/assets/img/Errore.png';
    } else {
      this.immagineSrc2 = '/assets/img/Errore.png';
    }
  }

  togglePreferito(event: Event): void {
    event.stopPropagation();
    if (!this.idConfronto) return;

    this.preferitiService.togglePreferito(this.idConfronto).subscribe({
      next: res => {
        this.isPreferito = res.toLowerCase().includes('aggiunto');
        this.triggerToast(
          this.isPreferito ? 'Aggiunto ai preferiti!' : 'Rimosso dai preferiti',
          'success'
        );
        this.cd.detectChanges();
      },
      error: () => this.triggerToast('Errore durante il salvataggio.', 'error')
    });
  }

  private triggerToast(msg: string, type: 'success' | 'error'): void {
    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = false;

    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    setTimeout(() => {
      this.showToast = true;
      this.cd.detectChanges();

      this.toastTimeout = setTimeout(() => {
        this.showToast = false;
        this.cd.detectChanges();
      }, 3500);
    }, 10);
  }

  private getAutoIds(): { auto1Id: number; auto2Id: number } | null {
    if (this.auto1?.id == null || this.auto2?.id == null) return null;
    return { auto1Id: this.auto1.id, auto2Id: this.auto2.id };
  }

  caricaRecensioniCoppia(): void {
    const ids = this.getAutoIds();
    if (!ids) return;

    this.recensioniService.getPerCoppia(ids.auto1Id, ids.auto2Id).subscribe({
      next: data => {
        this.recensioniCoppia = data ?? [];
        this.cd.detectChanges();
      },
      error: () => {
        this.recensioniCoppia = [];
        this.cd.detectChanges();
      }
    });
  }

  caricaMediaRecensioni(): void {
    const ids = this.getAutoIds();
    if (!ids) return;

    this.recensioniService.getMedia(ids.auto1Id, ids.auto2Id).subscribe({
      next: media => {
        this.mediaRecensioni = media ?? 0;
        this.cd.detectChanges();
      },
      error: () => {
        this.mediaRecensioni = 0;
        this.cd.detectChanges();
      }
    });
  }

  inviaRecensione(): void {
    const ids = this.getAutoIds();
    if (!ids || !this.commento.trim()) return;

    this.recensioniService
      .aggiungiRecensione(ids.auto1Id, ids.auto2Id, this.voto, this.commento.trim())
      .subscribe({
        next: () => {
          this.recensioneInviata = true;
          this.commento = '';
          this.voto = 5;
          this.caricaRecensioniCoppia();
          this.caricaMediaRecensioni();
          this.triggerToast('Recensione inviata con successo!', 'success');
          this.cd.detectChanges();

          setTimeout(() => {
            this.recensioneInviata = false;
            this.cd.detectChanges();
          }, 2000);
        },
        error: err => {
          this.triggerToast(
            err.status === 400 ? err.error : 'Errore invio recensione.',
            'error'
          );
          this.cd.detectChanges();
        }
      });
  }

  trackByRecensione(index: number, item: RecensioneModel): number | string {
    return item.id ?? index;
  }

  checkStatoPreferito(id1: number, id2: number): void {
    this.preferitiService.getMieiPreferiti().subscribe({
      next: preferiti => {
        this.isPreferito = preferiti.some(p =>
          p.confronto?.id === this.idConfronto ||
          (
            (p.confronto?.auto1?.id === id1 && p.confronto?.auto2?.id === id2) ||
            (p.confronto?.auto1?.id === id2 && p.confronto?.auto2?.id === id1)
          )
        );
        this.cd.detectChanges();
      },
      error: () => {
        this.isPreferito = false;
        this.cd.detectChanges();
      }
    });
  }

  isValoreNonDisponibile(valore: unknown): boolean {
    const n = Number(valore);
    return valore === null || valore === undefined || valore === '' || Number.isNaN(n) || n === 0;
  }

  formatValore(valore: unknown, isText = false): string {
    if (isText) {
      return valore !== null && valore !== undefined && String(valore).trim() !== ''
        ? String(valore)
        : 'n.d.';
    }

    if (this.isValoreNonDisponibile(valore)) {
      return 'n.d.';
    }

    return String(valore);
  }

  private calcolaSoglieDinamiche(): void {
    if (!this.auto1 || !this.auto2) return;

    const soglie: Partial<Record<keyof AutoModel, number>> = {};

    this.elencoParametri.forEach(parametro => {
      if (parametro.isText) return;

      const v1 = Number(this.getVal(this.auto1!, parametro.key)) || 0;
      const v2 = Number(this.getVal(this.auto2!, parametro.key)) || 0;

      soglie[parametro.key] = Math.max(v1, v2);
    });

    this.soglieConfronto = soglie;
  }

  getPerc(valore: unknown, parametro: ParametroConfronto): number {
    if (parametro.isText || this.isValoreNonDisponibile(valore) || !this.auto1 || !this.auto2) {
      return 0;
    }

    const v = Number(valore);
    const benchmark =
      Number(this.soglieConfronto[parametro.key]) ||
      Math.max(
        Number(this.getVal(this.auto1, parametro.key)) || 0,
        Number(this.getVal(this.auto2, parametro.key)) || 0
      );

    if (!benchmark || benchmark <= 0) return 0;

    const perc = (v / benchmark) * 100;
    if (!Number.isFinite(perc)) return 0;

    return Math.max(0, Math.min(perc, 100));
  }

  getBarWidth(auto: AutoModel, parametro: ParametroConfronto): number {
    return this.getPerc(this.getVal(auto, parametro.key), parametro);
  }

  getVal(auto: AutoModel, key: keyof AutoModel): unknown {
    return auto[key];
  }

  private compareParametro(parametro: ParametroConfronto): 0 | 1 | 2 {
    if (!this.auto1 || !this.auto2 || parametro.isText) return 0;

    const raw1 = this.getVal(this.auto1, parametro.key);
    const raw2 = this.getVal(this.auto2, parametro.key);

    const valido1 = !this.isValoreNonDisponibile(raw1);
    const valido2 = !this.isValoreNonDisponibile(raw2);

    if (!valido1 && !valido2) return 0;
    if (valido1 && !valido2) return 1;
    if (!valido1 && valido2) return 2;

    const v1 = Number(raw1);
    const v2 = Number(raw2);

    if (v1 === v2) return 0;

    if (parametro.invert) {
      return v1 < v2 ? 1 : 2;
    }

    return v1 > v2 ? 1 : 2;
  }

  isWinner(side: 1 | 2, parametro: ParametroConfronto): boolean {
    return this.compareParametro(parametro) === side;
  }

  isTie(parametro: ParametroConfronto): boolean {
    return this.compareParametro(parametro) === 0;
  }

  setGaraMode(mode: GaraModalita, event?: Event): void {
    if (event) event.stopPropagation();
    if (!this.hasRaceData(mode)) return;

    this.garaMode = mode;

    if (this.garaInCorso && this.canRunSelectedRace()) {
      this.garaTrigger++;
      this.cd.detectChanges();
    }
  }

  getTempoGara(auto: AutoModel | undefined, mode: GaraModalita = this.garaMode): number | null {
    if (!auto) return null;

    const value = Number(auto[mode]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  getTempoDisplayForMode(auto: AutoModel | undefined, mode: GaraModalita = this.garaMode): string {
    const t = this.getTempoGara(auto, mode);
    return t !== null ? `${t.toFixed(2)} s` : 'n.d.';
  }

  hasRaceData(mode: GaraModalita): boolean {
    return this.getTempoGara(this.auto1, mode) !== null && this.getTempoGara(this.auto2, mode) !== null;
  }

  canRunSelectedRace(): boolean {
    return this.hasRaceData(this.garaMode);
  }

  getLabelGara(mode: GaraModalita = this.garaMode): string {
    switch (mode) {
      case 'accelerazione0100':
        return '0-100 km/h';
      case 'accelerazione100200':
        return '100-200 km/h';
      case 'accelerazione80140':
        return '80-140 km/h';
      default:
        return 'Gara';
    }
  }

  getRaceTimeSummary(mode: GaraModalita): string {
    const t1 = this.getTempoGara(this.auto1, mode);
    const t2 = this.getTempoGara(this.auto2, mode);

    if (t1 === null || t2 === null) return 'Dati mancanti';
    return `${t1.toFixed(2)}s vs ${t2.toFixed(2)}s`;
  }

  getRaceWinnerPreview(mode: GaraModalita = this.garaMode): 0 | 1 | 2 {
    const t1 = this.getTempoGara(this.auto1, mode);
    const t2 = this.getTempoGara(this.auto2, mode);

    if (t1 === null || t2 === null) return 0;
    if (t1 < t2) return 1;
    if (t2 < t1) return 2;
    return 0;
  }

  startGara(event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.canRunSelectedRace()) {
      this.triggerToast('Dati non disponibili per questa modalità di gara.', 'error');
      return;
    }

    this.garaInCorso = true;
    this.garaTrigger++;
    this.cd.detectChanges();
  }

  resetGara(event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.canRunSelectedRace()) {
      this.triggerToast('Dati non disponibili per questa modalità di gara.', 'error');
      return;
    }

    this.garaTrigger++;
    this.cd.detectChanges();
  }

  setVoto(n: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.voto = n;
    this.cd.detectChanges();
  }

  tornaHome(): void {
    this.router.navigate(['/Home']);
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AutoService } from '../../services/AutoService';
import { PreferitiService } from '../../services/PreferitiService';
import { RecensioniService } from '../../services/RecensioniService';
import { ConfrontoService } from '../../services/ConfrontoService';

import { AutoModel } from '../../models/AutoModel';
import { RecensioneModel } from '../../models/RecensioneModel';
import { GaraAnimationComponent } from '../../components/gara/garaComponent';
import {NavbarComponent} from '../../components/Navbar/NavbarComponent';

interface ParametroConfronto {
  label: string;
  key: keyof AutoModel;
  unit?: string;
  invert?: boolean;
  isText?: boolean;
}

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule, FormsModule, GaraAnimationComponent, RouterModule, NavbarComponent],
  templateUrl: './ConfrontoComponent.html',
  styleUrls: ['./ConfrontoComponent.css']
})
export class ConfrontoComponent implements OnInit {
  auto1?: AutoModel;
  auto2?: AutoModel;

  immagineSrc1: string = '/assets/img/Errore.png';
  immagineSrc2: string = '/assets/img/Errore.png';

  recensioniCoppia: RecensioneModel[] = [];
  mediaRecensioni: number | null = null;

  loading = true;
  garaInCorso = false;
  garaTrigger = 0;
  isPreferito = false;
  idConfronto?: number;
  errore = '';

  score1 = 0;
  score2 = 0;
  voto = 5;
  commento = '';
  recensioneInviata = false;

  // Variabili Toast
  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimeout: any;

  soglieMax: Record<string, number> = {
    cv: 1800,
    velocitaMax: 500,
    accelerazione0100: 10,
    accelerazione100200: 25,
    accelerazione80140: 15,
    coppia: 2000,
    cilindrata: 9000,
    pesoKg: 3000,
    rapportoPesoPotenza: 7,
    prezzo: 5000000,
    consumoMedio: 30,
    co2: 600
  };

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
    this.route.queryParams.subscribe(params => {
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

  inizializzaConfronto(id1: number, id2: number): void {
    this.loading = true;
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
        this.calcolaPunteggi();
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
    this.immagineSrc1 = this.auto1?.codice ? `/assets/img/${this.auto1.codice}.png` : '/assets/img/Errore.png';
    this.immagineSrc2 = this.auto2?.codice ? `/assets/img/${this.auto2.codice}.png` : '/assets/img/Errore.png';
  }

  onImageError(side: number): void {
    if (side === 1) this.immagineSrc1 = '/assets/img/Errore.png';
    else this.immagineSrc2 = '/assets/img/Errore.png';
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

    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

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

  // Se il valore è 0, nullo, undefined o non numerico -> n.d.
  isValoreNonDisponibile(valore: unknown): boolean {
    const n = Number(valore);
    return valore === null || valore === undefined || valore === '' || Number.isNaN(n) || n === 0;
  }

  formatValore(valore: unknown, isText = false): string {
    if (isText) {
      return valore !== null && valore !== undefined && String(valore).trim() !== ''
        ? String(valore)
        : 'n.d';
    }

    if (this.isValoreNonDisponibile(valore)) {
      return 'n.d';
    }

    return String(valore);
  }

  // Barra sempre proporzionale al valore:
  // 0 = vuota, massimo = piena
  getPerc(valore: unknown, chiave: keyof AutoModel): number {
    const max = this.soglieMax[String(chiave)] || 1000;
    const v = Number(valore);

    if (this.isValoreNonDisponibile(valore) || max <= 0) return 0;

    const p = (v / max) * 100;
    return Math.min(100, Math.max(0, p));
  }

  getBarWidth(auto: AutoModel, parametro: ParametroConfronto): number {
    return this.getPerc(this.getVal(auto, parametro.key), parametro.key);
  }

  calcolaPunteggi(): void {
    if (!this.auto1 || !this.auto2) return;
    const calcola = (auto: AutoModel) =>
      Math.round(Number(auto.cv) / 6 + Number(auto.velocitaMax) / 5 + Number(auto.coppia) / 40);

    this.score1 = calcola(this.auto1);
    this.score2 = calcola(this.auto2);
  }

  startGara(event?: Event): void {
    if (event) event.stopPropagation();
    this.garaInCorso = true;
    this.garaTrigger++;
    this.cd.detectChanges();
  }

  resetGara(event?: Event): void {
    if (event) event.stopPropagation();
    this.garaTrigger++;
    this.cd.detectChanges();
  }

  setVoto(n: number, event?: Event): void {
    if (event) event.stopPropagation();
    this.voto = n;
    this.cd.detectChanges();
  }

  getVal(auto: AutoModel, key: keyof AutoModel): unknown {
    return auto[key];
  }

  tornaHome(): void {
    this.router.navigate(['/Home']);
  }
}

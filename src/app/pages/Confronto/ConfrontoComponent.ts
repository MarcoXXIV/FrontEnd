import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { AutoService } from '../../services/AutoService';
import { PreferitiService } from '../../services/PreferitiService';
import { RecensioniService } from '../../services/RecensioniService';
import { ConfrontoService } from '../../services/ConfrontoService';

import { AutoModel } from '../../models/AutoModel';
import { GaraAnimationComponent } from '../../components/gara/garaComponent';

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule, FormsModule, GaraAnimationComponent],
  templateUrl: './ConfrontoComponent.html',
  styleUrl: './ConfrontoComponent.css'
})
export class ConfrontoComponent implements OnInit {
  auto1?: AutoModel;
  auto2?: AutoModel;

  loading: boolean = true;
  garaInCorso: boolean = false;
  garaTrigger: number = 0;

  isPreferito: boolean = false;
  idConfronto?: number;

  errore: string = '';

  soglieMax: { [key: string]: number } = {
    cv: 1000,
    velocitaMax: 450,
    accelerazione0100: 10,
    accelerazione100200: 25,
    accelerazione80140: 15,
    coppia: 1200,
    cilindrata: 6500,
    pesoKg: 2800,
    rapportoPesoPotenza: 5,
    prezzo: 200000,
    consumoMedio: 25,
    co2: 450
  };

  elencoParametri: any[] = [
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
    { label: 'Alimentazione', key: 'alimentazione', unit: '', isText: true },
    { label: 'Trazione', key: 'trazione', unit: '', isText: true },
    { label: 'Categoria', key: 'categoria', unit: '', isText: true },
    { label: 'Classe Euro', key: 'euro', unit: '', isText: true }
  ];

  score1: number = 0;
  score2: number = 0;

  voto: number = 5;
  commento: string = '';
  recensioneInviata: boolean = false;

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
        this.errore = 'Parametri confronto non validi.';
        this.cd.detectChanges();
        return;
      }

      this.inizializzaConfronto(id1, id2);
    });
  }

  inizializzaConfronto(id1: number, id2: number): void {
    this.loading = true;
    this.errore = '';

    forkJoin({
      a1: this.autoService.getAutoById(id1),
      a2: this.autoService.getAutoById(id2),
      confronto: this.confrontoService.eseguiBattaglia(id1, id2)
    }).subscribe({
      next: (res) => {
        this.auto1 = res.a1;
        this.auto2 = res.a2;
        this.idConfronto = res.confronto?.id;

        this.calcolaPunteggi();
        this.loading = false;

        this.checkStatoPreferito(id1, id2);
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.errore = 'Errore nel caricamento del confronto.';
        this.cd.detectChanges();
      }
    });
  }

  checkStatoPreferito(id1: number, id2: number): void {
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (preferiti) => {
        const trovato = preferiti.find(p =>
          p.confronto?.id === this.idConfronto ||
          (
            (p.confronto?.auto1?.id === id1 && p.confronto?.auto2?.id === id2) ||
            (p.confronto?.auto1?.id === id2 && p.confronto?.auto2?.id === id1)
          )
        );

        this.isPreferito = !!trovato;

        if (trovato?.confronto?.id) {
          this.idConfronto = trovato.confronto.id;
        }

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Errore controllo preferito:', err);
      }
    });
  }

  togglePreferito(event: Event): void {
    event.stopPropagation();

    if (!this.idConfronto) {
      console.error('idConfronto non disponibile');
      return;
    }

    this.preferitiService.togglePreferito(this.idConfronto).subscribe({
      next: (res) => {
        const risposta = (res || '').toLowerCase();

        if (risposta.includes('aggiunto')) {
          this.isPreferito = true;
        } else if (risposta.includes('rimosso')) {
          this.isPreferito = false;
        } else {
          this.isPreferito = !this.isPreferito;
        }

        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Errore toggle preferito:', err);
      }
    });
  }

  getPerc(valore: any, chiave: string, invert: boolean = false): number {
    const max = this.soglieMax[chiave] || 1000;
    const v = Number(valore) || 0;

    let percentuale = invert
      ? (1 - (v / max)) * 100
      : (v / max) * 100;

    if (percentuale < 0) percentuale = 0;
    if (percentuale > 100) percentuale = 100;

    return percentuale;
  }

  calcolaPunteggi(): void {
    if (!this.auto1 || !this.auto2) return;

    const calcola = (auto: AutoModel): number => {
      const cv = Number(auto.cv) || 0;
      const velMax = Number(auto.velocitaMax) || 0;
      const acc0100 = Number(auto.accelerazione0100) || 99;
      const acc100200 = Number(auto.accelerazione100200) || 99;
      const acc80140 = Number(auto.accelerazione80140) || 99;
      const coppia = Number(auto.coppia) || 0;
      const peso = Number(auto.pesoKg) || 0;

      const score =
        (cv / 6) +
        (velMax / 5) +
        (coppia / 40) +
        Math.max(0, 12 - acc0100) * 8 +
        Math.max(0, 30 - acc100200) * 3 +
        Math.max(0, 18 - acc80140) * 4 -
        (peso / 120);

      return Math.max(1, Math.round(score));
    };

    this.score1 = calcola(this.auto1);
    this.score2 = calcola(this.auto2);
  }

  startGara(event: Event): void {
    event.stopPropagation();

    if (!this.auto1 || !this.auto2) return;

    this.garaInCorso = true;
    this.garaTrigger++;
    this.cd.detectChanges();
  }

  resetGara(event: Event): void {
    event.stopPropagation();

    if (!this.auto1 || !this.auto2) return;

    this.garaInCorso = true;
    this.garaTrigger++;
    this.cd.detectChanges();
  }

  setVoto(n: number, event: Event): void {
    event.stopPropagation();
    this.voto = n;
    this.cd.detectChanges();
  }

  getVal(auto: AutoModel, key: keyof AutoModel): any {
    return auto[key];
  }

  inviaRecensione(): void {
    if (!this.idConfronto) {
      console.error('Impossibile inviare recensione: idConfronto assente');
      return;
    }

    this.recensioniService.aggiungiRecensione(
      this.idConfronto,
      this.voto,
      this.commento.trim()
    ).subscribe({
      next: () => {
        this.recensioneInviata = true;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Errore invio recensione:', err);
      }
    });
  }

  tornaHome(): void {
    this.router.navigate(['/Home']);
  }
}

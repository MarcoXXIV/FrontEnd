import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AutoService } from '../../services/AutoService';
import { AutoModel } from '../../models/AutoModel';
import { RadarChartComponent } from '../../components/radar-chart/radar-chartComponent';
import { GaraAnimationComponent } from '../../components/gara/garaComponent';

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule, FormsModule, RadarChartComponent, GaraAnimationComponent],
  templateUrl: './ConfrontoComponent.html',
  styleUrl: './ConfrontoComponent.css'
})
export class ConfrontoComponent implements OnInit {
  auto1?: AutoModel;
  auto2?: AutoModel;
  loading: boolean = true;
  garaInCorso: boolean = false;

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

  constructor(private route: ActivatedRoute, private autoService: AutoService, private router: Router, private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id1 = +params['idAuto1'];
      const id2 = +params['idAuto2'];
      if (id1 && id2) this.caricaDati(id1, id2);
    });
  }

  getPerc(valore: any, chiave: string): number {
    const max = this.soglieMax[chiave] || 1000;
    const v = Number(valore) || 0;
    const p = (v / max) * 100;
    return p > 100 ? 100 : p;
  }

  caricaDati(id1: number, id2: number) {
    this.loading = true;
    forkJoin({ a1: this.autoService.getAutoById(id1), a2: this.autoService.getAutoById(id2) }).subscribe({
      next: (res) => {
        this.auto1 = res.a1;
        this.auto2 = res.a2;
        this.calcolaPunteggi();
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  calcolaPunteggi() {
    if (this.auto1 && this.auto2) {
      // Calcolo score per la gara
      this.score1 = Math.round((this.auto1.cv / 5) + (20 - this.auto1.accelerazione0100) * 2);
      this.score2 = Math.round((this.auto2.cv / 5) + (20 - this.auto2.accelerazione0100) * 2);
    }
  }

  startGara(event: Event) {
    event.stopPropagation(); // Impedisce che il click attivi altri elementi
    this.garaInCorso = true;
    this.cd.detectChanges();
  }

  resetGara(event: Event) {
    event.stopPropagation();
    this.garaInCorso = false; // Distrugge il componente app-gara-animation
    this.cd.detectChanges();
    setTimeout(() => {
      this.garaInCorso = true; // Lo ricrea da zero facendo ripartire l'ngOnInit del figlio
      this.cd.detectChanges();
    }, 100);
  }

  setVoto(n: number, event: Event) {
    event.stopPropagation(); // Evita che toccando le stelle si attivi la logica della gara
    this.voto = n;
    this.cd.detectChanges();
  }

  getVal(auto: AutoModel, key: keyof AutoModel): any { return auto[key]; }

  inviaRecensione() {
    this.recensioneInviata = true;
    this.cd.detectChanges();
  }

  tornaHome() { this.router.navigate(['/Home']); }
}

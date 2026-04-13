import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, map, distinctUntilChanged, takeUntil, timeout } from 'rxjs';
import { AutoService } from '../../services/AutoService';
import { AutoModel } from '../../models/AutoModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

interface CaratteristicaAuto {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-info-auto',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './InfoAutoComponent.html',
  styleUrl: './InfoAutoComponent.css'
})
export class InfoAutoComponent implements OnInit, OnDestroy {
  auto?: AutoModel;
  loading = true;
  errore = '';
  caratteristicheComplete: CaratteristicaAuto[] = [];
  immagineSrc: string = '/assets/img/Errore.png'; // Default iniziale
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private autoService: AutoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => Number(params.get('id'))),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(id => {
        if (!id || id <= 0) {
          this.loading = false;
          this.errore = 'ID non valido.';
          this.cdr.detectChanges();
          return;
        }
        this.caricaAuto(id);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private caricaAuto(id: number): void {
    this.loading = true;
    this.autoService.getAutoById(id)
      .pipe(timeout(10000), takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.auto = data;
          this.impostaImmagine(); // Calcola il percorso immagine
          this.preparaCaratteristiche();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.errore = 'Impossibile caricare i dati.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  // Logica speculare a CardComponent per l'immagine
  private impostaImmagine(): void {
    this.immagineSrc = this.auto?.codice
      ? `/assets/img/${this.auto.codice}.png`
      : '/assets/img/Errore.png';
  }

  onImageError(): void {
    this.immagineSrc = '/assets/img/Errore.png';
  }

  tornaAllaHome(): void { this.router.navigate(['/Home']); }

  private preparaCaratteristiche(): void {
    if (!this.auto) return;

    const configurazione = [
      { label: 'Marca', icon: 'fas fa-industry', keys: ['marca'], type: 'text' },
      { label: 'Modello', icon: 'fas fa-car-side', keys: ['modello'], type: 'text' },
      { label: 'Categoria', icon: 'fas fa-layer-group', keys: ['categoria'], type: 'text' },
      { label: 'Prezzo', icon: 'fas fa-euro-sign', keys: ['prezzo'], type: 'currency' },
      { label: 'Potenza', icon: 'fas fa-horse-head', keys: ['cv'], suffix: ' CV', type: 'number' },
      { label: 'Velocità max', icon: 'fas fa-gauge-high', keys: ['velocitaMax'], suffix: ' km/h', type: 'number' },
      { label: '0-100 km/h', icon: 'fas fa-stopwatch', keys: ['accelerazione0100'], suffix: ' s', type: 'number' },
      { label: '100-200 km/h', icon: 'fas fa-tachometer-alt', keys: ['accelerazione100200'], suffix: ' s', type: 'number' },
      { label: '80-140 km/h', icon: 'fas fa-clock', keys: ['accelerazione80140'], suffix: ' s', type: 'number' },
      { label: 'Coppia', icon: 'fas fa-cogs', keys: ['coppia'], suffix: ' Nm', type: 'number' },
      { label: 'Cilindrata', icon: 'fas fa-oil-can', keys: ['cilindrata'], suffix: ' cc', type: 'number' },
      { label: 'Peso', icon: 'fas fa-weight-hanging', keys: ['pesoKg'], suffix: ' kg', type: 'number' },
      { label: 'Rapporto Peso/Potenza', icon: 'fas fa-balance-scale', keys: ['rapportoPesoPotenza'], suffix: ' kg/CV', type: 'number' },
      { label: 'Consumo medio', icon: 'fas fa-gauge', keys: ['consumoMedio'], suffix: ' l/100 km', type: 'number' },
      { label: 'Emissioni CO₂', icon: 'fas fa-leaf', keys: ['co2'], suffix: ' g/km', type: 'number' },
      { label: 'Alimentazione', icon: 'fas fa-gas-pump', keys: ['alimentazione'], type: 'text' },
      { label: 'Trazione', icon: 'fas fa-road', keys: ['trazione'], type: 'text' },
      { label: 'Classe Euro', icon: 'fas fa-shield-alt', keys: ['euro'], type: 'text' }
    ];

    this.caratteristicheComplete = configurazione
      .map(item => {
        const valore = this.leggiCampo(item.keys);
        return valore ? {
          label: item.label,
          icon: item.icon,
          value: this.formattaValore(valore, item.type, item.suffix ?? '')
        } : null;
      })
      .filter((n): n is CaratteristicaAuto => n !== null);
  }

  private leggiCampo(keys: string[]): any {
    const obj = this.auto as any;
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
    }
    return null;
  }

  private formattaValore(value: any, type: string, suffix: string): string {
    if (type === 'currency') return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
    if (type === 'number') return `${new Intl.NumberFormat('it-IT').format(value)}${suffix}`;
    return `${value}${suffix}`;
  }

  get categoria(): string { return this.auto?.categoria ?? 'N/D'; }
  get alimentazione(): string { return this.auto?.alimentazione ?? 'N/D'; }
  get prezzo(): string { return this.auto?.prezzo ? this.formattaValore(this.auto.prezzo, 'currency', '') : 'N/D'; }
}

import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

type GaraModalita = 'accelerazione0100' | 'accelerazione100200' | 'accelerazione80140';

@Component({
  selector: 'app-gara-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './garaComponent.html',
  styleUrls: ['./garaComponent.css']
})
export class GaraAnimationComponent implements OnChanges, OnDestroy {
  @Input() car1: any;
  @Input() car2: any;
  @Input() trigger = 0;
  @Input() modalita: GaraModalita = 'accelerazione0100';

  animazioneIniziata = false;
  mostraVincitore = false;

  countdownText = 'READY';
  lightState: 'off' | 'red' | 'yellow' | 'green' = 'off';

  private timers: any[] = [];

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trigger'] && this.trigger > 0) {
      this.avviaAnimazione();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private schedule(callback: () => void, delay: number): void {
    const timer = setTimeout(callback, delay);
    this.timers.push(timer);
  }

  private clearTimers(): void {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }

  private resetVisualState(): void {
    this.animazioneIniziata = false;
    this.mostraVincitore = false;
    this.countdownText = 'READY';
    this.lightState = 'off';
    this.cd.detectChanges();
  }

  private avviaAnimazione(): void {
    this.clearTimers();
    this.resetVisualState();

    const t1 = this.getTempoGara(this.car1);
    const t2 = this.getTempoGara(this.car2);

    if (t1 === null || t2 === null) {
      return;
    }

    // Countdown semaforo
    this.schedule(() => {
      this.lightState = 'red';
      this.countdownText = '3';
      this.cd.detectChanges();
    }, 150);

    this.schedule(() => {
      this.lightState = 'red';
      this.countdownText = '2';
      this.cd.detectChanges();
    }, 950);

    this.schedule(() => {
      this.lightState = 'yellow';
      this.countdownText = '1';
      this.cd.detectChanges();
    }, 1750);

    // GO
    this.schedule(() => {
      this.lightState = 'green';
      this.countdownText = 'GO!';
      this.animazioneIniziata = true;
      this.cd.detectChanges();
    }, 2550);

    this.schedule(() => {
      this.countdownText = '';
      this.cd.detectChanges();
    }, 3400);

    // Mostra vincitore quando arriva anche la più lenta
    const totalDurationMs = 2550 + Math.max(t1, t2) * 1000 + 700;

    this.schedule(() => {
      this.mostraVincitore = true;
      this.cd.detectChanges();
    }, totalDurationMs);
  }

  getTempoGara(auto: any): number | null {
    const value = Number(auto?.[this.modalita]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  getTempoDisplay(auto: any): string {
    const t = this.getTempoGara(auto);
    return t !== null ? `${t.toFixed(2)} s` : 'n.d.';
  }

  getCarAnimationDuration(auto: any): string {
    const t = this.getTempoGara(auto);
    return `${t ?? 0}s`;
  }

  getModeLabel(): string {
    switch (this.modalita) {
      case 'accelerazione0100':
        return '0-100 km/h';
      case 'accelerazione100200':
        return '100-200 km/h';
      case 'accelerazione80140':
        return '80-140 km/h';
      default:
        return 'Drag Race';
    }
  }

  get winnerIndex(): 0 | 1 | 2 {
    const t1 = this.getTempoGara(this.car1);
    const t2 = this.getTempoGara(this.car2);

    if (t1 === null || t2 === null) return 0;
    if (t1 < t2) return 1;
    if (t2 < t1) return 2;
    return 0;
  }

  isCarWinner(index: 1 | 2): boolean {
    return this.winnerIndex === index;
  }

  isPareggio(): boolean {
    return this.winnerIndex === 0;
  }

  get vincitoreNome(): string {
    if (this.winnerIndex === 1) {
      return `${this.car1?.marca} ${this.car1?.modello}`;
    }
    if (this.winnerIndex === 2) {
      return `${this.car2?.marca} ${this.car2?.modello}`;
    }
    return 'Pareggio';
  }

  getGapDisplay(): string {
    const t1 = this.getTempoGara(this.car1);
    const t2 = this.getTempoGara(this.car2);

    if (t1 === null || t2 === null) return 'n.d.';
    return `${Math.abs(t1 - t2).toFixed(2)} s`;
  }
}

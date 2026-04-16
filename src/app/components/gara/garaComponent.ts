import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfrontoService } from '../../services/ConfrontoService';
import { ConfrontoModel } from '../../models/ConfrontoModel';

type GaraModalita = 'accelerazione0100' | 'accelerazione100200' | 'accelerazione80140';

interface AutoGara {
  marca?: string;
  modello?: string;
  accelerazione0100?: number | string;
  accelerazione100200?: number | string;
  accelerazione80140?: number | string;
}

@Component({
  selector: 'app-gara-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './garaComponent.html',
  styleUrls: ['./garaComponent.css'],
})
export class GaraAnimationComponent implements OnChanges, OnDestroy, AfterViewInit {
  @Input() car1: AutoGara | null = null;
  @Input() car2: AutoGara | null = null;
  @Input() idAuto1!: number;
  @Input() idAuto2!: number;
  @Input() trigger = 0;
  @Input() modalita: GaraModalita = 'accelerazione0100';

  @ViewChild('trackRef') trackRef?: ElementRef<HTMLElement>;

  readonly modalitaOptions: { key: GaraModalita; label: string }[] = [
    { key: 'accelerazione0100', label: '0-100 km/h' },
    { key: 'accelerazione100200', label: '100-200 km/h' },
    { key: 'accelerazione80140', label: '80-140 km/h' },
  ];

  animazioneIniziata = false;
  mostraVincitore = false;

  countdownText = 'READY';
  lightState: 'off' | 'red' | 'yellow' | 'green' = 'off';

  car1PositionPx = 0;
  car2PositionPx = 0;

  loadingBattaglia = false;
  erroreBattaglia = '';
  confronto: ConfrontoModel | null = null;

  private timers: any[] = [];
  private raceFrameId: number | null = null;
  private battagliaSub?: Subscription;
  private resizeObserver?: ResizeObserver;
  private currentBattleRequestId = 0;

  private readonly startOffset = 14;
  private readonly stopOffsetDesktop = 182;
  private readonly stopOffsetMobile = 148;

  private travelDistancePx = 520;

  constructor(
    private cd: ChangeDetectorRef,
    private confrontoService: ConfrontoService,
  ) {}

  ngAfterViewInit(): void {
    this.updateTrackMetrics();

    if (typeof ResizeObserver !== 'undefined' && this.trackRef?.nativeElement) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateTrackMetrics();
      });
      this.resizeObserver.observe(this.trackRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modalita'] && !changes['modalita'].firstChange) {
      this.clearTimers();
      this.cancelRaceFrame();
      this.resetRaceState(true);
      this.cd.detectChanges();
    }

    if (changes['trigger'] && this.trigger > 0) {
      this.eseguiSfida();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    this.cancelRaceFrame();
    this.battagliaSub?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  selezionaModalita(modalita: GaraModalita): void {
    if (this.modalita === modalita) return;

    this.modalita = modalita;
    this.clearTimers();
    this.cancelRaceFrame();
    this.resetRaceState(true);
    this.cd.detectChanges();
  }

  eseguiSfida(): void {
    if (!this.car1 || !this.car2) return;

    this.currentBattleRequestId += 1;
    const requestId = this.currentBattleRequestId;

    this.clearTimers();
    this.cancelRaceFrame();
    this.resetRaceState(true);
    this.updateTrackMetrics();

    this.avviaAnimazione();
  }

  getTempoGara(auto: AutoGara | null, modalita: GaraModalita = this.modalita): number | null {
    const value = Number(auto?.[modalita]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  getTempoDisplay(auto: AutoGara | null, modalita: GaraModalita = this.modalita): string {
    const t = this.getTempoGara(auto, modalita);
    return t !== null ? `${t.toFixed(2)} s` : 'n.d.';
  }

  getModeLabel(modalita: GaraModalita = this.modalita): string {
    switch (modalita) {
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
      return `${this.car1?.marca ?? ''} ${this.car1?.modello ?? ''}`.trim();
    }

    if (this.winnerIndex === 2) {
      return `${this.car2?.marca ?? ''} ${this.car2?.modello ?? ''}`.trim();
    }

    return 'Pareggio';
  }

  getGapDisplay(): string {
    const t1 = this.getTempoGara(this.car1);
    const t2 = this.getTempoGara(this.car2);

    if (t1 === null || t2 === null) return 'n.d.';
    return `${Math.abs(t1 - t2).toFixed(2)} s`;
  }

  private avviaAnimazione(): void {
    const t1 = this.getTempoGara(this.car1);
    const t2 = this.getTempoGara(this.car2);

    if (t1 === null || t2 === null) {
      return;
    }

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

    this.schedule(() => {
      this.lightState = 'green';
      this.countdownText = 'GO!';
      this.animazioneIniziata = true;
      this.startRaceFrames(t1, t2);
      this.cd.detectChanges();
    }, 2550);

    this.schedule(() => {
      this.countdownText = '';
      this.cd.detectChanges();
    }, 3400);

    const totalDurationMs = 2550 + Math.max(t1, t2) * 1000 + 550;

    this.schedule(() => {
      this.animazioneIniziata = false;
      this.mostraVincitore = true;
      this.cd.detectChanges();
    }, totalDurationMs);
  }

  private startRaceFrames(t1Seconds: number, t2Seconds: number): void {
    const duration1 = t1Seconds * 1000;
    const duration2 = t2Seconds * 1000;
    const maxDuration = Math.max(duration1, duration2);

    const startAt = performance.now();

    const frame = (now: number) => {
      const elapsed = now - startAt;

      this.car1PositionPx = this.travelDistancePx * this.getRaceProgress(elapsed, duration1);
      this.car2PositionPx = this.travelDistancePx * this.getRaceProgress(elapsed, duration2);

      if (elapsed < maxDuration) {
        this.raceFrameId = requestAnimationFrame(frame);
      } else {
        this.car1PositionPx = this.travelDistancePx;
        this.car2PositionPx = this.travelDistancePx;
        this.cancelRaceFrame();
      }

      this.cd.detectChanges();
    };

    this.raceFrameId = requestAnimationFrame(frame);
  }

  private getRaceProgress(elapsedMs: number, totalMs: number): number {
    if (totalMs <= 0) return 0;

    const t = Math.max(0, Math.min(1, elapsedMs / totalMs));

    if (t < 0.18) {
      return 0.07 * this.easeInCubic(t / 0.18);
    }

    if (t < 0.72) {
      return 0.07 + 0.75 * this.easeInOutCubic((t - 0.18) / 0.54);
    }

    return 0.82 + 0.18 * this.easeOutCubic((t - 0.72) / 0.28);
  }

  private easeInCubic(x: number): number {
    return x * x * x;
  }

  private easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  private resetRaceState(resetScore: boolean): void {
    this.animazioneIniziata = false;
    this.mostraVincitore = false;
    this.countdownText = 'READY';
    this.lightState = 'off';
    this.car1PositionPx = 0;
    this.car2PositionPx = 0;
    this.erroreBattaglia = '';

    if (resetScore) {
      this.loadingBattaglia = false;
      this.confronto = null;
    }
  }

  private updateTrackMetrics(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;

    const width = el.clientWidth;
    const stopOffset = width <= 640 ? this.stopOffsetMobile : this.stopOffsetDesktop;

    this.travelDistancePx = Math.max(120, width - this.startOffset - stopOffset);
  }

  private schedule(callback: () => void, delay: number): void {
    const timer = setTimeout(callback, delay);
    this.timers.push(timer);
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];
  }

  private cancelRaceFrame(): void {
    if (this.raceFrameId !== null) {
      cancelAnimationFrame(this.raceFrameId);
      this.raceFrameId = null;
    }
  }
}

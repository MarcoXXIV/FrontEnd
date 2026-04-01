import { Component, Input, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  @Input() score1: number = 0;
  @Input() score2: number = 0;
  @Input() trigger: number = 0;

  animazioneIniziata = false;
  mostraVincitore = false;

  private startTimeout: any;
  private winnerTimeout: any;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trigger'] && this.trigger > 0) {
      this.avviaAnimazione();
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.startTimeout) clearTimeout(this.startTimeout);
    if (this.winnerTimeout) clearTimeout(this.winnerTimeout);
  }

  private avviaAnimazione(): void {
    this.clearTimers();

    this.mostraVincitore = false;
    this.animazioneIniziata = false;
    this.cd.detectChanges();

    // Piccolo delay per resettare la posizione prima di partire
    this.startTimeout = setTimeout(() => {
      this.animazioneIniziata = true;
      this.cd.detectChanges();
    }, 50);

    const durataAnimazionePiuLenta = Math.max(this.getDurata(this.score1), this.getDurata(this.score2));

    // Mostra il vincitore solo dopo che l'auto più lenta ha toccato il traguardo + 600ms
    this.winnerTimeout = setTimeout(() => {
      this.mostraVincitore = true;
      this.cd.detectChanges();
    }, (durataAnimazionePiuLenta * 1000) + 600);
  }

  getDurata(score: number): number {
    const massimo = Math.max(this.score1, this.score2, 1);
    const ratio = Math.max(0, score) / massimo;

    // Durata tra 2.0s (veloce) e 3.5s (lenta)
    const durataMin = 2.0;
    const durataMax = 3.5;

    return +(durataMax - ratio * (durataMax - durataMin)).toFixed(2);
  }

  get vincitoreNome(): string {
    if (this.score1 > this.score2) return `${this.car1?.marca} ${this.car1?.modello}`;
    if (this.score2 > this.score1) return `${this.car2?.marca} ${this.car2?.modello}`;
    return 'Pareggio';
  }
}

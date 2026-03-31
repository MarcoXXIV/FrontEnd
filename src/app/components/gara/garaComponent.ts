import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gara-animation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './garaComponent.html',
  styleUrls: ['./garaComponent.css']
})
export class GaraAnimationComponent implements OnInit {
  @Input() car1: any;
  @Input() car2: any;
  @Input() score1: number = 0;
  @Input() score2: number = 0;

  animazioneIniziata = false;
  mostraVincitore = false;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.mostraVincitore = false;
    this.animazioneIniziata = false;

    // Avvia auto
    setTimeout(() => {
      this.animazioneIniziata = true;
    }, 100);

    // Proclama vincitore (coordinato con la durata dell'animazione CSS)
    setTimeout(() => {
      this.mostraVincitore = true;
    }, 4500);
  }

  get vincitoreNome(): string {
    if (this.score1 > this.score2) return this.car1?.marca + ' ' + this.car1?.modello;
    if (this.score2 > this.score1) return this.car2?.marca + ' ' + this.car2?.modello;
    return 'Pareggio';
  }
}

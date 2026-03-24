import { Component, Input, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-radar-chart',
  standalone: true,
  templateUrl: './radar-chartComponent.html',
  styleUrls: ['./radar-chartComponent.css']
})
export class RadarChartComponent implements AfterViewInit {
  @ViewChild('radarCanvas') radarCanvas!: ElementRef;
  @Input() auto1!: any;
  @Input() auto2!: any;

  ngAfterViewInit() {
    new Chart(this.radarCanvas.nativeElement, {
      type: 'radar',
      data: {
        labels: ['Velocità', 'Accelerazione', 'Cavalli', 'Coppia', 'Peso'],
        datasets: [
          {
            label: this.auto1.marca + ' ' + this.auto1.modello,
            data: [this.auto1.vMax, 10 - this.auto1.acc, this.auto1.cv, this.auto1.coppia, 2000 - this.auto1.peso],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgb(255, 99, 132)',
            pointBackgroundColor: 'rgb(255, 99, 132)',
          },
          {
            label: this.auto2.marca + ' ' + this.auto2.modello,
            data: [this.auto2.vMax, 10 - this.auto2.acc, this.auto2.cv, this.auto2.coppia, 2000 - this.auto2.peso],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            pointBackgroundColor: 'rgb(54, 162, 235)',
          }
        ]
      },
      options: { scales: { r: { suggestedMin: 0, ticks: { display: false } } } }
    });
  }
}

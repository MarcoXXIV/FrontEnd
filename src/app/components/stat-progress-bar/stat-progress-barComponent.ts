import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-progress-barComponent.html',
  styleUrls: ['./stat-progress-barComponent.css']
})
export class StatProgressBarComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() color: string = '#3498db';

  get percentage(): number {
    // Evitiamo divisioni per zero e percentuali superiori a 100
    if (!this.max || this.max === 0) return 0;
    const calc = (this.value / this.max) * 100;
    return calc > 100 ? 100 : calc;
  }
}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-progress-barComponent.html',
  styleUrls: ['./stat-progress-barComponent.css'],
})
export class StatProgressBarComponent {
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() color: string = '#3498db';

  get percentage(): number {
    if (!this.max || this.max <= 0) return 0;

    const calc = (this.value / this.max) * 100;

    if (!Number.isFinite(calc)) return 0;

    return Math.max(0, Math.min(calc, 100));
  }
}

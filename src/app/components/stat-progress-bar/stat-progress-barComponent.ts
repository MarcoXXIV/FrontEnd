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
  @Input() label: string = '';
  @Input() value: number = 0;
  @Input() max: number = 100;
  @Input() unit: string = '';
  @Input() color: string = '#3498db';

  get percentage(): number {
    return (this.value / this.max) * 100;
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { PlatformLocation } from '@angular/common'; // Import necessario per il tasto indietro

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('FrontEnd');

  constructor(
    private readonly location: PlatformLocation,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.location.onPopState(() => {
      this.router.navigate(['/Home'], { replaceUrl: true });

    });
  }
}

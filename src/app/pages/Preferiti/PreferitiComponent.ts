import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // Aggiunto Router
import { PreferitiService } from '../../services/PreferitiService';
import { PreferitoModel } from '../../models/PreferitoModel';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './PreferitiComponent.html',
  styleUrls: ['./PreferitiComponent.css']
})
export class PreferitiComponent implements OnInit {
  listaPreferiti: PreferitoModel[] = [];
  totalePreferiti = 0;
  loading = true;

  showBanner = false;
  bannerMsg = '';

  constructor(
    private preferitiService: PreferitiService,
    private cd: ChangeDetectorRef,
    private router: Router // Iniettato per far funzionare vaiHome()
  ) {}

  ngOnInit(): void {
    this.caricaPreferiti();
  }

  caricaPreferiti(): void {
    this.loading = true;
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (data) => {
        console.log('Preferiti ricevuti:', data);
        this.listaPreferiti = Array.isArray(data) ? data : [];
        this.totalePreferiti = this.listaPreferiti.length;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Errore caricamento:", err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  rimuoviPreferito(confrontoId?: number): void {
    if (!confrontoId) return;

    this.preferitiService.togglePreferito(confrontoId).subscribe({
      next: () => {
        // Rimuoviamo subito dalla lista per velocità visiva
        this.listaPreferiti = this.listaPreferiti.filter(p => p.confronto?.id !== confrontoId);
        this.totalePreferiti = this.listaPreferiti.length;

        this.triggerBanner("Bolide rimosso dal garage!");
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error("Errore:", err);
        this.triggerBanner("Errore nella rimozione.");
      }
    });
  }

  private triggerBanner(msg: string) {
    this.bannerMsg = msg;
    this.showBanner = true;
    setTimeout(() => {
      this.showBanner = false;
      this.cd.detectChanges();
    }, 2500);
  }

  trackByPreferito(index: number, item: PreferitoModel): number {
    return item.id ?? item.confronto?.id ?? index;
  }

  vaiHome(): void {
    this.router.navigate(['/Home']);
  }
}

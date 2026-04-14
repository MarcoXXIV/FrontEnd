import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PreferitiService } from '../../services/PreferitiService';
import { PreferitoModel } from '../../models/PreferitoModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

@Component({
  selector: 'app-preferiti',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
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
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.caricaPreferiti();
  }

  caricaPreferiti(): void {
    this.loading = true;
    this.preferitiService.getMieiPreferiti().subscribe({
      next: (data) => {
        this.listaPreferiti = Array.isArray(data) ? data : [];
        this.totalePreferiti = this.listaPreferiti.length;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Errore caricamento:', err);
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  getImgAuto1(p: PreferitoModel): string {
    const codice = p.confronto?.auto1?.codice;
    return codice ? `/assets/img/${codice}.png` : '/assets/img/Errore.png';
  }

  getImgAuto2(p: PreferitoModel): string {
    const codice = p.confronto?.auto2?.codice;
    return codice ? `/assets/img/${codice}.png` : '/assets/img/Errore.png';
  }

  handleImgError(event: any): void {
    event.target.src = '/assets/img/Errore.png';
  }

  rimuoviPreferito(confrontoId?: number): void {
    if (!confrontoId) return;

    this.preferitiService.togglePreferito(confrontoId).subscribe({
      next: () => {
        this.listaPreferiti = this.listaPreferiti.filter(p => p.confronto?.id !== confrontoId);
        this.totalePreferiti = this.listaPreferiti.length;
        this.triggerBanner('Bolide rimosso dal garage!');
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Errore:', err);
        this.triggerBanner('Errore nella rimozione.');
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
}

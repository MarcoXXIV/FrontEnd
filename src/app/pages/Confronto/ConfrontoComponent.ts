import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfrontoService } from '../../services/ConfrontoService';
import { ConfrontoModel } from '../../models/ConfrontoModel';

@Component({
  selector: 'app-confronto',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confronto.component.html',
  styleUrls: ['./confronto.component.css']
})
export class ConfrontoComponent implements OnInit {

  risultato?: ConfrontoModel;
  loading: boolean = true;
  errore: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private confrontoService: ConfrontoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id1 = +params['idAuto1'];
      const id2 = +params['idAuto2'];

      if (id1 && id2) {
        this.eseguiSfida(id1, id2);
      } else {
        this.loading = false;
        this.errore = "Per favore, seleziona due veicoli per il confronto.";
      }
    });
  }

  private eseguiSfida(id1: number, id2: number): void {
    this.loading = true;
    this.confrontoService.eseguiBattaglia(id1, id2).subscribe({
      next: (data) => {
        this.risultato = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errore = "Errore di connessione con il database delle prestazioni.";
        console.error(err);
      }
    });
  }
}

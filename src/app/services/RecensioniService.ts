import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment'; // Importazione corretta
import { Observable } from 'rxjs';
import { RecensioneModel } from '../models/RecensioneModel';

@Injectable({
  providedIn: 'root'
})
export class RecensioniService {
  // CORRETTO: URL dinamico centralizzato
  private apiUrl = `${environment.apiUrl}/recensioni`;

  constructor(private http: HttpClient) { }

  // AGGIUNGI RECENSIONE (POST)
  aggiungiRecensione(confrontoId: number, voto: number, commento: string): Observable<RecensioneModel> {
    const params = new HttpParams()
      .set('voto', voto.toString())
      .set('commento', commento);

    return this.http.post<RecensioneModel>(`${this.apiUrl}/aggiungi/${confrontoId}`, {}, { params });
  }

  // RECUPERA PER SFIDA (GET)
  getPerSfida(confrontoId: number): Observable<RecensioneModel[]> {
    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/sfida/${confrontoId}`);
  }

  // MEDIA VOTI (GET)
  getMedia(confrontoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/media/${confrontoId}`);
  }

  // LE MIE RECENSIONI (GET)
  getMieRecensioni(): Observable<RecensioneModel[]> {
    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/mie`);
  }

  // ELIMINA RECENSIONE (DELETE/GET)
  eliminaRecensione(confrontoId: number): Observable<void> {
    // Nota: Ho mantenuto .get come nel tuo originale,
    // ma assicurati che nel backend sia @GetMapping e non @DeleteMapping
    return this.http.get<void>(`${this.apiUrl}/elimina/${confrontoId}`);
  }
}

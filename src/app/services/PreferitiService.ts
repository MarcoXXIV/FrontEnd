import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment'; // Importazione corretta
import { Observable } from 'rxjs';
import { PreferitoModel } from '../models/PreferitoModel';

@Injectable({
  providedIn: 'root'
})
export class PreferitiService {
  // CORRETTO: URL dinamico dall'environment
  private apiUrl = `${environment.apiUrl}/preferiti`;

  constructor(private http: HttpClient) { }

  // RECUPERA LISTA PREFERITI (GET)
  getMieiPreferiti(): Observable<PreferitoModel[]> {
    return this.http.get<PreferitoModel[]>(`${this.apiUrl}/miei`);
  }

  // TOGGLE PREFERITO (POST)
  // Gestisce l'aggiunta/rimozione con un'unica chiamata al backend
  togglePreferito(confrontoId: number): Observable<string> {
    // Specifichiamo responseType 'text' perché il backend non restituisce un oggetto JSON
    return this.http.post(`${this.apiUrl}/toggle/${confrontoId}`, {}, { responseType: 'text' });
  }

  // CONTEGGIO PREFERITI (GET)
  getConteggio(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}

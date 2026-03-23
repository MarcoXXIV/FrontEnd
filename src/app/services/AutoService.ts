import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment'; // Verifica il numero di ../
import { Observable } from 'rxjs';
import { AutoModel } from '../models/AutoModel';

@Injectable({
  providedIn: 'root'
})
export class AutoService {
  private apiUrl = `${environment.apiUrl}/auto`;

  constructor(private http: HttpClient) { }

  // Recupero tutto il catalogo
  getAllAuto(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/all`);
  }

  // Dettaglio singola auto
  getAutoById(id: number): Observable<AutoModel> {
    return this.http.get<AutoModel>(`${id}`); // Se il back-end ha @GetMapping("/{id}")
  }

  // METODO PER ADMIN: AGGIUNTA AUTO
  aggiungiAuto(auto: AutoModel): Observable<AutoModel> {
    return this.http.post<AutoModel>(`${this.apiUrl}/AggiungiAuto`, auto);
  }

  eliminaAuto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }

  // Ricerca filtrata
  searchAuto(marca?: string, modello?: string): Observable<AutoModel[]> {
    let params = new HttpParams();
    if (marca) params = params.set('marca', marca);
    if (modello) params = params.set('modello', modello);
    return this.http.get<AutoModel[]>(`${this.apiUrl}/search`, { params });
  }

  // Altri filtri
  getAutoByCategoria(categoria: string): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  getTopAccelerazione(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/top/accelerazione`);
  }
}

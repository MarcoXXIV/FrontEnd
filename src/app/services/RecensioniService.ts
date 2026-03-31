import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { RecensioneModel } from '../models/RecensioneModel';

@Injectable({
  providedIn: 'root'
})
export class RecensioniService {
  private apiUrl = `${environment.apiUrl}/recensioni`;

  constructor(private http: HttpClient) { }

  aggiungiRecensione(confrontoId: number, voto: number, commento: string): Observable<RecensioneModel> {
    const params = new HttpParams()
      .set('voto', voto.toString())
      .set('commento', commento);
    return this.http.post<RecensioneModel>(`${this.apiUrl}/aggiungi/${confrontoId}`, {}, { params });
  }

  getPerSfida(confrontoId: number): Observable<RecensioneModel[]> {
    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/sfida/${confrontoId}`);
  }

  getMedia(confrontoId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/media/${confrontoId}`);
  }

  getMieRecensioni(): Observable<RecensioneModel[]> {
    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/mie`);
  }

  eliminaRecensione(confrontoId: number): Observable<void> {
    // Ora usa correttamente il metodo DELETE
    return this.http.delete<void>(`${this.apiUrl}/elimina/${confrontoId}`);
  }
}

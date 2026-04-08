import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { RecensioneModel } from '../models/RecensioneModel';

@Injectable({
  providedIn: 'root'
})
export class RecensioniService {
  private apiUrl = `${environment.apiUrl}/recensioni`;

  constructor(private http: HttpClient) {}

  aggiungiRecensione(
    auto1Id: number,
    auto2Id: number,
    voto: number,
    commento: string
  ): Observable<RecensioneModel> {
    const params = new HttpParams()
      .set('auto1', auto1Id.toString())
      .set('auto2', auto2Id.toString())
      .set('voto', voto.toString())
      .set('commento', commento);

    return this.http.post<RecensioneModel>(`${this.apiUrl}/aggiungi`, null, { params });
  }

  getPerCoppia(auto1Id: number, auto2Id: number): Observable<RecensioneModel[]> {
    const params = new HttpParams()
      .set('auto1Id', auto1Id.toString())
      .set('auto2Id', auto2Id.toString());

    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/coppia`, { params });
  }

  getMedia(auto1Id: number, auto2Id: number): Observable<number> {
    const params = new HttpParams()
      .set('auto1Id', auto1Id.toString())
      .set('auto2Id', auto2Id.toString());

    return this.http.get<number>(`${this.apiUrl}/media`, { params });
  }

  getMieRecensioni(): Observable<RecensioneModel[]> {
    return this.http.get<RecensioneModel[]>(`${this.apiUrl}/mie`);
  }

  eliminaRecensione(auto1Id: number, auto2Id: number): Observable<void> {
    const params = new HttpParams()
      .set('auto1Id', auto1Id.toString())
      .set('auto2Id', auto2Id.toString());

    return this.http.delete<void>(`${this.apiUrl}/elimina`, { params });
  }
}

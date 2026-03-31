import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { PreferitoModel } from '../models/PreferitoModel';

@Injectable({ providedIn: 'root' })
export class PreferitiService {
  private apiUrl = `${environment.apiUrl}/preferiti`;

  constructor(private http: HttpClient) { }

  // Restituisce la lista tipizzata di PreferitoModel
  getMieiPreferiti(): Observable<PreferitoModel[]> {
    return this.http.get<PreferitoModel[]>(`${this.apiUrl}/miei`);
  }

  // Il backend risponde con una stringa ("Aggiunto" / "Rimosso")
  togglePreferito(confrontoId: number): Observable<string> {
    return this.http.post(`${this.apiUrl}/toggle/${confrontoId}`, {}, { responseType: 'text' });
  }

  getConteggio(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }
}

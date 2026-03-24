import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment'; // Importazione dell'environment
import { Observable } from 'rxjs';
import { ConfrontoModel } from '../models/ConfrontoModel';

@Injectable({
  providedIn: 'root'
})
export class ConfrontoService {
  private apiUrl = `${environment.apiUrl}/confronto`;

  constructor(private http: HttpClient) { }

  // ESEGUI BATTAGLIA (POST)
  eseguiBattaglia(idAuto1: number, idAuto2: number): Observable<ConfrontoModel> {
    const params = new HttpParams()
      .set('idAuto1', idAuto1.toString())
      .set('idAuto2', idAuto2.toString());

    // Invia i parametri nella query string come richiesto dal tuo backend
    return this.http.post<ConfrontoModel>(`${this.apiUrl}/battaglia`, {}, { params });
  }

  // CRONOLOGIA PERSONALE (GET)
  getMieiConfronti(): Observable<ConfrontoModel[]> {
    return this.http.get<ConfrontoModel[]>(`${this.apiUrl}/miei`);
  }

  // TOTALE SFIDE UTENTE (GET)
  getMioTotale(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  // SFIDE RECENTI GLOBALI (Per la Home o Dashboard)
  getGlobalRecenti(): Observable<ConfrontoModel[]> {
    return this.http.get<ConfrontoModel[]>(`${this.apiUrl}/recenti`);
  }

  // TREND (Auto più confrontate)
  getAutoTrend(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trend`);
  }
}

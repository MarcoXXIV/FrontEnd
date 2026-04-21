import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { ConfrontoModel } from '../models/ConfrontoModel';

@Injectable({
  providedIn: 'root'
})
export class ConfrontoService {
  private apiUrl = `${environment.apiUrl}/confronto`;

  constructor(private http: HttpClient) { }

  eseguiBattaglia(idAuto1: number, idAuto2: number): Observable<ConfrontoModel> {
    const params = new HttpParams()
      .set('idAuto1', idAuto1.toString())
      .set('idAuto2', idAuto2.toString());

    return this.http.post<ConfrontoModel>(`${this.apiUrl}/battaglia`, {}, { params });
  }

  getMieiConfronti(): Observable<ConfrontoModel[]> {
    return this.http.get<ConfrontoModel[]>(`${this.apiUrl}/miei`);
  }

  getMioTotale(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  getGlobalRecenti(): Observable<ConfrontoModel[]> {
    return this.http.get<ConfrontoModel[]>(`${this.apiUrl}/recenti`);
  }

  getAutoTrend(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/trend`);
  }

  eliminaCronologia(): Observable<string> {
    return this.http.delete(`${this.apiUrl}/pulisci`, { responseType: 'text' });
  }

  verificaSfida(idAuto1: number, idAuto2: number): Observable<boolean> {
    const params = new HttpParams()
      .set('idAuto1', idAuto1.toString())
      .set('idAuto2', idAuto2.toString());
    return this.http.get<boolean>(`${this.apiUrl}/esiste`, { params });
  }
}

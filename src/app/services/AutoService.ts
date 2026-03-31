import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { AutoModel } from '../models/AutoModel';

@Injectable({
  providedIn: 'root'
})
export class AutoService {
  private apiUrl = `${environment.apiUrl}/auto`;

  constructor(private http: HttpClient) { }

  getAllAuto(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/all`);
  }

  getRandom10(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/random`);
  }

  getAutoById(id: number): Observable<AutoModel> {
    return this.http.get<AutoModel>(`${this.apiUrl}/${id}`);
  }

  aggiungiAuto(auto: AutoModel): Observable<AutoModel> {
    return this.http.post<AutoModel>(`${this.apiUrl}/AggiungiAuto`, auto);
  }

  eliminaAuto(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/elimina/${id}`, { responseType: 'text' });
  }

  searchAuto(marca?: string, modello?: string): Observable<AutoModel[]> {
    let params = new HttpParams();
    if (marca) params = params.set('marca', marca);
    if (modello) params = params.set('modello', modello);
    return this.http.get<AutoModel[]>(`${this.apiUrl}/search`, { params });
  }

  getAutoByCategoria(categoria: string): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/categoria/${categoria}`);
  }

  getTopAccelerazione(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/top/accelerazione`);
  }

  getTopGreen(): Observable<AutoModel[]> {
    return this.http.get<AutoModel[]>(`${this.apiUrl}/top/green`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { UtenteModel } from '../models/UtenteModel';
import { AutoModel } from '../models/AutoModel';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Supponendo che nel back-end tu abbia creato rotte sotto /admin
  // Altrimenti puoi mantenere le rotte originali, ma centralizzate qui.
  private apiAdmin = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  getAllUtenti(): Observable<UtenteModel[]> {
    return this.http.get<UtenteModel[]>(`${this.apiAdmin}/all`);
  }

  cambiaRuolo(idUtente: number, nuovoRuolo: string): Observable<UtenteModel> {
    return this.http.put<UtenteModel>(`${this.apiAdmin}/cambia-ruolo/${idUtente}`, { ruolo: nuovoRuolo });
  }

  eliminaUtente(id: number): Observable<string> {
    return this.http.delete(`${this.apiAdmin}/elimina-utente/${id}`, { responseType: 'text' });
  }

  // --- GESTIONE AUTO (Azione privilegiata Admin) ---
  aggiungiAuto(auto: AutoModel): Observable<AutoModel> {
    return this.http.post<AutoModel>(`${this.apiAdmin}/aggiungi`, auto);
  }

  eliminaAuto(id: number): Observable<string> {
    return this.http.delete(`${this.apiAdmin}/elimina-auto/${id}`, { responseType: 'text' });
  }

  aggiornaAuto(auto: AutoModel): Observable<AutoModel> {
    return this.http.put<AutoModel>(`${this.apiAdmin}/aggiorna/${auto.id}`, auto);
  }
}

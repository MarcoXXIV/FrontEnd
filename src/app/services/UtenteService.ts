import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { UtenteModel } from '../models/UtenteModel';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {
  private apiUrl = `${environment.apiUrl}/utente`;

  constructor(private http: HttpClient) { }

  getProfilo(): Observable<UtenteModel> {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error("ERRORE: Nessun token trovato nel localStorage! Il profilo non caricherà.");
    }

    return this.http.get<UtenteModel>(`${this.apiUrl}/profilo`);
  }

  // Usiamo UtenteModel per coerenza con il backend
  aggiornaProfilo(nuoviDati: UtenteModel): Observable<UtenteModel> {
    return this.http.put<UtenteModel>(`${this.apiUrl}/aggiorna`, nuoviDati);
  }

  cambiaPassword(vecchiaPsw: string, nuovaPsw: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/cambia-password`,
      { vecchiaPassword: vecchiaPsw, nuovaPassword: nuovaPsw },
      { responseType: 'text' }
    );
  }

  checkAdmin(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/is-admin`);
  }

  getAllUtenti(): Observable<UtenteModel[]> {
    return this.http.get<UtenteModel[]>(`${this.apiUrl}/all`);
  }

  cambiaRuolo(idUtente: number, nuovoRuolo: string): Observable<UtenteModel> {
    return this.http.put<UtenteModel>(`${this.apiUrl}/cambia-ruolo/${idUtente}`, { ruolo: nuovoRuolo });
  }

  // CORRETTO: URL allineato al Controller Java (/elimina invece di /delete)
  eliminaUtente(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/elimina/${id}`, { responseType: 'text' });
  }
}

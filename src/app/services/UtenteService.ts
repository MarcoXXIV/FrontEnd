import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment'; // Importazione corretta
import { Observable } from 'rxjs';
import { UtenteModel } from '../models/UtenteModel';

@Injectable({
  providedIn: 'root'
})
export class UtenteService {
  // CORRETTO: Ora usa l'URL dinamico definito in environment.ts
  private apiUrl = `${environment.apiUrl}/utente`;

  constructor(private http: HttpClient) { }

  // RECUPERA PROFILO (Dati personali)
  getProfilo(): Observable<UtenteModel> {
    return this.http.get<UtenteModel>(`${this.apiUrl}/profilo`);
  }

  // AGGIORNA DATI BASE (Nome, Cognome)
  aggiornaProfilo(nuoviDati: UtenteModel): Observable<UtenteModel> {
    return this.http.put<UtenteModel>(`${this.apiUrl}/aggiorna`, nuoviDati);
  }

  // CAMBIO PASSWORD
  cambiaPassword(vecchiaPsw: string, nuovaPsw: string): Observable<string> {
    const payload = {
      vecchiaPassword: vecchiaPsw,
      nuovaPassword: nuovaPsw
    };
    // Manteniamo responseType: 'text' perché il backend restituisce una stringa di conferma
    return this.http.post(`${this.apiUrl}/cambia-password`, payload, { responseType: 'text' });
  }

  // VERIFICA SE ADMIN
  checkAdmin(): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/is-admin`);
  }

  // RECUPERA TUTTI GLI UTENTI (Solo per Admin)
  getAllUtenti(): Observable<UtenteModel[]> {
    return this.http.get<UtenteModel[]>(`${this.apiUrl}/all`);
  }

  cambiaRuolo(idUtente: number, nuovoRuolo: string): Observable<UtenteModel> {
    return this.http.put<UtenteModel>(`${this.apiUrl}/cambia-ruolo/${idUtente}`, { ruolo: nuovoRuolo });
  }

  eliminaUtente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment'; // 1. Corretto il nome dell'import (solitamente singolare)
import { AuthResponse } from '../models/AuthResponse';
import { LoginRequest } from '../models/LoginRequest';
import { RegisterRequest } from '../models/RegisterRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 2. Usati i backtick `` per l'interpolazione della stringa, altrimenti legge il testo letterale
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  // REGISTRAZIONE
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  // LOGIN
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  // GESTIONE SESSIONE (Salvataggio dati nel browser)
  private setSession(authResult: AuthResponse) {
    localStorage.setItem('token', authResult.token);
    // Usiamo il toString() o i template literal per l'ID numerico
    localStorage.setItem('id_utente', authResult.id.toString());
    localStorage.setItem('email', authResult.email);
    localStorage.setItem('ruolo', authResult.ruolo);
  }

  // LOGOUT
  logout() {
    localStorage.clear(); // Pulisce tutto il LocalStorage in un colpo solo
  }

  // Verifica stato login
  public isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  // Recupera il Token per l'Interceptor
  public getToken(): string | null {
    return localStorage.getItem('token');
  }
}

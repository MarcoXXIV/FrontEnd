import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthResponse } from '../models/AuthResponse';
import { LoginRequest } from '../models/LoginRequest';
import { RegisterRequest } from '../models/RegisterRequest';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) { }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(res => this.setSession(res))
    );
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('token', authResult.token);
    // Nota: salviamo email e ruolo se presenti nella risposta
    if(authResult.email) localStorage.setItem('email', authResult.email);
    if(authResult.ruolo) localStorage.setItem('ruolo', authResult.ruolo);
  }

  logout() {
    localStorage.clear();
  }

  public isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }
}

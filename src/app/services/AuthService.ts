import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthResponse } from '../models/AuthResponse';
import { LoginRequest } from '../models/LoginRequest';
import { RegisterRequest } from '../models/RegisterRequest';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, request)
      .pipe(tap((res) => this.setSession(res)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, request)
      .pipe(tap((res) => this.setSession(res)));
  }

  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    const params = new HttpParams().set('email', email.trim().toLowerCase());
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/check-email`, { params });
  }

  private setSession(authResult: AuthResponse) {
    localStorage.setItem('token', authResult.token);
    if (authResult.email) localStorage.setItem('email', authResult.email);
    if (authResult.ruolo) localStorage.setItem('ruolo', authResult.ruolo);
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

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

import { AutoService } from '../../services/AutoService';
import { AdminService } from '../../services/AdminService';
import { AutoModel } from '../../models/AutoModel';
import { UtenteModel } from '../../models/UtenteModel';
import { NavbarComponent } from '../../components/Navbar/NavbarComponent';

type AdminSection = 'utenti' | 'nuova-auto' | 'gestione-auto';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './AdminComponent.html',
  styleUrls: ['./AdminComponent.css'],
})
export class AdminComponent implements OnInit, OnDestroy {
  listaUtenti: UtenteModel[] = [];

  catalogoAutoCompleto: AutoModel[] = [];

  listaAuto: AutoModel[] = [];

  sezioneAttiva: AdminSection = 'nuova-auto';

  nuovaAuto: AutoModel = this.getResetForm();
  autoInModificaId: number | null = null;

  showToast = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  fotoSelezionata: File | null = null;
  previewFotoUrl: string | null = null;
  pathFotoAssets = '';
  nomeFotoSelezionata = '';

  filtroMarca = '';
  filtroModello = '';
  marchiDisponibili: string[] = [];
  modelliDisponibili: string[] = [];
  loadingRicercaAuto = false;
  messaggioRicercaAuto = '';

  private toastTimeout?: ReturnType<typeof setTimeout>;
  private afterToastTimeout?: ReturnType<typeof setTimeout>;
  private routeSub?: Subscription;
  private autoApiSub?: Subscription;

  constructor(
    private autoService: AutoService,
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.queryParams.subscribe((params) => {
      const section = params['section'];
      if (section === 'utenti' || section === 'nuova-auto' || section === 'gestione-auto') {
        this.setSezione(section, false);
      }
    });

    this.caricaUtenti();
    this.caricaAuto();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.autoApiSub?.unsubscribe();

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (this.afterToastTimeout) clearTimeout(this.afterToastTimeout);

    this.revokePreviewUrl();
  }

  get isModifica(): boolean {
    return this.autoInModificaId !== null;
  }

  get hasFoto(): boolean {
    return !!this.pathFotoAssets;
  }

  get marcaSelezionataValida(): boolean {
    const marcaCanonica = this.trovaMarcaCanonica(this.filtroMarca);
    return !!marcaCanonica && this.marcaEsistente(marcaCanonica);
  }

  setSezione(nome: AdminSection, aggiornaUrl: boolean = true): void {
    this.sezioneAttiva = nome;

    if (aggiornaUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { section: nome },
        queryParamsHandling: 'merge',
      });
    }

    if (nome === 'utenti' && this.listaUtenti.length === 0) {
      this.caricaUtenti();
    }

    if (nome === 'gestione-auto' && this.catalogoAutoCompleto.length === 0) {
      this.caricaAuto();
    }
  }

  caricaUtenti(): void {
    this.adminService.getAllUtenti().subscribe({
      next: (data: UtenteModel[]) => {
        this.listaUtenti = [...data];
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.triggerToast('Errore caricamento utenti.', 'error');
      },
    });
  }

  modificaRuolo(idUtente: number | undefined, nuovoRuolo: string): void {
    if (!idUtente || !nuovoRuolo) return;

    this.adminService.cambiaRuolo(idUtente, nuovoRuolo).subscribe({
      next: (res: UtenteModel) => {
        const index = this.listaUtenti.findIndex((u) => u.id === idUtente);

        if (index !== -1) {
          this.listaUtenti[index] = res;
          this.listaUtenti = [...this.listaUtenti];
        }

        this.triggerToast('Ruolo aggiornato con successo!', 'success');
      },
      error: (err: any) => {
        console.error(err);
        const msg = err?.error || 'Errore durante l’aggiornamento del ruolo.';
        this.triggerToast(msg, 'error');
      },
    });
  }

  eliminaUtente(id: number | undefined): void {
    if (!id) return;

    if (confirm("Eliminare definitivamente l'utente?")) {
      const copiaBackup = [...this.listaUtenti];
      this.listaUtenti = this.listaUtenti.filter((u) => u.id !== id);

      this.adminService.eliminaUtente(id).subscribe({
        next: () => {
          this.triggerToast('Utente eliminato con successo!', 'success');
        },
        error: (err: any) => {
          console.error(err);
          this.listaUtenti = copiaBackup;
          this.triggerToast("Errore durante l'eliminazione server-side.", 'error');
        },
      });
    }
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLocaleLowerCase('it');
  }

  private estraiValoriUnici(values: Array<string | null | undefined>): string[] {
    return [
      ...new Set(values.map((v) => (v ?? '').trim()).filter((v): v is string => v.length > 0)),
    ].sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }

  private marcaEsistente(marca: string): boolean {
    const marcaNorm = this.normalize(marca);
    return this.marchiDisponibili.some((m) => this.normalize(m) === marcaNorm);
  }

  private trovaMarcaCanonica(input: string): string {
    const valore = input.trim();
    const normalized = this.normalize(valore);

    if (!normalized) return '';

    const exact = this.marchiDisponibili.find((m) => this.normalize(m) === normalized);
    if (exact) return exact;

    const startsWithMatches = this.marchiDisponibili.filter((m) =>
      this.normalize(m).startsWith(normalized),
    );

    if (startsWithMatches.length === 1) {
      return startsWithMatches[0];
    }

    return valore;
  }

  private aggiornaSuggerimentiAuto(): void {
    this.marchiDisponibili = this.estraiValoriUnici(
      this.catalogoAutoCompleto.map((auto) => auto.marca),
    );
    this.aggiornaModelliDisponibili();
  }

  private aggiornaModelliDisponibili(): void {
    const marcaCanonica = this.trovaMarcaCanonica(this.filtroMarca);
    const marcaNorm = this.normalize(marcaCanonica);

    if (!marcaNorm || !this.marcaEsistente(marcaCanonica)) {
      this.modelliDisponibili = [];
      this.filtroModello = '';
      return;
    }

    const modelli = this.catalogoAutoCompleto
      .filter((auto) => this.normalize(auto.marca) === marcaNorm)
      .map((auto) => auto.modello);

    this.modelliDisponibili = this.estraiValoriUnici(modelli);

    const modelloAttuale = this.normalize(this.filtroModello);
    const modelloAncoraValido = this.modelliDisponibili.some(
      (m) => this.normalize(m) === modelloAttuale,
    );

    if (this.filtroModello && !modelloAncoraValido) {
      this.filtroModello = '';
    }
  }

  onMarcaChange(value: string): void {
    this.filtroMarca = value;
    this.filtroModello = '';
    this.aggiornaModelliDisponibili();
  }

  onMarcaBlur(): void {
    const marcaCanonica = this.trovaMarcaCanonica(this.filtroMarca);

    if (marcaCanonica && this.marcaEsistente(marcaCanonica)) {
      this.filtroMarca = marcaCanonica;
    }

    this.aggiornaModelliDisponibili();
    this.cd.detectChanges();
  }

  private haFiltriRicercaAttivi(): boolean {
    return !!this.filtroMarca.trim() || !!this.filtroModello.trim();
  }

  private eseguiRichiestaAuto<T>(
    request$: Observable<T>,
    onSuccess: (data: T) => void,
    errorMessage: string,
  ): void {
    this.autoApiSub?.unsubscribe();
    this.loadingRicercaAuto = true;
    this.cd.detectChanges();

    this.autoApiSub = request$
      .pipe(
        take(1),
        finalize(() => {
          this.loadingRicercaAuto = false;
          this.cd.detectChanges();
        }),
      )
      .subscribe({
        next: onSuccess,
        error: (err) => {
          console.error(errorMessage, err);
          this.messaggioRicercaAuto = errorMessage;
          this.triggerToast(errorMessage, 'error');
        },
      });
  }

  caricaAuto(mostraMessaggio: boolean = false): void {
    this.eseguiRichiestaAuto(
      this.autoService.getAllAuto(),
      (data: AutoModel[]) => {
        this.catalogoAutoCompleto = [...data];
        this.listaAuto = [...data];
        this.aggiornaSuggerimentiAuto();

        this.messaggioRicercaAuto = mostraMessaggio
          ? this.listaAuto.length > 0
            ? 'Catalogo completo caricato.'
            : 'Nessuna auto presente nel catalogo.'
          : '';

        this.cd.detectChanges();
      },
      'Errore caricamento catalogo auto.',
    );
  }

  eseguiRicercaAuto(): void {
    if (this.loadingRicercaAuto) return;

    if (!this.catalogoAutoCompleto.length) {
      this.caricaAuto();
      return;
    }

    const marcaInput = this.filtroMarca.trim();
    const modelloInput = this.filtroModello.trim();

    if (!marcaInput && !modelloInput) {
      this.resetRicercaAuto();
      return;
    }

    if (modelloInput && !this.marcaSelezionataValida) {
      this.triggerToast('Seleziona prima una marca valida per poter cercare anche per modello.', 'error');
      this.filtroModello = '';
      this.aggiornaModelliDisponibili();
      return;
    }

    let marcaDaInviare: string | undefined = undefined;
    let modelloDaInviare: string | undefined = undefined;

    if (marcaInput) {
      const marcaCanonica = this.trovaMarcaCanonica(marcaInput);
      if (marcaCanonica && this.marcaEsistente(marcaCanonica)) {
        this.filtroMarca = marcaCanonica;
        marcaDaInviare = marcaCanonica;
      } else {
        marcaDaInviare = marcaInput;
      }
    }

    if (modelloInput) {
      modelloDaInviare = modelloInput;
    }

    this.aggiornaModelliDisponibili();

    this.eseguiRichiestaAuto(
      this.autoService.searchAuto(marcaDaInviare, modelloDaInviare),
      (data: AutoModel[]) => {
        this.listaAuto = [...data];

        this.messaggioRicercaAuto =
          data.length === 0
            ? 'Nessuna auto trovata.'
            : `Risultati trovati${this.filtroMarca ? ' per marca: ' + this.filtroMarca : ''}${this.filtroModello ? ' / modello: ' + this.filtroModello : ''}`;

        this.cd.detectChanges();
      },
      'Errore durante la ricerca delle auto.',
    );
  }

  resetRicercaAuto(): void {
    this.autoApiSub?.unsubscribe();

    this.filtroMarca = '';
    this.filtroModello = '';
    this.modelliDisponibili = [];
    this.loadingRicercaAuto = false;
    this.listaAuto = [...this.catalogoAutoCompleto];
    this.messaggioRicercaAuto =
      this.listaAuto.length > 0
        ? 'Catalogo completo ripristinato.'
        : 'Nessuna auto presente nel catalogo.';

    this.cd.detectChanges();
  }

  ricaricaCatalogoAuto(): void {
    if (this.loadingRicercaAuto) {
      this.autoApiSub?.unsubscribe();
      this.loadingRicercaAuto = false;
    }

    this.filtroMarca = '';
    this.filtroModello = '';
    this.modelliDisponibili = [];
    this.messaggioRicercaAuto = '';
    this.caricaAuto(true);
  }

  private aggiornaAutoInArray(array: AutoModel[], autoAggiornata: AutoModel): AutoModel[] {
    const index = array.findIndex((a) => a.id === autoAggiornata.id);
    if (index === -1) return [...array];

    const copia = [...array];
    copia[index] = autoAggiornata;
    return copia;
  }

  onFotoSelezionata(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const isPngMime = file.type === 'image/png';
    const isPngName = file.name.toLowerCase().endsWith('.png');

    if (!isPngMime && !isPngName) {
      this.resetFotoState();
      input.value = '';
      this.triggerToast('La foto deve essere obbligatoriamente in formato PNG.', 'error');
      return;
    }

    this.revokePreviewUrl();

    this.fotoSelezionata = file;
    this.nomeFotoSelezionata = file.name;

    const nomeFinale = this.buildNomeFotoPng(file.name);
    this.pathFotoAssets = `assets/img/${nomeFinale}`;

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      this.previewFotoUrl = URL.createObjectURL(file);
    } else {
      this.previewFotoUrl = null;
    }

    this.triggerToast('Foto PNG selezionata correttamente.', 'success');
    this.cd.detectChanges();
  }

  rimuoviFoto(): void {
    this.resetFotoState();
    this.triggerToast('Foto rimossa dal form.', 'success');
  }

  salvaAuto(): void {
    if (!this.pathFotoAssets) {
      this.triggerToast('Devi caricare una foto PNG prima di salvare l’auto.', 'error');
      return;
    }

    const payload: any = {
      ...this.nuovaAuto,
      immagine: this.pathFotoAssets,
    };

    if (this.isModifica && this.autoInModificaId !== null) {
      this.autoService.aggiornaAuto(this.autoInModificaId, payload).subscribe({
        next: (res: AutoModel) => {
          const autoAggiornata: any = {
            ...res,
            immagine: this.pathFotoAssets,
          };

          this.catalogoAutoCompleto = this.aggiornaAutoInArray(
            this.catalogoAutoCompleto,
            autoAggiornata,
          );
          this.listaAuto = this.aggiornaAutoInArray(this.listaAuto, autoAggiornata);
          this.aggiornaSuggerimentiAuto();

          const filtriAttivi = this.haFiltriRicercaAttivi();

          this.annullaModifica(false);
          this.setSezione('gestione-auto');

          this.triggerToast('Auto aggiornata con successo!', 'success', 2200);

          if (filtriAttivi) {
            this.eseguiRicercaAuto();
          } else {
            this.listaAuto = [...this.catalogoAutoCompleto];
            this.messaggioRicercaAuto = 'Catalogo aggiornato.';
          }

          if (this.afterToastTimeout) clearTimeout(this.afterToastTimeout);
          this.afterToastTimeout = setTimeout(() => {
            this.router.navigate(['/Admin'], {
              queryParams: { section: 'gestione-auto' },
            });
          }, 2200);

          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          const msg = err?.error || "Errore durante l'aggiornamento dell'auto.";
          this.triggerToast(msg, 'error');
        },
      });

      return;
    }

    this.autoService.aggiungiAuto(payload).subscribe({
      next: (res: AutoModel) => {
        const autoCreata: any = {
          ...res,
          immagine: this.pathFotoAssets,
        };

        this.catalogoAutoCompleto = [autoCreata, ...this.catalogoAutoCompleto];
        this.aggiornaSuggerimentiAuto();

        if (this.haFiltriRicercaAttivi()) {
          this.eseguiRicercaAuto();
        } else {
          this.listaAuto = [autoCreata, ...this.listaAuto];
          this.messaggioRicercaAuto = 'Nuova auto aggiunta al catalogo.';
        }

        this.nuovaAuto = this.getResetForm();
        this.resetFotoState();
        this.setSezione('gestione-auto');
        this.triggerToast('Auto aggiunta con successo!', 'success');
        this.cd.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        const msg = err?.error || "Errore durante l'inserimento dell'auto.";
        this.triggerToast(msg, 'error');
      },
    });
  }

  modificaAuto(auto: AutoModel): void {
    this.autoInModificaId = auto.id ?? null;
    this.nuovaAuto = {
      ...this.getResetForm(),
      ...auto,
    };

    const autoAny = auto as any;
    this.resetFotoState(false);

    if (autoAny?.immagine) {
      this.pathFotoAssets = autoAny.immagine;
      this.previewFotoUrl = autoAny.immagine;
      this.nomeFotoSelezionata = this.estraiNomeFile(autoAny.immagine);
    }

    this.setSezione('nuova-auto');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    this.triggerToast('Dati auto caricati nel form di modifica.', 'success');
  }

  annullaModifica(mostraToast: boolean = false): void {
    this.autoInModificaId = null;
    this.nuovaAuto = this.getResetForm();
    this.resetFotoState();

    if (mostraToast) {
      this.triggerToast('Modifica annullata.', 'success');
    }
  }

  eliminaAuto(id: number | undefined): void {
    if (!id) return;

    if (confirm('Sei sicuro di voler rimuovere questa auto dal catalogo?')) {
      const backupLista = [...this.listaAuto];
      const backupCompleto = [...this.catalogoAutoCompleto];

      this.listaAuto = this.listaAuto.filter((a) => a.id !== id);
      this.catalogoAutoCompleto = this.catalogoAutoCompleto.filter((a) => a.id !== id);
      this.aggiornaSuggerimentiAuto();

      this.autoService.eliminaAuto(id).subscribe({
        next: () => {
          if (this.autoInModificaId === id) {
            this.annullaModifica(false);
          }

          if (this.listaAuto.length === 0) {
            this.messaggioRicercaAuto = 'Nessuna auto presente nei risultati correnti.';
          }

          this.triggerToast('Auto rimossa dal catalogo con successo!', 'success');
          this.cd.detectChanges();
        },
        error: (err: any) => {
          console.error(err);
          this.listaAuto = backupLista;
          this.catalogoAutoCompleto = backupCompleto;
          this.aggiornaSuggerimentiAuto();

          const msg = err?.error || "Errore nell'eliminazione dell'auto.";
          this.triggerToast(msg, 'error');
        },
      });
    }
  }

  private triggerToast(msg: string, type: 'success' | 'error', duration: number = 3500): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);

    this.toastMsg = msg;
    this.toastType = type;
    this.showToast = true;
    this.cd.detectChanges();

    this.toastTimeout = setTimeout(() => {
      this.showToast = false;
      this.cd.detectChanges();
    }, duration);
  }

  private buildNomeFotoPng(nomeOriginale: string): string {
    const base = nomeOriginale.replace(/\.png$/i, '');
    const marca = (this.nuovaAuto.marca || 'auto').trim();
    const modello = (this.nuovaAuto.modello || 'modello').trim();

    const pezzoBase = `${marca}-${modello}-${base || 'immagine'}`;
    const pulito = pezzoBase
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `${pulito || 'auto-immagine'}.png`;
  }

  private estraiNomeFile(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1] || '';
  }

  private revokePreviewUrl(): void {
    if (this.previewFotoUrl && this.previewFotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewFotoUrl);
    }
  }

  private resetFotoState(revocaPreview: boolean = true): void {
    if (revocaPreview) {
      this.revokePreviewUrl();
    }

    this.fotoSelezionata = null;
    this.previewFotoUrl = null;
    this.pathFotoAssets = '';
    this.nomeFotoSelezionata = '';
    this.cd.detectChanges();
  }

  private getResetForm(): AutoModel {
    return {
      id: undefined,
      marca: '',
      modello: '',
      anno: new Date().getFullYear(),
      prezzo: 0,
      categoria: '',
      codice: '',
      cilindri: 0,
      cv: 0,
      cilindrata: 0,
      coppia: 0,
      alimentazione: '',
      trazione: '',
      euro: '',
      velocitaMax: 0,
      accelerazione0100: 0,
      accelerazione100200: 0,
      accelerazione80140: 0,
      pesoKg: 0,
      rapportoPesoPotenza: 0,
      consumoMedio: 0,
      co2: 0,
    } as AutoModel;
  }
}

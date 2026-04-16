import { UtenteModel } from './UtenteModel';
import { AutoModel } from './AutoModel';

export interface ConfrontoModel {
  id?: number;
  utente?: UtenteModel;
  auto1: AutoModel;
  auto2: AutoModel;
  dataConfronto?: Date | string;
  punteggio1: number;
  punteggio2: number;
}

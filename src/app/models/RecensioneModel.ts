import { UtenteModel } from './UtenteModel';
import { ConfrontoModel } from './ConfrontoModel';

export interface RecensioneModel {
  id?: number;
  utente?: UtenteModel;
  confronto?: ConfrontoModel;
  voto: number;
  commento: string;
  dataRecensione?: Date | string;
}

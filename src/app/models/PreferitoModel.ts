import { UtenteModel } from './UtenteModel';
import { ConfrontoModel } from './ConfrontoModel';

export interface PreferitoModel {
  id?: number;
  utente?: UtenteModel;
  confronto?: ConfrontoModel;
  dataAggiunta?: Date | string;
}

import { UtenteModel } from './UtenteModel';
import { AutoModel } from './AutoModel';

export interface RecensioneModel {
  id?: number;
  utente?: UtenteModel;
  auto1?: AutoModel;
  auto2?: AutoModel;
  voto: number;
  commento: string;
  dataRecensione?: Date | string;
}

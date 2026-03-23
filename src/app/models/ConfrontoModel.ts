import { UtenteModel } from './UtenteModel';
import { AutoModel } from './AutoModel';

export interface ConfrontoModel {
  id?: number;
  utente?: UtenteModel;
  auto1: AutoModel;
  auto2: AutoModel;
  dataConfronto?: Date | string;
  punteggioAuto1: number;
  punteggioAuto2: number;
}

import { Routes } from '@angular/router';
import { PontoColetaListComponent } from './ponto-coleta-list/ponto-coleta-list.component';
import { PontoColetaFormComponent } from './ponto-coleta-form/ponto-coleta-form.component';

export const PONTOS_COLETA_ROUTES: Routes = [
  { path: '', component: PontoColetaListComponent },
  { path: 'novo', component: PontoColetaFormComponent },
  { path: ':id/editar', component: PontoColetaFormComponent },
];

import { Routes } from '@angular/router';
import { OrdemServicoListComponent } from './ordem-servico-list/ordem-servico-list.component';
import { OrdemServicoFormComponent } from './ordem-servico-form/ordem-servico-form.component';

export const ORDENS_SERVICO_ROUTES: Routes = [
  { path: '', component: OrdemServicoListComponent },
  { path: 'novo', component: OrdemServicoFormComponent },
  { path: ':id/editar', component: OrdemServicoFormComponent },
];

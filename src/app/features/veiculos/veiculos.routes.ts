import { Routes } from '@angular/router';
import { VeiculoListComponent } from './veiculo-list/veiculo-list.component';
import { VeiculoFormComponent } from './veiculo-form/veiculo-form.component';

export const VEICULOS_ROUTES: Routes = [
  { path: '', component: VeiculoListComponent },
  { path: 'novo', component: VeiculoFormComponent },
  { path: ':id/editar', component: VeiculoFormComponent },
];

import { Routes } from '@angular/router';
import { MotoristaListComponent } from './motorista-list/motorista-list.component';
import { MotoristaFormComponent } from './motorista-form/motorista-form.component';

export const MOTORISTAS_ROUTES: Routes = [
  { path: '', component: MotoristaListComponent },
  { path: 'novo', component: MotoristaFormComponent },
  { path: ':id/editar', component: MotoristaFormComponent },
];

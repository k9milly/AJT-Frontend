import { Routes } from '@angular/router';
import { PassageiroListComponent } from './passageiro-list/passageiro-list.component';
import { PassageiroFormComponent } from './passageiro-form/passageiro-form.component';

export const PASSAGEIROS_ROUTES: Routes = [
  { path: '', component: PassageiroListComponent },
  { path: 'novo', component: PassageiroFormComponent },
  { path: ':id/editar', component: PassageiroFormComponent },
];

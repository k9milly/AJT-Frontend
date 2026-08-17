import { Routes } from '@angular/router';
import { TransferListComponent } from './transfer-list/transfer-list.component';
import { TransferFormComponent } from './transfer-form/transfer-form.component';

export const TRANSFERS_ROUTES: Routes = [
  { path: '', component: TransferListComponent },
  { path: 'novo', component: TransferFormComponent },
  { path: ':id/editar', component: TransferFormComponent },
];

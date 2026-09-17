import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
    selector: 'app-home',
    imports: [RouterLink, RevealDirective],
    templateUrl: './home.component.html'
})
export class HomeComponent {}

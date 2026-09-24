import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MarkerForm } from './markers/marker-form/marker-form';
import { MarkerList } from './markers/marker-list/marker-list';
import { MarkerMap } from './markers/marker-map/marker-map';

@Component({
  imports: [MatToolbarModule, MarkerList, MarkerForm, MarkerMap],
  selector: 'app-root',
  host: { class: 'flex h-screen flex-col' },
  templateUrl: './app.html',
})
export class App {}

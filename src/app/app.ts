import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppBootstrapService } from './core/bootstrap/app-bootstrap.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly bootstrap = inject(AppBootstrapService);
}

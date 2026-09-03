import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppBootstrapService } from './core/bootstrap/app-bootstrap.service';
import { ToastHostComponent } from './core/ui/toast/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly bootstrap = inject(AppBootstrapService);
}

import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LIBELLES_ROLES, SessionService } from './services/session.service';
import { StockageService } from './services/stockage.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly session = inject(SessionService);
  readonly stockage = inject(StockageService);

  readonly libellesRoles = LIBELLES_ROLES;
}

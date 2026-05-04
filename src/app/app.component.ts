import { Component, OnInit, OnDestroy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from "./shared/components/toast-container/toast-container.component";
import { PresenceService } from "./core/services/presence.service";
import { AuthService } from "./core/services/auth.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent implements OnInit, OnDestroy {
  private pingInterval?: ReturnType<typeof setInterval>;

  constructor(
    private presenceService: PresenceService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.startPing();
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      const userId = this.auth.getUserId();
      const sessionId = this.auth.getSessionId();
      if (userId && sessionId) {
        this.presenceService.ping(sessionId).subscribe({ error: () => {} });
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#f8f4ff">
      <p style="color:#7C3AED;font-size:1.2rem;font-weight:600">Signing you in...</p>
    </div>
  `
})
export class OauthCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.auth.saveToken(token);
      this.auth.isAuthenticated.set(true);
      this.auth.getProfile().subscribe({
        next: () => this.router.navigate(['/chat']),
        error: () => this.router.navigate(['/chat'])
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
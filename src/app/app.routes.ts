import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    redirectTo: "splash",
    pathMatch: "full",
  },
  {
    path: "splash",
    loadComponent: () =>
      import("./features/splash/splash.component").then(
        (m) => m.SplashComponent,
      ),
  },
  {
    path: "auth",
    canActivate: [guestGuard],
    children: [
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/login/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/register/register.component").then(
            (m) => m.RegisterComponent,
          ),
      },
      { path: "", redirectTo: "login", pathMatch: "full" },
    ],
  },
  {
    path: "chat",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/chat/chat-shell/chat-shell.component").then(
        (m) => m.ChatShellComponent,
      ),
    children: [
      {
        path: ":roomId",
        loadComponent: () =>
          import("./features/chat/chat-window/chat-window.component").then(
            (m) => m.ChatWindowComponent,
          ),
      },
    ],
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
  },
  {
    path: "oauth2/callback",
    loadComponent: () =>
      import("./features/auth/oauth-callback/oauth-callback.component").then(
        (m) => m.OauthCallbackComponent,
      ),
  },
  { path: "**", redirectTo: "splash" },
];

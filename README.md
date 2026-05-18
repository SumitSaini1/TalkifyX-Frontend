TalkifyX Frontend

Real-time chat application built with Angular 17


Tech Stack
LayerTechnologyFrameworkAngular 17 (Standalone Components)LanguageTypeScript 5.4Real-timeSTOMP over SockJS (WebSocket)Push NotificationsFirebase FCMState ManagementAngular SignalsTestingJest + jest-preset-angularDeploymentNetlify

Features

JWT auth + Google OAuth2
Real-time messaging via WebSocket (STOMP)
DM and Group Rooms
Typing indicators, read receipts, delivery status
Message reactions, edit, delete (for me / everyone)
Image & file upload
User presence (Online / Away / DND / Invisible)
Firebase push notifications (FCM)
Notifications panel with unread count
Profile management + avatar upload
Skeleton loaders, toast notifications


Project Structure
src/
├── main.ts
├── environments/              # DEV / PROD API URLs + Firebase config
└── app/
    ├── app.component.ts       # Root component + presence ping
    ├── app.config.ts          # Global providers (HTTP, Router, Interceptors)
    ├── app.routes.ts          # All routes with lazy loading + guards
    ├── core/
    │   ├── guards/            # authGuard, guestGuard
    │   ├── interceptors/      # jwt.interceptor, error.interceptor
    │   ├── models/            # All TS interfaces (User, Room, Message...)
    │   └── services/          # auth, websocket, room, message,
    │                          # presence, media, notification, fcm,
    │                          # toast, chat-state
    ├── features/
    │   ├── splash/
    │   ├── auth/              # login, register, oauth-callback
    │   ├── chat/              # chat-shell, chat-window, message-bubble,
    │   │                      # new-chat-modal, room-info
    │   ├── profile/
    │   └── notifications/
    └── shared/
        ├── components/        # avatar, skeleton, toast-container
        └── pipes/             # timeAgo, chatTime

Backend Services
ServiceDefault URLMain APIhttp://localhost:8080OAuth2http://localhost:8081WebSockethttp://localhost:8085/ws

Getting Started
bashgit clone <repo-url>
cd TalkifyX-Frontend
npm install
ng serve
# runs at http://localhost:4200
bashng build --configuration production   # production build
npm test                              # run jest tests
npm run test:coverage                 # with coverage report

Environment Config
Edit src/environments/environment.ts:
tsexport const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  wsUrl: 'http://localhost:8085/ws',
  oauthGoogleUrl: 'http://localhost:8081/oauth2/authorization/google',
  firebase: { /* your firebase config */ }
};

Auth Flow
Login → POST /api/auth/login → JWT saved to localStorage
      → jwtInterceptor adds Bearer token to every request
      → errorInterceptor handles 401 → auto logout
      → authGuard blocks /chat if not logged in
      → guestGuard blocks /auth if already logged in

WebSocket Events
EventDescriptionMESSAGENew chat messageTYPINGTyping indicatorREADRead receiptREACTIONEmoji reactionMSG_EDITMessage editedMSG_DELETEMessage deletedPRESENCEUser online status changeNEW_ROOMNew room created

Tests
Located in __tests__/ — runs with Jest:

auth.service.spec.ts
auth-components.spec.ts
chat-state.service.spec.ts
websocket.service.spec.ts
guards-interceptors.spec.ts
message.service.spec.ts
room.service.spec.ts
message-bubble.component.spec.ts
misc-services.spec.ts
pipes.spec.ts

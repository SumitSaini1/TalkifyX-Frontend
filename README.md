TalkifyX Frontend

A modern, real-time chat application built with Angular 17 using modern architectural patterns, standalone components, and Angular Signals.

🛠️ Tech Stack

Layer

Technology / Framework

Framework

Angular 17 (Standalone Components)

Language

TypeScript 5.4

Real-time Engine

STOMP over SockJS (WebSocket)

Push Notifications

Firebase Cloud Messaging (FCM)

State Management

Angular Signals

Testing

Jest + jest-preset-angular

Deployment

Netlify

✨ Features

🔐 Authentication: JWT Auth & Google OAuth2 integration.

💬 Real-Time Messaging: Fully bi-directional messaging via STOMP over WebSockets.

👥 Rooms: Support for both Direct Messages (DM) and Group Rooms.

⚡ Interactive Chat Indicators: Typing indicators, delivery statuses, and read receipts.

⚙️ Message Operations: Message reactions, message editing, and deletion (for self or everyone).

📁 Media Support: Robust image and file upload system.

🟢 Presence Tracker: Real-time user statuses (Online, Away, DND, Invisible).

🔔 Notifications: Background & foreground push notifications using Firebase (FCM) along with an in-app notifications panel and unread badges.

👤 Profile Customization: User profile management and custom avatar uploading.

🎨 User Experience: Seamless skeleton loaders and intuitive toast notifications.

📂 Project Structure

src/
├── main.ts
├── environments/                 # Environment configurations (DEV / PROD APIs + Firebase)
└── app/
    ├── app.component.ts          # Root component + presence tracking ping
    ├── app.config.ts             # Global providers (HTTP client, Router, Interceptors)
    ├── app.routes.ts             # Application routes with lazy loading and guards
    ├── core/
    │   ├── guards/               # Route guards (authGuard, guestGuard)
    │   ├── interceptors/         # HTTP interceptors (jwt.interceptor, error.interceptor)
    │   ├── models/               # Shared TypeScript interfaces (User, Room, Message, etc.)
    │   └── services/             # Domain logic (auth, websocket, room, message, presence,
    │                             # media, notification, fcm, toast, chat-state)
    ├── features/
    │   ├── splash/               # Splash screen / Landing entry
    │   ├── auth/                 # Authentication features (login, register, oauth-callback)
    │   ├── chat/                 # Main workspace (chat-shell, chat-window, message-bubble,
    │   │                         # new-chat-modal, room-info)
    │   ├── profile/              # User profile settings
    │   └── notifications/        # Global notifications page / sidebar
    └── shared/
        ├── components/           # Reusable components (avatar, skeleton, toast-container)
        └── pipes/                # Custom formatting pipes (timeAgo, chatTime)


🔗 Backend Services

Service

Default Local URL

Main API

http://localhost:8080

OAuth2 Server

http://localhost:8081

WebSocket Host

http://localhost:8085/ws

🚀 Getting Started

Installation & Development

# Clone the repository
git clone <repo-url>
cd TalkifyX-Frontend

# Install dependencies
npm install

# Start the local development server
ng serve
# Access your application at http://localhost:4200


Production Build & Testing

# Build the application for production
ng build --configuration production

# Run unit tests via Jest
npm test

# Run tests and generate coverage report
npm run test:coverage


⚙️ Environment Configuration

Set up your local environment by editing src/environments/environment.ts:

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  wsUrl: 'http://localhost:8085/ws',
  oauthGoogleUrl: 'http://localhost:8081/oauth2/authorization/google',
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  }
};


🔄 Authentication Flow

[ User Action: Login / OAuth ] 
       │
       ▼
[ POST /api/auth/login ] ────────► [ JWT Saved to localStorage ]
                                                │
                                                ▼
                                    [ jwtInterceptor active ] 
                                    (Appends 'Bearer <token>' to all HTTP headers)
                                                │
                                                ▼
                              ┌─────────────────┴─────────────────┐
                              ▼                                   ▼
                   [ errorInterceptor ]                   [ Navigation Guards ]
               (Auto-logs out on 401 Unauthorized)    (authGuard protects /chat)
                                                      (guestGuard blocks /auth)


🔌 WebSocket Events

The application communicates in real-time through the following WebSocket frames over STOMP:

Event Identifier

Description

MESSAGE

Dispatched when a new chat message is sent or received

TYPING

Controls typing indicators in active chat windows

READ

Marks messages as read and updates read receipts

REACTION

Handles emoji reactions added or removed from messages

MSG_EDIT

Notifies recipients of an edited message body

MSG_DELETE

Triggers UI update to remove/mask deleted messages

PRESENCE

Broadcasts changes to a user's presence status (Online, DND, etc.)

NEW_ROOM

Alerts user when they are added to a new private or group chat

🧪 Testing Suite

Tests are situated inside the __tests__/ directory and execute natively using Jest:

Authentication Logic: auth.service.spec.ts & auth-components.spec.ts

State Management: chat-state.service.spec.ts

Real-Time Integration: websocket.service.spec.ts

Security & Pipeline: guards-interceptors.spec.ts

Domain Services: message.service.spec.ts & room.service.spec.ts

Components & UI: message-bubble.component.spec.ts & misc-services.spec.ts

Formatting Utilities: pipes.spec.ts

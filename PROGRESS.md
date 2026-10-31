# CollabDraw: Progress & Next Steps

_Last updated: 2026-10-31_

## 1. Overview

CollabDraw is a real-time collaborative whiteboard in the style of Excalidraw. Users sign up, create or join a room, and draw together. Updates are synced over WebSockets and saved in Postgres.

**Stack:** Turborepo + pnpm 9 · TypeScript · Express 5 (HTTP API) · `ws` (WebSocket server) · Prisma 7 + PostgreSQL (`@prisma/adapter-pg`) · Zod 4 · JWT · Next.js 16 / React 19 (frontend)

## 2. How to run

```bash
pnpm install

# packages/db/.env  (gitignored)
#   DATABASE_URL=postgresql://user:pass@localhost:5432/collabdraw
#   JWT_SECRET=something-secret

cd packages/db
npx prisma migrate dev     # apply migrations
npx prisma generate        # generates client into src/generated/prisma
cd ../..

pnpm dev                   # runs all apps via turbo
```

| Service | Port |
|---|---|
| web (Next.js) | 3000 |
| http-backend | 3002 |
| ws-backend | 8080 |

## 3. What's done

### Workspace map

| Package | Status |
|---|---|
| [apps/http-backend](apps/http-backend/src/index.ts) | ✅ Auth + room + chat-history REST API |
| [apps/ws-backend](apps/ws-backend/src/index.ts) | ✅ JWT-authenticated WebSocket server with rooms and chat broadcast, chats saved to DB |
| [packages/db](packages/db/prisma/schema.prisma) | ✅ Prisma schema + one migration (`20260328115832_init`), client exported as `@repo/db/client` |
| [packages/common](packages/common/src/types.ts) | ✅ Zod schemas: `CreateUserSchema`, `UserSigninSchema`, `RoomSchema` |
| [packages/backend-common](packages/backend-common/src/config.ts) | ✅ `JWT_SECRET` config |
| [apps/web](apps/web/app/page.tsx) | ❌ Still the default create-turbo boilerplate, no real UI yet |
| `packages/ui`, `eslint-config`, `typescript-config` | Template packages (+ custom `backend_config.json`) |

### HTTP API (`http-backend`, port 3002)

| Method | Route | Auth | What it does |
|---|---|---|---|
| POST | `/signup` | – | `{ email, password, name }` → creates user |
| POST | `/signin` | – | `{ email, password }` → `{ Message: <jwt> }` |
| POST | `/create-room` | JWT in `Authorization` header | `{ name }` → creates room (slug = name), returns room id |
| GET | `/chats/:roomId` | – | Last 1000 chat messages of a room (newest first) |
| GET | `/room/:slug` | – | Looks up a room by slug → `{ room }` |

### WebSocket protocol (`ws-backend`, port 8080)

Connect with `ws://localhost:8080?token=<jwt>`. Messages are JSON:

```jsonc
{ "type": "join_room",  "roomId": "1" }
{ "type": "leave_room", "roomId": "1" }
{ "type": "chat",       "roomId": "1", "message": "..." }
// server broadcasts to everyone in the room:
{ "type": "chat", "message": "...", "roomid": "1" }
```

Connected users are tracked in an in-memory `Users[]` array (`userId`, `rooms[]`, `ws`).

### Database schema

- **User**: `id` (uuid), `email` (unique), `password`, `name`, `photo?`
- **Room**: `id` (autoincrement), `slug` (unique), `createdAt`, `adminId → User`
- **Chat**: `id`, `roomId → Room`, `message`, `userId → User`

### Commit history

1. `48dbe93` Initial commit from create-turbo
2. `542d128` Removed docs app, added http/ws backends
3. `a3ea755` Added DB package (Prisma)
4. `2bb971b` Added http/ws server and wired up the db package

## 4. Uncommitted work (in the working tree right now)

- `http-backend`: added `GET /chats/:roomId` and `GET /room/:slug`
- `ws-backend`: full room logic (`join_room` / `leave_room` / `chat`), saves chats via Prisma, `@repo/db` dependency added
- `backend-common`: default `JWT_SECRET` fallback changed
- `pnpm-lock.yaml` updated

👉 **Commit this first** so you have a clean starting point.

## 5. Known bugs / tech debt

1. **Auth middleware hangs or crashes** ([middleware.ts](apps/http-backend/src/middleware.ts)). With no token it just `return`s without sending a response. A bad token makes `Jwt.verify` throw, and nothing catches it.
2. **Plain-text passwords** ([index.ts](apps/http-backend/src/index.ts)). Passwords are stored and compared as-is. Use `bcrypt` to hash on signup and compare on signin.
3. **`/signup` has no try/catch**, so a duplicate email crashes the request. It also `console.log`s `DATABASE_URL`, which should be removed.
4. **WS `roomId` type mismatch** ([ws index.ts](apps/ws-backend/src/index.ts)). The client sends a string but `Chat.roomId` is an `Int`, so `prisma.chat.create` will fail without `Number(roomId)`.
5. **WS robustness:**
   - `JSON.parse` isn't wrapped in try/catch, so bad input crashes the server
   - Users are never removed from `Users[]` on `ws.on("close")` (memory leak)
   - A user can send `chat` to a room they haven't joined
   - A missing token returns without closing the socket
6. **Env loading in ws-backend.** Nothing loads `packages/db/.env` (http-backend does it via `dotenv.config({ path: "../../packages/db/.env" })`), so `DATABASE_URL` may be undefined. The same applies to `JWT_SECRET`, so the two servers could end up with different secrets.
7. **Package config leftovers.** Both [http-backend/package.json](apps/http-backend/package.json) and [ws-backend/package.json](apps/ws-backend/package.json) have a stray `"exports": "./lib/prisma.ts"`. `tsconfig.tsbuildinfo` files are committed and should go in `.gitignore`.
8. **API consistency.** `/signin` returns `{ Message: token }` (capital M, better as `{ token }`). `/create-room` sends a bare id. A duplicate room returns status `411` (should be `409`). Invalid inputs return `200` (should be `400`).
9. **Schema nits.** `Chat` has no `createdAt`. `CreateUserSchema.name` requires `min(8)`, which is strict for a name. `email` is imported but unused in [types.ts](packages/common/src/types.ts).

## 6. Next tasks (in order)

- [ ] **Commit the current uncommitted work**
- [ ] **Fix the backend bugs** from section 5 (middleware, bcrypt, ws roomId/parse/close, env loading, status codes)
- [ ] **Frontend: auth pages.** `/signin` and `/signup` in `apps/web` call the http-backend and store the JWT (localStorage or a cookie)
- [ ] **Frontend: room page.** Create a room, or join one by slug (`GET /room/:slug` → roomId)
- [ ] **Frontend: canvas.** `/canvas/[roomId]` page with an HTML `<canvas>` and rectangle, circle and pencil tools
- [ ] **Real-time sync.** Open the WS connection, `join_room`, send each new shape as JSON in a `chat` message, and draw incoming shapes
- [ ] **Load existing drawing.** On join, fetch `/chats/:roomId`, parse the shapes and render them
- [ ] **Later / nice-to-have:**
  - Selection, move and eraser
  - Pan and zoom
  - More tools: line, arrow, text
  - WS reconnect handling and loading states
  - Rate limiting and input validation on WS messages (use Zod)
  - Deployment (Docker / hosting for the 3 services + Postgres)

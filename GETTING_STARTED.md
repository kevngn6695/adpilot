# Getting started

How to run AdPilot on your own computer. macOS steps come first; Windows notes are further down.

## 1. Install the tools (one time only)

You need **Node.js 20 or newer** and **PostgreSQL**.

```bash
# Check Node.js
node -v

# Install and start PostgreSQL (macOS, Homebrew)
brew install postgresql@16
brew services start postgresql@16
```

## 2. Install the packages

From the project folder:

```bash
cd adpilot
npm install
```

## 3. Create the database

```bash
createdb adpilot
```

## 4. Set up the server config

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set the `DATABASE_URL` line to:

```
DATABASE_URL=postgres://localhost:5432/adpilot
```

With Homebrew, Postgres uses your Mac username with no password, so the URL needs no user or password.

## 5. Create the tables and demo data

```bash
npm run db:seed
```

You should see `Seeded 4 demo campaigns`.

## 6. Start the app

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. Stop the app with `Ctrl + C`.

### Next time

```bash
cd adpilot
npm run dev
```

## Windows

- Install PostgreSQL from https://www.postgresql.org/download/windows/ and remember the password you set for the `postgres` user.
- Create the database instead of step 3:
  ```bash
  psql -U postgres -c "CREATE DATABASE adpilot;"
  ```
- In step 4, use `copy server\.env.example server\.env`, then set:
  ```
  DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/adpilot
  ```

## Optional: AI-written ad copy

Add your Anthropic API key to `server/.env`, then restart with `npm run dev`:

```
ANTHROPIC_API_KEY=your-key-here
```

Without a key, the app writes ad copy from built-in templates, so everything still works.

## Ports

| What | Address |
|---|---|
| Web app | http://localhost:5173 |
| API | http://localhost:5050 |

The API uses 5050 rather than 5000 because macOS uses port 5000 for AirPlay. To change it, set `PORT` in `server/.env` and update the two `/api` proxy lines in `client/vite.config.ts` to match.

## If something goes wrong

| Message | Fix |
|---|---|
| `Failed to start — is Postgres running and DATABASE_URL correct?` | Start Postgres with `brew services start postgresql@16`, then check `DATABASE_URL` in `server/.env`. |
| `database "adpilot" does not exist` | Run step 3 again. |
| `Invalid environment configuration` | The message names the setting that's wrong. Fix that line in `server/.env`. |
| `Port 5050 is already in use` | Another program is using it. Pick a new port as described under **Ports**. |
| The page loads but shows `Can't reach the server` | The API isn't running. Check the terminal running `npm run dev` for an error. |
| Want to start over with fresh demo data | Run `npm run db:reset`. This deletes all campaigns. |

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the API and web app with hot reload |
| `npm run db:seed` | Create tables, add demo campaigns if there are none |
| `npm run db:reset` | Delete everything and reload demo data |
| `npm run typecheck` | Check TypeScript in both the client and server |
| `npm test` | Run the tests |
| `npm run build` then `npm start` | Run the production version at http://localhost:5050 |

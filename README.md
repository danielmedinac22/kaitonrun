# KaitonRun

MVP de Training Log para correr + gym.

## Features (MVP)
- Vista de semana
- Historial
- Registrar entreno (Run/Gym/Rest): duración, RPE, notas

## Datos
- Se guardan en `data/workouts/YYYY-MM-DD.json`

## Dev
```bash
npm i
npm run dev
```

## Deploy
Pensado para Vercel (Next.js App Router).

> Nota: el endpoint `/api/log` en este MVP escribe a disco. En Vercel esto no es persistente.
> Próximo paso: escribir a GitHub (commit) usando GitHub API desde server actions / route handlers.

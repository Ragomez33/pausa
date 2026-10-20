# Pausa

Aplicación móvil local-first para gestión de hábitos y mindfulness (dejar/posponer el hábito
de fumar), con notificaciones locales y squads/teams.

- **Stack**: Expo SDK 54, React Native 0.81, Expo Router v6, TypeScript (strict)
- **UI**: NativeWind (Tailwind CSS) + React Native primitives
- **Persistencia**: SQLite local vía Drizzle ORM + `expo-sqlite` (local-first)
- **Notificaciones**: `expo-notifications` + `expo-task-manager`

## Requisitos

- Node.js LTS y `npm`
- Expo Go o un development build (iOS/Android)

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm start        # expo start
npm run ios      # expo start --ios
npm run android  # expo start --android
```

## Tipos y pruebas

```bash
npm run typecheck  # tsc --noEmit (0 errores)
npm test           # jest (jest-expo)
```

## Base de datos (Drizzle + SQLite)

El esquema vive en `src/db/schema.ts`. Para regenerar las migraciones tras cambiar el
esquema:

```bash
npm run db:generate   # drizzle-kit generate
```

Las migraciones generadas en `drizzle/` se versionan y se aplican al inicio de la app
(idempotentes) desde `app/_layout.tsx` vía `useDatabaseInitialized`.

## Cuenta y respaldo en la nube (opt-in)

La app funciona en **Modo Invitado** sin registro. El respaldo personal en Supabase se activa
desde `/account` después de vincular una cuenta con email/magic link y otorgar consentimiento.

- SQLite sigue siendo la fuente única de verdad para la UI.
- Las escrituras locales se encolan en `global_sync_outbox` y se suben en segundo plano.
- El respaldo está desactivado por defecto; los disparadores emocionales requieren un
  consentimiento separado.
- La restauración en un dispositivo nuevo se hace por páginas y nunca sobrescribe datos locales
  más nuevos.
- Migración remota: `supabase/migrations/0002_personal_data_sync.sql`.
- Variables públicas necesarias: `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- En el proyecto Supabase, habilita Email Auth y permite el redirect
  `pausa://auth/callback`.

## Estructura

```
app/        # Thin Router (Expo Router): solo importa y renderiza vistas de src/
src/modules # Módulos de feature (views/, hooks/, utils/, modals/, tests/)
src/shared  # Componentes, hooks, db, utils y tipos compartidos
```

## Gobernanza

- `constitution.md` — gobernanza arquitectónica y flujo SDD (EARS).
- `code-rules.md` — estándares de código TypeScript/UI.
- `specs/` — especificaciones por feature (SpecKit).

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

El esquema vive en `src/shared/db/schema.ts`. Para regenerar las migraciones tras cambiar el
esquema:

```bash
npm run db:generate   # drizzle-kit generate
```

Las migraciones generadas en `drizzle/` se versionan y se aplican al inicio de la app
(idempotentes) desde `app/_layout.tsx` vía `useDatabaseInitialized`.

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

# Pausa Project Constitution

- **Versión:** 1.1.0
- **Proyecto:** Pausa
- **Metodología:** Spec-Driven Development (SDD) con Sintaxis EARS
- **Sistemas Afectados:** Frontend Mobile (Expo v54, React Native 0.81, Expo Router v6)

---

## 1. Principios de Arquitectura y Estructura de Proyecto

### 1.1 Estructura de Directorios

El código fuente de la aplicación reside bajo la carpeta `src/`, exceptuando la capa de navegación que reside bajo `app/` según las convenciones de Expo Router:

```plaintext
├── app/                        # Capa de Enrutamiento (Expo Router - Thin Router)
│   ├── _layout.tsx             # Layout global de navegación (Providers, Theme)
│   ├── index.tsx               # Renderiza src/modules/dashboard/DashboardScreen
│   ├── pause/                  # Pantalla/Modal de interrupción de hábito
│   │   └── index.tsx           # /pause → PauseScreen
│   ├── onboarding/             # Flujo de bienvenida y configuración inicial
│   │   └── index.tsx           # /onboarding → OnboardingScreen
│   └── team/                   # Rutas de Squads y Rankings
│       ├── _layout.tsx
│       ├── index.tsx           # /team → TeamScreen
│       └── [id].tsx            # /team/:id → TeamDetailScreen
└── src/                        # Lógica de la aplicación, módulos y componentes
    ├── modules/
    │   ├── dashboard/          # Resumen diario, inventario y consumo
    │   ├── pause/              # Flujo "Tengo ganas de fumar", temporizador y conciencia
    │   ├── onboarding/         # Setup de perfil de fumador, intervalos y metas
    │   ├── supply/             # Gestión de paquetes comprados e inventario
    │   ├── team/               # Retos en equipo, rankings y sincronización agregada
    │   ├── analytics/          # Métricas de adicción, ahorro y consumo
    │   └── settings/           # Configuración de notificaciones, metas y perfiles
    └── shared/
        ├── components/         # Componentes atómicos reutilizables (CustomButton, etc.)
        ├── dialogs/            # Diálogos y Modales globales/reutilizables
        ├── hooks/              # Custom hooks compartidos (ej. useDatabase.ts)
        ├── utils/              # Lógica pura, helpers de fechas/tiempo y calculadoras
        │   └── utils.ts        # Archivo centralizado de utilidades globales
        ├── tests/              # Pruebas de utilidades y componentes compartidos
        │   └── unit/
        └── types/
            └── global.ts       # Definiciones de tipos globales compartidos
```

### 1.2 Reglas de Importación y Enrutamiento

- Las pantallas dentro de `src/modules/<modulo>/` se exportan para ser consumidas por la estructura de rutas físicas de `app/` (Expo Router).
- La lógica de negocio y presentación de cada módulo no debe filtrarse fuera de `src/modules/<modulo>/`, a menos que sea una función compartida que pertenezca a `src/shared/`.
- **Thin Router:** Los archivos bajo `app/` solo importan y renderizan vistas provenientes de `src/modules/<modulo>/views/` o las pantallas principales del módulo.

### 1.3 Jerarquía de Documentación y Prioridad

Desarrolladores y agentes de IA deben regirse por la siguiente jerarquía obligatoria de lectura en caso de conflicto:

1. **`constitution.md` (Máxima Autoridad Arquitectónica y Gobernanza):** Define la gobernanza del proyecto, estructura modular, arquitectura local-first, sintaxis EARS y flujo SDD.
2. **`code-rules.md` (Máxima Autoridad de Código y UI):** Rigidez sintáctica en TypeScript, NativeWind (Tailwind CSS), gestión de estado, patrones de mappers y estándares de notificación.
3. **`specs/<feature>/` (Especificación Local):** Aplica la lógica técnica y de experiencia de usuario a cada feature según SpecKit (`spec.md`, `plan.md`, `tasks.md`).

---

## 2. Estándares de Código y TypeScript

Para mantener la separación entre gobernanza arquitectónica y guías tácticas de desarrollo, los estándares de tipado, convenciones de nombramiento, reglas de UI y gestión de estado residen estrictamente en:

👉 **`code-rules.md`**

Todo código generado, refactorizado o auditado debe cumplir con las reglas definidas en dicho documento.

---

## 3. Estado Local, Persistencia y Privacidad

- **Persistencia Relacional Local-First:** La persistencia de datos en Pausa se gestiona de forma nativa mediante Drizzle ORM y `expo-sqlite`. Toda lectura/escritura de registros de consumo (logs de cigarrillos, eventos de posposición, compras de paquetes, metas activas) **MUST** realizarse a través de la capa Drizzle sobre SQLite; queda prohibido el uso de almacenamiento clave-valor (AsyncStorage) para entidades del dominio.
- **Aislamiento de Privacidad por Defecto:** La información emocional del usuario (razones por las que fuma: ansiedad, aburrimiento, tristeza, etc.) y las bitácoras individuales permanecen 100% locales por defecto. Su respaldo en la nube es estrictamente opt-in y requiere consentimiento explícito del usuario.
- **Respaldo Personal en la Nube (Opt-In):** El usuario autenticado puede activar un respaldo personal de perfil, eventos, inventario y logros. El respaldo está desactivado por defecto, se ejecuta de forma asíncrona y nunca bloquea la lectura/escritura local. SQLite sigue siendo la fuente única de verdad para la UI. Los eventos históricos son append-only e idempotentes por UUID; el perfil usa la estrategia "última edición local gana" mediante `updated_at`; el borrado remoto queda fuera del alcance del MVP.
- **Sincronización de Equipos (Teams):** Únicamente se sincronizarán con servicios de backend las métricas agregadas del equipo (cigarrillos pospuestos acumulados, nivel de meta activo, cumplimiento del día y racha de días).

---

## 4. Sintaxis de Especificaciones EARS (Easy Approach to Requirements Syntax)

Todos los archivos de especificación (`spec.md`) deben redactarse utilizando estrictamente los patrones de la sintaxis EARS:

- **Ubiquitous (Universal):**
  - Sintaxis: `The <system> shall <action>.`
- **Event-driven (Activado por Evento):**
  - Sintaxis: `WHEN <trigger>, the <system> shall <action>.`
- **State-driven (Estado del Sistema):**
  - Sintaxis: `WHILE <in state>, the <system> shall <action>.`
- **Unwanted Behavior (Manejo de Excepciones/Errores):**
  - Sintaxis: `IF <precondition/error>, THEN the <system> shall <action>.`
- **Optional Feature (Característica Opcional):**
  - Sintaxis: `WHERE <feature is included>, the <system> shall <action>.`

---

## 5. Flujo de Trabajo y Gobernanza SDD para el Agente (OpenCode)

### 5.1 Estructura de Archivos SDD (SpecKit)

Las especificaciones se organizarán en subcarpetas dentro de `specs/` nombradas según el feature correspondiente:

```plaintext
specs/
└── <feature>/
    ├── spec.md                  # Especificación (sintaxis EARS + User Scenarios + Requirements)
    ├── plan.md                  # Plan de implementación (Technical Context, Constitution Check)
    ├── tasks.md                 # Tareas atómicas organizadas por user story
    ├── research.md              # Investigación de Fase 0 (decisiones técnicas y alternativas)
    ├── data-model.md            # Esquema de tablas SQLite / Entidades (Fase 1)
    ├── quickstart.md            # Guía de validación end-to-end (Fase 1)
    └── checklists/
        └── requirements.md      # Checklist de calidad del spec
```

### 5.2 Secuencia Obligatoria de Ejecución

El Agente jamás creará o modificará código fuente sin haber completado rigurosamente los siguientes pasos ordenados secuencialmente:

1. **Revisión de Constitución (Requisito Inicial Prohibitivo):** El agente debe leer `constitution.md` y `code-rules.md` antes de proponer cualquier arquitectura o código.
2. **Aprobación explícita del Usuario:** El agente no generará ni creará archivos `.md` de especificación hasta recibir la orden explícita para la feature en cuestión.
3. **Creación del Spec (`spec.md`) con Clarification Gates:** El agente redactará la especificación en sintaxis EARS e incluirá obligatoriamente la sección de Clarification Gates con dudas técnicas o de producto. El agente debe detenerse y esperar a que el usuario responda antes de proceder.
4. **Creación del Plan (`plan.md`):** Tras la aprobación del `spec.md`, el agente elaborará el plan táctico de implementación y esperará confirmación.
5. **Creación de Tareas Atómicas (`tasks.md`):** Aprobado el plan, se generará el desglose de tareas atómicas.
6. **Ejecución de Código y Pruebas:** El agente implementará el código tarea por tarea, asegurando la creación de las pruebas unitarias correspondientes.

### 5.3 Control de Dependencias y Librerías de Terceros

- **Aviso Previo Obligatorio:** El agente no puede ejecutar comandos de instalación (`npx expo install`, `npm install`, etc.) de forma directa sin notificar al usuario, explicando la necesidad técnica y el beneficio del paquete.
- **Autonomía para Tipos Dev:** El agente tiene la autorización explícita para instalar paquetes de definiciones de tipos en desarrollo (ej. `@types/jest`) mediante `npm install -D` si detecta bloqueos de TypeScript en la suite de pruebas.

### 5.4 Seguimiento y Actualización de Tareas (`tasks.md`)

- **Marcado en Tiempo Real:** A medida que el agente ejecute y finalice cada tarea atómica en `tasks.md`, debe editar inmediatamente el archivo cambiando el estado del checkbox de `[ ]` a `[x]`.
- **Prohibición de Acumulaciones:** Queda prohibido acumular múltiples tareas ejecutadas sin actualizar el archivo `tasks.md`.

### 5.5 Reglas para Funciones Utilitarias (Utils)

- **Utilitarias Generales / Globales (`src/shared/utils/utils.ts`):** Funciones puras pequeñas y comunes (ej. formateo de tiempo, formateo de fechas, cálculo de ahorro básico) deben agruparse en `src/shared/utils/utils.ts`.
- **Utilitarias Específicas de Módulo (`src/modules/<modulo>/utils/`):** Si la función utilitaria pertenece únicamente a un módulo (ej. calculador de duración de inventario), debe residir en `src/modules/<modulo>/utils/utils.ts` o un helper dedicado del módulo.

### 5.6 Criterio de Finalización de Tarea (Definition of Done)

- **Verificación de Tipos Obligatoria:** El agente NO debe dar por completada ninguna tarea ni marcar `[x]` en `tasks.md` sin antes ejecutar en la terminal la verificación de tipos (`npx tsc --noEmit`).
- **Ejecución de Pruebas:** Si la tarea involucra pruebas unitarias, el agente debe ejecutar `npm test` y verificar que el output sea exitoso (0 errores, 0 tests fallidos).
- **Cero Suposiciones:** Si el chequeo de tipos o los tests arrojan algún error, el agente debe resolver el error PRIMERO antes de dar la tarea por concluida.

### 5.7 Reglas para la Organización de Pruebas (Tests)

- **Ubicación Módulos:** Pruebas de módulos en `src/modules/<modulo>/tests/`.
- **Ubicación Shared:** Pruebas compartidas en `src/shared/tests/`.
- **Categorización:** Divididos en `tests/unit/` e `tests/integration/`.
- **Nombres:** Conservar el sufijo `.test.ts` o `.test.tsx`.

### 5.8 Buenas Prácticas de Testing / Refactorización

Se prohíbe estrictamente la creación de archivos con sufijos de versión (ej. `_v2.ts`, `_v2.test.ts`). Las modificaciones deben realizarse refactorizando e integrándose directamente en el archivo original del componente o módulo.

### 5.9 Protocolo de Cierre de Fase / Hito (Git Checkpoint)

Al finalizar exitosamente todas las tareas de un módulo/fase (con tests en verde y `tsc` sin errores):

1. **Verificación de estado:** Ejecutar `git status` para listar los archivos modificados/creados.
2. **Propuesta de Commit:** Presentar al usuario el comando de commit sugerido siguiendo el formato:

   ```bash
   git commit -m "feat(pause): F1 - [descripción breve de lo realizado]"
   ```

3. **Confirmación obligatoria:** NUNCA ejecutar `git push` o `git commit` automáticamente. El agente debe solicitar explícitamente la confirmación del usuario antes de realizar el commit/push.

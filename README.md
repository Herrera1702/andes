# El Tesoro Perdido de los Andes

Videojuego educativo web inspirado en la cultura peruana. Explora ruinas andinas, evita guardianes y recolecta las 5 piezas del antiguo tesoro inca.

## Tecnologías

- HTML5 + CSS3
- TypeScript
- Canvas API
- LocalStorage

Sin librerías pesadas. Diseño responsive para desktop, tablet y móvil.

## Paleta de colores

| Color | Hex |
|-------|-----|
| Rojo Peruano | `#D91023` |
| Dorado Inca | `#D4AF37` |
| Marrón Piedra | `#6B4F3A` |
| Crema | `#F8F3E7` |
| Verde Andino | `#4C7A4A` |

## Estructura del proyecto

```
project/
├── index.html
├── styles/main.css
├── src/
│   ├── main.ts        — Punto de entrada
│   ├── game.ts        — Motor del juego y game loop
│   ├── player.ts      — Explorador jugable
│   ├── map.ts         — Mapa top-down con tiles
│   ├── treasure.ts    — Piezas del tesoro
│   ├── enemy.ts       — Guardianes patrulleros
│   ├── collision.ts   — Detección de colisiones
│   ├── score.ts       — Sistema de puntuación
│   ├── storage.ts     — Ranking en LocalStorage
│   └── ui.ts          — Pantallas e interfaz
├── assets/
│   ├── images/
│   └── sounds/
└── README.md
```

## Cómo ejecutar

```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Servir en navegador (puerto 3000)
npm run serve
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

Para desarrollo con recarga automática al compilar:

```bash
npm run watch
```

## Despliegue en Vercel

1. Sube el repositorio a GitHub, GitLab o Bitbucket.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio.
3. Vercel detecta `vercel.json` y usa:
   - **Build command:** `npm run build:vercel`
   - **Output directory:** `public`
4. Haz clic en **Deploy**.

También puedes desplegar desde la CLI:

```bash
npm i -g vercel
vercel
```

Para probar localmente el artefacto de producción antes de desplegar:

```bash
npm run preview
```

## Controles

| Plataforma | Controles |
|------------|-----------|
| Escritorio | `W A S D` o flechas del teclado |
| Móvil/Tablet | Joystick táctil virtual |
| General | `Escape` para pausar |

## Mecánicas

- **Objetivo:** Recolectar 5 piezas del tesoro esparcidas por el mapa.
- **Puntaje:** +100 por tesoro, +10 por segundo de exploración, −25 al chocar con un guardián.
- **Ranking:** Al completar el juego, guarda tu nombre y puntaje en LocalStorage.

## Licencia

Proyecto educativo de código abierto.

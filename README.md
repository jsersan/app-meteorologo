# MeteoEspaña 🌤️

Aplicación meteorológica Angular 20 con mapa real de España (IGN/AEMET),
predicción de 7 días por municipio y detalle horario.

## Características

- **Mapa real** de España con comunidades autónomas usando TopoJSON del IGN
  vía `es-atlas` + D3.js + proyección `geoConicConformalSpain`
- **AEMET Open Data** — datos meteorológicos oficiales en tiempo real
- **Angular 20** con Standalone Components, Signals y `ChangeDetectionStrategy.OnPush`
- Selector encadenado Comunidad Autónoma → Municipio
- Pronóstico de 7 días con gráfico de precipitación
- Detalle del día con franjas horarias (00-06h, 06-12h, 12-18h, 18-24h)
- Rango de temperatura y estadísticas completas
- Diseño responsive (mobile-first)

---

## Instalación

### 1. Requisitos

- Node.js 20+ (`node -v`)
- Angular CLI 20: `npm install -g @angular/cli@20`

### 2. Clonar e instalar

```bash
git clone <repo>
cd meteo-espana
npm install
```

### 3. Obtener API key de AEMET (gratis)

1. Ve a [https://opendata.aemet.es/centrodedescargas/altaUsuario](https://opendata.aemet.es/centrodedescargas/altaUsuario)
2. Regístrate con tu email
3. Recibirás la API key por correo

### 4. Configurar la API key

Edita `src/app/services/weather.service.ts` y sustituye:

```typescript
const AEMET_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.YOUR_API_KEY_HERE';
```

Por tu clave real. O mejor, usa variables de entorno de Angular:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  aemetApiKey: 'TU_API_KEY_AQUI'
};
```

Y en `weather.service.ts`:
```typescript
import { environment } from '../../environments/environment';
const AEMET_API_KEY = environment.aemetApiKey;
```

### 5. Arrancar en desarrollo

```bash
# Con proxy para evitar CORS de AEMET
ng serve --proxy-config proxy.conf.json
```

Abre [http://localhost:4200](http://localhost:4200)

---

## Producción

Para producción necesitas un **backend proxy** que reenvíe las peticiones
a AEMET, ya que la API de AEMET no admite peticiones directas desde el navegador
(CORS bloqueado). Opciones:

### Opción A — Express proxy simple

```bash
npm install express http-proxy-middleware
```

```javascript
// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(express.static('dist/meteo-espana/browser'));
app.use('/api/aemet', createProxyMiddleware({
  target: 'https://opendata.aemet.es/opendata/api',
  changeOrigin: true,
  pathRewrite: { '^/api/aemet': '' },
  headers: { 'api_key': process.env.AEMET_API_KEY }
}));
app.listen(3000);
```

### Opción B — Netlify / Vercel Functions

Crea una función serverless que actúe de proxy hacia AEMET.

### Nota sobre el corsproxy en desarrollo

El servicio usa `https://corsproxy.io/` como proxy público en desarrollo cuando
la API key no está configurada. **No usar en producción**.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── map/
│   │   │   └── spain-map.component.ts     # Mapa D3 + TopoJSON IGN
│   │   ├── selectors/
│   │   │   └── selectors.component.ts     # Combos CCAA + Municipio
│   │   ├── current-weather/
│   │   │   └── current-weather.component.ts
│   │   └── forecast/
│   │       ├── forecast.component.ts      # Rejilla 7 días
│   │       └── day-detail.component.ts    # Detalle horario
│   ├── services/
│   │   ├── weather.service.ts             # AEMET API + mock fallback
│   │   └── app-state.service.ts           # Estado global con Signals
│   ├── models/
│   │   ├── weather.models.ts              # Interfaces TypeScript
│   │   └── spain-data.ts                  # CCAA + municipios (INE codes)
│   ├── pipes/
│   │   └── weather.pipes.ts               # weatherIcon | weatherDesc | windDir
│   ├── app.component.ts
│   └── app.config.ts
├── styles.scss                            # Variables CSS globales
└── index.html
```

---

## Tecnologías

| Librería | Uso |
|---|---|
| Angular 20 | Framework principal |
| D3.js v7 | Renderizado del mapa SVG |
| es-atlas | TopoJSON oficial comunidades autónomas España (IGN) |
| d3-composite-projections | Proyección `geoConicConformalSpain` (Canarias incluidas) |
| topojson-client | Conversión TopoJSON → GeoJSON |
| AEMET Open Data API | Predicciones meteorológicas oficiales |

---

## Ampliar municipios

El archivo `src/app/models/spain-data.ts` contiene los municipios principales.
Para añadir más, simplemente agrega al array `municipios` de la comunidad correspondiente:

```typescript
{ id: '28106', name: 'Parla', lat: 40.238, lon: -3.776 },
```

El código INE de 5 dígitos es el que usa AEMET para su API de predicción.
Puedes buscar el código de cualquier municipio en:
[https://opendata.aemet.es/opendata/api/maestro/municipios](https://opendata.aemet.es/opendata/api/maestro/municipios)

---

## Licencia

MIT — datos meteorológicos © AEMET, datos cartográficos © IGN España (CC-BY 4.0)

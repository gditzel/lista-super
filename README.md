# Lista Super

App móvil (PWA) de lista de supermercado hecha con **Angular 19** + **Tailwind CSS 4**.

## Qué incluye

- Agregar ítems a mano (cantidad y precio opcional)
- Pegar una lista desde WhatsApp / texto
- Marcar lo que ya entró al carrito
- Total aproximado según precios cargados
- Guardado local en el teléfono (`localStorage`)
- Instalable como app (PWA / “Agregar a inicio”)

## Cómo correrla

```bash
npm install
npm start
```

Abrí `http://localhost:4200`.

## Instalar en el celular

1. Buildeá producción: `npm run build`
2. Serví la carpeta `dist/lista-super/browser` por HTTPS (o con un túnel tipo ngrok / Cloudflare Tunnel)
3. En Chrome/Safari: menú → **Instalar app** / **Agregar a pantalla de inicio**

En desarrollo el service worker está desactivado; la instalación full funciona con el build de producción.

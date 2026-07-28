# Contenido multimedia y streaming

Práctica sobre distribución de vídeo en la web: reproductor HTML5 con subtítulos en varios
idiomas.

**Tecnologías**: HTML5 `<video>` · WebVTT · CSS3

## Contenido

- `index.html` — reproductor y galería de vídeos.
- `videos/` — los vídeos y sus pistas de subtítulos (`.vtt`) en español, inglés y francés.
- `css/style.css` — estilos.

## Ejecutar

Sitio estático, pero conviene servirlo por HTTP para que el navegador cargue las pistas de
subtítulos:

```bash
python3 -m http.server 8080
```

> Práctica de 2020, conservada tal y como se entregó.

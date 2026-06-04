# BBCL en 5 Minutos - Alexa Flash Briefing Feed

Web Scraper desarrollado en Node.js utilizando **Playwright**. Su objetivo es extraer de forma automática las noticias del día de la sección **"BBCL en 5 minutos"** de Radio Bío-Bío, así como procesar la información y compilar un archivo JSON compatible con la API de **Alexa Flash Briefing (Resumen de Noticias)**.

---

## Características

* **Aislamiento de Estado SPA (Nuxt 3):** Interacción avanzada con el DOM para gatillar la hidratación asíncrona de datos de Nuxt sin desencadenar errores 404 del lado del servidor.
* **Control por Voz Nativo:** Compila las noticias en un arreglo de objetos independientes con identificadores dinámicos. Esto habilita la navegación nativa por voz de Alexa (*Siguiente/Anterior*).
* **IDs Dinámicos Basados en Contenido (Slugs):** Los campos `uid` se generan dinámicamente convirtiendo los titulares de las noticias en hashes/slugs limpios. Si la radio actualiza a una edición vespertina, Alexa detectará los nuevos identificadores de inmediato.
* **Rendimiento Optimizado:** Bloqueo activo de recursos pesados (imágenes, fuentes multimedia, trackers) durante el ciclo de Playwright para reducir los tiempos de ejecución en entornos CI/CD.

---

## Arquitectura del Feed

El script genera de manera un archivo llamado `feed.json` expuesto públicamente. La estructura del objeto cumple con las especificaciones estrictas de Amazon:

```json
[
  {
    "uid": "bbcl-titulo-de-la-noticia-limpio",
    "updateDate": "2026-06-03T23:47:12.717Z",
    "titleText": "Título de la Noticia",
    "mainText": "Cuerpo detallado con las preguntas y respuestas informativas sin duplicados...",
    "redirectionUrl": "[https://www.biobiochile.cl/bbcl-en-5-minutos/](https://www.biobiochile.cl/bbcl-en-5-minutos/)"
  }
]
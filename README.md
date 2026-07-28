# Máster en Dirección e Ingeniería de Sitios Web — UNIR

Repositorio de los trabajos realizados durante el máster. La pieza principal es el **Trabajo
Fin de Máster**; el resto son las prácticas de cada asignatura, conservadas tal y como se
entregaron.

---

## 🏆 CriptoVisor — Trabajo Fin de Máster

> **[`pfm/`](pfm/) — App móvil de seguimiento, análisis y predicción del mercado de criptomonedas**

Arquitectura de microservicios con dos APIs REST en Node.js/Express sobre MongoDB —una para
datos de mercado, cartera y noticias, otra dedicada al modelo de *machine learning*— y un
cliente híbrido Apache Cordova para Android. El modelo, una red neuronal en TensorFlow.js, se
reentrena de forma automática cada noche con el histórico de Bitcoin para estimar precios de
cierre.

`Node.js` · `Express` · `MongoDB` · `TensorFlow.js` · `JWT` · `Apache Cordova` · `Chart.js` · `Firebase`

👉 **[Documentación completa del proyecto](pfm/README.md)**

## Asignaturas

| Carpeta | Asignatura | Tecnologías |
|---|---|---|
| [`computacion_cliente_servidor/`](computacion_cliente_servidor/) | Computación cliente-servidor | PHP · MySQL · JavaScript |
| [`experiencia_de_usuario/`](experiencia_de_usuario/) | Experiencia de usuario | HTML · CSS |
| [`ingenieria_desarrollo_web/`](ingenieria_desarrollo_web/) | Ingeniería de desarrollo web | Node.js · Express · MongoDB |
| [`lenguaje_estandares_tecnologias_web/`](lenguaje_estandares_tecnologias_web/) | Lenguajes, estándares y tecnologías web | XML · DTD · XSD · HTML5 |
| [`modelos_negocios_web/`](modelos_negocios_web/) | Modelos de negocio en la web | PHP · MySQL · PayPal SDK |
| [`streaming/`](streaming/) | Contenido multimedia y streaming | HTML5 vídeo · WebVTT |

## Notas

- **Credenciales**: ningún fichero del repositorio contiene claves ni contraseñas. Los proyectos
  que las necesitan las leen del entorno; cada uno incluye su `.env.example` o instrucciones en
  su README.
- **Dependencias**: `node_modules/` y los artefactos generados por Cordova no se versionan. Cada
  proyecto se instala con `npm ci`.
- Las prácticas de asignatura son de 2020 y se conservan sin modernizar, por su valor como
  registro del trabajo del máster. El TFM sí ha sido actualizado; los cambios están detallados
  en [su README](pfm/README.md#seguridad).

## Licencia

[MIT](LICENSE) — Javier Naranjo

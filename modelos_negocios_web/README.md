# Modelos de negocio en la web

Tienda web sencilla con catálogo, carrito y pasarela de pago integrada con PayPal.

**Tecnologías**: PHP · MySQL · PayPal REST SDK

## Contenido

- `index.php`, `La-carta.php`, `VerCarta.php` — catálogo y carrito.
- `AccionCarta.php` — altas y bajas del carrito.
- `Pagos.php`, `Paypal.php`, `OrdenExito.php` — flujo de pago.
- `Configuracion.php` — conexión a la base de datos.
- `project/` — SDK de PayPal vendorizado, tal y como se entregó la práctica.

## Configuración

Las credenciales se leen del entorno; no hay ninguna en el código:

```bash
export DB_HOST=localhost DB_USER=root DB_PASSWORD=tu_password DB_NAME=carta
export PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=...
export TPV_CLAVE=...            # clave de firma del comercio (CECA)
export TPV_MERCHANT_ID=... TPV_ACQUIRER_BIN=... TPV_TERMINAL_ID=...
export APP_BASE_URL=http://localhost/modelos_negocios_web
```

Las credenciales de PayPal se obtienen en el [panel de desarrollador](https://developer.paypal.com/webapps/developer/applications/myapps);
las del TPV, del contrato con la entidad. `APP_BASE_URL` es la base pública del sitio, que la
pasarela usa para las URLs de retorno.

## Ejecutar

Necesita PHP y MySQL (XAMPP, MAMP o similar). Copia la carpeta en el directorio raíz del
servidor web y crea la base de datos `carta`.

> Práctica de 2020, conservada tal y como se entregó salvo por la externalización de las
> credenciales.

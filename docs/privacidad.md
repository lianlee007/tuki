# Privacidad y retención de datos

Este documento resume qué datos trata TukiTuki, para qué y cuánto tiempo se
conservan. Es una política técnica del laboratorio, no un concepto jurídico
firmado.

## Datos que se tratan

| Grupo | Datos | Finalidad |
|---|---|---|
| Cuenta | Nombre, apellido, correo, rol y avatar. | Autenticación y perfil. |
| Sesión | Hash del refresh token, IP y agente del navegador. | Seguridad y detección de abuso. |
| Pedido | Nombre, teléfono, dirección y notas. | Entregar el pedido al restaurante. |
| Reseña | Texto, calificación y nombre visible. | Reputación del restaurante. |
| Imagen | Fotos de platos y portadas. | Catálogo y presentación. |

## Retención propuesta

- Cuenta: mientras la cuenta esté activa. Si se elimina, se borran sus tokens
  y su perfil; los pedidos quedan como historial del restaurante sin el
  teléfono ni la dirección.
- Sesión: 30 días para el refresh token; las IP y el agente se conservan 90
  días para auditoría y luego se eliminan.
- Pedido: 24 meses, para historial y conciliación.
- Reseña: mientras el restaurante esté publicado; se puede eliminar por el
  autor o por moderación.
- Imagen: mientras el plato o la reseña existan. Si se elimina el plato, se
  elimina el objeto del bucket y el registro de `media_assets`.
- Respaldos: 7 días de retención, con un RPO propuesto de 24 horas.

## Derechos y eliminación

La API no expone todavía una ruta de “borrar mi cuenta”. El esquema permite
borrar la cuenta y sus tokens en cascada; la eliminación de pedidos, reseñas e
imágenes requiere una tarea administrativa. Hasta que exista la ruta, la
solicitud se atiende por el correo de contacto del proyecto.

## Seguridad

- Contraseñas con Argon2id; nunca se registran en texto plano.
- JWT firmado por `identidad-service`; cada servicio valida la firma y el rol.
- El modelo de lenguaje y el clasificador corren en la infraestructura del
  proyecto. Las preguntas y las fotos no se envían a una API de terceros.
- El bucket de medios es de lectura pública para las fotos del catálogo. No se
  deben subir documentos personales ni imágenes de menores.
- Los secretos viven fuera de Git. El repositorio solo incluye
  `secret.example.yaml` y `.env.example`.

## Riesgos de IA

- El chatbot puede equivocarse en un precio o un alérgeno. La interfaz muestra
  el precio desde el catálogo y cada respuesta cita fuentes; ante una alergia,
  se debe confirmar con el restaurante.
- El menú es texto que puede contener instrucciones maliciosas. El prompt de
  sistema trata el contexto como datos, pero no es una defensa completa.
- El clasificador de visión distingue comida de no comida; no valida calidad,
  porciones ni la identidad de las personas.
- El límite de tasa reduce el abuso, pero no hay cuota por usuario.

## Contacto

Para solicitudes de datos o seguridad, usar el correo de los mantenedores que
figura en el perfil del repositorio. No abrir un issue público con datos
personales.

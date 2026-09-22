# Errores detectados en el Excel original (`comparativa.xlsx`)

Documento para trasladar al propietario/mantenedor del Excel de referencia. Describe los defectos
encontrados en la hoja **Retribuciones** al construir el simulador web, celda por celda, qué hemos
corregido ya en la aplicación (que da los resultados reales, verificados), y qué queda pendiente de
revisar/corregir en el Excel original. Todas las referencias de celda están comprobadas directamente
sobre `comparativa_desbloqueada.xlsx`.

---

## 1. Cantabria — Cargo directivo (grupo A2) no enlazado para tipos B-F

**Dónde:** hoja `Nómina mensual`, fórmula de búsqueda del complemento de cargo directivo para
Cantabria, grupo profesional A2 (cuerpos 597-Maestros / 591-PTFP / 596-Maestros TAPD / 598-PESSFP).

**Qué pasa:** la fórmula de esa hoja restringe el rango de búsqueda (`MATCH`/`INDEX`) a una sola fila
(`Q197:Q197`, `R197:V197`) en vez de cubrir las seis filas de tipo de centro (A-F). Como resultado,
si en el simulador de nómina mensual del Excel se selecciona un tipo de centro distinto de "A" para
Cantabria + grupo A2 + cualquier cargo directivo, la fórmula devuelve un error (`#REF!`/`#N/A`).

**Importante:** este error **no afecta a los datos en sí**. La hoja `Retribuciones` (filas 195-202,
columnas Q-V; de donde sale el cálculo del sueldo bruto **anual**, el dato realmente validado) tiene
los importes completos y correctos para los seis tipos de centro:

| Tipo de centro | Dirección (€) |
|---|---|
| A | 946,47 |
| B | 858,75 |
| C | 620,01 |
| D | 458,52 |
| E | 279,67 |
| F | 120,73 |

(progresión normal decreciente por tamaño de centro; los importes de Jefatura de Estudios/Secretaría
para cada tipo también están completos en `Retribuciones!Q195:AA202`).

**Estado: ✅ corregido en la app.** Usa directamente los importes de la hoja `Retribuciones` (que son
correctos) en vez de replicar el error de la fórmula de `Nómina mensual`, ya que el error nunca
afectó al cálculo anual validado — solo a esa vista mensual concreta del Excel.

**Qué revisar en el Excel original:** ampliar el rango de la fórmula de `Nómina mensual` para
Cantabria + grupo A2 de `Q197:Q197` (una fila) a `Q197:Q202` (las seis filas de tipo de centro), igual
que ya está hecho correctamente para el grupo A1 de Cantabria y para el resto de comunidades.

---

## 2. Murcia — Cargo directivo A1/tipo E: no hay error, simplemente no hay complemento

**Corrección sobre una revisión anterior de este documento:** inicialmente diagnosticamos la celda
`Retribuciones!AA489` (que contiene el texto `"597-Maestros"`) como un dato corrupto. **El propio
usuario nos corrigió**: esa celda no pertenece a la tabla de cargo directivo — es la cabecera de la
tabla de **"Sexenios extra"**, que empieza pegada justo al lado (misma fila, columna siguiente) de la
tabla de cargo directivo. Al leer la tabla de cargo directivo por rango de celdas, se interpretó por
error el inicio de esa tabla vecina como si fuera un dato de Secretaría.

**Realidad:** para Murcia, grupo A1, tipo de centro E, **no hay ningún cargo directivo con importe**
(Dirección, Vicedirección, Jefatura de Estudios y Secretaría están todos en blanco/0 en esa fila) —
igual que ocurre en el tipo F, donde solo Secretaría tiene importe (240,24 €). No es un error del
Excel, es simplemente que ese grupo/tipo no tiene complemento de cargo directivo definido.

**Estado: ✅ corregido en la app.** Murcia + A1 + tipo E + cualquier cargo ahora calcula 0 € en vez de
mostrar "dato no disponible". Ya no hace falta ninguna acción sobre el Excel original para este punto.

---

## 3. Murcia — Productividad fija mensual sumada dos veces

**Dónde:** hoja `Retribuciones`, fila **511** ("SUELDO BRUTO ANUAL"), columnas F a N (una por cuerpo
docente). Cada columna tiene su propia "columna espejo" desplazada (F→AA, G→AB, H→AC, I→AD, J→AE,
K→AF, L→AG, M→AH, N→AI), fila 492 de esa columna espejo = "Productividad fija mensual".

**Qué pasa:** la fórmula de la fila 511 suma el importe de esa celda **dos veces**:
- Primera vez, cerca del principio: `...+((AA491+AA492)*2)+...`
- Segunda vez, al final de la fórmula: `...+(AA490*2)+(AA492*2)`

Ejemplo real, celda **F511** (columna 597-Maestros): contiene literalmente `(AA491+AA492)*2` cerca
del principio y `(AA492*2)` al final — `AA492` (Productividad fija mensual) aparece en ambos sitios.
`AA490` (Complemento de destino desplazado) solo aparece una vez, correctamente.

**Estado: ✅ corregido en la app.** El importe de Productividad fija mensual se suma solo una vez.

**Qué revisar en el Excel original:** quitar uno de los dos términos `+(AA492*2)` (o su equivalente
por columna, AB492/AC492/.../AI492) de la fórmula de la fila 511, para las 9 columnas F-N.

---

## 4. Condiciones "muertas" — comparaban contra la letra `"s"` en vez de `"SI"`/`"NO"`

**Dónde:** los selectores reales viven en `Retribuciones!C4` (Maestro de 1º y 2º de la ESO) y
`Retribuciones!C7` (Tutor), enlazados desde `'Nómina mensual'!C8` y `C11` respectivamente. El error
está en la fila **"SUELDO BRUTO ANUAL"** de cada comunidad afectada, columnas F a N, dentro de un
`IF($C$4="s",...)` / `IF($C$7="s",...)`. Como el valor real que produce el desplegable es `"SI"` o
`"NO"` (nunca la letra suelta `"s"`), esa condición **nunca era verdadera**, así que esos
complementos nunca se sumaban aunque el profesor marcara la casilla correspondiente.

| Comunidad | Fila (columnas F-N) | Condiciones muertas | Importe real afectado |
|---|---|---|---|
| Andalucía | 79 | C4 (Maestro ESO), C6 (Destino isla no capitalina), C7 (Tutor) | Maestro ESO: 137,03 €; Tutor: 31,97 €; C6: 0 € (sin efecto real) |
| Aragón | 115 | C4, C7 | Maestro ESO: 139,70 €; Tutor: 0 € (sin efecto real) |
| Baleares (Islas) | 187 | C7 | Tutor: 36,71 € |
| Cantabria | 223 | C4, C7 | Maestro ESO: 144,34 €; Tutor: 0 € (sin efecto real) |
| Castilla La Mancha | 259 | C4, C7 | Ambos en 0 € (sin efecto real) |
| Castilla y León | 295 | C4, C7 | Maestro ESO: 133,20 €; Tutor: 0 € (sin efecto real) |
| Cataluña | 331 | C4, C7 | Maestro ESO: 137,03 €; Tutor: hasta 93,60 € |
| Extremadura | 367 | C4, C7 | Maestro ESO: 137,03 €; Tutor: hasta 47,72 € |
| Galicia | 403 | Solo C4 (su Tutor ya funcionaba, C7 no está en su fórmula) | Maestro ESO: 118,25 € |
| La Rioja | 439 | C4 (Tutor no existe como concepto en esta comunidad) | Maestro ESO: 153,71 € |
| Madrid | 475 | C4, C7 | Maestro ESO: 133,97 €; Tutor: hasta 70,94 € |
| Valencia | 547 | C4, C7 | Maestro ESO: 137,03 €; Tutor: 0 € (sin efecto real) |
| País Vasco | 619 | C4, C7 | Maestro ESO: 0 € (sin efecto real); Tutor: 62,45 € |

Ejemplo real, celda **F79** (Andalucía):
`...+(IF($C$6="s",,F69*12))+(IF($C$4="s",F72,0))+(IF($C$7="s",F67*12,0))...`

**Estado: ✅ corregido en la app**, en las 13 comunidades de la tabla. Ahora esos complementos se
suman de verdad cuando el profesor marca "Maestro 1º/2º ESO" o "Tutor" en el selector.

**Qué revisar en el Excel original:** cambiar cada `="s"` por `="SI"` (o por una comparación
insensible a mayúsculas) en las fórmulas de la fila "SUELDO BRUTO ANUAL" de las 13 comunidades
listadas arriba.

---

## 5. Andalucía — sexenios: el tramo de 24-29 años se salta el 1er sexenio

**Dónde:** hoja `Retribuciones`, fila **80** ("Corresponde por sexenio"), columnas F-N.

**Qué pasa:** la fórmula de esa fila usa `SUM(F63:F66)` en la rama `$C$3/6>=4` (24-29 años de
antigüedad) — pero la fila 62 es el 1er sexenio, así que ese rango deja fuera el 1er sexenio y en
cambio incluye la fila 66 (5º sexenio). Eso es un error doble: hasta los 30 años no se puede cobrar
el 5º sexenio, así que el rango correcto para este tramo es `SUM(F62:F65)` (los 4 primeros), no
`SUM(F62:F66)` (los 5, que es lo que hace la rama de 30+ años) ni el `SUM(F63:F66)` original.

**Estado: ✅ corregido en la app.** El tramo de 24-29 años suma exactamente 4 sexenios (1º-4º), igual
que la fórmula estándar (`sexenioStandard()`) que usa la mayoría de comunidades — el 5º solo se
añade a partir de los 30 años. *(Corrección revisada 2026-09-19: una primera pasada había hecho que
este tramo pagara los 5 sexenios, igual que el de 30+ años — el propio usuario detectó que eso no
tiene sentido, ya que el 5º sexenio no puede cobrarse antes de los 30 años.)*

**Qué revisar en el Excel original:** cambiar `SUM(F63:F66)` por `SUM(F62:F65)` (y equivalente en
G80-N80) en la rama `$C$3/6>=4` de la fila 80.

---

## 6. Aragón — la columna 597-Maestros tenía su propia fórmula de sexenios, y las columnas G-N dejaban fuera el 1er sexenio

**Dónde:** hoja `Retribuciones`, fila **116** ("Corresponde por sexenio"), columnas F-N.

**Qué pasa:** en el tramo de 24-29 años de antigüedad (`$C$3/6>=4`):
- **F116** (597-Maestros): `SUM(F98:F101)` — esto es en realidad **correcto**: son los 4 primeros
  sexenios (1º-4º), exactamente lo que corresponde a ese tramo. No hacía falta tocarlo.
- **G116-N116** (resto de cuerpos): `SUM(G99:G102)` — deja fuera el **1º** sexenio pero incluye el
  **5º**, el mismo patrón erróneo que Andalucía (ver punto 5): hasta los 30 años no se puede cobrar
  el 5º sexenio.

**Estado: ✅ corregido en la app.** El tramo de 24-29 años suma exactamente 4 sexenios (1º-4º) en
todas las columnas, igual que la fórmula estándar. *(Corrección revisada 2026-09-19: una primera
pasada había igualado este tramo al de 30+ años en ambas variantes — la columna F ya estaba bien
antes de esa pasada, y quedó mal después; ahora las dos variantes coinciden en el resultado correcto:
4 sexenios.)*

**Qué revisar en el Excel original:** dejar `SUM(F98:F101)` como está en F116 (ya es correcto), y
cambiar `SUM(G99:G102)` por `SUM(G98:G101)` (y equivalente en H116-N116) en el resto de la fila.

*Nota aparte, sin efecto numérico:* para menos de 6 años de antigüedad, F116 devolvía directamente
`0` mientras el resto de la fila caía a la celda "Sin sexenio" (F97/G97/...); en Aragón esa celda
vale 0 en todos los casos, así que ahí no hacía falta cambiar nada — da igual.

---

## 7. Murcia — un complemento de la paga extraordinaria ("AA491") nunca se sumó, porque nunca se extrajo su tabla

**Dónde:** hoja `Retribuciones`, fila **511** ("SUELDO BRUTO ANUAL"), término `(AA491+AA492)*2`
mencionado también en el punto 3. `AA492` (Productividad fija mensual desplazada) sí tiene su tabla
de origen completa; `AA491` (Complemento General y Esp. Singular desplazado) **no tenía ninguna
tabla de origen localizable** en la copia de datos con la que se construyó el simulador — se
documentó en su momento como "en blanco/0 en el origen" y por eso nunca se sumó.

**Qué revela el documento oficial ANPE Murcia (enero 2026):** existe un concepto real, "Paga
adicional CP específico", que aparece en el bloque de Pagas Extras con importes de **260,96 €**
(Maestros, P.E. Sectores Singulares, Secundaria) y **298,98 €** (Catedráticos) — encaja exactamente
con el hueco de `AA491` que la fórmula original sí intentaba sumar.

**Estado: ⚠️ pendiente de confirmar.** No se ha aplicado todavía porque implica añadir un término
nuevo a la fórmula anual (no solo corregir un dato ya modelado), y hace falta decidir el valor para
Inspección (idx8, sin dato en este documento) antes de incorporarlo.

**Qué revisar en el Excel original:** localizar la tabla de origen de `AA491` (probablemente
desplazada junto a `AA490`/`AA492`, columnas AA-AI) y rellenarla con los importes reales en vez de
dejarla en blanco.

---

## Resumen del estado

| # | Problema | Estado |
|---|---|---|
| 1 | Cantabria, cargo directivo A2 no enlazado (tipos B-F) | ✅ Corregido en la app |
| 2 | Murcia, "dato corrupto" en AA489 | ✅ Era un malentendido nuestro — no hacía falta corregir nada, ya está bien |
| 3 | Murcia, productividad fija sumada dos veces | ✅ Corregido en la app |
| 4 | Condiciones muertas (Maestro ESO / Tutor) en 13 comunidades | ✅ Corregido en la app |
| 5 | Andalucía, sexenio 24-29 años sin 1er sexenio | ✅ Corregido en la app |
| 6 | Aragón, sexenio 24-29 años sin 1º (resto de cuerpos); 597-Maestros ya estaba bien | ✅ Corregido en la app |
| 7 | Murcia, complemento "AA491" (Paga adicional CP específico) nunca sumado, por falta de tabla de origen | ⚠️ Pendiente de confirmar valores y aplicar |

Todas las correcciones de los puntos 1-6 ya están aplicadas en el simulador web y verificadas contra
el motor de cálculo (`node validate.js`: 138/198 casos coinciden al céntimo con el Excel original;
los 60 restantes son las divergencias intencionadas de los puntos 1, 3, 4, 5 y 6 de este documento,
más los ajustes de datos reales de Cantabria/Navarra confirmados contra documentos oficiales). El
punto 7 queda abierto.

---

*Generado y actualizado a partir de la revisión directa de `comparativa_desbloqueada.xlsx`
(hoja `Retribuciones`).*

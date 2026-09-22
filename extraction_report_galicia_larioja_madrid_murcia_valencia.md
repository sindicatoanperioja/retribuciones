# Report: Retribuciones sheet — Galicia, La Rioja, Madrid, Murcia, Valencia

Column order fixed: F=597-Maestros, G=591-PTFP, H=596-Maestros TAPD, I=590-Secundaria, J=592-EOI, K=594-Música/Artes Escénicas, L=595-Artes Plásticas, M=511-Catedráticos, N=510-Inspección. Column C mirrors active value via `IF($C$11=...)` chain — display-only, ignore for JS engine. Selector cells: $C$3=años servicio, $C$4=Maestro 1º/2º ESO flag, $C$5=Nómina con paga extra flag, $C$7=Tutor flag, $C$1=selected cuerpo docente name.

## Verified row boundaries
- Galicia: header E375, data 376–402, total row 403
- La Rioja: header E411, data 412–438, total row 439
- Madrid: header E447, data 448–474, total row 475
- Murcia: header E483, data 484–510, total row 511
- Valencia: header E519, data 520–546, total row 547

## Common row layout (offset from header)
1 Grupo, 2 Nivel, 3 Sueldo Base, 4 Extra Sueldo Base, 5 Trienios, 6 Extra Trienio, 7 Complemento Destino, 8 Complemento Específico, 9 Complemento Específico Autonómico, 10 Sin sexenio, 11-15 1º-5º Sexenio, 16 Tutoría, 17 Cargo directivo, 18 Residencia Isla Capitalina, 19 Residencia Isla No Capitalina, 20 Trienios Residencia Isla No Capitalina, 21 Adicional maestros 1º/2º ESO, 22 Complemento mejora/Carrera profesional/renamed per community, 23 Productividad semestral/renamed, 24 Reducción 3%, 25 Otros, 26 MUFACE, 27 Clases Pasivas, 28 SUELDO BRUTO ANUAL.

---

## GALICIA (rows 375-403)

Raw F:N values:
| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino | 592.11 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 873.38 | 873.38 |
| Complemento Específico | 779.29 | 779.29 | 779.29 | 779.29 | 779.29 | 779.29 | 779.29 | 841.81 | 911.59 |
| Comp. Esp. Autonómico | 0 | 158.16 | 0 | 0 | 0 | 0 | 0 | 0 | 938.38 |
| Sin sexenio | 0 all |
| 1º Sexenio | 89.63 all |
| 2º Sexenio | 115.23 all |
| 3º Sexenio | 153.66 all |
| 4º Sexenio | 217.64 all |
| 5º Sexenio | 64 all |
| Tutoría | 66.04 (F-M), N blank/0 |
| Cargo directivo | dynamic, only I(Secundaria)=308.04 selected in sample, others 0 |
| Residencia rows | all 0 |
| Adicional maestros 1º/2º ESO | F=118.25, rest 0 |
| Complemento mejora | all 0 (unused in Galicia) |
| Productividad, Reducción 3% | all 0 (unused) |
| MUFACE | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |

SUELDO BRUTO ANUAL formula (verbatim, col F; row offsets: 378=SB,379=ESB,380=TRI,381=ETRI,382=CD,383=CE,384=CEA,385=SS,386-390=SX1-5,391=TUT,392=CARGO,396=ADIC,397=MEJORA,398=PROD):
```
=((+F378+F382+F383+F384)*12)+(F380*INT($C$3/3)*12)+((F379+F382)*2)+((F383+F384)*2)+(F392*14)+(F381*INT($C$3/3)*2)+(IF($C$4="s",F396,0))+(((IF(INT($C$3/3)<6,F385,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F386,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F386+F387,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F386+F387+F388,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F386+F387+F388+F389,0))+(IF(INT($C$3/6)>4,F386+F387+F388+F389+F390,0)))*12)+F391*12+(((IF(INT($C$3/3)<6,F385,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F386,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F386+F387,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F386+F387+F388,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F386+F387+F388+F389,0))+(IF(INT($C$3/6)>4,F386+F387+F388+F389+F390,0)))*2)+(F397*12)+(F398*2)
```
Note: Galicia's Tutoría has NO $C$7 gate (flat `F391*12`, unlike La Rioja/Madrid/Valencia/Murcia which gate it).

## LA RIOJA (rows 411-439)

Row 433 relabeled "Carrera profesional porreteada en 14 pagas", row 434 "Productividad pagas extras".

Raw F:N (selected distinct rows):
| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base | 1199.52 | = | = | 1387.24 | = | = | = | = | = |
| Extra Sueldo Base | 874.83 | = | = | 856.05 | = | = | = | = | = |
| Trienios | 43.54 | = | = | 53.39 | = | = | = | = | = |
| Extra Trienio | 31.74 | = | = | 32.96 | = | = | = | = | = |
| Complemento Destino | 592.11 | 729.14 | = | 729.14 | = | = | = | 873.38 | = |
| Complemento Específico | 815.42 | 808.54 | =G | 909.64 | =I | =I | =I | =L | 1587.19 |
| Comp. Esp. Autonómico | 0 (blank all) |
| Sin sexenio | 0 |
| 1º-5º Sexenio | 74.30 / 93.73 / 124.96 / 171.00 / 50.32 (chained same all cols) |
| Tutoría | 0 (blank, chained 0) |
| Cargo directivo | dynamic (0 in snapshot) |
| Adicional maestros 1º/2º ESO | F=153.71, rest 0 |
| MUFACE | -40.68×3, -51.68×6 |
| Clases Pasivas | -92.9×3, 118.04×6 |

Carrera profesional formula (row 433):
```
F433 (and G,H, copy of F) = IF($C$3>11,$O$434/14,IF($C$3>5,$O$433/14,0))
I433 (and J,K,L,M,N, copy of I) = IF($C$3>11,$AA$434/14,IF($C$3>5,$AA$433/14,0))
```
Two parallel helper tracks: F/G/H use $O$433=1127.32, $O$434=1352.90 (Maestros-track); I..N use $AA$433=1466.21, $AA$434=1127.32 (Secundaria-track). Threshold: años>11 -> grado II /14; años>5 -> grado I /14; else 0. (Note AA433 1466.21 > AA434 1127.32 — grado I pays MORE than grado II on this track, verbatim, not normalized.)

Helper cells: O433=1127.32 (Grado I, 5 años), O434=1352.90 (Grado II, 6 años en G1/11 años), AA433=1466.21, AA434=1127.32. Grados III/IV (rows 435-436) not yet populated ("HASTA 2029 NO PONER").

Productividad pagas extras formula (row 434):
```
F434 = IF(AND($C$3>10,$C$5="SI"),$O$434/14,IF(AND($C$3<4,$C$5="SI"),$O$433/14,0))
I434 = IF(AND($C$3>10,$C$5="SI"),$AA$434/14,IF(AND($C$3<4,$C$5="SI"),$AA$433/14,0))
```
Gated on $C$5="SI" AND (años>10 -> grado II/14, OR años<4 -> grado I/14 — different threshold than row433's >5, verbatim quirk, reproduce exactly).

SUELDO BRUTO ANUAL (row 439, col F, verbatim):
```
=((+F414+F418+F419+F420)*12)+(F416*INT($C$3/3)*12)+((F415+F418)*2)+((F419+F420)*2)+(F428*14)+(F417*INT($C$3/3)*2)+(IF($C$4="s",F432,0))+(((IF(INT($C$3/3)<6,F421,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F422,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F422+F423,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F422+F423+F424,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F422+F423+F424+F425,0))+(IF(INT($C$3/6)>4,F422+F423+F424+F425+F426,0)))*12)+(IF($C$7="s",F427*12,0))+(((IF(INT($C$3/3)<6,F421,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F422,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F422+F423,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F422+F423+F424,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F422+F423+F424+F425,0))+(IF(INT($C$3/6)>4,F422+F423+F424+F425+F426,0)))*2)+(F433*14)
```
Same skeleton as Galicia but: Tutoría gated `IF($C$7="s",...)`; no separate Productividad×2 term; ends with `+(F433*14)` (Carrera profesional/14 paid ×14, since already pre-divided by 14).

## MADRID (rows 447-475)

Contains a large "ratios" planning helper table (P-W, rows 447-461) feeding Cargo-directivo economics — NOT part of the SUELDO BRUTO ANUAL formula chain directly except via external reference to 'Nómina mensual'!$O$29.

Raw F:N values:
| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base | 1199.52 | = | = | 1387.24 | = | = | = | = | = |
| Extra Sueldo Base | 874.83 | = | = | 856.05 | = | = | = | = | = |
| Trienios | 43.54 | = | = | 53.39 | = | = | = | = | = |
| Extra Trienio | 31.74 | = | = | 32.96 | = | = | = | = | = |
| Complemento Destino | 592.11 | 729.14 | = | 729.14 | = | = | = | 873.38 | = |
| Complemento Específico | 781.84 | 798.41 | =F | =G | =I | =I | =I | 858.87 | 892.77 |
| Comp. Esp. Autonómico | 0,0,0,0,0,0,0,0,1238.73 (N only) |
| Sin sexenio | 0 |
| 1º-5º Sexenio | 93.28 / 117.70 / 156.82 / 214.64 / 63.20 (chained same all cols) |
| Tutoría | F=44.15 (chain G,H), I=70.94 (chain J,K,L,M). Note: "En junio y septiembre el importe de tutoría se duplica" — NOT modeled in the annual formula, manual note only. |
| Cargo directivo | dynamic, I=596.262 selected in sample |
| Adicional maestros 1º/2º ESO | F=133.97, rest 0 |
| Complemento mejora, Productividad | all 0 |
| MUFACE | -40.68×3, -51.68×6 |
| Clases Pasivas | -92.9×3, 118.04×6 |

SUELDO BRUTO ANUAL (row 475, col F, verbatim):
```
=((+F450+F454+F455+F456)*12)+(F452*INT($C$3/3)*12)+((F451+F454)*2)+((F455+F456)*2)+(F464*14)+(F453*INT($C$3/3)*2)+(IF($C$4="s",F468,0))+(((IF(INT($C$3/3)<6,F457,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F458,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F458+F459,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F458+F459+F460,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F458+F459+F460+F461,0))+(IF(INT($C$3/6)>4,F458+F459+F460+F461+F462,0)))*12)+(IF($C$7="s",F463*12,0))+(((IF(INT($C$3/3)<6,F457,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F458,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F458+F459,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F458+F459+F460,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F458+F459+F460+F461,0))+(IF(INT($C$3/6)>4,F458+F459+F460+F461+F462,0)))*2)+(F469*12)+(F470*2)
```
Identical skeleton to La Rioja except ending `+(F469*12)+(F470*2)` (Complemento mejora ×12, Productividad ×2). Adicional ESO gated `$C$4="s"`, Tutoría gated `$C$7="s"`.

## MURCIA (rows 483-511) — the complex one

Row renames: 491="Complemento General y Espec Singular" (replaces CE label), 492="Productividad fija mensual (lo cobran todos)" (replaces CEA label), 505="Carrera profesional (a partir 6 años antigüedad)" (replaces Complemento mejora), 506="Productividad semestral (Murcia) CE+CD+CP específico".

Raw F:N (486-510):
| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base | 1199.52 | = | = | 1387.24 | = | = | = | = | = |
| Extra Sueldo Base | 874.83 | = | = | 856.05 | = | = | = | = | = |
| Trienios | 43.54 | = | = | 53.39 | = | = | = | = | = |
| Extra Trienio | 31.74 | = | = | 32.96 | = | = | = | = | = |
| Complemento Destino | 592.11 | 729.14 | =G | =G | =G | =G | =G | 873.38 | =N454 (873.38) |
| Compl.General+EspSingular | 433.42 | =F | = | = | = | = | = | 492.81 | 463.70 |
| Productividad fija mensual | 437.91 | 444.36 | =G | =G | =G | =G | =G | 447.68 | =M492+O492 = 1577.58 |
| Sin sexenio | 0 (row493 mirror has a quirk referencing M493/O492, but F:N raw values all 0) |
| 1º-5º Sexenio | 70.45 / 88.89 / 118.44 / 162.07 / 47.38 (all chained) |
| Tutoría | 0 (blank/chained 0) |
| Cargo directivo | dynamic (0 in snapshot) |
| Adicional maestros 1º/2º ESO | F=139.1, rest 0 |
| Carrera profesional (row505) | F=90.26 (chain G,H), I=160.6 (chain J,K,L,M,N) |
| Productividad semestral CE+CD+CP (row506) | F=1025.27, G=1080.9 (chain H,I,J,K,L), M=1240.11, N=`=IF($C$5="SI",AI490+AI492,0)` -> 0 unless C5="SI" |
| MUFACE | -40.68×3, -51.68×6 |
| Clases Pasivas | -92.9×3, 118.04×6 |

### Murcia's non-adjacent "SEXENIOS EXTRA" helper table

Located at columns AA-AI, rows 489-498 (Z494="SEXENIOS EXTRA", header row AA489:AI489 repeats the 9 cuerpo names: AA=597, AB=591, AC=596, AD=590, AE=592, AF=594, AG=595, AH=511, AI=510).

| Sexenio | AA(597) | AB(591) | AC | AD(590) | AE | AF | AG | AH(511) | AI(510) |
|---|---|---|---|---|---|---|---|---|---|
| 1º (494) | 44.97 | =AA (chained across all) |
| 2º (495) | 56.94 | " |
| 3º (496) | 75.73 | " |
| 4º (497) | 103.68 | " |
| 5º (498) | 30.57 | " |

These are the reduced "extra-pay" sexenio values, used ONLY in the ×2 extra-pay portion, NOT in the ×12 portion (which uses regular F493:F498-style rows).

Second helper block rows 490/492, cols AA-AI:
- Row 490 (Destino context for extra pay): AA490=240.24, AB490=295.87 (chain AC-AG), AH490=354.36 (chain AI). AJ490 label "PRODUCTIVIDAD SEMESTRAL".
- Row 492: AA492=524.07 (chain AB-AG), AH492=586.77, AI492=`=+AH492+O492` = 586.77+1129.90 = 1716.67.

These represent the per-cuerpo "Complemento Específico"/"Productividad" values used specifically inside the extra-pay (×2) computation, paralleling F490/F492 but with different (generally lower, except Inspección) values.

Murcia SUELDO BRUTO ANUAL (row 511, col F, verbatim):
```
=((+F486+F490+F491+F492)*12)+(F488*INT($C$3/3)*12)+((F487+F490)*2)+(F500*14)+((AA491+AA492)*2)+(F489*INT($C$3/3)*2)+(IF($C$4="si",F504,0))+(((IF(INT($C$3/3)<6,F493,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F494,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F494+F495,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F494+F495+F496,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F494+F495+F496+F497,0))+(IF(INT($C$3/6)>4,F494+F495+F496+F497+F498,0)))*12)+(IF($C$7="si",F499*12,0))+(((IF(INT($C$3/3)<6,F493,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),AA494,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),AA494+AA495,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),AA494+AA495+AA496,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),AA494+AA495+AA496+AA497,0))+(IF(INT($C$3/6)>4,AA494+AA495+AA496+AA497+AA498,0)))*2)+(F505*12)+(AA490*2)+(AA492*2)
```
Column pattern: helper-table column offset is always +21 columns relative to F:N (F->AA, G->AB, ..., N->AI) — fixed shift, NOT same-letter mapping. So G511 uses AB491/AB492/AB490/AB494:498, H511 uses AC-columns, I511 uses AD-columns, etc.

Key differences vs Galicia/La Rioja/Madrid/Valencia:
- No separate CEA term in the ×12 base — row 492 slot repurposed as "Productividad fija mensual (lo cobran todos)" folded into base×12.
- Extra-pay (×2) portion for Específico/Productividad uses SHIFTED helper columns `(AA491+AA492)*2` instead of `(F491+F492)*2` — genuinely different (lower) values than monthly.
- Cargo directivo ×14 uses F500 directly (not shifted).
- Sexenio ×12 staircase uses normal F493:F498; Sexenio ×2 (extra-pay) staircase uses SHIFTED AA494:AA498 helper values.
- `$C$4="si"` and `$C$7="si"` — Murcia uses LOWERCASE "si" (unlike Galicia/Madrid/Valencia's "s"). Real per-community distinction, preserve exactly.
- Ends with `+(F505*12)+(AA490*2)+(AA492*2)` — Carrera profesional ×12, plus TWO extra-pay-only additions of shifted Destino (AA490) and Productividad-fija (AA492), each ×2.

Row 506 "N506: =IF($C$5="SI",AI490+AI492,0)" gated on uppercase "SI" (different case than C4/C7's lowercase "si") — sums shifted Destino+Productividad for Inspección. Row 506 itself is NOT referenced anywhere in the SUELDO BRUTO ANUAL formula (511) — the formula uses AA490/AA492 directly, so row 506 is display-only ("what would show on payslip"), not wired into the annual calc. Preserve this decoupling — don't wire row 506 into the annual total.

## VALENCIA (rows 519-547)

Raw F:N values:
| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base | 1199.52 | = | = | 1387.24 | = | = | = | = | = |
| Extra Sueldo Base | 874.83 | =F | =F | 856.05 | =I | = | = | = | = |
| Trienios | 43.54 | = | = | 53.39 | = | = | = | = | = |
| Extra Trienio | 31.74 | =F | =F | 32.96 | =I | = | = | = | = |
| Complemento Destino | 592.11 | 729.14 | = | = | = | = | = | 873.38 | = |
| Complemento Específico | 726.47 | 728.07 | =G | 731.00 | =I | =I | =I | 795.25 | 1586.50 |
| Comp. Esp. Autonómico | 0 (all blank) |
| Sin sexenio | 0 |
| 1º-5º Sexenio | 126.47 / 133.97 / 153.24 / 166.80 / 96.97 (chained same all cols) |
| Tutoría | 0 (blank/chained 0) |
| Cargo directivo | dynamic, I=483.99 selected in sample |
| Adicional maestros 1º/2º ESO (row540) | F=`=G526-F526` = 729.14-592.11 = 137.03 (computed differential, not flat lookup); rest 0 |
| Complemento mejora, Productividad | all 0 |
| MUFACE | -40.68×3, -51.68×6 |
| Clases Pasivas | -92.9×3, 118.04×6 |

SUELDO BRUTO ANUAL (row 547, col F, verbatim):
```
=((+F522+F526+F527+F528)*12)+(F524*INT($C$3/3)*12)+((F523+F526)*2)+((F527+F528)*2)+(F536*14)+(F525*INT($C$3/3)*2)+(IF($C$4="s",F540,0))+(((IF(INT($C$3/3)<6,F529,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F530,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F530+F531,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F530+F531+F532,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F530+F531+F532+F533,0))+(IF(INT($C$3/6)>4,F530+F531+F532+F533+F534,0)))*12)+(IF($C$7="s",F535*12,0))+(((IF(INT($C$3/3)<6,F529,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F530,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F530+F531,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F530+F531+F532,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F530+F531+F532+F533,0))+(IF(INT($C$3/6)>4,F530+F531+F532+F533+F534,0)))*2)+(F541*12)+(F542*2)
```
Identical structure to Madrid (lowercase "s" gates, ends with Complemento mejora×12 + Productividad×2, no non-adjacent helper table — "plain").

---

## Cross-community summary of quirks

1. Flag case sensitivity differs by community: Galicia/Madrid/Valencia/La Rioja compare against lowercase "s"; Murcia uses lowercase "si" for C4/C7 but uppercase "SI" for C5. Be exact per-community, not global.
2. Tutoría gating: Galicia has NO $C$7 gate (flat); La Rioja/Madrid/Valencia/Murcia all gate Tutoría behind IF($C$7=...,value*12,0).
3. Final terms vary: Galicia/Madrid/Valencia end with `+MEJORA*12 +PROD*2`; La Rioja ends with single `+CARRERA/14term*14`; Murcia ends with `+CARRERA*12 +shiftedDestino*2 +shiftedProd*2` (three terms, using AA-AI shifted table).
4. Murcia's helper table offset exactly +21 columns (F<->AA...N<->AI), supplies DIFFERENT sexenio/Destino/Productividad values used exclusively for ×2 extra-pay, while ×12 uses plain F:N.
5. La Rioja's two threshold formulas use independent per-cuerpo tracks (Maestros: O433/O434; Secundaria: AA433/AA434); row433 thresholds años>11/>5; row434 (gated also on C5="SI") thresholds años>10/<4 — verbatim, not symmetric.
6. Double `+` ("++") typo appears in every community's SUELDO BRUTO ANUAL formula before the second sexenio block — functionally a no-op, safely normalize to single `+`.
7. Valencia's Adicional-maestros-1º/2ºESO is itself a formula (`=G526-F526`, Destino-tier differential), not a flat number, unlike others.

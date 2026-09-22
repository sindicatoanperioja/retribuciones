# PART A — Retribuciones sheet: Ceuta y Melilla, País Vasco, Navarra

Column layout (all 3 blocks): F=597-Maestros, G=591-PTFP, H=596-Maestros TAPD, I=590-Secundaria, J=592-EOI, K=594-Música/Artes Escénicas, L=595-Artes Plásticas, M=511-Catedráticos, N=510-Inspección. Column C = live selector output via standard 8-way nested IF pattern (display mirror only, not used in SUELDO BRUTO ANUAL formulas).

## 1. CEUTA Y MELILLA (rows 554–583)

Header: C554=+E555 -> "Ceuta y Melilla"; C555=+$C$11 (selected cuerpo).

Raw values (F,G,H,I,J,K,L,M,N):
| Concept | 597 | 591 | 596 | 590 | 592 | 594 | 595 | 511 | 510 |
|---|---|---|---|---|---|---|---|---|---|
| Grupo (556) | A2 | A2 | A2 | A1 | A1 | A1 | A1 | A1 | A1 |
| Nivel (557) | 21 | 24 | 24 | 24 | 24 | 24 | 24 | 26 | 26 |
| Sueldo Base (558) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (559) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (560) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (561) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (562) | 592.11 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 873.38 | 873.38 |
| Complemento Específico (563) | 438.33 | 436.57 | 436.57 | 433.91 | 433.91 | 433.91 | 433.91 | 440.72 | 1052.42 (=SUM(O563:AA563)) |
| Complemento Esp. Autonómico (564) | 0 all |
| Sin sexenio (565) | 0 (I-N) |
| 1º Sexenio (566) | 69.49 all |
| 2º Sexenio (567) | 87.67 all |
| 3º Sexenio (568) | 116.79 all |
| 4º Sexenio (569) | 159.78 all |
| 5º Sexenio (570) | 47.08 all |
| Tutoría (571) | 50.09,50.09,50.09,63.23,63.23,63.23,63.23,63.23,63.23 |
| Cargo directivo (572) | dynamic, references 'Nómina mensual'!$R$29 |
| Residencia Isla Capitalina (573, LABELED "Trienios Residencia") | 50.91,50.91,50.91,66.76,66.76,66.76,66.76,66.76,66.76 |
| Residencia Isla No Capitalina (574, LABELED "Residencia") | 820.76,820.76,820.76,1102.57,1102.57,1102.57,1102.57,1102.57,1102.57 |
| Trienios Residencia Isla No Capitalina (575) | 0 (no values) |
| Adicional maestros 1º/2º ESO (576) | 134.43 (F only) |
| Complemento mejora (577) | 0 |
| Productividad (578) | 0 |
| Reducción 3%, Otros (579-580) | 0 |
| MUFACE (581) | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas (582) | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |
| SUELDO BRUTO ANUAL (583) | 43858.66 | 45752.44 | 45752.44 | 52344.14 | 52344.14 | 52344.14 | 52344.14 | 54458.84 | 63022.64 |

Exact SUELDO BRUTO ANUAL formula (col F; substitute column letter for other cols):
```
=((+F558+F562+F563+F574)*12)
+(F560*INT($C$3/3)*12)
+((F559+F562)*2)
+((F563+F574)*2)
+(F572*14)
+(F561*INT($C$3/3)*2)
+(F573*INT($C$3/3)*12)
+(IF($C$4="si",F576*12,0))
+(((IF(INT($C$3/3)<6,F565,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F566,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F566+F567,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F566+F567+F568,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F566+F567+F568+F569,0))+(IF(INT($C$3/6)>4,F566+F567+F568+F569+F570,0)))*12)
+(IF($C$7="si",F571*12,0))
+(((IF(INT($C$3/3)<6,F565,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F566,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F566+F567,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F566+F567+F568,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F566+F567+F568+F569,0))+(IF(INT($C$3/6)>4,F566+F567+F568+F569+F570,0)))*2)
+(F577*12)+(F578*2)
```
Explanation (Ceuta y Melilla quirk — RESIDENCIA folded directly into base×12, plus its own trienio-residencia accrual):
- `(SueldoBase+Destino+Específico+Residencia)*12` — residencia IS folded into the base×12, unlike most communities.
- `+Trienios*floor(años/3)*12`
- `+(ExtraSueldoBase+Destino)*2`
- `+(Específico+Residencia)*2` — residencia doubled again for extra pagas
- `+CargoDirectivo*14`
- `+ExtraTrienio*floor(años/3)*2`
- `+TrieniosResidencia*floor(años/3)*12` — own distinct trienio-residencia accrual (labeled "Residencia Isla Capitalina" in the template but functionally the trienio-residencia line)
- `+(esMaestro1o2oESO? adicionalESO*12 : 0)` — annualized here, gated on lowercase "si"
- sexenio stepped block (same pattern as other communities) paid at 12 + 2 separately (not ×14 combined)
- `+(esTutor? tutoria*12 : 0)` gated on lowercase "si"
- `+complementoMejora*12 + productividad*2`

MUFACE/Clases Pasivas NOT included in this formula (applied later in Nómina mensual as deductions).

## 2. PAÍS VASCO (rows 590–619)

Header: C590=+E591 -> "País Vasco". O591="SIN ACTUALIZAR" (not-yet-updated flag).

| Concept | 597 | 591 | 596 | 590 | 592 | 594 | 595 | 511 | 510 |
|---|---|---|---|---|---|---|---|---|---|
| Grupo | A2 | A2 | A2 | A1 | A1 | A1 | A1 | A1 | A1 |
| Nivel | 21 | 24 | 24 | 24 | 24 | 24 | 24 | 26 | 26 |
| Sueldo Base (594) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (595) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (596) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (597) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (598) | 651.2 | 817.32 | 817.32 | 817.32 | 817.32 | 817.32 | 817.32 | 883.37 | 883.37 |
| Complemento Específico (599) | 948.22 | 1034.64 | 1034.64 | 1034.64 | 1034.64 | 1034.64 | 1034.64 | 1125.11 | 1727.63 |
| Compl. Esp. Autonómico (600) | 0 all |
| Sin sexenio (601) | 0 all |
| 1º Sexenio (602) | 89.91 all |
| 2º Sexenio (603) | 0 all |
| 3º Sexenio (604) | 0 all |
| 4º Sexenio (605) | 53.63 all |
| 5º Sexenio (606) | 44.44 all |
| Tutoría (607) | 62.45 all |
| Cargo directivo (608) | dynamic, 'Nómina mensual'!$S$29 |
| Residencia rows (609-611) | 0 all (no islands) |
| Adicional maestros 1º/2º ESO (612) | 0 (no values in F-N, blank) |
| Complemento mejora, Productividad, Reducción 3%, Otros (613-616) | 0 all |
| MUFACE (617) | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas (618) | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |
| SUELDO BRUTO ANUAL (619) | 39121.74 | 42657.30 | 42657.30 | 44993.02 | 44993.02 | 44993.02 | 44993.02 | 47184.30 | 55619.58 |

Exact SUELDO BRUTO ANUAL formula (col F) — standard generic pattern, no residencia terms:
```
=((+F594+F598+F599+F600)*12)+(F596*INT($C$3/3)*12)+((F595+F598)*2)+((F599+F600)*2)+(F608*14)+(F597*INT($C$3/3)*2)+(IF($C$4="s",F612,0))+(((IF(INT($C$3/3)<6,F601,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F602,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F602+F603,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F602+F603+F604,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F602+F603+F604+F605,0))+(IF(INT($C$3/6)>4,F602+F603+F604+F605+F606,0)))*12)+(IF($C$7="s",F607*12,0))+(((IF(INT($C$3/3)<6,F601,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F602,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F602+F603,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F602+F603+F604,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F602+F603+F604+F605,0))+(IF(INT($C$3/6)>4,F602+F603+F604+F605+F606,0)))*2)+(F613*12)+(F614*2)
```
Note: País Vasco compares against `"s"` (single-letter lowercase), NOT "si" like Ceuta y Melilla — real per-community inconsistency, preserve exactly (use case-insensitive AND letter-insensitive matching against the community's OWN configured comparison string, since some check "s" and some check "si").

## 3. NAVARRA (rows 626–655) — COMPLETELY DIFFERENT MODEL

Header: C626=+E627 -> "Navarra". O627 = date 2026-02-01 (update marker). NO Complemento Destino (row 634=0 for all cols). Uses grade/quinquenio bands instead of trienios/sexenios.

| Concept | 597 | 591 | 596 | 590 | 592 | 594 | 595 | 511 | 510 |
|---|---|---|---|---|---|---|---|---|---|
| Grupo | A2 | A2 | A2 | A1 | A1 | A1 | A1 | A1 | A1 |
| Nivel | 21 | 24 | 24 | 24 | 24 | 24 | 24 | 26 | 26 |
| Sueldo Base (630) | 1900.21 | 1900.21 | 1900.21 | 2258.75 | 2258.75 | 2258.75 | 2258.75 | 2258.75 | 2258.75 |
| Extra Sueldo Base (631=+630) | 1900.21 | 1900.21 | 1900.21 | 2258.75 | 2258.75 | 2258.75 | 2258.75 | 2258.75 | 2258.75 |
| Trienios (632) | 0 (blank — NOT used, Navarra uses grade bands) |
| Extra Trienio (633) | 0 (blank) |
| Complemento Destino (634) | 0 for ALL columns |
| Complemento Específico (635) | 723.41 | 858.32 | 858.32 | 756.23 | 756.23 | 756.23 | 756.23 | 891.75 | 1087.51 |
| Compl. Esp. Autonómico (636) | 0 (only N636=353.53 stray, not wired into F-N chain) |
| Cargo directivo (637) | dynamic, 'Nómina mensual'!$T$29 |
| 5 años (638) | 24.15 (all F-N, pulled from AB638/AC638) |
| 6 años y 7 meses (639) | 195.17 | 195.17 | 195.17 | 227.44 | 227.44 | 227.44 | 227.44 | 227.44 | 227.44 |
| 10 años (640) | 219.32 | 219.32 | 408.45(H640 anomaly) | 251.59 | 251.59 | 251.59 | 251.59 | 251.59 | 251.59 |
| 13 años y 2 meses (641) | 390.34 | 390.34 | 390.34 | 454.88 | 454.88 | 454.88 | 454.88 | 454.88 | 454.88 |
| 15 años (642) | 408.45 | 408.45 | 408.45 | 472.99 | 472.99 | 472.99 | 472.99 | 472.99 | 472.99 |
| 19 años y 9 meses (643) | 579.47 | 579.47 | 579.47 | 676.28 | 676.28 | 676.28 | 676.28 | 676.28 | 676.28 |
| 20 años (644) | 597.59 | 597.59 | 597.59 | 694.39 | 694.39 | 694.39 | 694.39 | 694.39 | 694.39 |
| 25 años (645) | 609.66 | 609.66 | 609.66 | 706.47 | 706.47 | 706.47 | 706.47 | 706.47 | 706.47 |
| 26 años y 4 meses (646) | 780.68 | 780.68 | 780.68 | 909.75 | 909.75 | 909.75 | 909.75 | 909.75 | 909.75 |
| 30 años (647) | 792.76 | 792.76 | 792.76 | 921.83 | 921.83 | 921.83 | 921.83 | 921.83 | 921.83 |
| 32 años y 11 meses (648) | 963.77 | 963.77 | 963.77 | 1125.12 | 1125.12 | 1125.12 | 1125.12 | 1125.12 | 1125.12 |
| 35 años (649) | 987.93 | 987.93 | 987.93 | 1149.27 | 1149.27 | 1149.27 | 1149.27 | 1149.27 | 1149.27 |
| 40 años (650=+649) | 987.93 | 987.93 | 987.93 | 1149.27 | 1149.27 | 1149.27 | 1149.27 | 1149.27 | 1149.27 |
| MUFACE (653) | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas (654) | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |
| SUELDO BRUTO ANUAL (655) | 37068.78 | 38957.52 | 38957.52 | 47291.16 | 42547.82 | 42547.82 | 42547.82 | 44445.10 | 47185.74 |

Grado/Quinquenio threshold years (column O, rows 628-650):
| Row | Label | Years threshold (O col) |
|---|---|---|
| 638 | 5 años | 5 |
| 639 | 6 años y 7 meses | 6.58333 |
| 640 | 10 años | 10 |
| 641 | 13 años y 2 meses | 13.16667 |
| 642 | 15 años | 15 |
| 643 | 19 años y 9 meses | 19.75 |
| 644 | 20 años | 20 |
| 645 | 25 años | 25 |
| 646 | 26 años y 4 meses | 26.3333 |
| 647 | 30 años | 30 |
| 648 | 32 años y 11 meses | 32.916667 |
| 649 | 35 años | 35 |
| 650 | 40 años | 40 |

Helper columns AB/AC (rows 638-650) hold antigüedad-amount values for maestros/FP (AB) vs PES/Catedráticos (AC); F638...N638 pull via `=AB638`/`=AC638` then chain forward.

Antigüedad lookup formula (row 651, mislabeled "Reducción 3%" but actual content "CORRESPONDE COBRAR POR ANTIGÜEDAD"), verbatim col F:
```
=IF($C$3>=$O$650,F650,IF($C$3>=$O$649,F649,IF($C$3>=$O$648,F648,IF($C$3>=$O$647,F647,IF($C$3>=$O$646,F646,IF($C$3>=$O$645,F645,IF($C$3>=$O$644,F644,IF($C$3>=$O$643,F643,IF($C$3>=$O$642,F642,IF($C$3>=$O$641,F641,IF($C$3>=$O$640,F640,IF($C$3>=$O$639,F639,IF($C$3>=$O$638,F638,0)))))))))))))
```
Descending cascade: checks años de servicio against each threshold from highest (40) down to lowest (5), returns antigüedad amount for the highest band reached; below 5 años -> 0.

Exact SUELDO BRUTO ANUAL formula (col F) — completely different, no complemento destino, no trienio/sexenio loops:
```
=(F630+F635+F651)*12+((F631+F635+F651)*2)+(F637*14)
```
Pseudocode: (Sueldo Base + Complemento Específico + Antigüedad-ladder-amount) × 12 ordinary months, + (Extra Sueldo Base + Complemento Específico + Antigüedad-ladder-amount) × 2 extra pagas, + Cargo directivo × 14. No IF($C$4=...), no tutoría, no INT($C$3/3) or INT($C$3/6) anywhere.

Row 652 "Adicional maestros 1º y 2º ESO" has value 136.38 only in F (maestros); NOT referenced in Navarra's SBA formula at all (unlike Ceuta y Melilla which does apply it).

---

# PART B — Nómina mensual sheet

## Selector cells (rows 5-14) and valid values

| Cell | Label | Values |
|---|---|---|
| C5 | Cuerpo Docente | dropdown list $AA$95:$AA$103: '510-Inspección','511-Catedráticos','590-Profesores Enseñanza Secundaria','591-Profesores Técnicos de Formación Profesional','592-Profesores de Escuelas Oficiales de Idiomas','594-Profesores de Música y Artes Escénicas','595-Profesores de Artes Plásticas y Diseño','596-Maestros de Taller de Artes Plásticas y Diseño','597-Maestros' |
| H5 | Grupo prof (derived) | `=IF($C$5="597-Maestros","A2",IF($C$5="596-Maestros de Taller de Artes Plásticas y Diseño","A2",IF($C$5="591-Profesores Técnicos de Formación Profesional","A2","A1")))` |
| C6 | Funcionario | 'Carrera' / 'Interino' |
| C7 | Años de Servicio | numeric |
| C8 | Maestro 1º/2º ESO | SI/NO |
| C9 | Nómina con Paga Extra | SI/NO |
| H10 | Elige Isla (Baleares) | inline list "Mallorca,Menorca,Ibiza,Formentera" — only Mallorca vs rest matters in most formulas (`IF($H$10="Mallorca",...)`) |
| C10 | Destino Isla No Capitalina (Canarias) | SI/NO |
| C11 | Tutor | SI/NO |
| C12 | Cargo directivo | Sin cargo / Dirección / Vicedirección / Jefatura de Estudios / Secretaría |
| C13 | Tipo de centro | A/B/C/D/E/F (unit-count bands, meaning varies per community) |
| C14 | % retención IRPF | numeric decimal fraction, 0.02-0.26+ step list |
| B60 | Selecciona la Comunidad (comparison) | one of the 18 community names |

## Helper dropdown-list ranges

- Y71:Y98/Z71:Z98 — Y=SI/NO then IRPF % steps 0.02->0.26; Z=parallel integer counter.
- AA72:AA103 — AA72='Carrera', AA73='Interino', AA76-AA93≈18 comunidad names, AA95-AA103=9 cuerpo docente names.
- AC76:AT104 — cross-reference block: each column AC..AT = one community (AC=Canarias, AD=Andalucía, AE=Aragón, AF=Asturias, AG=Baleares, AH=Cantabria, AI=Castilla La Mancha, AJ=Castilla y León, AK=Cataluña, AL=Extremadura, AM=Galicia, AN=La Rioja, AO=Madrid, AP=Murcia, AQ=Valencia, AR=Ceuta y Melilla, AS=País Vasco, AT=Navarra); each row (76-104) pulls the corresponding concept row from Retribuciones!C<row> for that community's block (e.g. AR76=+Retribuciones!C554 ... AR102=+Retribuciones!C77 [MUFACE], AR103=+Retribuciones!C78 [Clases Pasivas], AR104=+Retribuciones!C79 [Sueldo Bruto Anual]). This is how Nómina mensual pulls every number from Retribuciones for every community.

## Key national formulas — SUELDO BRUTO MENSUAL, MUFACE/SS split, líquido, SUELDO BRUTO ANUAL

- Row 41 SUELDO BRUTO MENSUAL: `C41=SUM(C17:C39)` per community column C..T; exceptions: `D41=SUM(D17:D40)`, `P41=SUM(P17:P40)`, `T41=SUM(T17:T21)+T36` (Navarra sums fewer rows due to its different model).

- Row 44 (label `=IF(C6=AA72,"MUFACE","Contingencias Comunes y MEI")`), value formula C44:
```
=IF($C$6="interino",-C56*4.82%,IF($C$9="si",2*AD102,AD102))
```
Uniform MUFACE-vs-SS split across all 18 communities: Interino -> -4.82% of monthly SS contribution base (`C56 = C53/12`, annual gross ÷ 12); Carrera (MUFACE) -> pulls the community's fixed MUFACE figure via AD102 (=+Retribuciones!C77 for that community), doubled if paga-extra checkbox C9="si".

- Row 45 (label `=IF(C6=AA72,"Derechos Pasivos","Cuota Desempleo")`), value C45:
```
=IF($C$6="interino",-C56*1.55%,IF($C$9="si",-2*AD103,-AD103))
```
Same split: Interino -> -1.55% of C56; Carrera -> community's Clases Pasivas/Derechos Pasivos figure (AD103=+Retribuciones!C78), doubled if C9="si".

- Row 46 (Cuota Formación Profesional, interinos only): `C46=IF($C$6="interino",-C56*0.1%," ")`.
- Row 48 (% Retención IRPF): `C48=-C41*$C$14`.
- Row 49 (TOTAL DE GASTOS): `C49=SUM(C44:C48)`.
- Row 51 (SUELDO MENSUAL LÍQUIDO A PERCIBIR): `C51=+C41+C49`.
- Row 53 (SUELDO BRUTO ANUAL): `C53=+AD104` (= +Retribuciones!C79, i.e. directly equals the SUELDO BRUTO ANUAL computed on Retribuciones for that community/cuerpo — Nómina mensual's annual figure is SOURCED, not recomputed).
- Row 54 (Cuantía desgravable IRPF helper): `C54=IF($C6="carrera",(+(AD102+AD103)*14)+(C47*12),-(C53*6.35%)-(C47*12))`.
- Row 56 (Base cotización SS, interino only): `C56=IF($C$6="interino",+C53/12," ")`.

This IF($C$6="interino", SS%, IF($C$9="si", 2×MUFACE/DP, MUFACE/DP)) pattern is IDENTICAL for every community column C..T in rows 44/45/46 — only the referenced helper cell (AD102/AD103, AE102/AE103, ... AT102/AT103) changes per community, which in turn pulls Retribuciones!C77/C78 for that specific community's block.

## Comparison tables (rows 58-68)

- Row 59 (C59:T59): static list of 18 community names (same order as row16/64), used as lookup array.
- Row 60 B60 = selected comparison community; `C60=IF(C61>0,"Al año cobra más:","Al año cobra menos:")`.
- Row 61 delta vs selected community (col C shown, pattern repeats for D..T with subtrahend shifting):
```
C61=IF($B$60=$C$59,C53-$C$53,IF($B$60=$D$59,C53-$D$53,IF($B$60=$E$59,C53-$E$53,IF($B$60=$F$59,C53-$F$53,IF($B$60=$G$59,C53-$G$53,IF($B$60=$H$59,C53-$H$53,IF($B$60=$I$59,C53-$I$53,IF($B$60=$J$59,C53-$J$53,IF($B$60=$K$59,C53-$K$53,IF($B$60=$L$59,C53-$L$53,IF($B$60=$M$59,C53-$M$53,IF($B$60=$N$59,C53-$N$53,IF($B$60=$O$59,C53-$O$53,IF($B$60=$P$59,C53-$P$53,IF($B$60=$Q$59,C53-$Q$53,IF($B$60=$R$59,C53-$R$53,IF($B$60=$S$59,C53-$S$53,IF($B$60=$T$59,C53-$T$53))))))))))))))))))
```
i.e. matches the selected community name against row59, subtracts that community's SBA (row53) from each other community's SBA in the current column.

- Row 63 header "COMPARATIVA DE RETRIBUCIONES POR COMUNIDADES CON RESPECTO A LA MEDIA".
- Row 64: community names again (C64:T64), plus U64='RETRIBUCIÓN MÁXIMA', V64='RETRIBUCIÓN MÍNIMA'.
- Row 65 diferencia absoluta vs media: `C65=SUM(C53,-$U53)` where `U53=SUM(C53:T53)/18` (18-community average, at row 53 col U).
- Row 66 diferencia relativa: `C66=C65/$U53`.
- Row 67 max/min/spread: `U67=MAX(C53:T53)`, `V67=MIN(C53:T53)`, `W67=U67-V67` (BRECHA ANUAL).
- Row 68 which community has max/min: `U68=INDEX($C$59:$T$59,MATCH(MAX($C$53:$T$53),$C$53:$T$53,0))`, `V68=INDEX($C$59:$T$59,MATCH(MIN($C$53:$T$53),$C$53:$T$53,0))`.

## Column C4:T4 -> community mapping (mirrored at rows 16, 59, 64)

C=Andalucía, D=Aragón, E=Asturias, F=Baleares (Islas), G=Canarias, H=Cantabria, I=Castilla La Mancha, J=Castilla y León, K=Cataluña, L=Extremadura, M=Galicia, N=La Rioja, O=Madrid, P=Murcia, Q=Valencia, R=Ceuta y Melilla, S=País Vasco, T=Navarra.

(NOTE: this ordering does NOT match the AC:AT cross-reference block order which starts with AC=Canarias — different, non-alphabetic internal order used purely for Retribuciones lookups; user-facing tables always use the C:T order above.)

---

# PART C — DATOS sheet (verbatim community notes)

- ARAGÓN: "Tiene importes diferentes en lo ssexenios mensuales, que en los sexenios de las pagas extras" [sic]
- CANARIAS: "Las extras tienen los sexenios reducidos. El complemento específico en la extra es menor que en las pagas ordinarias. Los trienios en isla no capitalina son menores"
- BALEARES: "Tienen complemento autonómico para funcionarios en prácticas e interinos, y otro para funcionarios de carrera escalable por antigüedad (como sexenios). También acuerdo de difícil cobertura difrente por islas, y una indemnización por residencia que también cambia en función del grupo profesional (A1, A2)" [sic "difrente"]
- CANTABRIA: (label only, no note text)
- CASTILLA LA MANCHA: (label only, no note text)
- MADRID: "Los cargos directivos tienen un componente fijo y otro variable en función del número de alumnos matriculados" (NOT actually implemented in the formulas — Madrid's cargo directivo uses flat lookups like every other community; this is a known gap/simplification in the source workbook)
- MURCIA: (label only, no note text)
- NAVARRA: "Antigüedad mediante escala de grados y quinquenios. No tienen complemento de destino. El sueldo base es más alto"

Only Aragón, Canarias, Baleares, Madrid, and Navarra have actual note text; Cantabria, Castilla La Mancha, and Murcia have a heading label but empty note bodies.

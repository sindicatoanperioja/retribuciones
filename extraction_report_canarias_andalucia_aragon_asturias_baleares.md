# Extraction Report: Retribuciones sheet — Canarias, Andalucía, Aragón, Asturias, Baleares

Row boundaries (verified via header search, `C<n>` mirror formula `=+E<n+1>` with community name):

| Community | Header row (C/E) | Block rows | Next community starts |
|---|---|---|---|
| Canarias | C10/E11 | 10–43 (+ Z:AH sexenio-extra table rows 21–26) | Andalucía @ C50/E51 |
| Andalucía | C50/E51 | 50–80 | Aragón @ C86/E87 |
| Aragón | C86/E87 | 86–117 (+ AB:AC extra-sexenio table rows 97–102) | Asturias @ C122/E123 |
| Asturias | C122/E123 | 122–151 | Baleares @ C158/E159 |
| Baleares | C158/E159 | 158–187 (+ Q:X residencia-island matrix rows 166–179, Z:AD carrera-antigüedad table rows 167–174) | Cantabria @ C194/E195 |

Column layout (F:N), same across all blocks: F=597-Maestros, G=591-PTFP, H=596-Maestros TAPD, I=590-Secundaria, J=592-EOI, K=594-Música/Artes Escénicas, L=595-Artes Plásticas, M=511-Catedráticos, N=510-Inspección.

Selector mirror (rows 1-8, shared across all communities via Nómina mensual):
- C1 = Cuerpo Docente (text match against F11..N11 style headers per block)
- C2 = Funcionario type — e.g. 'Carrera' (used by Baleares only, `$C$2="Carrera"`)
- C3 = Años de servicio (número, used via `INT($C$3/3)` trienios and `INT($C$3/6)` sexenios)
- C4 = Maestro 1º/2º ESO: "SI"/"NO"
- C5 = Nómina con Paga Extraordinaria: "SI"/"NO" (not directly referenced in these SUELDO BRUTO formulas)
- C6 = Destino Isla No Capitalina: "SI"/"NO" (Canarias/Andalucía/Baleares only)
- C7 = Tutor: "SI"/"NO"
- C8 = Cargo directivo text ("Sin cargo"/"Dirección"/"Vicedirección"/"Jefatura de Estudios"/"Secretaría")

NOTE on string comparisons: formulas mix case — Canarias/Aragón/Baleares use "si"/"s" lowercase, Asturias uses "SI" uppercase. Excel string comparison is case-insensitive, so the JS port must do a case-insensitive compare uniformly.

---

## 1. CANARIAS (rows 10–43, extra table Z:AH rows 21–26)

### Raw concept values (F,G,H,I,J,K,L,M,N)

| Concept | F(597) | G(591) | H(596) | I(590) | J(592) | K(594) | L(595) | M(511) | N(510) |
|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base (r14) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (r15) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (r16) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (r17) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (r18) | 591.43 | 728.32 | 728.32 | 728.32 | 728.32 | 728.32 | 728.32 | 872.33 | 872.33 |
| Complemento Específico (r19) | 806.35 | 759.63 | 759.63 | 757.35 | 757.35 | 757.35 | 757.35 | 816.85 | 1515.22 |
| "Extra Complemento Específico" (r20) | 628.95 | 592.51 | 592.51 | 590.73 | 590.73 | 590.73 | 590.73 | 637.15 | 637.15 |
| Sin sexenio (r21) | 0 all |
| 1º Sexenio (r22) | 55 all |
| 2º Sexenio (r23) | 64 all |
| 3º Sexenio (r24) | 120 all |
| 4º Sexenio (r25) | 180 all |
| 5º Sexenio (r26) | 70 all |
| Tutoría (r27) | 35 (F-M), N blank/0 |
| Cargo directivo (r28) | 0,0,0,253.88,0,0,0,0 (N blank) |
| Residencia Isla Capitalina (r29) | 144.55,144.55,144.55,160.59,160.59,160.59,160.59,180.67,178.29 |
| Residencia Isla No Capitalina (r30) | 481.43,481.43,481.43,534.9,534.9,534.9,534.9,601.77,594.06 |
| Trienios Residencia Isla No Capitalina (r31) | 33.84,33.84,33.84,37.63,37.63,37.63,37.63,42.25,90.28 |
| Adicional maestros 1º/2º ESO (r32) | 70.34 (F only) |
| Complemento mejora/dedicación (r33, labeled "Extra Adicional maestros 1º y 2º ESO") | 68.31 (F only) |
| Productividad semestral (r34) | 0 all |
| Reducción 3% (r35) | 0 all |
| Otros (r36) | 0 all |
| MUFACE (r41) | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas (r42) | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |
| SUELDO BRUTO ANUAL (r43) | 43366.94 | 43830.16 | 43830.16 | 50376.40 | 46822.08 | 46822.08 | 46822.08 | 50502.94 | 58947.22 |

### SEXENIOS EXTRA helper table (columns Z:AH, rows 22-26) — reduced rate for extra pay:
1º=42.9, 2º=49.92, 3º=93.6, 4º=140.4, 5º=54.6 (same value across all cuerpo columns Z-AH since each is `=+<prevcol>`)

### SUELDO BRUTO ANUAL formula (verbatim, column F):
```
=((+F14+F18+F19)*12)
+(F16*INT($C$3/3)*12)
+((F15+F18)*2)
+((F20)*2)
+(F17*INT($C$3/3)*2)
+(F28*14)
+(IF($C$6="si",(F30*12)+(F31*INT($C$3/3)*12),F29*12))
+(IF($C$4="si",F32,0))
+(((IF(INT($C$3/3)<6,F21,0))
   +(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F22,0))
   +(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F22+F23,0))
   +(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F22+F23+F24,0))
   +(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F22+F23+F24+F25,0))
   +(IF(INT($C$3/6)>4,F22+F23+F24+F25+F26,0)))*12)
+(IF($C$7="si",F27*12,0))
+(((IF(INT($C$3/3)<6,F21,0))
   +(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),Z22,0))
   +(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),Z22+Z23,0))
   +(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),Z22+Z23+Z24,0))
   +(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),Z22+Z23+Z24+Z25,0))
   +(IF(INT($C$3/6)>4,Z22+Z23+Z24+Z25+Z26,0)))*2)
+(F33*12)+(F34*2)
```
Pseudocode:
```
annual =
    (sueldoBase + complDestino + complEspecifico) * 12
  + trienios * floor(anosServicio/3) * 12
  + (extraSueldoBase + complDestino) * 2
  + extraComplEspecifico * 2
  + extraTrienio * floor(anosServicio/3) * 2
  + cargoDirectivo * 14
  + (isIslaNoCapitalina
        ? residenciaIslaNoCapitalina*12 + trieniosResidenciaIslaNoCapitalina*floor(anosServicio/3)*12
        : residenciaIslaCapitalina*12)
  + (esMaestro1o2oESO ? adicionalMaestrosESO : 0)   // one-time, NOT annualized
  + sexenioAcumulado_normal(step table rows 21-26) * 12
  + (esTutor ? tutoria*12 : 0)
  + sexenioAcumulado_extra(step table using Z:AH reduced rates) * 2
  + complementoMejora * 12
  + productividad * 2
```
Sexenio stepping logic (reused across all 18 communities):
```
n6 = floor(anosServicio/6)
base = (floor(anosServicio/3) < 6) ? sinSexenio : 0   // NOTE quirk: base uses trienios<6 (i.e. <18 años), summed ADDITIVELY alongside the stepped total, not mutually exclusive (harmless here since sinSexenio=0 in Canarias, but preserve logic)
if n6==0: extra=0
elif n6==1: extra=sex1
elif n6==2: extra=sex1+sex2
elif n6==3: extra=sex1+sex2+sex3
elif n6==4: extra=sex1+sex2+sex3+sex4
else (n6>=5): extra=sex1+sex2+sex3+sex4+sex5
return base+extra
```
Canarias quirk: islands residencia+trienios-residencia use an either/or IF (`$C$6="si"` non-capital island) swapping which annualized amount is used entirely (not additive).

---

## 2. ANDALUCÍA (rows 50–80)

### Raw concept values (F..N)

| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base (r54) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (r55) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (r56) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (r57) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (r58) | 592.11 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 873.38 | 873.38 |
| Complemento Específico (r59) | 857.3 | 881.46 | 881.46 | 881.46 | 881.46 | 881.46 | 881.46 | 881.46 | 2175.81 |
| Complemento Específico Autonómico (r60) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 62.01 | 0 |
| Sin sexenio (r61) | 0 all |
| 1º Sexenio (r62) | 85.62 all |
| 2º Sexenio (r63) | 99.51 all |
| 3º Sexenio (r64) | 127.77 all |
| 4º Sexenio (r65) | 162.29 all |
| 5º Sexenio (r66) | 63.4 all |
| Tutoría (r67) | 31.97 (all cols, N blank) |
| Cargo directivo (r68) | 0,0,0,350.9,0,0,0,0,(blank) |
| Residencia (r69-71) | 0 all (no islands) |
| Adicional maestros 1º/2º ESO (r72) | `=G58-F58`=137.03 (only F populated; O72 note "FALTA MAESTROS EN LA ESO") |
| Complemento mejora (r73) | 0 all |
| Productividad (r74) | 0 all |
| Reducción 3% (r75) | 0 all |
| Otros (r76) | 0 all |
| MUFACE (r77) | -40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 |
| Clases Pasivas (r78) | -92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 |
| Corresponde por sexenio (r80, helper) | 0 all (C3=5 años → 0 sexenios) |
| SUELDO BRUTO ANUAL (r79) | 37021.60 | 39278.26 | 39278.26 | 46526.58 | 41613.98 | 41613.98 | 41613.98 | 44501.48 | 61754.24 |

### Helper row 80 "Corresponde por sexenio" (stepped total, used only inside the *14 term):
```
F80 = IF($C$3/6>=5, SUM(F62:F66),
      IF($C$3/6>=4, SUM(F63:F66),     <- QUIRK: this branch drops F62 (1st sexenio) — same for ALL columns F-N per the verbatim formula
      IF($C$3/6>=3, SUM(F62:F64),
      IF($C$3/6>=2, SUM(F62:F63),
      IF($C$3/6>=1, F62, F61)))))
```
This uses raw `$C$3/6` (NOT INT()) and the `>=4` branch is `SUM(<col>63:<col>66)` (dropping the 1st sexenio) for every column, while `>=3` branch correctly includes 62. **This is a genuine bug/inconsistency in the source workbook — replicate it exactly, do not "fix" it**, since numeric parity with Excel is the priority.

### SUELDO BRUTO ANUAL formula (verbatim, column F):
```
=((+F54+F58+F59+F60)*12)
+(F56*INT($C$3/3)*12)
+((F55+F58)*2)
+((F59+F60)*2)
+(F57*INT($C$3/3)*2)
+(F68*14)
+(IF($C$6="s",,F69*12))
+(IF($C$4="s",F72,0))
+(IF($C$7="s",F67*12,0))
+(((IF(INT($C$3/3)<6,F61,0))+(F73*12)+(F74*2)))
+F80*14
```
Pseudocode:
```
annual =
    (sueldoBase + complDestino + complEspecifico + complEspecificoAutonomico) * 12
  + trienios * floor(anosServicio/3) * 12
  + (extraSueldoBase + complDestino) * 2
  + (complEspecifico + complEspecificoAutonomico) * 2
  + extraTrienio * floor(anosServicio/3) * 2
  + cargoDirectivo * 14
  + (isIslaNoCapitalina ? 0 : residenciaIslaCapitalina*12)   // Andalucía has no island residencia data, this branch is moot/defensive; TRUE branch is literally empty (=0)
  + (esMaestro1o2oESO ? adicionalMaestrosESO : 0)             // one-time
  + (esTutor ? tutoria*12 : 0)
  + sinSexenio(if floor(anosServicio/3)<6, i.e. <18 años, add sinSexenio value)
  + complementoMejora*12 + productividad*2
  + sexenioEscalonado(anosServicio, via helper row 80, WITH THE BUG ABOVE) * 14   // sexenio paid straight at 14x (both regular+extra at full rate), NOT split 12+2 at different rates like Canarias
```
Andalucía quirk: no separate reduced-rate sexenio table for paga extra — full monthly sexenio amount multiplied straight through by 14 via helper row 80 (which has the >=4 branch bug).

---

## 3. ARAGÓN (rows 86–117, extra table AB:AC rows 98–102)

### Raw concept values (F..N)

| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base (r90) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (r91) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (r92) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (r93) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (r94) | 592.11 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 729.14 | 873.38 | 873.38 |
| Complemento Específico (r95) | 740.23 | 740.23 | 740.23 | 756.22 | 756.22 | 756.22 | 756.22 | 762.09 | 808.69 |
| Complemento Específico Autonómico "EXTRA Complemento Específico" (r96) = 0.9*r95 | 666.207 | 666.207 | 666.207 | 680.598 | 680.598 | 680.598 | 680.598 | 685.881 | 727.821 |
| Sin sexenio (r97) | 0 all |
| 1º Sexenio (r98) | 96.53 all |
| 2º Sexenio (r99) | 114.53 all |
| 3º Sexenio (r100) | 143.73 all |
| 4º Sexenio (r101) | 162.77 all |
| 5º Sexenio (r102) | 60.09 all |
| Tutoría (r103) | 0 all |
| Cargo directivo (r104) | 0,0,0,332.96,0,0,0,0,(blank) |
| Residencia (r105-107) | 0 all (no islands) |
| Adicional maestros 1º/2º ESO (r108) | 139.7 (F only) |
| Complemento mejora "Fondos adicionales" (r109) | 0 all |
| Productividad (r110) = O110/2 | 0 (O110 empty) |
| Reducción 3%, Otros (r111-112) | 0 all |
| MUFACE (r113) | -40.68×3, -51.68×6 |
| Clases Pasivas (r114) | -92.9×3, 118.04×6 |
| SUELDO BRUTO ANUAL (r115) | 35234.574 | 37152.994 | 37152.994 | 44370.816 | 39709.376 | 39709.376 | 39709.376 | 41809.742 | 42452.822 |

### SEXENIOS EXTRAS helper table (AB98:AB102, SHARED single column for all cuerpos):
1º=86.88, 2º=103.08, 3º=129.36, 4º=146.49, 5º=54.08

### Helper rows 116 & 117:
```
F116 (normal-rate stepped sexenio) =
  IF($C$3/6>=5, SUM(F98:F102),
  IF($C$3/6>=4, SUM(F98:F101),      <- F column includes 1st sexenio
  IF($C$3/6>=3, SUM(F98:F100),
  IF($C$3/6>=2, SUM(F98:F99),
  IF($C$3/6>=1, F98, 0)))))
```
G116 (and H-N, pattern differs from F!):
```
G116 = IF($C$3/6>=5,SUM(G98:G102),IF($C$3/6>=4,SUM(G99:G102),IF($C$3/6>=3,SUM(G98:G100),IF($C$3/6>=2,SUM(G98:G99),IF($C$3/6>=1,G98,G97)))))
```
QUIRK: F's `>=4` branch = SUM(F98:F101) (includes 1st sexenio, excludes 5th); G-N's `>=4` branch = SUM(<col>99:<col>102) (excludes 1st, includes 5th) — genuine inconsistency between column F and columns G-N in the source workbook. Also F's `>=1` fallback returns literal `0`, while G-N's fallback returns `<col>97` (sin sexenio cell, =0 anyway here). **Replicate this F-vs-G:N asymmetry exactly for parity** (though numerically it may not matter much since values are similar, do not silently unify).

```
F117 (extra-rate stepped sexenio, using SHARED AB98:AB102 table) =
  IF($C$3/6>=5, SUM($AB$98:$AB$102),
  IF($C$3/6>=4, SUM($AB$98:$AB$101),
  IF($C$3/6>=3, SUM($AB$98:$AB$100),
  IF($C$3/6>=2, SUM($AB$98:$AB$99),
  IF($C$3/6>=1, AB98, 0)))))
```
G117..N117 use the identical formula (same shared AB table for all cuerpos, unlike Canarias' per-column Z:AH tables).

### SUELDO BRUTO ANUAL formula (verbatim, column F):
```
=((+F90+F94+F95)*12)
+(F92*INT($C$3/3)*12)
+((F91+F94)*2)
+((F96)*2)
+(F93*INT($C$3/3)*2)
+(F104*14)
+(IF($C$4="s",F108,0))
+(IF($C$7="s",F103*12,0))
+((F109*12)+(F110*2))
+(F116*12)
+F117*2
```
(G-N versions use `$C$4="SI"` / `$C$7="SI"` uppercase instead of lowercase "s" — inconsistent casing within the same community; use case-insensitive compare.)

Pseudocode:
```
annual =
    (sueldoBase + complDestino + complEspecifico) * 12
  + trienios * floor(anosServicio/3) * 12
  + (extraSueldoBase + complDestino) * 2
  + complEspecificoAutonomico(=0.9*complEspecifico) * 2
  + extraTrienio * floor(anosServicio/3) * 2
  + cargoDirectivo * 14
  + (esMaestro1o2oESO ? adicionalMaestrosESO : 0)
  + (esTutor ? tutoria*12 : 0)
  + fondosAdicionales*12 + productividad*2
  + sexenioNormal(stepped, helper row116, column-specific asymmetry) * 12
  + sexenioExtra(stepped, shared AB table, helper row117) * 2
```
Aragón quirk (per task brief): separate SHARED sexenio-extra table (AB98:AB102, one column for ALL cuerpos) used exclusively for paga-extra (×2), while regular sexenio (×12) uses the per-column table (though values are identical across columns via chaining). complEspecificoAutonomico = 0.9 × complEspecifico (derived, not independent input).

---

## 4. ASTURIAS (rows 122–151)

### Raw concept values (F..N)

| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base (r126) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (r127) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (r128) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (r129) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (r130) | 598.09 | 736.54 | 736.54 | 736.54 | 736.54 | 736.54 | 736.54 | 882.19 | 882.19 |
| Complemento Específico (r131) | 708.37 | 708.37 | 708.37 | 708.37 | 708.37 | 708.37 | 708.37 | 770.9 | 1725.48 (=Q132+R132) |
| Complemento Específico Autonómico (r132) | 0 (blank; only Q132/R132 helper cells feed N131) |
| Sin sexenio (r133) — DATE-SWITCH FORMULA | `=IF(TODAY()>DATE(2026,9,1),P133,O133)` = 113.85 (today's ref date > 2026-09-01 uses P133=113.85; before that date uses O133=43.85) — chained same value all cols |
| 1º Sexenio (r134) | 120.17 all |
| 2º Sexenio (r135) | 88.42 all |
| 3º Sexenio (r136) | 117.87 all |
| 4º Sexenio (r137) | 161.35 all |
| 5º Sexenio (r138) | 47.46 all |
| Tutoría (r139) | 0 all |
| Cargo directivo (r140) | 0 all (references 'Nómina mensual'!$E$29) |
| Residencia Isla Capitalina (r141) — REPURPOSED as "CORRESPONDE POR SEXENIO" helper | see helper below |
| Residencia rows 142-143 | 0 all |
| Adicional maestros 1º/2º ESO (r144) | 138.45 (F only) |
| Complemento Evaluación Docente tramo A (r145) | 164.68,164.68,164.68,257.3,257.3,257.3,257.3,257.3,257.3 |
| Complemento Evaluación Docente tramo B (r146) = F145*2 | 329.36,329.36,329.36,514.6,514.6,514.6,514.6,514.6,514.6 |
| Reducción 3%, Otros (r147-148) | 0 all |
| MUFACE (r149) | -40.68×3, -51.68×6 |
| Clases Pasivas (r150) | -92.9×3, 118.04×6 |
| SUELDO BRUTO ANUAL (r151) | 38590.36 | 40528.66 | 40528.66 | 43975.82 | 43975.82 | 43975.82 | 43975.82 | 46890.34 | 60254.46 |

### Helper row 141 "CORRESPONDE POR SEXENIO" (stepped, uses INT() correctly and consistently across all columns):
```
F141 = IF(INT($C$3/6)>=5, SUM(F134:F138),
       IF(INT($C$3/6)>=4, SUM(F134:F137),
       IF(INT($C$3/6)>=3, SUM(F134:F136),
       IF(INT($C$3/6)>=2, SUM(F134:F135),
       IF(INT($C$3/6)>=1, F134, F133)))))
```
(Consistent across all columns, unlike Aragón's bug — correctly nested ranges, default fallback = F133, the date-switched "sin sexenio" value.)

### Complemento Evaluación Docente gating (display-mirror cells C145/C146, NOT authoritative for the final formula — see quirk below):
```
C145 = IF(AND($C$3>5,$C$3<11,<cuerpo match>),F145,...,0)   -> tramo A active only for 6<=años<11
C146 = IF(AND($C$3>10,<cuerpo match>),F146,...,0)          -> tramo B active only for años>10
```

### SUELDO BRUTO ANUAL formula (verbatim, column F):
```
=((+F126+F130+F131)*12)
+(F128*INT($C$3/3)*12)
+((F127+F130+F131)*2)
+(F132*14)
+(F140*14)
+(F129*INT($C$3/3)*2)
+(IF($C$4="SI",F144*12,0))
+(F141*14)
+(IF($C$3>=10,F146*12,IF($C$3>=5,F145*12,0)))
```
Pseudocode:
```
annual =
    (sueldoBase + complDestino + complEspecifico) * 12
  + trienios * floor(anosServicio/3) * 12
  + (extraSueldoBase + complDestino + complEspecifico) * 2      // complEspecifico included in extra-pay term here (unlike Canarias)
  + complEspecificoAutonomico * 14                               // mostly 0 except Inspección
  + cargoDirectivo * 14
  + extraTrienio * floor(anosServicio/3) * 2
  + (esMaestro1o2oESO ? adicionalMaestrosESO*12 : 0)             // NOTE: annualized here (*12), unlike most other communities where it's one-time
  + sexenioEscalonado(via row141, base=dateSwitchedSinSexenio) * 14   // paid 14x total here (not split 12+2 at different rates)
  + evaluacionDocente:
        if anosServicio >= 10: tramoB * 12
        elif anosServicio >= 5: tramoA * 12
        else: 0
```
Asturias quirks (per task brief):
1. TODAY()-based date switch for "Sin sexenio": before 2026-09-01 value=43.85, from that date onward=113.85. JS port should implement this as a parameterized/editable "effective date" rule rather than hardcoding `new Date()`, for reproducibility and because the user wants rules editable.
2. Two-tramo evaluación docente: tramo A for years 6-10 (display gate), tramo B (=2×tramo A) for years ≥11 (display gate) — BUT the actual SUELDO BRUTO ANUAL formula's own gate is `>=10`/`>=5` and references the RAW table values F145/F146 directly (not the display-mirror C145/C146), so at años=5 exactly the annual formula DOES pay tramo A (F145*12) even though the display cell C145 would show 0 under its own stricter `>5` condition. This display-vs-calc inconsistency exists in the source; the final SUELDO BRUTO ANUAL formula's gate is authoritative for numeric parity — implement using the annual formula's own thresholds (>=10, >=5), not the display gates.

---

## 5. BALEARES (rows 158–187, + residencia matrix Q:X rows 166-179, + carrera-antigüedad table Z:AD rows 167-174)

### Raw concept values (F..N)

| Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
| Sueldo Base (r162) | 1199.52 | 1199.52 | 1199.52 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 | 1387.24 |
| Extra Sueldo Base (r163) | 874.83 | 874.83 | 874.83 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 | 856.05 |
| Trienios (r164) | 43.54 | 43.54 | 43.54 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 | 53.39 |
| Extra Trienio (r165) | 31.74 | 31.74 | 31.74 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 | 32.96 |
| Complemento Destino (r166) | 583.36 | 718.36 | 718.36 | 718.36 | 718.36 | 718.36 | 718.36 | 860.47 | 860.47 |
| Complemento Específico (r167) | 450.98 | 450.98 | 450.98 | 450.98 | 450.98 | 450.98 | 450.98 | 511.94 | 1525.57 (=O167+O166) |
| Complemento Específico Autonómico "carrera" antigüedad-scaled (r168) | 429.57 (same formula all columns, see below) |
| CEA interinos/prácticas flat (r169 alt formula `C169=IF($C$2<>"Carrera",$AA$168,0)`) | 412.35 if not Carrera |
| "Sin sexenio" label reused (F169 actual formula) | `=IF(AND($C$2="Carrera",C3<=1),$AA$167,0)` = 0 when C3=5 |
| 1º Sexenio (r170) | 68.45 all |
| 2º Sexenio (r171) | 86.34 all |
| 3º Sexenio (r172) | 115.06 all |
| 4º Sexenio (r173) | 157.41 all |
| 5º Sexenio (r174) | 46.36 all |
| Tutoría (r175) | 36.71 (F-M), N blank |
| Cargo directivo (r176) | 0 all (references 'Nómina mensual'!$F$29) |
| Residencia Mallorca (r177) | 0 all (conditioned on H10="Mallorca") |
| Residencia Menorca/Ibiza/Formentera (r178) | 0,0,0,693.08,693.08,693.08,693.08,693.08,693.08 (sample: island selector gave Ibiza/A1 =693.08 in test case) |
| Trienios Residencia Isla No Capitalina (r179) | 0 all |
| Adicional maestros 1º/2º ESO (r180) | 135.08 (F only) |
| Carrera Profesional Primer tramo (r181) | 52.53 (F-L), N=77.26 |
| Carrera Profesional Segundo tramo (r182) | 80 (F-M), N=115.89 |
| Reducción 3%, Otros (r183-184) | 0 all |
| MUFACE (r185) | -40.68×3, -51.68×6 |
| Clases Pasivas (r186) | -92.9×3, 118.04×6 |
| SUELDO BRUTO ANUAL (r187) | 37224.60 | 39114.60 | 39114.60 | 49767.28 | 49767.28 | 49767.28 | 49767.28 | 52610.26 | 66801.08 |

### Antigüedad-scaled Complemento Específico Autonómico "carrera" table (Z:AA rows 167-174):

| Threshold (años servicio) | Value (AA col) | Label (Z col) |
|---|---|---|
| <1 año | 429.57 (AA167) | "Menos de 1 año" |
| ≥1 (default/non-Carrera base) | 412.35 (AA168) | "Interinos y practicas" |
| ≥1 año (Carrera) | 429.57 (AA169) | "Más de 1 año" |
| ≥6 años | 491.43 (AA170) | "Más de 6 años" |
| ≥12 años | 535.73 (AA171) | "Más de 12 años" |
| ≥18 años | 551.86 (AA172) | "Más de 18 años" |
| ≥24 años | 526.36 (AA173) | "Más de 24 años" — LOWER than the ≥18 tier (non-monotonic drop, genuine quirk in the pay scale, preserve exactly) |
| ≥30 años | 609.89 (AA174) | "Más de 30 años" |

Formula (all columns identical):
```
F168 = IF($C$2="Carrera",
          IF($C$3>=30,$AA$174,
          IF($C$3>=24,$AA$173,
          IF($C$3>=18,$AA$172,
          IF($C$3>=12,$AA$171,
          IF($C$3>=6,$AA$170,
          IF($C$3>=1,$AA$169,$AA$168)))))),
          $AA$168)
```

### Residencia por isla matrix (Q:X rows 176-179) — grouped by island × grupo (A1/A2):
| Island | A1 (col) | A2 (col) |
|---|---|---|
| Mallorca | Q179=144.2 | R179=129.76 |
| Menorca | S179=322.58 | T179=312.11 |
| Ibiza | U179=422.58 | V179=412.11 |
| Formentera | W179=693.08 | X179=683.61 |

Each is `=SUM(<col>177:<col>178)` (row177="Difícil cobertura" component, row178="Indemnización Residencia" component). F177/I177/F178/I178 use nested IFs against 'Nómina mensual'!$H$5 (grupo A1/A2) AND $H$10 (island name) to select the right cell.

### SUELDO BRUTO ANUAL formula (verbatim, column F):
```
=((+F162+F166+F167+F168)*12)
+(F164*INT($C$3/3)*12)
+((F163+F166)*2)
+((F167+F168)*2)
+(F176*14)
+(F165*INT($C$3/3)*2)
+(IF($C$6="si",(F178*12),F177*12))
+(IF($C$4="si",F180,0))
+(((IF(INT($C$3/6)<6,F169,13.98))
   +(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F170,0))
   +(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F170+F171,0))
   +(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F170+F171+F172,0))
   +(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F170+F171+F172+F173,0))
   +(IF(INT($C$3/6)>4,F170+F171+F172+F173+F174,0)))*12)
+(IF($C$7="s",F175*12,0))
+(((IF(INT($C$3/3)<6,F169,0))
   +(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F170,0))
   +(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F170+F171,0))
   +(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F170+F171+F172,0))
   +(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F170+F171+F172+F173,0))
   +(IF(INT($C$3/6)>4,F170+F171+F172+F173+F174,0)))*2)
+(IF($C$3>12,(F182*12),IF($C$3>6,(F181*12),0)))
```
Pseudocode:
```
annual =
    (sueldoBase + complDestino + complEspecifico + complEspAutonomicoCarrera) * 12
  + trienios * floor(anosServicio/3) * 12
  + (extraSueldoBase + complDestino) * 2
  + (complEspecifico + complEspAutonomicoCarrera) * 2
  + cargoDirectivo * 14
  + extraTrienio * floor(anosServicio/3) * 2
  + (isIslaNoCapitalina ? residenciaMenorcaIbizaFormentera*12 : residenciaMallorca*12)
  + (esMaestro1o2oESO ? adicionalMaestrosESO : 0)             // one-time
  + sexenioNormal(step, base fallback=IF(floor(años/6)<6, sinSexenio_r169, 13.98)) * 12
       // QUIRK: base-case fallback when floor(years/6)>=6 but this branch is reached is a HARD-CODED 13.98 magic number, not a cell reference
  + (esTutor ? tutoria*12 : 0)                                 // "s" lowercase compare here
  + sexenioNormal(step, SAME table F170:F174, base fallback=IF(floor(años/3)<6, sinSexenio_r169, 0)) * 2
       // QUIRK 2: near-duplicate sexenio block, but the trigger divisor for the base-case differs (/6 vs /3) and the fallback differs (13.98 vs 0) between the two occurrences — preserve exactly, do not unify
  + carreraProfesional:
        if anosServicio > 12: segundoTramo * 12
        elif anosServicio > 6: primerTramo * 12
        else: 0
```
Baleares quirks (per task brief):
1. Seniority-scaled Complemento Específico Autonómico for Carrera funcionarios only (7-tier table, NON-MONOTONIC: ≥24-years tier pays LESS than ≥18-years tier). Non-Carrera get flat 412.35 regardless of seniority.
2. Residencia matrix by island × grupo (A1/A2): 4 islands × 2 grupos, each = "Difícil cobertura" + "Indemnización Residencia" summed.
3. Two near-duplicate sexenio-stepping blocks with different trigger divisor (/6 vs /3) and different fallback constants (13.98 hardcoded vs 0) — preserve both quirks exactly, they are NOT meant to be identical in the current source (or if they were meant to be identical, that's a source bug — either way, replicate verbatim for parity).
4. Carrera Profesional (tramo 1/2) gated purely by años de servicio (>6 → tramo1, >12 → tramo2, mutually exclusive), UNRELATED to the C2 "Carrera" funcionario-type flag despite the similar name — do not confuse "Carrera Profesional" (a bonus concept, available to everyone regardless of funcionario type) with "$C$2=Carrera" (the funcionario-type selector, which only gates the antigüedad-scaled CEA in item 1).

---

## Cross-community notes for the JS port

- Common base structure: SUELDO BRUTO ANUAL = sum of (monthly items × 12) + (paga-extra items × 2, sometimes combined as ×14) + one-time/annualized special items, driven by shared selector cells C1-C8.
- Trienios always use `INT($C$3/3)`; sexenios sometimes use `INT($C$3/6)` and sometimes raw `$C$3/6` (inconsistent use of INT() — Andalucía/Aragón's helper rows 80/116 use raw division without INT(), while the main sexenio-step blocks embedded directly in the SUELDO BRUTO formulas consistently use INT()). Preserve this distinction per-cell as found.
- Case-sensitivity of "si"/"SI"/"s" flags is inconsistent across and even within communities — implement a single case-insensitive comparison helper for all C4/C6/C7 checks globally.
- Column C's `IF($C$11=$F$11,F<row>,IF(...))` pattern in every row is a UI display mirror only (selects which cuerpo-docente column to show) — NOT used in the SUELDO BRUTO ANUAL formulas, which always operate on the specific F:N column matching the actual selected cuerpo. Do not implement this mirror logic in the JS engine; just directly select the right column's raw data based on the chosen cuerpo docente.
- Genuine spreadsheet inconsistencies to replicate literally (NOT "fix"): Andalucía row 80's asymmetric SUM ranges (drops 1st sexenio in the >=4 branch for ALL columns); Aragón row 116's asymmetric SUM ranges between column F (includes 1st, excludes 5th in >=4 branch) vs columns G-N (excludes 1st, includes 5th); Baleares' hardcoded 13.98 fallback constant vs 0 fallback in its two near-duplicate sexenio-step blocks; Baleares' non-monotonic seniority table (24-year tier pays less than 18-year tier).

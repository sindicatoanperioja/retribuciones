# Report: 5 Autonomous Communities — Retribuciones sheet extraction (Cantabria, Castilla La Mancha, Castilla y León, Cataluña, Extremadura)

All formulas quoted verbatim from FORMULA= field. Column order: F=597-Maestros, G=591-PTFP, H=596-Maestros TAPD, I=590-Secundaria, J=592-EOI, K=594-Música/Artes Escénicas, L=595-Artes Plásticas, M=511-Catedráticos, N=510-Inspección.

The SUELDO BRUTO ANUAL formula (last row of each block) has an identical structure across all 5 communities (only cell-row offsets differ, since each block is 36 rows and columns reference their own block's local rows). General form per column X (using block-relative row aliases: SB=Sueldo Base, ESB=Extra Sueldo Base, TRI=Trienios, ETRI=Extra Trienio, CD=Complemento Destino, CE=Complemento Específico, CEA=Complemento Específico Autonómico, SS=Sin sexenio, SX1..SX5=1º-5º Sexenio, TUT=Tutoría, CARGO=Cargo directivo, ADIC=Adicional 1º/2º ESO maestros, MEJORA=Complemento mejora, PROD=Productividad):

```
=((+SB+CD+CE+CEA)*12)
 +(TRI*INT($C$3/3)*12)
 +((ESB+CD)*2)
 +((CE+CEA)*2)                      [NOT present in Cantabria's formula — see note below]
 +(CARGO*14)
 +(ETRI*INT($C$3/3)*2)
 +(IF($C$4="s",ADIC,0))
 +(SEXENIO_TOTAL*12)
 +(IF($C$7="s",TUT*12,0))
 +(SEXENIO_TOTAL*2)                  [written as "++(...)" — double plus, harmless, just concatenated]
 +(MEJORA*12)
 +(PROD*2)
```
Where SEXENIO_TOTAL is the tiered nested-IF block: `INT($C$3/3)` = years-of-service/3 (trienios count), `INT($C$3/6)` = years/6 (sexenio tiers, each tier = 6 years):
```
(IF(INT($C$3/3)<6,SS,0))
+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),SX1,0))
+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),SX1+SX2,0))
+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),SX1+SX2+SX3,0))
+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),SX1+SX2+SX3+SX4,0))
+(IF(INT($C$3/6)>4,SX1+SX2+SX3+SX4+SX5,0))
```
This same block appears twice (multiplied by 12, then by 2). Selector cells referenced: `$C$3` = años de servicio, `$C$4` = "s"/not for Maestro 1º/2º ESO flag, `$C$7` = "s"/not for Tutor flag.

---

## 1. CANTABRIA (rows 195–223, header E195)

O195="ACT.feb-26" (update-date note).

| Row | Concept | F(597) | G(591) | H(596) | I(590) | J(592) | K(594) | L(595) | M(511) | N(510) |
|---|---|---|---|---|---|---|---|---|---|---|
|196|Grupo|A2|A2|A2|A1|A1|A1|A1|A1|A1|
|197|Nivel|21|24|24|24|24|24|24|26|26|
|198|Sueldo Base|1199.52|1199.52|1199.52|1387.24|1387.24|1387.24|1387.24|1387.24|1387.24|
|199|Extra Sueldo Base|874.83|874.83|874.83|856.05|856.05|856.05|856.05|856.05|856.05|
|200|Trienios|43.54|43.54|43.54|53.39|53.39|53.39|53.39|53.39|53.39|
|201|Extra Trienio|31.74|31.74|31.74|32.96|32.96|32.96|32.96|32.96|32.96|
|202|Complemento Destino|623.22|767.49|767.49|767.49|767.49|767.49|767.49|919.32|919.32|
|203|Complemento Específico|875.1|875.1|875.1|875.1|875.1|875.1|875.1|940.27|1062.5|
|204|Complemento Específico Autonómico|0|0|0|0|0|0|0|0|1140.46 (N204 hardcoded)|
|205|Sin sexenio|35.77 (same all cols)|
|206|1º Sexenio|108.86 (same all)|
|207|2º Sexenio|92.21 (same all)|
|208|3º Sexenio|122.88 (same all)|
|209|4º Sexenio|168.17 (same all)|
|210|5º Sexenio|49.51 (same all; N blank)|
|211|Tutoría|0 (all)|
|212|Cargo directivo|0,0,0,410.05,0,0,0,0 (N blank) formula `=IF($C$1=X195,'Nómina mensual'!$H$29,0)` per column|
|213|Residencia Isla Capitalina|0 (blank all)|
|214|Residencia Isla No Capitalina|0 (blank)|
|215|Trienios Residencia Isla No Capitalina|0 (blank)|
|216|Adicional maestros 1º y 2º ESO|F216=144.34 only|
|217|Complemento mejora/especial dedicación|0 (blank)|
|218|Productividad semestral (Murcia)|0 (blank)|
|219|Reducción 3% (Castilla la Mancha)|0 (blank, unused)|
|220|Otros|0 (blank)|
|221|MUFACE|-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68 (formula `=+X77`)|
|222|Clases Pasivas|-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04 (formula `=+X78`)|
|223|SUELDO BRUTO ANUAL (values)|38207.12|40226.9|40226.9|48303.32|42562.62|42562.62|42562.62|45600.62|63278.28|

SUELDO BRUTO ANUAL formula for column F (verbatim):
```
=((+F198+F202+F203+F204)*12)+(F200*INT($C$3/3)*12)+((F199+F202)*2)+(F212*14)+((F203+F204)*2)+(F201*INT($C$3/3)*2)+((IF($C$4="s",F216,0))+(((IF(INT($C$3/3)<6,F205,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F206,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F206+F207,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F206+F207+F208,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F206+F207+F208+F209,0))+(IF(INT($C$3/6)>4,F206+F207+F208+F209+F210,0)))*12)+(IF($C$7="s",F211*12,0))++(((IF(INT($C$3/3)<6,F205,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F206,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F206+F207,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F206+F207+F208,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F206+F207+F208+F209,0))+(IF(INT($C$3/6)>4,F206+F207+F208+F209+F210,0)))*2)+(F217*12)+(F218*2))
```
Cantabria's formula does NOT include a separate `((CE+CEA)*2)` term as a distinct clause — CE/CEA's ×2 is present via `(F203+F204)*2` placed after CARGO×14 rather than before (functionally equivalent, just different order). Cargo directivo formula source: `'Nómina mensual'!$H$29`.

---

## 2. CASTILLA LA MANCHA (rows 231–259, header E231)

O231 = "FALTA COMPLE. INSPECCION. No actualizado".

| Row | Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
|232|Grupo|A2|A2|A2|A1|A1|A1|A1|A1|A1|
|233|Nivel|21|24|24|24|24|24|24|26|26|
|234|Sueldo Base|1199.52|1199.52|1199.52|1387.24|1387.24|1387.24|1387.24|1387.24|1387.24|
|235|Extra Sueldo Base|874.83|874.83|874.83|856.05|856.05|856.05|856.05|856.05|856.05|
|236|Trienios|43.54|43.54|43.54|53.39|53.39|53.39|53.39|53.39|53.39|
|237|Extra Trienio|31.74|31.74|31.74|32.96|32.96|32.96|32.96|32.96|32.96|
|238|Complemento Destino|592.11|729.14|729.14|729.14|729.14|729.14|729.14|873.38|873.38|
|239|Complemento Específico|282|282|282|282|282|282|282|341.92|375.48 (O239 note: "complemento de inspección")|
|240|Complemento Específico Autonómico|585.97 (chained same F-M)|585.97|585.97|585.97|585.97|585.97|585.97|585.97|N240=`=SUM(M240,O240)`=1634.02 (M240 585.97 + O240 1048.05)|
|241|Sin sexenio|0 (all blank)|
|242|1º Sexenio|90.35 (same all)|
|243|2º Sexenio|84.89 (same all)|
|244|3º Sexenio|113.11 (same all)|
|245|4º Sexenio|154.79 (same all)|
|246|5º Sexenio|59.41 (same all)|
|247|Tutoría|0 (F blank, G:M chained =0)|
|248|Cargo directivo|0,0,0,0,0,0,0,0 (all zero; formula `=IF($C$1=X231,'Nómina mensual'!$I$29,0)`)|
|249|Residencia Isla Capitalina|0 (blank)|
|250|Residencia Isla No Capitalina|0 (blank)|
|251|Trienios Residencia Isla No Capitalina|0 (blank)|
|252|Adicional maestros 1º y 2º ESO|0 (blank F:N — no value here, unlike Cantabria)|
|253|Complemento mejora/especial dedicación|0 (blank)|
|254|Productividad semestral (Murcia)|0 (blank)|
|255|Reducción 3% (Castilla la Mancha)|0 (blank F:N) — NOT referenced in the SUELDO BRUTO ANUAL formula below despite the row's name referencing this community. Legacy/unused row.|
|256|Otros|0 (blank)|
|257|MUFACE|-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68|
|258|Clases Pasivas|-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04|
|259|SUELDO BRUTO ANUAL (values)|37170.98|39089.40|39089.40|41425.12|41425.12|41425.12|41425.12|44283.36|59425.90|

SUELDO BRUTO ANUAL formula (column F, verbatim):
```
=((+F234+F238+F239+F240)*12)+(F236*INT($C$3/3)*12)+((F235+F238)*2)+((F239+F240)*2)+(F248*14)+(F237*INT($C$3/3)*2)+(IF($C$4="s",F252,0))+(((IF(INT($C$3/3)<6,F241,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F242,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F242+F243,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F242+F243+F244,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F242+F243+F244+F245,0))+(IF(INT($C$3/6)>4,F242+F243+F244+F245+F246,0)))*12)+(IF($C$7="s",F247*12,0))++(((IF(INT($C$3/3)<6,F241,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F242,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F242+F243,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F242+F243+F244,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F242+F243+F244+F245,0))+(IF(INT($C$3/6)>4,F242+F243+F244+F245+F246,0)))*2)+(F253*12)+(F254*2)
```
Key quirk: follows the "standard" pattern (includes `((CE+CEA)*2)` explicitly). Does NOT reference row 255 (Reducción 3%) anywhere. Cargo directivo formula source: `'Nómina mensual'!$I$29`.

---

## 3. CASTILLA Y LEÓN (rows 267–295, header E267)

O267 = "ACT. 02/2026". Has an extended helper "carrera profesional" side-table (columns O:AE, rows 276-281).

| Row | Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
|268|Grupo|A2|A2|A2|A1|A1|A1|A1|A1|A1|
|269|Nivel|21|24|24|24|24|24|24|26|26|
|270|Sueldo Base|1199.52|1199.52|1199.52|1387.24|1387.24|1387.24|1387.24|1387.24|1387.24|
|271|Extra Sueldo Base|874.83|874.83|874.83|856.05|856.05|856.05|856.05|856.05|856.05|
|272|Trienios|43.54|43.54|43.54|53.39|53.39|53.39|53.39|53.39|53.39|
|273|Extra Trienio|31.74|31.74|31.74|32.96|32.96|32.96|32.96|32.96|32.96|
|274|Complemento Destino|592.11|729.14|729.14|729.14|729.14|729.14|729.14|873.38|873.38|
|275|Complemento Específico|294.2|294.2|294.2|294.2|294.2|294.2|294.2|356.73|391.75 (O275 note "inspección")|
|276|Complemento Específico Autonómico|423.45|423.45|423.45|424.79|424.79|424.79|424.79|424.79|N276=`=SUM(O276:AA276)`=1036.51 (O276=234.63, AA276=801.88)|
|277|Sin sexenio|0 (blank F:I; J:N chained =0)|
|278|1º Sexenio|70.22 (same all)|
|279|2º Sexenio|88.56 (same all)|
|280|3º Sexenio|124.87 (same all)|
|281|4º Sexenio|251.87 (same all)|
|282|5º Sexenio|144.8 (same all)|
|283|Tutoría|0 (all)|
|284|Cargo directivo|0 all; formula `=IF($C$1=X267,'Nómina mensual'!$J$29,0)`|
|285-287|Residencia Isla Capitalina/NoCap/TrieniosResid|0 (blank)|
|288|Adicional maestros 1º y 2º ESO|F288=133.2 only|
|289|Complemento mejora/especial dedicación|25.27|25.27|25.27|27.04|27.04|27.04|27.04|27.04|27.04|
|290|Productividad semestral (Murcia)|0 (blank)|
|291|Reducción 3%|0 (blank, unused)|
|292|Otros|0 (blank)|
|293|MUFACE|-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68|
|294|Clases Pasivas|-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04|
|295|SUELDO BRUTO ANUAL (values)|35369.74|37288.16|37288.16|39663.88|39663.88|39663.88|39663.88|42558.66|51613.02|

Helper "carrera profesional" side-table (O–AE, rows 276-281) — labeled incompatible with sexenios (P278 note: "La carrera profesional en Castilla y León es incompatible con los sexenios"). NOT referenced by the SUELDO BRUTO ANUAL formula — informational/reference only, do not implement unless separately requested.

SUELDO BRUTO ANUAL formula (column F, verbatim) — same standard pattern as CLM:
```
=((+F270+F274+F275+F276)*12)+(F272*INT($C$3/3)*12)+((F271+F274)*2)+((F275+F276)*2)+(F284*14)+(F273*INT($C$3/3)*2)+(IF($C$4="s",F288,0))+(((IF(INT($C$3/3)<6,F277,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F278,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F278+F279,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F278+F279+F280,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F278+F279+F280+F281,0))+(IF(INT($C$3/6)>4,F278+F279+F280+F281+F282,0)))*12)+(IF($C$7="s",F283*12,0))++(((IF(INT($C$3/3)<6,F277,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F278,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F278+F279,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F278+F279+F280,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F278+F279+F280+F281,0))+(IF(INT($C$3/6)>4,F278+F279+F280+F281+F282,0)))*2)+(F289*12)+(F290*2)
```
Cargo directivo formula source: `'Nómina mensual'!$J$29`.

---

## 4. CATALUÑA (rows 303–331, header E303)

O303 = "FEB-26 SIN EQ.DIRECTIVOS A2". Extra helper table columns P/AB (rows 304-310) for "Unidades" (school-size tiers) — informational only, not referenced directly.

| Row | Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
|304|Grupo|A2|A2|A2|A1|A1|A1|A1|A1|A1|
|305|Nivel|21|24|24|24|24|24|24|26|26|
|306|Sueldo Base|1199.52|1199.52|1199.52|1387.24|1387.24|1387.24|1387.24|1387.24|1387.24|
|307|Extra Sueldo Base|874.83|874.83|874.83|856.05|856.05|856.05|856.05|856.05|856.05|
|308|Trienios|43.54|43.54|43.54|53.39|53.39|53.39|53.39|53.39|53.39|
|309|Extra Trienio|31.74|31.74|31.74|32.96|32.96|32.96|32.96|32.96|32.96|
|310|Complemento Destino|592.11|729.14|729.14|729.14|729.14|729.14|729.14|873.38|1022.22 (N310 hardcoded)|
|311|Complemento Específico|704.95|720.83|720.83|720.83|720.83|720.83|720.83|785.45|1002.89|
|312|Complemento Específico Autonómico|0 (blank all)|
|313|Sin sexenio|0 (blank)|
|314|1º Sexenio|128.88 (same all)|
|315|2º Sexenio|136.54 (same all)|
|316|3º Sexenio|153.66 (same all)|
|317|4º Sexenio|166.39 (same all)|
|318|5º Sexenio|145.85 (same all)|
|319|Tutoría|66.56|93.6|93.6|93.6|93.6|93.6|93.6|93.6|(N blank) — Cataluña is the only one of these 5 with nonzero Tutoría base values|
|320|Cargo directivo|0 all; formula `=IF($C$1=X303,'Nómina mensual'!$K$29,0)`|
|321-323|Residencia Isla Cap/NoCap/TrieniosResid|0 (blank)|
|324|Adicional maestros 1º y 2º ESO|F324=137.03 only|
|325|Complemento mejora/especial dedicación|0 (blank)|
|326|Productividad semestral (Murcia)|0 (blank)|
|327|Reducción 3%|0 (blank, unused)|
|328|Otros|0 (blank)|
|329|MUFACE|-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68|
|330|Clases Pasivas|-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04|
|331|SUELDO BRUTO ANUAL (values)|34888.70|37029.44|37029.44|39365.16|39365.16|39365.16|39365.16|42289.20|47417.12|

SUELDO BRUTO ANUAL formula (column F, verbatim) — standard pattern, Tutoría still gated by `IF($C$7="s",TUT*12,0)` even though Cataluña has nonzero base Tutoría amounts:
```
=((+F306+F310+F311+F312)*12)+(F308*INT($C$3/3)*12)+((F307+F310)*2)+((F311+F312)*2)+(F320*14)+(F309*INT($C$3/3)*2)+(IF($C$4="s",F324,0))+(((IF(INT($C$3/3)<6,F313,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F314,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F314+F315,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F314+F315+F316,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F314+F315+F316+F317,0))+(IF(INT($C$3/6)>4,F314+F315+F316+F317+F318,0)))*12)+(IF($C$7="s",F319*12,0))++(((IF(INT($C$3/3)<6,F313,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F314,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F314+F315,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F314+F315+F316,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F314+F315+F316+F317,0))+(IF(INT($C$3/6)>4,F314+F315+F316+F317+F318,0)))*2)+(F325*12)+(F326*2)
```
Cargo directivo formula source: `'Nómina mensual'!$K$29`.

---

## 5. EXTREMADURA (rows 339–367, header E339)

No side-note in O339.

| Row | Concept | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|
|340|Grupo|A2|A2|A2|A1|A1|A1|A1|A1|A1|
|341|Nivel|21|24|24|24|24|24|24|26|26|
|342|Sueldo Base|1199.52|1199.52|1199.52|1387.24|1387.24|1387.24|1387.24|1387.24|1387.24|
|343|Extra Sueldo Base|874.83|874.83|874.83|856.05|856.05|856.05|856.05|856.05|856.05|
|344|Trienios|43.54|43.54|43.54|53.39|53.39|53.39|53.39|53.39|53.39|
|345|Extra Trienio|31.74|31.74|31.74|32.96|32.96|32.96|32.96|32.96|32.96|
|346|Complemento Destino|592.11|729.14|729.14|729.14|729.14|729.14|729.14|873.38|873.38|
|347|Complemento Específico|520.73|520.73|520.73|520.73|520.73|520.73|520.73|578.76|611.3 (O347 note "Inspección")|
|348|Complemento Específico Autonómico|181.99 (chained same F-M)|181.99|181.99|181.99|181.99|181.99|181.99|181.99|N348=923.07 hardcoded (O348 note: "la suma de 339,41 y 583,66")|
|349|Sin sexenio|0 (blank)|
|350|1º Sexenio|63.89 (same all)|
|351|2º Sexenio|80.58 (same all)|
|352|3º Sexenio|107.36 (same all)|
|353|4º Sexenio|146.9 (same all)|
|354|5º Sexenio|43.29 (same all)|
|355|Tutoría|I355=47.72 base, chained to J,K,L,M (F,G,H,N blank/0). Note O355: "Solo cobran tutoría solo ESO" — only Secondary/ESO-eligible bodies receive Tutoría.|
|356|Cargo directivo|0,0,0,213.95,0,0,0,0 (N blank); formula `=IF($C$1=X339,'Nómina mensual'!$L$29,0)`|
|357-359|Residencia Isla Cap/NoCap/TrieniosResid|0 (blank)|
|360|Adicional maestros 1º y 2º ESO|F360 = `=G346-F346` = 137.03 (computed as difference between Secundaria's and Maestro's Complemento Destino, NOT a hardcoded literal)|
|361|Complemento mejora/especial dedicación|0 (blank)|
|362|Productividad semestral|0 (blank)|
|363|Reducción 3%|0 (blank, unused)|
|364|Otros|0 (blank)|
|365|MUFACE|-40.68,-40.68,-40.68,-51.68,-51.68,-51.68,-51.68,-51.68,-51.68|
|366|Clases Pasivas|-92.9,-92.9,-92.9,118.04,118.04,118.04,118.04,118.04,118.04|
|367|SUELDO BRUTO ANUAL (values)|34857.48|36775.90|36775.90|42106.92|39111.62|39111.62|39111.62|41943.40|52774.08|

SUELDO BRUTO ANUAL formula (column F, verbatim) — standard pattern:
```
=((+F342+F346+F347+F348)*12)+(F344*INT($C$3/3)*12)+((F343+F346)*2)+((F347+F348)*2)+(F356*14)+(F345*INT($C$3/3)*2)+(IF($C$4="s",F360,0))+(((IF(INT($C$3/3)<6,F349,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F350,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F350+F351,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F350+F351+F352,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F350+F351+F352+F353,0))+(IF(INT($C$3/6)>4,F350+F351+F352+F353+F354,0)))*12)+(IF($C$7="s",F355*12,0))++(((IF(INT($C$3/3)<6,F349,0))+(IF(AND(INT($C$3/6)>0,INT($C$3/6)<2),F350,0))+(IF(AND(INT($C$3/6)>1,INT($C$3/6)<3),F350+F351,0))+(IF(AND(INT($C$3/6)>2,INT($C$3/6)<4),F350+F351+F352,0))+(IF(AND(INT($C$3/6)>3,INT($C$3/6)<5),F350+F351+F352+F353,0))+(IF(INT($C$3/6)>4,F350+F351+F352+F353+F354,0)))*2)+(F361*12)+(F362*2)
```
Cargo directivo formula source: `'Nómina mensual'!$L$29`.

---

## Cross-community summary of quirks

1. Cantabria's formula term ordering differs slightly (CE/CEA ×2 placed after CARGO×14) but is mathematically equivalent to CLM/CyL/Cataluña/Extremadura. Cargo-directivo source column: Cantabria→H29, CLM→I29, CyL→J29, Cataluña→K29, Extremadura→L29 (each one column right, matching 18-community stacking order in Nómina mensual row 29).
2. "Reducción 3% (Castilla la Mancha)" row exists in every block here but is never referenced in any of these 5 communities' formulas — always 0/blank. May be wired for a different community not in this batch.
3. Cataluña is the only one here with nonzero base Tutoría values (66.56 Maestros grade, 93.6 rest), plus has an "Unidades" (school size) side lookup for cargo directivo — descriptive only, not wired into the formula.
4. Castilla y León has a "carrera profesional" side table explicitly noted incompatible with sexenios, but not wired into the active formula — informational only.
5. Extremadura: Adicional maestros 1º/2º ESO computed via `=G346-F346` (Secundaria CD minus Maestros CD), not a literal constant. Tutoría only populated for Secundaria+ bodies.
6. Complemento Específico Autonómico (CEA) for Inspección (col N) is a hardcoded literal, sometimes via SUM of helper cells: CLM N240=SUM(M240,O240); CyL N276=SUM(O276:AA276); Extremadura N348 flat hardcoded 923.07 (explanatory note: "la suma de 339,41 y 583,66"). Cantabria N204=1140.46 flat; Cataluña CEA=0 for all columns including N.
7. MUFACE and Clases Pasivas are identical across all 5 communities: formulas `=+X77` and `=+X78`, referencing shared helper rows 77/78 elsewhere in the sheet — values: MUFACE F/G/H=-40.68, I/J/K/L/M/N=-51.68; Clases Pasivas F/G/H=-92.9, I/J/K/L/M/N=118.04.

Rows for Residencia Isla Capitalina/No Capitalina/Trienios Residencia and Otros are blank/zero in all 5 of these mainland communities (island-only concepts).

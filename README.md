# Visor de Mortalidad Cardiovascular Ñuble 2019-2025

Visor web de la mortalidad por enfermedades del sistema circulatorio en la Región de Ñuble, por región, provincia y comuna, para los años 2019 a 2025 y el período completo 2019-2025.

Muestra dos indicadores, que se eligen con un selector:

- **Tasa de mortalidad ajustada por edad**, por 100.000 habitantes, con un decimal.
- **Cantidad de defunciones.**

Presenta el total de enfermedades del sistema circulatorio (CIE-10 I00–I99) y nueve grupos de causas. No presenta tasas crudas ni resultados por sexo o por grupo de edad.

Los años 2024 y 2025 se muestran como «Información provisional». Es un criterio operativo de este visor y no una clasificación oficial del DEIS.

## Archivos

| Archivo | Contenido |
|---|---|
| `index.html`, `app.js`, `estilos.css` | Interfaz web, sin bibliotecas externas |
| `datos_cardio.js` | Datos que usa la interfaz: defunciones y tasas ajustadas por territorio, causa y período |
| `datos_cardio.csv` | Los mismos datos para descarga. Separador `;`, coma decimal, UTF-8 con BOM |

## Fuentes

- **Defunciones:** registros de defunciones del Departamento de Estadísticas e Información de Salud (DEIS) del Ministerio de Salud de Chile, Región de Ñuble, 2019-2025.
- **Población (denominadores):** Instituto Nacional de Estadísticas (INE), estimaciones y proyecciones de población comunal 2002-2035, base Censo 2017.
- **Población estándar:** Instituto Nacional de Estadísticas (INE), «Estimaciones y proyecciones de la población de Chile 1992-2050», base Censo 2017, población al 30 de junio de 2017.
  - Fuente: <https://www.ine.cl/docs/default-source/proyecciones-de-poblacion/cuadros-estadisticos/base-2017/ine_estimaciones-y-proyecciones-de-poblaci%C3%B3n-1992-2050_base-2017_tabulados.xlsx?sfvrsn=68eefb1_9>
  - Licencia de esa fuente: [Creative Commons Reconocimiento-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/deed.es), según los [términos de uso del INE](https://www.ine.gob.cl/terminos-de-uso-y-licencia-de-datos-abiertos).
  - Cambios realizados: se agrupó por sexo y grupo quinquenal de edad y se expresó como proporción del total para usarla como ponderadores. El INE no respalda este visor ni el uso que hace de sus datos.

## Método

Ajuste directo por edad:

1. Las defunciones y la población se agrupan en 34 estratos: 2 sexos × 17 grupos quinquenales de edad (0-4 a 75-79, y 80 años y más).
2. En cada estrato se calcula la tasa específica: defunciones / población × 100.000.
3. La tasa ajustada es la suma de las tasas específicas multiplicadas por los ponderadores de la población estándar. Los 34 ponderadores suman 1.

Además:

- **Provincias y región:** se suman las defunciones y la población de sus comunas en cada estrato antes de calcular la tasa. No se promedian tasas comunales.
- **Período 2019-2025:** se acumulan las defunciones y la población de los siete años en cada estrato antes de aplicar los ponderadores. No es la suma ni el promedio de las tasas anuales.
- **Precisión:** los cálculos no redondean valores intermedios. Las tasas se redondean a un decimal solo al presentarlas.

## Transformaciones de los datos

- **Defunciones:** se seleccionaron las del grupo I00–I99 de la CIE-10. Se asignaron a una comuna, a una de las nueve causas y a un estrato de sexo y edad. Las edades registradas en meses, días u horas se asignaron al grupo 0-4, y las de 80 años o más, al grupo 80+.
- **Población comunal:** las edades simples se agruparon en los mismos 17 grupos quinquenales por sexo, comuna y año.
- **Publicación:** solo se publican recuentos agregados de defunciones y tasas ajustadas. No se publican registros individuales, poblaciones ni tasas crudas.

## Licencia

Este repositorio no declara una licencia general. La licencia CC BY-SA 4.0 indicada arriba corresponde a la población estándar del INE; su uso se rige por los términos de esa licencia.

// Visor de Mortalidad Cardiovascular Ñuble: interfaz sin bibliotecas externas.
// Las tasas se muestran con el texto ya preparado en los datos (tasa_ajustada_txt);
// el valor numérico solo se usa para el tamaño de barras y la posición de puntos.
(function () {
  "use strict";

  var D = window.DATOS_CARDIO;
  var valores = {};
  D.valores.forEach(function (v) { valores[v.territorio + "|" + v.categoria + "|" + v.periodo] = v; });
  var territorios = {};
  D.territorios.forEach(function (t) { territorios[t.id] = t; });
  var categorias = {};
  D.categorias.forEach(function (c) { categorias[c.id] = c; });
  var anios = D.periodos.filter(function (p) { return p !== D.periodo_completo; });

  var selT = document.getElementById("sel-territorio");
  var selC = document.getElementById("sel-categoria");
  var selP = document.getElementById("sel-periodo");
  var SVG = "http://www.w3.org/2000/svg";

  // Recuentos con punto como separador de miles (formato chileno), p. ej. 7.812.
  function miles(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Indicador global: cada modo define qué valor se muestra y cómo se rotula.
  var MODOS = {
    tasa: {
      nombre: "Tasa ajustada por edad",
      unidad: "por 100.000 habitantes",
      descripcion: "Tasa ajustada por edad, por 100.000 habitantes",
      eje: "Tasa ajustada por 100.000 hab.",
      columna: "Tasa ajustada por edad (por 100.000 habitantes)",
      entero: false,
      valor: function (v) { return v.tasa_ajustada; },
      texto: function (v) { return v.tasa_ajustada_txt; },
      detalle: function (v) { return v.tasa_ajustada_txt + " por 100.000 habitantes (tasa ajustada por edad)"; }
    },
    defunciones: {
      nombre: "Cantidad de defunciones",
      unidad: "número de defunciones",
      descripcion: "Número de defunciones",
      eje: "Defunciones",
      columna: "Cantidad de defunciones",
      entero: true,
      valor: function (v) { return v.defunciones; },
      texto: function (v) { return miles(v.defunciones); },
      detalle: function (v) { return miles(v.defunciones) + " defunciones"; }
    }
  };
  var modo = "tasa";

  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function sv(tag, attrs, texto) {
    var e = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  function opcion(valor, texto) {
    var o = el("option", null, texto);
    o.value = valor;
    return o;
  }

  function nombrePeriodo(p) {
    return p === D.periodo_completo ? "Período " + p : p;
  }

  function esProvisional(p) {
    return D.anios_provisionales.indexOf(p) >= 0;
  }

  function llenarFiltros() {
    var grupos = { region: "Región", provincia: "Provincias", comuna: "Comunas" };
    Object.keys(grupos).forEach(function (nivel) {
      var g = el("optgroup");
      g.label = grupos[nivel];
      D.territorios.filter(function (t) { return t.nivel === nivel; }).forEach(function (t) {
        g.appendChild(opcion(t.id, t.nombre));
      });
      selT.appendChild(g);
    });
    D.categorias.forEach(function (c) { selC.appendChild(opcion(c.id, c.etiqueta + " (" + c.rango + ")")); });
    D.periodos.forEach(function (p) {
      selP.appendChild(opcion(p, nombrePeriodo(p) + (esProvisional(p) ? " (provisional)" : "")));
    });
    selP.value = D.periodo_completo;
  }

  function barras(contenedor, filas, m) {
    contenedor.textContent = "";
    var max = 0;
    filas.forEach(function (f) { max = Math.max(max, m.valor(f.v)); });
    filas.forEach(function (f) {
      var fila = el("div", "barra-fila" + (f.destacada ? " destacada" : ""));
      fila.title = f.etiqueta + ": " + m.detalle(f.v);
      fila.appendChild(el("div", "barra-etiqueta", f.etiqueta));
      var pista = el("div", "barra-pista");
      var barra = el("div", "barra");
      barra.style.width = (max > 0 ? m.valor(f.v) / max * 100 : 0) + "%";
      pista.appendChild(barra);
      fila.appendChild(pista);
      fila.appendChild(el("div", "barra-valor", m.texto(f.v)));
      contenedor.appendChild(fila);
    });
  }

  // Paso «redondo» (1, 2 o 5 × 10^k) para unas cuatro divisiones del eje vertical.
  function pasoEje(max, entero) {
    var aprox = max / 4, mag = Math.pow(10, Math.floor(Math.log(aprox) / Math.LN10)), n = aprox / mag;
    var paso = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
    return entero ? Math.max(1, Math.round(paso)) : Math.max(0.1, paso);
  }

  // Marcas del eje: enteros con punto de miles; tasas con un decimal y coma decimal.
  function textoEje(valor, entero) {
    if (entero) return miles(Math.round(valor));
    var decimas = Math.round(valor * 10);
    return miles(Math.floor(decimas / 10)) + "," + (decimas % 10);
  }

  function lineas(contenedor, puntos, m, anioSel) {
    contenedor.textContent = "";
    var W = Math.max(contenedor.clientWidth, 280), H = 260;
    var izq = 56, der = 20, sup = 30, inf = 30;
    var max = 0;
    puntos.forEach(function (p) { max = Math.max(max, m.valor(p.v)); });
    if (max <= 0) max = 1;
    var paso = pasoEje(max, m.entero), tope = Math.ceil(max / paso) * paso;
    var margen = 24;  // separa el primer y el último punto de los bordes y de las marcas del eje
    var x = function (i) { return izq + margen + i * (W - izq - der - 2 * margen) / (puntos.length - 1); };
    var y = function (v) { return sup + (1 - v / tope) * (H - sup - inf); };
    // En pantallas angostas, las etiquetas de valor se alternan arriba y abajo para no superponerse.
    var estrecho = (W - izq - der - 2 * margen) / (puntos.length - 1) < 52;

    var g = sv("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img",
      "aria-label": "Evolución anual 2019-2025: " + m.descripcion });
    g.appendChild(sv("text", { x: 4, y: 14, "class": "eje-titulo" }, m.eje));
    for (var t = 0; t <= tope + paso / 2; t += paso) {
      g.appendChild(sv("line", { x1: izq, x2: W - der, y1: y(t), y2: y(t), "class": "rejilla" }));
      g.appendChild(sv("text", { x: izq - 6, y: y(t) + 4, "text-anchor": "end", "class": "eje-y" }, textoEje(t, m.entero)));
    }
    var trazo = function (desde, hasta) {
      return puntos.slice(desde, hasta + 1).map(function (p, i) {
        return x(desde + i) + "," + y(m.valor(p.v));
      }).join(" ");
    };
    var primeraProv = puntos.findIndex(function (p) { return p.provisional; });
    var finConsolidado = primeraProv < 0 ? puntos.length - 1 : Math.max(primeraProv - 1, 0);
    g.appendChild(sv("polyline", { points: trazo(0, finConsolidado), "class": "linea" }));
    if (primeraProv >= 0) {
      g.appendChild(sv("polyline", { points: trazo(finConsolidado, puntos.length - 1), "class": "linea provisional" }));
    }
    puntos.forEach(function (p, i) {
      var px = x(i), py = y(m.valor(p.v));
      var grupo = sv("g", { "class": "punto" + (p.etiqueta === anioSel ? " destacado" : ""), "data-anio": p.etiqueta });
      grupo.appendChild(sv("title", {}, p.etiqueta + (p.provisional ? " (información provisional)" : "") + ": " + m.detalle(p.v)));
      grupo.appendChild(sv("circle", { cx: px, cy: py, r: p.etiqueta === anioSel ? 6 : 4.5,
        "class": p.provisional ? "provisional" : "" }));
      grupo.appendChild(sv("text", { x: px, y: estrecho && i % 2 ? py + 20 : py - 10, "text-anchor": "middle", "class": "valor-punto" }, m.texto(p.v)));
      g.appendChild(grupo);
      g.appendChild(sv("text", { x: px, y: H - 8, "text-anchor": "middle", "class": "eje-x" }, p.etiqueta));
    });
    contenedor.appendChild(g);
  }

  function actualizar() {
    var m = MODOS[modo];
    var t = territorios[selT.value], c = categorias[selC.value], p = selP.value;
    var v = valores[t.id + "|" + c.id + "|" + p];

    ["tasa", "defunciones"].forEach(function (k) {
      document.getElementById("modo-" + k).setAttribute("aria-pressed", String(k === modo));
    });
    document.getElementById("provisional").hidden = !esProvisional(p);
    document.getElementById("advertencia-periodo").hidden = p !== D.periodo_completo;
    document.getElementById("res-titulo").textContent = m.nombre;
    document.getElementById("res-valor").textContent = m.texto(v);
    document.getElementById("res-unidad").textContent = m.unidad;
    document.getElementById("res-contexto").textContent =
      t.nombre + " · " + c.etiqueta + " (" + c.rango + ") · " + nombrePeriodo(p);

    document.getElementById("tit-evolucion").textContent = "Evolución anual: " + m.nombre.toLowerCase();
    document.getElementById("ctx-evolucion").textContent =
      t.nombre + " · " + c.etiqueta + ". " + m.descripcion + ".";
    lineas(document.getElementById("graf-evolucion"), anios.map(function (a) {
      return { etiqueta: a, v: valores[t.id + "|" + c.id + "|" + a], provisional: esProvisional(a) };
    }), m, p);

    document.getElementById("ctx-comunas").textContent =
      c.etiqueta + " · " + nombrePeriodo(p) + ". " + m.descripcion + ", de mayor a menor.";
    var comunas = D.territorios.filter(function (x) { return x.nivel === "comuna"; }).map(function (x) {
      return { etiqueta: x.nombre, v: valores[x.id + "|" + c.id + "|" + p], destacada: x.id === t.id };
    });
    comunas.sort(function (a, b) { return m.valor(b.v) - m.valor(a.v) || a.etiqueta.localeCompare(b.etiqueta, "es"); });
    barras(document.getElementById("graf-comunas"), comunas, m);

    document.getElementById("ctx-categorias").textContent = t.nombre + " · " + nombrePeriodo(p);
    document.getElementById("col-indicador").textContent = m.columna;
    var cuerpo = document.getElementById("tabla-categorias");
    cuerpo.textContent = "";
    D.categorias.forEach(function (x) {
      var w = valores[t.id + "|" + x.id + "|" + p];
      var tr = el("tr", x.id === c.id ? "destacada" : null);
      tr.title = x.etiqueta + ": " + m.detalle(w);
      tr.appendChild(el("td", null, x.etiqueta));
      tr.appendChild(el("td", null, x.rango));
      tr.appendChild(el("td", "num", m.texto(w)));
      cuerpo.appendChild(tr);
    });
  }

  // Vistas: visor y notas metodológicas (misma página; los filtros y el modo se conservan).
  var vistaVisor = document.getElementById("vista-visor");
  var vistaNotas = document.getElementById("vista-notas");
  var btnNotas = document.getElementById("btn-notas");
  var desplazamiento = 0;

  function mostrarVista() {
    var notas = location.hash === "#notas";
    if (notas === !vistaNotas.hidden) return;
    if (notas) desplazamiento = window.scrollY;
    vistaVisor.hidden = notas;
    btnNotas.hidden = notas;
    vistaNotas.hidden = !notas;
    if (!notas) actualizar();
    window.scrollTo(0, notas ? 0 : desplazamiento);
  }

  llenarFiltros();
  [selT, selC, selP].forEach(function (s) { s.addEventListener("change", actualizar); });
  ["tasa", "defunciones"].forEach(function (k) {
    document.getElementById("modo-" + k).addEventListener("click", function () { modo = k; actualizar(); });
  });
  btnNotas.addEventListener("click", function () { location.hash = "notas"; mostrarVista(); });
  document.getElementById("btn-volver").addEventListener("click", function () {
    history.pushState(null, "", location.pathname + location.search);
    mostrarVista();
  });
  window.addEventListener("hashchange", mostrarVista);
  window.addEventListener("popstate", mostrarVista);
  var espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () { if (!vistaVisor.hidden) actualizar(); }, 150);
  });
  actualizar();
  mostrarVista();
})();

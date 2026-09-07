// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
export type TipoDocumento = 'factura' | 'ticket' | 'nc' | 'reimpresion';
export type ModoFacturacion = 'contado' | 'credito';
export interface DocumentoPago {
  method: string;
  amount: number;
  moneda?: string;
  tasaCambio?: number;
  montoIngresado?: number;
}
export interface DocumentoItem {
  description: string;
  qty: number;
  price?: number;
  total: number;
  discount?: number;
  pumpNumber?: number;
}
export interface DocumentoInput {
  tipo: TipoDocumento;
  store: {
    storeName?: string;
    name?: string;
    address?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    rtn?: string;
    phone?: string;
    email?: string;
    casaMatriz?: string;
  };
  numeroDocumento: string;
  cai?: string | null;
  rangoDesde?: string | null;
  rangoHasta?: string | null;
  fechaVence?: string | null;
  modo?: ModoFacturacion;
  fecha?: string;
  turno?: string;
  cajero?: string;
  cliente?: string;
  rtnCliente?: string;
  items: DocumentoItem[];
  subtotal: number;
  descuento: number;
  isv: number;
  exento?: number;
  gravado15?: number;
  gravado18?: number;
  isv15?: number;
  isv18?: number;
  cambio?: number;
  total: number;
  pagos: DocumentoPago[];
  comentario?: string;
  mensajeAdicional?: string;
  columns?: number;
}
export interface TicketLine {
  text: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  size?: 'normal' | 'large';
}
const UNIDADES = stryMutAct_9fa48("0") ? [] : (stryCov_9fa48("0"), [stryMutAct_9fa48("1") ? "Stryker was here!" : (stryCov_9fa48("1"), ''), stryMutAct_9fa48("2") ? "" : (stryCov_9fa48("2"), 'Uno'), stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), 'Dos'), stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'Tres'), stryMutAct_9fa48("5") ? "" : (stryCov_9fa48("5"), 'Cuatro'), stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), 'Cinco'), stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), 'Seis'), stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), 'Siete'), stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'Ocho'), stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), 'Nueve')]);
const ESPECIALES = stryMutAct_9fa48("11") ? [] : (stryCov_9fa48("11"), [stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), 'Diez'), stryMutAct_9fa48("13") ? "" : (stryCov_9fa48("13"), 'Once'), stryMutAct_9fa48("14") ? "" : (stryCov_9fa48("14"), 'Doce'), stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), 'Trece'), stryMutAct_9fa48("16") ? "" : (stryCov_9fa48("16"), 'Catorce'), stryMutAct_9fa48("17") ? "" : (stryCov_9fa48("17"), 'Quince'), stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), 'Dieciseis'), stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), 'Diecisiete'), stryMutAct_9fa48("20") ? "" : (stryCov_9fa48("20"), 'Dieciocho'), stryMutAct_9fa48("21") ? "" : (stryCov_9fa48("21"), 'Diecinueve')]);
const DECENAS = stryMutAct_9fa48("22") ? [] : (stryCov_9fa48("22"), [stryMutAct_9fa48("23") ? "Stryker was here!" : (stryCov_9fa48("23"), ''), stryMutAct_9fa48("24") ? "" : (stryCov_9fa48("24"), 'Diez'), stryMutAct_9fa48("25") ? "" : (stryCov_9fa48("25"), 'Veinte'), stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'Treinta'), stryMutAct_9fa48("27") ? "" : (stryCov_9fa48("27"), 'Cuarenta'), stryMutAct_9fa48("28") ? "" : (stryCov_9fa48("28"), 'Cincuenta'), stryMutAct_9fa48("29") ? "" : (stryCov_9fa48("29"), 'Sesenta'), stryMutAct_9fa48("30") ? "" : (stryCov_9fa48("30"), 'Setenta'), stryMutAct_9fa48("31") ? "" : (stryCov_9fa48("31"), 'Ochenta'), stryMutAct_9fa48("32") ? "" : (stryCov_9fa48("32"), 'Noventa')]);
const CENTENAS = stryMutAct_9fa48("33") ? [] : (stryCov_9fa48("33"), [stryMutAct_9fa48("34") ? "Stryker was here!" : (stryCov_9fa48("34"), ''), stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'Ciento'), stryMutAct_9fa48("36") ? "" : (stryCov_9fa48("36"), 'Doscientos'), stryMutAct_9fa48("37") ? "" : (stryCov_9fa48("37"), 'Trescientos'), stryMutAct_9fa48("38") ? "" : (stryCov_9fa48("38"), 'Cuatrocientos'), stryMutAct_9fa48("39") ? "" : (stryCov_9fa48("39"), 'Quinientos'), stryMutAct_9fa48("40") ? "" : (stryCov_9fa48("40"), 'Seiscientos'), stryMutAct_9fa48("41") ? "" : (stryCov_9fa48("41"), 'Setecientos'), stryMutAct_9fa48("42") ? "" : (stryCov_9fa48("42"), 'Ochocientos'), stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), 'Novecientos')]);
function parteEnteraALetras(n: number): string {
  if (stryMutAct_9fa48("44")) {
    {}
  } else {
    stryCov_9fa48("44");
    if (stryMutAct_9fa48("47") ? n !== 0 : stryMutAct_9fa48("46") ? false : stryMutAct_9fa48("45") ? true : (stryCov_9fa48("45", "46", "47"), n === 0)) return stryMutAct_9fa48("48") ? "" : (stryCov_9fa48("48"), 'cero');
    let r = stryMutAct_9fa48("49") ? "Stryker was here!" : (stryCov_9fa48("49"), '');
    if (stryMutAct_9fa48("53") ? n < 1000000 : stryMutAct_9fa48("52") ? n > 1000000 : stryMutAct_9fa48("51") ? false : stryMutAct_9fa48("50") ? true : (stryCov_9fa48("50", "51", "52", "53"), n >= 1000000)) {
      if (stryMutAct_9fa48("54")) {
        {}
      } else {
        stryCov_9fa48("54");
        const m = Math.floor(stryMutAct_9fa48("55") ? n * 1000000 : (stryCov_9fa48("55"), n / 1000000));
        stryMutAct_9fa48("56") ? r -= m === 1 ? 'Un millon' : parteEnteraALetras(m) + ' millones' : (stryCov_9fa48("56"), r += (stryMutAct_9fa48("59") ? m !== 1 : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), m === 1)) ? stryMutAct_9fa48("60") ? "" : (stryCov_9fa48("60"), 'Un millon') : parteEnteraALetras(m) + (stryMutAct_9fa48("61") ? "" : (stryCov_9fa48("61"), ' millones')));
        stryMutAct_9fa48("62") ? n *= 1000000 : (stryCov_9fa48("62"), n %= 1000000);
      }
    }
    if (stryMutAct_9fa48("66") ? n < 1000 : stryMutAct_9fa48("65") ? n > 1000 : stryMutAct_9fa48("64") ? false : stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63", "64", "65", "66"), n >= 1000)) {
      if (stryMutAct_9fa48("67")) {
        {}
      } else {
        stryCov_9fa48("67");
        const m = Math.floor(stryMutAct_9fa48("68") ? n * 1000 : (stryCov_9fa48("68"), n / 1000));
        stryMutAct_9fa48("69") ? r -= m === 1 ? ' mil' : ' ' + parteEnteraALetras(m) + ' mil' : (stryCov_9fa48("69"), r += (stryMutAct_9fa48("72") ? m !== 1 : stryMutAct_9fa48("71") ? false : stryMutAct_9fa48("70") ? true : (stryCov_9fa48("70", "71", "72"), m === 1)) ? stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), ' mil') : (stryMutAct_9fa48("74") ? "" : (stryCov_9fa48("74"), ' ')) + parteEnteraALetras(m) + (stryMutAct_9fa48("75") ? "" : (stryCov_9fa48("75"), ' mil')));
        stryMutAct_9fa48("76") ? n *= 1000 : (stryCov_9fa48("76"), n %= 1000);
      }
    }
    if (stryMutAct_9fa48("80") ? n < 100 : stryMutAct_9fa48("79") ? n > 100 : stryMutAct_9fa48("78") ? false : stryMutAct_9fa48("77") ? true : (stryCov_9fa48("77", "78", "79", "80"), n >= 100)) {
      if (stryMutAct_9fa48("81")) {
        {}
      } else {
        stryCov_9fa48("81");
        if (stryMutAct_9fa48("84") ? n !== 100 : stryMutAct_9fa48("83") ? false : stryMutAct_9fa48("82") ? true : (stryCov_9fa48("82", "83", "84"), n === 100)) {
          if (stryMutAct_9fa48("85")) {
            {}
          } else {
            stryCov_9fa48("85");
            r += stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), ' cien');
            return stryMutAct_9fa48("87") ? r : (stryCov_9fa48("87"), r.trim());
          }
        }
        stryMutAct_9fa48("88") ? r -= ' ' + CENTENAS[Math.floor(n / 100)] : (stryCov_9fa48("88"), r += (stryMutAct_9fa48("89") ? "" : (stryCov_9fa48("89"), ' ')) + CENTENAS[Math.floor(stryMutAct_9fa48("90") ? n * 100 : (stryCov_9fa48("90"), n / 100))]);
        stryMutAct_9fa48("91") ? n *= 100 : (stryCov_9fa48("91"), n %= 100);
      }
    }
    if (stryMutAct_9fa48("95") ? n < 30 : stryMutAct_9fa48("94") ? n > 30 : stryMutAct_9fa48("93") ? false : stryMutAct_9fa48("92") ? true : (stryCov_9fa48("92", "93", "94", "95"), n >= 30)) {
      if (stryMutAct_9fa48("96")) {
        {}
      } else {
        stryCov_9fa48("96");
        stryMutAct_9fa48("97") ? r -= ' ' + DECENAS[Math.floor(n / 10)] : (stryCov_9fa48("97"), r += (stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), ' ')) + DECENAS[Math.floor(stryMutAct_9fa48("99") ? n * 10 : (stryCov_9fa48("99"), n / 10))]);
        if (stryMutAct_9fa48("103") ? n % 10 <= 0 : stryMutAct_9fa48("102") ? n % 10 >= 0 : stryMutAct_9fa48("101") ? false : stryMutAct_9fa48("100") ? true : (stryCov_9fa48("100", "101", "102", "103"), (stryMutAct_9fa48("104") ? n * 10 : (stryCov_9fa48("104"), n % 10)) > 0)) stryMutAct_9fa48("105") ? r -= ' y ' + UNIDADES[n % 10] : (stryCov_9fa48("105"), r += (stryMutAct_9fa48("106") ? "" : (stryCov_9fa48("106"), ' y ')) + UNIDADES[stryMutAct_9fa48("107") ? n * 10 : (stryCov_9fa48("107"), n % 10)]);
      }
    } else if (stryMutAct_9fa48("111") ? n < 20 : stryMutAct_9fa48("110") ? n > 20 : stryMutAct_9fa48("109") ? false : stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108", "109", "110", "111"), n >= 20)) {
      if (stryMutAct_9fa48("112")) {
        {}
      } else {
        stryCov_9fa48("112");
        stryMutAct_9fa48("113") ? r -= ' veinti' + UNIDADES[n % 10].toLowerCase() : (stryCov_9fa48("113"), r += (stryMutAct_9fa48("114") ? "" : (stryCov_9fa48("114"), ' veinti')) + (stryMutAct_9fa48("115") ? UNIDADES[n % 10].toUpperCase() : (stryCov_9fa48("115"), UNIDADES[stryMutAct_9fa48("116") ? n * 10 : (stryCov_9fa48("116"), n % 10)].toLowerCase())));
      }
    } else if (stryMutAct_9fa48("120") ? n < 10 : stryMutAct_9fa48("119") ? n > 10 : stryMutAct_9fa48("118") ? false : stryMutAct_9fa48("117") ? true : (stryCov_9fa48("117", "118", "119", "120"), n >= 10)) {
      if (stryMutAct_9fa48("121")) {
        {}
      } else {
        stryCov_9fa48("121");
        stryMutAct_9fa48("122") ? r -= ' ' + ESPECIALES[n - 10] : (stryCov_9fa48("122"), r += (stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), ' ')) + ESPECIALES[stryMutAct_9fa48("124") ? n + 10 : (stryCov_9fa48("124"), n - 10)]);
      }
    } else if (stryMutAct_9fa48("128") ? n <= 0 : stryMutAct_9fa48("127") ? n >= 0 : stryMutAct_9fa48("126") ? false : stryMutAct_9fa48("125") ? true : (stryCov_9fa48("125", "126", "127", "128"), n > 0)) {
      if (stryMutAct_9fa48("129")) {
        {}
      } else {
        stryCov_9fa48("129");
        stryMutAct_9fa48("130") ? r -= ' ' + UNIDADES[n] : (stryCov_9fa48("130"), r += (stryMutAct_9fa48("131") ? "" : (stryCov_9fa48("131"), ' ')) + UNIDADES[n]);
      }
    }
    return stryMutAct_9fa48("132") ? r : (stryCov_9fa48("132"), r.trim());
  }
}
function parteDecimalALetras(n: number): string {
  if (stryMutAct_9fa48("133")) {
    {}
  } else {
    stryCov_9fa48("133");
    if (stryMutAct_9fa48("136") ? n !== 0 : stryMutAct_9fa48("135") ? false : stryMutAct_9fa48("134") ? true : (stryCov_9fa48("134", "135", "136"), n === 0)) return stryMutAct_9fa48("137") ? "" : (stryCov_9fa48("137"), 'cero');
    if (stryMutAct_9fa48("141") ? n < 30 : stryMutAct_9fa48("140") ? n > 30 : stryMutAct_9fa48("139") ? false : stryMutAct_9fa48("138") ? true : (stryCov_9fa48("138", "139", "140", "141"), n >= 30)) {
      if (stryMutAct_9fa48("142")) {
        {}
      } else {
        stryCov_9fa48("142");
        let r = DECENAS[Math.floor(stryMutAct_9fa48("143") ? n * 10 : (stryCov_9fa48("143"), n / 10))];
        if (stryMutAct_9fa48("147") ? n % 10 <= 0 : stryMutAct_9fa48("146") ? n % 10 >= 0 : stryMutAct_9fa48("145") ? false : stryMutAct_9fa48("144") ? true : (stryCov_9fa48("144", "145", "146", "147"), (stryMutAct_9fa48("148") ? n * 10 : (stryCov_9fa48("148"), n % 10)) > 0)) stryMutAct_9fa48("149") ? r -= ' y ' + UNIDADES[n % 10] : (stryCov_9fa48("149"), r += (stryMutAct_9fa48("150") ? "" : (stryCov_9fa48("150"), ' y ')) + UNIDADES[stryMutAct_9fa48("151") ? n * 10 : (stryCov_9fa48("151"), n % 10)]);
        return stryMutAct_9fa48("153") ? r.toLowerCase() : stryMutAct_9fa48("152") ? r.trim().toUpperCase() : (stryCov_9fa48("152", "153"), r.trim().toLowerCase());
      }
    }
    if (stryMutAct_9fa48("157") ? n < 20 : stryMutAct_9fa48("156") ? n > 20 : stryMutAct_9fa48("155") ? false : stryMutAct_9fa48("154") ? true : (stryCov_9fa48("154", "155", "156", "157"), n >= 20)) return (stryMutAct_9fa48("158") ? "" : (stryCov_9fa48("158"), 'veinti')) + (stryMutAct_9fa48("159") ? UNIDADES[n % 10].toUpperCase() : (stryCov_9fa48("159"), UNIDADES[stryMutAct_9fa48("160") ? n * 10 : (stryCov_9fa48("160"), n % 10)].toLowerCase()));
    if (stryMutAct_9fa48("164") ? n < 10 : stryMutAct_9fa48("163") ? n > 10 : stryMutAct_9fa48("162") ? false : stryMutAct_9fa48("161") ? true : (stryCov_9fa48("161", "162", "163", "164"), n >= 10)) return stryMutAct_9fa48("165") ? ESPECIALES[n - 10].toUpperCase() : (stryCov_9fa48("165"), ESPECIALES[stryMutAct_9fa48("166") ? n + 10 : (stryCov_9fa48("166"), n - 10)].toLowerCase());
    return stryMutAct_9fa48("167") ? UNIDADES[n].toUpperCase() : (stryCov_9fa48("167"), UNIDADES[n].toLowerCase());
  }
}
export function numeroALetras(num: number): string {
  if (stryMutAct_9fa48("168")) {
    {}
  } else {
    stryCov_9fa48("168");
    const abs = Math.abs(num);
    let entera = Math.floor(abs);
    let decimal = Math.round(stryMutAct_9fa48("169") ? (abs - entera) / 100 : (stryCov_9fa48("169"), (stryMutAct_9fa48("170") ? abs + entera : (stryCov_9fa48("170"), abs - entera)) * 100));
    if (stryMutAct_9fa48("173") ? decimal !== 100 : stryMutAct_9fa48("172") ? false : stryMutAct_9fa48("171") ? true : (stryCov_9fa48("171", "172", "173"), decimal === 100)) {
      if (stryMutAct_9fa48("174")) {
        {}
      } else {
        stryCov_9fa48("174");
        stryMutAct_9fa48("175") ? entera -= 1 : (stryCov_9fa48("175"), entera += 1);
        decimal = 0;
      }
    }
    const pe = parteEnteraALetras(entera);
    const pd = parteDecimalALetras(decimal);
    const moneda = (stryMutAct_9fa48("178") ? entera !== 1 : stryMutAct_9fa48("177") ? false : stryMutAct_9fa48("176") ? true : (stryCov_9fa48("176", "177", "178"), entera === 1)) ? stryMutAct_9fa48("179") ? "" : (stryCov_9fa48("179"), 'lempira') : stryMutAct_9fa48("180") ? "" : (stryCov_9fa48("180"), 'lempiras');
    const centavo = (stryMutAct_9fa48("183") ? decimal !== 1 : stryMutAct_9fa48("182") ? false : stryMutAct_9fa48("181") ? true : (stryCov_9fa48("181", "182", "183"), decimal === 1)) ? stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), 'centavo') : stryMutAct_9fa48("185") ? "" : (stryCov_9fa48("185"), 'centavos');
    const t = stryMutAct_9fa48("186") ? `` : (stryCov_9fa48("186"), `${pe} ${moneda} con ${pd} ${centavo}`);
    return stryMutAct_9fa48("187") ? t.charAt(0).toUpperCase() - t.slice(1) : (stryCov_9fa48("187"), (stryMutAct_9fa48("189") ? t.toUpperCase() : stryMutAct_9fa48("188") ? t.charAt(0).toLowerCase() : (stryCov_9fa48("188", "189"), t.charAt(0).toUpperCase())) + (stryMutAct_9fa48("190") ? t : (stryCov_9fa48("190"), t.slice(1))));
  }
}
function fmtN2(n: number): string {
  if (stryMutAct_9fa48("191")) {
    {}
  } else {
    stryCov_9fa48("191");
    return Number(n).toLocaleString(stryMutAct_9fa48("192") ? "" : (stryCov_9fa48("192"), 'en-US'), stryMutAct_9fa48("193") ? {} : (stryCov_9fa48("193"), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }));
  }
}
function title(tipo: TipoDocumento, modo?: ModoFacturacion): string {
  if (stryMutAct_9fa48("194")) {
    {}
  } else {
    stryCov_9fa48("194");
    if (stryMutAct_9fa48("197") ? tipo !== 'ticket' : stryMutAct_9fa48("196") ? false : stryMutAct_9fa48("195") ? true : (stryCov_9fa48("195", "196", "197"), tipo === (stryMutAct_9fa48("198") ? "" : (stryCov_9fa48("198"), 'ticket')))) return stryMutAct_9fa48("199") ? "" : (stryCov_9fa48("199"), 'TICKET');
    if (stryMutAct_9fa48("202") ? tipo !== 'nc' : stryMutAct_9fa48("201") ? false : stryMutAct_9fa48("200") ? true : (stryCov_9fa48("200", "201", "202"), tipo === (stryMutAct_9fa48("203") ? "" : (stryCov_9fa48("203"), 'nc')))) return stryMutAct_9fa48("204") ? "" : (stryCov_9fa48("204"), 'NOTA DE CREDITO');
    if (stryMutAct_9fa48("207") ? tipo === 'factura' && tipo === 'reimpresion' : stryMutAct_9fa48("206") ? false : stryMutAct_9fa48("205") ? true : (stryCov_9fa48("205", "206", "207"), (stryMutAct_9fa48("209") ? tipo !== 'factura' : stryMutAct_9fa48("208") ? false : (stryCov_9fa48("208", "209"), tipo === (stryMutAct_9fa48("210") ? "" : (stryCov_9fa48("210"), 'factura')))) || (stryMutAct_9fa48("212") ? tipo !== 'reimpresion' : stryMutAct_9fa48("211") ? false : (stryCov_9fa48("211", "212"), tipo === (stryMutAct_9fa48("213") ? "" : (stryCov_9fa48("213"), 'reimpresion')))))) {
      if (stryMutAct_9fa48("214")) {
        {}
      } else {
        stryCov_9fa48("214");
        return (stryMutAct_9fa48("217") ? modo !== 'credito' : stryMutAct_9fa48("216") ? false : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), modo === (stryMutAct_9fa48("218") ? "" : (stryCov_9fa48("218"), 'credito')))) ? stryMutAct_9fa48("219") ? "" : (stryCov_9fa48("219"), 'FACTURA DE CREDITO') : stryMutAct_9fa48("220") ? "" : (stryCov_9fa48("220"), 'FACTURA DE CONTADO');
      }
    }
    return stryMutAct_9fa48("221") ? "" : (stryCov_9fa48("221"), 'FACTURA');
  }
}
function fmtFechaDDMMAAAA(value?: string | null): string {
  if (stryMutAct_9fa48("222")) {
    {}
  } else {
    stryCov_9fa48("222");
    const s = stryMutAct_9fa48("223") ? String(value ?? '') : (stryCov_9fa48("223"), String(stryMutAct_9fa48("224") ? value && '' : (stryCov_9fa48("224"), value ?? (stryMutAct_9fa48("225") ? "Stryker was here!" : (stryCov_9fa48("225"), '')))).slice(0, 10));
    if (stryMutAct_9fa48("227") ? false : stryMutAct_9fa48("226") ? true : (stryCov_9fa48("226", "227"), (stryMutAct_9fa48("235") ? /^\d{4}-\d{2}-\D{2}$/ : stryMutAct_9fa48("234") ? /^\d{4}-\d{2}-\d$/ : stryMutAct_9fa48("233") ? /^\d{4}-\D{2}-\d{2}$/ : stryMutAct_9fa48("232") ? /^\d{4}-\d-\d{2}$/ : stryMutAct_9fa48("231") ? /^\D{4}-\d{2}-\d{2}$/ : stryMutAct_9fa48("230") ? /^\d-\d{2}-\d{2}$/ : stryMutAct_9fa48("229") ? /^\d{4}-\d{2}-\d{2}/ : stryMutAct_9fa48("228") ? /\d{4}-\d{2}-\d{2}$/ : (stryCov_9fa48("228", "229", "230", "231", "232", "233", "234", "235"), /^\d{4}-\d{2}-\d{2}$/)).test(s))) {
      if (stryMutAct_9fa48("236")) {
        {}
      } else {
        stryCov_9fa48("236");
        return stryMutAct_9fa48("237") ? `` : (stryCov_9fa48("237"), `${stryMutAct_9fa48("238") ? s : (stryCov_9fa48("238"), s.slice(8, 10))}/${stryMutAct_9fa48("239") ? s : (stryCov_9fa48("239"), s.slice(5, 7))}/${stryMutAct_9fa48("240") ? s : (stryCov_9fa48("240"), s.slice(0, 4))}`);
      }
    }
    return String(stryMutAct_9fa48("241") ? value && '' : (stryCov_9fa48("241"), value ?? (stryMutAct_9fa48("242") ? "Stryker was here!" : (stryCov_9fa48("242"), ''))));
  }
}
function esFiscal(tipo: TipoDocumento): boolean {
  if (stryMutAct_9fa48("243")) {
    {}
  } else {
    stryCov_9fa48("243");
    return stryMutAct_9fa48("246") ? (tipo === 'factura' || tipo === 'nc') && tipo === 'reimpresion' : stryMutAct_9fa48("245") ? false : stryMutAct_9fa48("244") ? true : (stryCov_9fa48("244", "245", "246"), (stryMutAct_9fa48("248") ? tipo === 'factura' && tipo === 'nc' : stryMutAct_9fa48("247") ? false : (stryCov_9fa48("247", "248"), (stryMutAct_9fa48("250") ? tipo !== 'factura' : stryMutAct_9fa48("249") ? false : (stryCov_9fa48("249", "250"), tipo === (stryMutAct_9fa48("251") ? "" : (stryCov_9fa48("251"), 'factura')))) || (stryMutAct_9fa48("253") ? tipo !== 'nc' : stryMutAct_9fa48("252") ? false : (stryCov_9fa48("252", "253"), tipo === (stryMutAct_9fa48("254") ? "" : (stryCov_9fa48("254"), 'nc')))))) || (stryMutAct_9fa48("256") ? tipo !== 'reimpresion' : stryMutAct_9fa48("255") ? false : (stryCov_9fa48("255", "256"), tipo === (stryMutAct_9fa48("257") ? "" : (stryCov_9fa48("257"), 'reimpresion')))));
  }
}
function sep(cols: number): TicketLine {
  if (stryMutAct_9fa48("258")) {
    {}
  } else {
    stryCov_9fa48("258");
    return stryMutAct_9fa48("259") ? {} : (stryCov_9fa48("259"), {
      text: (stryMutAct_9fa48("260") ? "" : (stryCov_9fa48("260"), '-')).repeat(cols)
    });
  }
}
function leftRight(cols: number, left: string, right: string): string {
  if (stryMutAct_9fa48("261")) {
    {}
  } else {
    stryCov_9fa48("261");
    const spaces = stryMutAct_9fa48("262") ? Math.min(1, cols - left.length - right.length) : (stryCov_9fa48("262"), Math.max(1, stryMutAct_9fa48("263") ? cols - left.length + right.length : (stryCov_9fa48("263"), (stryMutAct_9fa48("264") ? cols + left.length : (stryCov_9fa48("264"), cols - left.length)) - right.length)));
    return stryMutAct_9fa48("265") ? left + ' '.repeat(spaces) - right : (stryCov_9fa48("265"), (stryMutAct_9fa48("266") ? left - ' '.repeat(spaces) : (stryCov_9fa48("266"), left + (stryMutAct_9fa48("267") ? "" : (stryCov_9fa48("267"), ' ')).repeat(spaces))) + right);
  }
}
function columnWidths(cols: number): {
  total: number;
  precio: number;
  izq: number;
} {
  if (stryMutAct_9fa48("268")) {
    {}
  } else {
    stryCov_9fa48("268");
    const total = (stryMutAct_9fa48("272") ? cols < 40 : stryMutAct_9fa48("271") ? cols > 40 : stryMutAct_9fa48("270") ? false : stryMutAct_9fa48("269") ? true : (stryCov_9fa48("269", "270", "271", "272"), cols >= 40)) ? 12 : 10;
    const izq = (stryMutAct_9fa48("276") ? cols < 40 : stryMutAct_9fa48("275") ? cols > 40 : stryMutAct_9fa48("274") ? false : stryMutAct_9fa48("273") ? true : (stryCov_9fa48("273", "274", "275", "276"), cols >= 40)) ? 14 : 8;
    return stryMutAct_9fa48("277") ? {} : (stryCov_9fa48("277"), {
      total,
      precio: stryMutAct_9fa48("278") ? Math.min(1, cols - total - izq) : (stryCov_9fa48("278"), Math.max(1, stryMutAct_9fa48("279") ? cols - total + izq : (stryCov_9fa48("279"), (stryMutAct_9fa48("280") ? cols + total : (stryCov_9fa48("280"), cols - total)) - izq))),
      izq
    });
  }
}
function centered(s: string, width: number): string {
  if (stryMutAct_9fa48("281")) {
    {}
  } else {
    stryCov_9fa48("281");
    if (stryMutAct_9fa48("285") ? s.length < width : stryMutAct_9fa48("284") ? s.length > width : stryMutAct_9fa48("283") ? false : stryMutAct_9fa48("282") ? true : (stryCov_9fa48("282", "283", "284", "285"), s.length >= width)) return stryMutAct_9fa48("286") ? s : (stryCov_9fa48("286"), s.slice(0, width));
    const diff = stryMutAct_9fa48("287") ? width + s.length : (stryCov_9fa48("287"), width - s.length);
    const left = Math.floor(stryMutAct_9fa48("288") ? diff * 2 : (stryCov_9fa48("288"), diff / 2));
    return stryMutAct_9fa48("289") ? ' '.repeat(left) + s - ' '.repeat(diff - left) : (stryCov_9fa48("289"), (stryMutAct_9fa48("290") ? ' '.repeat(left) - s : (stryCov_9fa48("290"), (stryMutAct_9fa48("291") ? "" : (stryCov_9fa48("291"), ' ')).repeat(left) + s)) + (stryMutAct_9fa48("292") ? "" : (stryCov_9fa48("292"), ' ')).repeat(stryMutAct_9fa48("293") ? diff + left : (stryCov_9fa48("293"), diff - left)));
  }
}
function formatoLineaItem(cols: number, izq: string, centro: string, der: string): string {
  if (stryMutAct_9fa48("294")) {
    {}
  } else {
    stryCov_9fa48("294");
    const {
      total,
      precio,
      izq: izqW
    } = columnWidths(cols);
    const iz = (stryMutAct_9fa48("298") ? izq.length <= izqW : stryMutAct_9fa48("297") ? izq.length >= izqW : stryMutAct_9fa48("296") ? false : stryMutAct_9fa48("295") ? true : (stryCov_9fa48("295", "296", "297", "298"), izq.length > izqW)) ? stryMutAct_9fa48("299") ? izq : (stryCov_9fa48("299"), izq.slice(0, izqW)) : izq.padEnd(izqW);
    const ce = centered(centro, precio);
    const de = der.padStart(total);
    return stryMutAct_9fa48("300") ? iz + ce - de : (stryCov_9fa48("300"), (stryMutAct_9fa48("301") ? iz - ce : (stryCov_9fa48("301"), iz + ce)) + de);
  }
}
function encabezadoItems(cols: number): string {
  if (stryMutAct_9fa48("302")) {
    {}
  } else {
    stryCov_9fa48("302");
    const {
      total,
      precio,
      izq: izqW
    } = columnWidths(cols);
    const cant = stryMutAct_9fa48("303") ? "" : (stryCov_9fa48("303"), 'Cant.');
    const desc = stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), 'Precio');
    const tot = stryMutAct_9fa48("305") ? "" : (stryCov_9fa48("305"), 'Total');
    const iz = (stryMutAct_9fa48("309") ? cant.length <= izqW : stryMutAct_9fa48("308") ? cant.length >= izqW : stryMutAct_9fa48("307") ? false : stryMutAct_9fa48("306") ? true : (stryCov_9fa48("306", "307", "308", "309"), cant.length > izqW)) ? stryMutAct_9fa48("310") ? cant : (stryCov_9fa48("310"), cant.slice(0, izqW)) : cant.padEnd(izqW);
    const ce = centered(desc, precio);
    const de = tot.padStart(total);
    return stryMutAct_9fa48("311") ? iz + ce - de : (stryCov_9fa48("311"), (stryMutAct_9fa48("312") ? iz - ce : (stryCov_9fa48("312"), iz + ce)) + de);
  }
}
export function buildEncabezado(store: DocumentoInput['store'], cols: number): TicketLine[] {
  if (stryMutAct_9fa48("313")) {
    {}
  } else {
    stryCov_9fa48("313");
    const lines: TicketLine[] = stryMutAct_9fa48("314") ? ["Stryker was here"] : (stryCov_9fa48("314"), []);
    const storeName = stryMutAct_9fa48("317") ? (store.storeName || store.name) && 'Prisma' : stryMutAct_9fa48("316") ? false : stryMutAct_9fa48("315") ? true : (stryCov_9fa48("315", "316", "317"), (stryMutAct_9fa48("319") ? store.storeName && store.name : stryMutAct_9fa48("318") ? false : (stryCov_9fa48("318", "319"), store.storeName || store.name)) || (stryMutAct_9fa48("320") ? "" : (stryCov_9fa48("320"), 'Prisma')));
    lines.push(stryMutAct_9fa48("322") ? {} : (stryCov_9fa48("322"), {
      text: storeName,
      align: stryMutAct_9fa48("323") ? "" : (stryCov_9fa48("323"), 'center'),
      bold: stryMutAct_9fa48("324") ? false : (stryCov_9fa48("324"), true),
      size: stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), 'large')
    }));
    const addresses = [store.address1, store.address2, store.address3].filter(Boolean) as string[];
    if (stryMutAct_9fa48("328") ? addresses.length === 0 || store.address : stryMutAct_9fa48("327") ? false : stryMutAct_9fa48("326") ? true : (stryCov_9fa48("326", "327", "328"), (stryMutAct_9fa48("330") ? addresses.length !== 0 : stryMutAct_9fa48("329") ? true : (stryCov_9fa48("329", "330"), addresses.length === 0)) && store.address)) if (stryMutAct_9fa48("331")) {
      ;
    } else {
      stryCov_9fa48("331");
      addresses.push(store.address);
    }
    for (const a of addresses) lines.push(stryMutAct_9fa48("333") ? {} : (stryCov_9fa48("333"), {
      text: a,
      align: stryMutAct_9fa48("334") ? "" : (stryCov_9fa48("334"), 'center')
    }));
    if (stryMutAct_9fa48("336") ? false : stryMutAct_9fa48("335") ? true : (stryCov_9fa48("335", "336"), store.phone)) lines.push(stryMutAct_9fa48("338") ? {} : (stryCov_9fa48("338"), {
      text: stryMutAct_9fa48("339") ? `` : (stryCov_9fa48("339"), `Telefono: ${store.phone}`),
      align: stryMutAct_9fa48("340") ? "" : (stryCov_9fa48("340"), 'center')
    }));
    if (stryMutAct_9fa48("342") ? false : stryMutAct_9fa48("341") ? true : (stryCov_9fa48("341", "342"), store.email)) lines.push(stryMutAct_9fa48("344") ? {} : (stryCov_9fa48("344"), {
      text: stryMutAct_9fa48("345") ? `` : (stryCov_9fa48("345"), `Correo: ${store.email}`),
      align: stryMutAct_9fa48("346") ? "" : (stryCov_9fa48("346"), 'center')
    }));
    if (stryMutAct_9fa48("348") ? false : stryMutAct_9fa48("347") ? true : (stryCov_9fa48("347", "348"), store.rtn)) lines.push(stryMutAct_9fa48("350") ? {} : (stryCov_9fa48("350"), {
      text: stryMutAct_9fa48("351") ? `` : (stryCov_9fa48("351"), `RTN: ${store.rtn}`),
      align: stryMutAct_9fa48("352") ? "" : (stryCov_9fa48("352"), 'center')
    }));
    const matriz = stryMutAct_9fa48("354") ? store.casaMatriz.trim() : stryMutAct_9fa48("353") ? store.casaMatriz : (stryCov_9fa48("353", "354"), store.casaMatriz?.trim());
    if (stryMutAct_9fa48("357") ? matriz || matriz.toUpperCase() !== storeName.toUpperCase() : stryMutAct_9fa48("356") ? false : stryMutAct_9fa48("355") ? true : (stryCov_9fa48("355", "356", "357"), matriz && (stryMutAct_9fa48("359") ? matriz.toUpperCase() === storeName.toUpperCase() : stryMutAct_9fa48("358") ? true : (stryCov_9fa48("358", "359"), (stryMutAct_9fa48("360") ? matriz.toLowerCase() : (stryCov_9fa48("360"), matriz.toUpperCase())) !== (stryMutAct_9fa48("361") ? storeName.toLowerCase() : (stryCov_9fa48("361"), storeName.toUpperCase())))))) {
      if (stryMutAct_9fa48("362")) {
        {}
      } else {
        stryCov_9fa48("362");
        lines.push(stryMutAct_9fa48("364") ? {} : (stryCov_9fa48("364"), {
          text: stryMutAct_9fa48("365") ? "Stryker was here!" : (stryCov_9fa48("365"), '')
        }));
        lines.push(stryMutAct_9fa48("367") ? {} : (stryCov_9fa48("367"), {
          text: matriz,
          align: stryMutAct_9fa48("368") ? "" : (stryCov_9fa48("368"), 'center'),
          bold: stryMutAct_9fa48("369") ? false : (stryCov_9fa48("369"), true)
        }));
        for (const a of addresses) lines.push(stryMutAct_9fa48("371") ? {} : (stryCov_9fa48("371"), {
          text: a,
          align: stryMutAct_9fa48("372") ? "" : (stryCov_9fa48("372"), 'center')
        }));
      }
    }
    lines.push(stryMutAct_9fa48("374") ? {} : (stryCov_9fa48("374"), {
      text: stryMutAct_9fa48("375") ? "Stryker was here!" : (stryCov_9fa48("375"), '')
    }));
    return lines;
  }
}
export function buildDocumento(input: DocumentoInput): TicketLine[] {
  if (stryMutAct_9fa48("376")) {
    {}
  } else {
    stryCov_9fa48("376");
    const cols = stryMutAct_9fa48("379") ? input.columns && 48 : stryMutAct_9fa48("378") ? false : stryMutAct_9fa48("377") ? true : (stryCov_9fa48("377", "378", "379"), input.columns || 48);
    const lines: TicketLine[] = stryMutAct_9fa48("380") ? ["Stryker was here"] : (stryCov_9fa48("380"), []);
    const store = input.store;
    const nc = stryMutAct_9fa48("383") ? input.tipo !== 'nc' : stryMutAct_9fa48("382") ? false : stryMutAct_9fa48("381") ? true : (stryCov_9fa48("381", "382", "383"), input.tipo === (stryMutAct_9fa48("384") ? "" : (stryCov_9fa48("384"), 'nc')));

    // Encabezado
    if (stryMutAct_9fa48("385")) {
      ;
    } else {
      stryCov_9fa48("385");
      lines.push(...buildEncabezado(store, cols));
    } // Info fiscal
    if (stryMutAct_9fa48("386")) {
      ;
    } else {
      stryCov_9fa48("386");
      lines.push(sep(cols));
    }
    lines.push(stryMutAct_9fa48("388") ? {} : (stryCov_9fa48("388"), {
      text: title(input.tipo, input.modo),
      align: stryMutAct_9fa48("389") ? "" : (stryCov_9fa48("389"), 'center'),
      bold: stryMutAct_9fa48("390") ? false : (stryCov_9fa48("390"), true)
    }));
    lines.push(stryMutAct_9fa48("392") ? {} : (stryCov_9fa48("392"), {
      text: stryMutAct_9fa48("393") ? `` : (stryCov_9fa48("393"), `${nc ? stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), 'Nota Credito') : stryMutAct_9fa48("395") ? "" : (stryCov_9fa48("395"), 'Factura')}: ${input.numeroDocumento}`),
      bold: stryMutAct_9fa48("396") ? false : (stryCov_9fa48("396"), true)
    }));
    if (stryMutAct_9fa48("398") ? false : stryMutAct_9fa48("397") ? true : (stryCov_9fa48("397", "398"), esFiscal(input.tipo))) {
      if (stryMutAct_9fa48("399")) {
        {}
      } else {
        stryCov_9fa48("399");
        if (stryMutAct_9fa48("401") ? false : stryMutAct_9fa48("400") ? true : (stryCov_9fa48("400", "401"), input.cai)) lines.push(stryMutAct_9fa48("403") ? {} : (stryCov_9fa48("403"), {
          text: stryMutAct_9fa48("404") ? `` : (stryCov_9fa48("404"), `CAI: ${input.cai}`)
        }));
        if (stryMutAct_9fa48("406") ? false : stryMutAct_9fa48("405") ? true : (stryCov_9fa48("405", "406"), input.fechaVence)) lines.push(stryMutAct_9fa48("408") ? {} : (stryCov_9fa48("408"), {
          text: stryMutAct_9fa48("409") ? `` : (stryCov_9fa48("409"), `Fecha Limite: ${fmtFechaDDMMAAAA(input.fechaVence)}`)
        }));
        if (stryMutAct_9fa48("411") ? false : stryMutAct_9fa48("410") ? true : (stryCov_9fa48("410", "411"), input.rangoDesde)) lines.push(stryMutAct_9fa48("413") ? {} : (stryCov_9fa48("413"), {
          text: stryMutAct_9fa48("414") ? `` : (stryCov_9fa48("414"), `Desde: ${input.rangoDesde}`)
        }));
        if (stryMutAct_9fa48("416") ? false : stryMutAct_9fa48("415") ? true : (stryCov_9fa48("415", "416"), input.rangoHasta)) lines.push(stryMutAct_9fa48("418") ? {} : (stryCov_9fa48("418"), {
          text: stryMutAct_9fa48("419") ? `` : (stryCov_9fa48("419"), `Hasta: ${input.rangoHasta}`)
        }));
        lines.push(stryMutAct_9fa48("421") ? {} : (stryCov_9fa48("421"), {
          text: stryMutAct_9fa48("422") ? "" : (stryCov_9fa48("422"), 'No. Orden de Compra Exenta:')
        }));
        lines.push(stryMutAct_9fa48("424") ? {} : (stryCov_9fa48("424"), {
          text: stryMutAct_9fa48("425") ? "" : (stryCov_9fa48("425"), 'No. Constancia del registro Exonerado:')
        }));
        lines.push(stryMutAct_9fa48("427") ? {} : (stryCov_9fa48("427"), {
          text: stryMutAct_9fa48("428") ? "" : (stryCov_9fa48("428"), 'No. Identificativo del Registro de la SAG:')
        }));
      }
    }
    if (stryMutAct_9fa48("429")) {
      ;
    } else {
      stryCov_9fa48("429");
      lines.push(sep(cols));
    } // Cliente
    if (stryMutAct_9fa48("431") ? false : stryMutAct_9fa48("430") ? true : (stryCov_9fa48("430", "431"), input.rtnCliente)) lines.push(stryMutAct_9fa48("433") ? {} : (stryCov_9fa48("433"), {
      text: stryMutAct_9fa48("434") ? `` : (stryCov_9fa48("434"), `RTN: ${input.rtnCliente}`),
      bold: stryMutAct_9fa48("435") ? false : (stryCov_9fa48("435"), true)
    }));
    if (stryMutAct_9fa48("437") ? false : stryMutAct_9fa48("436") ? true : (stryCov_9fa48("436", "437"), input.cliente)) lines.push(stryMutAct_9fa48("439") ? {} : (stryCov_9fa48("439"), {
      text: stryMutAct_9fa48("440") ? `` : (stryCov_9fa48("440"), `Nombre: ${input.cliente}`),
      bold: stryMutAct_9fa48("441") ? false : (stryCov_9fa48("441"), true)
    }));
    if (stryMutAct_9fa48("443") ? false : stryMutAct_9fa48("442") ? true : (stryCov_9fa48("442", "443"), input.comentario)) lines.push(stryMutAct_9fa48("445") ? {} : (stryCov_9fa48("445"), {
      text: stryMutAct_9fa48("446") ? `` : (stryCov_9fa48("446"), `Comentario: ${input.comentario}`),
      bold: stryMutAct_9fa48("447") ? false : (stryCov_9fa48("447"), true)
    }));
    lines.push(stryMutAct_9fa48("449") ? {} : (stryCov_9fa48("449"), {
      text: stryMutAct_9fa48("450") ? `` : (stryCov_9fa48("450"), `Fecha: ${stryMutAct_9fa48("453") ? input.fecha && '' : stryMutAct_9fa48("452") ? false : stryMutAct_9fa48("451") ? true : (stryCov_9fa48("451", "452", "453"), input.fecha || (stryMutAct_9fa48("454") ? "Stryker was here!" : (stryCov_9fa48("454"), '')))}${input.turno ? stryMutAct_9fa48("455") ? `` : (stryCov_9fa48("455"), ` | Turno: ${input.turno}`) : stryMutAct_9fa48("456") ? "Stryker was here!" : (stryCov_9fa48("456"), '')}`)
    }));
    if (stryMutAct_9fa48("458") ? false : stryMutAct_9fa48("457") ? true : (stryCov_9fa48("457", "458"), input.cajero)) lines.push(stryMutAct_9fa48("460") ? {} : (stryCov_9fa48("460"), {
      text: stryMutAct_9fa48("461") ? `` : (stryCov_9fa48("461"), `Cajero: ${input.cajero}`)
    }));
    if (stryMutAct_9fa48("462")) {
      ;
    } else {
      stryCov_9fa48("462");
      lines.push(sep(cols));
    } // Detalle de productos
    lines.push(stryMutAct_9fa48("464") ? {} : (stryCov_9fa48("464"), {
      text: encabezadoItems(cols),
      bold: stryMutAct_9fa48("465") ? false : (stryCov_9fa48("465"), true)
    }));
    if (stryMutAct_9fa48("466")) {
      ;
    } else {
      stryCov_9fa48("466");
      lines.push(sep(cols));
    }
    for (const item of input.items) {
      if (stryMutAct_9fa48("467")) {
        {}
      } else {
        stryCov_9fa48("467");
        const desc = item.pumpNumber ? stryMutAct_9fa48("468") ? `` : (stryCov_9fa48("468"), `${item.description} | Surtidor:${item.pumpNumber}`) : item.description;
        lines.push(stryMutAct_9fa48("470") ? {} : (stryCov_9fa48("470"), {
          text: desc
        }));
        const qty = Number(item.qty).toFixed(6) + (stryMutAct_9fa48("471") ? "" : (stryCov_9fa48("471"), ' X '));
        const price = fmtN2(stryMutAct_9fa48("472") ? item.price && (item.qty ? item.total / item.qty : 0) : (stryCov_9fa48("472"), item.price ?? (item.qty ? stryMutAct_9fa48("473") ? item.total * item.qty : (stryCov_9fa48("473"), item.total / item.qty) : 0)));
        const totalStr = fmtN2(item.total);
        lines.push(stryMutAct_9fa48("475") ? {} : (stryCov_9fa48("475"), {
          text: formatoLineaItem(cols, qty, price, totalStr)
        }));
      }
    }
    if (stryMutAct_9fa48("476")) {
      ;
    } else {
      stryCov_9fa48("476");
      lines.push(sep(cols));
    } // Totales
    const exento = stryMutAct_9fa48("477") ? input.exento && 0 : (stryCov_9fa48("477"), input.exento ?? 0);
    const gravado15 = stryMutAct_9fa48("478") ? input.gravado15 && 0 : (stryCov_9fa48("478"), input.gravado15 ?? 0);
    const gravado18 = stryMutAct_9fa48("479") ? input.gravado18 && 0 : (stryCov_9fa48("479"), input.gravado18 ?? 0);
    const isv15 = stryMutAct_9fa48("480") ? input.isv15 && 0 : (stryCov_9fa48("480"), input.isv15 ?? 0);
    const isv18 = stryMutAct_9fa48("481") ? input.isv18 && 0 : (stryCov_9fa48("481"), input.isv18 ?? 0);
    const totales: string[] = stryMutAct_9fa48("482") ? [] : (stryCov_9fa48("482"), [stryMutAct_9fa48("483") ? `` : (stryCov_9fa48("483"), `Descuentos y Rebajas:       L. ${fmtN2(input.descuento)}`), stryMutAct_9fa48("484") ? "" : (stryCov_9fa48("484"), 'Importe Exonerado:   L. 0.00'), stryMutAct_9fa48("485") ? `` : (stryCov_9fa48("485"), `Importe Exento:      L. ${fmtN2(exento)}`), stryMutAct_9fa48("486") ? `` : (stryCov_9fa48("486"), `Importe Gravado 15%: L. ${fmtN2(gravado15)}`), stryMutAct_9fa48("487") ? `` : (stryCov_9fa48("487"), `Importe Gravado 18%: L. ${fmtN2(gravado18)}`), stryMutAct_9fa48("488") ? `` : (stryCov_9fa48("488"), `Sub Total:           L. ${fmtN2(input.subtotal)}`), stryMutAct_9fa48("489") ? `` : (stryCov_9fa48("489"), `Imp. S/V 15%:        L. ${fmtN2(isv15)}`), stryMutAct_9fa48("490") ? `` : (stryCov_9fa48("490"), `Imp. S/V 18%:        L. ${fmtN2(isv18)}`)]);
    for (const t of totales) lines.push(stryMutAct_9fa48("492") ? {} : (stryCov_9fa48("492"), {
      text: t,
      align: stryMutAct_9fa48("493") ? "" : (stryCov_9fa48("493"), 'right')
    }));
    if (stryMutAct_9fa48("494")) {
      ;
    } else {
      stryCov_9fa48("494");
      lines.push(sep(cols));
    }
    lines.push(stryMutAct_9fa48("496") ? {} : (stryCov_9fa48("496"), {
      text: stryMutAct_9fa48("497") ? `` : (stryCov_9fa48("497"), `Total Facturado:   L. ${fmtN2(input.total)}`),
      align: stryMutAct_9fa48("498") ? "" : (stryCov_9fa48("498"), 'right'),
      bold: stryMutAct_9fa48("499") ? false : (stryCov_9fa48("499"), true)
    }));
    if (stryMutAct_9fa48("502") ? input.cambio || input.cambio > 0 : stryMutAct_9fa48("501") ? false : stryMutAct_9fa48("500") ? true : (stryCov_9fa48("500", "501", "502"), input.cambio && (stryMutAct_9fa48("505") ? input.cambio <= 0 : stryMutAct_9fa48("504") ? input.cambio >= 0 : stryMutAct_9fa48("503") ? true : (stryCov_9fa48("503", "504", "505"), input.cambio > 0)))) {
      if (stryMutAct_9fa48("506")) {
        {}
      } else {
        stryCov_9fa48("506");
        lines.push(stryMutAct_9fa48("508") ? {} : (stryCov_9fa48("508"), {
          text: stryMutAct_9fa48("509") ? `` : (stryCov_9fa48("509"), `Recibido:           L. ${fmtN2(stryMutAct_9fa48("510") ? input.total - input.cambio : (stryCov_9fa48("510"), input.total + input.cambio))}`),
          align: stryMutAct_9fa48("511") ? "" : (stryCov_9fa48("511"), 'right')
        }));
        lines.push(stryMutAct_9fa48("513") ? {} : (stryCov_9fa48("513"), {
          text: stryMutAct_9fa48("514") ? `` : (stryCov_9fa48("514"), `Cambio:             L. ${fmtN2(input.cambio)}`),
          align: stryMutAct_9fa48("515") ? "" : (stryCov_9fa48("515"), 'right')
        }));
      }
    }

    // Formas de pago
    lines.push(stryMutAct_9fa48("517") ? {} : (stryCov_9fa48("517"), {
      text: sep(cols).text,
      align: stryMutAct_9fa48("518") ? "" : (stryCov_9fa48("518"), 'center')
    }));
    lines.push(stryMutAct_9fa48("520") ? {} : (stryCov_9fa48("520"), {
      text: stryMutAct_9fa48("521") ? "" : (stryCov_9fa48("521"), 'FORMAS DE PAGO'),
      align: stryMutAct_9fa48("522") ? "" : (stryCov_9fa48("522"), 'center'),
      bold: stryMutAct_9fa48("523") ? false : (stryCov_9fa48("523"), true)
    }));
    lines.push(stryMutAct_9fa48("525") ? {} : (stryCov_9fa48("525"), {
      text: sep(cols).text,
      align: stryMutAct_9fa48("526") ? "" : (stryCov_9fa48("526"), 'center')
    }));
    let dolarTasa: number | undefined;
    for (const p of input.pagos) {
      if (stryMutAct_9fa48("527")) {
        {}
      } else {
        stryCov_9fa48("527");
        let left = p.method;
        if (stryMutAct_9fa48("530") ? p.moneda !== 'USD' : stryMutAct_9fa48("529") ? false : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), p.moneda === (stryMutAct_9fa48("531") ? "" : (stryCov_9fa48("531"), 'USD')))) {
          if (stryMutAct_9fa48("532")) {
            {}
          } else {
            stryCov_9fa48("532");
            left = p.montoIngresado ? stryMutAct_9fa48("533") ? `` : (stryCov_9fa48("533"), `DOLAR | ${Number(p.montoIngresado).toFixed(2)}`) : p.method;
            if (stryMutAct_9fa48("535") ? false : stryMutAct_9fa48("534") ? true : (stryCov_9fa48("534", "535"), p.tasaCambio)) dolarTasa = p.tasaCambio;
          }
        }
        lines.push(stryMutAct_9fa48("537") ? {} : (stryCov_9fa48("537"), {
          text: leftRight(cols, left, fmtN2(p.amount))
        }));
      }
    }
    if (stryMutAct_9fa48("539") ? false : stryMutAct_9fa48("538") ? true : (stryCov_9fa48("538", "539"), dolarTasa)) lines.push(stryMutAct_9fa48("541") ? {} : (stryCov_9fa48("541"), {
      text: stryMutAct_9fa48("542") ? `` : (stryCov_9fa48("542"), `Tasa de cambio 1 DOLAR = ${fmtN2(dolarTasa)}`)
    }));
    if (stryMutAct_9fa48("543")) {
      ;
    } else {
      stryCov_9fa48("543");
      lines.push(sep(cols));
    } // Pie de página
    lines.push(stryMutAct_9fa48("545") ? {} : (stryCov_9fa48("545"), {
      text: stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), 'TOTAL EN LETRAS:')
    }));
    lines.push(stryMutAct_9fa48("548") ? {} : (stryCov_9fa48("548"), {
      text: numeroALetras(input.total),
      bold: stryMutAct_9fa48("549") ? false : (stryCov_9fa48("549"), true)
    }));
    if (stryMutAct_9fa48("551") ? false : stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550", "551"), input.mensajeAdicional)) {
      if (stryMutAct_9fa48("552")) {
        {}
      } else {
        stryCov_9fa48("552");
        for (const m of input.mensajeAdicional.split(stryMutAct_9fa48("553") ? "" : (stryCov_9fa48("553"), '\n'))) {
          if (stryMutAct_9fa48("554")) {
            {}
          } else {
            stryCov_9fa48("554");
            if (stryMutAct_9fa48("556") ? false : stryMutAct_9fa48("555") ? true : (stryCov_9fa48("555", "556"), m)) lines.push(stryMutAct_9fa48("558") ? {} : (stryCov_9fa48("558"), {
              text: m
            }));
          }
        }
      }
    }
    lines.push(stryMutAct_9fa48("560") ? {} : (stryCov_9fa48("560"), {
      text: stryMutAct_9fa48("561") ? "Stryker was here!" : (stryCov_9fa48("561"), '')
    }));
    lines.push(stryMutAct_9fa48("563") ? {} : (stryCov_9fa48("563"), {
      text: stryMutAct_9fa48("564") ? "" : (stryCov_9fa48("564"), 'Gracias por su compra'),
      align: stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), 'center')
    }));
    if (stryMutAct_9fa48("568") ? false : stryMutAct_9fa48("567") ? true : stryMutAct_9fa48("566") ? nc : (stryCov_9fa48("566", "567", "568"), !nc)) {
      if (stryMutAct_9fa48("569")) {
        {}
      } else {
        stryCov_9fa48("569");
        for (let i = 0; stryMutAct_9fa48("572") ? i >= 4 : stryMutAct_9fa48("571") ? i <= 4 : stryMutAct_9fa48("570") ? false : (stryCov_9fa48("570", "571", "572"), i < 4); stryMutAct_9fa48("573") ? i-- : (stryCov_9fa48("573"), i++)) lines.push(stryMutAct_9fa48("575") ? {} : (stryCov_9fa48("575"), {
          text: stryMutAct_9fa48("576") ? "Stryker was here!" : (stryCov_9fa48("576"), '')
        }));
        lines.push(stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
          text: stryMutAct_9fa48("579") ? "" : (stryCov_9fa48("579"), '_______________________________________'),
          align: stryMutAct_9fa48("580") ? "" : (stryCov_9fa48("580"), 'center')
        }));
        lines.push(stryMutAct_9fa48("582") ? {} : (stryCov_9fa48("582"), {
          text: stryMutAct_9fa48("583") ? "" : (stryCov_9fa48("583"), 'Firma Cliente'),
          align: stryMutAct_9fa48("584") ? "" : (stryCov_9fa48("584"), 'center')
        }));
      }
    }
    return lines;
  }
}
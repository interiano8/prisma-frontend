// @ts-nocheck
// Zona horaria del servidor (provista por el backend en el login).
// Se usa para formatear las fechas de cierre de turno y transacción
// siempre en la zona del servidor, sin importar la zona del cliente.
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
let serverTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone;
export function setServerTimezone(tz?: string | null): void {
  if (stryMutAct_9fa48("835")) {
    {}
  } else {
    stryCov_9fa48("835");
    if (stryMutAct_9fa48("837") ? false : stryMutAct_9fa48("836") ? true : (stryCov_9fa48("836", "837"), tz)) serverTz = tz;
  }
}
export function getServerTimezone(): string {
  if (stryMutAct_9fa48("838")) {
    {}
  } else {
    stryCov_9fa48("838");
    return serverTz;
  }
}
function parts(iso?: string): Intl.DateTimeFormatPart[] | null {
  if (stryMutAct_9fa48("839")) {
    {}
  } else {
    stryCov_9fa48("839");
    if (stryMutAct_9fa48("842") ? false : stryMutAct_9fa48("841") ? true : stryMutAct_9fa48("840") ? iso : (stryCov_9fa48("840", "841", "842"), !iso)) return null;
    const d = new Date(iso);
    if (stryMutAct_9fa48("844") ? false : stryMutAct_9fa48("843") ? true : (stryCov_9fa48("843", "844"), isNaN(d.getTime()))) return null;
    return new Intl.DateTimeFormat(stryMutAct_9fa48("845") ? "" : (stryCov_9fa48("845"), 'en-GB'), stryMutAct_9fa48("846") ? {} : (stryCov_9fa48("846"), {
      timeZone: serverTz,
      year: stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), 'numeric'),
      month: stryMutAct_9fa48("848") ? "" : (stryCov_9fa48("848"), '2-digit'),
      day: stryMutAct_9fa48("849") ? "" : (stryCov_9fa48("849"), '2-digit'),
      hour: stryMutAct_9fa48("850") ? "" : (stryCov_9fa48("850"), '2-digit'),
      minute: stryMutAct_9fa48("851") ? "" : (stryCov_9fa48("851"), '2-digit'),
      hourCycle: stryMutAct_9fa48("852") ? "" : (stryCov_9fa48("852"), 'h23')
    })).formatToParts(d);
  }
}
function get(ps: Intl.DateTimeFormatPart[], t: string): string {
  if (stryMutAct_9fa48("853")) {
    {}
  } else {
    stryCov_9fa48("853");
    return stryMutAct_9fa48("854") ? ps.find(p => p.type === t)?.value && '' : (stryCov_9fa48("854"), (stryMutAct_9fa48("855") ? ps.find(p => p.type === t).value : (stryCov_9fa48("855"), ps.find(stryMutAct_9fa48("856") ? () => undefined : (stryCov_9fa48("856"), p => stryMutAct_9fa48("859") ? p.type !== t : stryMutAct_9fa48("858") ? false : stryMutAct_9fa48("857") ? true : (stryCov_9fa48("857", "858", "859"), p.type === t)))?.value)) ?? (stryMutAct_9fa48("860") ? "Stryker was here!" : (stryCov_9fa48("860"), '')));
  }
}

/** dd/mm/aaaa hh:mm en la zona del servidor */
export function fmtServerDate(iso?: string): string {
  if (stryMutAct_9fa48("861")) {
    {}
  } else {
    stryCov_9fa48("861");
    const ps = parts(iso);
    if (stryMutAct_9fa48("864") ? false : stryMutAct_9fa48("863") ? true : stryMutAct_9fa48("862") ? ps : (stryCov_9fa48("862", "863", "864"), !ps)) return stryMutAct_9fa48("867") ? iso && '' : stryMutAct_9fa48("866") ? false : stryMutAct_9fa48("865") ? true : (stryCov_9fa48("865", "866", "867"), iso || (stryMutAct_9fa48("868") ? "Stryker was here!" : (stryCov_9fa48("868"), '')));
    return stryMutAct_9fa48("869") ? `` : (stryCov_9fa48("869"), `${get(ps, stryMutAct_9fa48("870") ? "" : (stryCov_9fa48("870"), 'day'))}/${get(ps, stryMutAct_9fa48("871") ? "" : (stryCov_9fa48("871"), 'month'))}/${get(ps, stryMutAct_9fa48("872") ? "" : (stryCov_9fa48("872"), 'year'))} ${get(ps, stryMutAct_9fa48("873") ? "" : (stryCov_9fa48("873"), 'hour'))}:${get(ps, stryMutAct_9fa48("874") ? "" : (stryCov_9fa48("874"), 'minute'))}`);
  }
}

/** aaaa-mm-dd en la zona del servidor */
export function localDateServer(iso?: string): string {
  if (stryMutAct_9fa48("875")) {
    {}
  } else {
    stryCov_9fa48("875");
    const ps = parts(iso);
    if (stryMutAct_9fa48("878") ? false : stryMutAct_9fa48("877") ? true : stryMutAct_9fa48("876") ? ps : (stryCov_9fa48("876", "877", "878"), !ps)) return stryMutAct_9fa48("879") ? "Stryker was here!" : (stryCov_9fa48("879"), '');
    return stryMutAct_9fa48("880") ? `` : (stryCov_9fa48("880"), `${get(ps, stryMutAct_9fa48("881") ? "" : (stryCov_9fa48("881"), 'year'))}-${get(ps, stryMutAct_9fa48("882") ? "" : (stryCov_9fa48("882"), 'month'))}-${get(ps, stryMutAct_9fa48("883") ? "" : (stryCov_9fa48("883"), 'day'))}`);
  }
}

/** fecha y hora larga en la zona del servidor */
export function fmtServerDateFull(iso?: string): string {
  if (stryMutAct_9fa48("884")) {
    {}
  } else {
    stryCov_9fa48("884");
    const ps = parts(iso);
    if (stryMutAct_9fa48("887") ? false : stryMutAct_9fa48("886") ? true : stryMutAct_9fa48("885") ? ps : (stryCov_9fa48("885", "886", "887"), !ps)) return stryMutAct_9fa48("888") ? "Stryker was here!" : (stryCov_9fa48("888"), '');
    const mon = stryMutAct_9fa48("891") ? ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(get(ps, 'month')) - 1] && get(ps, 'month') : stryMutAct_9fa48("890") ? false : stryMutAct_9fa48("889") ? true : (stryCov_9fa48("889", "890", "891"), (stryMutAct_9fa48("892") ? [] : (stryCov_9fa48("892"), [stryMutAct_9fa48("893") ? "" : (stryCov_9fa48("893"), 'ene'), stryMutAct_9fa48("894") ? "" : (stryCov_9fa48("894"), 'feb'), stryMutAct_9fa48("895") ? "" : (stryCov_9fa48("895"), 'mar'), stryMutAct_9fa48("896") ? "" : (stryCov_9fa48("896"), 'abr'), stryMutAct_9fa48("897") ? "" : (stryCov_9fa48("897"), 'may'), stryMutAct_9fa48("898") ? "" : (stryCov_9fa48("898"), 'jun'), stryMutAct_9fa48("899") ? "" : (stryCov_9fa48("899"), 'jul'), stryMutAct_9fa48("900") ? "" : (stryCov_9fa48("900"), 'ago'), stryMutAct_9fa48("901") ? "" : (stryCov_9fa48("901"), 'sep'), stryMutAct_9fa48("902") ? "" : (stryCov_9fa48("902"), 'oct'), stryMutAct_9fa48("903") ? "" : (stryCov_9fa48("903"), 'nov'), stryMutAct_9fa48("904") ? "" : (stryCov_9fa48("904"), 'dic')]))[stryMutAct_9fa48("905") ? Number(get(ps, 'month')) + 1 : (stryCov_9fa48("905"), Number(get(ps, stryMutAct_9fa48("906") ? "" : (stryCov_9fa48("906"), 'month'))) - 1)] || get(ps, stryMutAct_9fa48("907") ? "" : (stryCov_9fa48("907"), 'month')));
    return stryMutAct_9fa48("908") ? `` : (stryCov_9fa48("908"), `${get(ps, stryMutAct_9fa48("909") ? "" : (stryCov_9fa48("909"), 'day'))} ${mon} ${get(ps, stryMutAct_9fa48("910") ? "" : (stryCov_9fa48("910"), 'year'))} ${get(ps, stryMutAct_9fa48("911") ? "" : (stryCov_9fa48("911"), 'hour'))}:${get(ps, stryMutAct_9fa48("912") ? "" : (stryCov_9fa48("912"), 'minute'))}`);
  }
}
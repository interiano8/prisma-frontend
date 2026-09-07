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
import type { PaymentMethod, PumpTransaction } from '../api/types';
export function fmtValue(n: number | string, moneda?: string): string {
  if (stryMutAct_9fa48("689")) {
    {}
  } else {
    stryCov_9fa48("689");
    const value = Number(n);
    const prefix = moneda ? stryMutAct_9fa48("690") ? `` : (stryCov_9fa48("690"), `${moneda} `) : stryMutAct_9fa48("691") ? "Stryker was here!" : (stryCov_9fa48("691"), '');
    const num = value.toLocaleString(stryMutAct_9fa48("692") ? "" : (stryCov_9fa48("692"), 'en-US'), stryMutAct_9fa48("693") ? {} : (stryCov_9fa48("693"), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }));
    return stryMutAct_9fa48("694") ? prefix - num : (stryCov_9fa48("694"), prefix + num);
  }
}
export function fmtMoney(n: number | string): string {
  if (stryMutAct_9fa48("695")) {
    {}
  } else {
    stryCov_9fa48("695");
    return Number(n).toFixed(2);
  }
}
export function round2(n: number): number {
  if (stryMutAct_9fa48("696")) {
    {}
  } else {
    stryCov_9fa48("696");
    return stryMutAct_9fa48("697") ? Math.round((Number(n) + Number.EPSILON) * 100) * 100 : (stryCov_9fa48("697"), Math.round(stryMutAct_9fa48("698") ? (Number(n) + Number.EPSILON) / 100 : (stryCov_9fa48("698"), (stryMutAct_9fa48("699") ? Number(n) - Number.EPSILON : (stryCov_9fa48("699"), Number(n) + Number.EPSILON)) * 100)) / 100);
  }
}
export function errMsg(e: any): string {
  if (stryMutAct_9fa48("700")) {
    {}
  } else {
    stryCov_9fa48("700");
    return (stryMutAct_9fa48("703") ? typeof e?.message !== 'string' : stryMutAct_9fa48("702") ? false : stryMutAct_9fa48("701") ? true : (stryCov_9fa48("701", "702", "703"), typeof (stryMutAct_9fa48("704") ? e.message : (stryCov_9fa48("704"), e?.message)) === (stryMutAct_9fa48("705") ? "" : (stryCov_9fa48("705"), 'string')))) ? e.message : stryMutAct_9fa48("706") ? "" : (stryCov_9fa48("706"), 'Error desconocido');
  }
}
export function fmtQty(n: number): string {
  if (stryMutAct_9fa48("707")) {
    {}
  } else {
    stryCov_9fa48("707");
    return Number(n).toFixed(6);
  }
}
export function fmtFechaHora(fecha: string, hora: string): string {
  if (stryMutAct_9fa48("708")) {
    {}
  } else {
    stryCov_9fa48("708");
    const f = (stryMutAct_9fa48("711") ? fecha || fecha.length === 8 : stryMutAct_9fa48("710") ? false : stryMutAct_9fa48("709") ? true : (stryCov_9fa48("709", "710", "711"), fecha && (stryMutAct_9fa48("713") ? fecha.length !== 8 : stryMutAct_9fa48("712") ? true : (stryCov_9fa48("712", "713"), fecha.length === 8)))) ? stryMutAct_9fa48("714") ? `` : (stryCov_9fa48("714"), `${stryMutAct_9fa48("715") ? fecha : (stryCov_9fa48("715"), fecha.slice(0, 4))}-${stryMutAct_9fa48("716") ? fecha : (stryCov_9fa48("716"), fecha.slice(4, 6))}-${stryMutAct_9fa48("717") ? fecha : (stryCov_9fa48("717"), fecha.slice(6, 8))}`) : fecha;
    const h = (stryMutAct_9fa48("720") ? hora || hora.length === 6 : stryMutAct_9fa48("719") ? false : stryMutAct_9fa48("718") ? true : (stryCov_9fa48("718", "719", "720"), hora && (stryMutAct_9fa48("722") ? hora.length !== 6 : stryMutAct_9fa48("721") ? true : (stryCov_9fa48("721", "722"), hora.length === 6)))) ? stryMutAct_9fa48("723") ? `` : (stryCov_9fa48("723"), `${stryMutAct_9fa48("724") ? hora : (stryCov_9fa48("724"), hora.slice(0, 2))}:${stryMutAct_9fa48("725") ? hora : (stryCov_9fa48("725"), hora.slice(2, 4))}:${stryMutAct_9fa48("726") ? hora : (stryCov_9fa48("726"), hora.slice(4, 6))}`) : hora;
    return stryMutAct_9fa48("727") ? [f, h].join(' ') : (stryCov_9fa48("727"), (stryMutAct_9fa48("728") ? [] : (stryCov_9fa48("728"), [f, h])).filter(Boolean).join(stryMutAct_9fa48("729") ? "" : (stryCov_9fa48("729"), ' ')));
  }
}
export const CATEGORY_LABELS: Record<string, string> = stryMutAct_9fa48("730") ? {} : (stryCov_9fa48("730"), {
  EFECTIVO: stryMutAct_9fa48("731") ? "" : (stryCov_9fa48("731"), 'Efectivo'),
  TARJETA: stryMutAct_9fa48("732") ? "" : (stryCov_9fa48("732"), 'Tarjeta'),
  CREDITO: stryMutAct_9fa48("733") ? "" : (stryCov_9fa48("733"), 'Crédito'),
  SALIDA: stryMutAct_9fa48("734") ? "" : (stryCov_9fa48("734"), 'Salida'),
  TRANSFERENCIA: stryMutAct_9fa48("735") ? "" : (stryCov_9fa48("735"), 'Transferencia'),
  PAGO_APP: stryMutAct_9fa48("736") ? "" : (stryCov_9fa48("736"), 'Pago por App'),
  FIDELIZACION: stryMutAct_9fa48("737") ? "" : (stryCov_9fa48("737"), 'Fidelización')
});
export function groupPaymentMethods(methods: PaymentMethod[]): [string, PaymentMethod[]][] {
  if (stryMutAct_9fa48("738")) {
    {}
  } else {
    stryCov_9fa48("738");
    const map = new Map<string, PaymentMethod[]>();
    for (const m of methods) {
      if (stryMutAct_9fa48("739")) {
        {}
      } else {
        stryCov_9fa48("739");
        const arr = stryMutAct_9fa48("742") ? map.get(m.categoria) && [] : stryMutAct_9fa48("741") ? false : stryMutAct_9fa48("740") ? true : (stryCov_9fa48("740", "741", "742"), map.get(m.categoria) || (stryMutAct_9fa48("743") ? ["Stryker was here"] : (stryCov_9fa48("743"), [])));
        if (stryMutAct_9fa48("744")) {
          ;
        } else {
          stryCov_9fa48("744");
          arr.push(m);
        }
        if (stryMutAct_9fa48("745")) {
          ;
        } else {
          stryCov_9fa48("745");
          map.set(m.categoria, arr);
        }
      }
    }
    return stryMutAct_9fa48("746") ? [] : (stryCov_9fa48("746"), [...map.entries()]);
  }
}
export function paymentImage(imagen: string | null, backendUrl: string): string | null {
  if (stryMutAct_9fa48("747")) {
    {}
  } else {
    stryCov_9fa48("747");
    if (stryMutAct_9fa48("750") ? false : stryMutAct_9fa48("749") ? true : stryMutAct_9fa48("748") ? imagen : (stryCov_9fa48("748", "749", "750"), !imagen)) return null;
    if (stryMutAct_9fa48("753") ? imagen.startsWith('http') && imagen.startsWith('data:') : stryMutAct_9fa48("752") ? false : stryMutAct_9fa48("751") ? true : (stryCov_9fa48("751", "752", "753"), (stryMutAct_9fa48("754") ? imagen.endsWith('http') : (stryCov_9fa48("754"), imagen.startsWith(stryMutAct_9fa48("755") ? "" : (stryCov_9fa48("755"), 'http')))) || (stryMutAct_9fa48("756") ? imagen.endsWith('data:') : (stryCov_9fa48("756"), imagen.startsWith(stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), 'data:')))))) return imagen;
    if (stryMutAct_9fa48("760") ? imagen.endsWith('/') : stryMutAct_9fa48("759") ? false : stryMutAct_9fa48("758") ? true : (stryCov_9fa48("758", "759", "760"), imagen.startsWith(stryMutAct_9fa48("761") ? "" : (stryCov_9fa48("761"), '/')))) return stryMutAct_9fa48("762") ? `` : (stryCov_9fa48("762"), `${backendUrl}${imagen}`);
    return stryMutAct_9fa48("763") ? `` : (stryCov_9fa48("763"), `data:image/png;base64,${imagen}`);
  }
}
export type TxStatus = 'facturada' | 'atrasada' | 'pendiente';
export function txStatus(t: PumpTransaction, minutosAtrasada: number): TxStatus {
  if (stryMutAct_9fa48("764")) {
    {}
  } else {
    stryCov_9fa48("764");
    if (stryMutAct_9fa48("767") ? t.estado !== 'Facturado' : stryMutAct_9fa48("766") ? false : stryMutAct_9fa48("765") ? true : (stryCov_9fa48("765", "766", "767"), t.estado === (stryMutAct_9fa48("768") ? "" : (stryCov_9fa48("768"), 'Facturado')))) return stryMutAct_9fa48("769") ? "" : (stryCov_9fa48("769"), 'facturada');
    if (stryMutAct_9fa48("772") ? t.date || minutosAtrasada > 0 : stryMutAct_9fa48("771") ? false : stryMutAct_9fa48("770") ? true : (stryCov_9fa48("770", "771", "772"), t.date && (stryMutAct_9fa48("775") ? minutosAtrasada <= 0 : stryMutAct_9fa48("774") ? minutosAtrasada >= 0 : stryMutAct_9fa48("773") ? true : (stryCov_9fa48("773", "774", "775"), minutosAtrasada > 0)))) {
      if (stryMutAct_9fa48("776")) {
        {}
      } else {
        stryCov_9fa48("776");
        const ageMin = stryMutAct_9fa48("777") ? (Date.now() - new Date(t.date).getTime()) * 60000 : (stryCov_9fa48("777"), (stryMutAct_9fa48("778") ? Date.now() + new Date(t.date).getTime() : (stryCov_9fa48("778"), Date.now() - new Date(t.date).getTime())) / 60000);
        if (stryMutAct_9fa48("782") ? ageMin <= minutosAtrasada : stryMutAct_9fa48("781") ? ageMin >= minutosAtrasada : stryMutAct_9fa48("780") ? false : stryMutAct_9fa48("779") ? true : (stryCov_9fa48("779", "780", "781", "782"), ageMin > minutosAtrasada)) return stryMutAct_9fa48("783") ? "" : (stryCov_9fa48("783"), 'atrasada');
      }
    }
    return stryMutAct_9fa48("784") ? "" : (stryCov_9fa48("784"), 'pendiente');
  }
}
export function taxRate(vatGroup: string): number {
  if (stryMutAct_9fa48("785")) {
    {}
  } else {
    stryCov_9fa48("785");
    if (stryMutAct_9fa48("789") ? vatGroup.toUpperCase().includes('18') : stryMutAct_9fa48("788") ? vatGroup?.toLowerCase().includes('18') : stryMutAct_9fa48("787") ? false : stryMutAct_9fa48("786") ? true : (stryCov_9fa48("786", "787", "788", "789"), vatGroup?.toUpperCase().includes(stryMutAct_9fa48("790") ? "" : (stryCov_9fa48("790"), '18')))) return 0.18;
    if (stryMutAct_9fa48("794") ? vatGroup.toUpperCase().includes('15') : stryMutAct_9fa48("793") ? vatGroup?.toLowerCase().includes('15') : stryMutAct_9fa48("792") ? false : stryMutAct_9fa48("791") ? true : (stryCov_9fa48("791", "792", "793", "794"), vatGroup?.toUpperCase().includes(stryMutAct_9fa48("795") ? "" : (stryCov_9fa48("795"), '15')))) return 0.15;
    return 0;
  }
}
export function taxLabel(vatGroup: string): string {
  if (stryMutAct_9fa48("796")) {
    {}
  } else {
    stryCov_9fa48("796");
    const g = stryMutAct_9fa48("797") ? (vatGroup || '').toLowerCase() : (stryCov_9fa48("797"), (stryMutAct_9fa48("800") ? vatGroup && '' : stryMutAct_9fa48("799") ? false : stryMutAct_9fa48("798") ? true : (stryCov_9fa48("798", "799", "800"), vatGroup || (stryMutAct_9fa48("801") ? "Stryker was here!" : (stryCov_9fa48("801"), '')))).toUpperCase());
    if (stryMutAct_9fa48("804") ? !g && g.includes('EXENTO') : stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803", "804"), (stryMutAct_9fa48("805") ? g : (stryCov_9fa48("805"), !g)) || g.includes(stryMutAct_9fa48("806") ? "" : (stryCov_9fa48("806"), 'EXENTO')))) return stryMutAct_9fa48("807") ? "" : (stryCov_9fa48("807"), 'Exento');
    const rate = taxRate(vatGroup);
    return (stryMutAct_9fa48("811") ? rate <= 0 : stryMutAct_9fa48("810") ? rate >= 0 : stryMutAct_9fa48("809") ? false : stryMutAct_9fa48("808") ? true : (stryCov_9fa48("808", "809", "810", "811"), rate > 0)) ? stryMutAct_9fa48("812") ? `` : (stryCov_9fa48("812"), `ISV ${Math.round(stryMutAct_9fa48("813") ? rate / 100 : (stryCov_9fa48("813"), rate * 100))}%`) : vatGroup;
  }
}
export function cartItemTint(vatGroup: string): string {
  if (stryMutAct_9fa48("814")) {
    {}
  } else {
    stryCov_9fa48("814");
    return (stryMutAct_9fa48("815") ? (vatGroup || '').toLowerCase().includes('EXENTO') : (stryCov_9fa48("815"), (stryMutAct_9fa48("818") ? vatGroup && '' : stryMutAct_9fa48("817") ? false : stryMutAct_9fa48("816") ? true : (stryCov_9fa48("816", "817", "818"), vatGroup || (stryMutAct_9fa48("819") ? "Stryker was here!" : (stryCov_9fa48("819"), '')))).toUpperCase().includes(stryMutAct_9fa48("820") ? "" : (stryCov_9fa48("820"), 'EXENTO')))) ? stryMutAct_9fa48("821") ? "" : (stryCov_9fa48("821"), 'border-success/30 bg-success/5') : stryMutAct_9fa48("822") ? "" : (stryCov_9fa48("822"), 'border-accent/25 bg-accent/5');
  }
}
export function cartItemVatBadge(vatGroup: string): string {
  if (stryMutAct_9fa48("823")) {
    {}
  } else {
    stryCov_9fa48("823");
    return (stryMutAct_9fa48("824") ? (vatGroup || '').toLowerCase().includes('EXENTO') : (stryCov_9fa48("824"), (stryMutAct_9fa48("827") ? vatGroup && '' : stryMutAct_9fa48("826") ? false : stryMutAct_9fa48("825") ? true : (stryCov_9fa48("825", "826", "827"), vatGroup || (stryMutAct_9fa48("828") ? "Stryker was here!" : (stryCov_9fa48("828"), '')))).toUpperCase().includes(stryMutAct_9fa48("829") ? "" : (stryCov_9fa48("829"), 'EXENTO')))) ? stryMutAct_9fa48("830") ? "" : (stryCov_9fa48("830"), 'bg-success/10 text-success') : stryMutAct_9fa48("831") ? "" : (stryCov_9fa48("831"), 'bg-accent/10 text-accent');
  }
}
let uidCounter = 0;
export function nextUid(): string {
  if (stryMutAct_9fa48("832")) {
    {}
  } else {
    stryCov_9fa48("832");
    stryMutAct_9fa48("833") ? uidCounter -= 1 : (stryCov_9fa48("833"), uidCounter += 1);
    return stryMutAct_9fa48("834") ? `` : (stryCov_9fa48("834"), `${Date.now()}-${uidCounter}`);
  }
}
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
import type { CartItem, CartPayment, Product, PumpTransaction } from '../api/types';
import { fmtFechaHora, nextUid, round2, taxRate } from './pos-logic';
export interface Totals {
  total: number;
  discount: number;
  tax: number;
  subtotal: number;
}
export function taxOf(total: number, vatGroup: string): number {
  if (stryMutAct_9fa48("585")) {
    {}
  } else {
    stryCov_9fa48("585");
    const rate = taxRate(vatGroup);
    if (stryMutAct_9fa48("589") ? rate > 0 : stryMutAct_9fa48("588") ? rate < 0 : stryMutAct_9fa48("587") ? false : stryMutAct_9fa48("586") ? true : (stryCov_9fa48("586", "587", "588", "589"), rate <= 0)) return 0;
    return round2(stryMutAct_9fa48("590") ? total + total / (1 + rate) : (stryCov_9fa48("590"), total - (stryMutAct_9fa48("591") ? total * (1 + rate) : (stryCov_9fa48("591"), total / (stryMutAct_9fa48("592") ? 1 - rate : (stryCov_9fa48("592"), 1 + rate))))));
  }
}
export function productToCartItem(p: Product): CartItem {
  if (stryMutAct_9fa48("593")) {
    {}
  } else {
    stryCov_9fa48("593");
    return stryMutAct_9fa48("594") ? {} : (stryCov_9fa48("594"), {
      code: p.code,
      description: p.description,
      qty: 1,
      price: p.unitPrice,
      tax: taxOf(p.unitPrice, p.vatGroup),
      discount: 0,
      total: round2(p.unitPrice),
      vatGroup: p.vatGroup,
      uid: nextUid()
    });
  }
}
export function addProductToCart(cart: CartItem[], p: Product): CartItem[] {
  if (stryMutAct_9fa48("595")) {
    {}
  } else {
    stryCov_9fa48("595");
    const idx = cart.findIndex(stryMutAct_9fa48("596") ? () => undefined : (stryCov_9fa48("596"), i => stryMutAct_9fa48("599") ? i.code === p.code || !i.saleId : stryMutAct_9fa48("598") ? false : stryMutAct_9fa48("597") ? true : (stryCov_9fa48("597", "598", "599"), (stryMutAct_9fa48("601") ? i.code !== p.code : stryMutAct_9fa48("600") ? true : (stryCov_9fa48("600", "601"), i.code === p.code)) && (stryMutAct_9fa48("602") ? i.saleId : (stryCov_9fa48("602"), !i.saleId)))));
    if (stryMutAct_9fa48("606") ? idx < 0 : stryMutAct_9fa48("605") ? idx > 0 : stryMutAct_9fa48("604") ? false : stryMutAct_9fa48("603") ? true : (stryCov_9fa48("603", "604", "605", "606"), idx >= 0)) {
      if (stryMutAct_9fa48("607")) {
        {}
      } else {
        stryCov_9fa48("607");
        const next = stryMutAct_9fa48("608") ? [] : (stryCov_9fa48("608"), [...cart]);
        const item = next[idx];
        stryMutAct_9fa48("609") ? item.qty -= 1 : (stryCov_9fa48("609"), item.qty += 1);
        item.total = round2(stryMutAct_9fa48("610") ? item.price / item.qty : (stryCov_9fa48("610"), item.price * item.qty));
        item.tax = taxOf(item.total, item.vatGroup);
        return next;
      }
    }
    return stryMutAct_9fa48("611") ? [] : (stryCov_9fa48("611"), [...cart, productToCartItem(p)]);
  }
}
export function fuelToCartItem(tx: PumpTransaction, vatGroup: string, productName: string): CartItem {
  if (stryMutAct_9fa48("612")) {
    {}
  } else {
    stryCov_9fa48("612");
    return stryMutAct_9fa48("613") ? {} : (stryCov_9fa48("613"), {
      code: stryMutAct_9fa48("616") ? tx.codigo && `GAS-${tx.pumpNumber}` : stryMutAct_9fa48("615") ? false : stryMutAct_9fa48("614") ? true : (stryCov_9fa48("614", "615", "616"), tx.codigo || (stryMutAct_9fa48("617") ? `` : (stryCov_9fa48("617"), `GAS-${tx.pumpNumber}`))),
      description: productName,
      combustible: productName,
      qty: tx.cantidad,
      price: tx.precio,
      tax: taxOf(tx.amount, vatGroup),
      discount: 0,
      total: round2(tx.amount),
      vatGroup,
      saleId: tx.saleId,
      pumpNumber: tx.pumpNumber,
      hoseNumber: tx.hoseNumber,
      unidad: tx.unidad,
      fechaHora: fmtFechaHora(tx.fecha, tx.hora),
      uid: nextUid()
    });
  }
}
export function appendToCart(cart: CartItem[], item: CartItem): CartItem[] {
  if (stryMutAct_9fa48("618")) {
    {}
  } else {
    stryCov_9fa48("618");
    return stryMutAct_9fa48("619") ? [] : (stryCov_9fa48("619"), [...cart, item]);
  }
}
export function changeQtyInCart(cart: CartItem[], index: number, delta: number): CartItem[] {
  if (stryMutAct_9fa48("620")) {
    {}
  } else {
    stryCov_9fa48("620");
    return cart.map((item, i) => {
      if (stryMutAct_9fa48("621")) {
        {}
      } else {
        stryCov_9fa48("621");
        if (stryMutAct_9fa48("624") ? i !== index && item.saleId : stryMutAct_9fa48("623") ? false : stryMutAct_9fa48("622") ? true : (stryCov_9fa48("622", "623", "624"), (stryMutAct_9fa48("626") ? i === index : stryMutAct_9fa48("625") ? false : (stryCov_9fa48("625", "626"), i !== index)) || item.saleId)) return item;
        const qty = stryMutAct_9fa48("627") ? Math.min(1, item.qty + delta) : (stryCov_9fa48("627"), Math.max(1, stryMutAct_9fa48("628") ? item.qty - delta : (stryCov_9fa48("628"), item.qty + delta)));
        const total = stryMutAct_9fa48("629") ? item.price / qty : (stryCov_9fa48("629"), item.price * qty);
        return stryMutAct_9fa48("630") ? {} : (stryCov_9fa48("630"), {
          ...item,
          qty,
          total,
          tax: taxOf(total, item.vatGroup)
        });
      }
    });
  }
}
export function removeFromCart(cart: CartItem[], index: number): CartItem[] {
  if (stryMutAct_9fa48("631")) {
    {}
  } else {
    stryCov_9fa48("631");
    return stryMutAct_9fa48("632") ? cart : (stryCov_9fa48("632"), cart.filter(stryMutAct_9fa48("633") ? () => undefined : (stryCov_9fa48("633"), (_, i) => stryMutAct_9fa48("636") ? i === index : stryMutAct_9fa48("635") ? false : stryMutAct_9fa48("634") ? true : (stryCov_9fa48("634", "635", "636"), i !== index))));
  }
}
export function applyDiscount(item: CartItem, d: any, disabled: boolean): CartItem {
  if (stryMutAct_9fa48("637")) {
    {}
  } else {
    stryCov_9fa48("637");
    if (stryMutAct_9fa48("640") ? (disabled || !d) && !d.hasDiscount : stryMutAct_9fa48("639") ? false : stryMutAct_9fa48("638") ? true : (stryCov_9fa48("638", "639", "640"), (stryMutAct_9fa48("642") ? disabled && !d : stryMutAct_9fa48("641") ? false : (stryCov_9fa48("641", "642"), disabled || (stryMutAct_9fa48("643") ? d : (stryCov_9fa48("643"), !d)))) || (stryMutAct_9fa48("644") ? d.hasDiscount : (stryCov_9fa48("644"), !d.hasDiscount)))) return item;
    return stryMutAct_9fa48("645") ? {} : (stryCov_9fa48("645"), {
      ...item,
      discount: round2(stryMutAct_9fa48("648") ? Number(d.totalDiscount) && 0 : stryMutAct_9fa48("647") ? false : stryMutAct_9fa48("646") ? true : (stryCov_9fa48("646", "647", "648"), Number(d.totalDiscount) || 0)),
      total: round2(stryMutAct_9fa48("651") ? Number(d.finalTotal) && item.total : stryMutAct_9fa48("650") ? false : stryMutAct_9fa48("649") ? true : (stryCov_9fa48("649", "650", "651"), Number(d.finalTotal) || item.total)),
      tax: round2(stryMutAct_9fa48("654") ? Number(d.totalIsv) && item.tax : stryMutAct_9fa48("653") ? false : stryMutAct_9fa48("652") ? true : (stryCov_9fa48("652", "653", "654"), Number(d.totalIsv) || item.tax)),
      discountPercentage: stryMutAct_9fa48("657") ? Number(d.discountPercentage) && 0 : stryMutAct_9fa48("656") ? false : stryMutAct_9fa48("655") ? true : (stryCov_9fa48("655", "656", "657"), Number(d.discountPercentage) || 0)
    });
  }
}
export function computeEffectiveCart(cart: CartItem[], discountMap: Record<string, any>, discountOff: Set<string>): CartItem[] {
  if (stryMutAct_9fa48("658")) {
    {}
  } else {
    stryCov_9fa48("658");
    return cart.map(item => {
      if (stryMutAct_9fa48("659")) {
        {}
      } else {
        stryCov_9fa48("659");
        const disabled = stryMutAct_9fa48("662") ? !item.uid && discountOff.has(item.uid) : stryMutAct_9fa48("661") ? false : stryMutAct_9fa48("660") ? true : (stryCov_9fa48("660", "661", "662"), (stryMutAct_9fa48("663") ? item.uid : (stryCov_9fa48("663"), !item.uid)) || discountOff.has(item.uid));
        return applyDiscount(item, discountMap[item.code], disabled);
      }
    });
  }
}
export function computeTotals(effectiveCart: CartItem[]): Totals {
  if (stryMutAct_9fa48("664")) {
    {}
  } else {
    stryCov_9fa48("664");
    const total = effectiveCart.reduce(stryMutAct_9fa48("665") ? () => undefined : (stryCov_9fa48("665"), (a, i) => stryMutAct_9fa48("666") ? a - i.total : (stryCov_9fa48("666"), a + i.total)), 0);
    const discount = effectiveCart.reduce(stryMutAct_9fa48("667") ? () => undefined : (stryCov_9fa48("667"), (a, i) => stryMutAct_9fa48("668") ? a - i.discount : (stryCov_9fa48("668"), a + i.discount)), 0);
    const tax = effectiveCart.reduce(stryMutAct_9fa48("669") ? () => undefined : (stryCov_9fa48("669"), (a, i) => stryMutAct_9fa48("670") ? a - i.tax : (stryCov_9fa48("670"), a + i.tax)), 0);
    return stryMutAct_9fa48("671") ? {} : (stryCov_9fa48("671"), {
      total: round2(total),
      discount: round2(discount),
      tax: round2(tax),
      subtotal: round2(stryMutAct_9fa48("672") ? total + tax : (stryCov_9fa48("672"), total - tax))
    });
  }
}
export function computePaidChange(payments: CartPayment[], total: number): {
  paid: number;
  change: number;
} {
  if (stryMutAct_9fa48("673")) {
    {}
  } else {
    stryCov_9fa48("673");
    const paid = round2(payments.reduce((a, p) => {
      if (stryMutAct_9fa48("674")) {
        {}
      } else {
        stryCov_9fa48("674");
        const amt = stryMutAct_9fa48("677") ? Number(p.amount) && 0 : stryMutAct_9fa48("676") ? false : stryMutAct_9fa48("675") ? true : (stryCov_9fa48("675", "676", "677"), Number(p.amount) || 0);
        const hnl = (stryMutAct_9fa48("680") ? p.moneda === 'USD' || p.tasaCambio : stryMutAct_9fa48("679") ? false : stryMutAct_9fa48("678") ? true : (stryCov_9fa48("678", "679", "680"), (stryMutAct_9fa48("682") ? p.moneda !== 'USD' : stryMutAct_9fa48("681") ? true : (stryCov_9fa48("681", "682"), p.moneda === (stryMutAct_9fa48("683") ? "" : (stryCov_9fa48("683"), 'USD')))) && p.tasaCambio)) ? stryMutAct_9fa48("684") ? amt / p.tasaCambio : (stryCov_9fa48("684"), amt * p.tasaCambio) : amt;
        return stryMutAct_9fa48("685") ? a - hnl : (stryCov_9fa48("685"), a + hnl);
      }
    }, 0));
    return stryMutAct_9fa48("686") ? {} : (stryCov_9fa48("686"), {
      paid,
      change: stryMutAct_9fa48("687") ? Math.min(0, round2(paid - total)) : (stryCov_9fa48("687"), Math.max(0, round2(stryMutAct_9fa48("688") ? paid + total : (stryCov_9fa48("688"), paid - total))))
    });
  }
}
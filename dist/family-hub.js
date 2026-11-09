/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Rt = globalThis, ti = Rt.ShadowRoot && (Rt.ShadyCSS === void 0 || Rt.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, ii = Symbol(), ri = /* @__PURE__ */ new WeakMap();
let Ii = class {
  constructor(t, i, a) {
    if (this._$cssResult$ = !0, a !== ii) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = i;
  }
  get styleSheet() {
    let t = this.o;
    const i = this.t;
    if (ti && t === void 0) {
      const a = i !== void 0 && i.length === 1;
      a && (t = ri.get(i)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), a && ri.set(i, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const B = (e) => new Ii(typeof e == "string" ? e : e + "", void 0, ii), b = (e, ...t) => {
  const i = e.length === 1 ? e[0] : t.reduce((a, o, s) => a + ((p) => {
    if (p._$cssResult$ === !0) return p.cssText;
    if (typeof p == "number") return p;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + p + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + e[s + 1], e[0]);
  return new Ii(i, e, ii);
}, pa = (e, t) => {
  if (ti) e.adoptedStyleSheets = t.map((i) => i instanceof CSSStyleSheet ? i : i.styleSheet);
  else for (const i of t) {
    const a = document.createElement("style"), o = Rt.litNonce;
    o !== void 0 && a.setAttribute("nonce", o), a.textContent = i.cssText, e.appendChild(a);
  }
}, li = ti ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let i = "";
  for (const a of t.cssRules) i += a.cssText;
  return B(i);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: ra, defineProperty: la, getOwnPropertyDescriptor: na, getOwnPropertyNames: Ka, getOwnPropertySymbols: Ua, getPrototypeOf: ca } = Object, Mt = globalThis, ni = Mt.trustedTypes, ma = ni ? ni.emptyScript : "", Aa = Mt.reactiveElementPolyfillSupport, pt = (e, t) => e, vt = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? ma : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let i = e;
  switch (t) {
    case Boolean:
      i = e !== null;
      break;
    case Number:
      i = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        i = JSON.parse(e);
      } catch {
        i = null;
      }
  }
  return i;
} }, Xi = (e, t) => !ra(e, t), Ki = { attribute: !0, type: String, converter: vt, reflect: !1, useDefault: !1, hasChanged: Xi };
Symbol.metadata ??= Symbol("metadata"), Mt.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let D = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, i = Ki) {
    if (i.state && (i.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((i = Object.create(i)).wrapped = !0), this.elementProperties.set(t, i), !i.noAccessor) {
      const a = Symbol(), o = this.getPropertyDescriptor(t, a, i);
      o !== void 0 && la(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, i, a) {
    const { get: o, set: s } = na(this.prototype, t) ?? { get() {
      return this[i];
    }, set(p) {
      this[i] = p;
    } };
    return { get: o, set(p) {
      const l = o?.call(this);
      s?.call(this, p), this.requestUpdate(t, l, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Ki;
  }
  static _$Ei() {
    if (this.hasOwnProperty(pt("elementProperties"))) return;
    const t = ca(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(pt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(pt("properties"))) {
      const i = this.properties, a = [...Ka(i), ...Ua(i)];
      for (const o of a) this.createProperty(o, i[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const i = litPropertyMetadata.get(t);
      if (i !== void 0) for (const [a, o] of i) this.elementProperties.set(a, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [i, a] of this.elementProperties) {
      const o = this._$Eu(i, a);
      o !== void 0 && this._$Eh.set(o, i);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const i = [];
    if (Array.isArray(t)) {
      const a = new Set(t.flat(1 / 0).reverse());
      for (const o of a) i.unshift(li(o));
    } else t !== void 0 && i.push(li(t));
    return i;
  }
  static _$Eu(t, i) {
    const a = i.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
  }
  addController(t) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t), this.renderRoot !== void 0 && this.isConnected && t.hostConnected?.();
  }
  removeController(t) {
    this._$EO?.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), i = this.constructor.elementProperties;
    for (const a of i.keys()) this.hasOwnProperty(a) && (t.set(a, this[a]), delete this[a]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return pa(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, i, a) {
    this._$AK(t, a);
  }
  _$ET(t, i) {
    const a = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, a);
    if (o !== void 0 && a.reflect === !0) {
      const s = (a.converter?.toAttribute !== void 0 ? a.converter : vt).toAttribute(i, a.type);
      this._$Em = t, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(t, i) {
    const a = this.constructor, o = a._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = a.getPropertyOptions(o), p = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : vt;
      this._$Em = o;
      const l = p.fromAttribute(i, s.type);
      this[o] = l ?? this._$Ej?.get(o) ?? l, this._$Em = null;
    }
  }
  requestUpdate(t, i, a, o = !1, s) {
    if (t !== void 0) {
      const p = this.constructor;
      if (o === !1 && (s = this[t]), a ??= p.getPropertyOptions(t), !((a.hasChanged ?? Xi)(s, i) || a.useDefault && a.reflect && s === this._$Ej?.get(t) && !this.hasAttribute(p._$Eu(t, a)))) return;
      this.C(t, i, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, i, { useDefault: a, reflect: o, wrapped: s }, p) {
    a && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, p ?? i ?? this[t]), s !== !0 || p !== void 0) || (this._$AL.has(t) || (this.hasUpdated || a || (i = void 0), this._$AL.set(t, i)), o === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (i) {
      Promise.reject(i);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [o, s] of this._$Ep) this[o] = s;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [o, s] of a) {
        const { wrapped: p } = s, l = this[o];
        p !== !0 || this._$AL.has(o) || l === void 0 || this.C(o, void 0, s, l);
      }
    }
    let t = !1;
    const i = this._$AL;
    try {
      t = this.shouldUpdate(i), t ? (this.willUpdate(i), this._$EO?.forEach((a) => a.hostUpdate?.()), this.update(i)) : this._$EM();
    } catch (a) {
      throw t = !1, this._$EM(), a;
    }
    t && this._$AE(i);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((i) => i.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq &&= this._$Eq.forEach((i) => this._$ET(i, this[i])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
D.elementStyles = [], D.shadowRootOptions = { mode: "open" }, D[pt("elementProperties")] = /* @__PURE__ */ new Map(), D[pt("finalized")] = /* @__PURE__ */ new Map(), Aa?.({ ReactiveElement: D }), (Mt.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ai = globalThis, Ui = (e) => e, ut = ai.trustedTypes, ci = ut ? ut.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Di = "$lit$", G = `lit$${Math.random().toFixed(9).slice(2)}$`, Pi = "?" + G, ha = `<${Pi}>`, J = document, nt = () => J.createComment(""), Kt = (e) => e === null || typeof e != "object" && typeof e != "function", oi = Array.isArray, qa = (e) => oi(e) || typeof e?.[Symbol.iterator] == "function", jt = `[ 	
\f\r]`, tt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, mi = /-->/g, Ai = />/g, z = RegExp(`>|${jt}(?:([^\\s"'>=/]+)(${jt}*=${jt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), hi = /'/g, qi = /"/g, Oi = /^(?:script|style|textarea|title)$/i, Hi = (e) => (t, ...i) => ({ _$litType$: e, strings: t, values: i }), r = Hi(1), U = Hi(2), E = Symbol.for("lit-noChange"), K = Symbol.for("lit-nothing"), di = /* @__PURE__ */ new WeakMap(), Z = J.createTreeWalker(J, 129);
function Ei(e, t) {
  if (!oi(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return ci !== void 0 ? ci.createHTML(t) : t;
}
const da = (e, t) => {
  const i = e.length - 1, a = [];
  let o, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", p = tt;
  for (let l = 0; l < i; l++) {
    const n = e[l];
    let c, A, m = -1, d = 0;
    for (; d < n.length && (p.lastIndex = d, A = p.exec(n), A !== null); ) d = p.lastIndex, p === tt ? A[1] === "!--" ? p = mi : A[1] !== void 0 ? p = Ai : A[2] !== void 0 ? (Oi.test(A[2]) && (o = RegExp("</" + A[2], "g")), p = z) : A[3] !== void 0 && (p = z) : p === z ? A[0] === ">" ? (p = o ?? tt, m = -1) : A[1] === void 0 ? m = -2 : (m = p.lastIndex - A[2].length, c = A[1], p = A[3] === void 0 ? z : A[3] === '"' ? qi : hi) : p === qi || p === hi ? p = z : p === mi || p === Ai ? p = tt : (p = z, o = void 0);
    const V = p === z && e[l + 1].startsWith("/>") ? " " : "";
    s += p === tt ? n + ha : m >= 0 ? (a.push(c), n.slice(0, m) + Di + n.slice(m) + G + V) : n + G + (m === -2 ? l : V);
  }
  return [Ei(e, s + (e[i] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), a];
};
class Ut {
  constructor({ strings: t, _$litType$: i }, a) {
    let o;
    this.parts = [];
    let s = 0, p = 0;
    const l = t.length - 1, n = this.parts, [c, A] = da(t, i);
    if (this.el = Ut.createElement(c, a), Z.currentNode = this.el.content, i === 2 || i === 3) {
      const m = this.el.content.firstChild;
      m.replaceWith(...m.childNodes);
    }
    for (; (o = Z.nextNode()) !== null && n.length < l; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const m of o.getAttributeNames()) if (m.endsWith(Di)) {
          const d = A[p++], V = o.getAttribute(m).split(G), y = /([.?@])?(.*)/.exec(d);
          n.push({ type: 1, index: s, name: y[2], strings: V, ctor: y[1] === "." ? Fa : y[1] === "?" ? Sa : y[1] === "@" ? ua : Ct }), o.removeAttribute(m);
        } else m.startsWith(G) && (n.push({ type: 6, index: s }), o.removeAttribute(m));
        if (Oi.test(o.tagName)) {
          const m = o.textContent.split(G), d = m.length - 1;
          if (d > 0) {
            o.textContent = ut ? ut.emptyScript : "";
            for (let V = 0; V < d; V++) o.append(m[V], nt()), Z.nextNode(), n.push({ type: 2, index: ++s });
            o.append(m[d], nt());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Pi) n.push({ type: 2, index: s });
      else {
        let m = -1;
        for (; (m = o.data.indexOf(G, m + 1)) !== -1; ) n.push({ type: 7, index: s }), m += G.length - 1;
      }
      s++;
    }
  }
  static createElement(t, i) {
    const a = J.createElement("template");
    return a.innerHTML = t, a;
  }
}
function _(e, t, i = e, a) {
  if (t === E) return t;
  let o = a !== void 0 ? i._$Co?.[a] : i._$Cl;
  const s = Kt(t) ? void 0 : t._$litDirective$;
  return o?.constructor !== s && (o?._$AO?.(!1), s === void 0 ? o = void 0 : (o = new s(e), o._$AT(e, i, a)), a !== void 0 ? (i._$Co ??= [])[a] = o : i._$Cl = o), o !== void 0 && (t = _(e, o._$AS(e, t.values), o, a)), t;
}
class Ra {
  constructor(t, i) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: i }, parts: a } = this._$AD, o = (t?.creationScope ?? J).importNode(i, !0);
    Z.currentNode = o;
    let s = Z.nextNode(), p = 0, l = 0, n = a[0];
    for (; n !== void 0; ) {
      if (p === n.index) {
        let c;
        n.type === 2 ? c = new mt(s, s.nextSibling, this, t) : n.type === 1 ? c = new n.ctor(s, n.name, n.strings, this, t) : n.type === 6 && (c = new Va(s, this, t)), this._$AV.push(c), n = a[++l];
      }
      p !== n?.index && (s = Z.nextNode(), p++);
    }
    return Z.currentNode = J, o;
  }
  p(t) {
    let i = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(t, a, i), i += a.strings.length - 2) : a._$AI(t[i])), i++;
  }
}
class mt {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, i, a, o) {
    this.type = 2, this._$AH = K, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = a, this.options = o, this._$Cv = o?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const i = this._$AM;
    return i !== void 0 && t?.nodeType === 11 && (t = i.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, i = this) {
    t = _(this, t, i), Kt(t) ? t === K || t == null || t === "" ? (this._$AH !== K && this._$AR(), this._$AH = K) : t !== this._$AH && t !== E && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : qa(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== K && Kt(this._$AH) ? this._$AA.nextSibling.data = t : this.T(J.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: i, _$litType$: a } = t, o = typeof a == "number" ? this._$AC(t) : (a.el === void 0 && (a.el = Ut.createElement(Ei(a.h, a.h[0]), this.options)), a);
    if (this._$AH?._$AD === o) this._$AH.p(i);
    else {
      const s = new Ra(o, this), p = s.u(this.options);
      s.p(i), this.T(p), this._$AH = s;
    }
  }
  _$AC(t) {
    let i = di.get(t.strings);
    return i === void 0 && di.set(t.strings, i = new Ut(t)), i;
  }
  k(t) {
    oi(this._$AH) || (this._$AH = [], this._$AR());
    const i = this._$AH;
    let a, o = 0;
    for (const s of t) o === i.length ? i.push(a = new mt(this.O(nt()), this.O(nt()), this, this.options)) : a = i[o], a._$AI(s), o++;
    o < i.length && (this._$AR(a && a._$AB.nextSibling, o), i.length = o);
  }
  _$AR(t = this._$AA.nextSibling, i) {
    for (this._$AP?.(!1, !0, i); t !== this._$AB; ) {
      const a = Ui(t).nextSibling;
      Ui(t).remove(), t = a;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class Ct {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, i, a, o, s) {
    this.type = 1, this._$AH = K, this._$AN = void 0, this.element = t, this.name = i, this._$AM = o, this.options = s, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = K;
  }
  _$AI(t, i = this, a, o) {
    const s = this.strings;
    let p = !1;
    if (s === void 0) t = _(this, t, i, 0), p = !Kt(t) || t !== this._$AH && t !== E, p && (this._$AH = t);
    else {
      const l = t;
      let n, c;
      for (t = s[0], n = 0; n < s.length - 1; n++) c = _(this, l[a + n], i, n), c === E && (c = this._$AH[n]), p ||= !Kt(c) || c !== this._$AH[n], c === K ? t = K : t !== K && (t += (c ?? "") + s[n + 1]), this._$AH[n] = c;
    }
    p && !o && this.j(t);
  }
  j(t) {
    t === K ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Fa extends Ct {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === K ? void 0 : t;
  }
}
class Sa extends Ct {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== K);
  }
}
class ua extends Ct {
  constructor(t, i, a, o, s) {
    super(t, i, a, o, s), this.type = 5;
  }
  _$AI(t, i = this) {
    if ((t = _(this, t, i, 0) ?? K) === E) return;
    const a = this._$AH, o = t === K && a !== K || t.capture !== a.capture || t.once !== a.once || t.passive !== a.passive, s = t !== K && (a === K || o);
    o && this.element.removeEventListener(this.name, this, a), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Va {
  constructor(t, i, a) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    _(this, t);
  }
}
const ga = ai.litHtmlPolyfillSupport;
ga?.(Ut, mt), (ai.litHtmlVersions ??= []).push("3.3.3");
const Na = (e, t, i) => {
  const a = i?.renderBefore ?? t;
  let o = a._$litPart$;
  if (o === void 0) {
    const s = i?.renderBefore ?? null;
    a._$litPart$ = o = new mt(t.insertBefore(nt(), s), s, void 0, i ?? {});
  }
  return o._$AI(e), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ei = globalThis;
let g = class extends D {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const i = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = Na(i, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return E;
  }
};
g._$litElement$ = !0, g.finalized = !0, ei.litElementHydrateSupport?.({ LitElement: g });
const fa = ei.litElementPolyfillSupport;
fa?.({ LitElement: g });
(ei.litElementVersions ??= []).push("4.2.2");
const Ta = "data:image/jpeg;base64,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5zS82jzazvtFH2j3o5Q5zS82jzfes77R70faPejlHzml53vSiasz7R70v2j3pcoc5p+dSiasz7R70ouKOUfOannClE/vWX9opftHvS5BqZq+f70vn1lfafej7RS5B+0NXz6X7QKyftPvR9p96OQftDW+0UfaKyftXvSfavejkD2hr/aKPtFZH2r3pPtXvRyB7Q1/Po+0e9ZH2r3pPtNHIL2hrm4pPtHvWT9po+00+QPaGr5/vR5/vWV9ppPtNHIL2hq+f70Cf3rK+00faaOQPaGt5/vSif3rJ+00fafelyDVQ2RPT1uPesUXXvTxde9JwKVQ3FuKkW496wluvepFu/eocC1UN1bj3qRbisNbv3qRbv3qXTNFUNxbj3qQXHvWGt171It171DplqobYnp4nHrWKt171It171LgWqhsib3p4mrHW596kFz71PIUpmsJqeJayhc+9SC4qeQtTNMS0okrOE/vTxP70uUfOaHmUvmVQ873pwm96XKPmL3mUeZVHzqXzqOUfMXfMo8yqXnUnnUcocxd8yk8yqZm96b53vRyi5i4ZPekMtUTP700z0+UXOXTLTTNVE3FRm596agJzL5mppm96zjc+9Rtc+9UoEOoaRnHrTDPWY1171G1171SgS6hqG496jNx71lm696jN171SgQ6hqm496Ybj3rJN170w3fvVKmQ6hrG496Ybj3rIN370w3fvVezJdU2Dc+9Ibn3rHN37037X71Xsyfamz9p96T7R71jfa/ej7X70ezF7U2ftHvR9o96xvtXvR9r96PZh7U2ftHvR9o96xvtY9aPtXvT9mHtTZ+0e9H2isX7X70fa/ej2Ye0Nn7TSfaPesf7X70n2v3o9mL2psfafekNz71jm796T7V70/Zh7Q1/tHvSG496yPtXvSG696PZk+0NY3FNNx71lfavemm6p8gvaGsbj3ppn96yjde9J9q9xT5Be0NTz6Qz1l/avek+0+9PkFzmp59J53vWZ9p96PtPvT5Bc5peb70eb71m/aPej7RRyC5zR82jzazvtAo+0D1p8oc5pebR5tZv2getH2getLlDnNLzaPNrN+0D1o+0D1o5Q5zS82k82s77QPWj7QPWjlDnNHzaPNrO+0D1pPtFPlDnNLzaPNrN+0e9J9o96OUOc0/No82sz7T70fafejlDnNPzaPNrM+0+9H2n3o5Q5zUE3vThP71lC596X7T70uQfOawnpwn96yBc+9OFz70uQambAuPeni496xhde9OF171PIUqhtC496kFx71hi696eLr3qeQtVDbFx708XPvWGLv3pwu/el7MpVTcFx7077RWGLv3p32v3qfZle1NsXPvS/afesT7X70ou/el7MftTb+0+9L9prF+1+9H2v3o9mP2pt/afej7SPWsX7X70fa/el7MftTb+0UfaKxftfvR9r96PZh7U2vtFH2isX7X70fa/ej2Ye1Nr7RR9orF+1+9H2v3o9mHtTa+0Un2getY32v3pPtfvR7MPam19p96Q3PvWN9r96T7X70ezF7U2ftPvSG596xjd+9N+1+9P2Ye1Nk3PvTTc1jm796abv3p+zJ9qbBufemm496yDd+9NN371SpkuoaxuPemm496yTde9MN170/ZkuoaxuPemGeso3XvSG596pQJdQ0zP700z1mfaaT7TT5CXM0jPTTN71nfaPej7R70+QnnNDzaPNrO+0e9J9o96fKHOaPm+9Hme9Z32j3o8/wB6OUXOaPme9J5tZ/n+9J549aOUOY0fNo82s77QPWj7QPWjlDnMn7V70faqw/tdL9r966uQ5PaG59p96PtXvWJ9r96PtdHIHtDc+1Ufah61ifa/el+1+9HIHtDb+0+9H2r3rE+1+9L9r96XIHtDb+00ouaw/tfvS/avejkH7Q3PtPvR9p96xPtXvS/a/ejkD2ht/avek+1e9Yv2v3pPtfvRyB7Q2/tXvSfa/esQ3fvSfa/ej2Ye0Ns3fvSfa/esM3fvSG896PZh7U3PtfvSfa/esI3nvSfa/en7MXtTe+1+9H2v3rB+1+9H2v3o9mHtTe+1j1o+1j1rB+1+9L9r96PZh7Q3ftXvS/avesL7X70fa/ej2Ye0Nz7V70favesP7X70fa/ej2Ye0Nz7VS/a/esL7X70fa/ej2Ye1N77X704XnvXP/bPel+2e9L2Y1VOhF571ILz3rmxe+9OF770nTKVU6Vbz3qRbz3rmhe+9PF771LpFqsdOt571It571zC3vvUq3vvUOkaKsdOt571Kt571zC3vvUy3vvUOkWqx0y3nvUq3fvXNLe+9Sre+9Q6Roqp0q3fvUq3XvXNre+9Sree9Q6ZaqnRi696kF171zq3nvUovPepdMtVTfF1704XNYIvPenC896n2ZXtTe+0+9H2msP7YPWl+2e9Hsx+1Nv7TR9p96xPtnvSfbPej2Ye1No3PvTTde9YpvPemG896fsxe1No3XvTDde9YpvPeomvfemqZLqm01171G1371ite+9Qte+9WqZDqm21371E1571iNe+9Qte+9UqRm6puNee9RNee9YbXvvUTXvvVqkQ6xutee9RNee9YTXvvUTXvvVqkQ6xvG896jN571gte+9Rm996pUjN1TeN57003nvWAb33ppvfeqVIn2xvm896abz3FYBvfem/bfen7Mn2p0H2z3o+2e9c/wDbfej7b70/Zh7U6D7Z70fbPeuf+2+9H233o9mL2p0H2z3o+2e9c/8Abfej7b70ezD2p0H2z3o+2e9c99t9zR9t96PZh7U6A3nvSfbPeuf+2+9H233o9mHtToPtnvR9s965/wC2e9H2z3p+zD2pv/a/ekN371gfbPf9aPtfvR7MXtTe+1+9J9rrB+2e9H2z3p+zD2pvfa/ek+1+9YX2z3pPtfvR7MXtDe+1+9H2v3rB+1+9L9s96PZh7Q3ftfvR9q96wvtdL9r96PZh7Q3PtXvR9q96xPtfvR9r96PZh7Q3PtXvR9q96xBde9L9q96OQPaG39q96PtXvWJ9q96X7VS5A9obf2r3o+1e9Yn2qj7VRyB7Q2vtXvR9q96xftXvSfavejkD2htfavej7V71i/aqT7X70+QPaG19q96PtXvWJ9r96Q3XvR7MPaG39q96PtXvWH9r96PtfvR7MXtDc+1+9H2v3rC+1+9H2v3p+zD2hu/a/ej7X7isL7X70fa/ej2Y/aG99r96X7X71gfa/el+2e9L2Ye0N8XfvSi7965/7Z70v2z3/Wl7MftToRee9OF571zv2z3pftvvS9mP2p0QvPenC8965z7b7077b70vZD9sdGL33pftvvXOfbfel+2+9HsivbHR/bfenfbfeub+2+9L9u96Xsh+2Oj+2+9L9t965v7b70v233peyD2x0n233o+2+9c59u96PtvvR7IftjpPtnvR9s965z7b70fbfej2Qe2Oj+2+9L9t965v7b70v20etL2Qe2Oj+2+9H233rnPtvvR9u96PZD9sdF9t96PtnvXO/bfek+2+9P2QvbHRfbfek+2+9c99t96T7b70eyD2x0P233pPtnvXPfbfek+2+9Hshe2OhN770hvPeueN770hvfen7IXtjoPtnvTTee9YH233pPtnvT9kL2pv/bPek+2e9YH233o+2e9P2Yvam99r96T7X71hfbPej7X70ezF7U3ftXvR9q96w/tfvR9q96fsxe0Nv7V70favesX7V70v2r3o5A9obP2r3o+1e9Y32r3o+1Ucge0Nn7T70fafesb7V70favejkD2hsfaaPtPvWN9q96PtVHIHtDZ+0+9H2qsX7VSfaqOQXtDB+1+9L9r96wftXvS/a/eu3kOH2hu/a/el+1+9YX2r3pRd+9Hsx+0N37XR9r96wvtfvS/avel7MPaG79r96X7X71hfa/el+1e9HIHtDd+1+9KLv3rCF17077V70uQftDc+1+9L9r96w/tXvR9q96OQPaG39r96PtfvWJ9q96PtXvRyB7Q2jd+9NN371jG696abr3p8ge0Nk3fvTTd+9Yxuvemm696OQXtDaN370n2usQ3XvSfaven7MXtDb+1+9H2v3rD+1e5pftXvR7MPaG59r96UXfvWF9q96X7V70ezD2hu/a/ej7X71h/afel+1e9HIP2ht/a/ej7X71ifavej7V70cge0Nv7X70n2v3rE+1e9Ibr3o9mL2ht/bPej7Z71h/avek+1+9Hsx+0N4XnvSi996wPtfvSi796Xsw9odCL33p4vfeucF3708XfvS9mUqp0gvfepFvfeuaF571It571LplKqdMt771Mt971y63nvUq3vvUukWqp1C33vUy33vXLLe+9TLe+9Q6Roqp1K33vUy33vXLLe+9Sre+9Q6RarHUrfe9SLfe9cut971It971Hsi1WOoF9708X3vXMC+96cL73peyKVY6b7d70v273rmhfe9L9u96Xsh+2Ok+3e9J9u965z7d70033vR7IPbHRm+96Yb73rnjfe9MN9701SF7Y6Br73qNr73rn2vveomvveqVIl1joGvveoWvvesBr73qJr33qlSIdY3mvveomvvesBr33qJr33q1SM3WN5r33qJr33rCa996ia896tUiHVN5r33qI3vvWEbz3phvPeqVMh1Tda996jN771hG796abv3qlTJ9qbhvfemm996wjd+9NN371Xsyfam8bz3pPtnvWCbv3o+1+9Hsxe0N37Z7/rR9s9/wBawftfvR9rNP2Ye0N77Z7/AK0fbPf9awftZ9aX7X70ezD2hu/bPf8AWj7Z7/rWF9r96PtfvR7MPaG7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3UzNGaLgP3UbqZmjNFwH7qN1MzRmi4x+6jdTM0ZouA/dRupmaM0XAfuo3UzNGaLgP3UbqZmjNFwH7qN1MzRmi4h+6jdTM0ZouA/dRupmaM0XGP3Um6m5ozRcB26jdTc0ZouA7dRupuaM0XAduo3U3NGaLgO3UbqbmjNFwHZozTc0maLgPzRmmUUrgPzRmmUUXAfmjNMoouA/NGaZRRcB+aM0yii4D80ZplFFwH5ozTKKLgPzRmmUUXAfmjNMoouAuaM0yigLD80ZplFFwsPzRmmUUXCw/NGaZRRcLD80ZplFFwsPzRmmUUXCw/NJmm0UXCw6im0UgsOoptFAWHUU2igdh1FNooCw6im0UBYdRTaKAsOoptFAWHUU2igVh1FNooCw6im0UBYdRTaKB2HUU2igLDqKbRQFh1FNooCw6im0UBYdRTaKAsOoptFAWHUZptFAWHZozTaKAsOzRmm0UBYdmjNNooCw7NGabRQFh2aM02igLDs0ZptFAWHZozTaKAsOzSZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzSZoooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//2Q==", ba = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwQDAwQEBAQFBQQFBwsHBwYGBw4KCggLEA4RERAOEA8SFBoWEhMYEw8QFh8XGBsbHR0dERYgIh8cIhocHRz/2wBDAQUFBQcGBw0HBw0cEhASHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBz/wAARCAMgBQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6aooor40+wCiiigAooooAUClpM0uaACiiimK4uaWkApcUxXClxSgUuKLBcTFGKfijFOwrjcUYp2KXFFhXGYoxT8UmKLBcbijFOxS4osFxmKMU/FFFguNApcU4Clp2C4zFLj2p1FFguNxSYp9FFguMxSEU80lKwXI8UhFPIppFFh3G0macRTSKVh3EooopDQhFJS5oNIYlFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAKBS0maWgTCnimDrTxVCY8U8UwU8dapEseoqVRUaipVqkiGx4FSKKYoqUCtEjNscBUiimqKlAq0iGwAp4FAFOAqkiLiAUuKcBTsVVibjNtG2n4oxRYLjNtJipMUYosFyPFJipCKNtFh3I8UhFSFaTbSsO5FtpNtS4pMUrDuQlaaVqYrTStKw7kBFNK1MVphFS0UmQFaYRU5FMZahotMgIphFTkUwrUtFJkBFIRUpWmlalopMiIpMVIRTcUrDuMIpMU8iilYdxmKMU/FJiiwXGY9qCKfijFFh3I8UlSbaTFFguMop2KTFKw7iUhp2KQilYLjaKXFJRYdwoxRRQMTFJTs0mRSASiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAM0ZptFMVx2aM02igLjs0U2imIdRSDpSigLjhSgUlOAp2FcUCnAUlOFOwrhTqAKcFp2FcTFG2nhadtp2Fcj20bak20u2iwrkW2jbUu2k20WC5Hto21Jto20WC5HtpcU/bS4p2C4zbS7aeBS4osFxm2jbT8UuKLCuR7aTbUmKCKLDuQkU0ipsU0ilYLkRptSEUwilYq4wimkU8000rDuMpppxpD1pDEooptTYY7NGabRRYdx2aM02igLjs0ZptFAXHZozTaKAuOzRmm0UWC47NGabRRYLjs0ZptFFguOzRTaKdguOopMUYoC4tFGKMUCuFFGKTFAXFozSYpKLDuOzRmm0UrBcdmjNNoosFx2aM02iiwXHUopopR1piuPHWnCmDrTxTJH1ItRCpVqkiWSLUq1GtSqKtIhskWpVFRr1qZRWiRk2PUVIBTQKlUVokQ2KBTwKSngVSRFxMUuKcBTgKqxNxmPajbT8UuKLBcj20bakxRtosFyLFGKl20m2iwXI8UmPapNtG2lYLkWKTbUu2k20WHchK00rU+KaRSsUpEBWmFasFaYVqWilIrlaYVqyVphSpaKTKzLUZWrJSmFahotSK5WmlanK00pU2KUiuVpNtTlaTbS5SuYgK0m2pttG2lyhcg20bam20baLDuQbaNtTbaNtKwXIMUmKn2U0rRYdyLFIRUpWmlaVh3IsUhFSFaTFKwXI8UhFSEU3FKw7kdBGacRSEUWHcZRTqbSsO4UZoNNoAdmjNNopWHcdmjNNooC47NGabRQFx2aM02igLjs0ZptFAXHZozTaKLBcdmjNNoosFx2aM02iiwXHZozTaKLBcdmjNNoosFx2aM02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ooAXNGaSigBc0ZpKKAFzRmkozQBY3UbqZmkzQIfuozTM+9GaAH5pN1MzRmgB+73pM03NGaAHZozTM0UAPzSZ96bRmgB2aTNNzRmgY7NGabmjNADs0mabmigB1GabRQAuaM0lFAC5ozSUZoAM0UmaM0ALRSZozQAtFNzRQA6im0UAOzSZpKKAFzRmkooAXNJmiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAzS5pKKAFzRmkooAXNGaSigBc0uabRQA6im0UAOoptFADqKbmlzQAtFJmjNAC0UmaM0ALmlzTc0uaAFzRmkooAXNGaSigBc0uabRQA6im0UAOozTaKAH5ozTM0uaAHZozTc0ZoAdmjNNzRmgB+aM0zNGaAH5ozTM0ZoAfmkzTc0ZoAdmjNNzRmgB2aM03NGaAHZozTc0maAHZoptFADqKbRQA7NJmkooAXNGaSigBc0ZpKKAFzSZozSZoAWikzRmgBaKTNGaAFopM0ZoAWim5ooAdRTaKAHUZptFAC5ozSUUALmjNJRQAuaM0lFABmiiigAooooAKKKKACiiigCSjNNooAdmkzSUUALmjNJRQAuaTNGaTNAC0UmaM0ALRSZozQAtFNzRQA6jNNooAXNGaSigBc0ZpKKADNFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAGaXNJRQAuaM0lFAC5ozSUUALmlzTaKAHUU2igB1FNooAdRTaKAHUU2igB1FNooAdRTaKAHUZptFADs0maSigBc0ZpKKAFzRmkooAXNJmiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAXNGaSigBc0maKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//2Q==", ka = "data:image/jpeg;base64,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", xa = "data:image/jpeg;base64,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0n2n3rIN17037V707FKJtC596etz71hC696et370WLUToUuferUd171zKXfvViO896LGsYnUxXXvVyK7965SO896tx3vvRym0YnVx3fvVpLsetcrHfe9WUvfelYtROpS7HrU63XvXMJe+9WEvfepsDR0q3PvUy3HvXPR3ee9WY7r3pNENG8s3vUyS5rFjuPerUc9SZtGqslSq9Z8cuasK9IVi4Gp4NVlepA1ILE+aXNRA07NAWH5ozTc0UXCw6jNNooCw7NGabmkzRcdh2aM00mm5ouKw/NOBqLdRuxRcdicNUitVUPUgemmNItK1Shqqq9SBqtMpIsbqazUzdTWaqTHYbIapymp3aqkpouS0U5jWdN3q/Maz5jSbMpIoy9apSVclqnJUNmDiV3qI1K9RGlcjlGnNJzSmkx9KVw5RKKKQ0XDlENJmg0wmncOUXdRvqMtTC9Fy1EsiSpklrO83FOWambRibMU3vV6Gf3rnkn96uRXHvVHRCJ08Fx05rTguenNcpBddOa04LrpzTOiMTq4bnpzV+K4965eC66c1oRXXvTNlE6JLn3qQXPvWGl171J9q96ZdjXNz71G11jvWU1171A93x1pMdjVe796ga8x3rHkvPeqz3vvUsLG41771Gb33rn2vveojf8AvUjsdJ9u96T7d71zJv8A3pPt/vSCx0/2/wB6Pt3vXMfb/ej7f70BY8p/tb/ao/tb/arhv7V96P7V967uQ57nc/2t/tUf2t/tVw39q/7VH9q/7VHIFzuf7W/2qP7W/wBquG/tX/ao/tX/AGqOQLnc/wBrf7VH9rf7VcN/av8AtUf2r/tUcgXO5/tb/ao/tb/arhv7U96P7U96OQLnc/2t/tUf2t/tVw/9qe9H9qf7VHIFzuP7W/2qP7W/2q4f+1P9qj+1P9qjkC53H9rf7VKNW/2q4b+1PelGqe9HKFzuhq3+1Uqar/tVwS6p/tVPHqn+1S5Qud/Hqn+1V2HU+nNefRan05rQt9Szjmnyhc9Cg1LOOa0oNQzjmuAttQzjmte2vs45osM7iK+6c1aW9965KC96c1dS796LAdCb33qGS996xjd8darTXmAeaLAak1/jPNZs+o4zzWZcXvXmsi5v8Z5osBszal15qhLqn+1XP3Go9eazJtS560uUDqH1T/aqBtV/2q5KTU/eq7an70cornYnVf8Aapv9q/7VcYdU96b/AGn70coXO0/tX/app1T3rjf7T96T+0vejlEdkdU96Q6n71x39pf7VJ/aP+1RygdgdT/2qT+0v9quQ/tH/ao/tH/ao5QOv/tL3pP7SPrXIf2j/tUf2h70corHX/2l70v9pe9cf/aP+1S/2j/tUcoWOv8A7S/2qcNS/wBquO/tH/apRqP+1RyjsdiNT/2qcNT9643+0f8AapRqXvRygdkNT96cNU964wal70v9pe9HKM7P+0/ej+1PeuN/tI+tKNS96XKM7P8AtP3o/tP3rjP7S96X+0j/AHqOUDsv7U/2qX+1P9quM/tI+tH9pH1o5QO0/tT3o/tP3ri/7SPrS/2l70coHaf2p/tUf2p/tVxf9pe9L/aR/vUcoHZ/2p70v9qf7X61xf8AaR/vUv8AaR9aOUZ2f9qf7X60o1T/AGq4v+0venDUT/eo5QO1XVP9qp01P/arh11H3qxHqHvRYDuotS6c1dh1H3rhYdQ6c1owX3TmiwHcQ3+cc1ejvM96423vc45rShu8jrRYLHTi696RrnPesVLrjrTjcZ70EuJcluOvNZtxcdeabLPx1rNuJ+vNBlKIy5uOvNZFxc9eafcz9eax7mfrzQZSgPmufeqcl171VmuOvNUpLj3pWMnA0Wuvem/aveslrj3pPtHvSsTyGx9q96cLr3rFFx704XHvSF7M2PtXvTTc+9ZP2ikNx70B7M1Tc+9Rm696yzce9MNx70D9mahuvemG696yzce9MNx70ylTNb7V708XXvWJ9o96UXHvTLVM3lu/epku/eueFz71Ktz70GigdIl571ZjvfeuYS696nS796VjVQOqS+96spfe9col371YS896RXKdZHfe9Wo733rk47z3q5Fd+9SxOJ1kV571ehus965OG7z3rSguunNSzNxOphuenNXoZ8965qC46c1pwT1m2ZuJ0EU2atxyViwzZxzV6KWobFymqklTK9Z8clTrJSuHKXQ9ODVVV6eHpXDkLG6l3VBvpd9Fx8hPupN1Q7/ejf70rj5CbdSbqiL0m+i4chKWppeoi9NL0cwchNvpN9QF6TzKfMHIWg9OV6qeZThJTUh8heV6kWSqKyVIslNSKUC6HpC9VhJQZKrmK5CR3qrK1OZ6rSPT5hOBBM1UJjVuVqoynNS5GTplSU1VkqzIaqvU8xk6ZA1RGpWqM1PMT7MYaSnGko5g9kIaaacaaaOYPZDGNRsae1RNRzD9kRsahZ6e5qu5qlI0VIGkpvm4qF2qIyVSkaxpF5Z/ep47j3rJEtSpNT5jeNM3obn3rSguunNczFPV+G46VXMbxpnUwXXvV+K6965iG46VoRXHvRzGigdEl170/wC1e9Yi3FP+0UcxfIar3XvVaS796z3ufeq0lz70uYOQvSXfvVOS896oS3PvVKW596XMPkNN7z3qFr33rIe596ga596XMHIbRvT6003p9awzdU03RpXHyG99t96PtvvWD9qNH2k0XDkPAv7RPrR/aJ9a5z7T70v2k+tetY86x0X9on1o/tE+tc79qPrR9q96LAdF/aJ9aP7RPrXO/afel+0+9FgOh/tD/apf7QPrXO/aTS/aj60WA6H+0D60f2h71z32o+tH2n3osFjof7Q96X+0D61z32k+tH2k0WCx0P8AaB9aX+0D61z32o+tH2k+tKwWOh/tA+tA1A+tc/8AaT60C5PrQOx0i359anjvz61zC3J9asR3J9aAsdZDfHjmtS2vTxzXGwXB4rVtZzxzSCx21reZxzW3a3fTmuKtJzxzW7aT9OaRVjr7e66c1fS64HNc1bze9aEc3FIdjXa6461WmuuvNVGm4qrPN1pBYW5u+DzWLdXnXmn3U3XmsS7mPPNO4WG3N515rKmvfeorqfrzWTPOeeaYrFyS+96rPfe9Zkk59arNP70BY2Dfe9J9u96xDPx1pPPPrQFjc+2+9L9tPrWH5/vR5/vQFjb+2+9H233rE8/3pfONAcptfbT60fbT61jedR51Acps/bT60v20+tYvnGl840g5TZ+2H1pftp9axvNPrR51Acps/bfelF4fWsbzj60omoHymz9s96X7b71i+dS+caQcptC996X7b71i+caXzjRcOU2ftp9aX7cfWsXzjTvNNFx8psfbT60v20+tY3mml800XDlNj7afWl+2n1rHEpo80+tK4cpsfbT60v20+tY/mn1pfMNFx8pr/bT60ovT61keafWjzD60XDlNj7YfWj7YfWsjzPel8w+tK4cprfbD604Xh9ayPMNOEhouPlNpLw+tWo7s+tYKSGrMUhouHKdHBd9Oa1Le66c1zEEh4rUtpDxSuPkOqtrrpzWtBcdOa5e2kPFbFvIeKnmHyG/HPx1qXz+KzIpDUwfijmDkJ5JutZ9xL15q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UrAS7qXdUO6l3UWAm3Ub6h3Uu6iwE26jdUO6jdRYCffRvqHdRupWApZozSZozWghaKTNGaAFopuaM0wHUU3NFADqKbRQA6im0UWAdSZpKKLALmjNJRRYBc0ZpKKLALmjNJRRYBc0ZpKKADNGaKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAzRmiigBc0ZpKKLALmjNJRRYB2aKbRRYB1FNooAdRTc0uaAFzS5puaM0gHZozTc0ZoAdmjNJmigB2aKbRQA6im0UAOzS5pmaXNADs0ZpuaM0AOzS7qZmjNAD91G6m0UAPzRuplFKwEm6jdUeaXNFgJN1G6o80ZosBLuo3VFmjNFgIqKKKoAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAM0uaSigBc0ZpKKLALmjNJRRYB2aKbRRYB1FNozQA6jNNzS5oAXNLmm5ozSAdmjNNzRmgB2aM0maKAG0UUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9k=", Wa = "data:image/jpeg;base64,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DtZSQw9CCQe1QmoaKTGGmmnGmmoZomMpppxptQ0aJjD1ph6080xqhotMYaYetPNMas2jVMaaYacaaahlpjTTD3pxppNQzRMYaTNKaaetQzRMaelJS5ppqGUmJSE8UHpSZqSkwptKTxSUmUmGaKQmjNIoXNWrfTdSutMu9SttPuprOz2farmOJmjt952pvYDC7jwM4yelU67Tw78UfFfhf4ba54H0qa1XS9Z3eeZIQ0ke9Qkmxu29AFO4HAGV2nmqjbqP0OMyKXNNoqSrj80ZpuaXNMdxc0uabRTHceDTs1HmlBp3GSUoNMzS5phckBpajB9KUGmmO5IDTgajzS1VxkgNODVEDTgadx3JAadmos0uapMdyUGlDVEGpwNO47kuaXNRZpd1O4yXJpd1RBqXdTuO5LuFGajzS596dwuSZ96XNRZNLuNO47km6l3VHuo3UXC5Jupd1R7hRkU7juSbqN31qPIoyKLhck3fWjd9ajyKMii4XJN31o3VHkUZFFwuSbqTdTMijcKLhcfuo3VHuo3UriuPzSZpm40ZNFwuPzSbhTM+9JmlcVx+6kyabuppalcLj80maZupM0riHlqaTTSfekLUriuOzTSaaTSZpXFccWppNITTSaVxXHE00mkpM1NxC0maQmmk0riuKTSE0maSpELmkzSE03NK4hSaTNJRSEFFJmkzQAuaM03NGaVxXPQaKKK+pPiAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpba2uLy8htLSCW4uJnEcUMSl3kYnAVQOSSSAAKiooAvazo2qeH9eutF1qyls7+1fy5oJByp69RwQQQQRkEEEEgiqNS3NzcXl5Nd3c8txcTOZJZpWLvIxOSzE8kkkkk1FQvMbtfQKKKKLCCiiipHcKKKM0DCiiigBtd18N/hv/AMLD/t3/AIqbTNG/suyN3/prf6zryeRtiXHzyc7dy/Kc8cMaSpkm1ZMuDSd5K42inGm0BcQ9KSlNJSZSYhpppc0HpUspMaelNp3am1LLTGmm5xTz1phFSykxp6Uw0+mGoZomNNMNOPWmmoZomMNMNPNMPWs2aJjD1pppxpneoZomMNNNPNMPWs2aJjDTDTz1phqGWhppp6049aaa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TSSQUUUVbJEPSkpT0pKSGgooooYwoopCaQCHrQelFIelIpCUh60tNpMaENJQetIelSWhDTTzSmkqWUhDTD1pxNMPSoZohDTCacelMapZaGnrTWp1MJrNmqGnrTTS00moZohtdn4l8SeCdS+F3hzRNE8I/wBna5ZZ+3ajuH77jB5HMm9sP82PLxtXIJNcWaYxqb2NUNNNPSlPSmmsmaIaaYetOptSy0NJph6U41LZ2V5qWpW+nadaT3d5cyrDBbW8ZkkmkYhVRFHLMSQABySazZaK9NNX9Z0bWPD2szaPr+k32lajBt82zvoHgmj3KGXcjgEZVgRkcgg96zzUXvqapCUhGKWkPWkykNPSkpT1pp6VLKEoxRRSKExQRS0h60mNCUUUhpDsJRRRQAUUUUAFFFFABRRRQAVu+E/Bfizx3rc2j+DvD9/rV/Day3slvZRGRlijXczYH4KB1ZmVVBZlBwqntL690+4aewu57WVopIGkgkKMY5EaORCR/CyMysOhViDwTSd7aAQUUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoorc8VXXhS71qGXwfpOo6bYC0gSSG/uluHacRgSuGCrwWz9eSAgYRoAYdFFFABRRXqPjf4Nf8ACGfAbwX8Sv8AhNdE1P8A4SXd/wASu1b97BwW+VsnzNmNkvC+XIVT5s5pNpbgeXUUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPRqKKK+qPiQooooAKKKKACiiigAooooAKKKKANjw34bv/ABTq8unadPYwyx2012zXt0luhWJC7AM5AzgfhyThVZhj0UUh6WCiiimIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKTAQ9KSiimikFdn4i+F/ivwv8N9D8b6rDarpesbfJEcwaSPcpePevbegLDaTgDDbTxXGVan1PUrrTLTTrnULqazs9/wBltpJWaODedz7FJwu48nGMnrWcua6sVFxs7lWkNLSGqZIlIelLSHpUlDTSUppD0oKQ2kPSlpCallIaelIelKaaelQzRDTTTTjTD1qWWhCajJp7Uw9ahloaelManE0wmoZqjXudZ0+fwNY6HH4dsIL22upZ5NWRn8+4RwoEbAttwu09vTAUlzJiHrTjTDWbNUIetRtTyajPWoZohD1phpxNMNQzRDT0pppxppqGy0NPWuu+FfxBvPhZ8YNE8e2OnwahLpkrlrSdiiyxvG0Uihh91tkjYbBAOCQwGDyFIazmlJNPY0R6V8dvjHefG/4ox+LbrQ4NGit7GPT7ezjmM7LGjO5LyELuYvI54VQBtGCQWPmB606mnrWcYqK5Y7I0QU2lPSmmgpCUh6UtIakYlFFFBQHpTaU9KSkxoKQ9aWm0hhRRRQAUUUUAd58SfhD4y+FP9jf8JbBZp/a1uZofs04l8t12+ZC/T503pkjKncNrNg44OrmoatqurfZf7U1O8vvslulpbfaZml8iFM7Yk3E7UGThRwMmqdAIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPTvgNrPw00L4trffFSwhu9G+xypCbm1N1DDcHbteSIA7xtEij5WwzKcDG5cH4p6h4N1T4w69qHw/svsfhya4DWkQjMS/dUOyITlEZw7KvGFYDauNo4+incVtbhRRRSGFFFFABRRRQAUUUUAFFTWc8VtqNvczWcN5FFIrvbTlxHMAclGKMrBT0O1gcHgg81qeLta0/xH451XXdK8PWXh+yvLl5odLsixitlJ4Vc/mcBVyTtVFwoAMWiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD0aiiivqj4kKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA3fCfhPU/GeuTaVpVxpsE8VnPes2oXkdqhSGMyMAzkAnC/QDLMVRWZcKiikk7+Q9LBRRRTEFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAU2iigdgorWt9WsYfBt7osmg2U15cXMU8eqOz+dAqhgY1AO3ByO3rkMdhS/Z/D7xnqHgS48ZWegXMuiW+4vdgr0U4ZlTO5lXnLAEDa2T8rYlytuWot7anNUUUUEhSGlptA0FNPWnHpTaQxDTTSk5oqWWhtNpx602pZaEPWmnrSmmtUstDabTj0ph6VDKQhqM9ac1NqGaIa1MPWnE009KhmqGHvTT0pxNMNQzVDTTD1pxNMPSs2XEaelMPWnmmVDNUNPWmk0402oZaQ2mnpU9rbSXl9BZwtCsk0ixK00qxICxwCzuQqjnlmIA6kgVf8AFXh2+8I+M9S8M6nNaTXen3DW8slnMJomZT/Cw/UHDKchgrAgQaIx6bSmkqWWhD1pppx6001JYlNPWndqbUjQUUUUDENJRRUlCHpSUHrRQAUUUUAFFFFABRUq21y9lJeLbytbRusTzBCUR2DFVLdASEcgd9rehqKgAooooAKKKKACiiigAooooAKKKKACiiigAr0D4oeK/h/4o/4R/wD4QTwR/wAI19jsRDe/MD5z8YXj7+3Dfvmw8m/5gNorz+impWTQrBRRXQeHvD2lazoHiLUNQ8W6Zo0+l2S3VrZ3iSGTUnMip5UWxSA2GJ55zjgIJJI0M5+iiprRbV9QgS+mmgtWkUTSwRCV0TPzMqFlDEDJALKCeMjrQBDRWx4rt/Ddp411O28IajeajoUdwy2V3eQiKWWPPBZR+hwpIwSqE7Rj0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRXV6N8O/Ees6b4uu1+wae/hS1+1alaapeR2dwMTLCY0ikIZnDNgrjqAn33jR02luBTtPCGqXvw31LxtFc6YunadeQWM0Ml7Gtyzyq7KUhJ3MvyHtk/MVDCOQpgUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiitXw14gvfCvi/TvEenRWkt3YTrcRJdwiWMsp7qf5jDA4KkEAhrzAyqKluriS7vpruVYlkmkaRlhiWJAScnaiAKo54VQAOgAFRUgCiiigAooooA//9k=", it = { sea: Ta, sunset: ba, reef: ka, bush: xa, space: Wa }, ct = [
  { id: "sea", name: "Sea & Sun", tagline: "Bright beach day", bg: it.sea, vars: { "--ink": "#0b2236", "--ink2": "#2c4a63", "--ink3": "#566e82", "--glass": "rgba(255,255,255,0.56)", "--glass-line": "rgba(255,255,255,0.78)", "--shadow": "0 12px 32px rgba(8,40,70,0.12)", "--chip": "rgba(255,255,255,0.74)", "--chip-strong": "rgba(255,255,255,0.94)", "--chip-soft": "rgba(255,255,255,0.36)", "--chip-faint": "rgba(255,255,255,0.14)", "--track": "rgba(11,34,54,0.13)", "--primary": "#0b5fa5", "--on-primary": "#ffffff", "--accent": "#c26a00", "--ok": "#0f8a5f", "--p-1": "#0b5fa5", "--p-2": "#c2410c", "--p-3": "#a16207", "--p-4": "#0f766e", "--p-5": "#be185d", "--p-family": "#475569", "--on-person": "#ffffff" } },
  { id: "sunset", name: "Cottesloe Sunset", tagline: "Warm and golden", bg: it.sunset, vars: { "--ink": "#2b1408", "--ink2": "#5a3a26", "--ink3": "#765644", "--glass": "rgba(255,250,244,0.58)", "--glass-line": "rgba(255,255,255,0.75)", "--shadow": "0 12px 32px rgba(60,30,10,0.12)", "--chip": "rgba(255,255,255,0.72)", "--chip-strong": "rgba(255,255,255,0.92)", "--chip-soft": "rgba(255,255,255,0.34)", "--chip-faint": "rgba(255,255,255,0.12)", "--track": "rgba(43,20,8,0.13)", "--primary": "#9a3412", "--on-primary": "#ffffff", "--accent": "#b45309", "--ok": "#15803d", "--p-1": "#1d4ed8", "--p-2": "#be123c", "--p-3": "#b45309", "--p-4": "#15803d", "--p-5": "#7e22ce", "--p-family": "#57534e", "--on-person": "#ffffff" } },
  { id: "reef", name: "Coral Reef", tagline: "Under the sea", bg: it.reef, vars: { "--ink": "#03252b", "--ink2": "#1d4a51", "--ink3": "#35636a", "--glass": "rgba(236,255,255,0.66)", "--glass-line": "rgba(255,255,255,0.6)", "--shadow": "0 12px 32px rgba(0,40,50,0.18)", "--chip": "rgba(255,255,255,0.72)", "--chip-strong": "rgba(255,255,255,0.94)", "--chip-soft": "rgba(255,255,255,0.34)", "--chip-faint": "rgba(255,255,255,0.12)", "--track": "rgba(3,37,43,0.14)", "--primary": "#0e7490", "--on-primary": "#ffffff", "--accent": "#ea580c", "--ok": "#047857", "--p-1": "#1e40af", "--p-2": "#be185d", "--p-3": "#c2410c", "--p-4": "#047857", "--p-5": "#7c3aed", "--p-family": "#475569", "--on-person": "#ffffff" } },
  { id: "bush", name: "Aussie Bush", tagline: "Gum trees and red dirt", bg: it.bush, vars: { "--ink": "#1c2a12", "--ink2": "#3f4f30", "--ink3": "#5a6849", "--glass": "rgba(252,250,238,0.58)", "--glass-line": "rgba(255,255,255,0.7)", "--shadow": "0 12px 32px rgba(40,40,10,0.12)", "--chip": "rgba(255,255,250,0.74)", "--chip-strong": "rgba(255,255,250,0.94)", "--chip-soft": "rgba(255,255,250,0.36)", "--chip-faint": "rgba(255,255,250,0.14)", "--track": "rgba(28,42,18,0.13)", "--primary": "#3f6212", "--on-primary": "#ffffff", "--accent": "#b45309", "--ok": "#15803d", "--p-1": "#1d4ed8", "--p-2": "#9d174d", "--p-3": "#b45309", "--p-4": "#4d7c0f", "--p-5": "#6d28d9", "--p-family": "#57534e", "--on-person": "#ffffff" } },
  { id: "space", name: "Space Mission", tagline: "Dark mode – blast off", bg: it.space, vars: { "--ink": "#f4f6ff", "--ink2": "#c9cdf0", "--ink3": "#a3a9d6", "--glass": "rgba(22,24,58,0.55)", "--glass-line": "rgba(255,255,255,0.14)", "--shadow": "0 12px 32px rgba(0,0,0,0.35)", "--chip": "rgba(255,255,255,0.12)", "--chip-strong": "rgba(255,255,255,0.22)", "--chip-soft": "rgba(255,255,255,0.07)", "--chip-faint": "rgba(255,255,255,0.03)", "--track": "rgba(255,255,255,0.18)", "--primary": "#ffd166", "--on-primary": "#1a1640", "--accent": "#ffd166", "--ok": "#4ade80", "--p-1": "#7aa2ff", "--p-2": "#ff8fab", "--p-3": "#ffb86b", "--p-4": "#6ee7b7", "--p-5": "#c4a1ff", "--p-family": "#cbd5e1", "--on-person": "#14123a" } }
], ya = { "--p-1": "#2563eb", "--p-2": "#db2777", "--p-3": "#0d9488", "--p-4": "#ea580c", "--p-5": "#7c3aed", "--on-person": "#ffffff" };
for (const e of ct) Object.assign(e.vars, ya);
const Ri = (e) => ct.find((t) => t.id === e) ?? ct[0], Gt = (e) => Object.entries(e.vars).map(([t, i]) => `${t}:${i}`).join(";") + `;--bg:url(${e.bg})`, W = b`
  :host { display: block; height: 100%; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; padding: 0; }
  h1, h2, .display { font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }

  .fh {
    position: relative; overflow: hidden; overflow: clip;
    height: calc(100vh - var(--header-height, 0px)); min-height: 640px;
    padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--ink);
    background: var(--bg) center / cover no-repeat; -webkit-font-smoothing: antialiased;
    transition: color .45s ease;
  }
  .fh::before { content: ''; position: absolute; inset: 0; background: var(--tod, transparent); pointer-events: none; transition: background 60s linear; }
  .fh.rainy::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18;
    background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255,255,255,.55) 18px 19px, transparent 19px 46px); animation: rain 1.4s linear infinite; }
  @keyframes rain { from { background-position: 0 0; } to { background-position: -40px 120px; } }
  .fh > * { position: relative; }
  .fh.idle *, .fh.idle::after { animation-play-state: paused !important; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001s !important; animation-iteration-count: 1 !important; transition-duration: .001s !important; } }
  .glass {
    background: var(--glass); -webkit-backdrop-filter: blur(28px) saturate(170%); backdrop-filter: blur(28px) saturate(170%);
    border: 1px solid var(--glass-line); box-shadow: inset 0 1px 0 var(--glass-line), var(--shadow);
    transition: background-color .45s ease, border-color .45s ease;
    animation: rise .6s cubic-bezier(.2,.8,.2,1) both;
  }
  @keyframes rise { from { opacity: 0; transform: translateY(14px) scale(.985); } to { opacity: 1; transform: none; } }
  .tap { transition: transform .18s ease, background-color .3s ease, box-shadow .25s ease; }
  .tap:active { transform: scale(0.95); }
  .fade { animation: fadeIn .35s cubic-bezier(.2,.8,.2,1); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .live { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); animation: live 2s ease-out infinite; flex-shrink: 0; }
  @keyframes live { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  .muted { color: var(--ink2); }
  .label { font-size: 12px; font-weight: 600; color: var(--ink2); text-transform: uppercase; letter-spacing: .05em; }
  .pill { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .round { width: 40px; height: 40px; border-radius: 50%; background: var(--chip); display: inline-flex; align-items: center; justify-content: center; }
  .primary { background: var(--primary); color: var(--on-primary); }
  .avatar { border-radius: 50%; color: var(--on-person); font-weight: 700; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  svg.i { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

  /* header */
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; }
  .clock { display: flex; flex-direction: column; min-width: 230px; }
  .clock .hm { font-size: 54px; font-weight: 700; line-height: 1; }
  .kids { display: flex; gap: 6px; padding: 6px; border-radius: 999px; }
  .kid { display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--chip); font-weight: 600; font-size: 15px; }
  .right { display: flex; align-items: center; gap: 10px; }
  .weather { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 999px; }
  .badge { padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, #f59e0b 22%, var(--chip)); font-size: 13px; font-weight: 800; white-space: nowrap; }
  .badge.hot { background: color-mix(in srgb, #dc2626 22%, var(--chip)); }
  .capsule { flex: 1; min-width: 0; display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; max-height: 104px; overflow: hidden; }
  .cap { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 16px; border-radius: 999px; background: var(--glass); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-line); font-size: 16px; font-weight: 700; white-space: nowrap; max-width: 380px; overflow: hidden; text-overflow: ellipsis; animation: fadeIn .4s ease both; }
  .cap b { font-variant-numeric: tabular-nums; font-size: 18px; }
  .cap.hot { background: #dc2626; color: #fff; border-color: #dc2626; animation: pulse 1.2s ease-in-out infinite; }
  .cap.ok { background: color-mix(in srgb, var(--ok) 25%, var(--glass)); }
  .presence { display: flex; gap: 4px; padding: 7px 8px; border-radius: 999px; }

  /* body */
  .body { display: flex; gap: 16px; flex: 1; min-height: 0; }
  .planner { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .seg { display: flex; padding: 3px; border-radius: 12px; background: var(--track); }
  .seg button { height: 34px; padding: 0 16px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--ink2); }
  .seg button[aria-pressed='true'] { background: var(--chip-strong); color: var(--ink); font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; font-weight: 600; color: var(--ink2); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }

  .week { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px; border-radius: 16px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .col.today { background: var(--chip-strong); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .dayhead { display: flex; align-items: center; gap: 6px; padding: 2px 2px 4px; }
  .num { font-size: 17px; font-weight: 800; padding: 0 4px; }
  .pchip { margin-left: auto; font-size: 13px; opacity: .7; }
  .today .num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; }
  .ev { border-radius: 12px; padding: 7px 9px 7px 10px; display: flex; flex-direction: column; gap: 2px; background: color-mix(in srgb, var(--c) 24%, var(--chip-soft)); border-left: 5px solid var(--c); }
  .ev .t { font-size: 12px; font-weight: 700; color: var(--ink2); }
  .ev .n { font-size: 15px; font-weight: 700; line-height: 1.2; }
  .ev .w { font-size: 12px; font-weight: 600; color: var(--ink2); }
  .ev.priv { flex-direction: row; gap: 6px; background: transparent; border-left: 0; padding: 2px 6px; opacity: .6; }
  .more { font-size: 13px; font-weight: 700; color: var(--ink2); padding: 6px 6px; border-radius: 10px; background: var(--chip-soft); text-align: left; }
  .xpbar { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; }
  .xpbar > div { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; transition: width .8s; }

  .daylist { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .dayrow { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px; }

  .month { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 6px; }
  .mhead { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink2); padding: 0 6px; }
  .cell { display: flex; flex-direction: column; gap: 3px; padding: 6px 7px; border-radius: 12px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .cell.out { background: var(--chip-faint); color: var(--ink3); }
  .cell.today { background: var(--chip-strong); }
  .cell .mev { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }

  aside { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
  .card { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .art { width: 56px; height: 56px; border-radius: 12px; background: linear-gradient(135deg, var(--accent), var(--primary)) center / cover; flex-shrink: 0; }
  .progress { height: 4px; border-radius: 2px; background: var(--track); }
  .progress > div { height: 4px; border-radius: 2px; background: var(--ink); }
  .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .grid3 button { height: 40px; border-radius: 12px; background: var(--chip); font-size: 14px; font-weight: 600; }
  .rem { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }
  .ring { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); flex-shrink: 0; }

  /* dock */
  nav.dock { align-self: center; display: flex; align-items: center; gap: 4px; padding: 8px; border-radius: 26px; }
  .dock .item { min-width: 74px; height: 68px; padding: 0 6px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 13px; font-weight: 600; }
  .dock .item[aria-current='page'] { background: var(--chip-strong); font-weight: 800; }
  .dock .kidbtn { min-width: 80px; gap: 2px; }
  .dock .kidbtn .avatar { overflow: hidden; }
  .dock .kidbtn[aria-current='page'] { box-shadow: inset 0 0 0 3px var(--kidc); }
  .dock .called { color: var(--ok); }
  .dock .sep { width: 1px; height: 36px; background: var(--track); margin: 0 6px; }
  .dock .cta { height: 60px; padding: 0 20px; border-radius: 18px; display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 600; }

  /* sheets, toasts, night */
  .scrim { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
  .sheet { position: relative; width: min(1000px, 92%); border-radius: 32px; padding: 26px 28px 24px; display: flex; flex-direction: column; gap: 18px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
  @keyframes sheet { from { opacity: 0; transform: scale(.94) translateY(12px); } to { opacity: 1; transform: none; } }
  .themes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .tcard { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px 12px; border-radius: 22px; background: var(--chip); text-align: left; }
  .tcard[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); }
  .tprev { height: 120px; border-radius: 16px; display: flex; align-items: flex-end; gap: 5px; padding: 10px; background: var(--bg) center / cover; }
  .tprev span { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
  .toast { position: absolute; left: 50%; bottom: 120px; transform: translateX(-50%); z-index: 20; padding: 14px 22px; border-radius: 999px; background: rgba(15,15,20,.88); color: #fff; font-size: 16px; font-weight: 600; animation: fadeIn .3s ease both; }
  .flash { position: absolute; inset: 0; z-index: 30; background: var(--chip-strong); pointer-events: none; animation: flash .7s ease forwards; }
  @keyframes flash { from { opacity: .9; } to { opacity: 0; } }
  .night { position: absolute; inset: 0; z-index: 40; padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; color: #ffb26b; text-align: left;
    background: #000; animation: fadeIn .8s ease both; }
  .night .big { font-size: 168px; font-weight: 300; line-height: .9; font-variant-numeric: tabular-nums; opacity: .78; }
  .night .ndate { font-size: 26px; font-weight: 500; margin-top: 10px; opacity: .6; }
  .night .dglass { background: rgba(255,178,107,.06); border: 1px solid rgba(255,178,107,.18); -webkit-backdrop-filter: none; backdrop-filter: none; }
  .alarm { position: absolute; inset: 0; z-index: 45; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #fff;
    background: radial-gradient(circle, #f97316, #b91c1c); animation: alarmbg 1s ease-in-out infinite alternate !important; animation-play-state: running !important; }
  @keyframes alarmbg { from { filter: brightness(.9); } to { filter: brightness(1.15); } }
  .dglass { background: rgba(20,20,22,.42); -webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,.12); }
  .breathe { animation: breathe 4s ease-in-out infinite; }
  @keyframes breathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
  @keyframes pulse { 50% { opacity: .75; } }
`, Ma = {
  calendar: "M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h14a1.5 1.5 0 0 1 1.5 1.5v12.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 10h17M8 3v4M16 3v4",
  cart: "M3 5h2.5l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8.5H6.3M10 20h.01M17 20h.01",
  pencil: "M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20zM13.5 7.3l3.2 3.2",
  music: "M9 18V5.5l11-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM20 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  home: "M3.5 11L12 4l8.5 7M5.5 9.5V20h13V9.5M10 20v-5.5h4V20",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z",
  bulbOff: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3zM3.5 3.5l17 17",
  megaphone: "M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  plus: "M12 5v14M5 12h14",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
  cloud: "M7 18a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 11 3.5 3.5 0 0 1 18 18z",
  rain: "M7 15a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19.5 8 3.5 3.5 0 0 1 18 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3",
  palette: "M12 3a9 9 0 0 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.1 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3zM7.5 11h.01M10 7h.01M14.5 7h.01",
  close: "M6 6l12 12M18 6L6 18",
  shuffle: "M3 7h3l9 10h3M3 17h3l3-3.3M15 7h3M18 4l3 3-3 3M18 14l3 3-3 3",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7",
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
}, Ca = {
  play: "M8 5.5v13l10.5-6.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  prev: "M6 6h2v12H6zM20 6v12L9.5 12z",
  next: "M16 6h2v12h-2zM4 6v12l10.5-6z"
}, q = (e, t = 22) => r`<svg class="i" aria-hidden="true" viewBox="0 0 24 24" style="width:${t}px;height:${t}px">${U`<path d=${Ma[e] ?? ""}></path>`}</svg>`, v = (e, t = 22) => r`<svg aria-hidden="true" viewBox="0 0 24 24" style="width:${t}px;height:${t}px;fill:currentColor">${U`<path d=${Ca[e] ?? ""}></path>`}</svg>`, wa = (e) => /rain|pour|storm|lightning/.test(e) ? "rain" : /cloud|fog/.test(e) ? "cloud" : /night/.test(e) ? "moon" : "sun", u = (e) => e === "family" || e === void 0 ? "var(--p-family)" : `var(--p-${e})`, ja = (e) => e.toLowerCase().replace(/[^a-z0-9]+/g, "_"), w = (e) => {
  const t = ja(e.name);
  return {
    chores: e.chores ?? `todo.${t}_chores`,
    points: e.points ?? `input_number.${t}_points`,
    lifetime: e.lifetime ?? `input_number.${t}_lifetime_points`,
    streak: e.streak ?? `input_number.${t}_streak`,
    avatar: e.avatar ?? `input_text.${t}_avatar`,
    calendar: e.calendar ?? `calendar.${t}`,
    week: `input_text.${t}_week`,
    goal: `input_text.${t}_goal`,
    grow: `input_number.${t}_grow`,
    slug: t
  };
}, L = (e, t) => {
  const i = Number(e?.states[t]?.state);
  return Number.isFinite(i) ? i : 0;
}, Ga = [
  ["Frozen", "--p-1", "frozen|ice cream|icecream|ice block|icy pole|frozen peas|ice"],
  ["Household", "--p-5", "dishwasher tablet|tablet|detergent|soap|shampoo|conditioner|toothpaste|paper towel|tissue|toilet|foil|cling wrap|glad wrap|baking paper|bin liner|bag|clean|spray|sponge|nappy|nappies|wipes|battery|batteries"],
  ["Pantry", "--p-3", "peanut butter|pasta|rice|flour|sugar|oil|sauce|cereal|weet-bix|weetbix|oats|coffee|tea|honey|jam|vegemite|peanut|stock|spice|salt|pepper|noodle|bean|lentil|tin|can|biscuit|cracker|chip|snack|chocolate|nut|muesli"],
  ["Fruit & veg", "--p-4", "watermelon|apple|banana|avocado|orange|lemon|lime|grape|berr|melon|mango|pear|peach|kiwi|tomato|potato|onion|garlic|carrot|lettuce|spinach|broccoli|cauli|capsicum|cucumber|zucchini|mushroom|herb|coriander|basil|salad|corn|pumpkin|celery|ginger|fruit|veg"],
  ["Dairy & eggs", "--p-1", "milk|cheese|yoghurt|yogurt|butter|cream|egg|custard"],
  ["Bakery", "--accent", "bread|sourdough|roll|wrap|bagel|muffin|croissant|bun|loaf|tortilla|crumpet"],
  ["Meat & fish", "--p-2", "chicken|beef|lamb|pork|mince|sausage|bacon|ham|steak|fish|salmon|prawn|tuna|turkey|meat"],
  ["Drinks", "--p-4", "juice|water|soft drink|soda|cordial|beer|wine|kombucha"]
], za = Ga.map(([e, t, i]) => [e, t, new RegExp(`\\b(${i})`)]), ht = (e) => {
  const t = e.toLowerCase();
  for (const [i, a, o] of za) if (o.test(t)) return [i, a];
  return ["Other", "--p-family"];
}, La = ["qwertyuiop", "asdfghjkl", "zxcvbnm"], Vt = class Vt extends g {
  constructor() {
    super(...arguments), this.entity = "todo.shopping_list", this.usuals = ["Milk", "Bread", "Eggs", "Bananas", "Cheese", "Coffee"], this.recipients = [], this._items = [], this._typed = "", this._toast = "", this._subFor = "";
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsub?.(), this._unsub = void 0, this._subFor = "";
  }
  updated(t) {
    (t.has("hass") || t.has("entity")) && this.hass && this._subFor !== this.entity && this._subscribe();
  }
  async _subscribe() {
    this._unsub?.(), this._subFor = this.entity;
    const t = this.hass?.connection;
    if (t)
      try {
        this._unsub = await t.subscribeMessage((i) => {
          this._items = i.items;
        }, { type: "todo/item/subscribe", entity_id: this.entity });
      } catch (i) {
        console.warn("Family Hub: grocery subscribe failed", i);
      }
  }
  _say(t) {
    this._toast = t, clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => {
      this._toast = "";
    }, 2600);
  }
  _add(t = this._typed) {
    const i = t.trim();
    if (!i || !this.hass) return;
    const a = i.charAt(0).toUpperCase() + i.slice(1);
    if (this._items.some((o) => o.status === "needs_action" && o.summary.toLowerCase() === a.toLowerCase())) {
      this._say(`${a} is already on the list`), this._typed = "";
      return;
    }
    this.hass.callService("todo", "add_item", { item: a }, { entity_id: this.entity }), this._typed = "";
  }
  _toggle(t) {
    this.hass?.callService("todo", "update_item", { item: t.uid, status: t.status === "completed" ? "needs_action" : "completed" }, { entity_id: this.entity });
  }
  _clearDone() {
    this.hass?.callService("todo", "remove_completed_items", {}, { entity_id: this.entity });
  }
  _send(t) {
    const i = this._items.filter((p) => p.status === "needs_action");
    if (!i.length) {
      this._say("The list is empty");
      return;
    }
    const a = t.notify?.replace(/^notify\./, "");
    if (!a || !this.hass?.services?.notify?.[a]) {
      this._say(`Set up the Home Assistant app on ${t.name}’s phone first`);
      return;
    }
    const o = /* @__PURE__ */ new Map();
    for (const p of i) {
      const l = ht(p.summary)[0];
      o.set(l, [...o.get(l) ?? [], p.summary]);
    }
    const s = [...o].map(([p, l]) => `${p}: ${l.join(", ")}`).join(`
`);
    this.hass.callService("notify", a, { title: `Groceries (${i.length})`, message: s, data: { url: "/todo?entity_id=" + this.entity } }), this._say(`List sent to ${t.name}’s phone`);
  }
  render() {
    const t = this._items.filter((o) => o.status === "needs_action"), i = this._items.filter((o) => o.status === "completed"), a = [...t].sort((o, s) => ht(o.summary)[0].localeCompare(ht(s.summary)[0]));
    return r`
      <section class="glass list" aria-label="Shopping list">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h1 style="font-size:26px;font-weight:800">Groceries</h1>
          <span class="muted" style="font-size:14px;font-weight:600">${t.length} to buy</span>
        </div>
        <div class="items">
          ${a.map((o) => this._row(o))}
          ${i.length ? r`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="label">In the trolley</span>
            <button class="tap muted" style="font-size:13px;font-weight:700" @click=${() => this._clearDone()}>Clear ${i.length}</button></div>
            ${i.map((o) => this._row(o))}` : K}
          ${this._items.length ? K : r`<div class="empty"><span style="color:var(--accent)">${q("cart", 40)}</span><span>Nothing on the list yet</span></div>`}
        </div>
        <span class="muted" style="font-size:12px">Also live in the Home Assistant app – tick things off in the shop.</span>
      </section>

      <section class="glass add" aria-label="Add an item">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="muted" style="font-size:15px;font-weight:600;flex:1">Send the list to</span>
          ${this.recipients.map((o) => r`<button class="who glass tap" @click=${() => this._send(o)}>
            <span class="avatar" style="width:34px;height:34px;font-size:14px;background:${u(o.colour)}">${o.name[0]}</span>${o.name}</button>`)}
          ${this.recipients.length ? K : r`<span class="muted" style="font-size:13px">(add phones in the card settings)</span>`}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <input class="field" .value=${this._typed} inputmode="none" autocomplete="off" placeholder="Type an item…" aria-label="New item"
            @input=${(o) => {
      this._typed = o.target.value;
    }}
            @keydown=${(o) => {
      o.key === "Enter" && this._add();
    }} />
          <button class="tap primary" style="height:60px;padding:0 26px;border-radius:16px;font-size:18px;font-weight:700" @click=${() => this._add()}>Add</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="muted" style="font-size:13px;font-weight:700;margin-right:4px">Usuals</span>
          ${this.usuals.map((o) => r`<button class="chip tap" @click=${() => this._add(o)}>+ ${o}</button>`)}
        </div>
        <div class="keys">
          ${La.map((o) => r`<div class="row">${o.split("").map((s) => r`<button class="key" @click=${() => {
      this._typed += s;
    }}>${s}</button>`)}</div>`)}
          <div class="row">
            <button class="key" style="width:420px;font-size:17px" @click=${() => {
      this._typed += " ";
    }}>space</button>
            <button class="key" style="width:136px;background:var(--chip)" aria-label="Delete" @click=${() => {
      this._typed = this._typed.slice(0, -1);
    }}>⌫</button>
          </div>
        </div>
      </section>
      ${this._toast ? r`<div class="toast" role="status">${this._toast}</div>` : K}`;
  }
  _row(t) {
    const [i, a] = ht(t.summary), o = t.status === "completed" ? "done" : "";
    return r`<button class="item tap fade ${o}" aria-pressed=${String(t.status === "completed")} @click=${() => this._toggle(t)}>
      <span class="box">${t.status === "completed" ? r`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : K}</span>
      <span class="txt">${t.summary}</span>
      <span class="tag" style="color:var(${a});background:color-mix(in srgb, var(${a}) 14%, transparent)">${i}</span>
    </button>`;
  }
};
Vt.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .list { width: 420px; flex-shrink: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
    .items { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 14px; background: var(--chip); width: 100%; text-align: left; }
    .box { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink3); }
    .done .box { background: var(--ok); border-color: var(--ok); color: #fff; }
    .done .txt { color: var(--ink3); text-decoration: line-through; }
    .txt { flex: 1; font-size: 17px; font-weight: 600; }
    .tag { font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
    .add { flex: 1; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .field { flex: 1; height: 60px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: 600; color: var(--ink);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); outline: none; }
    .field::placeholder { color: var(--ink3); font-weight: 500; }
    .keys { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: flex-end; }
    .row { display: flex; gap: 8px; justify-content: center; }
    .key { width: 64px; height: 64px; border-radius: 14px; background: var(--chip-strong); box-shadow: 0 2px 0 rgba(0,0,0,.12); font-size: 24px; font-weight: 500; transition: transform .1s ease; }
    .key:active { transform: scale(.92); background: var(--chip); }
    .chip { height: 38px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; }
    .who { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; }
  `], Vt.properties = {
  hass: { attribute: !1 },
  entity: {},
  usuals: { attribute: !1 },
  recipients: { attribute: !1 },
  _items: { state: !0 },
  _typed: { state: !0 },
  _toast: { state: !0 }
};
let Qt = Vt;
customElements.get("fh-groceries") || customElements.define("fh-groceries", Qt);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Za = (e) => (...t) => ({ _$litDirective$: e, values: t });
let va = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, i, a) {
    this._$Ct = t, this._$AM = i, this._$Ci = a;
  }
  _$AS(t, i) {
    return this.update(t, i);
  }
  update(t, i) {
    return this.render(...i);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Qa = {}, Ya = (e, t = Qa) => e._$AH = t;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ba = Za(class extends va {
  constructor() {
    super(...arguments), this.key = K;
  }
  render(e, t) {
    return this.key = e, t;
  }
  update(e, [t, i]) {
    return t !== this.key && (Ya(e), this.key = t), i;
  }
}), Ja = {
  skin: "#f1c7a5",
  hair: "short",
  hairColour: "#5a3825",
  eyes: "normal",
  mouth: "smile",
  hat: "none",
  eyewear: "none",
  top: "tee",
  topColour: "#0b5fa5",
  gear: "none",
  buddy: "none",
  scene: "plain"
}, _i = [["skin", "s"], ["hair", "h"], ["hairColour", "hc"], ["eyes", "e"], ["mouth", "m"], ["hat", "a"], ["eyewear", "u"], ["top", "t"], ["topColour", "tc"], ["gear", "g"], ["buddy", "b"], ["scene", "sc"]], zt = (e) => _i.map(([t, i]) => `${i}=${String(e[t]).replace("#", "")}`).join(";"), $ = (e, t = {}) => {
  const i = { ...Ja, ...t };
  if (!e || e === "unknown" || !e.includes("=")) return i;
  const a = Object.fromEntries(e.split(";").map((o) => o.split("=")));
  for (const [o, s] of _i) a[s] && (i[o] = /colour|skin/i.test(o) ? `#${a[s]}` : a[s]);
  return i;
}, P = [
  {
    id: "hair",
    emoji: "💇",
    label: "Hair",
    key: "hair",
    crop: "head",
    items: [["short", "Short", 0], ["quiff", "Styled quiff", 0], ["swept", "Swept", 0], ["pageboy", "Page boy", 0], ["spiky", "Spiky", 0], ["curly", "Curly", 0], ["buzz", "Buzz cut", 0], ["surfer", "Surfer", 300], ["mohawk", "Mohawk", 1100], ["mullet", "Mullet", 1600]],
    swatch: { key: "hairColour", label: "Colour", items: [["#5a3825", "Brown", 0], ["#2a1d16", "Dark brown", 0], ["#151110", "Black", 0], ["#e3b85c", "Blonde", 0], ["#c0592b", "Ginger", 0], ["#2f6fe0", "Electric blue", 700], ["#e2559b", "Hot pink", 1400], ["#22c55e", "Slime green", 2e3]] }
  },
  {
    id: "face",
    emoji: "🙂",
    label: "Face",
    key: "eyes",
    crop: "head",
    items: [["eyes:normal", "Bright eyes", 0], ["eyes:happy", "Happy eyes", 0], ["eyes:wink", "Wink", 0], ["mouth:smile", "Smile", 0], ["mouth:grin", "Big grin", 0], ["mouth:smirk", "Smirk", 0], ["mouth:wow", "Wow", 0]],
    swatch: { key: "skin", label: "Skin", items: [["#f6d9c2", "Skin 1", 0], ["#f1c7a5", "Skin 2", 0], ["#e0ac84", "Skin 3", 0], ["#c98b5e", "Skin 4", 0], ["#8d5a3b", "Skin 5", 0], ["#5c3a24", "Skin 6", 0]] }
  },
  {
    id: "hats",
    emoji: "🧢",
    label: "Hats",
    key: "hat",
    crop: "head",
    items: [["none", "No hat", 0], ["cap", "Cap", 0], ["backcap", "Backwards cap", 60], ["beanie", "Beanie", 150], ["swimcap", "Swim cap", 200], ["bucket", "Bucket hat", 300], ["dinohood", "Dino hood", 400], ["headphones", "Headphones", 550], ["knight", "Knight helm", 750], ["wizard", "Wizard hat", 900], ["akubra", "Akubra", 1300], ["crown", "Crown", 2200], ["helmet", "Space helmet", 3e3]]
  },
  {
    id: "eyewear",
    emoji: "🕶️",
    label: "Sunnies",
    key: "eyewear",
    crop: "head",
    items: [["none", "None", 0], ["round", "Round sunnies", 50], ["zinc", "Zinc stripe", 100], ["swim", "Swim goggles", 200], ["aviator", "Aviators", 650], ["shutter", "Shutter shades", 1e3], ["ski", "Ski goggles", 1200], ["star", "Star sunnies", 1700]]
  },
  {
    id: "tops",
    emoji: "👕",
    label: "Tops",
    key: "top",
    crop: "full",
    items: [["tee", "T-shirt", 0], ["hoodie", "Hoodie", 200], ["island", "Island shirt", 250], ["polo", "Tennis polo", 300], ["rashie", "Rashie", 300], ["band", "Band jacket", 0, 20], ["cloak", "Hooded cloak", 650], ["footy", "Footy jumper", 900], ["wetsuit", "Wetsuit", 1200], ["armour", "Battle armour", 1800], ["astro", "Space suit", 3e3]],
    swatch: { key: "topColour", label: "Colour", items: [["#0b5fa5", "Blue", 0], ["#0f766e", "Teal", 0], ["#16a34a", "Green", 0], ["#c2410c", "Orange", 0], ["#be185d", "Pink", 0], ["#6d28d9", "Purple", 0], ["#334155", "Charcoal", 0], ["#f5b301", "Yellow", 0]] }
  },
  {
    id: "gear",
    emoji: "🎺",
    label: "Gear",
    key: "gear",
    crop: "full",
    items: [["none", "Nothing", 0], ["trumpet", "Trumpet", 0, 5], ["clarinet", "Clarinet", 0, 5], ["books", "Book stack", 0, 5], ["racquet", "Tennis racquet", 150], ["truck", "Toy truck", 100], ["scooter", "Scooter", 250], ["bat", "Cricket bat", 450], ["miniature", "Painted miniature", 500], ["footy", "Footy", 700], ["surfboard", "Surfboard", 850], ["skateboard", "Skateboard", 1e3]]
  },
  {
    id: "buddy",
    emoji: "🐉",
    label: "Buddies",
    key: "buddy",
    crop: "full",
    items: [["none", "No buddy", 0], ["quokka", "Quokka", 350], ["owl", "Book owl", 0, 15], ["dino", "Dinosaur", 500], ["turtle", "Turtle", 700], ["raven", "Raven", 950], ["dragon", "Dragon", 1400]]
  },
  {
    id: "scene",
    emoji: "🏝️",
    label: "Scenes",
    key: "scene",
    crop: "full",
    items: [["plain", "Sky", 0], ["beach", "Beach", 0], ["pool", "Pool", 200], ["court", "Tennis court", 200], ["library", "Library", 0, 10], ["rottnest", "Rottnest", 400], ["sunset", "Sunset", 500], ["reef", "Reef", 600], ["volcano", "Dino valley", 750], ["stadium", "Stadium", 1e3], ["castle", "Castle", 1100], ["forge", "Forge", 1500], ["space", "Space", 2e3]]
  }
], rt = P.flatMap((e) => [
  ...e.items.filter((t) => t[2] > 0 && !t[3]).map((t) => ({ cat: e, id: t[0], label: t[1], req: t[2] })),
  ...e.swatch?.items.filter((t) => t[2] > 0).map((t) => ({ cat: e, id: t[0], label: `${t[1]} ${e.id === "hair" ? "hair" : ""}`.trim(), req: t[2], swatch: !0 })) ?? []
]).sort((e, t) => e.req - t.req), Ia = (e, t) => rt.filter((i) => i.req > e && i.req <= t), $i = P.flatMap((e) => e.items.filter((t) => t[3]).map((t) => ({ cat: e, id: t[0], label: t[1], req: t[3] }))), Xa = (e, t) => $i.filter((i) => i.req > e && i.req <= t), at = (e, t, i) => e[3] ? i >= e[3] : t >= e[2], ot = ["Explorer", "Ranger", "Navigator", "Captain", "Commander", "Admiral", "Legend", "Mythic", "Cosmic"], Da = (e) => {
  let t = 1, i = 0, a = 100;
  for (; e >= i + a; )
    i += a, t++, a = 100 + 50 * (t - 1);
  const o = Math.min(ot.length - 1, Math.floor((t - 1) / 2));
  return { level: t, rank: `${ot[o]}${(t - 1) % 2 ? " II" : ""}`, into: e - i, need: a, nextRank: t % 2 ? `${ot[o]} II` : ot[Math.min(ot.length - 1, o + 1)] };
}, ta = (e, t = [], i) => {
  if (i) {
    const s = rt.find((p) => p.id === i && p.req > e);
    if (s) return s;
  }
  const a = rt.find((s) => s.req > e);
  if (!a) return;
  const o = rt.filter((s) => s.req > e && t.includes(s.id)).sort((s, p) => s.req - p.req)[0];
  return o && o.req <= a.req + 100 ? o : a;
}, ia = (e) => rt.filter((t) => t.req <= e).reduce((t, i) => Math.max(t, i.req), 0), O = (e, t, i, a = !1) => {
  if (a && t.swatch) return { ...e, [t.swatch.key]: i };
  if (i.includes(":")) {
    const [o, s] = i.split(":");
    return { ...e, [o]: s };
  }
  return { ...e, [t.key]: i };
}, Pa = (e, t, i) => {
  if (i.includes(":")) {
    const [a, o] = i.split(":");
    return e[a] === o;
  }
  return e[t.key] === i;
}, Yt = (e, t, i) => {
  const a = [];
  for (let o = 0; o < 10; o++) {
    const s = -Math.PI / 2 + o * Math.PI / 5, p = o % 2 ? i * 0.45 : i;
    a.push(`${(e + Math.cos(s) * p).toFixed(1)} ${(t + Math.sin(s) * p).toFixed(1)}`);
  }
  return `M${a.join(" L")} Z`;
}, N = "M30 240 C32 190 62 166 100 166 C138 166 168 190 170 240 Z", Fi = {
  plain: () => U`<g class="av-pop"><rect width="200" height="240" fill="#dbeafe"></rect><circle cx="100" cy="120" r="82" fill="#bfdbfe"></circle></g>`,
  beach: () => U`<g class="av-pop"><rect width="200" height="240" fill="#9fd8f5"></rect><circle cx="162" cy="46" r="18" fill="#ffd166"></circle><rect y="150" width="200" height="40" fill="#3a9ad9"></rect><rect y="168" width="200" height="4" fill="#bfe6f7"></rect><rect y="190" width="200" height="50" fill="#f1d39b"></rect></g>`,
  pool: () => U`<g class="av-pop"><rect width="200" height="240" fill="#38bdf8"></rect><rect y="40" width="200" height="6" fill="#e0f2fe"></rect><rect y="100" width="200" height="6" fill="#e0f2fe"></rect><rect y="160" width="200" height="6" fill="#e0f2fe"></rect><rect y="70" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="130" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="190" width="200" height="4" fill="#ef4444" opacity=".7"></rect></g>`,
  court: () => U`<g class="av-pop"><rect width="200" height="240" fill="#2563eb"></rect><rect x="12" y="12" width="176" height="216" fill="none" stroke="#fff" stroke-width="3"></rect><rect x="12" y="118" width="176" height="4" fill="#fff"></rect><rect x="98" y="12" width="4" height="216" fill="#fff" opacity=".6"></rect><circle cx="40" cy="60" r="7" fill="#d9f99d"></circle></g>`,
  library: () => U`<g class="av-pop"><rect width="200" height="240" fill="#7c2d12"></rect>${[30, 80, 130, 180].map((e) => U`<rect y=${e + 34} width="200" height="6" fill="#451a03"></rect>${[8, 22, 34, 48, 60, 150, 162, 176, 188].map((t, i) => U`<rect x=${t} y=${e} width="10" height="34" fill=${["#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed"][(i + e) % 5]}></rect>`)}`)}</g>`,
  sunset: () => U`<g class="av-pop"><rect width="200" height="240" fill="#f7a35c"></rect><rect y="96" width="200" height="144" fill="#e76f51"></rect><circle cx="100" cy="150" r="56" fill="#ffd166"></circle><rect y="190" width="200" height="50" fill="#9c3d54"></rect></g>`,
  reef: () => U`<g class="av-pop"><rect width="200" height="240" fill="#1aa3b8"></rect><rect y="196" width="200" height="44" fill="#0e7490"></rect><circle cx="30" cy="60" r="6" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="40" cy="40" r="4" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="170" cy="80" r="7" fill="none" stroke="#d6fbff" stroke-width="2"></circle><path d="M12 240 C14 214 22 206 28 200 C30 214 26 226 30 240 Z" fill="#fb7185"></path><path d="M176 240 C178 220 186 208 192 204 C194 220 188 230 192 240 Z" fill="#fbbf24"></path></g>`,
  volcano: () => U`<g class="av-pop"><rect width="200" height="240" fill="#fde68a"></rect><path d="M110 150 L150 40 L170 40 L200 150 Z" fill="#57534e"></path><path d="M150 40 L170 40 L164 70 L156 60 Z" fill="#f97316"></path><circle cx="162" cy="24" r="10" fill="#a8a29e" opacity=".7"></circle><rect y="150" width="200" height="90" fill="#65a30d"></rect><path d="M0 170 C20 150 30 170 40 160 C50 150 60 170 70 158" fill="none" stroke="#3f6212" stroke-width="5"></path></g>`,
  stadium: () => U`<g class="av-pop"><rect width="200" height="240" fill="#1e293b"></rect><rect y="160" width="200" height="80" fill="#16a34a"></rect><rect y="196" width="200" height="6" fill="#86efac"></rect><circle cx="28" cy="28" r="10" fill="#fff7c2"></circle><circle cx="172" cy="28" r="10" fill="#fff7c2"></circle><rect x="26" y="38" width="4" height="122" fill="#64748b"></rect><rect x="170" y="38" width="4" height="122" fill="#64748b"></rect></g>`,
  castle: () => U`<g class="av-pop"><rect width="200" height="240" fill="#c7d2fe"></rect><rect x="20" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="146" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="20" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="34" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="46" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="146" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="158" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="172" y="60" width="8" height="12" fill="#94a3b8"></rect><path d="M162 60 V30 L180 38 L162 46" fill="#dc2626" stroke="#475569" stroke-width="2"></path><rect y="190" width="200" height="50" fill="#4d7c0f"></rect></g>`,
  rottnest: () => U`<g class="av-pop"><rect width="200" height="240" fill="#7dd3fc"></rect><rect y="140" width="200" height="50" fill="#22d3ee"></rect><rect y="152" width="200" height="38" fill="#0ea5e9"></rect><path d="M0 190 C40 176 70 184 100 180 C140 174 170 182 200 176 L200 240 L0 240 Z" fill="#fde7b0"></path><rect x="150" y="96" width="10" height="46" fill="#f5f5f4"></rect><path d="M146 96 L164 96 L155 84 Z" fill="#dc2626"></path><circle cx="40" cy="40" r="14" fill="#fde047"></circle></g>`,
  forge: () => U`<g class="av-pop"><rect width="200" height="240" fill="#292524"></rect><rect y="180" width="200" height="60" fill="#44403c"></rect><path d="M120 180 L130 130 L190 130 L200 180 Z" fill="#57534e"></path><ellipse cx="160" cy="150" rx="22" ry="10" fill="#f97316" class="av-flame"></ellipse><ellipse cx="160" cy="146" rx="12" ry="6" fill="#fde047" class="av-flame"></ellipse><rect x="18" y="40" width="40" height="26" rx="3" fill="#78716c"></rect><rect x="24" y="66" width="6" height="40" fill="#78716c"></rect>${[[30, 20], [80, 30], [176, 24]].map(([e, t]) => U`<circle cx=${e} cy=${t} r="2" fill="#fb923c"></circle>`)}</g>`,
  space: () => U`<g class="av-pop"><rect width="200" height="240" fill="#14163a"></rect><circle cx="38" cy="48" r="16" fill="#f0a35e"></circle><ellipse cx="38" cy="48" rx="27" ry="6" fill="none" stroke="#ffd7a8" stroke-width="2.5"></ellipse>${[[150, 30], [176, 74], [120, 18], [20, 120], [182, 140], [70, 22], [14, 190]].map(([e, t]) => U`<circle cx=${e} cy=${t} r="1.6" fill="#fff"></circle>`)}</g>`
}, Si = { rottnest: "#7dd3fc", forge: "#57534e", plain: "#dbeafe", beach: "#9fd8f5", pool: "#38bdf8", court: "#2563eb", library: "#7c2d12", sunset: "#f7a35c", reef: "#1aa3b8", volcano: "#fde68a", stadium: "#16a34a", castle: "#c7d2fe", space: "#14163a" }, ui = {
  surfboard: () => U`<g class="av-pop d6"><g transform="rotate(-16 158 150)"><ellipse cx="158" cy="150" rx="17" ry="82" fill="#f97316"></ellipse><rect x="155" y="70" width="6" height="160" fill="#fff" opacity=".85"></rect></g></g>`,
  skateboard: () => U`<g class="av-pop d6"><g transform="rotate(18 40 160)"><rect x="30" y="90" width="22" height="124" rx="11" fill="#7c3aed"></rect><rect x="34" y="98" width="14" height="108" rx="7" fill="#a78bfa"></rect><circle cx="28" cy="112" r="5" fill="#f5b301"></circle><circle cx="54" cy="112" r="5" fill="#f5b301"></circle><circle cx="28" cy="192" r="5" fill="#f5b301"></circle><circle cx="54" cy="192" r="5" fill="#f5b301"></circle></g></g>`,
  bat: () => U`<g class="av-pop d6"><g transform="rotate(-24 160 150)"><rect x="152" y="70" width="8" height="40" rx="3" fill="#7c4a1e"></rect><rect x="146" y="106" width="20" height="104" rx="6" fill="#f3d9a4" stroke="#c9a46a" stroke-width="2"></rect></g></g>`,
  racquet: () => U`<g class="av-pop d6"><g transform="rotate(24 160 120)"><ellipse cx="160" cy="98" rx="24" ry="30" fill="rgba(255,255,255,.25)" stroke="#16a34a" stroke-width="6"></ellipse><path d="M140 98 H180 M160 70 V126 M150 74 V122 M170 74 V122 M142 86 H178 M142 110 H178" stroke="#e5e7eb" stroke-width="1.4"></path><rect x="156" y="128" width="8" height="46" rx="3" fill="#111827"></rect></g><circle cx="182" cy="168" r="9" fill="#d9f99d" stroke="#a3e635" stroke-width="2"></circle></g>`,
  scooter: () => U`<g class="av-pop d6"><rect x="20" y="118" width="6" height="104" rx="3" fill="#94a3b8" transform="rotate(-8 23 170)"></rect><rect x="6" y="114" width="30" height="7" rx="3.5" fill="#0f172a"></rect><rect x="18" y="220" width="72" height="9" rx="4.5" fill="#ef4444"></rect><circle cx="26" cy="232" r="7" fill="#111"></circle><circle cx="84" cy="232" r="7" fill="#111"></circle></g>`,
  clarinet: () => U`<g class="av-pop d6"><g transform="rotate(20 150 180)"><rect x="146" y="112" width="10" height="114" rx="4" fill="#1f2937"></rect><rect x="148" y="104" width="6" height="10" rx="2" fill="#111"></rect><path d="M140 224 L162 224 L168 240 L134 240 Z" fill="#111827"></path>${[132, 150, 168, 186, 204].map((e) => U`<circle cx="151" cy=${e} r="2.6" fill="#d1d5db"></circle>`)}</g></g>`
}, Vi = {
  footy: () => U`<g class="av-pop d6"><g transform="rotate(-28 150 212)"><ellipse cx="150" cy="212" rx="24" ry="15" fill="#b91c1c"></ellipse><path d="M140 212 H160 M144 208 V216 M150 208 V216 M156 208 V216" stroke="#fff" stroke-width="2" stroke-linecap="round"></path></g></g>`,
  trumpet: () => U`<g class="av-pop d6"><g transform="rotate(-18 150 206)"><rect x="104" y="202" width="66" height="8" rx="3" fill="#e0a800"></rect><path d="M166 190 L192 178 L192 234 L166 222 Z" fill="#f5c400" stroke="#c99700" stroke-width="1.5"></path><rect x="124" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="134" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="144" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="98" y="200" width="8" height="12" rx="3" fill="#a16207"></rect></g></g>`,
  books: () => U`<g class="av-pop d6"><rect x="36" y="214" width="56" height="12" rx="2" fill="#f59e0b"></rect><rect x="32" y="202" width="56" height="12" rx="2" fill="#dc2626"></rect><rect x="38" y="190" width="50" height="12" rx="2" fill="#2563eb"></rect><rect x="34" y="178" width="54" height="12" rx="2" fill="#16a34a"></rect><rect x="40" y="181" width="40" height="2" fill="#bbf7d0"></rect><rect x="38" y="205" width="40" height="2" fill="#fecaca"></rect></g>`,
  truck: () => U`<g class="av-pop d6"><path d="M124 204 L162 196 L164 224 L126 224 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2"></path><rect x="162" y="202" width="26" height="24" rx="4" fill="#f97316"></rect><rect x="168" y="206" width="14" height="9" rx="2" fill="#bae6fd"></rect><circle cx="138" cy="230" r="8" fill="#111"></circle><circle cx="178" cy="230" r="8" fill="#111"></circle><circle cx="138" cy="230" r="3" fill="#9ca3af"></circle><circle cx="178" cy="230" r="3" fill="#9ca3af"></circle></g>`,
  miniature: () => U`<g class="av-pop d6"><ellipse cx="160" cy="232" rx="20" ry="5" fill="#334155"></ellipse><path d="M150 230 L152 202 L168 202 L170 230 Z" fill="#7c3aed"></path><path d="M146 206 L154 206 L154 222 L146 222 Z" fill="#b91c1c" stroke="#fde68a" stroke-width="1.5"></path><circle cx="160" cy="194" r="9" fill="#9ca3af"></circle><rect x="153" y="192" width="14" height="3" fill="#1f2937"></rect><rect x="170" y="176" width="3" height="40" fill="#e5e7eb"></rect><rect x="166" y="206" width="11" height="3" fill="#a16207"></rect></g>`
}, gi = {
  quokka: () => U`<g class="av-pop d6"><ellipse cx="32" cy="214" rx="20" ry="22" fill="#a16207"></ellipse><ellipse cx="32" cy="220" rx="11" ry="13" fill="#d6b88a"></ellipse><circle cx="32" cy="186" r="14" fill="#a16207"></circle><circle cx="22" cy="176" r="5" fill="#a16207"></circle><circle cx="42" cy="176" r="5" fill="#a16207"></circle><circle cx="27" cy="184" r="2" fill="#111"></circle><circle cx="37" cy="184" r="2" fill="#111"></circle><ellipse cx="32" cy="191" rx="4" ry="3" fill="#3f2a14"></ellipse><path d="M27 195 Q32 200 37 195" fill="none" stroke="#3f2a14" stroke-width="1.6"></path></g>`,
  raven: () => U`<g class="av-pop d6"><ellipse cx="32" cy="210" rx="16" ry="22" fill="#111827"></ellipse><circle cx="34" cy="184" r="11" fill="#111827"></circle><path d="M43 184 L58 188 L43 191 Z" fill="#78716c"></path><circle cx="37" cy="181" r="2.2" fill="#fbbf24"></circle><path d="M18 204 C6 214 10 230 20 232 Z" fill="#1f2937"></path><path d="M26 230 L22 240 M36 230 L38 240" stroke="#78716c" stroke-width="2.5"></path></g>`,
  owl: () => U`<g class="av-pop d6"><ellipse cx="30" cy="206" rx="20" ry="24" fill="#a16207"></ellipse><ellipse cx="30" cy="212" rx="12" ry="14" fill="#fde68a"></ellipse><circle cx="22" cy="196" r="7" fill="#fff"></circle><circle cx="38" cy="196" r="7" fill="#fff"></circle><circle cx="22" cy="196" r="3" fill="#111"></circle><circle cx="38" cy="196" r="3" fill="#111"></circle><path d="M27 203 L33 203 L30 208 Z" fill="#f97316"></path><path d="M12 184 L18 176 L22 186 M48 184 L42 176 L38 186" fill="#a16207"></path></g>`,
  dino: () => U`<g class="av-pop d6"><path d="M6 236 L18 202 C22 184 38 176 52 182 L66 166 C76 160 86 166 82 176 L72 186 C76 200 72 216 60 224 L60 238 L50 238 L48 228 L32 228 L30 238 L20 238 Z" fill="#0d9488"></path><circle cx="74" cy="171" r="2.4" fill="#111"></circle><path d="M30 186 L36 176 L40 186 M42 182 L48 172 L52 182" fill="#5eead4"></path><path d="M66 192 L58 198" stroke="#0f766e" stroke-width="3" stroke-linecap="round"></path></g>`,
  turtle: () => U`<g class="av-pop d6"><ellipse cx="34" cy="220" rx="26" ry="15" fill="#16a34a"></ellipse><path d="M14 220 L54 220 M24 208 L28 232 M44 208 L40 232" stroke="#14532d" stroke-width="2"></path><circle cx="64" cy="216" r="8" fill="#4ade80"></circle><circle cx="66" cy="214" r="1.8" fill="#111"></circle><ellipse cx="16" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse><ellipse cx="50" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse></g>`,
  dragon: () => U`<g class="av-pop d6"><path d="M8 236 C2 210 14 188 34 190 L52 160 L56 186 C70 194 70 218 56 230 L56 238 L44 238 L42 232 L26 232 L24 238 Z" fill="#16a34a"></path><path d="M24 192 L4 162 L34 182 Z" fill="#86efac"></path><path d="M36 190 L30 150 L50 178 Z" fill="#4ade80"></path><circle cx="56" cy="164" r="12" fill="#22c55e"></circle><circle cx="60" cy="161" r="2.6" fill="#111"></circle><path d="M50 152 L52 142 L56 152 M58 152 L62 143 L64 154" fill="#facc15"></path><path d="M66 168 C74 166 78 160 84 162" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" class="av-flame"></path></g>`
}, Ni = {
  mullet: (e) => U`<g class="av-pop d3" fill=${e.hairColour}><path d="M54 96 L48 156 C58 164 70 158 74 146 L74 100 Z"></path><path d="M146 96 L152 156 C142 164 130 158 126 146 L126 100 Z"></path></g>`,
  surfer: (e) => U`<g class="av-pop d3" fill=${e.hairColour}><path d="M52 98 C46 136 52 162 66 166 L74 108 Z"></path><path d="M148 98 C154 136 148 162 134 166 L126 108 Z"></path></g>`,
  pageboy: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M52 92 C48 120 50 140 58 148 L142 148 C150 140 152 120 148 92 Z"></path>`
}, fi = {
  short: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  quiff: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 66 70 54 88 52 C92 32 126 26 142 44 C132 44 124 48 121 55 C138 62 146 76 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  swept: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M55 100 C52 64 76 48 104 48 C132 48 150 66 145 100 C140 86 130 78 118 76 C100 73 82 84 64 70 C61 80 58 90 55 100 Z"></path>`,
  pageboy: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M54 102 C52 62 78 48 100 48 C122 48 148 62 146 102 C142 92 130 90 100 90 C70 90 58 92 54 102 Z"></path>`,
  spiky: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M56 99 L57 70 L70 78 L73 50 L88 66 L98 40 L109 64 L123 47 L127 72 L141 64 L145 99 C134 83 120 76 100 76 C80 76 66 83 56 99 Z"></path>`,
  curly: (e) => U`<g class="av-pop d3" fill=${e.hairColour}><path d="M57 98 C56 70 78 58 100 58 C124 58 145 70 144 98 C136 86 124 80 100 80 C78 80 64 86 57 98 Z"></path><circle cx="64" cy="82" r="14"></circle><circle cx="77" cy="63" r="15"></circle><circle cx="95" cy="54" r="16"></circle><circle cx="114" cy="55" r="16"></circle><circle cx="131" cy="66" r="15"></circle><circle cx="141" cy="84" r="13"></circle></g>`,
  buzz: (e) => U`<path class="av-pop d3" fill=${e.hairColour} opacity=".88" d="M58 93 C60 64 80 55 100 55 C122 55 140 64 142 93 C130 81 116 77 100 77 C84 77 70 81 58 93 Z"></path>`,
  surfer: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M55 102 C50 64 80 45 104 47 C133 50 151 70 145 104 C133 80 112 74 92 80 C77 85 63 93 55 102 Z"></path>`,
  mohawk: (e) => U`<g class="av-pop d3" fill=${e.hairColour}><path opacity=".45" d="M60 94 C62 72 80 62 100 62 C120 62 138 72 140 94 C130 84 116 80 100 80 C84 80 70 84 60 94 Z"></path><path d="M88 82 L90 40 L100 24 L110 40 L112 82 Z"></path></g>`,
  mullet: (e) => U`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`
}, Ti = {
  island: (e) => U`<g class="av-pop d1"><path d=${N} fill=${e.topColour}></path>${[[60, 200], [96, 214], [130, 196], [146, 224], [74, 228], [112, 186]].map(([t, i]) => U`<circle cx=${t} cy=${i} r="6" fill="#fde047" opacity=".9"></circle><circle cx=${t} cy=${i} r="2.5" fill="#f97316"></circle>`)}<path d="M84 168 L100 190 L116 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  cloak: (e) => U`<g class="av-pop d1"><path d="M22 240 C26 186 56 150 100 150 C144 150 174 186 178 240 Z" fill="#1f2937"></path><path d=${N} fill=${e.topColour}></path><path d="M100 166 L100 240" stroke="#111827" stroke-width="3"></path><circle cx="100" cy="176" r="5" fill="#d4af37"></circle></g>`,
  armour: () => U`<g class="av-pop d1"><path d=${N} fill="#64748b"></path><path d="M60 182 C80 172 120 172 140 182 L134 230 L66 230 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"></path><path d="M100 178 L100 230" stroke="#475569" stroke-width="2"></path><circle cx="48" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><circle cx="152" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><path d="M86 200 L100 192 L114 200 L100 212 Z" fill="#b91c1c"></path></g>`,
  tee: (e) => U`<g class="av-pop d1"><path d=${N} fill=${e.topColour}></path><path d="M84 168 Q100 182 116 168" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"></path></g>`,
  hoodie: (e) => U`<g class="av-pop d1"><path d=${N} fill=${e.topColour}></path><path d="M66 174 Q100 146 134 174 Q100 194 66 174 Z" fill="rgba(0,0,0,.22)"></path><path d="M92 182 L90 206 M108 182 L110 206" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><rect x="74" y="212" width="52" height="22" rx="8" fill="rgba(0,0,0,.12)"></rect></g>`,
  polo: (e) => U`<g class="av-pop d1"><path d=${N} fill="#f8fafc"></path><path d="M80 168 L100 186 L120 168 L114 164 L100 176 L86 164 Z" fill=${e.topColour}></path><circle cx="100" cy="194" r="2" fill="#94a3b8"></circle><circle cx="100" cy="204" r="2" fill="#94a3b8"></circle><path d="M44 214 L60 210" stroke=${e.topColour} stroke-width="4"></path></g>`,
  rashie: (e) => U`<g class="av-pop d1"><path d=${N} fill=${e.topColour}></path><path d="M40 216 C70 200 130 200 160 216" fill="none" stroke="#fff" stroke-width="5" opacity=".8"></path><path d="M90 168 L100 176 L110 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  band: (e) => U`<g class="av-pop d1"><path d=${N} fill="#7f1d1d"></path><rect x="92" y="170" width="16" height="70" fill="#991b1b"></rect>${[184, 198, 212, 226].map((t) => U`<circle cx="88" cy=${t} r="3" fill="#facc15"></circle><circle cx="112" cy=${t} r="3" fill="#facc15"></circle>`)}<path d="M50 196 L70 182 M150 196 L130 182" stroke="#facc15" stroke-width="4" stroke-linecap="round"></path></g>`,
  footy: () => U`<g class="av-pop d1"><clipPath id="fhBody"><path d=${N}></path></clipPath><g clip-path="url(#fhBody)"><rect y="160" width="200" height="80" fill="#1e3a8a"></rect><rect y="186" width="200" height="12" fill="#f5b301"></rect><rect y="210" width="200" height="12" fill="#f5b301"></rect></g><path d="M84 168 Q100 180 116 168" fill="none" stroke="#f5b301" stroke-width="4" stroke-linecap="round"></path></g>`,
  wetsuit: () => U`<g class="av-pop d1"><path d=${N} fill="#111827"></path><path d="M40 240 C44 204 58 186 72 180 L78 240 Z" fill="#0ea5e9"></path><path d="M160 240 C156 204 142 186 128 180 L122 240 Z" fill="#0ea5e9"></path></g>`,
  astro: () => U`<g class="av-pop d1"><path d=${N} fill="#e5e7eb"></path><rect x="78" y="196" width="44" height="30" rx="6" fill="#cbd5e1"></rect><circle cx="90" cy="211" r="4" fill="#ef4444"></circle><circle cx="104" cy="211" r="4" fill="#22c55e"></circle><rect x="112" y="207" width="6" height="8" rx="2" fill="#3b82f6"></rect></g>`
}, bi = {
  normal: () => U`<g class="av-pop d4"><ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><ellipse cx="116" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle><circle cx="118" cy="101.5" r="1.6" fill="#fff"></circle></g>`,
  happy: () => U`<g class="av-pop d4" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"><path d="M77 106 Q84 97 91 106"></path><path d="M109 106 Q116 97 123 106"></path></g>`,
  wink: () => U`<g class="av-pop d4"><ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle><path d="M109 105 Q116 99 123 105" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"></path></g>`
}, ki = {
  smile: () => U`<path class="av-pop d4" d="M88 122 Q100 133 112 122" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  grin: () => U`<g class="av-pop d4"><path d="M85 119 Q100 138 115 119 Z" fill="#3b1f14"></path><path d="M88 120 L112 120 L110.5 124 L89.5 124 Z" fill="#fff"></path></g>`,
  smirk: () => U`<path class="av-pop d4" d="M89 125 Q103 129 113 119" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  wow: () => U`<ellipse class="av-pop d4" cx="100" cy="124" rx="5.5" ry="6.5" fill="#3b1f14"></ellipse>`
}, xi = {
  zinc: () => U`<g class="av-pop d5"><path d="M93 104 Q100 100 107 104 L105 118 Q100 121 95 118 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"></path><path d="M70 112 L80 110 M120 110 L130 112" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"></path></g>`,
  round: () => U`<g class="av-pop d5"><circle cx="84" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><circle cx="116" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><path d="M95 103 Q100 99 105 103" fill="none" stroke="#111" stroke-width="2.5"></path><path d="M79 99 L84 96" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>`,
  swim: () => U`<g class="av-pop d5"><path d="M52 102 H148" stroke="#0ea5e9" stroke-width="4"></path><ellipse cx="84" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><ellipse cx="116" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><path d="M95 104 H105" stroke="#0369a1" stroke-width="3"></path></g>`,
  aviator: () => U`<g class="av-pop d5"><path d="M71 97 H97 Q97 118 84 118 Q71 118 71 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M103 97 H129 Q129 118 116 118 Q103 118 103 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M97 99 H103 M60 99 H71 M129 99 H140" stroke="#c9a227" stroke-width="2.2"></path></g>`,
  shutter: () => U`<g class="av-pop d5" fill="none" stroke="#f5b301" stroke-width="3"><rect x="69" y="95" width="62" height="19" rx="5"></rect><path d="M71 101 H129 M71 107 H129 M100 95 V114"></path></g>`,
  ski: () => U`<g class="av-pop d5"><path d="M50 104 H150" stroke="#111827" stroke-width="7"></path><rect x="67" y="92" width="66" height="24" rx="12" fill="rgba(80,200,255,.75)" stroke="#111827" stroke-width="3.5"></rect><path d="M76 98 L90 98" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"></path></g>`,
  star: () => U`<g class="av-pop d5" fill="#ff4fa3" stroke="#be185d" stroke-width="2" stroke-linejoin="round"><path d=${Yt(84, 104, 13)}></path><path d=${Yt(116, 104, 13)}></path><path d="M95 104 H105" stroke-width="2.5"></path></g>`
}, Wi = {
  knight: () => U`<g class="av-pop d5"><path d="M52 112 C48 60 72 40 100 40 C128 40 152 60 148 112 L140 112 L140 98 L60 98 L60 112 Z" fill="#94a3b8" stroke="#475569" stroke-width="2.5"></path><rect x="96" y="40" width="8" height="58" fill="#64748b"></rect><path d="M100 40 C96 22 112 16 120 24 C110 26 104 32 104 40 Z" fill="#b91c1c"></path></g>`,
  cap: () => U`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#d62d20"></path><path d="M100 84 L170 90 C168 99 150 99 100 93 Z" fill="#b91c1c"></path></g>`,
  backcap: () => U`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#2563eb"></path><path d="M58 86 L30 80 C30 72 44 70 58 76 Z" fill="#1d4ed8"></path><rect x="122" y="70" width="18" height="10" rx="4" fill="#bfdbfe"></rect></g>`,
  beanie: () => U`<g class="av-pop d5"><path d="M53 94 C53 56 76 43 100 43 C124 43 147 56 147 94 Z" fill="#0f766e"></path><rect x="50" y="84" width="100" height="14" rx="7" fill="#115e59"></rect><circle cx="100" cy="40" r="9" fill="#f5b301"></circle></g>`,
  swimcap: () => U`<g class="av-pop d5"><path d="M54 98 C52 58 76 44 100 44 C124 44 148 58 146 98 C136 90 120 86 100 86 C80 86 64 90 54 98 Z" fill="#0ea5e9"></path><path d="M70 64 Q100 52 130 64" fill="none" stroke="#e0f2fe" stroke-width="3" opacity=".7"></path></g>`,
  bucket: () => U`<g class="av-pop d5"><path d="M64 84 C66 54 80 45 100 45 C120 45 134 54 136 84 Z" fill="#d6c38f"></path><ellipse cx="100" cy="86" rx="58" ry="11" fill="#c2ad74"></ellipse><rect x="65" y="74" width="70" height="7" fill="#8b7a4a"></rect></g>`,
  dinohood: () => U`<g class="av-pop d5"><path d="M50 108 C46 60 74 40 100 40 C126 40 154 60 150 108 C146 92 132 82 100 82 C68 82 54 92 50 108 Z" fill="#16a34a"></path><path d="M70 46 L76 30 L84 42 L92 26 L100 40 L108 26 L116 42 L124 30 L130 46" fill="#facc15"></path><circle cx="76" cy="62" r="5" fill="#fff"></circle><circle cx="124" cy="62" r="5" fill="#fff"></circle><circle cx="76" cy="62" r="2.4" fill="#111"></circle><circle cx="124" cy="62" r="2.4" fill="#111"></circle></g>`,
  headphones: () => U`<g class="av-pop d5"><path d="M52 106 C50 48 150 48 148 106" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"></path><rect x="44" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect><rect x="138" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect></g>`,
  wizard: () => U`<g class="av-pop d5"><ellipse cx="100" cy="80" rx="60" ry="11" fill="#312e81"></ellipse><path d="M66 80 L100 4 L134 80 Z" fill="#4338ca"></path><path d=${Yt(100, 48, 8)} fill="#facc15"></path><circle cx="86" cy="66" r="2.5" fill="#fde68a"></circle><circle cx="116" cy="30" r="2" fill="#fde68a"></circle></g>`,
  akubra: () => U`<g class="av-pop d5"><ellipse cx="100" cy="82" rx="72" ry="13" fill="#7a4a24"></ellipse><path d="M66 82 C66 54 78 42 100 42 C122 42 134 54 134 82 Z" fill="#8b5a2b"></path><rect x="66" y="70" width="68" height="9" fill="#3b2414"></rect></g>`,
  crown: () => U`<g class="av-pop d5"><path d="M63 72 L68 38 L85 58 L100 30 L115 58 L132 38 L137 72 Z" fill="#f5b301" stroke="#b27f00" stroke-width="2.5" stroke-linejoin="round"></path><circle cx="100" cy="60" r="5" fill="#ef4444"></circle><circle cx="80" cy="64" r="3.5" fill="#3b82f6"></circle><circle cx="120" cy="64" r="3.5" fill="#22c55e"></circle></g>`,
  helmet: () => U`<g class="av-pop d5"><circle cx="100" cy="98" r="62" fill="rgba(186,230,253,.28)" stroke="#e5e7eb" stroke-width="7"></circle><path d="M62 72 Q76 50 100 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"></path></g>`
};
function Q(e, t = {}) {
  const i = t.size ?? 200, a = t.crop === "head", o = i, s = a ? i : Math.round(i * 1.2), p = t.jump ? t.jump % 2 ? "av-jump-a" : "av-jump-b" : "", l = t.age ?? "mid", n = l === "kid" ? "translate(100 104) scale(1.1) translate(-100 -104)" : l === "teen" ? "translate(100 100) scale(0.95 1.02) translate(-100 -100)" : "", c = l !== "kid" ? U`<g class="av-pop d4" stroke=${e.hairColour} stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"><path d=${l === "teen" ? "M76 92 L91 90" : "M77 93 Q84 89 91 92"}></path><path d=${l === "teen" ? "M109 90 L124 92" : "M109 92 Q116 89 123 93"}></path></g>` : K;
  return r`<span class="avwrap ${p}" style="display:inline-block;line-height:0;flex-shrink:0">
    <svg viewBox=${a ? "36 28 128 128" : "0 0 200 240"} width=${o} height=${s} role="img" aria-label=${t.label ?? "Avatar"}
      style="display:block;overflow:hidden;border-radius:${a ? "50%" : `${Math.round(i * 0.12)}px`}">
      ${a ? U`<circle cx="100" cy="92" r="64" fill=${Si[e.scene] ?? Si.plain}></circle>` : (Fi[e.scene] ?? Fi.plain)(e)}
      ${t.ring && a ? U`<circle cx="100" cy="92" r="60" fill="none" stroke=${t.ring} stroke-width="7"></circle>` : K}
      <g class=${t.still ? "" : "av-bob"}>
        ${!a && ui[e.gear] ? ui[e.gear](e) : K}
        ${Ni[e.hair] ? Ni[e.hair](e) : K}
        ${(Ti[e.top] ?? Ti.tee)(e)}
        <rect x="88" y=${l === "teen" ? 130 : 136} width="24" height=${l === "teen" ? 40 : 34} rx="10" fill=${e.skin}></rect>
        <g transform=${n}>
        <g class="av-pop d2">
          <circle cx="57" cy="104" r="9" fill=${e.skin}></circle><circle cx="143" cy="104" r="9" fill=${e.skin}></circle>
          <circle cx="100" cy="100" r="44" fill=${e.skin}></circle>
          <circle cx="74" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle><circle cx="126" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle>
        </g>
        <g class=${t.still ? "" : "av-blink"}>${(bi[e.eyes] ?? bi.normal)(e)}</g>
        ${c}
        ${(ki[e.mouth] ?? ki.smile)(e)}
        ${(fi[e.hair] ?? fi.short)(e)}
        ${xi[e.eyewear] ? xi[e.eyewear](e) : K}
        ${Wi[e.hat] ? Wi[e.hat](e) : K}
        </g>
        ${!a && Vi[e.gear] ? Vi[e.gear](e) : K}
        ${!a && gi[e.buddy] ? gi[e.buddy](e) : K}
      </g>
    </svg></span>`;
}
const wt = `
  .avwrap svg g.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  .avwrap svg g.av-pop.d1, .avwrap svg path.av-pop.d1 { animation-delay: .02s; }
  .avwrap svg .av-pop.d2 { animation-delay: .06s; } .avwrap svg .av-pop.d3 { animation-delay: .1s; }
  .avwrap svg .av-pop.d4 { animation-delay: .14s; } .avwrap svg .av-pop.d5 { animation-delay: .18s; } .avwrap svg .av-pop.d6 { animation-delay: .22s; }
  .avwrap svg path.av-pop, .avwrap svg ellipse.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  @keyframes avPop { from { opacity: 0; transform: scale(.4) translateY(10px); } to { opacity: 1; transform: none; } }
  .avwrap svg .av-bob { animation: avBob 3.2s ease-in-out infinite; }
  @keyframes avBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .avwrap svg .av-blink { transform-box: fill-box; transform-origin: center; animation: avBlink 5.5s infinite; }
  @keyframes avBlink { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
  .avwrap svg .av-flame { animation: avFlame .8s ease-in-out infinite alternate; }
  @keyframes avFlame { from { opacity: .4; } to { opacity: 1; } }
  .avwrap.av-jump-a { animation: avJumpA .7s cubic-bezier(.3,1.6,.5,1); }
  .avwrap.av-jump-b { animation: avJumpB .7s cubic-bezier(.3,1.6,.5,1); }
  @keyframes avJumpA { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(-4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
  @keyframes avJumpB { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
`, aa = (e, t = 60) => {
  const i = ["var(--p-1)", "var(--p-2)", "var(--p-3)", "var(--p-4)", "var(--p-5)", "var(--accent)", "var(--primary)"];
  let a = e * 9301 + 49297;
  const o = () => (a = (a * 9301 + 49297) % 233280, a / 233280);
  return r`<div class="confetti" aria-hidden="true">${Array.from({ length: t }, () => {
    const s = o() * 100, p = 1.6 + o() * 1.8, l = o() * 0.5, n = 6 + o() * 8, c = o() * 720 - 360, A = o() * 160 - 80;
    return r`<i style="left:${s}%;width:${n}px;height:${n * (o() > 0.5 ? 0.45 : 1)}px;background:${i[Math.floor(o() * i.length)]};border-radius:${o() > 0.6 ? "50%" : "2px"};
      animation-duration:${p}s;animation-delay:${l}s;--rot:${c}deg;--drift:${A}px"></i>`;
  })}</div>`;
}, oa = `
  .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; }
  .confetti i { position: absolute; top: -20px; animation-name: fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-fill-mode: forwards; opacity: 0; }
  @keyframes fall { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--drift), 105vh) rotate(var(--rot)); } }
  .burst { position: absolute; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: 30px; color: var(--ok);
    text-shadow: 0 2px 10px rgba(0,0,0,.18); animation: burst 1.2s cubic-bezier(.2,.8,.2,1) forwards; z-index: 20; }
  @keyframes burst { 0% { opacity: 0; transform: translateY(10px) scale(.6); } 20% { opacity: 1; transform: translateY(-6px) scale(1.15); } 100% { opacity: 0; transform: translateY(-70px) scale(1); } }
  .shake { animation: shake .45s; }
  @keyframes shake { 20%, 60% { transform: translateX(-6px) rotate(-2deg); } 40%, 80% { transform: translateX(6px) rotate(2deg); } }
  .shimmer { position: relative; overflow: hidden; }
  .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transform: translateX(-100%); animation: shimmer 2.8s ease-in-out infinite; }
  @keyframes shimmer { 60%, 100% { transform: translateX(100%); } }
  .xp { height: 10px; border-radius: 5px; background: var(--track); overflow: hidden; }
  .xp > div { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width .8s cubic-bezier(.2,.8,.2,1); }
`, k = (e) => new Date(e.getFullYear(), e.getMonth(), e.getDate()), F = (e, t) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + t), C = (e, t) => e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate(), st = (e) => {
  const t = k(e), i = (t.getDay() + 6) % 7;
  return F(t, -i);
}, yi = (e) => st(new Date(e.getFullYear(), e.getMonth(), 1)), Y = "en-AU", f = (e) => e.toLocaleTimeString(Y, { hour: "numeric", minute: "2-digit", hour12: !0 }).replace(/\s?([ap])\.?m\.?/i, " $1m").toLowerCase(), Mi = (e) => {
  const t = e.getHours();
  return { hm: `${t % 12 || 12}:${String(e.getMinutes()).padStart(2, "0")}`, ampm: t < 12 ? "am" : "pm" };
}, Ci = (e) => e.toLocaleDateString(Y, { weekday: "long", day: "numeric", month: "long" }), Oa = (e) => e.toLocaleDateString(Y, { weekday: "short", day: "numeric", month: "short" }), lt = (e) => e.toLocaleDateString(Y, { weekday: "short" }), Ha = (e, t) => e.getMonth() === t.getMonth() ? `${e.getDate()} – ${t.getDate()} ${t.toLocaleDateString(Y, { month: "long" })}` : `${e.getDate()} ${e.toLocaleDateString(Y, { month: "short" })} – ${t.getDate()} ${t.toLocaleDateString(Y, { month: "short" })}`, Ea = (e) => {
  const t = e.getHours();
  return t < 5 ? "Up late" : t < 12 ? "Good morning" : t < 17 ? "Good afternoon" : "Good evening";
}, wi = (e, t, i) => {
  const a = e.getHours() * 60 + e.getMinutes(), o = (l) => {
    const [n, c] = l.split(":").map(Number);
    return n * 60 + (c || 0);
  }, s = o(t), p = o(i);
  return s <= p ? a >= s && a < p : a >= s || a < p;
}, ea = (e) => {
  const t = e.description ?? "", i = /\+(\d+)/.exec(t) ?? /^(\d+)$/.exec(t.trim()), a = i ? Number(i[1]) : 0, o = /@grow/.test(t) ? "grow" : /@routine/.test(t) ? "routine" : /@job/.test(t) || a ? "job" : "routine", s = /@am/.test(t) ? "am" : /@after/.test(t) ? "after" : /@bed/.test(t) ? "bed" : "any", p = /(\d+)\s*min/i.exec(`${e.summary} ${t}`);
  return { ...e, lane: o, slot: s, pts: o === "grow" ? 0 : a, minutes: p ? Number(p[1]) : 0 };
}, x = (e) => {
  const [t, i] = e.split(":").map(Number);
  return t * 60 + (i || 0);
}, At = (e = /* @__PURE__ */ new Date()) => e.getHours() * 60 + e.getMinutes(), ji = (e = "20:00", t = /* @__PURE__ */ new Date()) => {
  const i = At(t);
  return i < 720 ? "am" : i >= x(e) - 60 ? "bed" : "after";
}, Ft = (e, t = /* @__PURE__ */ new Date()) => {
  const i = x(e ?? "20:00") + ([5, 6].includes(t.getDay()) ? 30 : 0);
  return `${Math.floor(i / 60)}:${String(i % 60).padStart(2, "0")}`;
}, _a = (e, t = /* @__PURE__ */ new Date()) => {
  const i = At(t), a = x(Ft(e, t));
  return i >= a - 60 || i < 300;
}, si = (e, t, i) => {
  if (!e || !t) return !0;
  for (const a of i) if (e.states[a] !== t.states[a]) return !0;
  return !1;
}, Bt = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, Gi = (e, t = [], i = []) => {
  const a = e.getDay();
  if (a === 0 || a === 6) return !1;
  const o = Bt(e);
  return i.includes(o) ? !1 : !t.length || t.some(([s, p]) => o >= s && o <= p);
}, Lt = (e = /* @__PURE__ */ new Date(), t = "19:30", i = "07:00") => {
  const a = At(e), o = x(t), s = x(i);
  return o <= s ? a >= o && a < s : a >= o || a < s;
};
let et = null, pi = !1;
const $a = (e) => {
  pi = e;
}, to = () => {
  if (pi) return null;
  try {
    return et = et ?? new (window.AudioContext || window.webkitAudioContext)(), et.state === "suspended" && et.resume(), et;
  } catch {
    return null;
  }
}, R = (e, t, i, a = "sine", o = 0.18, s) => {
  const p = to();
  if (!p) return;
  const l = p.createOscillator(), n = p.createGain();
  l.type = a, l.frequency.setValueAtTime(e, p.currentTime + t), s && l.frequency.exponentialRampToValueAtTime(s, p.currentTime + t + i), n.gain.setValueAtTime(1e-4, p.currentTime + t), n.gain.exponentialRampToValueAtTime(o, p.currentTime + t + 0.015), n.gain.exponentialRampToValueAtTime(1e-4, p.currentTime + t + i), l.connect(n).connect(p.destination), l.start(p.currentTime + t), l.stop(p.currentTime + t + i + 0.05);
}, S = (e) => {
  switch (e) {
    case "tap":
      R(660, 0, 0.06, "triangle", 0.08);
      break;
    case "tick":
      R(880, 0, 0.09, "triangle", 0.14), R(1320, 0.07, 0.14, "triangle", 0.12);
      break;
    case "untick":
      R(520, 0, 0.12, "sine", 0.08, 380);
      break;
    case "coin":
      R(988, 0, 0.08, "square", 0.06), R(1319, 0.08, 0.2, "square", 0.06);
      break;
    case "locked":
      R(180, 0, 0.18, "sawtooth", 0.06, 120);
      break;
    case "jar":
      R(1200, 0, 0.05, "sine", 0.12), R(1600, 0.05, 0.08, "sine", 0.1), R(2100, 0.11, 0.12, "sine", 0.07);
      break;
    case "done":
      [523, 659, 784, 1047].forEach((t, i) => R(t, i * 0.11, 0.3, "triangle", 0.13));
      break;
    case "unlock":
      [392, 523, 659, 784, 1047, 1319].forEach((t, i) => R(t, i * 0.09, 0.35, "triangle", 0.12)), R(1568, 0.6, 0.6, "sine", 0.1);
      break;
    case "alarm":
      for (let t = 0; t < 6; t++)
        R(1046, t * 0.5, 0.18, "square", 0.12), R(1318, t * 0.5 + 0.2, 0.18, "square", 0.12);
      break;
    case "clarinet":
      [587, 698, 880].forEach((t, i) => R(t, i * 0.16, 0.3, "square", 0.05));
      break;
    case "trumpet":
      [523, 523, 784].forEach((t, i) => R(t, i * 0.14, i === 2 ? 0.5 : 0.12, "sawtooth", 0.07));
      break;
    case "roar":
      R(140, 0, 0.6, "sawtooth", 0.12, 70), R(210, 0.05, 0.5, "square", 0.05, 90);
      break;
  }
};
let X;
const T = (e) => {
  if (!(pi || !("speechSynthesis" in window)))
    try {
      if (X === void 0) {
        const i = speechSynthesis.getVoices();
        X = i.find((a) => a.lang === "en-AU") ?? i.find((a) => a.lang.startsWith("en-GB")) ?? i.find((a) => a.lang.startsWith("en")) ?? null, i.length || (X = void 0);
      }
      speechSynthesis.cancel();
      const t = new SpeechSynthesisUtterance(e);
      X && (t.voice = X), t.lang = X?.lang ?? "en-AU", t.rate = 0.95, t.pitch = 1.1, speechSynthesis.speak(t);
    } catch {
    }
}, zi = (e) => {
  const t = e?.states["input_text.fh_panel_message"]?.state;
  if (!t || !t.startsWith("{")) return null;
  try {
    const i = JSON.parse(t);
    return i.ts && i.ttl && Date.now() / 1e3 > i.ts + i.ttl ? null : i;
  } catch {
    return null;
  }
}, gt = class gt extends g {
  constructor() {
    super(...arguments), this.life = 0, this.grow = 0, this._tab = "hair", this._shake = "", this._msg = "", this._jump = 0, this._confetti = 0;
  }
  get d() {
    return this._draft ?? this.look;
  }
  _say(t) {
    this._msg = t, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "";
    }, 2200);
  }
  get _jack() {
    return this.kid.mode === "picture";
  }
  get _goal() {
    return this.hass?.states[w(this.kid).goal]?.state ?? "";
  }
  _pick(t, i, a = !1) {
    if (!at(i, this.life, this.grow)) {
      if (this._shake = `${t.id}:${i[0]}`, setTimeout(() => {
        this._shake = "";
      }, 460), S("locked"), this._jack) {
        T("Not yet! Keep collecting stars.");
        return;
      }
      i[3] ? this._say(`${i[1]} is a surprise – keep practising and reading!`) : this._say(`${i[1]} is ${i[2] - this.life} away. Tap ♥ to make it your goal.`);
      return;
    }
    S("tap"), this._jack && T(i[1]), this._draft = O(this.d, t, i[0], a), this._jump++;
  }
  _setGoal(t) {
    const i = w(this.kid).goal;
    if (!this.hass?.states[i]) return;
    const a = this._goal === t[0] ? "" : t[0];
    this.hass.callService("input_text", "set_value", { entity_id: i, value: a }), S("coin"), this._say(a ? `Saving for ${t[1]} ♥` : "Goal cleared");
  }
  _random() {
    let t = { ...this.d };
    for (const i of P) {
      if (i.id === "face") continue;
      const a = i.items.filter((s) => at(s, this.life, this.grow)), o = a[Math.floor(Math.random() * a.length)];
      if (o && (t = O(t, i, o[0])), i.swatch && i.swatch.key !== "skin") {
        const s = i.swatch.items.filter((p) => at(p, this.life, this.grow));
        t = O(t, i, s[Math.floor(Math.random() * s.length)][0], !0);
      }
    }
    this._draft = t, this._jump++;
  }
  async _save() {
    const t = w(this.kid).avatar;
    if (this.hass?.states[t])
      try {
        await this.hass.callService("input_text", "set_value", { entity_id: t, value: zt(this.d) });
      } catch {
        this._say("Couldn’t save – try again");
        return;
      }
    else {
      this._say(`Create ${t} in Home Assistant to save looks`);
      return;
    }
    this._confetti++, setTimeout(() => this.dispatchEvent(new CustomEvent("close")), 900);
  }
  render() {
    const t = P.find((p) => p.id === this._tab) ?? P[0], i = ta(this.life, this.kid.favourites, this._goal || void 0), a = ia(this.life), o = !!this._draft && zt(this._draft) !== zt(this.look), s = (p) => p > 0 && p <= this.life && p > this.life - 100;
    return r`<div style="display:contents;--kid:${u(this.kid.colour)}">
      <section class="glass stage">
        <div style="display:flex;width:100%;align-items:center;gap:10px;z-index:1">
          <button class="round tap" aria-label="Back" @click=${() => this.dispatchEvent(new CustomEvent("close"))}>${q("left", 18)}</button>
          <h1 style="flex:1;font-size:24px;font-weight:800">${this.kid.name}’s studio</h1>
          <button class="round tap" aria-label="Surprise look" @click=${() => this._random()}>${q("shuffle", 18)}</button>
        </div>
        <button class="tap" style="z-index:1" aria-label="Jump" @click=${() => {
      this._jump++;
    }}>${Q(this.d, { size: 240, jump: this._jump, age: this.kid.age })}</button>
        ${i && !this._jack ? r`<div style="width:100%;z-index:1;display:flex;flex-direction:column;gap:5px">
          <span style="font-size:14px;font-weight:700">${this._goal === i.id ? "♥ Saving for" : "Next unlock"}: ${i.label} <span class="muted">· ${i.req - this.life} to go</span></span>
          <div class="xp"><div style="width:${Math.round((this.life - a) / (i.req - a) * 100)}%"></div></div></div>` : K}
        <div style="display:flex;gap:10px;width:100%;margin-top:auto;z-index:1">
          <button class="pill tap" style="flex:1;height:50px;justify-content:center" ?disabled=${!o} @click=${() => {
      this._draft = void 0, this._jump++;
    }}>Undo all</button>
          <button class="pill tap primary" style="flex:1.4;height:50px;justify-content:center;font-size:16px" @click=${() => this._save()}>${o ? "Save my look" : "Done"}</button>
        </div>
      </section>
      <section class="glass shelf">
        <div class="tabs" role="tablist">${P.map((p) => r`<button class="tap" role="tab" aria-label=${p.label} aria-pressed=${String(p.id === this._tab)} style=${this._jack ? "font-size:26px;width:58px;height:52px;padding:0" : ""} @click=${() => {
      this._tab = p.id, S("tap"), this._jack && T(p.label);
    }}>${this._jack ? p.emoji : r`${p.emoji} ${p.label}`}</button>`)}</div>
        ${t.swatch ? r`<div class="sw"><span class="label" style="width:60px">${t.swatch.label}</span>
          ${t.swatch.items.map((p) => {
      const l = !at(p, this.life, this.grow);
      return r`<button class="tap ${l ? "locked" : ""} ${this._shake === `${t.id}:${p[0]}` ? "shake" : ""}"
            title=${p[1]} aria-label=${`${p[1]}${l ? `, unlocks at ${p[2]} points` : ""}`} aria-pressed=${String(this.d[t.swatch.key] === p[0])}
            style="background:${p[0]}" @click=${() => this._pick(t, p, !0)}></button>`;
    })}</div>` : K}
        <div class="grid">
          ${t.items.map((p) => {
      const l = !at(p, this.life, this.grow), n = Pa(this.d, t, p[0]), c = !!p[3];
      return r`<button class="tile tap ${l ? "locked shimmer" : ""} ${this._shake === `${t.id}:${p[0]}` ? "shake" : ""}" aria-pressed=${String(n)} @click=${() => this._pick(t, p)}>
              <span class="av">${l && c ? r`<span style="display:flex;width:92px;height:${t.crop === "head" ? 92 : 110}px;align-items:center;justify-content:center;font-size:44px">🎁</span>` : Q(O(this.d, t, p[0]), { size: 92, crop: t.crop, still: !0, age: this.kid.age })}</span>${l && c ? "Surprise" : p[1]}
              ${l ? r`<span class="lock">${c ? "🌱" : `🔒 ${this._jack ? "★" : p[2]}`}</span>` : s(p[2]) ? r`<span class="new">NEW</span>` : K}
              ${l && !c && !this._jack ? r`<span class="heart tap" role="button" aria-label="Make ${p[1]} my goal" @click=${(A) => {
        A.stopPropagation(), this._setGoal(p);
      }}>${this._goal === p[0] ? "❤️" : "♡"}</span>` : K}
            </button>`;
    })}
        </div>
      </section>
      ${this._confetti ? aa(this._confetti, 50) : K}
      ${this._msg ? r`<div class="toast" role="status">${this._msg}</div>` : K}
    </div>`;
  }
};
gt.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .stage { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; overflow: hidden; }
    .stage::before { content: ''; position: absolute; inset: auto -30% -30%; height: 60%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 40%, transparent), transparent); }
    .shelf { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tabs button { height: 40px; padding: 0 16px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; }
    .tabs button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .heart { position: absolute; bottom: 34px; right: 6px; width: 32px; height: 32px; border-radius: 50%; background: var(--chip-strong); font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; align-content: start; padding: 4px; }
    .tile { border-radius: 20px; background: var(--chip); padding: 8px 6px 9px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; font-size: 12px; font-weight: 700; text-align: center; }
    .tile[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); background: var(--chip-strong); }
    .tile.locked .av { filter: grayscale(1) brightness(.85); opacity: .55; }
    .lock { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(15,15,20,.78); color: #fff; font-size: 11px; font-weight: 800; }
    .sw { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .sw button { width: 36px; height: 36px; border-radius: 50%; position: relative; box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }
    .sw button[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,.8); }
    .sw button.locked::after { content: '🔒'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(0,0,0,.35); border-radius: 50%; }
    .new { position: absolute; top: 8px; left: 8px; padding: 3px 7px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 10px; font-weight: 800; }
    ${B(wt)}
    ${B(oa)}
  `], gt.properties = {
  hass: { attribute: !1 },
  kid: { attribute: !1 },
  look: { attribute: !1 },
  life: { type: Number },
  grow: { type: Number },
  _draft: { state: !0 },
  _tab: { state: !0 },
  _shake: { state: !0 },
  _msg: { state: !0 },
  _jump: { state: !0 },
  _confetti: { state: !0 }
};
let Jt = gt;
customElements.get("fh-studio") || customElements.define("fh-studio", Jt);
const Nt = class Nt extends g {
  constructor() {
    super(...arguments), this.pin = "", this.reason = "Grown-ups only", this._typed = "", this._bad = !1;
  }
  _key(t) {
    if (t === "del") {
      this._typed = this._typed.slice(0, -1);
      return;
    }
    this._typed += t, this._typed.length >= this.pin.length && (this._typed === this.pin ? this.dispatchEvent(new CustomEvent("ok")) : (this._bad = !0, setTimeout(() => {
      this._bad = !1, this._typed = "";
    }, 420)));
  }
  render() {
    return r`<div class="glass pad ${this._bad ? "bad" : ""}" role="dialog" aria-label="Parent PIN" @click=${(t) => t.stopPropagation()}>
      <div style="display:flex;width:100%;align-items:center"><h2 style="flex:1;font-size:22px">${this.reason}</h2>
        <button class="round tap" aria-label="Cancel" @click=${() => this.dispatchEvent(new CustomEvent("cancel"))}>${q("close", 18)}</button></div>
      <div class="dots">${Array.from({ length: this.pin.length }, (t, i) => r`<span class=${i < this._typed.length ? "on" : ""}></span>`)}</div>
      <div class="grid">
        ${["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((t) => t ? r`<button class="tap" aria-label=${t === "del" ? "Delete" : t} @click=${() => this._key(t)}>${t === "del" ? "⌫" : t}</button>` : r`<span></span>`)}
      </div>
    </div>`;
  }
};
Nt.styles = [W, b`
    :host { position: absolute; inset: 0; z-index: 35; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); }
    .pad { border-radius: 32px; padding: 24px 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 340px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .dots { display: flex; gap: 14px; height: 20px; }
    .dots span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink2); transition: background .15s; }
    .dots span.on { background: var(--ink); border-color: var(--ink); }
    .grid { display: grid; grid-template-columns: repeat(3, 76px); gap: 12px; }
    .grid button { height: 76px; border-radius: 50%; background: var(--chip-strong); font-size: 28px; font-weight: 600; }
    .bad { animation: shake .4s; }
    @keyframes shake { 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
  `], Nt.properties = { pin: {}, reason: {}, _typed: { state: !0 }, _bad: { state: !0 } };
let It = Nt;
customElements.get("fh-pin") || customElements.define("fh-pin", It);
const io = [
  [/teeth|tooth/i, "🪥"],
  [/dress|clothes|pyjama/i, "👕"],
  [/bowl|breakfast|dish|plate|sink/i, "🥣"],
  [/toy/i, "🧸"],
  [/shoe|hat/i, "👟"],
  [/story|book|read/i, "📚"],
  [/bed\b|make bed/i, "🛏️"],
  [/bath|shower|wash/i, "🛁"],
  [/table/i, "🍽️"],
  [/bag/i, "🎒"],
  [/trumpet/i, "🎺"],
  [/clarinet|practice|music/i, "🎵"],
  [/homework|school/i, "✏️"],
  [/tidy|clean|room/i, "🧹"],
  [/scooter/i, "🛴"],
  [/swim/i, "🏊"],
  [/dog|cat|pet|feed/i, "🐾"],
  [/water|plant/i, "🪴"],
  [/bin|rubbish/i, "🗑️"],
  [/dishwasher/i, "🍽️"]
], St = (e) => io.find(([t]) => t.test(e))?.[1] ?? "⭐", Li = (e) => {
  const t = x(e), i = Math.floor(t / 60) % 24;
  return `${i % 12 || 12}:${String(t % 60).padStart(2, "0")} ${i < 12 ? "am" : "pm"}`;
}, Zi = { am: "Morning", after: "After school", bed: "Bedtime", any: "Any time" }, ao = [["😄", "great"], ["🙂", "good"], ["😐", "okay"], ["😟", "worried"], ["😢", "sad"]], oo = 10 * 6e4, eo = [{ name: "Pick the family movie", cost: 100 }, { name: "Choose Friday dinner", cost: 80 }], j = (e, t) => {
  try {
    const i = localStorage.getItem(e);
    return i === null ? t : JSON.parse(i);
  } catch {
    return t;
  }
}, M = (e, t) => {
  try {
    localStorage.setItem(e, JSON.stringify(t));
  } catch {
  }
}, ft = class ft extends g {
  constructor() {
    super(...arguments), this.familyCalendars = [], this.pin = "", this.owed = "todo.rewards_owed", this.jarTarget = 120, this.jarReward = "a family treat", this.privateWords = [], this.quiet = !1, this._chores = [], this._events = [], this._jump = 0, this._bursts = [], this._confetti = 0, this._studio = !1, this._celebrate = null, this._pinAsk = null, this._msg = "", this._practice = null, this._now = /* @__PURE__ */ new Date(), this._feel = "", this._subFor = "", this._subGen = 0, this._evFor = "", this._busy = /* @__PURE__ */ new Set(), this._lookCache = null;
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = window.setInterval(() => {
      this._now = /* @__PURE__ */ new Date(), this._checkPractice();
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsub?.(), this._unsub = void 0, this._subFor = "", clearInterval(this._tick);
  }
  get _e() {
    return w(this.kid);
  }
  get _star() {
    return this.kid.star ?? 10;
  }
  get _jack() {
    return this.kid.mode === "picture";
  }
  get _life() {
    return L(this.hass, this._e.lifetime);
  }
  get _grow() {
    return L(this.hass, this._e.grow);
  }
  get _look() {
    const t = this.hass?.states[this._e.avatar]?.state ?? "";
    return this._lookCache?.[0] !== t && (this._lookCache = [t, $(t, this.kid.look ? $(this.kid.look) : {})]), this._lookCache[1];
  }
  get _wind() {
    return _a(this.kid.bedtime, this._now);
  }
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass") && this.kid) {
      const i = this._e;
      return si(t.get("hass"), this.hass, [i.points, i.lifetime, i.week, i.goal, i.grow, i.avatar, "input_number.family_jar"]);
    }
    return t.size === 1 && t.has("_now") ? this._now.getSeconds() === 0 || !!this._practice : !0;
  }
  updated(t) {
    if (!this.hass || !this.kid) return;
    const i = this._e;
    if (this._subFor !== i.chores && this.hass.connection) {
      this._unsub?.(), this._unsub = void 0, this._subFor = i.chores, this._chores = [];
      const a = ++this._subGen, o = i.chores;
      this.hass.connection.subscribeMessage((s) => {
        a === this._subGen && (this._chores = s.items.map(ea));
      }, { type: "todo/item/subscribe", entity_id: o }).then((s) => {
        a === this._subGen ? this._unsub = s : s();
      }).catch(() => {
        this._chores = [];
      }), this._practice = j(`fh-practice-${i.slug}`, null);
    }
    this._evFor !== this.kid.name && (this._evFor = this.kid.name, this._loadWeek()), t.has("hass") && this._checkUnlocks();
  }
  /* ---------------- unlock celebrations (high-water marks, never replay) ---------------- */
  _checkUnlocks() {
    if (this._celebrate || !this.hass?.states[this._e.lifetime]) return;
    const t = this._life, i = this._grow, a = this._e.slug, o = j(`family-hub-seen-${a}`, null), s = j(`family-hub-seen-grow-${a}`, null);
    if (o === null || s === null) {
      M(`family-hub-seen-${a}`, Math.max(o ?? 0, t)), M(`family-hub-seen-grow-${a}`, Math.max(s ?? 0, i));
      return;
    }
    const p = [...Ia(o, t), ...Xa(s, i)];
    if (p.length) {
      const l = this.kid.favourites ?? [];
      this._celebrate = [...p].sort((n, c) => Number(l.includes(c.id)) - Number(l.includes(n.id))), this._confetti++, this._sound("unlock"), this._jack && T(`Wow Jack! You unlocked ${p[0].label}!`);
    }
  }
  _closeCelebrate(t) {
    const i = this._e.slug;
    M(`family-hub-seen-${i}`, Math.max(j(`family-hub-seen-${i}`, 0), this._life)), M(`family-hub-seen-grow-${i}`, Math.max(j(`family-hub-seen-grow-${i}`, 0), this._grow)), this._celebrate = null, t && !this._wind && (this._studio = !0);
  }
  async _loadWeek() {
    if (!this.hass) return;
    const t = k(/* @__PURE__ */ new Date()), i = F(t, 8), a = this.kid.name, o = [{ id: this._e.calendar, family: !1 }, ...this.familyCalendars.map((l) => ({ id: l, family: !0 }))].filter((l) => this.hass.states[l.id]), s = [], p = this.privateWords.map((l) => l.toLowerCase());
    await Promise.all(o.map(async (l) => {
      try {
        const n = await this.hass.callApi("GET", `calendars/${l.id}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(i.toISOString())}`);
        for (const c of n) {
          const A = c.summary ?? "(busy)";
          p.some((m) => A.toLowerCase().includes(m)) || s.push({ title: A, start: c.start?.date ? /* @__PURE__ */ new Date(`${c.start.date}T00:00:00`) : new Date(c.start.dateTime), allDay: !!c.start?.date, family: l.family });
        }
      } catch {
      }
    })), a === this.kid.name && (s.sort((l, n) => l.start.getTime() - n.start.getTime()), this._events = s);
  }
  /* ---------------- ticking ---------------- */
  _sound(t) {
    !this.quiet && !this._wind ? S(t) : t === "tick" && S("tap");
  }
  _award(t, i) {
    const a = { kid: this._e.slug, points: i * t.pts, lifetime: !0, jar: t.lane === "job" ? i : 0, grow: t.lane === "grow" ? i : 0, reason: `${i > 0 ? "" : "un-ticked "}${t.summary}` };
    return !t.pts && t.lane !== "job" && t.lane !== "grow" ? Promise.resolve() : this.hass.callService("script", "fh_add_points", a);
  }
  _toggle(t, i = !1) {
    if (!this.hass || this._busy.has(t.uid)) return;
    const a = t.status === "completed", o = j("fh-ticks", {});
    if (a && !i && Date.now() - (o[t.uid] ?? 0) > oo) {
      this.pin ? this._pinAsk = { reason: `Untick “${t.summary}”?`, run: () => this._toggle(t, !0) } : this._say("Need to change that? Ask a grown-up.");
      return;
    }
    this._doToggle(t, a, o);
  }
  async _doToggle(t, i, a) {
    this._busy.add(t.uid);
    const o = this._chores;
    this._chores = o.map((s) => s.uid === t.uid ? { ...s, status: i ? "needs_action" : "completed" } : s);
    try {
      if (await this.hass.callService("todo", "update_item", { item: t.uid, status: i ? "needs_action" : "completed" }, { entity_id: this._e.chores }), await this._award(t, i ? -1 : 1), i) {
        delete a[t.uid], M("fh-ticks", a), this._sound("untick");
        return;
      }
      a[t.uid] = Date.now(), M("fh-ticks", a), this._sound(t.lane === "job" ? "coin" : "tick"), this._jump++;
      const s = Date.now(), p = t.lane === "grow" ? "🌱" : t.pts ? this._jack ? "★".repeat(Math.max(1, Math.round(t.pts / this._star))) : `+${t.pts}` : "✓";
      this._bursts = [...this._bursts, { id: s, text: p }], setTimeout(() => {
        this._bursts = this._bursts.filter((l) => l.id !== s);
      }, 1300), this._jack && T(`${t.summary}. Done! ${t.pts ? "Here’s a star!" : ""}`), this._maybeAllDone();
    } catch (s) {
      console.warn("Family Hub: chore update failed", s), this._chores = o, this._say("Couldn’t save that one – try again");
    } finally {
      this._busy.delete(t.uid);
    }
  }
  _maybeAllDone() {
    const t = ji(Ft(this.kid.bedtime, this._now), this._now), i = this._chores.filter((l) => l.lane === "routine" && l.slot === t), a = this._chores.filter((l) => l.lane === "job"), o = i.length ? i : a;
    if (!o.length || o.some((l) => l.status !== "completed")) return;
    const s = `fh-alldone-${this._e.slug}-${(/* @__PURE__ */ new Date()).toDateString()}-${t}`;
    if (j(s, !1)) return;
    M(s, !0);
    const p = this.kid.name;
    this._wind || (this._confetti++, this._sound(this.kid.sound ?? "done"), setTimeout(() => this._sound("done"), 700)), this._jack && T(t === "am" ? `You did your whole morning, ${p}!` : t === "bed" ? `All ready for bed, ${p}. Sleep well!` : `All done, ${p}!`), this._say(t === "bed" ? `All set for bed, ${p}. Sleep well.` : [`All done, ${p}. You stuck with it today.`, `That’s everything, ${p}. Nice and steady.`, `Legend effort, ${p}.`][Math.floor(Math.random() * 3)]);
  }
  /* ---------------- practice timer ---------------- */
  _startPractice(t) {
    this._practice = { uid: t.uid, end: Date.now() + t.minutes * 6e4, mins: t.minutes }, M(`fh-practice-${this._e.slug}`, this._practice), this._sound("tap"), this._say(`${t.minutes} minutes on the clock. You’ve got this.`);
  }
  _stopPractice() {
    this._practice = null, M(`fh-practice-${this._e.slug}`, null);
  }
  _checkPractice() {
    const t = this._practice;
    if (!t || Date.now() < t.end) return;
    const i = this._chores.find((a) => a.uid === t.uid);
    this._stopPractice(), i && i.status !== "completed" && (this._doToggle(i, !1, j("fh-ticks", {})), this._say(`Practice done – ${t.mins} minutes. Sounding good!`));
  }
  /* ---------------- rewards ---------------- */
  _redeem(t, i = !1) {
    const a = L(this.hass, this._e.points);
    if (a < t.cost) {
      this._sound("locked"), this._jack && T(`Not yet! ${Math.ceil((t.cost - a) / this._star)} more stars for ${t.name}.`), this._say(`Saving up: ${this._jack ? `${Math.ceil((t.cost - a) / this._star)} more stars` : `${t.cost - a} to go`}. You’ll get there.`);
      return;
    }
    const o = t.approve ?? t.cost >= 60;
    if (o && this.pin && !i) {
      this._pinAsk = { reason: `${this.kid.name}: ${t.name}?`, run: () => this._redeem(t, !0) };
      return;
    }
    this.hass.callService("script", "fh_add_points", { kid: this._e.slug, points: -t.cost, lifetime: !1, reason: `reward: ${t.name}` }), this.owed && this.hass.states[this.owed] && this.hass.callService("todo", "add_item", { item: `${this.kid.name}: ${t.name}`, description: `${(/* @__PURE__ */ new Date()).toLocaleDateString("en-AU")} · ${t.cost} pts${o && !this.pin ? " · needs a grown-up OK" : ""}` }, { entity_id: this.owed }), this._confetti++, this._jump++, this._sound("unlock"), this._jack && T(`Yay! ${t.name}!`), this._say(o ? `Nice saving, ${this.kid.name}. A grown-up will sort out: ${t.name}.` : `Nice saving, ${this.kid.name}! ${t.name} – your pick.`);
  }
  _feelPick(t) {
    this._feel = t, this._sound("tap"), this._jack && T("Thanks for telling me. Want a hug?");
  }
  _feelReply(t) {
    t === "chat" && this.hass?.callService("persistent_notification", "create", { title: `${this.kid.name} would like a chat`, message: `${this.kid.name} said he’s feeling ${this._feel} and would like a chat later.`, notification_id: `fh_chat_${this._e.slug}` }), this._say(t === "hug" ? "Go find a grown-up for a big hug 🤗" : t === "chat" ? "A grown-up will come and chat soon." : "Good to know. Thanks for sharing."), this._feel = "";
  }
  _dayOff(t) {
    const i = (this.hass?.states[this._e.week]?.state ?? "-------").padEnd(7, "-").slice(0, 7), a = () => {
      const o = i[t] === "O" ? "-" : "O";
      this.hass.callService("input_text", "set_value", { entity_id: this._e.week, value: i.slice(0, t) + o + i.slice(t + 1) }), this._say(o === "O" ? "Marked as a day off." : "Day off removed.");
    };
    if (!this.pin) {
      this._say("Set a parent PIN to mark days off.");
      return;
    }
    this._pinAsk = { reason: "Mark this as a day off?", run: a };
  }
  _say(t) {
    this._msg = t, clearTimeout(this._msgTimer), this._msgTimer = window.setTimeout(() => {
      this._msg = "";
    }, 2800);
  }
  /* ---------------- render ---------------- */
  render() {
    if (!this.kid || !this.hass) return K;
    if (this._studio) return r`<fh-studio .hass=${this.hass} .kid=${this.kid} .look=${this._look} .life=${this._life} .grow=${this._grow} @close=${() => {
      this._studio = !1, this._jump++;
    }}></fh-studio>`;
    const t = this._e, i = this.hass, a = !i.states[t.points] || !i.states[t.chores];
    return r`<div style="display:contents;--kid:${u(this.kid.colour)}">
      ${this._hero()}
      ${a ? r`<section class="glass jobs"><div class="empty"><h2 style="font-size:22px">Set up ${this.kid.name}’s page</h2>
        <span>Create <b>${t.chores}</b> and <b>${t.points}</b> in Home Assistant.</span></div></section>` : this._jobs()}
      <div class="side">${this._wind ? this._windCard() : this._rewards()}${this._jar()}${this._wind ? K : this._feelCard()}${this._week()}</div>
      ${this._bursts.map((o) => r`<span class="burst" style="left:150px;top:260px">${o.text}</span>`)}
      ${this._confetti && !this._wind ? Ba(this._confetti, aa(this._confetti)) : K}
      ${this._celebrate ? this._celebration() : K}
      ${this._pinAsk ? r`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => {
      const o = this._pinAsk.run;
      this._pinAsk = null, o();
    }} @cancel=${() => {
      this._pinAsk = null;
    }}></fh-pin>` : K}
      ${this._msg ? r`<div class="toast" role="status">${this._msg}</div>` : K}
    </div>`;
  }
  _hero() {
    const t = this._e, i = this.hass, a = this._life, o = this._look, s = L(i, t.points), p = Da(a), l = i.states[t.goal]?.state, n = ta(a, this.kid.favourites, l && l !== "unknown" ? l : void 0), c = ia(a), A = n ? Math.max(4, Math.round((a - c) / Math.max(1, n.req - c) * 100)) : 100, m = (i.states[t.week]?.state ?? "-------").padEnd(7, "-").slice(0, 7), d = (this._now.getDay() + 6) % 7, V = this._goodToday(), y = [...m].filter((h, I) => h === "G" || I === d && V).length;
    return r`<section class="glass hero" aria-label="${this.kid.name}’s avatar">
      <button class="tap" style="position:relative" aria-label="Make ${this.kid.name} jump" @click=${() => {
      this._jump++, this._sound(this.kid.sound ?? "tap"), this._jack && T(`Hi Jack! You have ${Math.floor(s / this._star)} stars.`);
    }}>
        ${Q(o, { size: 186, jump: this._jump, label: `${this.kid.name}’s avatar`, age: this.kid.age })}</button>
      <div style="display:flex;align-items:center;gap:10px;z-index:1"><h1 class="name">${this.kid.name}</h1>${this._jack ? K : r`<span class="rank">${p.rank}</span>`}</div>
      ${this._jack ? r`
        <div class="stat" style="width:100%;align-items:center;flex-direction:row;gap:12px"><span style="font-size:40px">🫙</span>
          <span style="display:flex;flex-direction:column;gap:2px"><b class="stars" style="font-size:26px;letter-spacing:1px">${s >= this._star ? "★".repeat(Math.min(12, Math.floor(s / this._star))) : "☆"}</b>
          <span>${Math.floor(s / this._star)} stars in my jar</span></span></div>` : r`
        <div style="width:100%;display:flex;flex-direction:column;gap:5px"><div class="xp"><div style="width:${Math.round(p.into / p.need * 100)}%"></div></div>
          <span class="muted" style="font-size:13px;font-weight:600;text-align:right">${p.need - p.into} more to ${p.nextRank}</span></div>
        <div class="stats">
          <div class="stat"><b>${s || "✨"}</b><span>${s ? "points to spend" : "Ready to start"}</span></div>
          <div class="stat"><span>Good days</span><div class="dots">${[...m].map((h, I) => r`<button aria-label="${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][I]}${h === "O" ? ", day off" : ""}" class="${h === "G" || I === d && V ? "g" : h === "O" ? "o" : ""} ${I === d ? "t" : ""}" @click=${() => this._dayOff(I)}></button>`)}</div>
            <span>${y >= 5 ? "Full week ⭐" : `${y} this week`}</span></div>
        </div>`}
      ${this._wind ? r`<div class="next"><span style="font-size:13px;font-weight:700;padding:6px">🌙 Studio opens in the morning</span></div>` : n ? r`<div class="next">
        <span class="shimmer" style="border-radius:50%;line-height:0">${Q(O(o, n.cat, n.id, n.swatch), { size: 46, crop: "head", still: !0, age: this.kid.age })}</span>
        <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l === n.id ? "♥ Saving for" : "Next"}: ${n.label}</span>
          <div class="xp" style="height:7px"><div style="width:${A}%"></div></div>
          ${this._jack ? K : r`<span class="muted" style="font-size:12px;font-weight:600">${n.req - a} to go</span>`}</span>
      </div>` : r`<div class="next"><span style="font-size:13px;font-weight:700;padding:6px">You’ve unlocked the whole collection! New gear drops next term.</span></div>`}
      ${this.kid.special_time && !this._jack ? r`<span class="muted" style="font-size:13px;font-weight:600">💛 Your time: ${this.kid.special_time}</span>` : K}
      ${this._wind ? K : r`<button class="pill tap primary" style="height:52px;width:100%;justify-content:center;font-size:16px;margin-top:auto" @click=${() => {
      this._studio = !0, this._sound("tap");
    }}>${q("star", 20)}${this._jack ? "🎨 My look" : "Style studio"}</button>`}
    </section>`;
  }
  _goodToday() {
    const t = this._chores.filter((p) => p.lane === "routine"), i = this._chores.filter((p) => p.lane === "job"), a = t.filter((p) => p.status === "completed" && p.slot !== "bed").length, o = t.filter((p) => p.slot !== "bed").length, s = i.filter((p) => p.status === "completed").length;
    return t.length + i.length > 0 && a === o && (i.length === 0 || s >= Math.min(2, i.length));
  }
  _jobs() {
    const t = Ft(this.kid.bedtime, this._now), i = ji(t, this._now), a = this._chores, o = a.filter((h) => h.lane === "routine" && (h.slot === i || h.slot === "any" && !this._wind)), s = this._wind ? [] : a.filter((h) => h.lane === "job" && (h.slot === "any" || h.slot === i || i === "after" && h.slot === "am")), p = this._wind ? a.filter((h) => h.lane === "grow" && h.slot === "bed") : a.filter((h) => h.lane === "grow" && h.slot !== "bed" || h.lane === "grow" && i === "bed"), l = a.filter((h) => h.lane === "routine" && h.slot !== i && h.slot !== "any" && (i === "am" || i === "after" && h.slot === "bed")), n = [...o, ...s, ...p], c = n.filter((h) => h.status === "completed").length, A = n.length, m = A - c, d = 2 * Math.PI * 22, V = A ? c / A : 0, y = this._wind ? m ? `Bedtime jobs: ${m} left · bed at ${Li(t)}` : "All set for bed. Sleep well 🌙" : m ? `${m} left ${i === "am" ? "this morning" : i === "after" ? "this afternoon" : "tonight"}` : "All done – fresh start tomorrow";
    return r`<section class="glass jobs" aria-label="Jobs">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1"><h1 style="font-size:26px;font-weight:800">${this._wind ? "Wind down" : this._jack ? i === "am" ? "My morning" : i === "bed" ? "My bedtime" : "My jobs" : "Today"}</h1>
          <span class="muted" style="font-size:14px;font-weight:600">${y}</span></div>
        ${this._jack ? r`<button class="round tap" style="width:52px;height:52px;font-size:24px" aria-label="Read my jobs" @click=${() => T(o.filter((h) => h.status !== "completed").map((h) => h.summary).join(". ") || "All done! Great job!")}>🔊</button>` : K}
        <div class="ring" aria-label="${c} of ${A} done"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--track)" stroke-width="6"></circle>
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray=${d} stroke-dashoffset=${d * (1 - V)} style="transition:stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)"></circle></svg><b>${c}/${A}</b></div>
      </div>
      <div class="list">
        ${this._jack ? r`<div class="pics">${o.map((h) => this._pic(h))}</div>` : r`
            ${o.length ? r`<div class="sec"><h2>${Zi[i]} routine</h2><span>just what we do</span></div>${o.map((h) => this._row(h))}` : K}
            ${s.length ? r`<div class="sec"><h2>Family jobs</h2><span>earn points · fill the jar</span></div>${s.map((h) => this._row(h))}` : K}
            ${p.length ? r`<div class="sec"><h2>Growing</h2><span>for you – surprises along the way</span></div>${p.map((h) => this._row(h))}` : K}`}
        ${l.length && !this._wind ? r`<div class="later"><span>Later: ${Zi[l[0].slot]} (${l.length})</span><span>${l.map((h) => this._jack ? St(h.summary) : "").join(" ")}</span></div>` : K}
        ${n.length ? K : r`<div class="wind"><span style="font-size:44px">🌤️</span><span>Nothing right now. Enjoy!</span></div>`}
      </div>
    </section>`;
  }
  _row(t) {
    const i = t.status === "completed", a = this._practice?.uid === t.uid ? this._practice : null, o = a ? Math.max(0, a.end - this._now.getTime()) : 0;
    return r`<div class="job ${i ? "done" : ""}" style="padding-right:10px">
      <button class="tap" style="display:flex;align-items:center;gap:14px;flex:1;text-align:left;min-height:34px" aria-pressed=${String(i)} @click=${() => this._toggle(t)}>
        <span class="box">${i ? "✓" : ""}</span>
        ${this.kid.mode === "mixed" ? r`<span style="font-size:28px">${St(t.summary)}</span>` : K}
        <span class="t">${t.summary}</span></button>
      ${t.lane === "grow" && t.minutes && !i ? a ? r`<button class="play tap" @click=${() => this._stopPractice()}>⏸ ${Math.floor(o / 6e4)}:${String(Math.floor(o % 6e4 / 1e3)).padStart(2, "0")}</button>` : r`<button class="play tap" aria-label="Start ${t.minutes} minute timer" @click=${() => this._startPractice(t)}>▶ ${t.minutes} min</button>` : K}
      ${t.lane === "job" ? r`<span class="plus">+${t.pts}</span>` : t.lane === "grow" && (i || !t.minutes) ? r`<span class="plus grow">🌱</span>` : K}
    </div>`;
  }
  _pic(t) {
    const i = t.status === "completed", a = Math.max(1, Math.round(t.pts / this._star));
    return r`<button class="pic tap ${i ? "done" : ""}" aria-pressed=${String(i)} @click=${() => this._toggle(t)}>
      <span class="e">${St(t.summary)}</span><span style="font-size:17px;font-weight:700;text-align:center">${t.summary}</span>
      ${t.pts ? r`<span class="stars">${"★".repeat(a)}</span>` : K}${i ? r`<span class="tick">✓</span>` : K}</button>`;
  }
  _rewards() {
    const t = L(this.hass, this._e.points), i = this.kid.rewards ?? eo, a = this._star;
    return r`<section class="glass card" aria-label="Rewards">
      <span class="label">${this._jack ? "Spend my stars" : "Rewards"}</span>
      ${i.map((o) => {
      const s = t >= o.cost;
      return r`<div class="rw"><span style="font-size:24px">${o.icon ?? "🎁"}</span><span class="n">${o.name}</span>
          <button class="tap ${s ? "" : "save"}" @click=${() => this._redeem(o)}>${this._jack ? Math.round(o.cost / a) > 5 ? `${Math.round(o.cost / a)} ★` : "★".repeat(Math.max(1, Math.round(o.cost / a))) : s ? `${o.cost}` : `${o.cost - t} to go`}</button></div>`;
    })}
    </section>`;
  }
  _windCard() {
    return r`<section class="glass card"><span class="label">Rewards</span><span style="font-size:15px;font-weight:600">The shop opens again in the morning 🌙</span>
      <span class="muted" style="font-size:13px">Bedtime ${Li(Ft(this.kid.bedtime, this._now))}</span></section>`;
  }
  _jar() {
    const t = L(this.hass, "input_number.family_jar"), i = this.jarTarget || 120, a = Math.min(1, t / i);
    return this.hass?.states["input_number.family_jar"] ? r`<section class="glass card" aria-label="Family jar"><div class="jar">
      <svg width="48" height="60" viewBox="0 0 48 60" aria-hidden="true"><rect x="8" y="2" width="32" height="7" rx="3" fill="var(--ink3)"></rect>
        <path d="M6 12 H42 V52 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 Z" fill="var(--chip-strong)" stroke="var(--ink3)" stroke-width="2"></path>
        <clipPath id="jc"><path d="M8 14 H40 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z"></path></clipPath>
        <rect clip-path="url(#jc)" x="6" y=${58 - 44 * a} width="36" height=${44 * a} fill="var(--accent)" style="transition:all .8s"></rect></svg>
      <span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="label">Family jar</span>
        <span style="font-size:15px;font-weight:700">${t >= i ? "Full! Time for " + this.jarReward : `${i - t} marbles to ${this.jarReward}`}</span>
        <span class="muted" style="font-size:12px">Every family job by anyone adds one</span></span></div></section>` : r``;
  }
  _feelCard() {
    return r`<section class="glass card" aria-label="How are you feeling">
      ${this._feel ? r`<span style="font-size:15px;font-weight:600">Thanks for telling me. Want a hug or a chat?</span>
        <div style="display:flex;gap:8px"><button class="pill tap" @click=${() => this._feelReply("hug")}>🤗 Hug</button><button class="pill tap" @click=${() => this._feelReply("chat")}>💬 Chat later</button><button class="pill tap" @click=${() => this._feelReply("ok")}>I’m OK</button></div>` : r`<span class="label">How are you feeling?</span><div class="feel">${ao.map(([t, i]) => r`<button class="tap" aria-label=${i} @click=${() => this._feelPick(i)}>${t}</button>`)}</div>`}
    </section>`;
  }
  _week() {
    const t = /* @__PURE__ */ new Date(), i = this._events.filter((o) => o.allDay ? o.start >= k(t) : o.start.getTime() > t.getTime() - 36e5).slice(0, 5), a = (o) => {
      if (C(o, t)) return "Today";
      const s = Math.round((k(o).getTime() - k(t).getTime()) / 864e5);
      return this._jack ? `${s} sleep${s > 1 ? "s" : ""}` : s === 1 ? "Tomorrow" : lt(o);
    };
    return r`<section class="glass card" aria-label="${this.kid.name}’s week">
      <span class="label">${this._jack ? "Coming up" : `${this.kid.name}’s week`}</span>
      ${i.length ? i.map((o) => r`<div class="wk"><span class="d">${a(o.start)}</span>
        <span style="flex:1;font-weight:600;display:flex;gap:6px;align-items:baseline"><span class="dot" style="width:8px;height:8px;background:${o.family ? "var(--p-family)" : "var(--kid)"}"></span>
          <span>${o.title}${o.allDay ? "" : r` <span class="muted" style="font-weight:500">· ${f(o.start)}</span>`}</span></span></div>`) : r`<span class="muted" style="font-size:14px">Nothing on this week.</span>`}
    </section>`;
  }
  _celebration() {
    const t = this._celebrate, i = this._look;
    return r`<div class="celebrate" @click=${(a) => {
      a.target === a.currentTarget && this._closeCelebrate(!1);
    }}>
      <div class="glass cbox" role="dialog" aria-label="New unlocks">
        <span class="rank" style="font-size:14px">${t.some((a) => so.has(a.id)) ? "SURPRISE!" : `NEW UNLOCK${t.length > 1 ? "S" : ""}`}</span>
        <h1 style="font-size:34px;font-weight:800;text-align:center">${this.kid.name}, you unlocked ${t.length > 1 ? `${t.length} things` : t[0].label}!</h1>
        <div class="unl">${t.slice(0, 8).map((a, o) => r`<div style="animation-delay:${0.15 + o * 0.12}s">
          ${Q(O(i, a.cat, a.id, a.swatch), { size: 96, crop: a.cat.crop, still: !0, age: this.kid.age })}${a.label}</div>`)}</div>
        <div style="display:flex;gap:12px"><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => this._closeCelebrate(!1)}>Later</button>
          ${this._wind ? K : r`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => this._closeCelebrate(!0)}>${q("star", 18)}Try it on</button>`}</div>
      </div>
    </div>`;
  }
};
ft.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 330px; flex-shrink: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 45%, transparent), transparent); pointer-events: none; }
    .name { font-size: 34px; font-weight: 800; line-height: 1; }
    .rank { padding: 6px 12px; border-radius: 999px; background: var(--kid); color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .02em; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
    .stat { border-radius: 18px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .stat b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 13px; font-weight: 600; color: var(--ink2); }
    .dots { display: flex; gap: 5px; }
    .dots button { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); padding: 0; }
    .dots button.g { background: var(--ok); border-color: var(--ok); }
    .dots button.o { border-style: dashed; opacity: .55; }
    .dots button.t { box-shadow: 0 0 0 2px var(--chip-strong), 0 0 0 4px var(--kid); }
    .next { width: 100%; display: flex; align-items: center; gap: 10px; border-radius: 18px; background: var(--chip); padding: 8px 12px 8px 8px; }
    .jobs { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
    .sec { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
    .sec h2 { font-size: 18px; font-weight: 800; }
    .sec span { font-size: 13px; color: var(--ink2); font-weight: 600; }
    .job { display: flex; align-items: center; gap: 14px; padding: 12px 14px; min-height: 58px; border-radius: 18px; background: var(--chip); text-align: left; width: 100%; position: relative; }
    .job .box { width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid var(--ink3); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; transition: all .25s cubic-bezier(.2,1.4,.4,1); }
    .job.done .box { background: var(--ok); border-color: var(--ok); transform: scale(1.08); }
    .job.done .t { color: var(--ink3); text-decoration: line-through; }
    .job .t { flex: 1; font-size: 18px; font-weight: 600; }
    .plus { font-size: 14px; font-weight: 800; padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, var(--kid) 22%, transparent); white-space: nowrap; }
    .grow { background: color-mix(in srgb, var(--ok) 18%, transparent); }
    .play { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--primary); color: var(--on-primary); font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
    .later { padding: 10px 14px; border-radius: 16px; background: var(--chip-soft); font-size: 14px; font-weight: 600; color: var(--ink2); display: flex; justify-content: space-between; }
    .pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; align-content: start; }
    .pic { border-radius: 24px; background: var(--chip); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; min-height: 150px; justify-content: center; }
    .pic .e { font-size: 64px; line-height: 1.1; transition: transform .3s cubic-bezier(.2,1.6,.4,1); }
    .pic.done { background: color-mix(in srgb, var(--ok) 25%, var(--chip)); }
    .pic.done .e { transform: scale(.85) rotate(-8deg); opacity: .6; }
    .pic .tick { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; border-radius: 50%; background: var(--ok); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; animation: avPop .4s cubic-bezier(.2,1.4,.4,1); }
    .stars { color: #f5b301; font-size: 20px; letter-spacing: 2px; }
    .side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none; border-radius: 24px; }
    .side::-webkit-scrollbar { display: none; }
    .side > .card { flex-shrink: 0; }
    .rw { display: flex; align-items: center; gap: 10px; padding: 7px 8px 7px 10px; border-radius: 14px; background: var(--chip); }
    .rw .n { flex: 1; font-size: 15px; font-weight: 600; line-height: 1.2; }
    .rw button { height: 38px; padding: 0 12px; border-radius: 999px; font-size: 14px; font-weight: 700; background: var(--primary); color: var(--on-primary); white-space: nowrap; }
    .rw button.save { background: var(--track); color: var(--ink2); }
    .jar { display: flex; align-items: center; gap: 12px; }
    .wk { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
    .wk .d { width: 78px; flex-shrink: 0; font-weight: 700; color: var(--ink2); font-size: 13px; }
    .ring { position: relative; width: 52px; height: 52px; }
    .ring svg { transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }
    .feel { display: flex; justify-content: space-between; }
    .feel button { font-size: 30px; width: 46px; height: 46px; border-radius: 50%; }
    .feel button:active { background: var(--chip-strong); }
    .celebrate { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); border-radius: 28px; }
    .cbox { border-radius: 32px; padding: 26px 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 720px; animation: sheet .5s cubic-bezier(.2,1.3,.3,1) both; }
    .unl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .unl > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; animation: avPop .6s cubic-bezier(.2,1.4,.4,1) both; }
    @keyframes avPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
    .wind { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }
    ${B(wt)}
    ${B(oa)}
  `], ft.properties = {
  hass: { attribute: !1 },
  kid: { attribute: !1 },
  familyCalendars: { attribute: !1 },
  pin: {},
  owed: {},
  jarTarget: { type: Number },
  jarReward: {},
  privateWords: { attribute: !1 },
  quiet: { type: Boolean },
  _chores: { state: !0 },
  _events: { state: !0 },
  _jump: { state: !0 },
  _bursts: { state: !0 },
  _confetti: { state: !0 },
  _studio: { state: !0 },
  _celebrate: { state: !0 },
  _pinAsk: { state: !0 },
  _msg: { state: !0 },
  _practice: { state: !0 },
  _now: { state: !0 },
  _feel: { state: !0 }
};
let Xt = ft;
const so = new Set($i.map((e) => e.id));
customElements.get("fh-kid") || customElements.define("fh-kid", Xt);
const po = ["light", "switch", "fan", "cover", "lock", "climate", "media_player", "input_boolean"], ro = /* @__PURE__ */ new Set(["on", "open", "playing", "unlocked", "heat", "cool", "heat_cool", "auto", "dry", "fan_only", "paused", "idle"]), Tt = class Tt extends g {
  constructor() {
    super(...arguments), this.pin = "", this.hideScripts = [], this.hide = [], this._all = !1, this._unlocked = 0, this._askPin = null, this._went = "";
  }
  _rooms() {
    const t = this.hass, i = Object.values(t.areas ?? {}).sort((o, s) => o.name.localeCompare(s.name)), a = /* @__PURE__ */ new Map();
    for (const [o, s] of Object.entries(t.entities ?? {})) {
      const p = o.split(".")[0];
      if (!po.includes(p) || s.hidden || s.entity_category || this.hide.includes(o)) continue;
      const l = t.states[o];
      if (!l || l.state === "unavailable") continue;
      const n = s.area_id ?? (s.device_id ? t.devices?.[s.device_id]?.area_id : null);
      n && a.set(n, [...a.get(n) ?? [], l]);
    }
    return i.map((o) => ({ id: o.area_id, name: o.name, ents: (a.get(o.area_id) ?? []).sort((s, p) => s.entity_id.localeCompare(p.entity_id)) })).filter((o) => o.ents.length);
  }
  _toggle(t) {
    const i = t.entity_id.split(".")[0];
    i === "media_player" ? this.dispatchEvent(new CustomEvent("music", { detail: t.entity_id })) : i === "lock" ? this._guard(() => this.hass.callService("lock", t.state === "locked" ? "unlock" : "lock", { entity_id: t.entity_id })) : this.hass.callService("homeassistant", "toggle", { entity_id: t.entity_id });
  }
  _room(t, i) {
    const a = t.ents.filter((o) => o.entity_id.startsWith("light.")).map((o) => o.entity_id);
    a.length && this.hass.callService("light", i ? "turn_on" : "turn_off", { entity_id: a });
  }
  _guard(t) {
    if (!this.pin) {
      this.dispatchEvent(new CustomEvent("say", { detail: "Set a parent PIN to change this from the panel." }));
      return;
    }
    if (Date.now() < this._unlocked) {
      t();
      return;
    }
    this._askPin = t;
  }
  _name(t, i) {
    const a = t.attributes.friendly_name ?? t.entity_id, o = a.replace(new RegExp(`^${i.replace(/[^\w ]/g, ".")}\\s*`, "i"), "");
    return o.length > 2 && !/^room\b/i.test(o) ? o : a;
  }
  _ic(t) {
    const i = t.entity_id.split(".")[0];
    return i === "light" ? "bulb" : i === "media_player" ? "music" : i === "lock" ? "home" : i === "switch" ? "bulb" : "home";
  }
  render() {
    if (!this.hass) return K;
    const t = this.hass, i = this._rooms(), a = (l) => !!t.entities?.[l]?.labels?.includes("family_hub"), o = Object.values(t.states).filter((l) => l.entity_id.startsWith("script.") && !this.hideScripts.includes(l.entity_id) && a(l.entity_id)), s = Object.values(t.states).filter((l) => l.entity_id.startsWith("automation.") && (this._all || a(l.entity_id))), p = i.reduce((l, n) => l + n.ents.filter((c) => c.entity_id.startsWith("light.") && c.state === "on").length, 0);
    return r`
      <section class="glass rooms" aria-label="Rooms">
        <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><h1 style="font-size:26px;font-weight:800">Home</h1>
          <span class="muted" style="font-size:13px">${p ? `${p} light${p > 1 ? "s" : ""} on` : "All lights off"} · ${i.length} rooms</span></div></div>
        <div class="rgrid">
          ${i.map((l) => {
      const n = l.ents.filter((A) => A.entity_id.startsWith("light.")), c = n.some((A) => A.state === "on");
      return r`<div class="room ${c ? "lit" : ""}">
              <div class="rh"><h2>${l.name}</h2>${n.length ? r`<button class="sw tap" role="switch" aria-label="${l.name} lights" aria-checked=${String(c)} @click=${() => this._room(l, !c)}></button>` : K}</div>
              ${l.ents.map((A) => {
        const m = ro.has(A.state), d = A.attributes.brightness;
        return r`<button class="dev tap ${m && A.entity_id.startsWith("light.") ? "on" : ""}" @click=${() => this._toggle(A)}>
                  <span class="ic">${q(this._ic(A), 18)}</span><span class="n">${this._name(A, l.name)}</span>
                  <span class="s">${A.entity_id.startsWith("light.") && m && d ? `${Math.round(d / 255 * 100)}%` : A.state.replace(/_/g, " ")}</span></button>`;
      })}
            </div>`;
    })}
        </div>
      </section>
      <div class="side">
        <section class="glass card" aria-label="Scenes">
          <span class="label">Scenes</span>
          <div class="scenes">
            <button class="scene tap ${this._went === "on" ? "go" : ""}" @click=${() => {
      this.hass.callService("light", "turn_on", { entity_id: "all" }), this._went = "on";
    }}>${q("bulb", 20)}All on</button>
            <button class="scene tap ${this._went === "off" ? "go" : ""}" @click=${() => {
      this.hass.callService("light", "turn_off", { entity_id: "all" }), this._went = "off";
    }}>${q("bulbOff", 20)}All off</button>
            ${o.map((l) => r`<button class="scene tap ${this._went === l.entity_id ? "go" : ""}" @click=${() => {
      this.hass.callService("script", "turn_on", { entity_id: l.entity_id }), this._went = l.entity_id;
    }}>
              ${/movie|tv/i.test(l.entity_id) ? r`<span style="font-size:20px">🍿</span>` : /bed|night/i.test(l.entity_id) ? q("moon", 20) : q("star", 20)}${l.attributes.friendly_name ?? l.entity_id}</button>`)}
          </div>
        </section>
        <section class="glass card" style="flex:1;min-height:0" aria-label="Automations">
          <div style="display:flex;align-items:center"><span class="label" style="flex:1">Automations</span>
            <button class="pill tap" style="height:34px;font-size:13px" @click=${() => {
      if (this._all) {
        this._all = !1;
        return;
      }
      this._guard(() => {
        this._all = !0;
      });
    }}>${this._all ? "Hide" : "🔒 Grown-ups"}</button></div>
          <div class="alist">
            ${s.length ? s.map((l) => r`<div class="auto"><span style="flex:1">${l.attributes.friendly_name ?? l.entity_id}</span>
              <button class="sw tap" role="switch" aria-label=${l.attributes.friendly_name ?? l.entity_id} aria-checked=${String(l.state === "on")}
                @click=${() => this._guard(() => this.hass.callService("automation", l.state === "on" ? "turn_off" : "turn_on", { entity_id: l.entity_id }))}></button></div>`) : r`<span class="muted" style="font-size:14px">Household automations are in the grown-ups section.</span>`}
          </div>
        </section>
      </div>
      ${this._askPin ? r`<fh-pin .pin=${String(this.pin)} @ok=${() => {
      const l = this._askPin;
      this._askPin = null, this._unlocked = Date.now() + 5 * 6e4, l();
    }} @cancel=${() => {
      this._askPin = null;
    }}></fh-pin>` : K}`;
  }
};
Tt.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .rooms { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .rgrid { flex: 1; min-height: 0; overflow: auto; columns: 3 250px; column-gap: 12px; }
    .room { break-inside: avoid; margin-bottom: 12px; border-radius: 22px; background: var(--chip); padding: 14px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .5s ease, background .5s ease; }
    .room.lit { background: color-mix(in srgb, #ffd166 22%, var(--chip)); box-shadow: 0 0 0 1px color-mix(in srgb, #ffb703 40%, transparent), 0 10px 30px -10px rgba(255,183,3,.55); }
    .rh { display: flex; align-items: center; gap: 8px; }
    .rh h2 { flex: 1; font-size: 19px; font-weight: 800; }
    .dev { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 14px; background: var(--chip-soft); width: 100%; text-align: left; }
    .dev .ic { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--track); color: var(--ink2); flex-shrink: 0; transition: all .3s; }
    .dev.on .ic { background: #ffd166; color: #7a4b00; box-shadow: 0 0 16px rgba(255,209,102,.8); }
    .dev .n { flex: 1; font-size: 14px; font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dev .s { font-size: 12px; color: var(--ink2); font-weight: 600; text-transform: capitalize; }
    .side { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .scenes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .scene { height: 64px; border-radius: 16px; background: var(--chip); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0 12px; font-size: 14px; font-weight: 700; text-align: left; }
    .scene.go { animation: go .8s ease; }
    @keyframes go { 30% { background: var(--primary); color: var(--on-primary); transform: scale(1.04); } }
    .auto { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-size: 14px; font-weight: 600; }
    .sw { width: 50px; height: 30px; border-radius: 15px; background: var(--track); position: relative; flex-shrink: 0; transition: background .25s; }
    .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.2); transition: transform .25s cubic-bezier(.2,1.4,.4,1); }
    .sw[aria-checked='true'] { background: var(--ok); }
    .sw[aria-checked='true']::after { transform: translateX(20px); }
    .alist { flex: 1; min-height: 0; overflow: auto; }
  `], Tt.properties = { hass: { attribute: !1 }, pin: {}, hideScripts: { attribute: !1 }, hide: { attribute: !1 }, _unlocked: { state: !0 }, _askPin: { state: !0 }, _went: { state: !0 }, _all: { state: !0 } };
let Dt = Tt;
customElements.get("fh-home") || customElements.define("fh-home", Dt);
const qt = { thumbs: {}, res: {}, key: "" }, vi = {}, lo = [{ name: "ABC Kids listen", match: "ABC Kids listen" }, { name: "ABC Jazz", match: "ABC Jazz" }], bt = class bt extends g {
  constructor() {
    super(...arguments), this.players = [], this.stations = [], this.source = "media-source://radio_browser/country/AU", this.preferred = "", this._tab = "rooms", this._focus = "", this._thumbs = {}, this._resolved = {}, this._loaded = !1, this._msg = "";
  }
  _say(t) {
    this._msg = t, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "";
    }, 2400);
  }
  get _list() {
    const t = this.hass;
    return (this.players.length ? this.players : Object.keys(t.states).filter((a) => a.startsWith("media_player."))).map((a) => t.states[a]).filter((a) => !!a && a.state !== "unavailable");
  }
  get _cur() {
    const t = this._list;
    return t.find((i) => i.entity_id === this._focus) ?? t.find((i) => i.entity_id === this.preferred) ?? t.find((i) => i.state === "playing") ?? t[0];
  }
  get _stations() {
    return (this.stations.length ? this.stations : lo).map((i) => typeof i == "string" ? { name: i, match: i } : i);
  }
  async _loadRadio() {
    const t = this.source + JSON.stringify(this.stations);
    if (qt.key === t) {
      this._thumbs = qt.thumbs, this._resolved = qt.res;
      return;
    }
    if (!(this._loaded || !this.hass)) {
      this._loaded = !0;
      try {
        const i = await this.hass.callWS({ type: "media_source/browse_media", media_content_id: this.source }), a = {}, o = {};
        for (const s of this._stations) {
          const p = s.id ? s.id.startsWith("media-source://") ? s.id : `media-source://radio_browser/${s.id}` : "", l = i.children.find((n) => p ? n.media_content_id === p : n.title.toLowerCase().includes((s.match ?? s.name).toLowerCase()));
          l ? (o[s.name] = l.media_content_id, l.thumbnail && (a[s.name] = l.thumbnail)) : p && (o[s.name] = p);
        }
        this._thumbs = a, this._resolved = o, Object.assign(qt, { thumbs: a, res: o, key: t });
      } catch (i) {
        console.warn("Family Hub: radio browse failed", i), this._loaded = !1;
      }
    }
  }
  _svc(t, i = {}) {
    const a = this._cur;
    a && this.hass.callService("media_player", t, { entity_id: a.entity_id, ...i });
  }
  _play(t) {
    const i = this._cur, a = this._resolved[t.name];
    if (i) {
      if (!a) {
        this._say(`Couldn’t find ${t.name} – check the station list`);
        return;
      }
      this.hass.callService("media_player", "play_media", { entity_id: i.entity_id, media_content_id: a, media_content_type: "music" }).then(() => {
        vi[i.entity_id] = t.name, this.requestUpdate(), this._say(`${t.name} on ${i.attributes.friendly_name}`);
      }).catch((o) => this._say(`${i.attributes.friendly_name} couldn’t play that: ${o?.message ?? "error"}`));
    }
  }
  render() {
    if (!this.hass) return K;
    const t = this._cur;
    return r`${t ? this._hero(t) : r`<section class="glass hero"><div class="soon">No speakers found</div></section>`}
      <section class="glass panel">
        <div style="display:flex;align-items:center;gap:12px"><h1 style="flex:1;font-size:26px;font-weight:800">Music</h1>
          <div class="tabs" role="tablist">${[["rooms", "Speakers"], ["radio", "Radio"], ["apple", "Apple Music"], ["spotify", "Spotify"]].map(([i, a]) => r`<button class="tap" role="tab" aria-pressed=${String(this._tab === i)} @click=${() => {
      this._tab = i, i === "radio" && this._loadRadio();
    }}>${a}</button>`)}</div></div>
        ${this._tab === "radio" && !Object.keys(this._resolved).length ? r`<span class="muted" style="font-size:13px">Tuning in…</span>` : K}
        ${this._tab === "rooms" ? this._rooms() : this._tab === "radio" ? this._radio() : this._soon(this._tab)}
      </section>
      ${this._msg ? r`<div class="toast" role="status">${this._msg}</div>` : K}`;
  }
  _hero(t) {
    const i = t.attributes, a = t.state === "playing", o = i.entity_picture ? `url(${i.entity_picture})` : "", s = typeof i.volume_level == "number" ? Math.round(i.volume_level * 100) : null;
    return r`<section class="glass hero" style=${o ? `--art:${o}` : ""} aria-label="Now playing">
      <div class="bg"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="live" style="${a ? "" : "animation:none;background:rgba(255,255,255,.5)"}"></span>
        <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.8">${a ? "Playing on" : "Ready on"} ${i.friendly_name}</span></div>
      <div class="cover ${a ? "" : "paused"}"></div>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="display" style="font-size:26px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.media_title ?? (t.state === "off" ? "Off" : "Nothing playing")}</span>
        <span style="font-size:16px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.media_artist ?? i.media_album_name ?? "Pick a station or start something on your phone"}</span>
      </div>
      <div class="ctl">
        <button class="tap" aria-label="Previous" @click=${() => this._svc("media_previous_track")}>${v("prev", 30)}</button>
        <button class="tap big" aria-label=${a ? "Pause" : "Play"} @click=${() => this._svc("media_play_pause")}>${v(a ? "pause" : "play", 32)}</button>
        <button class="tap" aria-label="Next" @click=${() => this._svc("media_next_track")}>${v("next", 30)}</button>
      </div>
      ${s !== null ? r`<div style="display:flex;align-items:center;gap:12px;margin-top:auto"><span style="opacity:.7">${q("music", 18)}</span>
        <input type="range" min="0" max="100" .value=${String(s)} aria-label="Volume" @change=${(p) => this._svc("volume_set", { volume_level: Number(p.target.value) / 100 })}>
        <span style="width:34px;text-align:right;font-size:13px;font-weight:700;opacity:.8">${s}</span></div>` : K}
    </section>`;
  }
  _rooms() {
    const t = this._cur?.entity_id;
    return r`<div class="grid">${this._list.map((i) => {
      const a = i.attributes, o = i.state === "playing";
      return r`<button class="room tap" aria-pressed=${String(i.entity_id === t)} @click=${() => {
        this._focus = i.entity_id;
      }}>
        <span class="thumb ${o ? "eq" : ""}" style=${a.entity_picture ? `--art:url(${a.entity_picture})` : ""}>${o ? r`<i></i><i></i><i></i>` : q("music", 20)}</span>
        <span style="display:flex;flex-direction:column;min-width:0;gap:2px"><span style="font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.friendly_name}</span>
          <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize">${o ? a.media_title ?? "Playing" : i.state}</span></span>
      </button>`;
    })}</div>`;
  }
  _radio() {
    const t = this._cur, i = t && t.state === "playing" ? vi[t.entity_id] : "";
    return r`<span class="muted" style="font-size:13px">Tap a station to play it on <b>${this._cur?.attributes.friendly_name ?? "a speaker"}</b>. Pick a different speaker in the Speakers tab.</span>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${this._stations.map((a) => {
      const o = this._thumbs[a.name], s = i === a.name;
      return r`<button class="st tap ${s ? "on" : ""}" @click=${() => this._play(a)}>
          <span class="img" style=${o ? `--art:url(${o})` : `background:linear-gradient(135deg, var(--p-${a.name.length % 5 + 1}), var(--primary));color:#fff`}>${o ? "" : a.name.split(" ").map((p) => p[0]).join("").slice(0, 3)}</span>${a.name}</button>`;
    })}</div>`;
  }
  _soon(t) {
    const i = t === "apple";
    return r`<div class="soon">
      <span class="logo" style="background:${i ? "linear-gradient(135deg,#fa2d48,#fc5c7d)" : "#1db954"}">${v("play", 44)}</span>
      <h2 style="font-size:24px">${i ? "Apple Music" : "Spotify"} is nearly ready</h2>
      <span class="muted" style="max-width:420px">This needs the Music Assistant add-on in Home Assistant${i ? "" : " and a Spotify Premium account"}. Once it’s connected, playlists and search will appear here and play to any speaker.</span>
      <span class="muted" style="font-size:13px">Until then, AirPlay from a phone to any HomePod or the Sonos works as normal.</span>
    </div>`;
  }
};
bt.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 420px; flex-shrink: 0; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; color: #fff; background: #111; }
    .hero .bg { position: absolute; inset: -40px; background: var(--art) center / cover; filter: blur(40px) saturate(160%) brightness(.65); transform: scale(1.2); transition: background .6s; }
    .hero > *:not(.bg) { position: relative; }
    .cover { width: 100%; aspect-ratio: 1; max-height: 300px; border-radius: 22px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 20px 50px -12px rgba(0,0,0,.6); align-self: center; max-width: 300px; transition: transform .5s cubic-bezier(.2,1.2,.4,1); }
    .cover.paused { transform: scale(.88); }
    .ctl { display: flex; align-items: center; justify-content: center; gap: 30px; }
    .ctl button { color: #fff; }
    .big { width: 70px; height: 70px; border-radius: 50%; background: #fff; color: #111 !important; display: flex; align-items: center; justify-content: center; }
    input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,.3); outline: none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
    .panel { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .tabs { display: flex; gap: 6px; }
    .tabs button { height: 42px; padding: 0 18px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: 600; }
    .tabs button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-content: start; }
    .room { border-radius: 20px; background: var(--chip); padding: 12px; display: flex; gap: 12px; align-items: center; text-align: left; }
    .room[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .thumb { width: 52px; height: 52px; border-radius: 12px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 8px; }
    .eq i { width: 4px; border-radius: 2px; background: #fff; animation: eq .9s ease-in-out infinite alternate; box-shadow: 0 0 4px rgba(0,0,0,.4); }
    .eq i:nth-child(2) { animation-delay: .3s; } .eq i:nth-child(3) { animation-delay: .6s; }
    @keyframes eq { from { height: 4px; } to { height: 22px; } }
    .st { border-radius: 20px; background: var(--chip); padding: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 14px; font-weight: 700; }
    .st .img { aspect-ratio: 1; border-radius: 14px; background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-3))) center / contain no-repeat, #fff; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; color: var(--ink2); }
    .st.on { box-shadow: 0 0 0 3px var(--ok); }
    .soon { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 20px; }
    .soon .logo { width: 96px; height: 96px; border-radius: 26px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 44px; box-shadow: 0 14px 30px -10px rgba(0,0,0,.45); }
  `], bt.properties = {
  hass: { attribute: !1 },
  players: { attribute: !1 },
  stations: { attribute: !1 },
  source: {},
  preferred: {},
  _tab: { state: !0 },
  _focus: { state: !0 },
  _thumbs: { state: !0 },
  _resolved: { state: !0 },
  _msg: { state: !0 }
};
let Pt = bt;
customElements.get("fh-music") || customElements.define("fh-music", Pt);
const dt = ["#1d1d1f", "#e63946", "#f77f00", "#fcbf49", "#2a9d8f", "#118ab2", "#7b2cbf", "#ff70a6", "#8d5a3b", "#ffffff"], no = [4, 10, 22], Zt = "family-hub-fridge", Qi = "media-source://media_source/local/.", Ko = ["🦖", "🐉", "🚚", "⭐", "❤️", "🌈", "🏄", "🎺"], kt = class kt extends g {
  constructor() {
    super(...arguments), this._ink = dt[0], this._size = 10, this.artists = [], this._stamp = "", this._artist = "", this._erase = !1, this._chalk = !1, this._blank = !0, this._pics = [], this._view = "", this._msg = "", this._stick = !1, this._strokes = [], this._cur = null, this._last = null, this._hue = 0;
  }
  _say(t) {
    this._msg = t, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "";
    }, 2400);
  }
  firstUpdated() {
    this._canvas = this.renderRoot.querySelector("canvas"), this._ctx = this._canvas.getContext("2d");
    const t = this.renderRoot.querySelector(".wrap");
    this._ro = new ResizeObserver(() => this._fit(t)), this._ro.observe(t), this._loadFridge();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._ro?.disconnect();
  }
  _fit(t) {
    const i = this._canvas, a = window.devicePixelRatio || 1, o = t.clientWidth, s = t.clientHeight;
    if (!o || !s || i.width === Math.round(o * a) && i.height === Math.round(s * a)) return;
    const p = i.width ? this._ctx.getImageData(0, 0, i.width, i.height) : null;
    i.width = Math.round(o * a), i.height = Math.round(s * a), i.style.width = `${o}px`, i.style.height = `${s}px`, p && this._ctx.putImageData(p, 0, 0);
  }
  _pt(t) {
    const i = this._canvas.getBoundingClientRect(), a = window.devicePixelRatio || 1;
    return { x: (t.clientX - i.left) * a, y: (t.clientY - i.top) * a };
  }
  _down(t) {
    if (this._canvas.setPointerCapture(t.pointerId), this._last = this._pt(t), this._stamp) {
      const i = { ink: "", size: this._size, erase: !1, hue: 0, pts: [[this._last.x, this._last.y, 0, 0, 0]], stamp: this._stamp };
      this._strokes.push(i), this._drawStamp(i), this._blank = !1, this._last = null;
      return;
    }
    this._cur = { ink: this._ink, size: this._size, erase: this._erase, hue: this._hue, pts: [] }, this._strokes.push(this._cur), this._strokes.length > 400 && this._strokes.splice(0, this._strokes.length - 400), this._seg(this._cur, this._last, this._last, t.pressure), this._blank = !1;
  }
  _move(t) {
    if (!this._last || !this._cur) return;
    const i = t.getCoalescedEvents?.();
    for (const a of i?.length ? i : [t]) {
      const o = this._pt(a);
      this._seg(this._cur, this._last, o, a.pressure), this._last = o;
    }
  }
  _up() {
    this._last = null, this._cur = null;
  }
  /** Draw one segment and record it, so undo can replay strokes instead of keeping bitmaps. */
  _seg(t, i, a, o) {
    t.pts.push([i.x, i.y, a.x, a.y, o]), this._draw(t, i.x, i.y, a.x, a.y, o, t.pts.length);
  }
  _draw(t, i, a, o, s, p, l) {
    const n = this._ctx, c = window.devicePixelRatio || 1, A = p > 0 && p !== 0.5 ? 0.6 + p : 1;
    if (n.globalCompositeOperation = t.erase ? "destination-out" : "source-over", n.lineCap = "round", n.lineJoin = "round", n.lineWidth = (t.erase ? t.size * 2.4 : t.size) * c * A, t.ink === "rainbow" && !t.erase) {
      const m = (t.hue + l * 4) % 360;
      this._hue = m, n.strokeStyle = `hsl(${m} 90% 55%)`;
    } else n.strokeStyle = t.ink === "rainbow" ? "#000" : t.ink;
    n.beginPath(), n.moveTo(i, a), n.lineTo(o + 0.01, s), n.stroke();
  }
  _drawStamp(t) {
    const i = this._ctx, a = window.devicePixelRatio || 1, [o, s] = t.pts[0];
    i.globalCompositeOperation = "source-over", i.font = `${(30 + t.size * 3) * a}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`, i.textAlign = "center", i.textBaseline = "middle", i.fillText(t.stamp, o, s);
  }
  _redraw() {
    const t = this._canvas;
    this._ctx.clearRect(0, 0, t.width, t.height);
    const a = this._strokes.lastIndexOf(null) + 1;
    for (const o of this._strokes.slice(a)) o && (o.stamp ? this._drawStamp(o) : o.pts.forEach((s, p) => this._draw(o, s[0], s[1], s[2], s[3], s[4], p + 1)));
    this._blank = !this._strokes.slice(a).length;
  }
  _undoOne() {
    this._strokes.pop(), this._redraw();
  }
  _clear() {
    this._blank || this._strokes.push(null), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._blank = !0;
  }
  /** Flatten onto the paper colour and return a PNG blob. */
  _png() {
    const t = this._canvas, i = document.createElement("canvas"), a = Math.min(1, 1600 / t.width);
    i.width = Math.round(t.width * a), i.height = Math.round(t.height * a);
    const o = i.getContext("2d");
    return o.fillStyle = this._chalk ? "#23332b" : "#fffdf7", o.fillRect(0, 0, i.width, i.height), o.drawImage(t, 0, 0, i.width, i.height), new Promise((s) => i.toBlob(s, "image/png"));
  }
  async _toFridge() {
    if (this._blank) {
      this._say("Draw something first!");
      return;
    }
    const t = await this._png();
    if (!t) return;
    const i = /* @__PURE__ */ new Date(), a = `${i.getFullYear()}${String(i.getMonth() + 1).padStart(2, "0")}${String(i.getDate()).padStart(2, "0")}-${String(i.getHours()).padStart(2, "0")}${String(i.getMinutes()).padStart(2, "0")}${String(i.getSeconds()).padStart(2, "0")}`;
    this._stick = !0, setTimeout(() => {
      this._stick = !1;
    }, 900);
    let o = !1;
    if (this.hass?.fetchWithAuth)
      try {
        const s = new FormData();
        s.append("media_content_id", Qi), s.append("file", new File([t], `doodle-${a}${this._artist ? `-${this._artist.toLowerCase()}` : ""}.png`, { type: "image/png" })), o = (await this.hass.fetchWithAuth("/api/media_source/local_source/upload", { method: "POST", body: s })).ok;
      } catch {
        o = !1;
      }
    if (!o) {
      const s = await new Promise((p) => {
        const l = new FileReader();
        l.onload = () => p(String(l.result)), l.readAsDataURL(t);
      });
      try {
        const p = JSON.parse(localStorage.getItem(Zt) ?? "[]");
        p.unshift({ title: `doodle-${a}${this._artist ? `-${this._artist.toLowerCase()}` : ""}`, url: s }), localStorage.setItem(Zt, JSON.stringify(p.slice(0, 8)));
      } catch {
        this._say("The fridge is full – clear a few doodles");
        return;
      }
    }
    this._say(o ? "Stuck on the fridge!" : "Stuck on this panel’s fridge"), this._clear(), this._strokes = [], this._loadFridge();
  }
  async _loadFridge() {
    let t = [];
    try {
      t = JSON.parse(localStorage.getItem(Zt) ?? "[]");
    } catch {
    }
    if (this.hass)
      try {
        const a = (await this.hass.callWS({ type: "media_source/browse_media", media_content_id: Qi })).children.filter((s) => /^doodle-/.test(s.title)).sort((s, p) => p.title.localeCompare(s.title)).slice(0, 12);
        t = [...(await Promise.all(a.map(async (s) => {
          try {
            const p = await this.hass.callWS({ type: "media_source/resolve_media", media_content_id: s.media_content_id });
            return { title: s.title, url: p.url, id: s.media_content_id };
          } catch {
            return null;
          }
        }))).filter((s) => !!s), ...t].sort((s, p) => p.title.localeCompare(s.title));
      } catch {
      }
    this._pics = t;
  }
  render() {
    return r`
      <section class="glass tools" aria-label="Brushes">
        ${dt.map((t) => r`<button class="ink tap" style="background:${t}" aria-label="Colour" aria-pressed=${String(!this._erase && !this._stamp && this._ink === t)} @click=${() => {
      this._ink = t, this._erase = !1, this._stamp = "";
    }}></button>`)}
        <button class="ink tap rainbow" aria-label="Rainbow" aria-pressed=${String(!this._erase && !this._stamp && this._ink === "rainbow")} @click=${() => {
      this._ink = "rainbow", this._erase = !1, this._stamp = "";
    }}></button>
        <span class="sep"></span>
        ${Ko.map((t) => r`<button class="size tap" style="font-size:26px" aria-label="Stamp" aria-pressed=${String(this._stamp === t)} @click=${() => {
      this._stamp = this._stamp === t ? "" : t, this._erase = !1;
    }}>${t}</button>`)}
        <span class="sep"></span>
        ${no.map((t) => r`<button class="size tap" aria-label="Brush ${t}" aria-pressed=${String(this._size === t)} @click=${() => {
      this._size = t;
    }}><i style="width:${Math.min(t, 22)}px;height:${Math.min(t, 22)}px"></i></button>`)}
        <button class="size tap" aria-label="Eraser" aria-pressed=${String(this._erase)} @click=${() => {
      this._erase = !this._erase;
    }} style="font-size:22px">🧽</button>
      </section>
      <section class="glass paper ${this._stick ? "stick" : ""}">
        <div class="wrap ${this._chalk ? "chalk" : ""}">
          <canvas @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up} @pointercancel=${this._up} @pointerleave=${this._up}></canvas>
          ${this._blank ? r`<div class="hint">Draw something brilliant</div>` : K}
        </div>
        <div class="acts">
          <button class="pill tap" @click=${() => this._undoOne()}>${q("left", 18)}Undo</button>
          <button class="pill tap" @click=${() => this._clear()}>${q("close", 18)}Clear</button>
          <button class="pill tap" @click=${() => {
      this._chalk = !this._chalk, this._chalk && this._ink === dt[0] ? this._ink = "#ffffff" : !this._chalk && this._ink === "#ffffff" && (this._ink = dt[0]);
    }}>${q(this._chalk ? "sun" : "moon", 18)}${this._chalk ? "Paper" : "Chalkboard"}</button>
          <span style="flex:1"></span>
          ${this.artists.length ? r`<span class="muted" style="font-size:13px;font-weight:700">Artist</span>${this.artists.map((t) => r`<button class="pill tap" style=${this._artist === t ? "background:var(--primary);color:var(--on-primary)" : ""} @click=${() => {
      this._artist = this._artist === t ? "" : t;
    }}>${t}</button>`)}` : ""}
          <button class="pill tap primary" style="height:48px;padding:0 20px;font-size:16px" @click=${() => this._toFridge()}>${q("star", 18)}Stick it on the fridge</button>
        </div>
      </section>
      <section class="glass fridge" aria-label="The fridge">
        <span class="label">The fridge</span>
        ${this._pics.length ? r`<div class="pics">${this._pics.map((t) => {
      const i = /-(\d{6})-([a-z]+)/.exec(t.title)?.[2];
      return r`<button class="pic tap" aria-label="View doodle" style="background-image:url('${t.url}')" @click=${() => {
        this._view = t.url;
      }}>${i ? r`<span style="position:absolute;bottom:-8px;right:-4px;background:var(--chip-strong);border-radius:999px;padding:2px 8px;font-size:11px;font-weight:800;text-transform:capitalize">${i}</span>` : ""}</button>`;
    })}</div>` : r`<span class="muted" style="font-size:14px">Nothing on the fridge yet. Your best doodles go here for everyone to see.</span>`}
      </section>
      ${this._view ? r`<button class="view" aria-label="Close" @click=${() => {
      this._view = "";
    }}><img src=${this._view} alt="Doodle"></button>` : K}
      ${this._msg ? r`<div class="toast" role="status">${this._msg}</div>` : K}`;
  }
};
kt.styles = [W, b`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .tools { width: 132px; flex-shrink: 0; border-radius: 28px; padding: 14px 10px; display: grid; grid-template-columns: 1fr 1fr; justify-items: center; align-content: start; gap: 10px 6px; overflow: auto; }
    .tools .sep { grid-column: 1 / -1; height: 1px; width: 90px; background: var(--track); }
    .ink { width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.12); transition: transform .2s cubic-bezier(.2,1.4,.4,1); flex-shrink: 0; }
    .ink[aria-pressed='true'] { transform: scale(1.18); box-shadow: 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .rainbow { background: conic-gradient(#e63946, #fcbf49, #2a9d8f, #118ab2, #7b2cbf, #e63946); }
    .size { width: 50px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .size[aria-pressed='true'] { background: var(--chip-strong); }
    .size i { border-radius: 50%; background: var(--ink); display: block; }
    .paper { flex: 1; min-width: 0; border-radius: 28px; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .wrap { flex: 1; min-height: 0; border-radius: 20px; overflow: hidden; position: relative; background: #fffdf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); transition: background .4s; }
    .wrap.chalk { background: #23332b; }
    canvas { position: absolute; inset: 0; touch-action: none; cursor: crosshair; }
    .hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: 700; color: rgba(0,0,0,.12); }
    .chalk .hint { color: rgba(255,255,255,.18); }
    .acts { display: flex; gap: 8px; align-items: center; }
    .fridge { width: 250px; flex-shrink: 0; border-radius: 28px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .pics { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; }
    .pic { aspect-ratio: 4/3; border-radius: 10px; background: #fff center / cover; box-shadow: 0 6px 14px -6px rgba(0,0,0,.35); position: relative; }
    .pic:nth-child(odd) { transform: rotate(-2.5deg); } .pic:nth-child(even) { transform: rotate(2deg); }
    .pic::before { content: ''; position: absolute; top: -6px; left: 50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--accent); box-shadow: 0 2px 3px rgba(0,0,0,.3); }
    .stick { animation: stick .9s cubic-bezier(.2,1.3,.4,1); }
    @keyframes stick { 0% { transform: scale(1); } 40% { transform: scale(.4) translate(60%, -10%) rotate(8deg); opacity: .6; } 100% { transform: scale(1); opacity: 1; } }
    .view { position: absolute; inset: 0; z-index: 30; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; border-radius: 28px; }
    .view img { max-width: 92%; max-height: 92%; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.5); animation: sheet .4s cubic-bezier(.2,1.2,.3,1); }
  `], kt.properties = {
  hass: { attribute: !1 },
  artists: { attribute: !1 },
  _stamp: { state: !0 },
  _artist: { state: !0 },
  _ink: { state: !0 },
  _size: { state: !0 },
  _erase: { state: !0 },
  _chalk: { state: !0 },
  _blank: { state: !0 },
  _pics: { state: !0 },
  _view: { state: !0 },
  _msg: { state: !0 },
  _stick: { state: !0 }
};
let Ot = kt;
customElements.get("fh-doodle") || customElements.define("fh-doodle", Ot);
const Uo = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], xt = class xt extends g {
  constructor() {
    super(...arguments), this.kids = [], this.events = [], this.leaveBy = "08:15", this.rules = [], this.privateWords = [], this.uv = 0, this.termLabel = "", this._items = {}, this._now = /* @__PURE__ */ new Date(), this._unsubs = [];
  }
  connectedCallback() {
    super.connectedCallback(), this._t = window.setInterval(() => {
      this._now = /* @__PURE__ */ new Date();
    }, 15e3), this._sub();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearInterval(this._t), this._unsubs.forEach((t) => t()), this._unsubs = [];
  }
  shouldUpdate(t) {
    return t.size === 1 && t.has("hass") ? si(t.get("hass"), this.hass, this.kids.map((i) => w(i).avatar)) : !0;
  }
  async _sub() {
    if (!this.hass?.connection) {
      setTimeout(() => this._sub(), 500);
      return;
    }
    for (const t of this.kids) {
      const i = w(t).chores;
      try {
        const a = await this.hass.connection.subscribeMessage((o) => {
          this._items = { ...this._items, [t.name]: o.items.map(ea) };
        }, { type: "todo/item/subscribe", entity_id: i });
        this.isConnected ? this._unsubs.push(a) : a();
      } catch {
      }
    }
  }
  _bring(t, i) {
    const a = new Set(t.bring?.[Uo[this._now.getDay()]] ?? []), o = i.filter((s) => s.who === t.name || s.title.toLowerCase().includes(t.name.toLowerCase())).map((s) => s.title.toLowerCase()).join(" | ");
    for (const s of this.rules)
      s.kid && s.kid !== t.name || new RegExp(s.match, "i").test(o) && a.add(s.item);
    return this.uv >= 3 && a.add("Hat 🧢"), [...a];
  }
  render() {
    if (!this.hass) return K;
    const t = x(this.leaveBy) - At(this._now), i = this._now, a = this.privateWords.map((o) => o.toLowerCase());
    return r`
      <section class="glass top">
        <div style="flex:1"><h1 style="font-size:28px;font-weight:800">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:600">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ""}</span></div>
        <div style="text-align:right"><div class="leave ${t <= 10 && t > -15 ? "soon" : ""}">${t > 0 ? `${t} min` : t > -15 ? "Time to go!" : "Have a great day"}</div>
          <span class="muted" style="font-size:14px;font-weight:600">${t > 0 ? `until we leave at ${f(new Date((/* @__PURE__ */ new Date()).setHours(Math.floor(x(this.leaveBy) / 60), x(this.leaveBy) % 60, 0)))}` : ""}</span></div>
      </section>
      <div class="cols" style="--n:${this.kids.length}">
        ${this.kids.map((o) => {
      const s = w(o), p = $(this.hass.states[s.avatar]?.state, o.look ? $(o.look) : {}), l = (this._items[o.name] ?? []).filter((m) => m.lane === "routine" && m.slot === "am"), n = l.filter((m) => m.status === "completed").length, c = this.events.filter((m) => C(m.start, i) && !a.some((d) => m.title.toLowerCase().includes(d)) && (m.who === o.name || m.colour === "family" || m.title.toLowerCase().includes(o.name.toLowerCase()))), A = this._bring(o, c);
      return r`<button class="glass col tap" style="--kid:${u(o.colour)}" @click=${() => this.dispatchEvent(new CustomEvent("open-kid", { detail: o.name }))}>
            <div class="who">${Q(p, { size: 56, crop: "head", still: !0, age: o.age, ring: u(o.colour) })}<h2>${o.name}</h2>
              <span style="font-size:15px;font-weight:800">${l.length ? n === l.length ? "✅ Ready" : `${n}/${l.length}` : ""}</span></div>
            ${l.length ? r`<div class="bar"><div style="width:${n / l.length * 100}%"></div></div>
              <div class="steps">${l.map((m) => r`<span class="step ${m.status === "completed" ? "done" : ""}">${St(m.summary)} ${m.summary}</span>`)}</div>` : K}
            ${A.length ? r`<span class="label">Bring</span><div class="bring">${A.map((m) => r`<span>${m}</span>`)}</div>` : K}
            <span class="label">Today</span>
            ${c.length ? c.slice(0, 4).map((m) => r`<div class="mev2"><span class="t">${m.allDay ? "All day" : f(m.start)}</span><span>${m.title}</span></div>`) : r`<span class="muted" style="font-size:14px">Just school today</span>`}
          </button>`;
    })}
      </div>`;
  }
};
xt.styles = [W, b`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; }
    .top { border-radius: 26px; padding: 14px 20px; display: flex; align-items: center; gap: 18px; }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 40px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .leave.soon { color: #dc2626; animation: pulse 1.2s ease-in-out infinite; }
    .cols { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 14px; }
    .col { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; text-align: left; border-top: 6px solid var(--kid); }
    .who { display: flex; align-items: center; gap: 12px; }
    .who h2 { font-size: 24px; font-weight: 800; flex: 1; }
    .bar { height: 12px; border-radius: 6px; background: var(--track); overflow: hidden; }
    .bar > div { height: 100%; border-radius: 6px; background: var(--ok); transition: width .6s; }
    .steps { display: flex; flex-wrap: wrap; gap: 8px; }
    .step { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; }
    .step.done { background: color-mix(in srgb, var(--ok) 22%, var(--chip)); text-decoration: line-through; color: var(--ink3); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: 700; }
    .mev2 { display: flex; gap: 10px; font-size: 15px; font-weight: 600; }
    .mev2 .t { width: 72px; color: var(--ink2); flex-shrink: 0; }
    @keyframes pulse { 50% { opacity: .55; } }
    ${B(wt)}
  `], xt.properties = {
  hass: { attribute: !1 },
  kids: { attribute: !1 },
  events: { attribute: !1 },
  leaveBy: {},
  rules: { attribute: !1 },
  privateWords: { attribute: !1 },
  uv: { type: Number },
  termLabel: {},
  _items: { state: !0 },
  _now: { state: !0 }
};
let Ht = xt;
customElements.get("fh-morning") || customElements.define("fh-morning", Ht);
const co = ["qwertyuiop", "asdfghjkl", "zxcvbnm"], mo = ["All day", "07:00", "08:00", "09:00", "10:00", "12:00", "15:00", "15:30", "16:00", "17:00", "18:00", "19:00"], H = (e) => String(e).padStart(2, "0"), Yi = (e) => `${e.getFullYear()}-${H(e.getMonth() + 1)}-${H(e.getDate())} ${H(e.getHours())}:${H(e.getMinutes())}:00`, Bi = (e) => `${e.getFullYear()}-${H(e.getMonth() + 1)}-${H(e.getDate())}`, Wt = class Wt extends g {
  constructor() {
    super(...arguments), this.calendars = [], this.defaultCal = "", this._t = "", this._day = 0, this._time = "All day", this._dur = 60, this._cal = "", this._busy = !1, this._err = "", this._caps = !0;
  }
  _key(t) {
    if (t === "del") {
      this._t = this._t.slice(0, -1), this._caps = !this._t.length;
      return;
    }
    if (t === " ") {
      this._t += " ";
      return;
    }
    this._t += this._caps ? t.toUpperCase() : t, this._caps = !1;
  }
  async _save() {
    const t = this._cal || this.defaultCal || this.calendars[0]?.entity;
    if (!this._t.trim() || !t || !this.hass) {
      this._err = "Add a title first";
      return;
    }
    const i = F(k(/* @__PURE__ */ new Date()), this._day), a = { summary: this._t.trim() };
    if (this._time === "All day")
      a.start_date = Bi(i), a.end_date = Bi(F(i, 1));
    else {
      const [o, s] = this._time.split(":").map(Number), p = new Date(i);
      p.setHours(o, s, 0, 0), a.start_date_time = Yi(p), a.end_date_time = Yi(new Date(p.getTime() + this._dur * 6e4));
    }
    this._busy = !0, this._err = "";
    try {
      await this.hass.callService("calendar", "create_event", a, { entity_id: t }), this.dispatchEvent(new CustomEvent("saved", { detail: this._t.trim() }));
    } catch (o) {
      this._err = `Couldn’t add it: ${o?.message ?? "error"}`;
    } finally {
      this._busy = !1;
    }
  }
  render() {
    const t = k(/* @__PURE__ */ new Date()), i = this._cal || this.defaultCal || this.calendars[0]?.entity;
    return r`<div class="glass box" role="dialog" aria-label="Add to the calendar" @click=${(a) => a.stopPropagation()}>
      <div style="display:flex;gap:10px;align-items:center">
        <h2 style="font-size:24px;font-weight:800">Add to the calendar</h2><span style="flex:1"></span>
        <button class="round tap" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent("close"))}>${q("close", 18)}</button></div>
      <div style="display:flex;gap:10px"><input class="field" inputmode="none" placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @input=${(a) => {
      this._t = a.target.value;
    }}>
        <button class="pill tap primary" style="height:58px;padding:0 24px;font-size:17px" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? "Adding…" : "Add"}</button></div>
      ${this._err ? r`<span style="color:#dc2626;font-weight:600">${this._err}</span>` : ""}
      <div class="chips">${Array.from({ length: 8 }, (a, o) => r`<button class="tap" aria-pressed=${String(this._day === o)} @click=${() => {
      this._day = o;
    }}>${o === 0 ? "Today" : o === 1 ? "Tomorrow" : `${lt(F(t, o))} ${F(t, o).getDate()}`}</button>`)}</div>
      <div class="chips">${mo.map((a) => r`<button class="tap" aria-pressed=${String(this._time === a)} @click=${() => {
      this._time = a;
    }}>${a === "All day" ? a : new Date(2e3, 0, 1, Number(a.slice(0, 2)), Number(a.slice(3))).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toLowerCase()}</button>`)}
        ${this._time !== "All day" ? [30, 60, 90, 120].map((a) => r`<button class="tap" aria-pressed=${String(this._dur === a)} @click=${() => {
      this._dur = a;
    }}>${a < 60 ? `${a} min` : `${a / 60} hr`}</button>`) : ""}</div>
      <div class="chips">${this.calendars.map((a) => r`<button class="tap" aria-pressed=${String(i === a.entity)} @click=${() => {
      this._cal = a.entity;
    }}><span class="dot" style="background:${u(a.colour)}"></span>${a.name ?? a.entity}</button>`)}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${co.map((a, o) => r`<div class="row">${o === 2 ? r`<button class="key tap" style="width:84px;font-size:16px" @click=${() => {
      this._caps = !this._caps;
    }}>${this._caps ? "⇧ ABC" : "⇧ abc"}</button>` : ""}${[...a].map((s) => r`<button class="key tap" @click=${() => this._key(s)}>${this._caps ? s.toUpperCase() : s}</button>`)}${o === 2 ? r`<button class="key tap" style="width:84px" aria-label="Delete" @click=${() => this._key("del")}>⌫</button>` : ""}</div>`)}
        <div class="row"><button class="key tap" style="width:420px;font-size:16px" @click=${() => this._key(" ")}>space</button></div>
      </div>
    </div>`;
  }
};
Wt.styles = [W, b`
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
    .box { width: min(1100px, 94%); max-height: 96%; overflow-y: auto; border-radius: 30px; padding: 16px 20px; display: flex; flex-direction: column; gap: 9px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .field { flex: 1; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: 600; color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips button { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .row { display: flex; gap: 6px; justify-content: center; }
    .key { width: 56px; height: 48px; border-radius: 12px; background: var(--chip-strong); box-shadow: 0 2px 0 rgba(0,0,0,.12); font-size: 22px; font-weight: 500; }
    .key:active { transform: scale(.92); }
  `], Wt.properties = { hass: { attribute: !1 }, calendars: { attribute: !1 }, defaultCal: {}, _t: { state: !0 }, _day: { state: !0 }, _time: { state: !0 }, _dur: { state: !0 }, _cal: { state: !0 }, _busy: { state: !0 }, _err: { state: !0 }, _caps: { state: !0 } };
let Et = Wt;
customElements.get("fh-add-event") || customElements.define("fh-add-event", Et);
const sa = "0.4.0", Ji = "family-hub-theme", Ao = {
  "clear-night": "Clear",
  cloudy: "Cloudy",
  exceptional: "Wild weather",
  fog: "Foggy",
  hail: "Hail",
  lightning: "Storms",
  "lightning-rainy": "Storms",
  partlycloudy: "Partly cloudy",
  pouring: "Pouring",
  rainy: "Rain",
  snowy: "Snow",
  "snowy-rainy": "Sleet",
  sunny: "Sunny",
  windy: "Windy",
  "windy-variant": "Windy"
}, ho = "fh-kid,fh-home,fh-music,fh-groceries,fh-doodle,fh-morning,fh-add-event";
function qo() {
  if (document.getElementById("family-hub-fonts")) return;
  const e = document.createElement("link");
  e.id = "family-hub-fonts", e.rel = "stylesheet", e.href = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@400;500;600;700;800&display=swap", document.head.appendChild(e);
}
const yt = class yt extends g {
  constructor() {
    super(...arguments), this._view = "week", this._anchor = /* @__PURE__ */ new Date(), this._events = [], this._soon = [], this._theme = "sea", this._sheet = "", this._now = /* @__PURE__ */ new Date(), this._toast = "", this._wx = {}, this._reminders = [], this._awakeUntil = 0, this._nightManual = !1, this._page = "planner", this._kid = 0, this._photo = "", this._musicFocus = "", this._photos = [], this._photoIdx = 0, this._lastTouch = Date.now(), this._idle = !1, this._undo = null, this._dinner = null, this._dinnerCooldown = 0, this._alarm = 0, this._alarmSeen = 0, this._pinAsk = null, this._fetchedKey = "", this._fetchGen = 0, this._dayKey = "", this._touched = () => {
      this._lastTouch = Date.now(), this._idle && (this._idle = !1);
    };
  }
  setConfig(t) {
    if (!t) throw new Error("Family Hub: missing configuration");
    for (const a of t.kids ?? []) if (!a.name) throw new Error("Family Hub: every kid needs a name");
    for (const a of t.calendars ?? []) if (!a.entity?.startsWith("calendar.")) throw new Error(`Family Hub: "${a.entity}" isn't a calendar entity`);
    if (t.parent_pin !== void 0 && !/^\d{4,8}$/.test(String(t.parent_pin))) throw new Error("Family Hub: parent_pin should be 4–8 digits (put it in quotes)");
    this._config = t;
    let i = null;
    try {
      i = localStorage.getItem(Ji);
    } catch {
    }
    this._theme = Ri(i || t.theme || "sea").id, this._morningWindow() && (this._page = "morning");
  }
  getCardSize() {
    return 12;
  }
  static getStubConfig() {
    return { type: "custom:family-hub-card", family_name: "everyone", theme: "sea" };
  }
  connectedCallback() {
    super.connectedCallback(), qo(), this._tick = window.setInterval(() => this._onTick(), 1e3), this._poll = window.setInterval(() => {
      this._fetchedKey = "", this._refresh(), this._loadSoon();
    }, 5 * 6e4), this.addEventListener("pointerdown", this._touched, { capture: !0 });
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearInterval(this._tick), clearInterval(this._poll), clearInterval(this._photoTimer), this._photoTimer = void 0, this._photos = [], this.removeEventListener("pointerdown", this._touched, { capture: !0 });
  }
  _onTick() {
    const t = /* @__PURE__ */ new Date();
    if ((this._timerLeft() !== null || this._dinner || this._undo || t.getSeconds() % 15 === 0) && (this._now = t), this._undo && Date.now() > this._undo.until && (this._undo = null), t.getSeconds() % 15) return;
    $a(Lt(t, this._config?.quiet?.start ?? "20:00", this._config?.quiet?.end ?? "06:30"));
    const a = Date.now() - this._lastTouch;
    !this._idle && a > 6e4 && (this._idle = !0);
    const o = (this._config?.idle_seconds ?? 180) * 1e3, s = this._morningWindow() ? "morning" : "planner";
    o > 0 && a > o && (this._page !== s || this._sheet) && (this._page = s, this._sheet = "", this._view = "week", this._anchor = /* @__PURE__ */ new Date());
    const p = Bt(t);
    p !== this._dayKey && (this._dayKey = p, a > o && (this._anchor = /* @__PURE__ */ new Date()), this._fetchedKey = "", this._refresh(), this._loadSoon());
  }
  /** Pass fresh hass to the open page without re-rendering the whole card. */
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass") && this._config) {
      const i = t.get("hass");
      return this.renderRoot?.querySelectorAll(ho).forEach((a) => {
        a.hass = this.hass;
      }), si(i, this.hass, this._watch());
    }
    return !0;
  }
  _watch() {
    const t = this._config;
    return [
      t.weather,
      t.music_player,
      t.reminders,
      "timer.kitchen",
      "input_text.fh_panel_message",
      "input_number.family_jar",
      ...(t.people ?? []).map((i) => i.entity),
      ...(t.kids ?? []).map((i) => w(i).avatar),
      ...(t.meds ?? []).flatMap((i) => [`input_datetime.fh_med_${i.id}`, `input_text.fh_med_${i.id}_by`])
    ].filter((i) => !!i);
  }
  updated(t) {
    (t.has("hass") || t.has("_view") || t.has("_anchor")) && this._refresh(), t.has("hass") && this._checkAlarm();
  }
  // ---------- data ----------
  _range() {
    if (this._view === "day") {
      const i = k(this._anchor);
      return [i, F(i, 1)];
    }
    if (this._view === "month") {
      const i = yi(this._anchor);
      return [i, F(i, 42)];
    }
    const t = st(this._anchor);
    return [t, F(t, 7)];
  }
  _refresh() {
    if (!this.hass || !this._config) return;
    const [t, i] = this._range(), a = `${this._view}|${t.toISOString()}`;
    if (a === this._fetchedKey) return;
    const o = !this._fetchedKey && !this._dayKey;
    this._fetchedKey = a, this._loadEvents(t, i).then((s) => {
      s && (this._events = s);
    }), this._loadWeather(), this._loadReminders(), (o || !this._soon.length) && this._loadSoon(), this._config.photos && !this._photos.length && !this._photoTimer && this._loadPhotos();
  }
  async _loadSoon() {
    const t = k(/* @__PURE__ */ new Date()), i = await this._loadEvents(t, F(t, 3), !0);
    i && (this._soon = i);
  }
  async _loadPhotos() {
    const t = this.hass, i = this._config.photos;
    this._photoTimer = window.setInterval(() => this._nextPhoto(), (this._config.photo_minutes ?? 10) * 6e4);
    try {
      const a = await t.callWS({ type: "media_source/browse_media", media_content_id: i });
      this._photos = a.children.filter((o) => o.media_class === "image").map((o) => o.media_content_id);
      for (let o = this._photos.length - 1; o > 0; o--) {
        const s = Math.floor(Math.random() * (o + 1));
        [this._photos[o], this._photos[s]] = [this._photos[s], this._photos[o]];
      }
      this._nextPhoto();
    } catch (a) {
      console.warn("Family Hub: photo folder not found", i, a);
    }
  }
  async _nextPhoto() {
    if (!this._photos.length || !this.hass) return;
    const t = this._photos[this._photoIdx++ % this._photos.length];
    try {
      const i = await this.hass.callWS({ type: "media_source/resolve_media", media_content_id: t }), a = new Image();
      a.onload = () => {
        this._photo = i.url;
      }, a.src = i.url;
    } catch {
    }
  }
  async _loadEvents(t, i, a = !1) {
    const o = this._config.calendars ?? [];
    if (!o.length || !this.hass) return [];
    const s = a ? 0 : ++this._fetchGen, p = [];
    return await Promise.all(o.map(async (l) => {
      try {
        const n = await this.hass.callApi("GET", `calendars/${l.entity}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(i.toISOString())}`), c = l.name ?? this.hass.states[l.entity]?.attributes.friendly_name ?? l.entity;
        for (const A of n) {
          const m = !!A.start?.date, d = m ? /* @__PURE__ */ new Date(`${A.start.date}T00:00:00`) : new Date(A.start.dateTime), V = m ? /* @__PURE__ */ new Date(`${A.end.date}T00:00:00`) : new Date(A.end.dateTime);
          p.push({ title: A.summary ?? "(busy)", start: d, end: V, allDay: m, colour: l.colour, who: c });
        }
      } catch (n) {
        console.warn("Family Hub: calendar fetch failed", l.entity, n);
      }
    })), !a && s !== this._fetchGen ? null : (p.sort((l, n) => Number(n.allDay) - Number(l.allDay) || l.start.getTime() - n.start.getTime()), p);
  }
  async _loadWeather() {
    const t = this._config.weather;
    if (!(!t || !this.hass?.states[t]))
      try {
        const a = (await this.hass.callWS({ type: "call_service", domain: "weather", service: "get_forecasts", service_data: { type: "daily" }, target: { entity_id: t }, return_response: !0 }))?.response?.[t]?.forecast?.[0];
        this._wx = { max: a?.temperature, min: a?.templow, uv: a?.uv_index, rain: a?.precipitation };
      } catch {
        this._wx = {};
      }
  }
  async _loadReminders() {
    const t = this._config.reminders;
    if (!t || !this.hass?.states[t]) {
      this._reminders = [];
      return;
    }
    try {
      const i = await this.hass.callWS({ type: "todo/item/list", entity_id: t });
      this._reminders = i.items.filter((a) => a.status === "needs_action").slice(0, 5);
    } catch {
      this._reminders = [];
    }
  }
  _private(t) {
    const i = t.toLowerCase();
    return (this._config.private ?? []).some((a) => i.includes(a.toLowerCase()));
  }
  _eventsOn(t, i = this._events) {
    const a = k(t), o = F(a, 1);
    return i.filter((s) => s.start < o && s.end > a && !(s.allDay && s.end.getTime() === a.getTime()));
  }
  _morningWindow(t = /* @__PURE__ */ new Date()) {
    const i = this._config, a = i?.morning;
    return !a || !i.kids?.length ? !1 : Gi(t, i.school_terms, i.public_holidays) && wi(t, a.start ?? "06:30", a.end ?? "08:45");
  }
  _termLabel(t = /* @__PURE__ */ new Date()) {
    const i = Bt(t), a = this._config.school_terms ?? [], o = a.findIndex(([n, c]) => i >= n && i <= c);
    if (o < 0) return Gi(t, a, this._config.public_holidays) ? "School day" : "Holidays";
    const s = /* @__PURE__ */ new Date(`${a[o][0]}T00:00:00`), p = Math.floor((st(t).getTime() - st(s).getTime()) / (7 * 864e5)) + 1, l = s.getMonth();
    return `Term ${l <= 2 ? 1 : l <= 5 ? 2 : l <= 8 ? 3 : 4}, week ${p}`;
  }
  // ---------- timer, alarm, meds ----------
  _timerLeft() {
    const t = this.hass?.states["timer.kitchen"];
    if (!t) return null;
    if (t.state === "active" && t.attributes.finishes_at) return Math.max(0, new Date(t.attributes.finishes_at).getTime() - Date.now());
    if (t.state === "paused" && t.attributes.remaining) {
      const [i, a, o] = String(t.attributes.remaining).split(":").map(Number);
      return ((i * 60 + a) * 60 + o) * 1e3;
    }
    return null;
  }
  _addTimer(t) {
    this.hass?.callService("script", "fh_timer_add", { minutes: t }), S("tap");
  }
  _checkAlarm() {
    const t = zi(this.hass);
    if (t?.alarm && t.ts && t.ts !== this._alarmSeen && Date.now() / 1e3 - t.ts < 120) {
      this._alarmSeen = t.ts, this._alarm = t.ts, S("alarm");
      let i = 0;
      const a = window.setInterval(() => {
        if (!this._alarm || ++i > 12) {
          clearInterval(a), this._alarm = 0;
          return;
        }
        S("alarm");
      }, 5e3);
    }
  }
  _medStatus(t, i) {
    const a = this.hass?.states[`input_datetime.fh_med_${t}`], o = a?.attributes.timestamp ? new Date(a.attributes.timestamp * 1e3) : null, s = o && C(o, /* @__PURE__ */ new Date()) ? o : null, p = At(this._now), l = x(i);
    return { given: s, by: this.hass?.states[`input_text.fh_med_${t}_by`]?.state ?? "", due: !s && p >= l - 60, late: !s && p > l + 45 };
  }
  _giveMed(t, i) {
    const a = this.hass;
    a.callService("input_datetime", "set_datetime", { entity_id: `input_datetime.fh_med_${t}`, timestamp: Math.floor(Date.now() / 1e3) }), a.callService("input_text", "set_value", { entity_id: `input_text.fh_med_${t}_by`, value: i }), a.callService("persistent_notification", "dismiss", { notification_id: `fh_meds_${t.split("_").pop()}` }).catch(() => {
    }), S("tick"), this._say(`Logged – given by ${i}`);
  }
  // ---------- actions ----------
  _say(t, i = 2600) {
    this._toast = t, clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => {
      this._toast = "";
    }, i);
  }
  _setTheme(t) {
    this._theme = t, S("tap");
    try {
      localStorage.setItem(Ji, t);
    } catch {
    }
  }
  _shift(t) {
    const i = this._anchor;
    this._anchor = this._view === "day" ? F(i, t) : this._view === "week" ? F(i, 7 * t) : new Date(i.getFullYear(), i.getMonth() + t, 1);
  }
  _allOn() {
    const t = this._config.all_on;
    this.hass?.callService("light", "turn_on", { entity_id: t?.length ? t : "all" }), S("tap"), this._say(t?.length ? "Living areas on" : "All lights on");
  }
  _allOff() {
    const t = Object.values(this.hass?.states ?? {}).filter((i) => i.entity_id.startsWith("light.") && i.state === "on").map((i) => i.entity_id);
    if (!t.length) {
      this._say("Everything’s already off");
      return;
    }
    this.hass?.callService("light", "turn_off", { entity_id: t }), S("untick"), this._undo = { ids: t, until: Date.now() + 1e4 };
  }
  _undoOff() {
    this._undo && (this.hass?.callService("light", "turn_on", { entity_id: this._undo.ids }), this._undo = null, this._say("Back on"));
  }
  _dinnerStart() {
    if (Date.now() < this._dinnerCooldown) {
      this._say("Already called – give them a minute");
      return;
    }
    S("tap");
    const t = window.setTimeout(() => this._dinnerGo(), 3e3);
    this._dinner = { at: Date.now() + 3e3, timer: t };
  }
  _dinnerCancel() {
    clearTimeout(this._dinner?.timer), this._dinner = null, this._say("Cancelled");
  }
  _dinnerGo() {
    this._dinner = null;
    const t = this._config.announce_script;
    if (!t || !this.hass) {
      this._say("Set announce_script in the card settings");
      return;
    }
    this.hass.callService("script", "turn_on", { entity_id: t }), this._dinnerCooldown = Date.now() + 6e4, S("done"), this._say("Calling everyone for dinner 🍽️");
  }
  _media(t) {
    const i = this._config.music_player;
    i && this.hass?.callService("media_player", t, { entity_id: i });
  }
  _assist() {
    this.dispatchEvent(new CustomEvent("hass-action", { bubbles: !0, composed: !0, detail: { config: { tap_action: { action: "assist", start_listening: !0 } }, action: "tap" } }));
  }
  _openKid(t) {
    const i = (this._config.kids ?? []).findIndex((a) => a.name === t);
    i >= 0 && (this._kid = i, this._page = "kid");
  }
  // ---------- render ----------
  render() {
    if (!this._config) return K;
    const t = this._page === "kid" ? this._config.kids?.[this._kid] : void 0, i = Ri(t?.theme ?? this._theme), a = this._isNight(), o = this._photo ? `;--bg:url('${this._photo}')` : "", s = this._now.getHours(), p = s < 5 || s >= 21 ? "rgba(10,20,60,.28)" : s < 7 ? "rgba(255,170,150,.16)" : s >= 17 && s < 19 ? "rgba(255,150,60,.14)" : s >= 19 ? "rgba(30,40,110,.2)" : "transparent", l = /rain|pour|storm|lightning/.test(this.hass?.states[this._config.weather ?? ""]?.state ?? "");
    return a ? r`<div class="fh" style=${Gt(i) + o}>${this._night()}</div>` : r`
      <div class="fh ${this._idle ? "idle" : ""} ${l ? "rainy" : ""}" style=${`${Gt(i)}${o};--tod:${p}`}>
        ${this._header()}
        <div class="body">${this._body()}</div>
        ${this._dock()}
        ${this._sheetView()}
        ${this._dinner ? this._dinnerView() : K}
        ${this._undo ? r`<div class="toast" role="status" style="display:flex;align-items:center;gap:14px">Lights off <button class="pill tap" style="height:36px;background:#fff;color:#111" @click=${() => this._undoOff()}>Undo</button></div>` : this._toast ? r`<div class="toast" role="status">${this._toast}</div>` : K}
        ${this._alarm ? this._alarmView() : K}
        ${this._pinAsk ? r`<fh-pin .pin=${String(this._config.parent_pin ?? "")} reason=${this._pinAsk.reason} @ok=${() => {
      const n = this._pinAsk.run;
      this._pinAsk = null, n();
    }} @cancel=${() => {
      this._pinAsk = null;
    }}></fh-pin>` : K}
      </div>`;
  }
  _body() {
    const t = this._config, i = (t.calendars ?? []).filter((a) => a.colour === "family").map((a) => a.entity);
    switch (this._page) {
      case "groceries":
        return r`<fh-groceries .hass=${this.hass} .entity=${t.groceries ?? "todo.shopping_list"} .usuals=${t.grocery_usuals ?? ["Milk", "Bread", "Eggs", "Bananas", "Cheese", "Coffee"]} .recipients=${t.grocery_recipients ?? []}></fh-groceries>`;
      case "kid": {
        const a = t.kids?.[this._kid];
        if (!a) break;
        const o = Lt(this._now, t.quiet?.start ?? "20:00", t.quiet?.end ?? "06:30");
        return r`<fh-kid .hass=${this.hass} .kid=${a} .familyCalendars=${i} .pin=${String(t.parent_pin ?? "")} .owed=${"todo.rewards_owed"}
          .jarTarget=${t.jar?.target ?? 120} .jarReward=${t.jar?.reward ?? "a family treat"} .privateWords=${t.private ?? []} .quiet=${o}></fh-kid>`;
      }
      case "home":
        return r`<fh-home .hass=${this.hass} .pin=${String(t.parent_pin ?? "")} .hide=${t.home_hide ?? []} .hideScripts=${t.announce_script ? [t.announce_script] : []}
        @say=${(a) => this._say(a.detail)} @music=${(a) => {
          this._musicFocus = a.detail, this._page = "music";
        }}></fh-home>`;
      case "music":
        return r`<fh-music .hass=${this.hass} .players=${t.music_players ?? []} .stations=${t.radio ?? []} .source=${t.radio_source ?? "media-source://radio_browser/country/AU"} .preferred=${this._musicFocus || (t.music_player ?? "")}></fh-music>`;
      case "doodle":
        return r`<fh-doodle .hass=${this.hass} .artists=${(t.kids ?? []).map((a) => a.name)}></fh-doodle>`;
      case "morning":
        return r`<fh-morning .hass=${this.hass} .kids=${t.kids ?? []} .events=${this._soon} .leaveBy=${t.morning?.leave_by ?? "08:15"} .rules=${t.bring_rules ?? []}
        .privateWords=${t.private ?? []} .uv=${this._wx.uv ?? 0} .termLabel=${this._termLabel()} @open-kid=${(a) => this._openKid(a.detail)}></fh-morning>`;
    }
    return r`${this._planner()}${this._aside()}`;
  }
  _isNight() {
    if (this._nightManual) return !0;
    const t = this._config.night;
    return !t || this._alarm ? !1 : wi(this._now, t.start, t.end) && Date.now() > this._awakeUntil;
  }
  _capsule() {
    const t = this._config, i = [], a = this._timerLeft();
    if (a !== null) {
      const n = Math.floor(a / 6e4), c = Math.floor(a % 6e4 / 1e3);
      i.push(r`<button class="cap tap ${a < 6e4 ? "hot" : ""}" @click=${() => {
        this._sheet = "timer";
      }}>⏲ <b>${n}:${String(c).padStart(2, "0")}</b></button>`);
    }
    const o = zi(this.hass);
    o && !o.alarm && i.push(r`<span class="cap">${o.t}</span>`);
    for (const n of t.meds ?? []) {
      const c = this._medStatus(n.id, n.time);
      c.due ? i.push(r`<button class="cap tap ${c.late ? "hot" : ""}" @click=${() => {
        this._sheet = "meds";
      }}>💊 ${c.late ? "Overdue" : "Due"} ${n.time}</button>`) : c.given && this._now.getHours() < 12 && i.push(r`<button class="cap tap ok" @click=${() => {
        this._sheet = "meds";
      }}>💊 ✓ ${f(c.given)}</button>`);
    }
    const s = Date.now(), p = this._soon.find((n) => !n.allDay && n.start.getTime() > s && n.start.getTime() - s < 12 * 36e5 && !this._private(n.title));
    if (p) {
      const n = Math.round((p.start.getTime() - s) / 6e4), c = n < 60 ? `in ${n} min` : `${C(p.start, /* @__PURE__ */ new Date()) ? "" : "Tomorrow "}${f(p.start)}`;
      i.push(r`<span class="cap"><span class="dot" style="background:${u(p.colour)}"></span>${p.title} · ${c}</span>`);
    }
    const l = t.music_player ? this.hass?.states[t.music_player] : void 0;
    return l?.state === "playing" && this._page !== "music" && i.push(r`<button class="cap tap" @click=${() => {
      this._page = "music";
    }}>♪ ${l.attributes.media_title ?? "Playing"}</button>`), r`<div class="capsule" aria-live="polite">${i}</div>`;
  }
  _header() {
    const t = this._config, i = this.hass, a = this._now, o = Mi(a), s = t.weather ? i?.states[t.weather] : void 0, p = s?.attributes.temperature, l = this._wx;
    return r`
      <header>
        <div class="clock">
          <span style="font-size:16px;font-weight:600" class="muted">${Ea(a)}${t.family_name ? `, ${t.family_name}` : ""}</span>
          <span style="display:flex;align-items:baseline;gap:10px"><span class="display hm">${o.hm}</span><span class="muted" style="font-size:16px;font-weight:600">${o.ampm} · ${Oa(a)}</span></span>
        </div>
        ${this._capsule()}
        <div class="right">
          ${s ? r`
            <div class="glass weather">
              <span style="color:var(--accent)">${q(wa(s.state), 28)}</span>
              <span style="display:flex;flex-direction:column;line-height:1.15">
                <span style="font-weight:700;font-size:20px">${p !== void 0 ? `${Math.round(p)}°` : "–"}${l.max !== void 0 ? r`<span class="muted" style="font-size:13px;font-weight:600"> · top ${Math.round(l.max)}°</span>` : K}</span>
                <span class="muted" style="font-size:13px;font-weight:600">${Ao[s.state] ?? s.state}${l.rain ? ` · ${l.rain} mm` : ""}</span>
              </span>
              ${(l.uv ?? 0) >= 3 ? r`<span class="badge" title="UV ${l.uv}">🧢 UV ${Math.round(l.uv)}</span>` : K}
              ${(l.max ?? 0) >= 35 ? r`<span class="badge hot">🥵 Hot</span>` : K}
            </div>` : K}
          ${(t.people ?? []).length ? r`
            <div class="glass presence" aria-label="Who is home">
              ${t.people.map((n) => {
      const c = n.entity ? i?.states[n.entity]?.state === "home" : !0;
      return r`<span class="avatar" title="${n.name} – ${c ? "home" : "away"}" style="width:32px;height:32px;font-size:13px;background:${u(n.colour)};opacity:${c ? 1 : 0.35}">${n.name[0]}</span>`;
    })}
            </div>` : K}
          <button class="glass tap round" style="width:52px;height:52px" aria-label="Ask Home Assistant" @click=${() => this._assist()}>${q("mic", 22)}</button>
          <button class="glass tap round" style="width:52px;height:52px" aria-label="Themes" @click=${() => {
      this._sheet = "themes";
    }}>${q("palette")}</button>
          ${t.babysitter ? r`<button class="glass tap round" style="width:52px;height:52px;font-size:20px" aria-label="House info" @click=${() => {
      this._sheet = "sitter";
    }}>ℹ️</button>` : K}
          <button class="glass tap round" style="width:52px;height:52px" aria-label="Night mode" @click=${() => {
      this._nightManual = !0;
    }}>${q("moon")}</button>
        </div>
      </header>`;
  }
  _planner() {
    const t = this._view, [i, a] = this._range(), o = t === "week" ? ["This week", Ha(i, F(a, -1))] : t === "day" ? [C(i, /* @__PURE__ */ new Date()) ? "Today" : lt(i), Ci(i)] : [this._anchor.toLocaleDateString("en-AU", { month: "long" }), String(this._anchor.getFullYear())];
    t === "week" && !C(st(/* @__PURE__ */ new Date()), i) && (o[0] = "Week of");
    const s = this._config.calendars ?? [];
    return r`
      <section class="glass planner" aria-label="Family planner">
        <div class="bar">
          <div style="display:flex;flex-direction:column;line-height:1.15;min-width:190px">
            <h1 style="font-size:28px;font-weight:800">${o[0]}</h1>
            <span class="muted" style="font-size:14px;font-weight:600">${o[1]}</span>
          </div>
          <button class="round tap" aria-label="Previous" @click=${() => this._shift(-1)}>${q("left", 20)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._shift(1)}>${q("right", 20)}</button>
          <button class="pill tap" @click=${() => {
      this._anchor = /* @__PURE__ */ new Date();
    }}>Today</button>
          <button class="pill tap" @click=${() => {
      this._sheet = "add";
    }}>${q("plus", 18)}Add</button>
          <span style="flex:1"></span>
          <div class="seg" role="group" aria-label="View">
            ${["day", "week", "month"].map((p) => r`<button class="tap" aria-pressed=${String(t === p)} @click=${() => {
      this._view = p;
    }}>${p[0].toUpperCase() + p.slice(1)}</button>`)}
          </div>
        </div>
        ${s.length ? r`<div class="legend">${s.map((p) => r`<span style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:${u(p.colour)}"></span>${p.name ?? this.hass?.states[p.entity]?.attributes.friendly_name ?? p.entity}</span>`)}</div>` : K}
        ${s.length ? t === "week" ? this._week(i) : t === "day" ? this._day(i) : this._month() : r`<div class="empty"><span style="color:var(--accent)">${q("calendar", 40)}</span><h2 style="font-size:22px">Connect your calendars</h2><span>Add Google Calendar in Home Assistant, then list the calendars in this card's settings.</span></div>`}
      </section>`;
  }
  _evCard(t) {
    return this._private(t.title) ? r`<div class="ev priv"><span class="t">${t.allDay ? "" : f(t.start)}</span><span>💊</span></div>` : r`<div class="ev" style="--c:${u(t.colour)}">
      <span class="t">${t.allDay ? "All day" : f(t.start)}</span>
      <span class="n">${t.title}</span>
      <span class="w">${t.who}</span>
    </div>`;
  }
  _week(t) {
    const i = /* @__PURE__ */ new Date(), a = Array.from({ length: 7 }, (s, p) => F(t, p)), o = a.map((s) => C(s, i) ? "1.4fr" : "1fr").join(" ");
    return r`<div class="week fade" style="grid-template-columns:${o}">
      ${a.map((s) => {
      const p = this._eventsOn(s), l = C(s, i), n = p.filter((m) => !this._private(m.title)), c = p.filter((m) => this._private(m.title)), A = 4;
      return r`<div class="col ${l ? "today" : ""}">
          <div class="dayhead"><span class="muted" style="font-size:14px;font-weight:700">${lt(s)}</span><span class="num">${s.getDate()}</span>${c.length ? r`<span class="pchip" title="Private reminder">💊</span>` : K}</div>
          ${n.slice(0, A).map((m) => this._evCard(m))}
          ${n.length > A ? r`<button class="more tap" @click=${() => {
        this._anchor = s, this._view = "day";
      }}>+${n.length - A} more</button>` : K}
        </div>`;
    })}
    </div>`;
  }
  _day(t) {
    const i = this._eventsOn(t);
    return r`<div class="daylist fade">
      ${i.length ? i.map((a) => this._private(a.title) ? r`<div class="dayrow" style="opacity:.7"><span style="width:90px;font-size:16px;font-weight:600" class="muted">${a.allDay ? "All day" : f(a.start)}</span><span style="font-size:18px">💊 Private</span></div>` : r`
        <div class="dayrow" style="background:color-mix(in srgb, ${u(a.colour)} 22%, transparent);border-left:6px solid ${u(a.colour)}">
          <span style="width:90px;font-size:16px;font-weight:700" class="muted">${a.allDay ? "All day" : f(a.start)}</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:3px"><span style="font-size:20px;font-weight:700">${a.title}</span>
          <span class="muted" style="font-size:14px;font-weight:600">${a.who}</span></span>
        </div>`) : r`<div class="empty"><h2 style="font-size:22px">Nothing on</h2><span>A free day!</span></div>`}
    </div>`;
  }
  _month() {
    const t = yi(this._anchor), i = this._anchor.getMonth(), a = /* @__PURE__ */ new Date();
    return r`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px" class="fade">
      <div class="mhead">${Array.from({ length: 7 }, (o, s) => r`<span>${lt(F(t, s))}</span>`)}</div>
      <div class="month">
        ${Array.from({ length: 42 }, (o, s) => F(t, s)).map((o) => {
      const s = this._eventsOn(o).filter((l) => !this._private(l.title)), p = C(o, a);
      return r`<button class="cell tap ${o.getMonth() !== i ? "out" : ""} ${p ? "today" : ""}" style="text-align:left" @click=${() => {
        this._anchor = o, this._view = "day";
      }}>
            <span style="font-size:14px;font-weight:700">${o.getDate()}</span>
            ${s.slice(0, 2).map((l) => r`<span class="mev"><span class="dot" style="width:7px;height:7px;background:${u(l.colour)}"></span>${l.title}</span>`)}
            ${s.length > 2 ? r`<span class="mev muted">+${s.length - 2}</span>` : K}
          </button>`;
    })}
      </div>
    </div>`;
  }
  _aside() {
    const t = this._config, i = t.music_player ? this.hass?.states[t.music_player] : void 0, a = i?.state === "playing", o = this._timerLeft(), s = o !== null ? Math.floor(o / 6e4) : 0, p = o !== null ? Math.floor(o % 6e4 / 1e3) : 0, l = L(this.hass, "input_number.family_jar"), n = t.jar?.target ?? 120;
    return r`<aside>
      ${i ? r`<section class="glass card" aria-label="Now playing">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="label">${a ? "Now playing" : "Music"}</span><span class="muted" style="font-size:12px">${i.attributes.friendly_name}</span></div>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="art" style=${i.attributes.entity_picture ? `background-image:url(${i.attributes.entity_picture})` : ""}></div>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <span style="font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.attributes.media_title ?? (i.state === "off" ? "Off" : "Nothing playing")}</span>
            <span class="muted" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.attributes.media_artist ?? ""}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:22px">
          <button class="tap" aria-label="Previous track" @click=${() => this._media("media_previous_track")}>${v("prev")}</button>
          <button class="tap primary round" style="width:54px;height:54px" aria-label=${a ? "Pause" : "Play"} @click=${() => this._media("media_play_pause")}>${v(a ? "pause" : "play", 20)}</button>
          <button class="tap" aria-label="Next track" @click=${() => this._media("media_next_track")}>${v("next")}</button>
        </div>
      </section>` : K}

      <section class="glass card" aria-label="Kitchen timer">
        <span class="label">Kitchen timer</span>
        <div style="display:flex;align-items:baseline;gap:10px"><span class="display" style="font-size:32px;font-weight:700;font-variant-numeric:tabular-nums">${o !== null ? `${s}:${String(p).padStart(2, "0")}` : "0:00"}</span>
          <span class="muted" style="font-size:13px">${o !== null ? "running · beeps everywhere" : "tap to start"}</span>
          ${o !== null ? r`<button class="tap muted" style="margin-left:auto;font-size:14px;font-weight:700" @click=${() => this.hass?.callService("timer", "cancel", { entity_id: "timer.kitchen" })}>Clear</button>` : K}</div>
        <div class="grid3">${[1, 5, 10].map((c) => r`<button class="tap" @click=${() => this._addTimer(c)}>+${c} min</button>`)}</div>
      </section>

      <section class="glass card" aria-label="Reminders" style="flex:1;min-height:0">
        ${this.hass?.states["input_number.family_jar"] ? r`<div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">🫙</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;font-weight:700">Family jar · ${l}/${n}</span>
          <div class="xpbar"><div style="width:${Math.min(100, l / n * 100)}%"></div></div></span></div>` : K}
        <span class="label">Reminders</span>
        ${this._reminders.length ? this._reminders.map((c) => r`<div class="rem"><span class="ring"></span>${c.summary}</div>`) : r`<span class="muted" style="font-size:14px">${t.reminders ? "All done!" : "Pick a to-do list for reminders in the card settings."}</span>`}
      </section>
    </aside>`;
  }
  _dock() {
    const t = (a, o, s, p = !1) => r`<button class="item tap" aria-current=${p ? "page" : "false"} @click=${() => {
      S("tap"), s();
    }}>${q(a, 26)}${o}</button>`, i = this._config.kids ?? [];
    return r`<nav class="glass dock" aria-label="Main">
      ${i.map((a, o) => {
      const s = w(a), p = this.hass?.states[s.avatar]?.state, l = p || a.look ? $(p, a.look ? $(a.look) : {}) : null, n = this._page === "kid" && this._kid === o;
      return r`<button class="item kidbtn tap" style="--kidc:${u(a.colour)}" aria-current=${n ? "page" : "false"} @click=${() => {
        S("tap"), this._kid = o, this._page = "kid";
      }}>
          <span class="avatar" style="width:44px;height:44px;background:${u(a.colour)}">${l ? Q(l, { size: 44, crop: "head", still: !0, label: a.name, age: a.age, ring: u(a.colour) }) : a.name[0]}</span>${a.name}</button>`;
    })}
      ${i.length ? r`<span class="sep" aria-hidden="true"></span>` : K}
      ${this._morningWindow() ? t("sun", "Morning", () => {
      this._page = "morning";
    }, this._page === "morning") : K}
      ${t("calendar", "Planner", () => {
      this._page = "planner";
    }, this._page === "planner")}
      ${t("cart", "Groceries", () => {
      this._page = "groceries";
    }, this._page === "groceries")}
      ${t("pencil", "Doodle", () => {
      this._page = "doodle";
    }, this._page === "doodle")}
      ${t("music", "Music", () => {
      this._page = "music";
    }, this._page === "music")}
      ${t("home", "Home", () => {
      this._page = "home";
    }, this._page === "home")}
      <span class="sep" aria-hidden="true"></span>
      <button class="item tap" @click=${() => this._allOn()}><span style="color:var(--accent)">${q("bulb", 26)}</span>All on</button>
      <button class="item tap" @click=${() => this._allOff()}>${q("bulbOff", 26)}All off</button>
      <button class="item tap ${Date.now() < this._dinnerCooldown ? "called" : ""}" @click=${() => this._dinnerStart()}>${q("megaphone", 26)}${Date.now() < this._dinnerCooldown ? "Called ✓" : "Dinner"}</button>
    </nav>`;
  }
  _dinnerView() {
    const t = Math.max(1, Math.ceil(((this._dinner?.at ?? 0) - Date.now()) / 1e3));
    return r`<div class="scrim"><section class="glass sheet" style="width:min(520px,90%);align-items:center;text-align:center" role="alertdialog" aria-label="Calling dinner">
      <span style="font-size:56px">🍽️</span><h2 style="font-size:30px;font-weight:800">Calling everyone in ${t}…</h2>
      <span class="muted">${Lt(this._now, "19:30", "07:00") ? "Quiet hours: kitchen and lounge only" : "Lounge, kitchen and bedrooms"}</span>
      <button class="pill tap" style="height:56px;padding:0 28px;font-size:17px" @click=${() => this._dinnerCancel()}>Cancel</button></section></div>`;
  }
  _alarmView() {
    return r`<button class="alarm" @click=${() => {
      this._alarm = 0, this.hass?.callService("input_text", "set_value", { entity_id: "input_text.fh_panel_message", value: "" });
    }}>
      <span style="font-size:96px">⏰</span><span class="display" style="font-size:64px;font-weight:800">Timer’s done!</span><span style="font-size:20px;font-weight:600">Tap to stop</span></button>`;
  }
  _sheetView() {
    const t = this._sheet;
    if (!t) return K;
    const i = () => {
      this._sheet = "";
    };
    if (t === "add") return r`<fh-add-event .hass=${this.hass} .calendars=${this._config.calendars ?? []} .defaultCal=${this._config.add_calendar ?? ""}
      @click=${i} @close=${i} @saved=${(o) => {
      i(), this._say(`Added “${o.detail}”`), this._fetchedKey = "", this._refresh(), this._loadSoon();
    }}></fh-add-event>`;
    const a = t === "themes" ? this._themeBody() : t === "meds" ? this._medsBody() : t === "timer" ? this._timerBody() : this._sitterBody();
    return r`<div class="scrim" @click=${(o) => {
      o.target === o.currentTarget && i();
    }}>
      <section class="glass sheet" role="dialog" style=${t === "themes" ? "" : "width:min(640px,92%)"}>${a}</section></div>`;
  }
  _sheetHead(t, i = "") {
    return r`<div style="display:flex;align-items:flex-start;gap:16px">
      <div style="flex:1"><h2 style="font-size:28px;font-weight:800">${t}</h2>${i ? r`<span class="muted">${i}</span>` : K}</div>
      <button class="round tap" aria-label="Close" @click=${() => {
      this._sheet = "";
    }}>${q("close", 18)}</button></div>`;
  }
  _themeBody() {
    return r`${this._sheetHead("Pick a theme", "Changes the whole panel.")}
      <div class="themes">
        ${ct.map((t) => r`<button class="tcard tap" aria-pressed=${String(t.id === this._theme)} @click=${() => this._setTheme(t.id)}>
          <span class="tprev" style=${Gt(t)}>${[1, 2, 3, 4, 5].map((i) => r`<span style="background:var(--p-${i})"></span>`)}</span>
          <span style="font-size:16px;font-weight:700">${t.name}</span><span class="muted" style="font-size:13px">${t.tagline}</span>
        </button>`)}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => {
      const t = ct.filter((i) => i.id !== this._theme);
      this._setTheme(t[Math.floor(Math.random() * t.length)].id);
    }}>${q("shuffle", 20)}Surprise me</button>
        <span class="muted" style="font-size:12px">Family Hub v${sa}</span>
      </div>`;
  }
  _medsBody() {
    const t = this._config.parents ?? (this._config.people ?? []).map((i) => i.name);
    return r`${this._sheetHead("Medication", "Kept off the kids’ pages and the night screen.")}
      ${(this._config.meds ?? []).map((i) => {
      const a = this._medStatus(i.id, i.time);
      return r`<div class="card" style="background:var(--chip);border-radius:20px">
          <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">💊</span>
            <span style="flex:1;display:flex;flex-direction:column"><b style="font-size:18px">${i.who ? `${i.who} – ` : ""}${i.label}</b><span class="muted">Due ${i.time}</span></span>
            <b style="font-size:16px;color:${a.given ? "var(--ok)" : a.late ? "#dc2626" : "var(--ink2)"}">${a.given ? `✓ ${f(a.given)}${a.by ? ` · ${a.by}` : ""}` : a.late ? "Overdue" : "Not yet"}</b></div>
          ${a.given ? K : r`<div style="display:flex;gap:10px;flex-wrap:wrap">${t.map((o) => r`<button class="pill tap primary" style="height:50px;padding:0 20px;font-size:16px" @click=${() => this._giveMed(i.id, o)}>Given by ${o}</button>`)}</div>`}
        </div>`;
    })}`;
  }
  _timerBody() {
    const t = this._timerLeft() ?? 0, i = Math.floor(t / 6e4), a = Math.floor(t % 6e4 / 1e3);
    return r`${this._sheetHead("Kitchen timer")}
      <span class="display" style="font-size:88px;font-weight:700;text-align:center;font-variant-numeric:tabular-nums">${i}:${String(a).padStart(2, "0")}</span>
      <div class="grid3" style="gap:10px">${[1, 5, 10].map((o) => r`<button class="tap" style="height:56px;font-size:18px" @click=${() => this._addTimer(o)}>+${o} min</button>`)}</div>
      <button class="pill tap" style="height:52px;justify-content:center" @click=${() => {
      this.hass?.callService("timer", "cancel", { entity_id: "timer.kitchen" }), this._sheet = "";
    }}>Cancel timer</button>`;
  }
  _sitterBody() {
    const t = this._config.babysitter;
    return r`${this._sheetHead(t.title ?? "House info", "For babysitters and visitors")}
      <div class="card" style="background:#fee2e2;color:#7f1d1d;border-radius:20px"><b style="font-size:20px">Emergency: 000</b><span>Poisons Information Centre: 13 11 26</span></div>
      ${(t.lines ?? []).map((i) => r`<div style="font-size:17px;font-weight:600;padding:4px 2px">${i}</div>`)}`;
  }
  _night() {
    const t = this._now, i = Mi(t), a = t.getHours() < 6, o = a ? t : F(t, 1), s = this._eventsOn(o, this._soon).filter((n) => !this._private(n.title)).slice(0, 3), p = t.getMinutes() % 10 * 6, l = t.getHours() % 4 * 10;
    return r`<button class="night" aria-label="Wake the panel" @click=${() => {
      this._nightManual = !1, this._awakeUntil = Date.now() + 10 * 6e4, this._lastTouch = Date.now();
    }}>
      <div style="transform:translate(${p}px, ${l}px);transition:transform 30s linear"><span class="display big">${i.hm}</span><div class="ndate">${Ci(t)}</div></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px">
        ${s.length ? r`<div class="dglass" style="width:460px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:12px">
          <span style="font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;opacity:.8">${a ? "Today" : "Tomorrow"}</span>
          ${s.map((n) => r`<div style="display:flex;align-items:center;gap:12px;font-size:18px"><span style="width:80px;opacity:.8">${n.allDay ? "All day" : f(n.start)}</span>${n.title}</div>`)}
        </div>` : r`<span></span>`}
        <span class="breathe" style="font-size:16px;opacity:.7">Tap anywhere to wake</span>
      </div>
    </button>`;
  }
};
yt.styles = [W, b`${B(wt)}`], yt.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _view: { state: !0 },
  _anchor: { state: !0 },
  _events: { state: !0 },
  _soon: { state: !0 },
  _theme: { state: !0 },
  _sheet: { state: !0 },
  _now: { state: !0 },
  _toast: { state: !0 },
  _wx: { state: !0 },
  _reminders: { state: !0 },
  _awakeUntil: { state: !0 },
  _nightManual: { state: !0 },
  _page: { state: !0 },
  _kid: { state: !0 },
  _photo: { state: !0 },
  _idle: { state: !0 },
  _undo: { state: !0 },
  _dinner: { state: !0 },
  _alarm: { state: !0 },
  _pinAsk: { state: !0 }
};
let _t = yt;
customElements.get("family-hub-card") || customElements.define("family-hub-card", _t);
const $t = window;
$t.customCards = $t.customCards || [];
$t.customCards.push({ type: "family-hub-card", name: "Family Hub", description: "Glassy, themeable family planner for wall panels.", preview: !1 });
console.info(`%c FAMILY-HUB %c v${sa} `, "background:#0b5fa5;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px", "background:#ffd166;color:#0b2236;border-radius:0 3px 3px 0;padding:2px 6px");
export {
  _t as FamilyHubCard
};

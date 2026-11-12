/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ca = globalThis, Ai = ca.ShadowRoot && (ca.ShadyCSS === void 0 || ca.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, qi = Symbol(), Li = /* @__PURE__ */ new WeakMap();
let Te = class {
  constructor(t, a, i) {
    if (this._$cssResult$ = !0, i !== qi) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = a;
  }
  get styleSheet() {
    let t = this.o;
    const a = this.t;
    if (Ai && t === void 0) {
      const i = a !== void 0 && a.length === 1;
      i && (t = Li.get(a)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), i && Li.set(a, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const $ = (e) => new Te(typeof e == "string" ? e : e + "", void 0, qi), G = (e, ...t) => {
  const a = e.length === 1 ? e[0] : t.reduce((i, o, s) => i + ((r) => {
    if (r._$cssResult$ === !0) return r.cssText;
    if (typeof r == "number") return r;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + r + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(o) + e[s + 1], e[0]);
  return new Te(a, e, qi);
}, po = (e, t) => {
  if (Ai) e.adoptedStyleSheets = t.map((a) => a instanceof CSSStyleSheet ? a : a.styleSheet);
  else for (const a of t) {
    const i = document.createElement("style"), o = ca.litNonce;
    o !== void 0 && i.setAttribute("nonce", o), i.textContent = a.cssText, e.appendChild(i);
  }
}, Zi = Ai ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((t) => {
  let a = "";
  for (const i of t.cssRules) a += i.cssText;
  return $(a);
})(e) : e;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: co, defineProperty: ho, getOwnPropertyDescriptor: mo, getOwnPropertyNames: uo, getOwnPropertySymbols: go, getPrototypeOf: Ko } = Object, Va = globalThis, Qi = Va.trustedTypes, fo = Qi ? Qi.emptyScript : "", Uo = Va.reactiveElementPolyfillSupport, Lt = (e, t) => e, _a = { toAttribute(e, t) {
  switch (t) {
    case Boolean:
      e = e ? fo : null;
      break;
    case Object:
    case Array:
      e = e == null ? e : JSON.stringify(e);
  }
  return e;
}, fromAttribute(e, t) {
  let a = e;
  switch (t) {
    case Boolean:
      a = e !== null;
      break;
    case Number:
      a = e === null ? null : Number(e);
      break;
    case Object:
    case Array:
      try {
        a = JSON.parse(e);
      } catch {
        a = null;
      }
  }
  return a;
} }, We = (e, t) => !co(e, t), Bi = { attribute: !0, type: String, converter: _a, reflect: !1, useDefault: !1, hasChanged: We };
Symbol.metadata ??= Symbol("metadata"), Va.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let ft = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ??= []).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, a = Bi) {
    if (a.state && (a.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((a = Object.create(a)).wrapped = !0), this.elementProperties.set(t, a), !a.noAccessor) {
      const i = Symbol(), o = this.getPropertyDescriptor(t, i, a);
      o !== void 0 && ho(this.prototype, t, o);
    }
  }
  static getPropertyDescriptor(t, a, i) {
    const { get: o, set: s } = mo(this.prototype, t) ?? { get() {
      return this[a];
    }, set(r) {
      this[a] = r;
    } };
    return { get: o, set(r) {
      const n = o?.call(this);
      s?.call(this, r), this.requestUpdate(t, n, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? Bi;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Lt("elementProperties"))) return;
    const t = Ko(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Lt("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Lt("properties"))) {
      const a = this.properties, i = [...uo(a), ...go(a)];
      for (const o of i) this.createProperty(o, a[o]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const a = litPropertyMetadata.get(t);
      if (a !== void 0) for (const [i, o] of a) this.elementProperties.set(i, o);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [a, i] of this.elementProperties) {
      const o = this._$Eu(a, i);
      o !== void 0 && this._$Eh.set(o, a);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const a = [];
    if (Array.isArray(t)) {
      const i = new Set(t.flat(1 / 0).reverse());
      for (const o of i) a.unshift(Zi(o));
    } else t !== void 0 && a.push(Zi(t));
    return a;
  }
  static _$Eu(t, a) {
    const i = a.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof t == "string" ? t.toLowerCase() : void 0;
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
    const t = /* @__PURE__ */ new Map(), a = this.constructor.elementProperties;
    for (const i of a.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return po(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t) => t.hostDisconnected?.());
  }
  attributeChangedCallback(t, a, i) {
    this._$AK(t, i);
  }
  _$ET(t, a) {
    const i = this.constructor.elementProperties.get(t), o = this.constructor._$Eu(t, i);
    if (o !== void 0 && i.reflect === !0) {
      const s = (i.converter?.toAttribute !== void 0 ? i.converter : _a).toAttribute(a, i.type);
      this._$Em = t, s == null ? this.removeAttribute(o) : this.setAttribute(o, s), this._$Em = null;
    }
  }
  _$AK(t, a) {
    const i = this.constructor, o = i._$Eh.get(t);
    if (o !== void 0 && this._$Em !== o) {
      const s = i.getPropertyOptions(o), r = typeof s.converter == "function" ? { fromAttribute: s.converter } : s.converter?.fromAttribute !== void 0 ? s.converter : _a;
      this._$Em = o;
      const n = r.fromAttribute(a, s.type);
      this[o] = n ?? this._$Ej?.get(o) ?? n, this._$Em = null;
    }
  }
  requestUpdate(t, a, i, o = !1, s) {
    if (t !== void 0) {
      const r = this.constructor;
      if (o === !1 && (s = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? We)(s, a) || i.useDefault && i.reflect && s === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
      this.C(t, a, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, a, { useDefault: i, reflect: o, wrapped: s }, r) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? a ?? this[t]), s !== !0 || r !== void 0) || (this._$AL.has(t) || (this.hasUpdated || i || (a = void 0), this._$AL.set(t, a)), o === !0 && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (a) {
      Promise.reject(a);
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
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [o, s] of i) {
        const { wrapped: r } = s, n = this[o];
        r !== !0 || this._$AL.has(o) || n === void 0 || this.C(o, void 0, s, n);
      }
    }
    let t = !1;
    const a = this._$AL;
    try {
      t = this.shouldUpdate(a), t ? (this.willUpdate(a), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(a)) : this._$EM();
    } catch (i) {
      throw t = !1, this._$EM(), i;
    }
    t && this._$AE(a);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    this._$EO?.forEach((a) => a.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
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
    this._$Eq &&= this._$Eq.forEach((a) => this._$ET(a, this[a])), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
ft.elementStyles = [], ft.shadowRootOptions = { mode: "open" }, ft[Lt("elementProperties")] = /* @__PURE__ */ new Map(), ft[Lt("finalized")] = /* @__PURE__ */ new Map(), Uo?.({ ReactiveElement: ft }), (Va.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ki = globalThis, Yi = (e) => e, ua = ki.trustedTypes, Ji = ua ? ua.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, Me = "$lit$", it = `lit$${Math.random().toFixed(9).slice(2)}$`, Ce = "?" + it, xo = `<${Ce}>`, ht = document, It = () => ht.createComment(""), Ot = (e) => e === null || typeof e != "object" && typeof e != "function", Fi = Array.isArray, bo = (e) => Fi(e) || typeof e?.[Symbol.iterator] == "function", za = `[ 	
\f\r]`, wt = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ii = /-->/g, Oi = />/g, st = RegExp(`>|${za}(?:([^\\s"'>=/]+)(${za}*=${za}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Di = /'/g, Xi = /"/g, je = /^(?:script|style|textarea|title)$/i, ze = (e) => (t, ...a) => ({ _$litType$: e, strings: t, values: a }), l = ze(1), g = ze(2), qt = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Pi = /* @__PURE__ */ new WeakMap(), pt = ht.createTreeWalker(ht, 129);
function Ge(e, t) {
  if (!Fi(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ji !== void 0 ? Ji.createHTML(t) : t;
}
const Ao = (e, t) => {
  const a = e.length - 1, i = [];
  let o, s = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", r = wt;
  for (let n = 0; n < a; n++) {
    const c = e[n];
    let p, d, h = -1, m = 0;
    for (; m < c.length && (r.lastIndex = m, d = r.exec(c), d !== null); ) m = r.lastIndex, r === wt ? d[1] === "!--" ? r = Ii : d[1] !== void 0 ? r = Oi : d[2] !== void 0 ? (je.test(d[2]) && (o = RegExp("</" + d[2], "g")), r = st) : d[3] !== void 0 && (r = st) : r === st ? d[0] === ">" ? (r = o ?? wt, h = -1) : d[1] === void 0 ? h = -2 : (h = r.lastIndex - d[2].length, p = d[1], r = d[3] === void 0 ? st : d[3] === '"' ? Xi : Di) : r === Xi || r === Di ? r = st : r === Ii || r === Oi ? r = wt : (r = st, o = void 0);
    const f = r === st && e[n + 1].startsWith("/>") ? " " : "";
    s += r === wt ? c + xo : h >= 0 ? (i.push(p), c.slice(0, h) + Me + c.slice(h) + it + f) : c + it + (h === -2 ? n : f);
  }
  return [Ge(e, s + (e[a] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), i];
};
class Dt {
  constructor({ strings: t, _$litType$: a }, i) {
    let o;
    this.parts = [];
    let s = 0, r = 0;
    const n = t.length - 1, c = this.parts, [p, d] = Ao(t, a);
    if (this.el = Dt.createElement(p, i), pt.currentNode = this.el.content, a === 2 || a === 3) {
      const h = this.el.content.firstChild;
      h.replaceWith(...h.childNodes);
    }
    for (; (o = pt.nextNode()) !== null && c.length < n; ) {
      if (o.nodeType === 1) {
        if (o.hasAttributes()) for (const h of o.getAttributeNames()) if (h.endsWith(Me)) {
          const m = d[r++], f = o.getAttribute(h).split(it), x = /([.?@])?(.*)/.exec(m);
          c.push({ type: 1, index: s, name: x[2], strings: f, ctor: x[1] === "." ? ko : x[1] === "?" ? Fo : x[1] === "@" ? yo : Na }), o.removeAttribute(h);
        } else h.startsWith(it) && (c.push({ type: 6, index: s }), o.removeAttribute(h));
        if (je.test(o.tagName)) {
          const h = o.textContent.split(it), m = h.length - 1;
          if (m > 0) {
            o.textContent = ua ? ua.emptyScript : "";
            for (let f = 0; f < m; f++) o.append(h[f], It()), pt.nextNode(), c.push({ type: 2, index: ++s });
            o.append(h[m], It());
          }
        }
      } else if (o.nodeType === 8) if (o.data === Ce) c.push({ type: 2, index: s });
      else {
        let h = -1;
        for (; (h = o.data.indexOf(it, h + 1)) !== -1; ) c.push({ type: 7, index: s }), h += it.length - 1;
      }
      s++;
    }
  }
  static createElement(t, a) {
    const i = ht.createElement("template");
    return i.innerHTML = t, i;
  }
}
function kt(e, t, a = e, i) {
  if (t === qt) return t;
  let o = i !== void 0 ? a._$Co?.[i] : a._$Cl;
  const s = Ot(t) ? void 0 : t._$litDirective$;
  return o?.constructor !== s && (o?._$AO?.(!1), s === void 0 ? o = void 0 : (o = new s(e), o._$AT(e, a, i)), i !== void 0 ? (a._$Co ??= [])[i] = o : a._$Cl = o), o !== void 0 && (t = kt(e, o._$AS(e, t.values), o, i)), t;
}
class qo {
  constructor(t, a) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = a;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: a }, parts: i } = this._$AD, o = (t?.creationScope ?? ht).importNode(a, !0);
    pt.currentNode = o;
    let s = pt.nextNode(), r = 0, n = 0, c = i[0];
    for (; c !== void 0; ) {
      if (r === c.index) {
        let p;
        c.type === 2 ? p = new _t(s, s.nextSibling, this, t) : c.type === 1 ? p = new c.ctor(s, c.name, c.strings, this, t) : c.type === 6 && (p = new Ro(s, this, t)), this._$AV.push(p), c = i[++n];
      }
      r !== c?.index && (s = pt.nextNode(), r++);
    }
    return pt.currentNode = ht, o;
  }
  p(t) {
    let a = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(t, i, a), a += i.strings.length - 2) : i._$AI(t[a])), a++;
  }
}
class _t {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t, a, i, o) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = t, this._$AB = a, this._$AM = i, this.options = o, this._$Cv = o?.isConnected ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const a = this._$AM;
    return a !== void 0 && t?.nodeType === 11 && (t = a.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, a = this) {
    t = kt(this, t, a), Ot(t) ? t === u || t == null || t === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : t !== this._$AH && t !== qt && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : bo(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== u && Ot(this._$AH) ? this._$AA.nextSibling.data = t : this.T(ht.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    const { values: a, _$litType$: i } = t, o = typeof i == "number" ? this._$AC(t) : (i.el === void 0 && (i.el = Dt.createElement(Ge(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === o) this._$AH.p(a);
    else {
      const s = new qo(o, this), r = s.u(this.options);
      s.p(a), this.T(r), this._$AH = s;
    }
  }
  _$AC(t) {
    let a = Pi.get(t.strings);
    return a === void 0 && Pi.set(t.strings, a = new Dt(t)), a;
  }
  k(t) {
    Fi(this._$AH) || (this._$AH = [], this._$AR());
    const a = this._$AH;
    let i, o = 0;
    for (const s of t) o === a.length ? a.push(i = new _t(this.O(It()), this.O(It()), this, this.options)) : i = a[o], i._$AI(s), o++;
    o < a.length && (this._$AR(i && i._$AB.nextSibling, o), a.length = o);
  }
  _$AR(t = this._$AA.nextSibling, a) {
    for (this._$AP?.(!1, !0, a); t !== this._$AB; ) {
      const i = Yi(t).nextSibling;
      Yi(t).remove(), t = i;
    }
  }
  setConnected(t) {
    this._$AM === void 0 && (this._$Cv = t, this._$AP?.(t));
  }
}
class Na {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, a, i, o, s) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = t, this.name = a, this._$AM = o, this.options = s, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = u;
  }
  _$AI(t, a = this, i, o) {
    const s = this.strings;
    let r = !1;
    if (s === void 0) t = kt(this, t, a, 0), r = !Ot(t) || t !== this._$AH && t !== qt, r && (this._$AH = t);
    else {
      const n = t;
      let c, p;
      for (t = s[0], c = 0; c < s.length - 1; c++) p = kt(this, n[i + c], a, c), p === qt && (p = this._$AH[c]), r ||= !Ot(p) || p !== this._$AH[c], p === u ? t = u : t !== u && (t += (p ?? "") + s[c + 1]), this._$AH[c] = p;
    }
    r && !o && this.j(t);
  }
  j(t) {
    t === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class ko extends Na {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === u ? void 0 : t;
  }
}
class Fo extends Na {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== u);
  }
}
class yo extends Na {
  constructor(t, a, i, o, s) {
    super(t, a, i, o, s), this.type = 5;
  }
  _$AI(t, a = this) {
    if ((t = kt(this, t, a, 0) ?? u) === qt) return;
    const i = this._$AH, o = t === u && i !== u || t.capture !== i.capture || t.once !== i.once || t.passive !== i.passive, s = t !== u && (i === u || o);
    o && this.element.removeEventListener(this.name, this, i), s && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Ro {
  constructor(t, a, i) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = a, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    kt(this, t);
  }
}
const So = ki.litHtmlPolyfillSupport;
So?.(Dt, _t), (ki.litHtmlVersions ??= []).push("3.3.3");
const wo = (e, t, a) => {
  const i = a?.renderBefore ?? t;
  let o = i._$litPart$;
  if (o === void 0) {
    const s = a?.renderBefore ?? null;
    i._$litPart$ = o = new _t(t.insertBefore(It(), s), s, void 0, a ?? {});
  }
  return o._$AI(e), o;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const yi = globalThis;
let j = class extends ft {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t.firstChild, t;
  }
  update(t) {
    const a = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = wo(a, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return qt;
  }
};
j._$litElement$ = !0, j.finalized = !0, yi.litElementHydrateSupport?.({ LitElement: j });
const vo = yi.litElementPolyfillSupport;
vo?.({ LitElement: j });
(yi.litElementVersions ??= []).push("4.2.2");
const Vo = "data:image/jpeg;base64,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5zS82jzazvtFH2j3o5Q5zS82jzfes77R70faPejlHzml53vSiasz7R70v2j3pcoc5p+dSiasz7R70ouKOUfOannClE/vWX9opftHvS5BqZq+f70vn1lfafej7RS5B+0NXz6X7QKyftPvR9p96OQftDW+0UfaKyftXvSfavejkD2hr/aKPtFZH2r3pPtXvRyB7Q1/Po+0e9ZH2r3pPtNHIL2hrm4pPtHvWT9po+00+QPaGr5/vR5/vWV9ppPtNHIL2hq+f70Cf3rK+00faaOQPaGt5/vSif3rJ+00fafelyDVQ2RPT1uPesUXXvTxde9JwKVQ3FuKkW496wluvepFu/eocC1UN1bj3qRbisNbv3qRbv3qXTNFUNxbj3qQXHvWGt171It171DplqobYnp4nHrWKt171It171LgWqhsib3p4mrHW596kFz71PIUpmsJqeJayhc+9SC4qeQtTNMS0okrOE/vTxP70uUfOaHmUvmVQ873pwm96XKPmL3mUeZVHzqXzqOUfMXfMo8yqXnUnnUcocxd8yk8yqZm96b53vRyi5i4ZPekMtUTP700z0+UXOXTLTTNVE3FRm596agJzL5mppm96zjc+9Rtc+9UoEOoaRnHrTDPWY1171G1171SgS6hqG496jNx71lm696jN171SgQ6hqm496Ybj3rJN170w3fvVKmQ6hrG496Ybj3rIN370w3fvVezJdU2Dc+9Ibn3rHN37037X71Xsyfamz9p96T7R71jfa/ej7X70ezF7U2ftHvR9o96xvtXvR9r96PZh7U2ftHvR9o96xvtY9aPtXvT9mHtTZ+0e9H2isX7X70fa/ej2Ye0Nn7TSfaPesf7X70n2v3o9mL2psfafekNz71jm796T7V70/Zh7Q1/tHvSG496yPtXvSG696PZk+0NY3FNNx71lfavemm6p8gvaGsbj3ppn96yjde9J9q9xT5Be0NTz6Qz1l/avek+0+9PkFzmp59J53vWZ9p96PtPvT5Bc5peb70eb71m/aPej7RRyC5zR82jzazvtAo+0D1p8oc5pebR5tZv2getH2getLlDnNLzaPNrN+0D1o+0D1o5Q5zS82k82s77QPWj7QPWjlDnNHzaPNrO+0D1pPtFPlDnNLzaPNrN+0e9J9o96OUOc0/No82sz7T70fafejlDnNPzaPNrM+0+9H2n3o5Q5zUE3vThP71lC596X7T70uQfOawnpwn96yBc+9OFz70uQambAuPeni496xhde9OF171PIUqhtC496kFx71hi696eLr3qeQtVDbFx708XPvWGLv3pwu/el7MpVTcFx7077RWGLv3p32v3qfZle1NsXPvS/afesT7X70ou/el7MftTb+0+9L9prF+1+9H2v3o9mP2pt/afej7SPWsX7X70fa/el7MftTb+0UfaKxftfvR9r96PZh7U2vtFH2isX7X70fa/ej2Ye1Nr7RR9orF+1+9H2v3o9mHtTa+0Un2getY32v3pPtfvR7MPam19p96Q3PvWN9r96T7X70ezF7U2ftPvSG596xjd+9N+1+9P2Ye1Nk3PvTTc1jm796abv3p+zJ9qbBufemm496yDd+9NN371SpkuoaxuPemm496yTde9MN170/ZkuoaxuPemGeso3XvSG596pQJdQ0zP700z1mfaaT7TT5CXM0jPTTN71nfaPej7R70+QnnNDzaPNrO+0e9J9o96fKHOaPm+9Hme9Z32j3o8/wB6OUXOaPme9J5tZ/n+9J549aOUOY0fNo82s77QPWj7QPWjlDnMn7V70faqw/tdL9r966uQ5PaG59p96PtXvWJ9r96PtdHIHtDc+1Ufah61ifa/el+1+9HIHtDb+0+9H2r3rE+1+9L9r96XIHtDb+00ouaw/tfvS/avejkH7Q3PtPvR9p96xPtXvS/a/ejkD2ht/avek+1e9Yv2v3pPtfvRyB7Q2/tXvSfa/esQ3fvSfa/ej2Ye0Ns3fvSfa/esM3fvSG896PZh7U3PtfvSfa/esI3nvSfa/en7MXtTe+1+9H2v3rB+1+9H2v3o9mHtTe+1j1o+1j1rB+1+9L9r96PZh7Q3ftXvS/avesL7X70fa/ej2Ye0Nz7V70favesP7X70fa/ej2Ye0Nz7VS/a/esL7X70fa/ej2Ye1N77X704XnvXP/bPel+2e9L2Y1VOhF571ILz3rmxe+9OF770nTKVU6Vbz3qRbz3rmhe+9PF771LpFqsdOt571It571zC3vvUq3vvUOkaKsdOt571Kt571zC3vvUy3vvUOkWqx0y3nvUq3fvXNLe+9Sre+9Q6Roqp0q3fvUq3XvXNre+9Sree9Q6ZaqnRi696kF171zq3nvUovPepdMtVTfF1704XNYIvPenC896n2ZXtTe+0+9H2msP7YPWl+2e9Hsx+1Nv7TR9p96xPtnvSfbPej2Ye1No3PvTTde9YpvPemG896fsxe1No3XvTDde9YpvPeomvfemqZLqm01171G1371ite+9Qte+9WqZDqm21371E1571iNe+9Qte+9UqRm6puNee9RNee9YbXvvUTXvvVqkQ6xutee9RNee9YTXvvUTXvvVqkQ6xvG896jN571gte+9Rm996pUjN1TeN57003nvWAb33ppvfeqVIn2xvm896abz3FYBvfem/bfen7Mn2p0H2z3o+2e9c/wDbfej7b70/Zh7U6D7Z70fbPeuf+2+9H233o9mL2p0H2z3o+2e9c/8Abfej7b70ezD2p0H2z3o+2e9c99t9zR9t96PZh7U6A3nvSfbPeuf+2+9H233o9mHtToPtnvR9s965/wC2e9H2z3p+zD2pv/a/ekN371gfbPf9aPtfvR7MXtTe+1+9J9rrB+2e9H2z3p+zD2pvfa/ek+1+9YX2z3pPtfvR7MXtDe+1+9H2v3rB+1+9L9s96PZh7Q3ftfvR9q96wvtdL9r96PZh7Q3PtXvR9q96xPtfvR9r96PZh7Q3PtXvR9q96xBde9L9q96OQPaG39q96PtXvWJ9q96X7VS5A9obf2r3o+1e9Yn2qj7VRyB7Q2vtXvR9q96xftXvSfavejkD2htfavej7V71i/aqT7X70+QPaG19q96PtXvWJ9r96Q3XvR7MPaG39q96PtXvWH9r96PtfvR7MXtDc+1+9H2v3rC+1+9H2v3p+zD2hu/a/ej7X7isL7X70fa/ej2Y/aG99r96X7X71gfa/el+2e9L2Ye0N8XfvSi7965/7Z70v2z3/Wl7MftToRee9OF571zv2z3pftvvS9mP2p0QvPenC8965z7b7077b70vZD9sdGL33pftvvXOfbfel+2+9HsivbHR/bfenfbfeub+2+9L9u96Xsh+2Oj+2+9L9t965v7b70v233peyD2x0n233o+2+9c59u96PtvvR7IftjpPtnvR9s965z7b70fbfej2Qe2Oj+2+9L9t965v7b70v20etL2Qe2Oj+2+9H233rnPtvvR9u96PZD9sdF9t96PtnvXO/bfek+2+9P2QvbHRfbfek+2+9c99t96T7b70eyD2x0P233pPtnvXPfbfek+2+9Hshe2OhN770hvPeueN770hvfen7IXtjoPtnvTTee9YH233pPtnvT9kL2pv/bPek+2e9YH233o+2e9P2Yvam99r96T7X71hfbPej7X70ezF7U3ftXvR9q96w/tfvR9q96fsxe0Nv7V70favesX7V70v2r3o5A9obP2r3o+1e9Y32r3o+1Ucge0Nn7T70fafesb7V70favejkD2hsfaaPtPvWN9q96PtVHIHtDZ+0+9H2qsX7VSfaqOQXtDB+1+9L9r96wftXvS/a/eu3kOH2hu/a/el+1+9YX2r3pRd+9Hsx+0N37XR9r96wvtfvS/avel7MPaG79r96X7X71hfa/el+1e9HIHtDd+1+9KLv3rCF17077V70uQftDc+1+9L9r96w/tXvR9q96OQPaG39r96PtfvWJ9q96PtXvRyB7Q2jd+9NN371jG696abr3p8ge0Nk3fvTTd+9Yxuvemm696OQXtDaN370n2usQ3XvSfaven7MXtDb+1+9H2v3rD+1e5pftXvR7MPaG59r96UXfvWF9q96X7V70ezD2hu/a/ej7X71h/afel+1e9HIP2ht/a/ej7X71ifavej7V70cge0Nv7X70n2v3rE+1e9Ibr3o9mL2ht/bPej7Z71h/avek+1+9Hsx+0N4XnvSi996wPtfvSi796Xsw9odCL33p4vfeucF3708XfvS9mUqp0gvfepFvfeuaF571It571LplKqdMt771Mt971y63nvUq3vvUukWqp1C33vUy33vXLLe+9TLe+9Q6Roqp1K33vUy33vXLLe+9Sre+9Q6RarHUrfe9SLfe9cut971It971Hsi1WOoF9708X3vXMC+96cL73peyKVY6b7d70v273rmhfe9L9u96Xsh+2Ok+3e9J9u965z7d70033vR7IPbHRm+96Yb73rnjfe9MN9701SF7Y6Br73qNr73rn2vveomvveqVIl1joGvveoWvvesBr73qJr33qlSIdY3mvveomvvesBr33qJr33q1SM3WN5r33qJr33rCa996ia896tUiHVN5r33qI3vvWEbz3phvPeqVMh1Tda996jN771hG796abv3qlTJ9qbhvfemm996wjd+9NN371Xsyfam8bz3pPtnvWCbv3o+1+9Hsxe0N37Z7/rR9s9/wBawftfvR9rNP2Ye0N77Z7/AK0fbPf9awftZ9aX7X70ezD2hu/bPf8AWj7Z7/rWF9r96PtfvR7MPaG7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3UzNGaLgP3UbqZmjNFwH7qN1MzRmi4x+6jdTM0ZouA/dRupmaM0XAfuo3UzNGaLgP3UbqZmjNFwH7qN1MzRmi4h+6jdTM0ZouA/dRupmaM0XGP3Um6m5ozRcB26jdTc0ZouA7dRupuaM0XAduo3U3NGaLgO3UbqbmjNFwHZozTc0maLgPzRmmUUrgPzRmmUUXAfmjNMoouA/NGaZRRcB+aM0yii4D80ZplFFwH5ozTKKLgPzRmmUUXAfmjNMoouAuaM0yigLD80ZplFFwsPzRmmUUXCw/NGaZRRcLD80ZplFFwsPzRmmUUXCw/NJmm0UXCw6im0UgsOoptFAWHUU2igdh1FNooCw6im0UBYdRTaKAsOoptFAWHUU2igVh1FNooCw6im0UBYdRTaKB2HUU2igLDqKbRQFh1FNooCw6im0UBYdRTaKAsOoptFAWHUZptFAWHZozTaKAsOzRmm0UBYdmjNNooCw7NGabRQFh2aM02igLDs0ZptFAWHZozTaKAsOzSZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAsLmjNJRQFhc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzRmkooAXNGaSigBc0ZpKKAFzSZoooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//2Q==", No = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwQDAwQEBAQFBQQFBwsHBwYGBw4KCggLEA4RERAOEA8SFBoWEhMYEw8QFh8XGBsbHR0dERYgIh8cIhocHRz/2wBDAQUFBQcGBw0HBw0cEhASHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBz/wAARCAMgBQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD6aooor40+wCiiigAooooAUClpM0uaACiiimK4uaWkApcUxXClxSgUuKLBcTFGKfijFOwrjcUYp2KXFFhXGYoxT8UmKLBcbijFOxS4osFxmKMU/FFFguNApcU4Clp2C4zFLj2p1FFguNxSYp9FFguMxSEU80lKwXI8UhFPIppFFh3G0macRTSKVh3EooopDQhFJS5oNIYlFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAKBS0maWgTCnimDrTxVCY8U8UwU8dapEseoqVRUaipVqkiGx4FSKKYoqUCtEjNscBUiimqKlAq0iGwAp4FAFOAqkiLiAUuKcBTsVVibjNtG2n4oxRYLjNtJipMUYosFyPFJipCKNtFh3I8UhFSFaTbSsO5FtpNtS4pMUrDuQlaaVqYrTStKw7kBFNK1MVphFS0UmQFaYRU5FMZahotMgIphFTkUwrUtFJkBFIRUpWmlalopMiIpMVIRTcUrDuMIpMU8iilYdxmKMU/FJiiwXGY9qCKfijFFh3I8UlSbaTFFguMop2KTFKw7iUhp2KQilYLjaKXFJRYdwoxRRQMTFJTs0mRSASiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAM0ZptFMVx2aM02igLjs0U2imIdRSDpSigLjhSgUlOAp2FcUCnAUlOFOwrhTqAKcFp2FcTFG2nhadtp2Fcj20bak20u2iwrkW2jbUu2k20WC5Hto21Jto20WC5HtpcU/bS4p2C4zbS7aeBS4osFxm2jbT8UuKLCuR7aTbUmKCKLDuQkU0ipsU0ilYLkRptSEUwilYq4wimkU8000rDuMpppxpD1pDEooptTYY7NGabRRYdx2aM02igLjs0ZptFAXHZozTaKAuOzRmm0UWC47NGabRRYLjs0ZptFFguOzRTaKdguOopMUYoC4tFGKMUCuFFGKTFAXFozSYpKLDuOzRmm0UrBcdmjNNoosFx2aM02iiwXHUopopR1piuPHWnCmDrTxTJH1ItRCpVqkiWSLUq1GtSqKtIhskWpVFRr1qZRWiRk2PUVIBTQKlUVokQ2KBTwKSngVSRFxMUuKcBTgKqxNxmPajbT8UuKLBcj20bakxRtosFyLFGKl20m2iwXI8UmPapNtG2lYLkWKTbUu2k20WHchK00rU+KaRSsUpEBWmFasFaYVqWilIrlaYVqyVphSpaKTKzLUZWrJSmFahotSK5WmlanK00pU2KUiuVpNtTlaTbS5SuYgK0m2pttG2lyhcg20bam20baLDuQbaNtTbaNtKwXIMUmKn2U0rRYdyLFIRUpWmlaVh3IsUhFSFaTFKwXI8UhFSEU3FKw7kdBGacRSEUWHcZRTqbSsO4UZoNNoAdmjNNopWHcdmjNNooC47NGabRQFx2aM02igLjs0ZptFAXHZozTaKLBcdmjNNoosFx2aM02iiwXHZozTaKLBcdmjNNoosFx2aM02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ooAXNGaSigBc0ZpKKAFzRmkozQBY3UbqZmkzQIfuozTM+9GaAH5pN1MzRmgB+73pM03NGaAHZozTM0UAPzSZ96bRmgB2aTNNzRmgY7NGabmjNADs0mabmigB1GabRQAuaM0lFAC5ozSUZoAM0UmaM0ALRSZozQAtFNzRQA6im0UAOzSZpKKAFzRmkooAXNJmiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAzS5pKKAFzRmkooAXNGaSigBc0uabRQA6im0UAOoptFADqKbmlzQAtFJmjNAC0UmaM0ALmlzTc0uaAFzRmkooAXNGaSigBc0uabRQA6im0UAOozTaKAH5ozTM0uaAHZozTc0ZoAdmjNNzRmgB+aM0zNGaAH5ozTM0ZoAfmkzTc0ZoAdmjNNzRmgB2aM03NGaAHZozTc0maAHZoptFADqKbRQA7NJmkooAXNGaSigBc0ZpKKAFzSZozSZoAWikzRmgBaKTNGaAFopM0ZoAWim5ooAdRTaKAHUZptFAC5ozSUUALmjNJRQAuaM0lFABmiiigAooooAKKKKACiiigCSjNNooAdmkzSUUALmjNJRQAuaTNGaTNAC0UmaM0ALRSZozQAtFNzRQA6jNNooAXNGaSigBc0ZpKKADNFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAGaXNJRQAuaM0lFAC5ozSUUALmlzTaKAHUU2igB1FNooAdRTaKAHUU2igB1FNooAdRTaKAHUZptFADs0maSigBc0ZpKKAFzRmkooAXNJmiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAXNGaSigBc0maKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD//2Q==", To = "data:image/jpeg;base64,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", Wo = "data:image/jpeg;base64,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0n2n3rIN17037V707FKJtC596etz71hC696et370WLUToUuferUd171zKXfvViO896LGsYnUxXXvVyK7965SO896tx3vvRym0YnVx3fvVpLsetcrHfe9WUvfelYtROpS7HrU63XvXMJe+9WEvfepsDR0q3PvUy3HvXPR3ee9WY7r3pNENG8s3vUyS5rFjuPerUc9SZtGqslSq9Z8cuasK9IVi4Gp4NVlepA1ILE+aXNRA07NAWH5ozTc0UXCw6jNNooCw7NGabmkzRcdh2aM00mm5ouKw/NOBqLdRuxRcdicNUitVUPUgemmNItK1Shqqq9SBqtMpIsbqazUzdTWaqTHYbIapymp3aqkpouS0U5jWdN3q/Maz5jSbMpIoy9apSVclqnJUNmDiV3qI1K9RGlcjlGnNJzSmkx9KVw5RKKKQ0XDlENJmg0wmncOUXdRvqMtTC9Fy1EsiSpklrO83FOWambRibMU3vV6Gf3rnkn96uRXHvVHRCJ08Fx05rTguenNcpBddOa04LrpzTOiMTq4bnpzV+K4965eC66c1oRXXvTNlE6JLn3qQXPvWGl171J9q96ZdjXNz71G11jvWU1171A93x1pMdjVe796ga8x3rHkvPeqz3vvUsLG41771Gb33rn2vveojf8AvUjsdJ9u96T7d71zJv8A3pPt/vSCx0/2/wB6Pt3vXMfb/ej7f70BY8p/tb/ao/tb/arhv7V96P7V967uQ57nc/2t/tUf2t/tVw39q/7VH9q/7VHIFzuf7W/2qP7W/wBquG/tX/ao/tX/AGqOQLnc/wBrf7VH9rf7VcN/av8AtUf2r/tUcgXO5/tb/ao/tb/arhv7U96P7U96OQLnc/2t/tUf2t/tVw/9qe9H9qf7VHIFzuP7W/2qP7W/2q4f+1P9qj+1P9qjkC53H9rf7VKNW/2q4b+1PelGqe9HKFzuhq3+1Uqar/tVwS6p/tVPHqn+1S5Qud/Hqn+1V2HU+nNefRan05rQt9Szjmnyhc9Cg1LOOa0oNQzjmuAttQzjmte2vs45osM7iK+6c1aW9965KC96c1dS796LAdCb33qGS996xjd8darTXmAeaLAak1/jPNZs+o4zzWZcXvXmsi5v8Z5osBszal15qhLqn+1XP3Go9eazJtS560uUDqH1T/aqBtV/2q5KTU/eq7an70cornYnVf8Aapv9q/7VcYdU96b/AGn70coXO0/tX/app1T3rjf7T96T+0vejlEdkdU96Q6n71x39pf7VJ/aP+1RygdgdT/2qT+0v9quQ/tH/ao/tH/ao5QOv/tL3pP7SPrXIf2j/tUf2h70corHX/2l70v9pe9cf/aP+1S/2j/tUcoWOv8A7S/2qcNS/wBquO/tH/apRqP+1RyjsdiNT/2qcNT9643+0f8AapRqXvRygdkNT96cNU964wal70v9pe9HKM7P+0/ej+1PeuN/tI+tKNS96XKM7P8AtP3o/tP3rjP7S96X+0j/AHqOUDsv7U/2qX+1P9quM/tI+tH9pH1o5QO0/tT3o/tP3ri/7SPrS/2l70coHaf2p/tUf2p/tVxf9pe9L/aR/vUcoHZ/2p70v9qf7X61xf8AaR/vUv8AaR9aOUZ2f9qf7X60o1T/AGq4v+0venDUT/eo5QO1XVP9qp01P/arh11H3qxHqHvRYDuotS6c1dh1H3rhYdQ6c1owX3TmiwHcQ3+cc1ejvM96423vc45rShu8jrRYLHTi696RrnPesVLrjrTjcZ70EuJcluOvNZtxcdeabLPx1rNuJ+vNBlKIy5uOvNZFxc9eafcz9eax7mfrzQZSgPmufeqcl171VmuOvNUpLj3pWMnA0Wuvem/aveslrj3pPtHvSsTyGx9q96cLr3rFFx704XHvSF7M2PtXvTTc+9ZP2ikNx70B7M1Tc+9Rm696yzce9MNx70D9mahuvemG696yzce9MNx70ylTNb7V708XXvWJ9o96UXHvTLVM3lu/epku/eueFz71Ktz70GigdIl571ZjvfeuYS696nS796VjVQOqS+96spfe9col371YS896RXKdZHfe9Wo733rk47z3q5Fd+9SxOJ1kV571ehus965OG7z3rSguunNSzNxOphuenNXoZ8965qC46c1pwT1m2ZuJ0EU2atxyViwzZxzV6KWobFymqklTK9Z8clTrJSuHKXQ9ODVVV6eHpXDkLG6l3VBvpd9Fx8hPupN1Q7/ejf70rj5CbdSbqiL0m+i4chKWppeoi9NL0cwchNvpN9QF6TzKfMHIWg9OV6qeZThJTUh8heV6kWSqKyVIslNSKUC6HpC9VhJQZKrmK5CR3qrK1OZ6rSPT5hOBBM1UJjVuVqoynNS5GTplSU1VkqzIaqvU8xk6ZA1RGpWqM1PMT7MYaSnGko5g9kIaaacaaaOYPZDGNRsae1RNRzD9kRsahZ6e5qu5qlI0VIGkpvm4qF2qIyVSkaxpF5Z/ep47j3rJEtSpNT5jeNM3obn3rSguunNczFPV+G46VXMbxpnUwXXvV+K6965iG46VoRXHvRzGigdEl170/wC1e9Yi3FP+0UcxfIar3XvVaS796z3ufeq0lz70uYOQvSXfvVOS896oS3PvVKW596XMPkNN7z3qFr33rIe596ga596XMHIbRvT6003p9awzdU03RpXHyG99t96PtvvWD9qNH2k0XDkPAv7RPrR/aJ9a5z7T70v2k+tetY86x0X9on1o/tE+tc79qPrR9q96LAdF/aJ9aP7RPrXO/afel+0+9FgOh/tD/apf7QPrXO/aTS/aj60WA6H+0D60f2h71z32o+tH2n3osFjof7Q96X+0D61z32k+tH2k0WCx0P8AaB9aX+0D61z32o+tH2k+tKwWOh/tA+tA1A+tc/8AaT60C5PrQOx0i359anjvz61zC3J9asR3J9aAsdZDfHjmtS2vTxzXGwXB4rVtZzxzSCx21reZxzW3a3fTmuKtJzxzW7aT9OaRVjr7e66c1fS64HNc1bze9aEc3FIdjXa6461WmuuvNVGm4qrPN1pBYW5u+DzWLdXnXmn3U3XmsS7mPPNO4WG3N515rKmvfeorqfrzWTPOeeaYrFyS+96rPfe9Zkk59arNP70BY2Dfe9J9u96xDPx1pPPPrQFjc+2+9L9tPrWH5/vR5/vQFjb+2+9H233rE8/3pfONAcptfbT60fbT61jedR51Acps/bT60v20+tYvnGl840g5TZ+2H1pftp9axvNPrR51Acps/bfelF4fWsbzj60omoHymz9s96X7b71i+dS+caQcptC996X7b71i+caXzjRcOU2ftp9aX7cfWsXzjTvNNFx8psfbT60v20+tY3mml800XDlNj7afWl+2n1rHEpo80+tK4cpsfbT60v20+tY/mn1pfMNFx8pr/bT60ovT61keafWjzD60XDlNj7YfWj7YfWsjzPel8w+tK4cprfbD604Xh9ayPMNOEhouPlNpLw+tWo7s+tYKSGrMUhouHKdHBd9Oa1Le66c1zEEh4rUtpDxSuPkOqtrrpzWtBcdOa5e2kPFbFvIeKnmHyG/HPx1qXz+KzIpDUwfijmDkJ5JutZ9xL15q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UrAS7qXdUO6l3UWAm3Ub6h3Uu6iwE26jdUO6jdRYCffRvqHdRupWApZozSZozWghaKTNGaAFopuaM0wHUU3NFADqKbRQA6im0UWAdSZpKKLALmjNJRRYBc0ZpKKLALmjNJRRYBc0ZpKKADNGaKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAzRmiigBc0ZpKKLALmjNJRRYB2aKbRRYB1FNooAdRTc0uaAFzS5puaM0gHZozTc0ZoAdmjNJmigB2aKbRQA6im0UAOzS5pmaXNADs0ZpuaM0AOzS7qZmjNAD91G6m0UAPzRuplFKwEm6jdUeaXNFgJN1G6o80ZosBLuo3VFmjNFgIqKKKoAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAM0uaSigBc0ZpKKLALmjNJRRYB2aKbRRYB1FNozQA6jNNzS5oAXNLmm5ozSAdmjNNzRmgB2aM0maKAG0UUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA//9k=", Mo = "data:image/jpeg;base64,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DtZSQw9CCQe1QmoaKTGGmmnGmmoZomMpppxptQ0aJjD1ph6080xqhotMYaYetPNMas2jVMaaYacaaahlpjTTD3pxppNQzRMYaTNKaaetQzRMaelJS5ppqGUmJSE8UHpSZqSkwptKTxSUmUmGaKQmjNIoXNWrfTdSutMu9SttPuprOz2farmOJmjt952pvYDC7jwM4yelU67Tw78UfFfhf4ba54H0qa1XS9Z3eeZIQ0ke9Qkmxu29AFO4HAGV2nmqjbqP0OMyKXNNoqSrj80ZpuaXNMdxc0uabRTHceDTs1HmlBp3GSUoNMzS5phckBpajB9KUGmmO5IDTgajzS1VxkgNODVEDTgadx3JAadmos0uapMdyUGlDVEGpwNO47kuaXNRZpd1O4yXJpd1RBqXdTuO5LuFGajzS596dwuSZ96XNRZNLuNO47km6l3VHuo3UXC5Jupd1R7hRkU7juSbqN31qPIoyKLhck3fWjd9ajyKMii4XJN31o3VHkUZFFwuSbqTdTMijcKLhcfuo3VHuo3UriuPzSZpm40ZNFwuPzSbhTM+9JmlcVx+6kyabuppalcLj80maZupM0riHlqaTTSfekLUriuOzTSaaTSZpXFccWppNITTSaVxXHE00mkpM1NxC0maQmmk0riuKTSE0maSpELmkzSE03NK4hSaTNJRSEFFJmkzQAuaM03NGaVxXPQaKKK+pPiAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACpba2uLy8htLSCW4uJnEcUMSl3kYnAVQOSSSAAKiooAvazo2qeH9eutF1qyls7+1fy5oJByp69RwQQQQRkEEEEgiqNS3NzcXl5Nd3c8txcTOZJZpWLvIxOSzE8kkkkk1FQvMbtfQKKKKLCCiiipHcKKKM0DCiiigBtd18N/hv/AMLD/t3/AIqbTNG/suyN3/prf6zryeRtiXHzyc7dy/Kc8cMaSpkm1ZMuDSd5K42inGm0BcQ9KSlNJSZSYhpppc0HpUspMaelNp3am1LLTGmm5xTz1phFSykxp6Uw0+mGoZomNNMNOPWmmoZomMNMNPNMPWs2aJjD1pppxpneoZomMNNNPNMPWs2aJjDTDTz1phqGWhppp6049aaa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TSSQUUUVbJEPSkpT0pKSGgooooYwoopCaQCHrQelFIelIpCUh60tNpMaENJQetIelSWhDTTzSmkqWUhDTD1pxNMPSoZohDTCacelMapZaGnrTWp1MJrNmqGnrTTS00moZohtdn4l8SeCdS+F3hzRNE8I/wBna5ZZ+3ajuH77jB5HMm9sP82PLxtXIJNcWaYxqb2NUNNNPSlPSmmsmaIaaYetOptSy0NJph6U41LZ2V5qWpW+nadaT3d5cyrDBbW8ZkkmkYhVRFHLMSQABySazZaK9NNX9Z0bWPD2szaPr+k32lajBt82zvoHgmj3KGXcjgEZVgRkcgg96zzUXvqapCUhGKWkPWkykNPSkpT1pp6VLKEoxRRSKExQRS0h60mNCUUUhpDsJRRRQAUUUUAFFFFABRRRQAVu+E/Bfizx3rc2j+DvD9/rV/Day3slvZRGRlijXczYH4KB1ZmVVBZlBwqntL690+4aewu57WVopIGkgkKMY5EaORCR/CyMysOhViDwTSd7aAQUUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoorc8VXXhS71qGXwfpOo6bYC0gSSG/uluHacRgSuGCrwWz9eSAgYRoAYdFFFABRRXqPjf4Nf8ACGfAbwX8Sv8AhNdE1P8A4SXd/wASu1b97BwW+VsnzNmNkvC+XIVT5s5pNpbgeXUUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPRqKKK+qPiQooooAKKKKACiiigAooooAKKKKANjw34bv/ABTq8unadPYwyx2012zXt0luhWJC7AM5AzgfhyThVZhj0UUh6WCiiimIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKTAQ9KSiimikFdn4i+F/ivwv8N9D8b6rDarpesbfJEcwaSPcpePevbegLDaTgDDbTxXGVan1PUrrTLTTrnULqazs9/wBltpJWaODedz7FJwu48nGMnrWcua6sVFxs7lWkNLSGqZIlIelLSHpUlDTSUppD0oKQ2kPSlpCallIaelIelKaaelQzRDTTTTjTD1qWWhCajJp7Uw9ahloaelManE0wmoZqjXudZ0+fwNY6HH4dsIL22upZ5NWRn8+4RwoEbAttwu09vTAUlzJiHrTjTDWbNUIetRtTyajPWoZohD1phpxNMNQzRDT0pppxppqGy0NPWuu+FfxBvPhZ8YNE8e2OnwahLpkrlrSdiiyxvG0Uihh91tkjYbBAOCQwGDyFIazmlJNPY0R6V8dvjHefG/4ox+LbrQ4NGit7GPT7ezjmM7LGjO5LyELuYvI54VQBtGCQWPmB606mnrWcYqK5Y7I0QU2lPSmmgpCUh6UtIakYlFFFBQHpTaU9KSkxoKQ9aWm0hhRRRQAUUUUAd58SfhD4y+FP9jf8JbBZp/a1uZofs04l8t12+ZC/T503pkjKncNrNg44OrmoatqurfZf7U1O8vvslulpbfaZml8iFM7Yk3E7UGThRwMmqdAIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPTvgNrPw00L4trffFSwhu9G+xypCbm1N1DDcHbteSIA7xtEij5WwzKcDG5cH4p6h4N1T4w69qHw/svsfhya4DWkQjMS/dUOyITlEZw7KvGFYDauNo4+incVtbhRRRSGFFFFABRRRQAUUUUAFFTWc8VtqNvczWcN5FFIrvbTlxHMAclGKMrBT0O1gcHgg81qeLta0/xH451XXdK8PWXh+yvLl5odLsixitlJ4Vc/mcBVyTtVFwoAMWiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD0aiiivqj4kKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA3fCfhPU/GeuTaVpVxpsE8VnPes2oXkdqhSGMyMAzkAnC/QDLMVRWZcKiikk7+Q9LBRRRTEFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAU2iigdgorWt9WsYfBt7osmg2U15cXMU8eqOz+dAqhgY1AO3ByO3rkMdhS/Z/D7xnqHgS48ZWegXMuiW+4vdgr0U4ZlTO5lXnLAEDa2T8rYlytuWot7anNUUUUEhSGlptA0FNPWnHpTaQxDTTSk5oqWWhtNpx602pZaEPWmnrSmmtUstDabTj0ph6VDKQhqM9ac1NqGaIa1MPWnE009KhmqGHvTT0pxNMNQzVDTTD1pxNMPSs2XEaelMPWnmmVDNUNPWmk0402oZaQ2mnpU9rbSXl9BZwtCsk0ixK00qxICxwCzuQqjnlmIA6kgVf8AFXh2+8I+M9S8M6nNaTXen3DW8slnMJomZT/Cw/UHDKchgrAgQaIx6bSmkqWWhD1pppx6001JYlNPWndqbUjQUUUUDENJRRUlCHpSUHrRQAUUUUAFFFFABRUq21y9lJeLbytbRusTzBCUR2DFVLdASEcgd9rehqKgAooooAKKKKACiiigAooooAKKKKACiiigAr0D4oeK/h/4o/4R/wD4QTwR/wAI19jsRDe/MD5z8YXj7+3Dfvmw8m/5gNorz+impWTQrBRRXQeHvD2lazoHiLUNQ8W6Zo0+l2S3VrZ3iSGTUnMip5UWxSA2GJ55zjgIJJI0M5+iiprRbV9QgS+mmgtWkUTSwRCV0TPzMqFlDEDJALKCeMjrQBDRWx4rt/Ddp411O28IajeajoUdwy2V3eQiKWWPPBZR+hwpIwSqE7Rj0AFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRXV6N8O/Ees6b4uu1+wae/hS1+1alaapeR2dwMTLCY0ikIZnDNgrjqAn33jR02luBTtPCGqXvw31LxtFc6YunadeQWM0Ml7Gtyzyq7KUhJ3MvyHtk/MVDCOQpgUUUwCiiigAooooAKKKKACiiigAooooAKKKKACiitXw14gvfCvi/TvEenRWkt3YTrcRJdwiWMsp7qf5jDA4KkEAhrzAyqKluriS7vpruVYlkmkaRlhiWJAScnaiAKo54VQAOgAFRUgCiiigAooooA//9k=", vt = { sea: Vo, sunset: No, reef: To, bush: Wo, space: Mo }, Xt = [
  { id: "sea", name: "Sea & Sun", tagline: "Bright beach day", bg: vt.sea, vars: { "--ink": "#0b2236", "--ink2": "#2c4a63", "--ink3": "#566e82", "--glass": "rgba(255,255,255,0.56)", "--glass-line": "rgba(255,255,255,0.78)", "--shadow": "0 12px 32px rgba(8,40,70,0.12)", "--chip": "rgba(255,255,255,0.74)", "--chip-strong": "rgba(255,255,255,0.94)", "--chip-soft": "rgba(255,255,255,0.36)", "--chip-faint": "rgba(255,255,255,0.14)", "--track": "rgba(11,34,54,0.13)", "--primary": "#0b5fa5", "--on-primary": "#ffffff", "--accent": "#c26a00", "--ok": "#0f8a5f", "--p-1": "#0b5fa5", "--p-2": "#c2410c", "--p-3": "#a16207", "--p-4": "#0f766e", "--p-5": "#be185d", "--p-family": "#475569", "--on-person": "#ffffff" } },
  { id: "sunset", name: "Cottesloe Sunset", tagline: "Warm and golden", bg: vt.sunset, vars: { "--ink": "#2b1408", "--ink2": "#5a3a26", "--ink3": "#765644", "--glass": "rgba(255,250,244,0.58)", "--glass-line": "rgba(255,255,255,0.75)", "--shadow": "0 12px 32px rgba(60,30,10,0.12)", "--chip": "rgba(255,255,255,0.72)", "--chip-strong": "rgba(255,255,255,0.92)", "--chip-soft": "rgba(255,255,255,0.34)", "--chip-faint": "rgba(255,255,255,0.12)", "--track": "rgba(43,20,8,0.13)", "--primary": "#9a3412", "--on-primary": "#ffffff", "--accent": "#b45309", "--ok": "#15803d", "--p-1": "#1d4ed8", "--p-2": "#be123c", "--p-3": "#b45309", "--p-4": "#15803d", "--p-5": "#7e22ce", "--p-family": "#57534e", "--on-person": "#ffffff" } },
  { id: "reef", name: "Coral Reef", tagline: "Under the sea", bg: vt.reef, vars: { "--ink": "#03252b", "--ink2": "#1d4a51", "--ink3": "#35636a", "--glass": "rgba(236,255,255,0.66)", "--glass-line": "rgba(255,255,255,0.6)", "--shadow": "0 12px 32px rgba(0,40,50,0.18)", "--chip": "rgba(255,255,255,0.72)", "--chip-strong": "rgba(255,255,255,0.94)", "--chip-soft": "rgba(255,255,255,0.34)", "--chip-faint": "rgba(255,255,255,0.12)", "--track": "rgba(3,37,43,0.14)", "--primary": "#0e7490", "--on-primary": "#ffffff", "--accent": "#ea580c", "--ok": "#047857", "--p-1": "#1e40af", "--p-2": "#be185d", "--p-3": "#c2410c", "--p-4": "#047857", "--p-5": "#7c3aed", "--p-family": "#475569", "--on-person": "#ffffff" } },
  { id: "bush", name: "Aussie Bush", tagline: "Gum trees and red dirt", bg: vt.bush, vars: { "--ink": "#1c2a12", "--ink2": "#3f4f30", "--ink3": "#5a6849", "--glass": "rgba(252,250,238,0.58)", "--glass-line": "rgba(255,255,255,0.7)", "--shadow": "0 12px 32px rgba(40,40,10,0.12)", "--chip": "rgba(255,255,250,0.74)", "--chip-strong": "rgba(255,255,250,0.94)", "--chip-soft": "rgba(255,255,250,0.36)", "--chip-faint": "rgba(255,255,250,0.14)", "--track": "rgba(28,42,18,0.13)", "--primary": "#3f6212", "--on-primary": "#ffffff", "--accent": "#b45309", "--ok": "#15803d", "--p-1": "#1d4ed8", "--p-2": "#9d174d", "--p-3": "#b45309", "--p-4": "#4d7c0f", "--p-5": "#6d28d9", "--p-family": "#57534e", "--on-person": "#ffffff" } },
  { id: "space", name: "Space Mission", tagline: "Dark mode – blast off", bg: vt.space, vars: { "--ink": "#f4f6ff", "--ink2": "#c9cdf0", "--ink3": "#a3a9d6", "--glass": "rgba(22,24,58,0.55)", "--glass-line": "rgba(255,255,255,0.14)", "--shadow": "0 12px 32px rgba(0,0,0,0.35)", "--chip": "rgba(255,255,255,0.12)", "--chip-strong": "rgba(255,255,255,0.22)", "--chip-soft": "rgba(255,255,255,0.07)", "--chip-faint": "rgba(255,255,255,0.03)", "--track": "rgba(255,255,255,0.18)", "--primary": "#ffd166", "--on-primary": "#1a1640", "--accent": "#ffd166", "--ok": "#4ade80", "--p-1": "#7aa2ff", "--p-2": "#ff8fab", "--p-3": "#ffb86b", "--p-4": "#6ee7b7", "--p-5": "#c4a1ff", "--p-family": "#cbd5e1", "--on-person": "#14123a" } }
], Co = { "--p-1": "#2563eb", "--p-2": "#db2777", "--p-3": "#0f766e", "--p-4": "#c2410c", "--p-5": "#7c3aed", "--on-person": "#ffffff" };
for (const e of Xt) Object.assign(e.vars, Co);
const $t = (e) => Xt.find((t) => t.id === e) ?? Xt[0], ta = (e) => Object.entries(e.vars).map(([t, a]) => `${t}:${a}`).join(";") + `;--bg:url(${e.bg})`, jo = import.meta.url, zo = () => {
  try {
    return new URL("fonts/", jo).href;
  } catch {
    return "fonts/";
  }
}, Go = {
  Inter: ["inter.woff2", "100 900"],
  "Bricolage Grotesque": ["bricolage-grotesque.woff2", "200 800"],
  Caveat: ["caveat.woff2", "400 700"],
  Fredoka: ["fredoka.woff2", "300 700"],
  Outfit: ["outfit.woff2", "100 900"]
}, Lo = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD", Ga = /* @__PURE__ */ new Set(), Le = (...e) => {
  if (typeof document > "u") return;
  let t = document.getElementById("family-hub-fonts");
  t || (t = document.createElement("style"), t.id = "family-hub-fonts", document.head.appendChild(t), Ga.clear());
  for (const a of e) {
    const i = Go[a];
    !i || Ga.has(a) || (Ga.add(a), t.appendChild(document.createTextNode(`@font-face{font-family:'${a}';font-style:normal;font-display:swap;font-weight:${i[1]};src:url(${zo()}${i[0]}) format('woff2');unicode-range:${Lo}}`)));
  }
}, Zo = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s+(?=\S)/u, Ze = (e) => {
  const t = e.description ?? "", a = /\+(\d+)/.exec(t) ?? /^(\d+)$/.exec(t.trim()), i = a ? Number(a[1]) : 0, o = /@grow/.test(t) ? "grow" : /@routine/.test(t) ? "routine" : /@job/.test(t) || i ? "job" : "routine", s = /@am/.test(t) ? "am" : /@after/.test(t) ? "after" : /@bed/.test(t) ? "bed" : "any", r = /(\d+)\s*min/i.exec(`${e.summary} ${t}`), n = Zo.exec(e.summary), c = /@icon[:=]\s*(\S+)/.exec(t);
  return { ...e, summary: n ? e.summary.slice(n[0].length) : e.summary, pic: c?.[1] ?? n?.[1], song: /@song/.test(t), lane: o, slot: s, pts: o === "grow" ? 0 : i, minutes: r ? Number(r[1]) : 0 };
}, I = (e) => {
  const [t, a] = e.split(":").map(Number);
  return t * 60 + (a || 0);
}, ut = (e = /* @__PURE__ */ new Date()) => e.getHours() * 60 + e.getMinutes(), Hi = (e = "20:00", t = /* @__PURE__ */ new Date()) => {
  const a = ut(t);
  return a < 720 ? "am" : a >= I(e) - 60 ? "bed" : "after";
}, Zt = (e, t = /* @__PURE__ */ new Date()) => {
  const a = I(e ?? "20:00") + ([5, 6].includes(t.getDay()) ? 30 : 0);
  return `${Math.floor(a / 60)}:${String(a % 60).padStart(2, "0")}`;
}, jt = (e, t = /* @__PURE__ */ new Date()) => {
  const a = ut(t), i = I(Zt(e, t));
  return a >= i - 60 || a < 300;
}, Ri = (e, t, a) => {
  if (!e || !t) return !0;
  for (const i of a) if (e.states[i] !== t.states[i]) return !0;
  return !1;
}, Qt = (e) => {
  const t = {}, a = [...new Set(e.filter(Boolean))];
  for (const i of a) {
    let o = 1;
    for (; o < Math.min(3, i.length) && a.some((s) => s !== i && s.slice(0, o).toLowerCase() === i.slice(0, o).toLowerCase()); ) o++;
    t[i] = i[0].toUpperCase() + i.slice(1, o).toLowerCase();
  }
  return t;
};
let Ea = "wide";
const $a = /* @__PURE__ */ new Set(), D = () => Ea, Qo = (e) => {
  e !== Ea && (Ea = e, $a.forEach((t) => t()));
}, Bo = (e) => ($a.add(e), () => $a.delete(e)), Yo = (e, t = 3) => {
  const a = e;
  a.removeAttribute("data-fit");
  for (let i = 1; i <= t && (a.scrollHeight > a.clientHeight + 2 || a.scrollWidth > a.clientWidth + 2); i++) a.setAttribute("data-fit", String(i));
};
class yt {
  constructor(t) {
    this.host = t, t.addController(this);
  }
  hostConnected() {
    typeof ResizeObserver < "u" && (this._ro = new ResizeObserver(() => this.run()), this._ro.observe(this.host));
  }
  hostDisconnected() {
    this._ro?.disconnect();
  }
  hostUpdated() {
    this.run();
  }
  run() {
    const t = this.host.renderRoot;
    t?.querySelectorAll && (t.querySelectorAll("[data-fits]").forEach((a) => Yo(a)), t.querySelectorAll(".scrolly").forEach(Z));
  }
}
const Z = (e) => {
  const t = e instanceof Event ? e.currentTarget : e;
  t && t.toggleAttribute("data-more", t.scrollHeight - t.scrollTop - t.clientHeight > 6);
}, da = (e) => `${e.getFullYear()}-${String(e.getMonth() + 1).padStart(2, "0")}-${String(e.getDate()).padStart(2, "0")}`, _i = (e, t = [], a = []) => {
  const i = e.getDay();
  if (i === 0 || i === 6) return !1;
  const o = da(e);
  return a.includes(o) ? !1 : !t.length || t.some(([s, r]) => o >= s && o <= r);
}, ha = (e = /* @__PURE__ */ new Date(), t = "19:30", a = "07:00") => {
  const i = ut(e), o = I(t), s = I(a);
  return o <= s ? i >= o && i < s : i >= o || i < s;
};
let Vt = null, Si = !1, ti = 1;
const Jo = (e) => {
  ti = Math.max(0, Math.min(1, e));
}, Io = (e) => {
  Si = e;
}, Oo = () => {
  if (Si) return null;
  try {
    return Vt = Vt ?? new (window.AudioContext || window.webkitAudioContext)(), Vt.state === "suspended" && Vt.resume(), Vt;
  } catch {
    return null;
  }
}, W = (e, t, a, i = "sine", o = 0.18, s, r = !1) => {
  if (!r) {
    if (ti <= 0) return;
    o *= ti;
  }
  const n = Oo();
  if (!n) return;
  const c = n.createOscillator(), p = n.createGain();
  c.type = i, c.frequency.setValueAtTime(e, n.currentTime + t), s && c.frequency.exponentialRampToValueAtTime(s, n.currentTime + t + a), p.gain.setValueAtTime(1e-4, n.currentTime + t), p.gain.exponentialRampToValueAtTime(o, n.currentTime + t + 0.015), p.gain.exponentialRampToValueAtTime(1e-4, n.currentTime + t + a), c.connect(p).connect(n.destination), c.start(n.currentTime + t), c.stop(n.currentTime + t + a + 0.05);
}, N = (e) => {
  switch (e) {
    case "tap":
      W(660, 0, 0.06, "triangle", 0.08);
      break;
    case "tick":
      W(880, 0, 0.09, "triangle", 0.14), W(1320, 0.07, 0.14, "triangle", 0.12);
      break;
    case "untick":
      W(520, 0, 0.12, "sine", 0.08, 380);
      break;
    case "coin":
      W(988, 0, 0.08, "square", 0.06), W(1319, 0.08, 0.2, "square", 0.06);
      break;
    case "locked":
      W(180, 0, 0.18, "sawtooth", 0.06, 120);
      break;
    case "jar":
      W(1200, 0, 0.05, "sine", 0.12), W(1600, 0.05, 0.08, "sine", 0.1), W(2100, 0.11, 0.12, "sine", 0.07);
      break;
    case "done":
      [523, 659, 784, 1047].forEach((t, a) => W(t, a * 0.11, 0.3, "triangle", 0.13));
      break;
    case "unlock":
      [392, 523, 659, 784, 1047, 1319].forEach((t, a) => W(t, a * 0.09, 0.35, "triangle", 0.12)), W(1568, 0.6, 0.6, "sine", 0.1);
      break;
    case "alarm":
      for (let t = 0; t < 6; t++)
        W(1046, t * 0.5, 0.18, "square", 0.12, void 0, !0), W(1318, t * 0.5 + 0.2, 0.18, "square", 0.12, void 0, !0);
      break;
    case "clarinet":
      [587, 698, 880].forEach((t, a) => W(t, a * 0.16, 0.3, "square", 0.05));
      break;
    case "trumpet":
      [523, 523, 784].forEach((t, a) => W(t, a * 0.14, a === 2 ? 0.5 : 0.12, "sawtooth", 0.07));
      break;
    case "roar":
      W(140, 0, 0.6, "sawtooth", 0.12, 70), W(210, 0.05, 0.5, "square", 0.05, 90);
      break;
  }
};
let Kt;
const z = (e) => {
  if (!(Si || !("speechSynthesis" in window)))
    try {
      if (Kt === void 0) {
        const a = speechSynthesis.getVoices();
        Kt = a.find((i) => i.lang === "en-AU") ?? a.find((i) => i.lang.startsWith("en-GB")) ?? a.find((i) => i.lang.startsWith("en")) ?? null, a.length || (Kt = void 0);
      }
      speechSynthesis.cancel();
      const t = new SpeechSynthesisUtterance(e);
      Kt && (t.voice = Kt), t.lang = Kt?.lang ?? "en-AU", t.rate = 0.95, t.pitch = 1.1, speechSynthesis.speak(t);
    } catch {
    }
}, La = (e) => {
  const t = e?.states["input_text.fh_panel_message"]?.state;
  if (!t || !t.startsWith("{")) return null;
  try {
    const a = JSON.parse(t);
    return a.ts && a.ttl && Date.now() / 1e3 > a.ts + a.ttl ? null : a;
  } catch {
    return null;
  }
}, ai = (e) => `family-hub-kid-${e.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`, Ei = (e) => {
  const t = { look: e.look_id ?? "panel", font: e.font ?? "print", calm: e.calm ?? !0, sound: e.sound_level ?? "full", focus: e.focus ?? e.mode !== "text" };
  try {
    return { ...t, ...JSON.parse(localStorage.getItem(ai(e.name)) || "{}") };
  } catch {
    return t;
  }
}, Do = (e, t) => {
  try {
    localStorage.setItem(ai(e), JSON.stringify({ ...JSON.parse(localStorage.getItem(ai(e)) || "{}"), ...t }));
  } catch {
  }
}, Qe = {
  // shared building blocks: styled once per look, wherever they appear
  roles: [
    "fh",
    "glass",
    "card",
    "sheet",
    "scrim",
    "toast",
    "label",
    "muted",
    "display",
    "pill",
    "round",
    "primary",
    "quick",
    "avatar",
    "row",
    "check",
    "content",
    "done",
    "now",
    "big",
    "past",
    "next",
    "meter",
    "tab",
    "tabs",
    "field",
    "key",
    "today",
    "away",
    "playing",
    "on",
    "hot",
    "i"
  ],
  // named regions, by the component that owns them
  parts: {
    "family-hub-card": [
      "clock",
      "hm",
      "cap",
      "weather",
      "badge",
      "presence",
      "right",
      "planner",
      "seg",
      "legend",
      "week",
      "col",
      "dayhead",
      "num",
      "ev",
      "t",
      "w",
      "more",
      "cell",
      "out",
      "dayrow",
      "np",
      "np-row",
      "art",
      "timerrow",
      "hint",
      "rem",
      "dock",
      "item",
      "kidbtn",
      "sep",
      "tcard",
      // drawings a look adds through art
      "aclock",
      "dial",
      "nowdot",
      "tface",
      "dayview",
      "dayart",
      "ddial",
      "night",
      "nart"
    ],
    "fh-kid": ["hero", "name", "rank", "stat", "dots", "g", "t", "nextup", "jobs", "sec", "plus", "play", "later", "side", "rw", "n", "save", "pic", "wk"],
    "fh-groceries": ["list", "items", "tag", "who"],
    "fh-music": [
      "stage",
      "deck",
      "spk",
      "focus",
      "inmix",
      "join",
      "hit",
      "st",
      "pickrow",
      "banner",
      "mini",
      "tog",
      "mroom",
      "mzone",
      "mstairs",
      "pool",
      "puck",
      "mshelf",
      "wholeh",
      // other ways of seeing the rooms (musicviews.ts)
      "viewbtn",
      "vcard",
      "dplate",
      "dtrack",
      "dknob",
      "dcover",
      "desk",
      "strip",
      "sname",
      "lamp",
      "fcap",
      "slot",
      "cab",
      "sock",
      "cdisc",
      "cbox",
      "ttable",
      "tkey",
      "ctab",
      "jog",
      "mpad",
      "dart",
      "sshelf",
      "dcard",
      "tuner",
      "vscene",
      "aname",
      "ahull",
      "aline",
      "bigdial",
      "rig"
    ],
    "fh-home": ["room", "lit", "rh", "dev", "dicon", "toggle", "scene"],
    "fh-doodle": ["easel", "pad", "ink", "gallery", "snaps", "snap", "by"],
    "fh-studio": ["mirror", "tile"],
    "fh-morning": ["board", "kcol", "khead", "nextstep", "set", "lchip", "soon", "leave"]
  }
}, $i = "family-hub-look", te = "family-hub-look-options", ae = (e, t = 62) => {
  const a = e.getHours() % 12 * 30 + e.getMinutes() * 0.5, i = e.getMinutes() * 6;
  return l`<svg class="aclock" aria-hidden="true" width=${t} height=${t} viewBox="0 0 116 116">${g`
    <circle cx="58" cy="58" r="53" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"></circle>
    ${Array.from({ length: 12 }, (o, s) => g`<rect x="56.5" y="11" width="3" height=${s % 3 ? 6 : 11} fill="var(--ink)" transform="rotate(${s * 30} 58 58)"></rect>`)}
    <rect x="55" y="30" width="6" height="30" rx="3" fill="var(--ink)" transform="rotate(${a} 58 58)"></rect>
    <rect x="56.25" y="17" width="3.5" height="43" rx="1.75" fill="var(--ink)" transform="rotate(${i} 58 58)"></rect>
    <circle cx="58" cy="58" r="4.5" fill="var(--danger)"></circle>`}</svg>`;
}, ie = (e, t, a = 76) => {
  const o = 2 * Math.PI * 43, s = t.getTime(), r = s + 12 * 36e5, n = (h) => {
    const m = new Date(h);
    return (m.getHours() % 12 + m.getMinutes() / 60) * 30;
  }, c = e.filter((h) => !h.allDay && h.end.getTime() > s && h.start.getTime() < r), p = t.getHours() % 12 * 30 + t.getMinutes() * 0.5, d = t.getMinutes() * 6;
  return l`<svg class="dial" aria-hidden="true" width=${a} height=${a} viewBox="0 0 100 100" fill="none">${g`
    <circle cx="50" cy="50" r=${43} stroke="var(--track)" stroke-width="8"></circle>
    ${c.map((h) => {
    const m = Math.max(h.start.getTime(), s), f = Math.min(h.end.getTime(), r), x = Math.max(8, (f - m) / 36e5 * 30);
    return g`<circle cx="50" cy="50" r=${43} stroke=${h.colour} stroke-width="8" stroke-dasharray="${x / 360 * o} ${o}" transform="rotate(${n(m) - 90} 50 50)"></circle>`;
  })}
    ${[0, 3, 6, 9].map((h) => g`<rect x="49" y="13" width="2" height="6" rx="1" fill="var(--ink2)" transform="rotate(${h * 30} 50 50)"></rect>`)}
    <rect x="48" y="27" width="4" height="25" rx="2" fill="var(--ink)" transform="rotate(${p} 50 50)"></rect>
    <rect x="48.75" y="17" width="2.5" height="35" rx="1.25" fill="var(--ink)" transform="rotate(${d} 50 50)"></rect>
    <circle class="nowdot" cx="50" cy="50" r="3.5" fill="var(--accent)"></circle>`}</svg>`;
}, Xo = (e, t, a = 360) => {
  const i = (h) => 2 * Math.PI * h, r = (h) => h.getHours() + h.getMinutes() / 60, n = (h, m, f, x) => {
    const K = Math.max(f, r(h.start)), A = Math.min(x, h.end.getDate() !== h.start.getDate() ? 24 : r(h.end));
    if (A <= K && !(r(h.start) >= f && r(h.start) < x)) return u;
    const U = Math.max(7, (Math.max(A, K) - K) * 30);
    return g`<circle cx="100" cy="100" r=${m} stroke=${h.colour} stroke-width="15" stroke-dasharray="${U / 360 * i(m)} ${i(m)}" transform="rotate(${K % 12 * 30 - 90} 100 100)"></circle>`;
  }, c = e.filter((h) => !h.allDay), p = t ? t.getHours() % 12 * 30 + t.getMinutes() * 0.5 : 0, d = t ? t.getMinutes() * 6 : 0;
  return l`<svg class="ddial" role="img" aria-label="The day as a clock: mornings on the inner ring, afternoons and evenings on the outer ring" width=${a} height=${a} viewBox="0 0 200 200" fill="none">${g`
    <circle cx="100" cy="100" r=${84} stroke="var(--track)" stroke-width="15" opacity=".55"></circle>
    <circle cx="100" cy="100" r=${62} stroke="var(--track)" stroke-width="15" opacity=".55"></circle>
    ${c.map((h) => n(h, 62, 0, 12))}${c.map((h) => n(h, 84, 12, 24))}
    ${Array.from({ length: 12 }, (h, m) => g`<rect x="99.4" y="6" width="1.2" height=${m % 3 ? 4 : 0} fill="var(--ink3)" transform="rotate(${m * 30} 100 100)"></rect>`)}
    ${[[12, 100, 13], [3, 190.5, 103.5], [6, 100, 194], [9, 9.5, 103.5]].map(([h, m, f]) => g`<text x=${m} y=${f} text-anchor="middle" font-size="9" font-weight="600" fill="var(--ink2)">${h}</text>`)}
    <text x="100" y="41.5" text-anchor="middle" font-size="7" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">AM</text>
    <text x="100" y="19.5" text-anchor="middle" font-size="7" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">PM</text>
    ${t ? g`<rect x="97.5" y="66" width="5" height="36" rx="2.5" fill="var(--ink)" transform="rotate(${p} 100 100)"></rect>
      <rect x="98.4" y="52" width="3.2" height="50" rx="1.6" fill="var(--ink)" transform="rotate(${d} 100 100)"></rect>
      <circle cx="100" cy=${100 - (t.getHours() < 12 ? 62 : 84)} r="5" fill="var(--accent)" stroke="var(--ground, #000)" stroke-width="2" transform="rotate(${p} 100 100)"></circle>
      <circle cx="100" cy="100" r="4.5" fill="var(--accent)"></circle>` : g`<circle cx="100" cy="100" r="3" fill="var(--ink3)"></circle>`}`}</svg>`;
}, Po = (e, t, a = 230) => l`
  <svg class="vinyl" aria-hidden="true" width=${a} height=${a} viewBox="0 0 200 200">${g`
    <rect x="4" y="4" width="192" height="192" rx="12" fill="#d9cdb4"></rect>
    <g class=${t ? "spin" : ""}>
      <circle cx="94" cy="104" r="80" fill="#17140f"></circle>
      ${[70, 60, 50, 42].map((i) => g`<circle cx="94" cy="104" r=${i} fill="none" stroke="#3a342b" stroke-width="1.2"></circle>`)}
      <path d="M94 30 A74 74 0 0 1 160 80" fill="none" stroke="#5b5346" stroke-width="2" opacity=".6"></path>
      <clipPath id="fhlabel"><circle cx="94" cy="104" r="31"></circle></clipPath>
      <circle cx="94" cy="104" r="31" fill="#c2410c"></circle>
      ${e ? g`<image href=${e} x="63" y="73" width="62" height="62" preserveAspectRatio="xMidYMid slice" clip-path="url(#fhlabel)"></image>` : u}
      <circle cx="94" cy="104" r="3.5" fill="#f4efe3"></circle>
    </g>
    <g transform="rotate(${t ? 24 : 6} 176 30)"><rect x="173" y="26" width="6" height="92" rx="3" fill="#8b8477"></rect><rect x="168" y="112" width="16" height="22" rx="3" fill="#26272b"></rect></g>
    <circle cx="176" cy="30" r="11" fill="#26272b"></circle><circle cx="176" cy="30" r="4" fill="#8b8477"></circle>`}</svg>`, Ho = (e, t, a, i = 230) => {
  const s = 2 * Math.PI * 92, r = Math.max(0, Math.min(1, t));
  return l`<svg class="pring" aria-hidden="true" width=${i} height=${i} viewBox="0 0 200 200" fill="none">${g`
    <circle cx="100" cy="100" r=${92} stroke="rgba(255,255,255,.22)" stroke-width="6"></circle>
    <circle cx="100" cy="100" r=${92} stroke="var(--accent, #ffe08a)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${r * s} ${s}" transform="rotate(-90 100 100)" style="transition:stroke-dasharray 1s linear"></circle>
    <clipPath id="fhdisc"><circle cx="100" cy="100" r="78"></circle></clipPath>
    <circle cx="100" cy="100" r="78" fill="rgba(255,255,255,.08)"></circle>
    ${e ? g`<image href=${e} x="22" y="22" width="156" height="156" preserveAspectRatio="xMidYMid slice" clip-path="url(#fhdisc)" opacity=${a ? 1 : 0.6}></image>` : g`<circle cx="100" cy="100" r="30" stroke="rgba(255,255,255,.3)" stroke-width="2"></circle><circle cx="100" cy="100" r="54" stroke="rgba(255,255,255,.16)" stroke-width="2"></circle>`}
    <circle cx="100" cy="100" r="5" fill="var(--ground, #0a0f1e)"></circle>`}</svg>`;
}, ii = (e, t = 56) => {
  const a = 2 * Math.PI * 22, i = Math.max(0, Math.min(1, e));
  return l`<svg class="tface" aria-hidden="true" width=${t} height=${t} viewBox="0 0 100 100" fill="none">${g`
    <circle cx="50" cy="50" r="46" fill="var(--timer-face, var(--chip-strong))" stroke="var(--timer-rim, var(--ink3))" stroke-width="4"></circle>
    <circle cx="50" cy="50" r="22" stroke="var(--timer, var(--accent))" stroke-width="44" stroke-dasharray="${i * a} ${a}" transform="rotate(-90 50 50)" style="transition:stroke-dasharray 1s linear"></circle>
    <circle cx="50" cy="50" r="3" fill="var(--timer-rim, var(--ink3))"></circle>`}</svg>`;
}, _o = { "--p-1": "#2563eb", "--p-2": "#db2777", "--p-3": "#0f766e", "--p-4": "#c2410c", "--p-5": "#7c3aed", "--p-family": "#475569", "--on-person": "#ffffff" }, Pt = [
  {
    id: "glass",
    name: "Glass",
    tagline: "Frosted panels over a photo",
    swatch: "linear-gradient(160deg,#8ecbf0,#f3e3c4)",
    themed: !0,
    preview: () => l`<span class="lp-pane"><i></i><i></i><i></i></span>`
  },
  {
    id: "fridge",
    name: "Fridge door",
    tagline: "Sticky notes and magnets",
    swatch: "#e4eaec",
    fonts: ["Caveat", "Fredoka"],
    art: {
      clock: (e) => ae(e.now ?? /* @__PURE__ */ new Date()),
      timer: (e) => ii(e.frac ?? 0, e.size),
      night: (e) => ae(e.now ?? /* @__PURE__ */ new Date(), e.size ?? 230),
      player: (e) => Po(e.img, !!e.playing, e.size)
    },
    preview: () => l`<span class="lp-note"></span><span class="lp-note lp-today"><i></i></span><span class="lp-note"></span>`,
    options: [{ id: "hand", label: "Writing on notes and lists", off: "Print", on: "Handwriting", onStyle: "font-family:'Caveat','Fredoka',sans-serif;font-size:21px;font-weight:700", hint: "Print is easier to read from across the room." }],
    vars: {
      ..._o,
      "--ink": "#26272b",
      "--ink2": "#4c4a45",
      "--ink3": "#66625b",
      "--ground": "#e4eaec",
      "--paper": "#ffffff",
      "--note": "#fff6c4",
      "--note-today": "#ffe45c",
      "--rule": "#b9d0e6",
      "--margin": "#f2a7a7",
      "--magnet": "#fbf8f0",
      "--danger": "#c62a22",
      "--glass": "var(--paper)",
      "--glass-line": "transparent",
      "--shadow": "0 5px 8px rgba(0,0,0,.16)",
      "--chip": "rgba(38,39,43,.07)",
      "--chip-strong": "var(--paper)",
      "--chip-soft": "rgba(38,39,43,.045)",
      "--chip-faint": "rgba(38,39,43,.02)",
      "--track": "rgba(38,39,43,.16)",
      "--primary": "#24408e",
      "--on-primary": "#ffffff",
      "--primary-edge": "#162a63",
      "--accent": "#a85200",
      "--ok": "#17703d",
      "--timer": "#c62a22",
      "--timer-face": "var(--paper)",
      "--timer-rim": "var(--ink)",
      "--t-hero": "46px",
      "--t-title": "42px",
      "--t-head": "30px",
      "--t-sub": "26px",
      "--w-title": "700",
      "--w-sub": "700",
      "--w-heavy": "700",
      "--w-bold": "600",
      "--w-semi": "500",
      "--font-content": "'Fredoka', sans-serif",
      "--content-weight": "500",
      "--content-size": "17px",
      "--content-size-lg": "21px",
      "--content-ink": "var(--ink)",
      "--bg": "none"
    },
    evening: {
      "--ground": "#9d927b",
      "--paper": "#eadfc6",
      "--note": "#e3d39b",
      "--note-today": "#e7c651",
      "--rule": "#cbbe9f",
      "--margin": "#d6a391",
      "--magnet": "#e6dcc6",
      "--shadow": "0 5px 8px rgba(0,0,0,.2)"
    }
  },
  {
    id: "orbit",
    name: "Orbit",
    tagline: "Dark, calm, built from rings",
    swatch: "#0a0f1e",
    fonts: ["Outfit"],
    art: {
      clock: (e) => ie(e.arcs ?? [], e.now ?? /* @__PURE__ */ new Date()),
      timer: (e) => ii(e.frac ?? 0, e.size),
      dayview: (e) => Xo(e.arcs ?? [], e.now, e.size),
      night: (e) => ie(e.arcs ?? [], e.now ?? /* @__PURE__ */ new Date(), e.size ?? 250),
      player: (e) => Ho(e.img, e.frac ?? 0, !!e.playing, e.size)
    },
    preview: () => l`<span class="lp-ring"></span><span class="lp-card"><i></i><i></i><i></i></span>`,
    vars: {
      // same hue per person as every other look, lifted for a dark ground
      "--p-1": "#7cb7ff",
      "--p-2": "#ff8fb1",
      "--p-3": "#6ee7c0",
      "--p-4": "#ff9f6b",
      "--p-5": "#c9a7ff",
      "--p-family": "#cbd5e1",
      "--on-person": "#0a0f1e",
      "--ink": "#e8ecf7",
      "--ink2": "#b4bcd6",
      "--ink3": "#98a2c2",
      "--ground": "#0a0f1e",
      "--danger": "#ff8a7a",
      "--glass": "#121a31",
      "--glass-line": "rgba(255,255,255,.12)",
      "--shadow": "none",
      "--ctl-line": "rgba(255,255,255,.44)",
      "--chip": "rgba(255,255,255,.09)",
      "--chip-strong": "rgba(255,255,255,.17)",
      "--chip-soft": "rgba(255,255,255,.05)",
      "--chip-faint": "rgba(255,255,255,.025)",
      "--track": "rgba(255,255,255,.28)",
      "--on-ok": "#0a0f1e",
      // ink-filled = an action; yellow = now / current; mint = done
      "--primary": "#e8ecf7",
      "--on-primary": "#0a0f1e",
      "--accent": "#ffe08a",
      "--ok": "#6ee7c0",
      "--timer": "#ffe08a",
      "--timer-face": "rgba(255,255,255,.06)",
      "--timer-rim": "rgba(255,255,255,.44)",
      "--bg": "none",
      "--w-title": "400",
      "--w-sub": "500",
      "--w-heavy": "600",
      "--w-bold": "500",
      "--w-semi": "400"
    }
  }
], L = (e) => Pt.find((t) => t.id === e) ?? Pt[0], X = (e, t, a) => L(e).art?.[t]?.(a) ?? (t === "timer" ? ii(a.frac ?? 0, a.size) : u), ee = (e, t = 120, a = "") => {
  const i = e.vars ? Object.entries(e.vars).map(([o, s]) => `${o}:${s}`).join(";") : a;
  return l`<span class="lookprev" data-prev=${e.id} style="height:${t}px;${i};background:${e.themed ? "var(--bg) center / cover" : "var(--ground)"}">
    ${e.art?.clock ? l`<span class="lp-clock">${e.art.clock({ now: new Date(2e3, 0, 1, 10, 10), arcs: [] })}</span>` : u}${e.preview?.() ?? u}
    <span class="lp-people">${[1, 2, 3, 4, 5].map((o) => l`<i style="background:var(--p-${o})"></i>`)}</span></span>`;
};
let Ht = "glass";
const ei = /* @__PURE__ */ new Set(), et = () => Ht, Za = (e) => {
  Ht = L(e).id, Eo(Ht), ei.forEach((t) => t());
};
function Eo(e) {
  Le(...L(e).fonts ?? []);
}
class H {
  constructor(t) {
    this.host = t, this._shape = () => {
      const a = D();
      this.host.setAttribute("data-shape", a === "phone" ? "tall" : a), this.host.toggleAttribute("data-phone", a === "phone");
    }, this._on = () => {
      this.host.setAttribute("data-look", Ht), this._shape(), this.host.requestUpdate();
    }, t.addController(this);
  }
  hostConnected() {
    ei.add(this._on), this._off = Bo(this._on), this.host.setAttribute("data-look", Ht), this._shape();
  }
  hostDisconnected() {
    ei.delete(this._on), this._off?.();
  }
}
const $o = `
  /* materials: paper = content (pinned, slightly tilted) · magnet = navigation · plastic key = input · dashed = "add" */
  @F .fh { font-family: 'Fredoka', 'Trebuchet MS', sans-serif; font-size: 16px; background: var(--ground) radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.5px) 0 0 / 14px 14px; transition: background-color 1.5s ease, color .45s ease; }
  @F .fh::before { display: none; }
  @F .fh:not([data-calm]) { animation: fjig 37s linear infinite; }
  @F .fh[data-opt-hand] { --font-content: 'Caveat', 'Fredoka', sans-serif; --content-weight: 700; --content-size: 24px; --content-size-lg: 27px; }
  @F h1, @F h2 { font-family: 'Caveat', 'Fredoka', sans-serif; letter-spacing: 0; }
  @F h1 { line-height: .95; }
  @F h2 { line-height: 1; }
  @F .display { font-family: 'Fredoka', sans-serif; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  @F .glass { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 4px; box-shadow: var(--shadow); transition: background-color 1.5s ease; }
  @F .glass.round { border-radius: 50%; }
  @F .label { letter-spacing: .05em; font-size: 13px; }
  @F .pill, @F .round { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); font-weight: 500; }
  @F .pill.primary, @F .primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 0 var(--primary-edge); }
  @F .sheet { border-radius: 4px; }

  /* header */
  @F .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @F .clock .aclock { grid-row: 1 / span 2; filter: drop-shadow(0 3px 4px rgba(0,0,0,.22)); }
  @F .clock .hm { font-weight: 700; font-size: 50px; }
  @F .cap { background: var(--paper); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -1.2deg); font-weight: 600; }
  @F .cap.hot { background: var(--danger); color: #fff; }
  @F .weather { border-radius: 4px; rotate: calc(var(--tilt, 1) * -1deg); }
  @F .presence { background: transparent; box-shadow: none; gap: 2px; padding: 0 4px; }
  @F .presence { gap: 10px; }
  @F .presence .avatar { background: transparent; color: var(--c); font-weight: 700; font-size: 34px; width: auto; min-width: 26px; height: 44px; border-radius: 0; letter-spacing: -.04em; text-shadow: 0 3px 0 rgba(0,0,0,.18); }
  @F .presence .avatar.away { color: transparent; -webkit-text-stroke: 2px var(--c); opacity: 1; rotate: 14deg; text-shadow: none; }
  @F .right > button.round { background: var(--magnet); color: var(--ink); box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.14); }
  @F .right > button.round[data-act='night'] { background: #33363b; color: #ffd75a; }

  /* planner: the panel disappears, each day is a sticky note */
  @F .planner { background: transparent; box-shadow: none; padding: 4px 0 0; animation: none; }
  @F .planner h1 { background: linear-gradient(transparent 62%, var(--note-today) 62%, var(--note-today) 92%, transparent 92%); align-self: flex-start; padding: 0 6px 0 2px; }
  @F .seg { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); border-radius: 26px; padding: 4px; }
  @F .seg button { border-radius: 22px; color: var(--ink); font-size: 16px; font-weight: 500; }
  @F .seg button[aria-pressed='true'] { background: var(--ink); color: var(--paper); box-shadow: none; font-weight: 600; }
  @F .legend { font-size: 15px; font-weight: 500; }
  @F .week { gap: 10px; padding: 4px 4px 8px; }
  @F .col { position: relative; border-radius: 2px; padding: 24px 8px 8px; background: var(--note); box-shadow: 0 6px 8px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -.7deg); transition: background-color 1.5s ease; }
  @F .col:nth-child(even) { rotate: calc(var(--tilt, 1) * .8deg); }
  @F .col:nth-child(3n) { rotate: calc(var(--tilt, 1) * -.3deg); }
  @F .col.today { background: var(--note-today); box-shadow: 0 9px 14px rgba(0,0,0,.24); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .col::before { content: ''; position: absolute; top: 4px; left: 50%; margin-left: -9px; width: 18px; height: 18px; border-radius: 50%; background: #8b949a; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .col.today::before { background: var(--danger); width: 22px; height: 22px; margin-left: -11px; top: 2px; }
  @F .num { font-weight: 700; }
  @F .today .num { background: var(--ink); color: var(--note-today); }
  @F .ev { background: transparent; border-left: 5px solid var(--c); border-radius: 0; padding: 1px 2px 3px 8px; gap: 1px; }
  @F .ev .t { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  @F .ev .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size); line-height: 1.12; color: var(--content-ink); hyphens: none; -webkit-line-clamp: 2; }
  @F .ev .w { font-size: 13px; font-weight: 500; }
  @F .ev.next { box-shadow: none; }
  @F .ev.next .content { background: linear-gradient(transparent 55%, rgba(255,255,255,.75) 55%); }
  @F .more { background: transparent; text-decoration: underline; font-weight: 500; }
  @F .cell { border-radius: 2px; background: var(--note); box-shadow: 0 2px 3px rgba(0,0,0,.12); }
  @F .cell.out { background: color-mix(in srgb, var(--note) 45%, transparent); box-shadow: none; }
  @F .cell.today { background: var(--note-today); box-shadow: 0 0 0 2.5px var(--ink); }
  @F .dayrow { background: var(--note); border-left-width: 10px; border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .dayrow .content { font-family: var(--font-content); font-weight: var(--content-weight); }

  /* side cards */
  @F .np { background: #2f2a26; border-radius: 10px; --ink: #fff; --ink2: #e2dbcf; color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F .np .np-row { background: #fff6dc; color: #26272b; --ink2: #4c4a45; border-radius: 4px; padding: 6px 10px; }
  @F .np .primary { background: var(--paper); color: #26272b; box-shadow: 0 4px 0 #b9b2a2; }
  @F .art { border-radius: 50%; width: 46px; height: 46px; background: conic-gradient(#ede6d6 0 8%, #141210 8% 10%, #ede6d6 10% 33%, #141210 33% 35%, #ede6d6 35% 58%, #141210 58% 60%, #ede6d6 60% 83%, #141210 83% 85%, #ede6d6 85%); box-shadow: inset 0 0 0 5px #141210; }
  @F .playing .art { animation: fhSpin 4s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @F .timerrow { align-items: center; }
  @F .timerrow.on .hint { display: none; }
  @F .quick { background: transparent; border: 2px dashed var(--ink); border-radius: 22px; min-height: 44px; font-size: 16px; font-weight: 500; }
  @F .rem { font-weight: 500; font-size: 16px; line-height: 1.15; }
  @F .rem .check { width: 20px; height: 20px; border-width: 2px; }
  @F .meter { border: 2px solid var(--ink); background: var(--paper); height: 12px; border-radius: 8px; }
  @F .meter > div { background: #f5b301; border-radius: 0; }

  /* dock: a row of fridge magnets */
  @F .dock { background: transparent; box-shadow: none; gap: 8px; padding: 0; animation: none; }
  @F .dock .item { font-weight: 600; font-size: 14px; height: 78px; gap: 3px; border-radius: 0; }
  @F .dock .item svg.i { width: 52px; height: 52px; padding: 13px; border-radius: 50%; background: var(--magnet); color: var(--ink); stroke-width: 2; box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.14); }
  @F .dock .item[data-nav='lights-on'] svg.i { background: #ffd75a; }
  @F .dock .item[data-nav='lights-off'] svg.i { background: #4a4f55; color: #fff; }
  @F .dock .item[data-nav='dinner'] svg.i { background: var(--danger); color: #fff; }
  @F .dock .item[aria-current='page'] { background: transparent; }
  @F .dock .item[aria-current='page'] svg.i { background: var(--ink); color: var(--paper); box-shadow: 0 0 0 4px var(--paper), 0 0 0 6.5px var(--ink), 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .kidbtn .avatar { box-shadow: 0 4px 5px rgba(0,0,0,.28); }
  @F .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @F .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 4px var(--paper), 0 0 0 6.5px var(--kidc), 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .sep { background: transparent; margin: 0 2px; }
  @F .tcard { border-radius: 4px; }

  /* lists: lined paper, a tick box you could draw, print by default */
  @F .row { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--rule); min-height: 52px; padding-top: 6px; padding-bottom: 6px; }
  @F .check { width: 32px; height: 32px; border-radius: 5px 9px 6px 10px; border: 2.5px solid var(--ink); background: var(--paper); }
  @F .done .check { background: var(--paper); border-color: var(--ink); color: var(--ok); transform: none; font-size: 34px; font-weight: 700; overflow: visible; }
  @F .done .check svg { width: 28px; height: 28px; stroke-width: 4; }
  @F .row .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size-lg); line-height: 1.1; }
  @F .row.now { background: linear-gradient(90deg, transparent 0 46px, var(--note) 46px); }
  @F .big .check { width: 48px; height: 48px; }
  @F .big.done .check { font-size: 50px; }
  @F .row.big .content { font-size: 30px; }
  @F .row.big { background: var(--note); padding-left: 12px; }
  @F .field { background: transparent; box-shadow: none; border-bottom: 3px dashed var(--ink); border-radius: 0; font-weight: 600; font-size: 28px; padding: 0 6px; }
  @F .key { font-weight: 600; background: #f7f4ec; color: #26272b; border-radius: 8px 8px 14px 14px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.2); }
  @F .key:active { transform: translateY(3px); box-shadow: 0 1px 0 #b9b2a2; background: #f7f4ec; }
  @F .tab { font-weight: 600; }

  /* kid page */
  @F .hero { overflow: visible; rotate: calc(var(--tilt, 1) * -.6deg); }
  @F .hero::before { inset: -10px auto auto 50%; width: 96px; height: 24px; margin-left: -48px; background: color-mix(in srgb, var(--kid) 50%, #fff); opacity: .85; transform: rotate(-3deg); }
  @F .name { font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 46px; color: color-mix(in srgb, var(--kid) 72%, #000); }
  @F .rank { font-weight: 600; background: color-mix(in srgb, var(--kid) 72%, #000); }
  @F .stat { background: var(--chip-soft); border-radius: 8px; }
  @F .stat b { font-family: 'Fredoka', sans-serif; font-weight: 700; }
  @F .stat span { font-weight: 500; font-size: 14px; }
  @F .dots i.g { background: #f5b301; border-color: #8a5f00; }
  @F .nextup { background: var(--chip-soft); border-radius: 8px; }
  @F .jobs { background: linear-gradient(90deg, transparent 0 69px, var(--margin) 69px 71px, transparent 71px) 0 86px / 100% 100% no-repeat, var(--glass); }
  @F .sec h2 { font-size: 30px; line-height: 1; padding: 0 4px; }
  @F .sec span { font-weight: 500; font-size: 14px; }
  @F .plus { font-weight: 600; }
  @F .play { box-shadow: 0 3px 0 var(--primary-edge); }
  @F .later { background: var(--chip-soft); border-radius: 8px; font-weight: 500; }
  @F .side { border-radius: 0; overflow: visible; padding: 2px 4px; }
  @F .side > .card { rotate: calc(var(--tilt, 1) * .6deg); }
  @F .tabs { background: transparent; border-radius: 0; padding: 0; }
  @F .rw { background: var(--chip-soft); border-radius: 8px; }
  @F .rw .n { font-weight: 500; font-size: 16px; }
  @F .rw button { font-weight: 600; background: #f5b301; color: #26272b; box-shadow: 0 3px 0 #a87400; }
  @F .rw button.save { background: var(--chip); color: var(--ink2); box-shadow: none; }
  @F .pic { border-radius: 3px; background: var(--paper); box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .pic:nth-child(even) { rotate: calc(var(--tilt, 1) * 1.2deg); }
  @F .pic.done { background: color-mix(in srgb, var(--ok) 24%, var(--paper)); }
  @F .wk { font-size: 15px; }

  /* groceries: a shopping-list pad and chunky keys */
  @F .list.glass { background: linear-gradient(90deg, transparent 0 63px, var(--margin) 63px 65px, transparent 65px) 0 66px / 100% 100% no-repeat, var(--glass); rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .items { gap: 0; }
  /* lists that have tightened to fit keep their ruled lines, just closer together */
  @F .items[data-fit] .row { min-height: 38px; padding-top: 2px; padding-bottom: 2px; }
  @F .items[data-fit] .row .content { font-size: 17px; }
  @F .items[data-fit] .check { width: 24px; height: 24px; }
  @F .jobs [data-fit] .row { min-height: 44px; padding-top: 3px; padding-bottom: 3px; }
  @F .jobs [data-fit] .row .content { font-size: 18px; }
  @F .tag { font-weight: 600; font-size: 12px; }
  @F .who.glass { border-radius: 4px; }

  /* music: the player is a dark deck */
  @F .stage { background: #2f2a26; color: #fff; border-radius: 10px; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F .stage .glass { background: transparent; }
  @F .spk { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .spk.focus { background: var(--note-today); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .spk.inmix { background: var(--note); box-shadow: 0 0 0 3px var(--ok); }
  @F .mroom { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .mstairs { border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink); }
  @F .mzone[data-focus] { background: var(--note); box-shadow: inset 0 0 0 3px var(--ink); }
  @F .pool { background: repeating-linear-gradient(115deg, transparent 0 8px, color-mix(in srgb, var(--c) 34%, transparent) 8px 10px), color-mix(in srgb, var(--c) 30%, var(--paper)); }
  @F .mzone[data-playing] .pool { animation: scribble .7s steps(2, jump-none) infinite; animation-iteration-count: var(--loops, infinite); }
  @F .puck { border-color: var(--magnet); box-shadow: 0 4px 0 #b9b2a2, 0 6px 8px rgba(0,0,0,.25); }
  @F .mshelf { background: var(--note); border-radius: 4px; transform: rotate(.5deg); box-shadow: 0 5px 8px rgba(0,0,0,.16); }
  @F .wholeh { border-radius: 6px; border-color: var(--ink2); }
  @F .viewbtn { border-radius: 6px; background: var(--magnet); box-shadow: 0 3px 0 #b9b2a2, 0 4px 5px rgba(0,0,0,.18); }
  @F .vcard { border-radius: 4px; background: var(--note); box-shadow: 0 3px 5px rgba(0,0,0,.16); }
  @F .vcard[aria-pressed='true'] { background: var(--primary); }
  @F .dplate { fill: var(--paper); stroke: var(--ink); stroke-width: 3; }
  @F .dtrack { stroke: color-mix(in srgb, var(--ink) 16%, var(--paper)); }
  @F .dknob { fill: var(--magnet); stroke: var(--ink); }
  @F .dcover { box-shadow: 0 0 0 4px var(--ink), 0 6px 0 rgba(0,0,0,.18); }
  @F .dcard { background: var(--note); border-radius: 3px; box-shadow: 0 5px 8px rgba(0,0,0,.16); }
  @F .tuner { background: var(--paper); border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .desk { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .strip[data-focus] { background: var(--note); }
  @F .sname { background: var(--note); border-radius: 2px; box-shadow: 0 2px 3px rgba(0,0,0,.18); font-family: var(--font-content); }
  @F .lamp { box-shadow: 0 3px 0 rgba(0,0,0,.3); }
  @F .fcap { border-radius: 4px; box-shadow: inset 0 0 0 2px var(--ink), 0 3px 0 rgba(0,0,0,.3); }
  @F .slot { background: var(--ink); width: 4px; left: 20px; }
  @F .jog { background: var(--magnet); box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 #b9b2a2; }
  @F .mpad { border-radius: 8px; box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.28); }
  @F .dart { border-radius: 4px; box-shadow: 0 0 0 3px var(--ink), 0 5px 6px rgba(0,0,0,.2); }
  @F .cab { background: #2f2a26; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,.25); }
  @F .sock { background: var(--magnet); box-shadow: inset 0 0 0 3px var(--ink); }
  @F .sock[aria-pressed='true'] { background: var(--c); }
  @F .cdisc { box-shadow: 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.2); }
  @F .cbox { background-color: #d9b98a; border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .ttable { background: var(--paper); border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.16); }
  @F .tkey { border-radius: 8px; background: var(--magnet); box-shadow: 0 6px 0 #b9b2a2, 0 8px 8px rgba(0,0,0,.2); }
  @F .tkey[data-go] { background: var(--primary); color: var(--on-primary); box-shadow: 0 6px 0 var(--primary-edge), 0 8px 8px rgba(0,0,0,.2); }
  @F .ctab { border-radius: 4px 4px 0 0; }
  @F .vscene { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .aname { background: var(--note); border-radius: 3px; box-shadow: 0 2px 3px rgba(0,0,0,.18); }
  @F .join { background: var(--magnet); box-shadow: 0 3px 0 #b9b2a2, 0 4px 5px rgba(0,0,0,.18); }
  @F .join[aria-pressed='true'] { background: var(--ok); color: #fff; box-shadow: 0 3px 0 #0d4a27; }
  @F .hit { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--rule); }
  @F .hit[aria-pressed='true'] { background: var(--note-today); box-shadow: none; border-bottom-color: var(--ink); }
  @F .st { background: #fff; border-radius: 2px; box-shadow: 0 5px 8px rgba(0,0,0,.22); font-family: var(--font-content); font-weight: var(--content-weight); color: #26272b; }
  @F .pickrow { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .banner { background: var(--note-today); border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }

  /* home: every room is a note; a room with a light on is the bright one */
  @F .room { background: var(--note); border-radius: 2px; box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .room.lit { background: var(--note-today); box-shadow: 0 7px 10px rgba(0,0,0,.2); rotate: calc(var(--tilt, 1) * .5deg); }
  @F .rh h2 { font-size: 28px; line-height: 1; }
  @F .dev { background: transparent; border-radius: 0; border-bottom: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent); padding-left: 2px; padding-right: 2px; }
  @F .dicon { background: var(--magnet); color: var(--ink); box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.12); }
  @F .dev.on .dicon { background: #ffd23f; color: #5b3a00; box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.14), 0 0 0 4px rgba(255,210,63,.4); }
  @F .toggle { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); }
  @F .toggle[aria-checked='true'] { background: var(--ok); }
  @F .scene { background: var(--magnet); border-radius: 10px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.18); font-weight: 600; }

  /* doodle: paint-pot magnets, and finished pictures taped up as polaroids */
  @F .pad { border-radius: 2px; }
  @F .ink { box-shadow: 0 3px 0 rgba(0,0,0,.22), inset 0 -3px 0 rgba(0,0,0,.14); }
  @F .ink[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--ink); }
  @F .gallery { background: transparent; box-shadow: none; padding: 8px 2px; }
  @F .snaps { gap: 26px 12px; padding: 12px 6px; }
  @F .snap { aspect-ratio: auto; height: 108px; border-radius: 2px; border: 7px solid #fff; border-bottom-width: 26px; background-color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.26); }
  @F .snap::before { top: -16px; width: 46px; height: 16px; margin-left: -23px; border-radius: 1px; background: color-mix(in srgb, var(--note-today) 82%, transparent); box-shadow: 0 1px 2px rgba(0,0,0,.12); rotate: -4deg; }
  @F .by { left: 0; right: 0; bottom: -25px; padding: 0; background: transparent; border-radius: 0; font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 18px; font-weight: 700; line-height: 1.2; text-align: center; color: #26272b; }

  /* avatar studio: the mirror is a taped photo, the shelf is a sheet of stickers */
  @F .mirror { overflow: visible; rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .mirror::before { inset: -10px auto auto 50%; width: 96px; height: 24px; margin-left: -48px; background: color-mix(in srgb, var(--kid) 50%, #fff); opacity: .85; transform: rotate(-3deg); }
  @F .tile { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.16); font-weight: 500; }
  @F .tile[aria-pressed='true'] { background: var(--note-today); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }

  /* morning board: one note per child under a magnet in their colour */
  @F .kcol { position: relative; overflow: visible; border-top: 0; border-radius: 2px; padding-top: 30px; background: var(--note); box-shadow: 0 6px 8px rgba(0,0,0,.18); }
  @F .kcol::before { content: ''; position: absolute; top: 6px; left: 50%; margin-left: -11px; width: 22px; height: 22px; border-radius: 50%; background: var(--kid); box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .khead h2 { font-size: 36px; }
  @F .nextstep { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); font-weight: 600; }
  @F .nextstep.set { background: color-mix(in srgb, var(--ok) 22%, var(--paper)); }
  @F .lchip { background: transparent; border-radius: 0; border-bottom: 2px dashed var(--ink); padding-left: 2px; padding-right: 2px; font-weight: 600; }
  @F .lchip.soon, @F .lchip.now { background: var(--note-today); border-radius: 3px; border-bottom-color: transparent; padding-left: 10px; padding-right: 10px; }
  @F .leave { font-family: 'Fredoka', sans-serif; font-weight: 700; }

  /* night: the kitchen clock keeps watch */
  @F .night .big { font-weight: 400; }
`, ts = `
  /* a ring always means time or progress · ink-filled = an action · yellow = now · mint = done */
  @O .fh { font-family: 'Outfit', 'Avenir Next', 'Segoe UI', sans-serif; font-weight: 400; background: var(--ground) repeating-radial-gradient(circle at 62px 68px, transparent 0 89px, rgba(255,255,255,.04) 89px 90px); }
  @O .fh::before { display: none; }
  @O h1, @O h2, @O .display { font-family: 'Outfit', sans-serif; letter-spacing: -.01em; }
  @O .glass { -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: none; }
  @O .label { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 14px; }
  @O .pill, @O .round { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }
  @O .pill.primary, @O .primary { background: var(--primary); color: var(--on-primary); box-shadow: none; font-weight: 600; }
  @O .toast { background: var(--primary); color: var(--on-primary); font-weight: 500; }
  @O .sheet { background: #172039; }
  @O .scrim { background: rgba(3,5,12,.66); }

  /* header */
  @O .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @O .clock .dial { grid-row: 1 / span 2; }
  @O .clock .hm { font-weight: 400; font-size: 56px; letter-spacing: -.02em; }
  @O .cap { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; font-weight: 500; }
  @O .cap.hot { background: var(--danger); color: #0a0f1e; border-color: var(--danger); }
  @O .badge { background: rgba(255,224,138,.18); font-weight: 600; }
  @O .presence { background: transparent; border-color: transparent; }
  @O .presence .avatar.away { background: transparent; color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ctl-line); opacity: 1; }
  @O .right > button.round { background: transparent; }

  /* planner */
  @O .planner { background: transparent; border-color: transparent; padding: 6px 0 0; }
  @O .seg { border-radius: 999px; padding: 4px; background: rgba(255,255,255,.07); }
  @O .seg button { border-radius: 999px; font-weight: 400; color: var(--ink); }
  @O .seg button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); font-weight: 600; box-shadow: none; }
  @O .legend { font-weight: 400; }
  @O .col { background: var(--glass); border: 1px solid var(--glass-line); border-radius: 22px; padding: 10px 8px; }
  @O .col.today { background: color-mix(in srgb, var(--accent) 13%, var(--glass)); border: 2px solid var(--accent); }
  @O .dayhead { padding: 2px 4px 6px 6px; }
  @O .num { font-weight: 400; font-size: 22px; }
  @O .today .num { background: var(--accent); color: #0a0f1e; font-weight: 600; }
  @O .ev { background: color-mix(in srgb, var(--c) 15%, transparent); border-left: 4px solid var(--c); border-radius: 10px; padding: 8px 9px 8px 10px; }
  @O .ev .t { font-weight: 500; }
  @O .ev .content { font-weight: 500; }
  @O .ev .w { font-weight: 400; font-size: 13px; }
  @O .ev.next { box-shadow: 0 0 0 1.5px var(--accent); }
  @O .more { background: transparent; font-weight: 500; }
  @O .cell { border-radius: 14px; border: 1px solid var(--glass-line); background: var(--glass); }
  @O .cell.out { background: transparent; }
  @O .cell.today { background: color-mix(in srgb, var(--accent) 13%, var(--glass)); border: 2px solid var(--accent); }
  @O .dayrow { border-left-width: 4px; border-radius: 12px; }

  /* side cards */
  @O .art { border-radius: 50%; background: radial-gradient(circle, #05070f 0 5%, #7cb7ff 6% 30%, #05070f 31% 44%, #1a2036 45% 46%, #05070f 47% 62%, #1a2036 63% 64%, #05070f 65% 82%, #1a2036 83% 84%, #05070f 85%); box-shadow: 0 0 0 1px rgba(255,255,255,.3); }
  @O .playing .art { animation: fhSpin 6s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @O .timerrow { align-items: center; gap: 12px; }
  @O .timerrow.on .hint { display: none; }
  @O .quick { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; font-weight: 500; min-height: 44px; }
  @O .rem { font-weight: 400; }
  @O .meter { height: 6px; }
  @O .meter > div { background: var(--ok); }

  /* dock: a line of rings */
  @O .dock { background: transparent; border-color: transparent; gap: 6px; padding: 0; }
  @O .dock .item { font-size: 13px; font-weight: 500; color: var(--ink); height: 78px; gap: 5px; border-radius: 0; }
  @O .dock .item svg.i { width: 52px; height: 52px; padding: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--ctl-line); color: var(--ink); stroke-width: 1.6; }
  @O .dock .item[aria-current='page'] { background: transparent; color: var(--ink); font-weight: 600; }
  @O .dock .item[aria-current='page'] svg.i { background: var(--accent); color: #0a0f1e; box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 3px #0a0f1e, 0 0 0 6px var(--kidc); }
  @O .dock .sep { background: rgba(255,255,255,.18); }

  /* lists */
  @O .row { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); }
  @O .check { border-width: 2.5px; border-color: var(--ink2); }
  @O .done .check { background: var(--ok); border-color: var(--ok); color: #0a0f1e; }
  @O .row .content { font-weight: 400; }
  @O .row.now { background: color-mix(in srgb, var(--accent) 9%, transparent); border-radius: 14px; }
  @O .row.big { background: color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 22px; border-bottom: 0; }
  @O .field { background: transparent; box-shadow: none; border-bottom: 2px solid var(--ctl-line); border-radius: 0; font-weight: 400; font-size: 28px; padding: 0 4px; }
  @O .key { background: var(--chip); box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; font-weight: 400; }
  @O .key:active { background: var(--chip-strong); }
  @O .tabs { background: rgba(255,255,255,.07); }
  @O .tab { font-weight: 500; }
  @O .tab[aria-pressed='true'] { font-weight: 600; }

  /* kid page */
  @O .hero::before { inset: 0; height: auto; background: repeating-radial-gradient(circle at 50% 26%, transparent 0 43px, color-mix(in srgb, var(--kid) 34%, transparent) 43px 44px); -webkit-mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 70%); mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 70%); }
  @O .name { font-weight: 500; font-size: 38px; }
  @O .rank { background: color-mix(in srgb, var(--kid) 20%, transparent); color: var(--kid); font-weight: 600; }
  @O .stat { background: var(--chip-soft); }
  @O .stat b { font-family: 'Outfit', sans-serif; font-weight: 400; font-size: 34px; }
  @O .stat span { font-weight: 400; }
  @O .dots i.t { box-shadow: 0 0 0 2px #121a31, 0 0 0 4px var(--kid); }
  @O .nextup { background: var(--chip-soft); }
  @O .jobs .check { border-color: var(--kid); }
  @O .jobs .done .check { border-color: var(--ok); }
  @O .sec { margin-top: 12px; }
  @O .sec h2 { font-size: 17px; font-weight: 600; color: var(--kid); }
  @O .sec span { font-weight: 400; }
  @O .plus { background: color-mix(in srgb, var(--kid) 20%, transparent); color: var(--kid); font-weight: 600; }
  @O .later { background: var(--chip-soft); font-weight: 400; }
  @O .rw { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); padding-left: 2px; }
  @O .rw .n { font-weight: 400; }
  @O .rw button { font-weight: 600; }
  @O .rw button.save { background: var(--chip); color: var(--ink2); }
  @O .pic { background: var(--chip-soft); border: 2px solid color-mix(in srgb, var(--kid) 65%, transparent); border-radius: 28px; }
  @O .pic.done { background: color-mix(in srgb, var(--ok) 24%, transparent); border-color: var(--ok); }

  /* groceries */
  @O .items { gap: 0; }
  @O .jobs [data-fit] .row { min-height: 44px; padding-top: 3px; padding-bottom: 3px; }
  @O .tag { font-weight: 600; }
  @O .who.glass { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }

  /* home: rooms are outlined cells; a room with a light on carries the 'now' yellow */
  @O .room { background: transparent; border-radius: 26px; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .room.lit { background: color-mix(in srgb, var(--accent) 7%, transparent); box-shadow: inset 0 0 0 1.5px var(--accent); }
  @O .rh h2 { font-size: 20px; font-weight: 500; }
  @O .dev { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.12); padding-left: 2px; padding-right: 2px; }
  @O .dicon { background: transparent; color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .dev.on .dicon { background: var(--accent); color: #0a0f1e; box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 22%, transparent); }
  @O .toggle { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .toggle[aria-checked='true'] { background: var(--ok); box-shadow: none; }
  @O .scene { background: transparent; border-radius: 20px; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }

  /* doodle: the paper stays bright, the gallery is a row of framed portholes */
  @O .pad { border-radius: 24px; }
  @O .ink { box-shadow: none; }
  @O .ink[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ground), 0 0 0 5px var(--ink); }
  @O .snap { border-radius: 18px; box-shadow: 0 0 0 1.5px var(--ctl-line); }
  @O .snap:nth-child(odd), @O .snap:nth-child(even) { transform: none; }
  @O .snap::before { display: none; }
  @O .by { background: var(--ground); color: var(--ink); box-shadow: inset 0 0 0 1px var(--ctl-line); font-weight: 500; }

  /* avatar studio */
  @O .tile { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 400; }
  @O .tile[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 9%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }

  /* morning board */
  @O .kcol { border-top: 0; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--kid) 60%, transparent); }
  @O .khead h2 { font-weight: 500; }
  @O .nextstep { background: color-mix(in srgb, var(--accent) 9%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent); font-weight: 500; }
  @O .nextstep.set { background: color-mix(in srgb, var(--ok) 11%, transparent); box-shadow: inset 0 0 0 1.5px var(--ok); }
  @O .lchip { background: transparent; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--glass-line); padding-left: 14px; padding-right: 14px; font-weight: 500; }
  @O .lchip.soon, @O .lchip.now { background: transparent; color: var(--accent); box-shadow: inset 0 0 0 1.5px var(--accent); }
  @O .leave { font-family: 'Outfit', sans-serif; font-weight: 400; }

  /* music: rooms are cells on the ring; the one you control carries the 'now' yellow */
  @O .spk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .spk.focus { background: color-mix(in srgb, var(--accent) 8%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }
  @O .spk.inmix { box-shadow: inset 0 0 0 2px var(--ok); }
  @O .mroom { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .mstairs { box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .mzone { --stream: var(--accent); }
  @O .mzone[data-focus] { box-shadow: inset 0 0 0 2px var(--accent); }
  @O .pool { background: color-mix(in srgb, var(--c) 20%, transparent); border-top: 2px solid var(--c); }
  @O .pool::before { display: none; }
  @O .mzone[data-playing] .pool { animation: breathe 3.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @O .puck { border: 1.5px solid var(--ink); box-shadow: none; }
  @O .mshelf { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .wholeh { border-width: 1.5px; border-color: var(--ctl-line); }
  @O .viewbtn { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .vcard { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .vcard[aria-pressed='true'] { background: var(--primary); }
  @O .dplate { fill: transparent; stroke: var(--glass-line); stroke-width: 1.5; }
  @O .bigdial, @O .desk, @O .rig, @O .vscene { --stream: var(--accent); }
  @O .dtrack { stroke: rgba(255,255,255,.14); stroke-width: 10; }
  @O .dknob { fill: var(--ground); stroke-width: 3; }
  @O .dcover { box-shadow: 0 0 0 1.5px var(--ink); }
  @O .dcard, @O .tuner { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .desk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .sname { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .lamp { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .lamp[aria-pressed='true'] { background: var(--ok); color: #0a0f1e; box-shadow: none; }
  @O .strip[data-live] .fcap { background: var(--c); box-shadow: none; }
  @O .fcap { background: var(--ground); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .slot { width: 2px; left: 21px; }
  @O .jog { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .mpad { box-shadow: none; }
  @O .cab { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .sock { background: var(--ground); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .sock[aria-pressed='true'] { background: var(--c); box-shadow: none; }
  @O .cdisc { box-shadow: 0 0 0 1.5px var(--ink); }
  @O .cbox { background-color: var(--glass); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .ttable { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .tkey { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .tkey[data-go] { background: var(--primary); color: var(--on-primary); box-shadow: none; }
  @O .vscene { box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .aname { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .join { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .join[aria-pressed='true'] { background: var(--ok); color: #0a0f1e; box-shadow: none; }
  @O .hit { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.12); }
  @O .hit[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 10%, transparent); box-shadow: none; border-radius: 12px; }
  @O .st { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .pickrow { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .banner { background: color-mix(in srgb, var(--accent) 12%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent); }

  /* day view: the day as a dial, the list beside it */
  @O .dayview { gap: 28px; }
  @O .dayart { padding: 0 14px; }

  /* night: only the dial and the time */
  @O .night .big { font-weight: 300; }
`, as = `
  /* the fridge door gets a bump now and then: every note jiggles on its pin (needs --tilt registered as a number, see ambient.ts) */
  @keyframes fjig { 0%, 93%, 100% { --tilt: 1; } 94.5% { --tilt: 2.3; } 96% { --tilt: -.2; } 97.5% { --tilt: 1.6; } 99% { --tilt: .7; } }
  @keyframes fhSpin { to { transform: rotate(360deg); } }
  .vinyl .spin { transform-box: fill-box; transform-origin: center; animation: fhSpin 5s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .vinyl, .pring { max-width: 100%; max-height: 100%; height: auto; }
`, is = `
  .lookprev { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px; border-radius: 16px; overflow: hidden; padding: 10px; color: var(--ink); }
  .lookprev .lp-clock { position: absolute; top: 8px; right: 10px; line-height: 0; }
  .lookprev .lp-clock svg { width: 30px; height: 30px; }
  .lookprev .lp-people { position: absolute; left: 10px; bottom: 8px; display: flex; gap: 4px; }
  .lookprev .lp-people i { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 1.5px var(--glass, #fff); }
  .lookprev .lp-pane, .lookprev .lp-card { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 10px; background: var(--glass); border: 1px solid var(--glass-line); }
  .lookprev .lp-pane { width: 62%; height: 56%; border-radius: 14px; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: var(--shadow); }
  .lookprev .lp-card { width: 42%; height: 56%; border-radius: 14px; }
  .lookprev .lp-pane i, .lookprev .lp-card i { height: 6px; border-radius: 3px; background: var(--ink); opacity: .6; }
  .lookprev .lp-pane i:nth-child(2), .lookprev .lp-card i:nth-child(2) { width: 68%; }
  .lookprev .lp-pane i:nth-child(3), .lookprev .lp-card i:nth-child(3) { width: 42%; background: var(--primary); opacity: 1; }
  .lookprev .lp-note { position: relative; width: 21%; height: 52%; border-radius: 2px; background: var(--note); box-shadow: 0 4px 5px rgba(0,0,0,.18); rotate: -3deg; }
  .lookprev .lp-note:last-of-type { rotate: 2deg; }
  .lookprev .lp-note.lp-today { height: 64%; background: var(--note-today); rotate: 1deg; }
  .lookprev .lp-note::before { content: ''; position: absolute; top: -4px; left: 50%; margin-left: -5px; width: 10px; height: 10px; border-radius: 50%; background: var(--ink3); box-shadow: 0 1px 2px rgba(0,0,0,.3); }
  .lookprev .lp-note.lp-today::before { background: var(--danger); }
  .lookprev .lp-ring { width: 56px; height: 56px; border-radius: 50%; border: 8px solid var(--track); border-top-color: var(--accent); border-right-color: var(--p-1); flex-shrink: 0; }
`, oi = /* @__PURE__ */ new Map();
for (const [e, t] of Object.entries(Qe.parts)) for (const a of t) oi.set(a, [...oi.get(a) ?? [], e]);
const oe = (e, t) => e.replace(/\/\*[\s\S]*?\*\//g, "").replace(/([^{}]+)\{([^{}]*)\}/g, (a, i, o) => `${i.split(",").map((r) => {
  let n = null;
  for (const p of r.replace(/\[[^\]]*\]/g, "").matchAll(/\.([a-zA-Z][\w-]*)/g)) {
    const d = oi.get(p[1]);
    d && !Qe.roles.includes(p[1]) && (n = n ? n.filter((h) => d.includes(h)) : d);
  }
  const c = n?.length === 1 ? `:host(${n[0]}[data-look='${t}'])` : `:host([data-look='${t}'])`;
  return r.trim().replace(/^@[A-Z]/, c);
}).join(", ")} {${o}}
`), es = (e) => {
  if (!e.vars) return "";
  const t = (i) => Object.entries(i).map(([o, s]) => `${o}:${s}`).join(";"), a = `:host([data-look='${e.id}']) .fh`;
  return `${a} {${t(e.vars)}}
${e.evening ? `${a}[data-tod='eve'], ${a}[data-tod='night'] {${t(e.evening)}}
` : ""}`;
}, os = $(as + is + Pt.map(es).join("") + oe($o, "fridge") + oe(ts, "orbit")), _ = G`
  :host { display: block; height: 100%; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; background: transparent; cursor: pointer; padding: 0; }
  h1, h2, .display { font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif; letter-spacing: -0.025em; margin: 0; }
  /* Type roles. Templates name a role; a look restyles the role through its tokens (--t-* sizes, --w-* weights),
     so no look ever has to fight an inline size. Weights everywhere go through --w-heavy / --w-bold / --w-semi. */
  .t-hero { font-size: var(--t-hero, 34px); font-weight: var(--w-title, 800); }
  .t-title { font-size: var(--t-title, 28px); font-weight: var(--w-title, 800); }
  .t-head { font-size: var(--t-head, 26px); font-weight: var(--w-title, 800); }
  .t-sub { font-size: var(--t-sub, 22px); font-weight: var(--w-sub, 700); }

  .fh {
    position: relative; overflow: hidden; overflow: clip; isolation: isolate;
    zoom: var(--z, 1); height: calc((100vh - var(--header-height, 0px)) / var(--z, 1)); min-height: 600px;
    padding: 20px 24px; display: flex; flex-direction: column; gap: 16px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--ink);
    background: var(--bg) center / cover no-repeat; -webkit-font-smoothing: antialiased;
    transition: color .45s ease;
  }
  .fh::before { content: ''; position: absolute; inset: 0; background: var(--tod, transparent); pointer-events: none; transition: background 60s linear; }
  .fh.rainy::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .18;
    background: repeating-linear-gradient(105deg, transparent 0 18px, rgba(255,255,255,.55) 18px 19px, transparent 19px 46px); animation: rain 1.4s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes rain { from { background-position: 0 0; } to { background-position: -40px 120px; } }
  .fh > header, .fh > .body, .fh > nav { position: relative; }
  /* calm mode: looping motion (avatar bob and blink, rain, pulses) runs once and settles; looks drop their tilt */
  .fh[data-calm] { --loops: 0; --tilt: 0; --motion: paused; }
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
  .live { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); animation: live 2s ease-out infinite; animation-iteration-count: var(--loops, infinite); flex-shrink: 0; }
  @keyframes live { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--ok) 60%, transparent); } 100% { box-shadow: 0 0 0 10px transparent; } }
  .muted { color: var(--ink2); }
  .label { font-size: 12px; font-weight: var(--w-semi, 600); color: var(--ink2); text-transform: uppercase; letter-spacing: .05em; }
  .pill { height: 44px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
  .round { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); display: inline-flex; align-items: center; justify-content: center; }
  .primary { background: var(--primary); color: var(--on-primary); }
  .avatar { border-radius: 50%; color: var(--on-person); font-weight: var(--w-bold, 700); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
  svg.i { width: var(--s, 22px); height: var(--s, 22px); fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }

  /* header */
  header { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 64px; }
  .clock { display: flex; flex-direction: column; min-width: 230px; }
  .clock .hm { font-size: 54px; font-weight: var(--w-bold, 700); line-height: 1; }
  .kids { display: flex; gap: 6px; padding: 6px; border-radius: 999px; }
  .kid { display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--chip); font-weight: var(--w-semi, 600); font-size: 15px; }
  .right { display: flex; align-items: center; gap: 10px; }
  .weather { display: flex; align-items: center; gap: 10px; padding: 9px 16px; border-radius: 999px; }
  .badge { padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, #f59e0b 22%, var(--chip)); font-size: 13px; font-weight: var(--w-heavy, 800); white-space: nowrap; }
  .badge.hot { background: color-mix(in srgb, #dc2626 22%, var(--chip)); }
  /* one row: chips that do not fit wrap out of sight, lowest priority first */
  .capsule { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-content: flex-start; justify-content: center; gap: 8px; height: 46px; overflow: hidden; }
  .cap { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 16px; border-radius: 999px; background: var(--glass); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border: 1px solid var(--glass-line); font-size: 16px; font-weight: var(--w-bold, 700); white-space: nowrap; max-width: 380px; overflow: hidden; text-overflow: ellipsis; animation: fadeIn .4s ease both; }
  .cap b { font-variant-numeric: tabular-nums; font-size: 18px; }
  .cap.hot { background: #dc2626; color: #fff; border-color: #dc2626; animation: pulse 1.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  .cap.ok { background: color-mix(in srgb, var(--ok) 25%, var(--glass)); }
  .presence { display: flex; gap: 4px; padding: 7px 8px; border-radius: 999px; }
  .presence .avatar { width: 32px; height: 32px; font-size: 13px; background: var(--c); }
  .presence .avatar.away { opacity: .35; }

  /* body */
  .body { display: flex; gap: 16px; flex: 1; min-height: 0; }
  .planner { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
  .bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .seg { display: flex; padding: 3px; border-radius: 12px; background: var(--track); }
  .seg button { height: 40px; min-width: 56px; padding: 0 16px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--ink2); }
  .seg button[aria-pressed='true'] { background: var(--chip-strong); color: var(--ink); font-weight: var(--w-bold, 700); box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; font-weight: var(--w-semi, 600); color: var(--ink2); }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; flex-shrink: 0; }
  /* a person's colour never stands alone: the chip carries their initial too */
  .init { min-width: 18px; height: 18px; padding: 0 4px; border-radius: 6px; background: var(--c, var(--p-family)); color: var(--on-person, #fff); font-size: 11px; font-weight: var(--w-heavy, 800); line-height: 1; letter-spacing: 0;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; font-style: normal; text-transform: none; }
  .init.sm { min-width: 15px; height: 15px; padding: 0 3px; border-radius: 5px; font-size: 10px; }
  /* a list with more below fades out at the bottom edge instead of cutting a row in half */
  .scrolly[data-more] { -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 44px), transparent); mask-image: linear-gradient(to bottom, #000 calc(100% - 44px), transparent); }

  .week { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px; border-radius: 16px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .col.today { background: var(--chip-strong); box-shadow: 0 4px 14px rgba(0,0,0,.06); }
  .dayhead { display: flex; align-items: center; gap: 6px; padding: 2px 2px 4px; }
  .num { font-size: 17px; font-weight: var(--w-heavy, 800); padding: 0 4px; }
  .pchip { margin-left: auto; font-size: 13px; opacity: .7; }
  .today .num { width: 28px; height: 28px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: inline-flex; align-items: center; justify-content: center; padding: 0; font-size: 14px; }
  .ev { border-radius: 12px; padding: 7px 9px 7px 10px; display: flex; flex-direction: column; gap: 2px; background: color-mix(in srgb, var(--c) 24%, var(--chip-soft)); border-left: 5px solid var(--c); }
  .ev .t { font-size: 12px; font-weight: var(--w-bold, 700); color: var(--ink2); }
  .ev .n { font-size: 15px; font-weight: var(--w-bold, 700); line-height: 1.2; overflow-wrap: anywhere; hyphens: auto; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .evs { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 6px; overflow: hidden; }
  .evs > .ev { flex-shrink: 0; }
  .ell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .evcap { min-width: 0; max-width: 100%; }
  .ev .w { font-size: 12px; font-weight: var(--w-semi, 600); color: var(--ink2); }
  .ev.priv { flex-direction: row; gap: 6px; background: transparent; border-left: 0; padding: 2px 6px; opacity: .6; }
  .ev.past { opacity: .55; }
  .col.today .ev.past .w { display: none; }
  .ev.next { box-shadow: 0 0 0 2px var(--primary); }
  .dayrow.past { opacity: .55; }
  .more { font-size: 13px; font-weight: var(--w-bold, 700); color: var(--ink2); min-height: 40px; padding: 6px 6px; border-radius: 10px; background: var(--chip-soft); text-align: left; }
  .xpbar { height: 8px; border-radius: 4px; background: var(--track); overflow: hidden; }
  .xpbar > div { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); border-radius: 4px; transition: width .8s; }

  .daylist { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 10px; }
  .daylist[data-fit] { gap: 6px; }
  .daylist[data-fit] .dayrow { padding: 8px 14px; }
  .daylist[data-fit='2'], .daylist[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; align-content: start; }
  .dayview { flex: 1; min-height: 0; display: flex; align-items: stretch; gap: 22px; }
  .dayview .dayart { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; padding: 0 6px; line-height: 0; }
  .dayview .daylist { min-width: 0; }
  .dayrow { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 16px; background: color-mix(in srgb, var(--c, transparent) 22%, transparent); border-left: 6px solid var(--c, transparent); }

  .month { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(0, 1fr); gap: 6px; }
  .mhead { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; font-size: 12px; font-weight: var(--w-semi, 600); color: var(--ink2); padding: 0 6px; }
  .cell { display: flex; flex-direction: column; gap: 3px; padding: 6px 7px; border-radius: 12px; background: var(--chip-soft); min-width: 0; overflow: hidden; }
  .cell.out { background: var(--chip-faint); color: var(--ink3); }
  .cell.today { background: var(--chip-strong); }
  .cell .mev { display: flex; align-items: center; gap: 5px; flex-shrink: 0; line-height: 1.3; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }

  aside { width: 272px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
  .card { border-radius: 24px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .art { width: 56px; height: 56px; border-radius: 12px; background: var(--pic, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; flex-shrink: 0; }
  .progress { height: 4px; border-radius: 2px; background: var(--track); }
  .progress > div { height: 4px; border-radius: 2px; background: var(--ink); }
  .timerrow { display: flex; align-items: baseline; gap: 10px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .np button.tap, .timerrow button { min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .grid3 button { height: 44px; border-radius: 12px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
  .rem { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }
  .ring { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); flex-shrink: 0; }

  /* dock */
  nav.dock { align-self: center; display: flex; align-items: center; gap: 4px; padding: 8px; border-radius: 26px; }
  .dock .item { min-width: 74px; height: 68px; padding: 0 6px; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 13px; font-weight: var(--w-semi, 600); }
  .dock .item[aria-current='page'] { background: var(--chip-strong); font-weight: var(--w-heavy, 800); }
  .dock .kidbtn { min-width: 80px; gap: 2px; }
  .dock .kidbtn .avatar { overflow: hidden; }
  .dock .kidbtn[aria-current='page'] { box-shadow: inset 0 0 0 3px var(--kidc); }
  .dock .called { color: var(--ok); }
  .dock .sep { width: 1px; height: 36px; background: var(--track); margin: 0 6px; }
  .dock .cta { height: 60px; padding: 0 20px; border-radius: 18px; display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }

  /* sheets, toasts, night */
  .scrim { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
  .sheet { position: relative; width: min(1000px, 92%); border-radius: 32px; padding: 26px 28px 24px; display: flex; flex-direction: column; gap: 18px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
  @keyframes sheet { from { opacity: 0; transform: scale(.94) translateY(12px); } to { opacity: 1; transform: none; } }
  .themes { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
  .tcard { display: flex; flex-direction: column; gap: 6px; padding: 8px 8px 12px; border-radius: 22px; background: var(--chip); text-align: left; }
  .tcard[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); }
  .tprev { height: 120px; border-radius: 16px; display: flex; align-items: flex-end; gap: 5px; padding: 10px; background: var(--bg) center / cover; }
  .tprev span { width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
  .looks { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .opt { min-width: 56px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; }
  .setrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 52px; }
  .setlabel { display: flex; flex-direction: column; line-height: 1.25; font-size: 16px; }
  .setlabel .muted { font-size: 13px; font-weight: 500; }
  .opt .sw { width: 46px; height: 28px; border-radius: 14px; background: var(--track); position: relative; flex-shrink: 0; transition: background-color .2s; }
  .opt .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s; }
  .opt[aria-checked='true'] .sw { background: var(--ok); }
  .opt[aria-checked='true'] .sw::after { transform: translateX(18px); }
  .toast:empty { display: none; }
  .toast { position: absolute; left: 0; right: 0; margin: 0 auto; width: fit-content; max-width: min(90%, 720px); box-sizing: border-box; text-align: center; pointer-events: none; bottom: 120px; z-index: 20; padding: 14px 22px; border-radius: 999px; background: rgba(15,15,20,.88); color: #fff; font-size: 16px; font-weight: var(--w-semi, 600); animation: fadeIn .3s ease both; }
  .flash { position: absolute; inset: 0; z-index: 30; background: var(--chip-strong); pointer-events: none; animation: flash .7s ease forwards; }
  @keyframes flash { from { opacity: .9; } to { opacity: 0; } }
  .night { position: absolute; inset: 0; z-index: 40; padding: 56px 64px; display: flex; flex-direction: column; justify-content: space-between; color: #ffb26b; text-align: left;
    background: #000; animation: fadeIn .8s ease both;
    /* drawings a look adds here are redrawn in the same dim amber as the digits */
    --ink: #ffb26b; --ink2: rgba(255,178,107,.75); --ink3: rgba(255,178,107,.5); --paper: transparent; --track: rgba(255,178,107,.2); --accent: #ffb26b; --danger: #ffb26b; --ground: #000; }
  .night .nwander { flex: 1; display: flex; flex-direction: column; justify-content: space-between; transition: transform 55s linear; }
  .night .nclock { display: flex; align-items: center; gap: 40px; }
  .night .nart { line-height: 0; opacity: .8; }
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

  /* portrait tablets: the same parts, stacked */
  :host([data-shape='tall']) header { flex-wrap: wrap; row-gap: 10px; }
  :host([data-shape='tall']) .capsule { order: 3; flex-basis: 100%; justify-content: flex-start; }
  :host([data-shape='tall']) .body { flex-direction: column; }
  :host([data-shape='tall']) aside { width: auto; flex-direction: row; }
  :host([data-shape='tall']) aside > section { flex: 1 1 0; min-width: 0; }
  :host([data-shape='tall']) nav.dock { gap: 0; max-width: 100%; }
  :host([data-shape='tall']) .dock .item { min-width: 62px; }
  :host([data-shape='tall']) .dock .sep { margin: 0 3px; }
  :host([data-shape='tall']) .themes { grid-template-columns: repeat(3, minmax(0, 1fr)); }

  /* phones: one column that scrolls, with the dock fixed along the bottom. Nothing here applies to any other screen. */
  :host([data-phone]) { height: auto; }
  :host([data-phone]) .fh { height: auto; min-height: calc((100vh - var(--header-height, 0px)) / var(--z, 1)); overflow: visible; padding: 12px 12px 92px; gap: 12px; }
  :host([data-phone]) header { min-height: 0; gap: 8px; }
  :host([data-phone]) .clock { min-width: 0; flex: 1 1 auto; }
  :host([data-phone]) .clock .hm { font-size: 42px; }
  :host([data-phone]) .right { flex-wrap: wrap; justify-content: flex-end; gap: 6px; flex: 1 1 auto; }
  :host([data-phone]) .right > button { width: 44px !important; height: 44px !important; }
  :host([data-phone]) .weather { padding: 6px 12px; }
  :host([data-phone]) .weather .badge, :host([data-phone]) .presence { display: none; }
  :host([data-phone]) header { flex-wrap: wrap; }
  :host([data-phone]) .capsule { height: auto; min-height: 0; }
  :host([data-phone]) .cap { max-width: 100%; height: 42px; font-size: 14px; }
  :host([data-phone]) .body { flex: none; }
  :host([data-phone]) .planner { padding: 14px 12px; border-radius: 22px; }
  :host([data-phone]) .bar { gap: 8px; }
  :host([data-phone]) .bar > div:first-child { min-width: 0; flex: 1 1 100%; }
  :host([data-phone]) .seg { flex: 1 1 100%; }
  :host([data-phone]) .seg button { flex: 1; min-width: 0; }
  :host([data-phone]) .legend { gap: 6px 10px; font-size: 12px; }
  :host([data-phone]) .week { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; min-height: 400px; }
  :host([data-phone]) .week .col { flex: 0 0 47%; scroll-snap-align: start; }
  :host([data-phone]) .daylist { overflow: visible; flex: none; display: flex !important; }
  :host([data-phone]) .dayrow { gap: 10px; padding: 10px 12px; }
  :host([data-phone]) .dayrow > span:first-child { width: 64px !important; font-size: 14px !important; }
  :host([data-phone]) .month { min-height: 380px; }
  :host([data-phone]) .cell .mev { font-size: 0; gap: 0; }
  :host([data-phone]) aside { flex-direction: column; }
  :host([data-phone]) nav.dock { position: fixed; left: 8px; right: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); z-index: 9; max-width: none; overflow-x: auto; justify-content: flex-start; padding: 6px; border-radius: 22px; scrollbar-width: none; }
  :host([data-phone]) nav.dock::-webkit-scrollbar { display: none; }
  :host([data-phone]) .dock .item { min-width: 60px; height: 58px; flex-shrink: 0; font-size: 12px; }
  :host([data-phone]) .scrim, :host([data-phone]) .night, :host([data-phone]) .alarm { position: fixed; }
  :host([data-phone]) .sheet { width: 94%; max-height: 84vh; overflow-y: auto; padding: 18px 16px; border-radius: 24px; }
  :host([data-phone]) .themes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  :host([data-phone]) .toast { position: fixed; bottom: 96px; border-radius: 20px; }
  .toast button { pointer-events: auto; }
  :host([data-phone]) .night { padding: 32px 24px; }
  :host([data-phone]) .night .big { font-size: 92px; }
  :host([data-phone]) .night .nclock { flex-direction: column; align-items: flex-start; gap: 16px; }
  :host([data-phone]) .keys { display: none; }

  ${os}
`;
try {
  CSS.registerProperty?.({ name: "--tilt", syntax: "<number>", inherits: !0, initialValue: "1" });
} catch {
}
const Be = (e) => () => (e = e * 16807 % 2147483647, (e - 1) / 2147483646), Qa = (e, t, a) => {
  const i = Be(t);
  return Array.from({ length: e }, () => `${(i() * 100).toFixed(2)}vw ${(i() * 100).toFixed(2)}vh 0 ${i() < 0.2 ? 1 : 0}px ${a}`).join(",");
}, Ta = (e, t, a, i) => {
  const o = Be(t);
  return Array.from({ length: e }, () => ({ x: o() * 100, y: a + o() * (i - a), d: o() * 8, s: 0.6 + o() * 0.8 }));
}, ss = [Qa(46, 7, "#fff"), Qa(38, 91, "#dfe6ff"), Qa(30, 333, "#fff6d6")], rs = Ta(12, 21, 58, 90), ns = Ta(9, 77, 0, 100), ls = Ta(7, 5, 30, 85), ps = Ta(4, 404, 0, 100), cs = {
  orbit: ["shoot", "shoot", "shoot", "saucer", "comet", "rocket"],
  space: ["shoot", "shoot", "shoot", "rocket", "saucer", "comet"],
  sea: ["gulls", "gulls", "balloon"],
  sunset: ["gulls", "gulls", "balloon"],
  reef: ["fish", "fish", "turtle"],
  bush: ["leaf", "butterfly", "butterfly"],
  fridge: ["ant", "fly", "gecko"]
}, se = { shoot: 1400, saucer: 16e3, rocket: 11e3, comet: 7e3, gulls: 2e4, fish: 18e3, turtle: 3e4, leaf: 14e3, butterfly: 15e3, ant: 26e3, fly: 9e3, gecko: 9e3, balloon: 4e4 }, Ba = {
  shoot: g`<svg viewBox="0 0 120 8" width="150"><defs><linearGradient id="sg"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="120" height="2" y="3" rx="1" fill="url(#sg)"/><circle cx="118" cy="4" r="2.4" fill="#fff"/></svg>`,
  saucer: g`<svg viewBox="0 0 90 48" width="84"><ellipse cx="45" cy="20" rx="17" ry="13" fill="#bfe9ff" opacity=".85"/><circle cx="41" cy="17" r="4" fill="#9ae6b4"/><circle cx="39.5" cy="16" r="1" fill="#123"/><circle cx="42.5" cy="16" r="1" fill="#123"/><ellipse cx="45" cy="28" rx="40" ry="10" fill="#8d96b8"/><ellipse cx="45" cy="26" rx="40" ry="8" fill="#c7cde6"/><g class="blink"><circle cx="17" cy="28" r="2.6" fill="#ffd166"/><circle cx="35" cy="31" r="2.6" fill="#ff6b6b"/><circle cx="55" cy="31" r="2.6" fill="#7bdff2"/><circle cx="73" cy="28" r="2.6" fill="#ffd166"/></g></svg>`,
  rocket: g`<svg viewBox="0 0 70 34" width="62"><path class="flame" d="M14 17l-13-6 5 6-5 6z" fill="#ffb703"/><path d="M12 9h30c12 0 22 5 26 8-4 3-14 8-26 8H12z" fill="#eef1fb"/><path d="M12 9l-8-7h14zM12 25l-8 7h14z" fill="#e63946"/><circle cx="44" cy="17" r="5" fill="#7bdff2" stroke="#34405e" stroke-width="2"/></svg>`,
  comet: g`<svg viewBox="0 0 160 30" width="170"><defs><linearGradient id="cg"><stop offset="0" stop-color="#9bdcff" stop-opacity="0"/><stop offset="1" stop-color="#d9f3ff" stop-opacity=".9"/></linearGradient></defs><path d="M0 15L140 6v18z" fill="url(#cg)"/><circle cx="144" cy="15" r="8" fill="#eaf8ff"/></svg>`,
  gulls: g`<svg viewBox="0 0 90 40" width="86" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path class="flap" d="M6 16q9-10 16 0q7-10 16 0"/><path class="flap late" d="M48 30q7-8 13 0q6-8 13 0"/></svg>`,
  fish: g`<svg viewBox="0 0 70 36" width="58"><path d="M14 18L2 8v20z" fill="#ff9f1c"/><ellipse cx="38" cy="18" rx="26" ry="13" fill="#ffbf69"/><path d="M30 6q8 12 0 24M42 6q8 12 0 24" stroke="#fff" stroke-width="3" fill="none"/><circle cx="54" cy="15" r="2.6" fill="#123"/></svg>`,
  turtle: g`<svg viewBox="0 0 90 50" width="78"><path class="paddle" d="M30 34l-12 12 16-4zM58 34l10 12-15-4z" fill="#5fa777"/><ellipse cx="44" cy="26" rx="26" ry="16" fill="#3d8b63"/><path d="M26 26h36M35 14l6 24M53 14l-6 24" stroke="#2c6b4a" stroke-width="2" fill="none"/><circle cx="76" cy="24" r="8" fill="#6fbf8b"/><circle cx="79" cy="22" r="1.6" fill="#123"/></svg>`,
  leaf: g`<svg viewBox="0 0 40 24" width="34"><path d="M2 12Q14-4 38 12Q14 28 2 12z" fill="#8a9a5b"/><path d="M4 12h32" stroke="#5f6f3a" stroke-width="1.5"/></svg>`,
  butterfly: g`<svg viewBox="0 0 44 36" width="36"><g class="wings"><path d="M22 18Q6-2 3 12t19 8z" fill="#f4a261"/><path d="M22 18Q38-2 41 12t-19 8z" fill="#e76f51"/><path d="M22 20Q10 34 8 24t14-4z" fill="#e9c46a"/><path d="M22 20Q34 34 36 24t-14-4z" fill="#f4a261"/></g><rect x="20.6" y="10" width="2.8" height="16" rx="1.4" fill="#3d2a18"/></svg>`,
  ant: g`<svg viewBox="0 0 120 16" width="112" fill="#2b2118"><g class="march"><circle cx="8" cy="9" r="3"/><circle cx="14" cy="9" r="2.4"/><circle cx="20" cy="8.5" r="3.4"/></g><g class="march late"><circle cx="48" cy="9" r="3"/><circle cx="54" cy="9" r="2.4"/><circle cx="60" cy="8.5" r="3.4"/></g><g class="march"><circle cx="90" cy="9" r="3"/><circle cx="96" cy="9" r="2.4"/><circle cx="102" cy="8.5" r="3.4"/></g></svg>`,
  fly: g`<svg viewBox="0 0 24 20" width="20"><g class="wings"><ellipse cx="8" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/><ellipse cx="16" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/></g><ellipse cx="12" cy="12" rx="4.2" ry="5.4" fill="#2b2b33"/></svg>`,
  gecko: g`<svg viewBox="0 0 70 60" width="64"><path d="M70 30C52 22 40 14 26 16c-8 1-12 8-10 14s8 10 18 9c12-1 24-5 36-9z" fill="#7cb518"/><path d="M34 16l-6-10M46 20l-2-12M34 39l-6 12M48 36l0 12" stroke="#5c8a12" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="24" r="4" fill="#fff"/><circle cx="21" cy="24" r="2" fill="#123"/><circle cx="24" cy="34" r="4" fill="#fff"/><circle cx="23" cy="34" r="2" fill="#123"/></svg>`,
  balloon: g`<svg viewBox="0 0 40 60" width="34"><path d="M20 2C8 2 3 12 3 20c0 10 10 18 13 22h8c3-4 13-12 13-22C37 12 32 2 20 2z" fill="#e63946"/><path d="M20 2c-5 6-5 34-2 40M20 2c5 6 5 34 2 40" stroke="#ffd166" stroke-width="3" fill="none"/><path d="M15 44l2 8h6l2-8" stroke="#6b4a2b" stroke-width="1.4" fill="none"/><rect x="15" y="51" width="10" height="7" rx="1.5" fill="#8a5a2b"/></svg>`
}, xa = class xa extends j {
  constructor() {
    super(...arguments), this.look = "glass", this.theme = "sea", this.tod = "day", this.calm = !1, this.demo = "", this._guest = null, this._t = 0, this._n = 0;
  }
  /** The scene in play: the look, or for Glass the photo theme. */
  get _scene() {
    return this.look === "fridge" || this.look === "orbit" ? this.look : this.theme;
  }
  get _still() {
    return this.calm || typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  connectedCallback() {
    super.connectedCallback(), this._plan(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearTimeout(this._t);
  }
  updated(t) {
    t.has("demo") && this.demo && this._show(this.demo), t.has("calm") && this.calm && (this._guest = null);
  }
  /** The next guest comes after a while: sooner the first time, then every minute or two. */
  _plan(t = !1) {
    clearTimeout(this._t), this._t = window.setTimeout(() => {
      if (!this._still && !document.hidden && !this._guest) {
        const a = cs[this._scene] ?? [];
        a.length && this._show(a[Math.floor(Math.random() * a.length)]);
      }
      this._plan();
    }, (t ? 18e3 : 45e3) + Math.random() * (t ? 22e3 : 75e3));
  }
  _show(t) {
    if (!Ba[t] || this._still) return;
    const a = ++this._n;
    this._guest = { kind: t, id: a, y: Math.random() * 30, flip: Math.random() < 0.5 }, window.setTimeout(() => {
      this._guest?.id === a && (this._guest = null);
    }, se[t] + 400);
  }
  _always() {
    const t = this._scene, a = (i, o, s = u) => l`<i class="dot ${i}" style="--x:${o.x.toFixed(1)}%;--y:${o.y.toFixed(1)}%;--d:${o.d.toFixed(2)};--s:${o.s.toFixed(2)}">${s}</i>`;
    return t === "orbit" || t === "space" ? l`${ss.map((i, o) => l`<i class="layer" style="box-shadow:${i};--t:${[3.1, 4.7, 6.3][o]}s;animation-delay:${-o * 1.3}s"></i>`)}` : t === "sea" || t === "sunset" ? l`${rs.map((i) => a("glint", i))}` : t === "reef" ? l`${ns.map((i) => a("bubble", i))}` : t === "bush" ? this.tod === "day" ? l`${ps.map((i) => a("mote", i, Ba.leaf))}` : l`${ls.map((i) => a("firefly", i))}` : u;
  }
  _visit(t) {
    const a = { shoot: "streak", saucer: "across wobble", rocket: "across", comet: "streak", gulls: "across", fish: "across bobbing", turtle: "across bobbing", leaf: "down", butterfly: "flit", ant: "across foot", fly: "buzz", gecko: "peek", balloon: "up" }, i = t.kind === "fish" || t.kind === "turtle" ? 20 + t.y * 2 : t.kind === "gecko" ? 20 + t.y * 1.5 : t.kind === "butterfly" || t.kind === "fly" ? 4 + t.y * 0.3 : 1 + t.y * 0.3;
    return l`<span class="guest ${a[t.kind]}" data-kind=${t.kind} ?data-flip=${t.flip && !["gecko", "leaf", "balloon", "butterfly", "fly"].includes(t.kind)} style="--y:${i.toFixed(1)}%;--x:${(8 + t.y * 2.6).toFixed(1)}%;--t:${se[t.kind]}ms">${Ba[t.kind]}</span>`;
  }
  render() {
    return this._still ? u : l`${this._always()}${this._guest ? this._visit(this._guest) : u}`;
  }
};
xa.styles = G`
    :host { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; contain: strict; }
    @media (prefers-reduced-motion: reduce) { :host { display: none; } }
    .layer { position: absolute; left: 0; top: 0; width: 1px; height: 1px; border-radius: 50%; animation: twinkle var(--t, 4s) ease-in-out infinite alternate; }
    @keyframes twinkle { from { opacity: .15; } to { opacity: .95; } }
    .dot { position: absolute; left: var(--x); top: var(--y); border-radius: 50%; }
    .glint { width: 5px; height: 5px; background: #fff; box-shadow: 0 0 8px 2px rgba(255,255,255,.8); scale: var(--s); opacity: 0; animation: glint 5s ease-in-out infinite; animation-delay: calc(var(--d) * -1s); }
    @keyframes glint { 0%, 70%, 100% { opacity: 0; transform: scale(.4); } 82% { opacity: .9; transform: scale(1.2) rotate(45deg); } }
    .bubble { top: auto; bottom: -24px; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.7); scale: var(--s); animation: rise 13s linear infinite; animation-delay: calc(var(--d) * -1.6s); }
    @keyframes rise { from { transform: translate(0, 0); opacity: 0; } 12% { opacity: .8; } 50% { transform: translate(14px, -50vh); } to { transform: translate(-8px, -104vh); opacity: 0; } }
    .firefly { width: 5px; height: 5px; background: #fff3a8; box-shadow: 0 0 10px 3px rgba(255,243,168,.75); animation: glow 3.4s ease-in-out infinite alternate, drift 9s ease-in-out infinite alternate; animation-delay: calc(var(--d) * -1s); }
    @keyframes glow { from { opacity: .05; } to { opacity: .95; } } @keyframes drift { from { transform: translate(-14px, 8px); } to { transform: translate(16px, -12px); } }
    .mote { top: -30px; opacity: .55; animation: fall 26s linear infinite; animation-delay: calc(var(--d) * -3.2s); }
    @keyframes fall { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-22vw, 112vh) rotate(540deg); } }

    .guest { position: absolute; left: 0; top: var(--y); will-change: transform; color: rgba(40,50,70,.55); }
    .guest[data-flip] svg { transform: scaleX(-1); }
    .across { animation: across var(--t) linear both; } .guest[data-flip].across { animation-name: back; }
    @keyframes across { from { transform: translateX(-200px); } to { transform: translateX(calc(100vw + 60px)); } }
    @keyframes back { from { transform: translateX(calc(100vw + 60px)); } to { transform: translateX(-200px); } }
    .bobbing > svg, .wobble > svg { animation: bob 2.4s ease-in-out infinite alternate; } .wobble > svg { animation-duration: 1.1s; }
    @keyframes bob { from { translate: 0 -7px; rotate: -4deg; } to { translate: 0 7px; rotate: 4deg; } }
    .streak { animation: streak var(--t) ease-in both; } .guest[data-flip].streak { animation-name: streakb; }
    @keyframes streak { from { transform: translate(-10vw, 0) rotate(18deg); opacity: 0; } 15% { opacity: 1; } to { transform: translate(70vw, 26vh) rotate(18deg); opacity: 0; } }
    @keyframes streakb { from { transform: translate(105vw, 0) rotate(-18deg); opacity: 0; } 15% { opacity: 1; } to { transform: translate(25vw, 26vh) rotate(-18deg); opacity: 0; } }
    .up { left: var(--x); top: auto; bottom: -70px; animation: up var(--t) linear both; }
    @keyframes up { from { transform: translate(0, 0); } 50% { transform: translate(5vw, -55vh); } to { transform: translate(-2vw, -112vh); } }
    .down { left: var(--x); top: -40px; animation: down var(--t) ease-in-out both; }
    @keyframes down { from { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(7vw, 26vh) rotate(80deg); } 50% { transform: translate(-3vw, 54vh) rotate(-40deg); } 75% { transform: translate(6vw, 82vh) rotate(60deg); } to { transform: translate(0, 112vh) rotate(0deg); } }
    .flit { animation: flit var(--t) ease-in-out both; }
    @keyframes flit { from { transform: translate(-60px, 20vh); } 20% { transform: translate(22vw, -6vh); } 40% { transform: translate(40vw, 12vh); } 60% { transform: translate(58vw, -10vh); } 80% { transform: translate(80vw, 8vh); } to { transform: translate(calc(100vw + 40px), -4vh); } }
    .buzz { animation: buzz var(--t) linear both; }
    @keyframes buzz { from { transform: translate(-30px, 10vh); } 12% { transform: translate(18vw, -4vh); } 22% { transform: translate(30vw, 9vh); } 34% { transform: translate(44vw, 2vh); } 40%, 62% { transform: translate(52vw, 6vh); } 72% { transform: translate(64vw, -8vh); } 86% { transform: translate(84vw, 5vh); } to { transform: translate(calc(100vw + 30px), -6vh); } }
    .peek { left: auto; right: 0; animation: peek var(--t) ease-in-out both; }
    @keyframes peek { from, to { transform: translateX(100%); } 18%, 80% { transform: translateX(34%); } 30%, 34% { transform: translateX(34%) rotate(-5deg); } }
    .foot { top: auto; bottom: 4px; }
    .blink circle { animation: blink 1s steps(2, jump-none) infinite alternate; } .blink circle:nth-child(even) { animation-delay: -.5s; }
    @keyframes blink { to { opacity: .25; } }
    .flap { transform-box: fill-box; transform-origin: center; animation: flap .7s ease-in-out infinite alternate; } .flap.late { animation-delay: -.35s; }
    @keyframes flap { from { transform: scaleY(1); } to { transform: scaleY(.25); } }
    .wings { transform-box: fill-box; transform-origin: center; animation: wings .22s ease-in-out infinite alternate; }
    @keyframes wings { from { transform: scaleX(1); } to { transform: scaleX(.35); } }
    .flame { transform-box: fill-box; transform-origin: right center; animation: flame .16s linear infinite alternate; } @keyframes flame { to { transform: scaleX(.55); } }
    .paddle { transform-box: fill-box; transform-origin: top center; animation: paddle 1.4s ease-in-out infinite alternate; } @keyframes paddle { from { transform: rotate(-16deg); } to { transform: rotate(16deg); } }
    .march { animation: march .3s steps(2, jump-none) infinite alternate; } .march.late { animation-delay: -.15s; } @keyframes march { to { transform: translateY(-1.5px); } }
  `, xa.properties = { look: {}, theme: {}, tod: {}, calm: { type: Boolean }, demo: {}, _guest: { state: !0 } };
let si = xa;
customElements.get("fh-ambient") || customElements.define("fh-ambient", si);
const ds = {
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
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
  search: "M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM20 20l-4.7-4.7",
  sleeve: "M3.5 5h11v14h-11zM14.5 7.5a4.5 4.5 0 0 1 0 9M14.5 12h.01M7 9h4",
  jukebox: "M6 21V10a6 6 0 0 1 12 0v11zM6 14h12M9.5 17.5h5M12 7.5v3",
  radio: "M4 9h16v11H4zM7.5 9l8.5-5M8.5 12.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM14 13h3.5M14 16h3.5",
  dial: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v2.5",
  desk: "M6 4v16M12 4v16M18 4v16M4 9h4M10 15h4M16 7h4",
  plug: "M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4",
  scene: "M3 18h18M5.5 18l1.5 3h10l1.5-3M12 4v14M12 5l6 9h-6",
  list: "M4 6h16M4 12h16M4 18h16"
}, hs = {
  play: "M8 5.5v13l10.5-6.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  prev: "M6 6h2v12H6zM20 6v12L9.5 12z",
  next: "M16 6h2v12h-2zM4 6v12l10.5-6z"
}, F = (e, t = 22) => l`<svg class="i" aria-hidden="true" viewBox="0 0 24 24" style="--s:${t}px">${g`<path d=${ds[e] ?? ""}></path>`}</svg>`, v = (e, t = 22) => l`<svg aria-hidden="true" viewBox="0 0 24 24" style="width:${t}px;height:${t}px;fill:currentColor">${g`<path d=${hs[e] ?? ""}></path>`}</svg>`, ms = (e) => /rain|pour|storm|lightning/.test(e) ? "rain" : /cloud|fog/.test(e) ? "cloud" : /night/.test(e) ? "moon" : "sun", T = (e) => e === "family" || e === void 0 ? "var(--p-family)" : `var(--p-${e})`, us = (e) => e.toLowerCase().replace(/[^a-z0-9]+/g, "_"), E = (e) => {
  const t = us(e.name);
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
}, nt = (e, t) => {
  const a = Number(e?.states[t]?.state);
  return Number.isFinite(a) ? a : 0;
}, gs = ["qwertyuiop", "asdfghjkl", "zxcvbnm"], ga = (e, t, a) => {
  if (t === "del") {
    const i = e.slice(0, -1);
    return [i, !i.length];
  }
  return t === " " ? [e + " ", a] : [e + (a ? t.toUpperCase() : t), !1];
}, Ka = (e, t, a, i = !1) => l`
  <div class="keys ${i ? "compact" : ""}" role="group" aria-label="Keyboard">
    ${gs.map((o, s) => l`<div class="krow">
      ${s === 2 ? l`<button class="key wide" aria-label="Capital letter" aria-pressed=${String(t)} @click=${a}>⇧</button>` : u}
      ${[...o].map((r) => l`<button class="key" @click=${() => e(r)}>${t ? r.toUpperCase() : r}</button>`)}
      ${s === 2 ? l`<button class="key wide" aria-label="Delete" @click=${() => e("del")}>⌫</button>` : u}
    </div>`)}
    <div class="krow"><button class="key space" aria-label="Space" @click=${() => e(" ")}>space</button></div>
  </div>`, wi = G`
  .keys { display: flex; flex-direction: column; gap: 8px; }
  .krow { display: flex; gap: 8px; justify-content: center; }
  .key { width: 64px; height: 64px; border-radius: 14px; background: var(--chip-strong); box-shadow: 0 2px 0 rgba(0,0,0,.12); font-size: 24px; font-weight: 500; transition: transform .1s ease; }
  .key:active { transform: scale(.92); background: var(--chip); }
  .key.wide { width: 96px; font-size: 20px; }
  .key.wide[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
  .key.space { width: 420px; font-size: 17px; }
  .keys.compact, .keys.compact .krow { gap: 6px; }
  .keys.compact .key { width: 56px; height: 48px; border-radius: 12px; font-size: 22px; }
  .keys.compact .key.wide { width: 84px; font-size: 18px; }
  .keys.compact .key.space { width: 420px; font-size: 16px; }
`, Ks = [
  ["Frozen", "--p-1", "frozen|ice cream|icecream|ice block|icy pole|frozen peas|ice"],
  ["Household", "--p-5", "dishwasher tablet|tablet|detergent|soap|shampoo|conditioner|toothpaste|paper towel|tissue|toilet|foil|cling wrap|glad wrap|baking paper|bin liner|bag|clean|spray|sponge|nappy|nappies|wipes|battery|batteries"],
  ["Pantry", "--p-3", "peanut butter|pasta|rice|flour|sugar|oil|sauce|cereal|weet-bix|weetbix|oats|coffee|tea|honey|jam|vegemite|peanut|stock|spice|salt|pepper|noodle|bean|lentil|tin|can|biscuit|cracker|chip|snack|chocolate|nut|muesli"],
  ["Fruit & veg", "--p-4", "watermelon|apple|banana|avocado|orange|lemon|lime|grape|berr|melon|mango|pear|peach|kiwi|tomato|potato|onion|garlic|carrot|lettuce|spinach|broccoli|cauli|capsicum|cucumber|zucchini|mushroom|herb|coriander|basil|salad|corn|pumpkin|celery|ginger|fruit|veg"],
  ["Dairy & eggs", "--p-1", "milk|cheese|yoghurt|yogurt|butter|cream|egg|custard"],
  ["Bakery", "--accent", "bread|sourdough|roll|wrap|bagel|muffin|croissant|bun|loaf|tortilla|crumpet"],
  ["Meat & fish", "--p-2", "chicken|beef|lamb|pork|mince|sausage|bacon|ham|steak|fish|salmon|prawn|tuna|turkey|meat"],
  ["Drinks", "--p-4", "juice|water|soft drink|soda|cordial|beer|wine|kombucha"]
], fs = Ks.map(([e, t, a]) => [e, t, new RegExp(`\\b(${a})`)]), aa = (e) => {
  const t = e.toLowerCase();
  for (const [a, i, o] of fs) if (o.test(t)) return [a, i];
  return ["Other", "--p-family"];
}, ba = class ba extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.fitCtl = new yt(this), this.entity = "todo.shopping_list", this.usuals = ["Milk", "Bread", "Eggs", "Bananas", "Cheese", "Coffee"], this.recipients = [], this._items = [], this._typed = "", this._caps = !0, this._toast = "", this._subFor = "";
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._unsub?.(), this._unsub = void 0, this._subFor = "";
  }
  updated(t) {
    (t.has("hass") || t.has("entity")) && this.hass && this._subFor !== this.entity && this._subscribe(), this.renderRoot.querySelectorAll(".scrolly").forEach(Z);
  }
  async _subscribe() {
    this._unsub?.(), this._subFor = this.entity;
    const t = this.hass?.connection;
    if (t)
      try {
        this._unsub = await t.subscribeMessage((a) => {
          this._items = a.items;
        }, { type: "todo/item/subscribe", entity_id: this.entity });
      } catch (a) {
        console.warn("Family Hub: grocery subscribe failed", a);
      }
  }
  _say(t) {
    this._toast = t, clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => {
      this._toast = "";
    }, 2600);
  }
  _add(t = this._typed) {
    const a = t.trim();
    if (!a || !this.hass) return;
    const i = a.charAt(0).toUpperCase() + a.slice(1);
    if (this._items.some((o) => o.status === "needs_action" && o.summary.toLowerCase() === i.toLowerCase())) {
      this._say(`${i} is already on the list`), this._typed = "", this._caps = !0;
      return;
    }
    this.hass.callService("todo", "add_item", { item: i }, { entity_id: this.entity }), this._typed = "", this._caps = !0;
  }
  _toggle(t) {
    this.hass?.callService("todo", "update_item", { item: t.uid, status: t.status === "completed" ? "needs_action" : "completed" }, { entity_id: this.entity });
  }
  _clearDone() {
    this.hass?.callService("todo", "remove_completed_items", {}, { entity_id: this.entity });
  }
  _send(t) {
    const a = this._items.filter((r) => r.status === "needs_action");
    if (!a.length) {
      this._say("The list is empty");
      return;
    }
    const i = t.notify?.replace(/^notify\./, "");
    if (!i || !this.hass?.services?.notify?.[i]) {
      this._say(`Set up the Home Assistant app on ${t.name}’s phone first`);
      return;
    }
    const o = /* @__PURE__ */ new Map();
    for (const r of a) {
      const n = aa(r.summary)[0];
      o.set(n, [...o.get(n) ?? [], r.summary]);
    }
    const s = [...o].map(([r, n]) => `${r}: ${n.join(", ")}`).join(`
`);
    this.hass.callService("notify", i, { title: `Groceries (${a.length})`, message: s, data: { url: "/todo?entity_id=" + this.entity } }), this._say(`List sent to ${t.name}’s phone`);
  }
  render() {
    const t = this._items.filter((o) => o.status === "needs_action"), a = this._items.filter((o) => o.status === "completed"), i = [...t].sort((o, s) => aa(o.summary)[0].localeCompare(aa(s.summary)[0]));
    return l`
      <section class="glass list" aria-label="Shopping list">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h1 class="t-title">Groceries</h1>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${t.length} to buy</span>
        </div>
        <div class="items scrolly" data-fits @scroll=${Z}>
          ${i.map((o) => this._row(o))}
          ${a.length ? l`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="label">In the trolley</span>
            <button class="tap muted" style="font-size:13px;font-weight:var(--w-bold, 700)" @click=${() => this._clearDone()}>Clear ${a.length}</button></div>
            ${a.map((o) => this._row(o))}` : u}
          ${this._items.length ? u : l`<div class="empty"><span style="color:var(--accent)">${F("cart", 40)}</span><span>Nothing on the list yet</span></div>`}
        </div>
        <span class="muted" style="font-size:12px">Also live in the Home Assistant app – tick things off in the shop.</span>
      </section>

      <section class="glass add" aria-label="Add an item">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600);flex:1">Send the list to</span>
          ${this.recipients.map((o) => l`<button class="who glass tap" @click=${() => this._send(o)}>
            <span class="avatar" style="width:34px;height:34px;font-size:14px;background:${T(o.colour)}">${o.name[0]}</span>${o.name}</button>`)}
          ${this.recipients.length ? u : l`<span class="muted" style="font-size:13px">(add phones in the card settings)</span>`}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <input class="field" .value=${this._typed} inputmode=${D() === "phone" ? "text" : "none"} autocomplete="off" placeholder="Type an item…" aria-label="New item"
            @input=${(o) => {
      this._typed = o.target.value;
    }}
            @keydown=${(o) => {
      o.key === "Enter" && this._add();
    }} />
          <button class="tap primary" style="height:60px;padding:0 26px;border-radius:16px;font-size:18px;font-weight:var(--w-bold, 700)" @click=${() => this._add()}>Add</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="muted" style="font-size:13px;font-weight:var(--w-bold, 700);margin-right:4px">Usuals</span>
          ${this.usuals.map((o) => l`<button class="chip quick tap" @click=${() => this._add(o)}>+ ${o}</button>`)}
        </div>
        ${Ka((o) => {
      [this._typed, this._caps] = ga(this._typed, o, this._caps);
    }, this._caps, () => {
      this._caps = !this._caps;
    })}
      </section>
      ${this._toast ? l`<div class="toast" role="status">${this._toast}</div>` : u}`;
  }
  _row(t) {
    const [a, i] = aa(t.summary), o = t.status === "completed" ? "done" : "";
    return l`<button class="item row tap fade ${o}" aria-pressed=${String(t.status === "completed")} @click=${() => this._toggle(t)}>
      <span class="box check">${t.status === "completed" ? l`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : u}</span>
      <span class="txt content">${t.summary}</span>
      <span class="tag" style="color:color-mix(in srgb, var(${i}) 62%, var(--ink));background:color-mix(in srgb, var(${i}) 14%, transparent)">${a}</span>
    </button>`;
  }
};
ba.styles = [_, wi, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .list { width: 420px; flex-shrink: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
    .items { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 14px; background: var(--chip); width: 100%; text-align: left; }
    .box { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink3); }
    .done .box { background: var(--ok); border-color: var(--ok); color: #fff; }
    .done .txt { color: var(--ink3); text-decoration: line-through; }
    .txt { flex: 1; font-size: 17px; font-weight: var(--w-semi, 600); }
    .tag { font-size: 12px; font-weight: var(--w-bold, 700); padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
    .items[data-fit] { gap: 3px; }
    .items[data-fit] .item { padding: 6px 10px; }
    .items[data-fit] .txt { font-size: 15px; }
    .items[data-fit] .box { width: 22px; height: 22px; }
    .list:has(.items[data-fit='2']), .list:has(.items[data-fit='3']) { width: 560px; }
    .items[data-fit='2'], .items[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px; align-content: start; }
    .items[data-fit='2'] > :not(.item), .items[data-fit='3'] > :not(.item) { grid-column: 1 / -1; }
    .items[data-fit='2'] .tag, .items[data-fit='3'] .tag { display: none; }
    /* the wider list borrows room from the keyboard, so its keys slim down a little */
    .list:has(.items[data-fit='2']) + .add .key, .list:has(.items[data-fit='3']) + .add .key { width: 52px; height: 58px; }
    .list:has(.items[data-fit='2']) + .add .key.wide, .list:has(.items[data-fit='3']) + .add .key.wide { width: 78px; }
    .list:has(.items[data-fit='2']) + .add .key.space, .list:has(.items[data-fit='3']) + .add .key.space { width: 340px; }
    :host([data-shape='tall']) .items[data-fit='3'] { grid-template-columns: repeat(3, 1fr); }
    :host([data-shape='tall']) .items[data-fit] .tag { display: inline; }
    :host([data-shape='tall']) .add .key:not(.wide):not(.space) { width: 64px !important; height: 64px !important; }
    :host([data-shape='tall']) .add .key.space { width: 420px !important; }
    :host([data-shape='tall']) .add .key.wide { width: 96px !important; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .list { width: auto !important; flex: 1; min-height: 0; }
    :host([data-shape='tall']) .add { flex: 0 0 auto; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .add { order: -1; padding: 14px; border-radius: 22px; }
    :host([data-phone]) .list { flex: none; padding: 14px; border-radius: 22px; }
    :host([data-phone]) .items { overflow: visible; flex: none; display: flex !important; }
    :host([data-phone]) .items .tag { display: inline !important; }
    .add { flex: 1; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .field { flex: 1; height: 60px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); outline: none; }
    .field::placeholder { color: var(--ink3); font-weight: 500; }
    .keys { flex: 1; justify-content: flex-end; }
    .chip { height: 38px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
    .who { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
  `], ba.properties = {
  hass: { attribute: !1 },
  entity: {},
  usuals: { attribute: !1 },
  recipients: { attribute: !1 },
  _items: { state: !0 },
  _typed: { state: !0 },
  _caps: { state: !0 },
  _toast: { state: !0 }
};
let ri = ba;
customElements.get("fh-groceries") || customElements.define("fh-groceries", ri);
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Us = (e) => (...t) => ({ _$litDirective$: e, values: t });
let xs = class {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, a, i) {
    this._$Ct = t, this._$AM = a, this._$Ci = i;
  }
  _$AS(t, a) {
    return this.update(t, a);
  }
  update(t, a) {
    return this.render(...a);
  }
};
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const bs = {}, As = (e, t = bs) => e._$AH = t;
/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const vi = Us(class extends xs {
  constructor() {
    super(...arguments), this.key = u;
  }
  render(e, t) {
    return this.key = e, t;
  }
  update(e, [t, a]) {
    return t !== this.key && (As(e), this.key = t), a;
  }
}), qs = {
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
  scene: "plain",
  eyeColour: "none",
  freckles: "no",
  mole: "no"
}, Ye = [["skin", "s"], ["hair", "h"], ["hairColour", "hc"], ["eyes", "e"], ["mouth", "m"], ["hat", "a"], ["eyewear", "u"], ["top", "t"], ["topColour", "tc"], ["gear", "g"], ["buddy", "b"], ["scene", "sc"], ["eyeColour", "ec"], ["freckles", "fr"], ["mole", "mo"]], Ya = (e) => Ye.map(([t, a]) => `${a}=${String(e[t]).replace("#", "")}`).join(";"), Ft = (e, t = {}) => {
  const a = { ...qs, ...t };
  if (!e || e === "unknown" || !e.includes("=")) return a;
  const i = Object.fromEntries(e.split(";").map((o) => o.split("=")));
  for (const [o, s] of Ye) i[s] && (a[o] = /colour|skin/i.test(o) && /^[0-9a-f]{3,8}$/i.test(i[s]) ? `#${i[s]}` : i[s]);
  return a;
}, Ut = [
  {
    id: "hair",
    emoji: "💇",
    label: "Hair",
    key: "hair",
    crop: "head",
    items: [["fringe", "Side fringe", 0], ["styled", "Styled spikes", 0], ["crop", "Textured crop", 0], ["mop", "Messy mop", 0], ["short", "Short", 0], ["quiff", "Styled quiff", 0], ["swept", "Swept", 0], ["pageboy", "Page boy", 0], ["spiky", "Spiky", 0], ["curly", "Curly", 0], ["buzz", "Buzz cut", 0], ["surfer", "Surfer", 300], ["mohawk", "Mohawk", 1100], ["mullet", "Mullet", 1600]],
    swatch: { key: "hairColour", label: "Colour", items: [["#5a3825", "Brown", 0], ["#3a2a1f", "Deep brown", 0], ["#2a1d16", "Dark brown", 0], ["#a87445", "Golden brown", 0], ["#b38b55", "Dirty blond", 0], ["#c49a5c", "Golden blond", 0], ["#151110", "Black", 0], ["#e3b85c", "Blonde", 0], ["#c0592b", "Ginger", 0], ["#2f6fe0", "Electric blue", 700], ["#e2559b", "Hot pink", 1400], ["#22c55e", "Slime green", 2e3]] }
  },
  {
    id: "face",
    emoji: "🙂",
    label: "Face",
    key: "eyes",
    crop: "head",
    items: [
      ["eyes:normal", "Bright eyes", 0],
      ["eyes:happy", "Happy eyes", 0],
      ["eyes:wink", "Wink", 0],
      ["eyeColour:#5b8db8", "Blue eyes", 0],
      ["eyeColour:#6b7f86", "Grey-blue eyes", 0],
      ["eyeColour:#7a6a3a", "Hazel eyes", 0],
      ["eyeColour:#6b4428", "Brown eyes", 0],
      ["eyeColour:none", "Cartoon eyes", 0],
      ["mouth:smile", "Smile", 0],
      ["mouth:cheeky", "Cheeky grin", 0],
      ["mouth:grin", "Big grin", 0],
      ["mouth:smirk", "Smirk", 0],
      ["mouth:wow", "Wow", 0],
      ["freckles:yes", "Freckles", 0],
      ["freckles:no", "No freckles", 0]
    ],
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
    swatch: { key: "topColour", label: "Colour", items: [["#0b5fa5", "Blue", 0], ["#1d4ed8", "Royal blue", 0], ["#38bdf8", "Sky blue", 0], ["#1e293b", "Navy", 0], ["#0f766e", "Teal", 0], ["#16a34a", "Green", 0], ["#c2410c", "Orange", 0], ["#be185d", "Pink", 0], ["#6d28d9", "Purple", 0], ["#334155", "Charcoal", 0], ["#f5b301", "Yellow", 0]] }
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
], Bt = Ut.flatMap((e) => [
  ...e.items.filter((t) => t[2] > 0 && !t[3]).map((t) => ({ cat: e, id: t[0], label: t[1], req: t[2] })),
  ...e.swatch?.items.filter((t) => t[2] > 0).map((t) => ({ cat: e, id: t[0], label: `${t[1]} ${e.id === "hair" ? "hair" : ""}`.trim(), req: t[2], swatch: !0 })) ?? []
]).sort((e, t) => e.req - t.req), ks = (e, t) => Bt.filter((a) => a.req > e && a.req <= t), Je = Ut.flatMap((e) => e.items.filter((t) => t[3]).map((t) => ({ cat: e, id: t[0], label: t[1], req: t[3] }))), Fs = (e, t) => Je.filter((a) => a.req > e && a.req <= t), Nt = (e, t, a) => e[3] ? a >= e[3] : t >= e[2], Tt = ["Explorer", "Ranger", "Navigator", "Captain", "Commander", "Admiral", "Legend", "Mythic", "Cosmic"], ys = (e) => {
  let t = 1, a = 0, i = 100;
  for (; e >= a + i; )
    a += i, t++, i = 100 + 50 * (t - 1);
  const o = Math.min(Tt.length - 1, Math.floor((t - 1) / 2));
  return { level: t, rank: `${Tt[o]}${(t - 1) % 2 ? " II" : ""}`, into: e - a, need: i, nextRank: t % 2 ? `${Tt[o]} II` : Tt[Math.min(Tt.length - 1, o + 1)] };
}, Ie = (e, t = [], a) => {
  if (a) {
    const s = Bt.find((r) => r.id === a && r.req > e);
    if (s) return s;
  }
  const i = Bt.find((s) => s.req > e);
  if (!i) return;
  const o = Bt.filter((s) => s.req > e && t.includes(s.id)).sort((s, r) => s.req - r.req)[0];
  return o && o.req <= i.req + 100 ? o : i;
}, Oe = (e) => Bt.filter((t) => t.req <= e).reduce((t, a) => Math.max(t, a.req), 0), xt = (e, t, a, i = !1) => {
  if (i && t.swatch) return { ...e, [t.swatch.key]: a };
  if (a.includes(":")) {
    const [o, s] = a.split(":");
    return { ...e, [o]: s };
  }
  return { ...e, [t.key]: a };
}, Rs = (e, t, a) => {
  if (a.includes(":")) {
    const [i, o] = a.split(":");
    return e[i] === o;
  }
  return e[t.key] === a;
}, ni = (e, t, a) => {
  const i = [];
  for (let o = 0; o < 10; o++) {
    const s = -Math.PI / 2 + o * Math.PI / 5, r = o % 2 ? a * 0.45 : a;
    i.push(`${(e + Math.cos(s) * r).toFixed(1)} ${(t + Math.sin(s) * r).toFixed(1)}`);
  }
  return `M${i.join(" L")} Z`;
}, J = "M30 240 C32 190 62 166 100 166 C138 166 168 190 170 240 Z", re = {
  plain: () => g`<g class="av-pop"><rect width="200" height="240" fill="#dbeafe"></rect><circle cx="100" cy="120" r="82" fill="#bfdbfe"></circle></g>`,
  beach: () => g`<g class="av-pop"><rect width="200" height="240" fill="#9fd8f5"></rect><circle cx="162" cy="46" r="18" fill="#ffd166"></circle><rect y="150" width="200" height="40" fill="#3a9ad9"></rect><rect y="168" width="200" height="4" fill="#bfe6f7"></rect><rect y="190" width="200" height="50" fill="#f1d39b"></rect></g>`,
  pool: () => g`<g class="av-pop"><rect width="200" height="240" fill="#38bdf8"></rect><rect y="40" width="200" height="6" fill="#e0f2fe"></rect><rect y="100" width="200" height="6" fill="#e0f2fe"></rect><rect y="160" width="200" height="6" fill="#e0f2fe"></rect><rect y="70" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="130" width="200" height="4" fill="#ef4444" opacity=".7"></rect><rect y="190" width="200" height="4" fill="#ef4444" opacity=".7"></rect></g>`,
  court: () => g`<g class="av-pop"><rect width="200" height="240" fill="#2563eb"></rect><rect x="12" y="12" width="176" height="216" fill="none" stroke="#fff" stroke-width="3"></rect><rect x="12" y="118" width="176" height="4" fill="#fff"></rect><rect x="98" y="12" width="4" height="216" fill="#fff" opacity=".6"></rect><circle cx="40" cy="60" r="7" fill="#d9f99d"></circle></g>`,
  library: () => g`<g class="av-pop"><rect width="200" height="240" fill="#7c2d12"></rect>${[30, 80, 130, 180].map((e) => g`<rect y=${e + 34} width="200" height="6" fill="#451a03"></rect>${[8, 22, 34, 48, 60, 150, 162, 176, 188].map((t, a) => g`<rect x=${t} y=${e} width="10" height="34" fill=${["#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed"][(a + e) % 5]}></rect>`)}`)}</g>`,
  sunset: () => g`<g class="av-pop"><rect width="200" height="240" fill="#f7a35c"></rect><rect y="96" width="200" height="144" fill="#e76f51"></rect><circle cx="100" cy="150" r="56" fill="#ffd166"></circle><rect y="190" width="200" height="50" fill="#9c3d54"></rect></g>`,
  reef: () => g`<g class="av-pop"><rect width="200" height="240" fill="#1aa3b8"></rect><rect y="196" width="200" height="44" fill="#0e7490"></rect><circle cx="30" cy="60" r="6" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="40" cy="40" r="4" fill="none" stroke="#d6fbff" stroke-width="2"></circle><circle cx="170" cy="80" r="7" fill="none" stroke="#d6fbff" stroke-width="2"></circle><path d="M12 240 C14 214 22 206 28 200 C30 214 26 226 30 240 Z" fill="#fb7185"></path><path d="M176 240 C178 220 186 208 192 204 C194 220 188 230 192 240 Z" fill="#fbbf24"></path></g>`,
  volcano: () => g`<g class="av-pop"><rect width="200" height="240" fill="#fde68a"></rect><path d="M110 150 L150 40 L170 40 L200 150 Z" fill="#57534e"></path><path d="M150 40 L170 40 L164 70 L156 60 Z" fill="#f97316"></path><circle cx="162" cy="24" r="10" fill="#a8a29e" opacity=".7"></circle><rect y="150" width="200" height="90" fill="#65a30d"></rect><path d="M0 170 C20 150 30 170 40 160 C50 150 60 170 70 158" fill="none" stroke="#3f6212" stroke-width="5"></path></g>`,
  stadium: () => g`<g class="av-pop"><rect width="200" height="240" fill="#1e293b"></rect><rect y="160" width="200" height="80" fill="#16a34a"></rect><rect y="196" width="200" height="6" fill="#86efac"></rect><circle cx="28" cy="28" r="10" fill="#fff7c2"></circle><circle cx="172" cy="28" r="10" fill="#fff7c2"></circle><rect x="26" y="38" width="4" height="122" fill="#64748b"></rect><rect x="170" y="38" width="4" height="122" fill="#64748b"></rect></g>`,
  castle: () => g`<g class="av-pop"><rect width="200" height="240" fill="#c7d2fe"></rect><rect x="20" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="146" y="70" width="34" height="120" fill="#94a3b8"></rect><rect x="20" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="34" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="46" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="146" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="158" y="60" width="8" height="12" fill="#94a3b8"></rect><rect x="172" y="60" width="8" height="12" fill="#94a3b8"></rect><path d="M162 60 V30 L180 38 L162 46" fill="#dc2626" stroke="#475569" stroke-width="2"></path><rect y="190" width="200" height="50" fill="#4d7c0f"></rect></g>`,
  rottnest: () => g`<g class="av-pop"><rect width="200" height="240" fill="#7dd3fc"></rect><rect y="140" width="200" height="50" fill="#22d3ee"></rect><rect y="152" width="200" height="38" fill="#0ea5e9"></rect><path d="M0 190 C40 176 70 184 100 180 C140 174 170 182 200 176 L200 240 L0 240 Z" fill="#fde7b0"></path><rect x="150" y="96" width="10" height="46" fill="#f5f5f4"></rect><path d="M146 96 L164 96 L155 84 Z" fill="#dc2626"></path><circle cx="40" cy="40" r="14" fill="#fde047"></circle></g>`,
  forge: () => g`<g class="av-pop"><rect width="200" height="240" fill="#292524"></rect><rect y="180" width="200" height="60" fill="#44403c"></rect><path d="M120 180 L130 130 L190 130 L200 180 Z" fill="#57534e"></path><ellipse cx="160" cy="150" rx="22" ry="10" fill="#f97316" class="av-flame"></ellipse><ellipse cx="160" cy="146" rx="12" ry="6" fill="#fde047" class="av-flame"></ellipse><rect x="18" y="40" width="40" height="26" rx="3" fill="#78716c"></rect><rect x="24" y="66" width="6" height="40" fill="#78716c"></rect>${[[30, 20], [80, 30], [176, 24]].map(([e, t]) => g`<circle cx=${e} cy=${t} r="2" fill="#fb923c"></circle>`)}</g>`,
  space: () => g`<g class="av-pop"><rect width="200" height="240" fill="#14163a"></rect><circle cx="38" cy="48" r="16" fill="#f0a35e"></circle><ellipse cx="38" cy="48" rx="27" ry="6" fill="none" stroke="#ffd7a8" stroke-width="2.5"></ellipse>${[[150, 30], [176, 74], [120, 18], [20, 120], [182, 140], [70, 22], [14, 190]].map(([e, t]) => g`<circle cx=${e} cy=${t} r="1.6" fill="#fff"></circle>`)}</g>`
}, ne = { rottnest: "#7dd3fc", forge: "#57534e", plain: "#dbeafe", beach: "#9fd8f5", pool: "#38bdf8", court: "#2563eb", library: "#7c2d12", sunset: "#f7a35c", reef: "#1aa3b8", volcano: "#fde68a", stadium: "#16a34a", castle: "#c7d2fe", space: "#14163a" }, le = {
  surfboard: () => g`<g class="av-pop d6"><g transform="rotate(-16 158 150)"><ellipse cx="158" cy="150" rx="17" ry="82" fill="#f97316"></ellipse><rect x="155" y="70" width="6" height="160" fill="#fff" opacity=".85"></rect></g></g>`,
  skateboard: () => g`<g class="av-pop d6"><g transform="rotate(18 40 160)"><rect x="30" y="90" width="22" height="124" rx="11" fill="#7c3aed"></rect><rect x="34" y="98" width="14" height="108" rx="7" fill="#a78bfa"></rect><circle cx="28" cy="112" r="5" fill="#f5b301"></circle><circle cx="54" cy="112" r="5" fill="#f5b301"></circle><circle cx="28" cy="192" r="5" fill="#f5b301"></circle><circle cx="54" cy="192" r="5" fill="#f5b301"></circle></g></g>`,
  bat: () => g`<g class="av-pop d6"><g transform="rotate(-24 160 150)"><rect x="152" y="70" width="8" height="40" rx="3" fill="#7c4a1e"></rect><rect x="146" y="106" width="20" height="104" rx="6" fill="#f3d9a4" stroke="#c9a46a" stroke-width="2"></rect></g></g>`,
  racquet: () => g`<g class="av-pop d6"><g transform="rotate(24 160 120)"><ellipse cx="160" cy="98" rx="24" ry="30" fill="rgba(255,255,255,.25)" stroke="#16a34a" stroke-width="6"></ellipse><path d="M140 98 H180 M160 70 V126 M150 74 V122 M170 74 V122 M142 86 H178 M142 110 H178" stroke="#e5e7eb" stroke-width="1.4"></path><rect x="156" y="128" width="8" height="46" rx="3" fill="#111827"></rect></g><circle cx="182" cy="168" r="9" fill="#d9f99d" stroke="#a3e635" stroke-width="2"></circle></g>`,
  scooter: () => g`<g class="av-pop d6"><rect x="20" y="118" width="6" height="104" rx="3" fill="#94a3b8" transform="rotate(-8 23 170)"></rect><rect x="6" y="114" width="30" height="7" rx="3.5" fill="#0f172a"></rect><rect x="18" y="220" width="72" height="9" rx="4.5" fill="#ef4444"></rect><circle cx="26" cy="232" r="7" fill="#111"></circle><circle cx="84" cy="232" r="7" fill="#111"></circle></g>`,
  clarinet: () => g`<g class="av-pop d6"><g transform="rotate(20 150 180)"><rect x="146" y="112" width="10" height="114" rx="4" fill="#1f2937"></rect><rect x="148" y="104" width="6" height="10" rx="2" fill="#111"></rect><path d="M140 224 L162 224 L168 240 L134 240 Z" fill="#111827"></path>${[132, 150, 168, 186, 204].map((e) => g`<circle cx="151" cy=${e} r="2.6" fill="#d1d5db"></circle>`)}</g></g>`
}, pe = {
  footy: () => g`<g class="av-pop d6"><g transform="rotate(-28 150 212)"><ellipse cx="150" cy="212" rx="24" ry="15" fill="#b91c1c"></ellipse><path d="M140 212 H160 M144 208 V216 M150 208 V216 M156 208 V216" stroke="#fff" stroke-width="2" stroke-linecap="round"></path></g></g>`,
  trumpet: () => g`<g class="av-pop d6"><g transform="rotate(-18 150 206)"><rect x="104" y="202" width="66" height="8" rx="3" fill="#e0a800"></rect><path d="M166 190 L192 178 L192 234 L166 222 Z" fill="#f5c400" stroke="#c99700" stroke-width="1.5"></path><rect x="124" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="134" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="144" y="190" width="6" height="13" rx="2" fill="#c99700"></rect><rect x="98" y="200" width="8" height="12" rx="3" fill="#a16207"></rect></g></g>`,
  books: () => g`<g class="av-pop d6"><rect x="36" y="214" width="56" height="12" rx="2" fill="#f59e0b"></rect><rect x="32" y="202" width="56" height="12" rx="2" fill="#dc2626"></rect><rect x="38" y="190" width="50" height="12" rx="2" fill="#2563eb"></rect><rect x="34" y="178" width="54" height="12" rx="2" fill="#16a34a"></rect><rect x="40" y="181" width="40" height="2" fill="#bbf7d0"></rect><rect x="38" y="205" width="40" height="2" fill="#fecaca"></rect></g>`,
  truck: () => g`<g class="av-pop d6"><path d="M124 204 L162 196 L164 224 L126 224 Z" fill="#facc15" stroke="#ca8a04" stroke-width="2"></path><rect x="162" y="202" width="26" height="24" rx="4" fill="#f97316"></rect><rect x="168" y="206" width="14" height="9" rx="2" fill="#bae6fd"></rect><circle cx="138" cy="230" r="8" fill="#111"></circle><circle cx="178" cy="230" r="8" fill="#111"></circle><circle cx="138" cy="230" r="3" fill="#9ca3af"></circle><circle cx="178" cy="230" r="3" fill="#9ca3af"></circle></g>`,
  miniature: () => g`<g class="av-pop d6"><ellipse cx="160" cy="232" rx="20" ry="5" fill="#334155"></ellipse><path d="M150 230 L152 202 L168 202 L170 230 Z" fill="#7c3aed"></path><path d="M146 206 L154 206 L154 222 L146 222 Z" fill="#b91c1c" stroke="#fde68a" stroke-width="1.5"></path><circle cx="160" cy="194" r="9" fill="#9ca3af"></circle><rect x="153" y="192" width="14" height="3" fill="#1f2937"></rect><rect x="170" y="176" width="3" height="40" fill="#e5e7eb"></rect><rect x="166" y="206" width="11" height="3" fill="#a16207"></rect></g>`
}, ce = {
  quokka: () => g`<g class="av-pop d6"><ellipse cx="32" cy="214" rx="20" ry="22" fill="#a16207"></ellipse><ellipse cx="32" cy="220" rx="11" ry="13" fill="#d6b88a"></ellipse><circle cx="32" cy="186" r="14" fill="#a16207"></circle><circle cx="22" cy="176" r="5" fill="#a16207"></circle><circle cx="42" cy="176" r="5" fill="#a16207"></circle><circle cx="27" cy="184" r="2" fill="#111"></circle><circle cx="37" cy="184" r="2" fill="#111"></circle><ellipse cx="32" cy="191" rx="4" ry="3" fill="#3f2a14"></ellipse><path d="M27 195 Q32 200 37 195" fill="none" stroke="#3f2a14" stroke-width="1.6"></path></g>`,
  raven: () => g`<g class="av-pop d6"><ellipse cx="32" cy="210" rx="16" ry="22" fill="#111827"></ellipse><circle cx="34" cy="184" r="11" fill="#111827"></circle><path d="M43 184 L58 188 L43 191 Z" fill="#78716c"></path><circle cx="37" cy="181" r="2.2" fill="#fbbf24"></circle><path d="M18 204 C6 214 10 230 20 232 Z" fill="#1f2937"></path><path d="M26 230 L22 240 M36 230 L38 240" stroke="#78716c" stroke-width="2.5"></path></g>`,
  owl: () => g`<g class="av-pop d6"><ellipse cx="30" cy="206" rx="20" ry="24" fill="#a16207"></ellipse><ellipse cx="30" cy="212" rx="12" ry="14" fill="#fde68a"></ellipse><circle cx="22" cy="196" r="7" fill="#fff"></circle><circle cx="38" cy="196" r="7" fill="#fff"></circle><circle cx="22" cy="196" r="3" fill="#111"></circle><circle cx="38" cy="196" r="3" fill="#111"></circle><path d="M27 203 L33 203 L30 208 Z" fill="#f97316"></path><path d="M12 184 L18 176 L22 186 M48 184 L42 176 L38 186" fill="#a16207"></path></g>`,
  dino: () => g`<g class="av-pop d6"><path d="M6 236 L18 202 C22 184 38 176 52 182 L66 166 C76 160 86 166 82 176 L72 186 C76 200 72 216 60 224 L60 238 L50 238 L48 228 L32 228 L30 238 L20 238 Z" fill="#0d9488"></path><circle cx="74" cy="171" r="2.4" fill="#111"></circle><path d="M30 186 L36 176 L40 186 M42 182 L48 172 L52 182" fill="#5eead4"></path><path d="M66 192 L58 198" stroke="#0f766e" stroke-width="3" stroke-linecap="round"></path></g>`,
  turtle: () => g`<g class="av-pop d6"><ellipse cx="34" cy="220" rx="26" ry="15" fill="#16a34a"></ellipse><path d="M14 220 L54 220 M24 208 L28 232 M44 208 L40 232" stroke="#14532d" stroke-width="2"></path><circle cx="64" cy="216" r="8" fill="#4ade80"></circle><circle cx="66" cy="214" r="1.8" fill="#111"></circle><ellipse cx="16" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse><ellipse cx="50" cy="234" rx="6" ry="3" fill="#4ade80"></ellipse></g>`,
  dragon: () => g`<g class="av-pop d6"><path d="M8 236 C2 210 14 188 34 190 L52 160 L56 186 C70 194 70 218 56 230 L56 238 L44 238 L42 232 L26 232 L24 238 Z" fill="#16a34a"></path><path d="M24 192 L4 162 L34 182 Z" fill="#86efac"></path><path d="M36 190 L30 150 L50 178 Z" fill="#4ade80"></path><circle cx="56" cy="164" r="12" fill="#22c55e"></circle><circle cx="60" cy="161" r="2.6" fill="#111"></circle><path d="M50 152 L52 142 L56 152 M58 152 L62 143 L64 154" fill="#facc15"></path><path d="M66 168 C74 166 78 160 84 162" fill="none" stroke="#f97316" stroke-width="3" stroke-linecap="round" class="av-flame"></path></g>`
}, de = {
  mullet: (e) => g`<g class="av-pop d3" fill=${e.hairColour}><path d="M54 96 L48 156 C58 164 70 158 74 146 L74 100 Z"></path><path d="M146 96 L152 156 C142 164 130 158 126 146 L126 100 Z"></path></g>`,
  surfer: (e) => g`<g class="av-pop d3" fill=${e.hairColour}><path d="M52 98 C46 136 52 162 66 166 L74 108 Z"></path><path d="M148 98 C154 136 148 162 134 166 L126 108 Z"></path></g>`,
  pageboy: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M52 92 C48 120 50 140 58 148 L142 148 C150 140 152 120 148 92 Z"></path>`
}, ia = (e) => g`<path d=${e} fill="none" stroke="rgba(255,255,255,.28)" stroke-width="3.5" stroke-linecap="round"></path>`, he = {
  fringe: (e) => g`<g class="av-pop d3"><path fill=${e.hairColour} d="M55 102 C51 64 76 47 103 47 C131 47 151 65 146 102 C143 92 139 86 133 81 C122 87 106 90 90 88 C79 87 70 88 62 91 C59 94 57 98 55 102 Z"></path>
    <path fill=${e.hairColour} d="M60 90 C68 79 84 73 104 75 C96 80 90 85 86 89 C77 89 68 89 60 90 Z" opacity=".9"></path>
    ${ia("M72 62 C84 53 100 51 116 54")}<path d="M92 86 C98 80 108 76 120 76" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="2" stroke-linecap="round"></path></g>`,
  styled: (e) => g`<g class="av-pop d3"><path fill=${e.hairColour} opacity=".5" d="M56 104 C55 90 57 80 63 74 L68 96 Z M144 104 C145 90 143 80 137 74 L132 96 Z"></path>
    <path fill=${e.hairColour} d="M60 89 C59 74 66 63 77 57 Q76 50 80 45 Q84 51 87 54 Q88 45 94 40 Q96 48 98 52 Q102 42 109 38 Q109 47 110 52 Q115 44 123 42 Q120 49 121 55 Q127 51 133 52 Q129 57 130 61 C137 68 141 77 140 89 C132 80 118 76 100 76 C82 76 68 80 60 89 Z"></path>
    <path d="M80 68 Q85 60 90 52 M96 66 Q100 57 105 47 M111 66 Q115 58 120 50 M123 70 Q127 64 131 58" fill="none" stroke="rgba(0,0,0,.13)" stroke-width="2" stroke-linecap="round"></path>
    ${ia("M82 63 C90 55 100 50 112 48")}</g>`,
  crop: (e) => g`<g class="av-pop d3"><path fill=${e.hairColour} opacity=".55" d="M56 102 C55 90 57 82 62 76 L66 96 Z M144 102 C145 90 143 82 138 76 L134 96 Z"></path>
    <path fill=${e.hairColour} d="M60 90 C59 71 72 58 87 54 Q90 47 94 47 Q97 51 99 53 Q102 45 106 45 Q109 50 111 53 Q115 48 119 48 Q121 53 121 56 L129 55 C139 63 142 75 141 90 C133 81 118 76 100 76 C82 76 68 81 60 90 Z"></path>
    <path d="M80 66 Q84 61 88 59 M98 63 Q101 58 104 56 M114 63 Q118 59 122 58" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="2" stroke-linecap="round"></path>${ia("M80 60 C92 54 106 52 120 56")}</g>`,
  mop: (e) => g`<g class="av-pop d3"><path fill=${e.hairColour} d="M51 106 C45 70 66 44 98 42 C131 40 155 64 149 106 C145 97 141 92 136 89 L133 97 C128 86 117 80 104 82 C92 80 81 84 71 91 L67 99 C61 96 55 99 51 106 Z"></path>
    <path fill=${e.hairColour} d="M84 48 C80 42 82 37 88 35 C87 40 90 44 95 46 Z M104 45 C103 38 107 33 113 33 C110 37 110 41 113 45 Z M120 50 C124 44 129 42 134 43 C130 46 127 50 126 55 Z"></path>
    <path d="M84 84 C88 76 94 72 100 72 M110 82 C114 76 120 74 126 76" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="2" stroke-linecap="round"></path>${ia("M74 58 C86 50 102 48 118 52")}</g>`,
  short: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  quiff: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 66 70 54 88 52 C92 32 126 26 142 44 C132 44 124 48 121 55 C138 62 146 76 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`,
  swept: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M55 100 C52 64 76 48 104 48 C132 48 150 66 145 100 C140 86 130 78 118 76 C100 73 82 84 64 70 C61 80 58 90 55 100 Z"></path>`,
  pageboy: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M54 102 C52 62 78 48 100 48 C122 48 148 62 146 102 C142 92 130 90 100 90 C70 90 58 92 54 102 Z"></path>`,
  spiky: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M56 99 L57 70 L70 78 L73 50 L88 66 L98 40 L109 64 L123 47 L127 72 L141 64 L145 99 C134 83 120 76 100 76 C80 76 66 83 56 99 Z"></path>`,
  curly: (e) => g`<g class="av-pop d3" fill=${e.hairColour}><path d="M57 98 C56 70 78 58 100 58 C124 58 145 70 144 98 C136 86 124 80 100 80 C78 80 64 86 57 98 Z"></path><circle cx="64" cy="82" r="14"></circle><circle cx="77" cy="63" r="15"></circle><circle cx="95" cy="54" r="16"></circle><circle cx="114" cy="55" r="16"></circle><circle cx="131" cy="66" r="15"></circle><circle cx="141" cy="84" r="13"></circle></g>`,
  buzz: (e) => g`<path class="av-pop d3" fill=${e.hairColour} opacity=".88" d="M58 93 C60 64 80 55 100 55 C122 55 140 64 142 93 C130 81 116 77 100 77 C84 77 70 81 58 93 Z"></path>`,
  surfer: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M55 102 C50 64 80 45 104 47 C133 50 151 70 145 104 C133 80 112 74 92 80 C77 85 63 93 55 102 Z"></path>`,
  mohawk: (e) => g`<g class="av-pop d3" fill=${e.hairColour}><path opacity=".45" d="M60 94 C62 72 80 62 100 62 C120 62 138 72 140 94 C130 84 116 80 100 80 C84 80 70 84 60 94 Z"></path><path d="M88 82 L90 40 L100 24 L110 40 L112 82 Z"></path></g>`,
  mullet: (e) => g`<path class="av-pop d3" fill=${e.hairColour} d="M56 98 C55 62 78 50 100 50 C124 50 146 62 145 99 C138 84 126 76 100 76 C78 76 64 83 56 98 Z"></path>`
}, me = {
  island: (e) => g`<g class="av-pop d1"><path d=${J} fill=${e.topColour}></path>${[[60, 200], [96, 214], [130, 196], [146, 224], [74, 228], [112, 186]].map(([t, a]) => g`<circle cx=${t} cy=${a} r="6" fill="#fde047" opacity=".9"></circle><circle cx=${t} cy=${a} r="2.5" fill="#f97316"></circle>`)}<path d="M84 168 L100 190 L116 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  cloak: (e) => g`<g class="av-pop d1"><path d="M22 240 C26 186 56 150 100 150 C144 150 174 186 178 240 Z" fill="#1f2937"></path><path d=${J} fill=${e.topColour}></path><path d="M100 166 L100 240" stroke="#111827" stroke-width="3"></path><circle cx="100" cy="176" r="5" fill="#d4af37"></circle></g>`,
  armour: () => g`<g class="av-pop d1"><path d=${J} fill="#64748b"></path><path d="M60 182 C80 172 120 172 140 182 L134 230 L66 230 Z" fill="#94a3b8" stroke="#475569" stroke-width="2"></path><path d="M100 178 L100 230" stroke="#475569" stroke-width="2"></path><circle cx="48" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><circle cx="152" cy="196" r="16" fill="#94a3b8" stroke="#475569" stroke-width="2"></circle><path d="M86 200 L100 192 L114 200 L100 212 Z" fill="#b91c1c"></path></g>`,
  tee: (e) => g`<g class="av-pop d1"><path d=${J} fill=${e.topColour}></path><path d="M84 168 Q100 182 116 168" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"></path></g>`,
  hoodie: (e) => g`<g class="av-pop d1"><path d=${J} fill=${e.topColour}></path><path d="M66 174 Q100 146 134 174 Q100 194 66 174 Z" fill="rgba(0,0,0,.22)"></path><path d="M92 182 L90 206 M108 182 L110 206" stroke="#fff" stroke-width="3" stroke-linecap="round"></path><rect x="74" y="212" width="52" height="22" rx="8" fill="rgba(0,0,0,.12)"></rect></g>`,
  polo: (e) => g`<g class="av-pop d1"><path d=${J} fill="#f8fafc"></path><path d="M80 168 L100 186 L120 168 L114 164 L100 176 L86 164 Z" fill=${e.topColour}></path><circle cx="100" cy="194" r="2" fill="#94a3b8"></circle><circle cx="100" cy="204" r="2" fill="#94a3b8"></circle><path d="M44 214 L60 210" stroke=${e.topColour} stroke-width="4"></path></g>`,
  rashie: (e) => g`<g class="av-pop d1"><path d=${J} fill=${e.topColour}></path><path d="M40 216 C70 200 130 200 160 216" fill="none" stroke="#fff" stroke-width="5" opacity=".8"></path><path d="M90 168 L100 176 L110 168" fill="none" stroke="#fff" stroke-width="3"></path></g>`,
  band: (e) => g`<g class="av-pop d1"><path d=${J} fill="#7f1d1d"></path><rect x="92" y="170" width="16" height="70" fill="#991b1b"></rect>${[184, 198, 212, 226].map((t) => g`<circle cx="88" cy=${t} r="3" fill="#facc15"></circle><circle cx="112" cy=${t} r="3" fill="#facc15"></circle>`)}<path d="M50 196 L70 182 M150 196 L130 182" stroke="#facc15" stroke-width="4" stroke-linecap="round"></path></g>`,
  footy: () => g`<g class="av-pop d1"><clipPath id="fhBody"><path d=${J}></path></clipPath><g clip-path="url(#fhBody)"><rect y="160" width="200" height="80" fill="#1e3a8a"></rect><rect y="186" width="200" height="12" fill="#f5b301"></rect><rect y="210" width="200" height="12" fill="#f5b301"></rect></g><path d="M84 168 Q100 180 116 168" fill="none" stroke="#f5b301" stroke-width="4" stroke-linecap="round"></path></g>`,
  wetsuit: () => g`<g class="av-pop d1"><path d=${J} fill="#111827"></path><path d="M40 240 C44 204 58 186 72 180 L78 240 Z" fill="#0ea5e9"></path><path d="M160 240 C156 204 142 186 128 180 L122 240 Z" fill="#0ea5e9"></path></g>`,
  astro: () => g`<g class="av-pop d1"><path d=${J} fill="#e5e7eb"></path><rect x="78" y="196" width="44" height="30" rx="6" fill="#cbd5e1"></rect><circle cx="90" cy="211" r="4" fill="#ef4444"></circle><circle cx="104" cy="211" r="4" fill="#22c55e"></circle><rect x="112" y="207" width="6" height="8" rx="2" fill="#3b82f6"></rect></g>`
}, Ja = (e, t) => g`<ellipse cx=${t} cy="104" rx="5.2" ry="6.2" fill="#fff"></ellipse><circle cx=${t} cy="104.6" r="4.4" fill=${e}></circle><circle cx=${t} cy="104.6" r="2.2" fill="#141414"></circle><circle cx=${t + 1.6} cy="102.6" r="1.3" fill="#fff"></circle>`, ue = {
  normal: (e) => e.eyeColour && e.eyeColour !== "none" ? g`<g class="av-pop d4">${Ja(e.eyeColour, 84)}${Ja(e.eyeColour, 116)}</g>` : g`<g class="av-pop d4"><ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><ellipse cx="116" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle><circle cx="118" cy="101.5" r="1.6" fill="#fff"></circle></g>`,
  happy: () => g`<g class="av-pop d4" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"><path d="M77 106 Q84 97 91 106"></path><path d="M109 106 Q116 97 123 106"></path></g>`,
  wink: (e) => g`<g class="av-pop d4">${e.eyeColour && e.eyeColour !== "none" ? Ja(e.eyeColour, 84) : g`<ellipse cx="84" cy="104" rx="5" ry="6.2" fill="#1d1d1f"></ellipse><circle cx="86" cy="101.5" r="1.6" fill="#fff"></circle>`}<path d="M109 105 Q116 99 123 105" fill="none" stroke="#1d1d1f" stroke-width="3.4" stroke-linecap="round"></path></g>`
}, ge = {
  smile: () => g`<path class="av-pop d4" d="M88 122 Q100 133 112 122" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  cheeky: () => g`<g class="av-pop d4"><path d="M86 119 Q100 134 114 119 Q100 122.5 86 119 Z" fill="#5b2a22"></path><path d="M89.5 120 Q100 122.4 110.5 120 L109.5 123 Q100 124.6 90.5 123 Z" fill="#fffaf0"></path><path d="M93 129.5 Q100 132 107 129.5" fill="none" stroke="#e8857a" stroke-width="2" stroke-linecap="round" opacity=".6"></path></g>`,
  grin: () => g`<g class="av-pop d4"><path d="M83 118 Q100 140 117 118 Q100 122 83 118 Z" fill="#4a2018"></path><path d="M86.5 119.2 Q100 122.4 113.5 119.2 L112 124 Q100 126 88 124 Z" fill="#fff"></path><path d="M92 132 Q100 135 108 132" fill="none" stroke="#e8857a" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>`,
  smirk: () => g`<path class="av-pop d4" d="M89 125 Q103 129 113 119" fill="none" stroke="#3b1f14" stroke-width="3.4" stroke-linecap="round"></path>`,
  wow: () => g`<ellipse class="av-pop d4" cx="100" cy="124" rx="5.5" ry="6.5" fill="#3b1f14"></ellipse>`
}, Ke = {
  zinc: () => g`<g class="av-pop d5"><path d="M93 104 Q100 100 107 104 L105 118 Q100 121 95 118 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"></path><path d="M70 112 L80 110 M120 110 L130 112" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"></path></g>`,
  round: () => g`<g class="av-pop d5"><circle cx="84" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><circle cx="116" cy="104" r="11" fill="rgba(20,22,34,.88)" stroke="#111" stroke-width="2.5"></circle><path d="M95 103 Q100 99 105 103" fill="none" stroke="#111" stroke-width="2.5"></path><path d="M79 99 L84 96" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"></path></g>`,
  swim: () => g`<g class="av-pop d5"><path d="M52 102 H148" stroke="#0ea5e9" stroke-width="4"></path><ellipse cx="84" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><ellipse cx="116" cy="104" rx="11" ry="8" fill="rgba(125,211,252,.85)" stroke="#0369a1" stroke-width="3"></ellipse><path d="M95 104 H105" stroke="#0369a1" stroke-width="3"></path></g>`,
  aviator: () => g`<g class="av-pop d5"><path d="M71 97 H97 Q97 118 84 118 Q71 118 71 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M103 97 H129 Q129 118 116 118 Q103 118 103 97 Z" fill="rgba(30,44,70,.88)" stroke="#c9a227" stroke-width="2.2"></path><path d="M97 99 H103 M60 99 H71 M129 99 H140" stroke="#c9a227" stroke-width="2.2"></path></g>`,
  shutter: () => g`<g class="av-pop d5" fill="none" stroke="#f5b301" stroke-width="3"><rect x="69" y="95" width="62" height="19" rx="5"></rect><path d="M71 101 H129 M71 107 H129 M100 95 V114"></path></g>`,
  ski: () => g`<g class="av-pop d5"><path d="M50 104 H150" stroke="#111827" stroke-width="7"></path><rect x="67" y="92" width="66" height="24" rx="12" fill="rgba(80,200,255,.75)" stroke="#111827" stroke-width="3.5"></rect><path d="M76 98 L90 98" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"></path></g>`,
  star: () => g`<g class="av-pop d5" fill="#ff4fa3" stroke="#be185d" stroke-width="2" stroke-linejoin="round"><path d=${ni(84, 104, 13)}></path><path d=${ni(116, 104, 13)}></path><path d="M95 104 H105" stroke-width="2.5"></path></g>`
}, fe = {
  knight: () => g`<g class="av-pop d5"><path d="M52 112 C48 60 72 40 100 40 C128 40 152 60 148 112 L140 112 L140 98 L60 98 L60 112 Z" fill="#94a3b8" stroke="#475569" stroke-width="2.5"></path><rect x="96" y="40" width="8" height="58" fill="#64748b"></rect><path d="M100 40 C96 22 112 16 120 24 C110 26 104 32 104 40 Z" fill="#b91c1c"></path></g>`,
  cap: () => g`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#d62d20"></path><path d="M100 84 L170 90 C168 99 150 99 100 93 Z" fill="#b91c1c"></path></g>`,
  backcap: () => g`<g class="av-pop d5"><path d="M53 90 C53 58 76 45 100 45 C124 45 147 58 147 90 Z" fill="#2563eb"></path><path d="M58 86 L30 80 C30 72 44 70 58 76 Z" fill="#1d4ed8"></path><rect x="122" y="70" width="18" height="10" rx="4" fill="#bfdbfe"></rect></g>`,
  beanie: () => g`<g class="av-pop d5"><path d="M53 94 C53 56 76 43 100 43 C124 43 147 56 147 94 Z" fill="#0f766e"></path><rect x="50" y="84" width="100" height="14" rx="7" fill="#115e59"></rect><circle cx="100" cy="40" r="9" fill="#f5b301"></circle></g>`,
  swimcap: () => g`<g class="av-pop d5"><path d="M54 98 C52 58 76 44 100 44 C124 44 148 58 146 98 C136 90 120 86 100 86 C80 86 64 90 54 98 Z" fill="#0ea5e9"></path><path d="M70 64 Q100 52 130 64" fill="none" stroke="#e0f2fe" stroke-width="3" opacity=".7"></path></g>`,
  bucket: () => g`<g class="av-pop d5"><path d="M64 84 C66 54 80 45 100 45 C120 45 134 54 136 84 Z" fill="#d6c38f"></path><ellipse cx="100" cy="86" rx="58" ry="11" fill="#c2ad74"></ellipse><rect x="65" y="74" width="70" height="7" fill="#8b7a4a"></rect></g>`,
  dinohood: () => g`<g class="av-pop d5"><path d="M50 108 C46 60 74 40 100 40 C126 40 154 60 150 108 C146 92 132 82 100 82 C68 82 54 92 50 108 Z" fill="#16a34a"></path><path d="M70 46 L76 30 L84 42 L92 26 L100 40 L108 26 L116 42 L124 30 L130 46" fill="#facc15"></path><circle cx="76" cy="62" r="5" fill="#fff"></circle><circle cx="124" cy="62" r="5" fill="#fff"></circle><circle cx="76" cy="62" r="2.4" fill="#111"></circle><circle cx="124" cy="62" r="2.4" fill="#111"></circle></g>`,
  headphones: () => g`<g class="av-pop d5"><path d="M52 106 C50 48 150 48 148 106" fill="none" stroke="#111827" stroke-width="7" stroke-linecap="round"></path><rect x="44" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect><rect x="138" y="94" width="18" height="28" rx="8" fill="#ef4444"></rect></g>`,
  wizard: () => g`<g class="av-pop d5"><ellipse cx="100" cy="80" rx="60" ry="11" fill="#312e81"></ellipse><path d="M66 80 L100 4 L134 80 Z" fill="#4338ca"></path><path d=${ni(100, 48, 8)} fill="#facc15"></path><circle cx="86" cy="66" r="2.5" fill="#fde68a"></circle><circle cx="116" cy="30" r="2" fill="#fde68a"></circle></g>`,
  akubra: () => g`<g class="av-pop d5"><ellipse cx="100" cy="82" rx="72" ry="13" fill="#7a4a24"></ellipse><path d="M66 82 C66 54 78 42 100 42 C122 42 134 54 134 82 Z" fill="#8b5a2b"></path><rect x="66" y="70" width="68" height="9" fill="#3b2414"></rect></g>`,
  crown: () => g`<g class="av-pop d5"><path d="M63 72 L68 38 L85 58 L100 30 L115 58 L132 38 L137 72 Z" fill="#f5b301" stroke="#b27f00" stroke-width="2.5" stroke-linejoin="round"></path><circle cx="100" cy="60" r="5" fill="#ef4444"></circle><circle cx="80" cy="64" r="3.5" fill="#3b82f6"></circle><circle cx="120" cy="64" r="3.5" fill="#22c55e"></circle></g>`,
  helmet: () => g`<g class="av-pop d5"><circle cx="100" cy="98" r="62" fill="rgba(186,230,253,.28)" stroke="#e5e7eb" stroke-width="7"></circle><path d="M62 72 Q76 50 100 46" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"></path></g>`
};
function ct(e, t = {}) {
  const a = t.size ?? 200, i = t.crop === "head", o = a, s = i ? a : Math.round(a * 1.2), r = t.jump ? t.jump % 2 ? "av-jump-a" : "av-jump-b" : "", n = t.age ?? "mid", c = n === "kid" ? "translate(100 104) scale(1.1) translate(-100 -104)" : "", p = n === "kid" ? 44 : 46, d = n === "teen" ? 46 : 44, h = g`<path d=${n === "kid" ? "M99 111 Q97 115 100 116 Q102 116 103 114.5" : "M98.5 108 Q95.5 115 99.5 116.5 Q102.5 117 104 114.5"} fill="none" stroke="rgba(150,80,60,.45)" stroke-width="2" stroke-linecap="round"></path>`, m = n !== "kid" ? g`<g class="av-pop d4" stroke=${e.hairColour} stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".9"><path d=${n === "teen" ? "M76 94.5 Q83 92 91 93.5" : "M77 94 Q84 90 91 93"}></path><path d=${n === "teen" ? "M109 93.5 Q117 92 124 94.5" : "M109 93 Q116 90 123 94"}></path></g>` : u;
  return l`<span class="avwrap ${r}" style="display:inline-block;line-height:0;flex-shrink:0">
    <svg viewBox=${i ? "36 28 128 128" : "0 0 200 240"} width=${o} height=${s} role="img" aria-label=${t.label ?? "Avatar"}
      style="display:block;overflow:hidden;border-radius:${i ? "50%" : `${Math.round(a * 0.12)}px`}">
      ${i ? g`<circle cx="100" cy="92" r="64" fill=${ne[e.scene] ?? ne.plain}></circle>` : (re[e.scene] ?? re.plain)(e)}
      ${t.ring && i ? g`<circle cx="100" cy="92" r="60" fill="none" stroke=${t.ring} stroke-width="7"></circle>` : u}
      <g class=${t.still ? "" : "av-bob"}>
        ${!i && le[e.gear] ? le[e.gear](e) : u}
        ${de[e.hair] ? de[e.hair](e) : u}
        ${(me[e.top] ?? me.tee)(e)}
        <rect x="88" y=${n === "teen" ? 130 : 136} width="24" height=${n === "teen" ? 40 : 34} rx="10" fill=${e.skin}></rect>
        <g transform=${c}>
        <g class="av-pop d2">
          <circle cx="57" cy="104" r="9" fill=${e.skin}></circle><circle cx="143" cy="104" r="9" fill=${e.skin}></circle>
          <ellipse cx="100" cy="100" rx=${p} ry=${d} fill=${e.skin}></ellipse>
          <circle cx="74" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle><circle cx="126" cy="118" r="6.5" fill="rgba(255,110,110,.22)"></circle>
        </g>
        <g class=${t.still ? "" : "av-blink"}>${(ue[e.eyes] ?? ue.normal)(e)}</g>
        ${m}
        ${e.freckles === "yes" ? g`<g fill="#b9734f" opacity=".5">${[[91, 113], [95, 110.5], [105, 110.5], [109, 113], [77, 114], [81, 117], [74, 118], [119, 117], [123, 114], [126, 118]].map(([f, x]) => g`<circle cx=${f} cy=${x} r="1.15"></circle>`)}</g>` : u}
        ${h}
        ${e.mole === "yes" ? g`<circle cx="81" cy="121" r="1.2" fill="#6b4532" opacity=".75"></circle>` : u}
        ${(ge[e.mouth] ?? ge.smile)(e)}
        ${(he[e.hair] ?? he.short)(e)}
        ${Ke[e.eyewear] ? Ke[e.eyewear](e) : u}
        ${fe[e.hat] ? fe[e.hat](e) : u}
        </g>
        ${!i && pe[e.gear] ? pe[e.gear](e) : u}
        ${!i && ce[e.buddy] ? ce[e.buddy](e) : u}
      </g>
    </svg></span>`;
}
const Wa = `
  .avwrap svg g.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  .avwrap svg g.av-pop.d1, .avwrap svg path.av-pop.d1 { animation-delay: .02s; }
  .avwrap svg .av-pop.d2 { animation-delay: .06s; } .avwrap svg .av-pop.d3 { animation-delay: .1s; }
  .avwrap svg .av-pop.d4 { animation-delay: .14s; } .avwrap svg .av-pop.d5 { animation-delay: .18s; } .avwrap svg .av-pop.d6 { animation-delay: .22s; }
  .avwrap svg path.av-pop, .avwrap svg ellipse.av-pop { transform-box: fill-box; transform-origin: center; animation: avPop .55s cubic-bezier(.2,1.4,.4,1) both; }
  @keyframes avPop { from { opacity: 0; transform: scale(.4) translateY(10px); } to { opacity: 1; transform: none; } }
  .avwrap svg .av-bob { animation: avBob 3.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes avBob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  .avwrap svg .av-blink { transform-box: fill-box; transform-origin: center; animation: avBlink 5.5s infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes avBlink { 0%, 95%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
  .avwrap svg .av-flame { animation: avFlame .8s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes avFlame { from { opacity: .4; } to { opacity: 1; } }
  .avwrap.av-jump-a { animation: avJumpA .7s cubic-bezier(.3,1.6,.5,1); }
  .avwrap.av-jump-b { animation: avJumpB .7s cubic-bezier(.3,1.6,.5,1); }
  @keyframes avJumpA { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(-4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
  @keyframes avJumpB { 0% { transform: none; } 35% { transform: translateY(-22px) rotate(4deg) scale(1.04); } 70% { transform: translateY(2px) scale(.98, 1.02); } 100% { transform: none; } }
`, Vi = (e, t = 60) => {
  const a = ["var(--p-1)", "var(--p-2)", "var(--p-3)", "var(--p-4)", "var(--p-5)", "var(--accent)", "var(--primary)"];
  let i = e * 9301 + 49297;
  const o = () => (i = (i * 9301 + 49297) % 233280, i / 233280);
  return l`<div class="confetti" aria-hidden="true">${Array.from({ length: t }, () => {
    const s = o() * 100, r = 1.6 + o() * 1.8, n = o() * 0.5, c = 6 + o() * 8, p = o() * 720 - 360, d = o() * 160 - 80;
    return l`<i style="left:${s}%;width:${c}px;height:${c * (o() > 0.5 ? 0.45 : 1)}px;background:${a[Math.floor(o() * a.length)]};border-radius:${o() > 0.6 ? "50%" : "2px"};
      animation-duration:${r}s;animation-delay:${n}s;--rot:${p}deg;--drift:${d}px"></i>`;
  })}</div>`;
}, Ni = `
  .confetti { position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 50; }
  .confetti i { position: absolute; top: -20px; animation-name: fall; animation-timing-function: cubic-bezier(.25,.6,.45,1); animation-fill-mode: forwards; opacity: 0; }
  @keyframes fall { 0% { opacity: 1; transform: translate(0, 0) rotate(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--drift), 105vh) rotate(var(--rot)); } }
  .burst { position: absolute; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-weight: var(--w-heavy, 800); font-size: 30px; color: var(--ok);
    text-shadow: 0 2px 10px rgba(0,0,0,.18); animation: burst 1.2s cubic-bezier(.2,.8,.2,1) forwards; z-index: 20; }
  @keyframes burst { 0% { opacity: 0; transform: translateY(10px) scale(.6); } 20% { opacity: 1; transform: translateY(-6px) scale(1.15); } 100% { opacity: 0; transform: translateY(-70px) scale(1); } }
  .shake { animation: shake .45s; }
  @keyframes shake { 20%, 60% { transform: translateX(-6px) rotate(-2deg); } 40%, 80% { transform: translateX(6px) rotate(2deg); } }
  .shimmer { position: relative; overflow: hidden; }
  .shimmer::after { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,.45) 50%, transparent 70%); transform: translateX(-100%); animation: shimmer 2.8s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @keyframes shimmer { 60%, 100% { transform: translateX(100%); } }
  .xp { height: 10px; border-radius: 5px; background: var(--track); overflow: hidden; }
  .xp > div { height: 100%; border-radius: 5px; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width .8s cubic-bezier(.2,.8,.2,1); }
`, P = (e) => new Date(e.getFullYear(), e.getMonth(), e.getDate()), M = (e, t) => new Date(e.getFullYear(), e.getMonth(), e.getDate() + t), Q = (e, t) => e.getFullYear() === t.getFullYear() && e.getMonth() === t.getMonth() && e.getDate() === t.getDate(), zt = (e) => {
  const t = P(e), a = (t.getDay() + 6) % 7;
  return M(t, -a);
}, Ue = (e) => zt(new Date(e.getFullYear(), e.getMonth(), 1)), dt = "en-AU", B = (e) => e.toLocaleTimeString(dt, { hour: "numeric", minute: "2-digit", hour12: !0 }).replace(/\s?([ap])\.?m\.?/i, " $1m").toLowerCase(), xe = (e) => {
  const t = e.getHours();
  return { hm: `${t % 12 || 12}:${String(e.getMinutes()).padStart(2, "0")}`, ampm: t < 12 ? "am" : "pm" };
}, Ia = (e) => e.toLocaleDateString(dt, { weekday: "long", day: "numeric", month: "long" }), Ss = (e) => e.toLocaleDateString(dt, { weekday: "short", day: "numeric", month: "short" }), Yt = (e) => e.toLocaleDateString(dt, { weekday: "short" }), ws = (e, t) => e.getMonth() === t.getMonth() ? `${e.getDate()} – ${t.getDate()} ${t.toLocaleDateString(dt, { month: "long" })}` : `${e.getDate()} ${e.toLocaleDateString(dt, { month: "short" })} – ${t.getDate()} ${t.toLocaleDateString(dt, { month: "short" })}`, vs = (e) => {
  const t = e.getHours();
  return t < 5 ? "Up late" : t < 12 ? "Good morning" : t < 17 ? "Good afternoon" : "Good evening";
}, be = (e, t, a) => {
  const i = e.getHours() * 60 + e.getMinutes(), o = (n) => {
    const [c, p] = n.split(":").map(Number);
    return c * 60 + (p || 0);
  }, s = o(t), r = o(a);
  return s <= r ? i >= s && i < r : i >= s || i < r;
}, Aa = class Aa extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.life = 0, this.grow = 0, this._tab = "hair", this._shake = "", this._msg = "", this._jump = 0, this._confetti = 0;
  }
  get d() {
    return this._draft ?? this.look;
  }
  _say(t) {
    this._msg = t, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "";
    }, 2200);
  }
  get _picMode() {
    return this.kid.mode === "picture";
  }
  get _goal() {
    return this.hass?.states[E(this.kid).goal]?.state ?? "";
  }
  _pick(t, a, i = !1) {
    if (!Nt(a, this.life, this.grow)) {
      if (this._shake = `${t.id}:${a[0]}`, setTimeout(() => {
        this._shake = "";
      }, 460), N("locked"), this._picMode) {
        z("Not yet! Keep collecting stars.");
        return;
      }
      a[3] ? this._say(`${a[1]} is a surprise – keep practising and reading!`) : this._say(`${a[1]} is ${a[2] - this.life} away. Tap ♥ to make it your goal.`);
      return;
    }
    N("tap"), this._picMode && z(a[1]), this._draft = xt(this.d, t, a[0], i), this._jump++;
  }
  _setGoal(t) {
    const a = E(this.kid).goal;
    if (!this.hass?.states[a]) return;
    const i = this._goal === t[0] ? "" : t[0];
    this.hass.callService("input_text", "set_value", { entity_id: a, value: i }), N("coin"), this._say(i ? `Saving for ${t[1]} ♥` : "Goal cleared");
  }
  _random() {
    let t = { ...this.d };
    for (const a of Ut) {
      if (a.id === "face") continue;
      const i = a.items.filter((s) => Nt(s, this.life, this.grow)), o = i[Math.floor(Math.random() * i.length)];
      if (o && (t = xt(t, a, o[0])), a.swatch && a.swatch.key !== "skin") {
        const s = a.swatch.items.filter((r) => Nt(r, this.life, this.grow));
        t = xt(t, a, s[Math.floor(Math.random() * s.length)][0], !0);
      }
    }
    this._draft = t, this._jump++;
  }
  async _save() {
    const t = E(this.kid).avatar;
    if (this.hass?.states[t])
      try {
        await this.hass.callService("input_text", "set_value", { entity_id: t, value: Ya(this.d) });
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
    const t = Ut.find((r) => r.id === this._tab) ?? Ut[0], a = Ie(this.life, this.kid.favourites, this._goal || void 0), i = Oe(this.life), o = !!this._draft && Ya(this._draft) !== Ya(this.look), s = (r) => r > 0 && r <= this.life && r > this.life - 100;
    return l`<div style="display:contents;--kid:${T(this.kid.colour)}">
      <section class="glass mirror">
        <div style="display:flex;width:100%;align-items:center;gap:10px;z-index:1">
          <button class="round tap" aria-label="Back" @click=${() => this.dispatchEvent(new CustomEvent("close"))}>${F("left", 18)}</button>
          <h1 class="t-title" style="flex:1">${this.kid.name}’s studio</h1>
          <button class="round tap" aria-label="Surprise look" @click=${() => this._random()}>${F("shuffle", 18)}</button>
        </div>
        <button class="tap" style="z-index:1" aria-label="Jump" @click=${() => {
      this._jump++;
    }}>${ct(this.d, { size: 240, jump: this._jump, age: this.kid.age })}</button>
        ${a && !this._picMode ? l`<div style="width:100%;z-index:1;display:flex;flex-direction:column;gap:5px">
          <span style="font-size:14px;font-weight:var(--w-bold, 700)">${this._goal === a.id ? "♥ Saving for" : "Next unlock"}: ${a.label} <span class="muted">· ${a.req - this.life} to go</span></span>
          <div class="xp"><div style="width:${Math.round((this.life - i) / (a.req - i) * 100)}%"></div></div></div>` : u}
        <div style="display:flex;gap:10px;width:100%;margin-top:auto;z-index:1">
          <button class="pill tap" style="flex:1;height:50px;justify-content:center" ?disabled=${!o} @click=${() => {
      this._draft = void 0, this._jump++;
    }}>Undo all</button>
          <button class="pill tap primary" style="flex:1.4;height:50px;justify-content:center;font-size:16px" @click=${() => this._save()}>${o ? "Save my look" : "Done"}</button>
        </div>
      </section>
      <section class="glass shelf">
        <div class="tabs" role="tablist">${Ut.map((r) => l`<button class="tap" role="tab" aria-label=${r.label} aria-pressed=${String(r.id === this._tab)} style=${this._picMode ? "font-size:26px;width:58px;height:52px;padding:0" : ""} @click=${() => {
      this._tab = r.id, N("tap"), this._picMode && z(r.label);
    }}>${this._picMode ? r.emoji : l`${r.emoji} ${r.label}`}</button>`)}</div>
        ${t.swatch ? l`<div class="sw"><span class="label" style="width:60px">${t.swatch.label}</span>
          ${t.swatch.items.map((r) => {
      const n = !Nt(r, this.life, this.grow);
      return l`<button class="tap ${n ? "locked" : ""} ${this._shake === `${t.id}:${r[0]}` ? "shake" : ""}"
            title=${r[1]} aria-label=${`${r[1]}${n ? `, unlocks at ${r[2]} points` : ""}`} aria-pressed=${String(this.d[t.swatch.key] === r[0])}
            style="background:${r[0]}" @click=${() => this._pick(t, r, !0)}></button>`;
    })}</div>` : u}
        <div class="grid">
          ${t.items.map((r) => {
      const n = !Nt(r, this.life, this.grow), c = Rs(this.d, t, r[0]), p = !!r[3];
      return l`<button class="tile tap ${n ? "locked shimmer" : ""} ${this._shake === `${t.id}:${r[0]}` ? "shake" : ""}" aria-pressed=${String(c)} @click=${() => this._pick(t, r)}>
              <span class="av">${n && p ? l`<span style="display:flex;width:92px;height:${t.crop === "head" ? 92 : 110}px;align-items:center;justify-content:center;font-size:44px">🎁</span>` : ct(xt(this.d, t, r[0]), { size: 92, crop: t.crop, still: !0, age: this.kid.age })}</span>${n && p ? "Surprise" : r[1]}
              ${n ? l`<span class="lock">${p ? "🌱" : `🔒 ${this._picMode ? "★" : r[2]}`}</span>` : s(r[2]) ? l`<span class="new">NEW</span>` : u}
              ${n && !p && !this._picMode ? l`<span class="heart tap" role="button" aria-label="Make ${r[1]} my goal" @click=${(d) => {
        d.stopPropagation(), this._setGoal(r);
      }}>${this._goal === r[0] ? "❤️" : "♡"}</span>` : u}
            </button>`;
    })}
        </div>
      </section>
      ${this._confetti ? Vi(this._confetti, 50) : u}
      ${this._msg ? l`<div class="toast" role="status">${this._msg}</div>` : u}
    </div>`;
  }
};
Aa.styles = [_, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .mirror { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; overflow: hidden; }
    .mirror::before { content: ''; position: absolute; inset: auto -30% -30%; height: 60%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 40%, transparent), transparent); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .grid { overflow: visible; flex: none; }
    :host([data-shape='tall']) .mirror { width: auto; flex-direction: row; flex-wrap: wrap; justify-content: center; }
    .shelf { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tabs button { height: 40px; padding: 0 16px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
    .tabs button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .heart { position: absolute; bottom: 34px; right: 6px; width: 32px; height: 32px; border-radius: 50%; background: var(--chip-strong); font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; align-content: start; padding: 4px; }
    .tile { border-radius: 20px; background: var(--chip); padding: 8px 6px 9px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; font-size: 12px; font-weight: var(--w-bold, 700); text-align: center; }
    .tile[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); background: var(--chip-strong); }
    .tile.locked .av { filter: grayscale(1) brightness(.85); opacity: .55; }
    .lock { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(15,15,20,.78); color: #fff; font-size: 11px; font-weight: var(--w-heavy, 800); }
    .sw { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .sw button { width: 36px; height: 36px; border-radius: 50%; position: relative; box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }
    .sw button[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,.8); }
    .sw button.locked::after { content: '🔒'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(0,0,0,.35); border-radius: 50%; }
    .new { position: absolute; top: 8px; left: 8px; padding: 3px 7px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 10px; font-weight: var(--w-heavy, 800); }
    ${$(Wa)}
    ${$(Ni)}
  `], Aa.properties = {
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
let li = Aa;
customElements.get("fh-studio") || customElements.define("fh-studio", li);
const rt = { misses: 0, until: 0 }, qa = class qa extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.pin = "", this.reason = "Grown-ups only", this._typed = "", this._bad = !1, this._note = "", this._wait = 0, this._from = null, this._tick = 0, this._keys = (t) => {
      if (t.key === "Escape")
        t.preventDefault(), this.dispatchEvent(new CustomEvent("cancel"));
      else if (/^[0-9]$/.test(t.key))
        t.preventDefault(), this._key(t.key);
      else if (t.key === "Backspace")
        t.preventDefault(), this._key("del");
      else if (t.key === "Tab") {
        const a = [...this.renderRoot.querySelectorAll("button:not([disabled])")], i = a.indexOf(this.renderRoot.querySelector(":focus"));
        t.preventDefault(), a[(i + (t.shiftKey ? -1 : 1) + a.length) % a.length]?.focus();
      }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    let t = document.activeElement;
    for (; t?.shadowRoot?.activeElement; ) t = t.shadowRoot.activeElement;
    this._from = t, this._wait = Math.max(0, Math.ceil((rt.until - Date.now()) / 1e3)), this._tick = window.setInterval(() => {
      this._wait = Math.max(0, Math.ceil((rt.until - Date.now()) / 1e3)), !this._wait && this._note.startsWith("Too many") && (this._note = "");
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearInterval(this._tick);
    const t = this._from;
    t?.isConnected && window.setTimeout(() => t.focus({ preventScroll: !0 }), 0);
  }
  firstUpdated() {
    this.renderRoot.querySelector(".grid button")?.focus({ preventScroll: !0 });
  }
  _key(t) {
    if (!this._wait) {
      if (t === "del") {
        this._typed = this._typed.slice(0, -1);
        return;
      }
      this._bad || (this._typed += t, this._note = "", this._typed.length >= this.pin.length && (this._typed === this.pin ? (rt.misses = 0, this.dispatchEvent(new CustomEvent("ok"))) : (rt.misses += 1, this._bad = !0, rt.misses >= 3 ? (rt.misses = 0, rt.until = Date.now() + 6e4, this._wait = 60, this._note = "Too many tries. Ask a grown-up to help.") : this._note = "That’s not it. Try again.", setTimeout(() => {
        this._bad = !1, this._typed = "";
      }, 420))));
    }
  }
  render() {
    return l`<div class="glass pad ${this._bad ? "bad" : ""}" role="dialog" aria-modal="true" aria-label="Parent PIN" @click=${(t) => t.stopPropagation()} @keydown=${this._keys}>
      <div style="display:flex;width:100%;align-items:center"><h2 class="t-sub" style="flex:1">${this.reason}</h2>
        <button class="round tap" style="width:44px;height:44px" aria-label="Cancel" @click=${() => this.dispatchEvent(new CustomEvent("cancel"))}>${F("close", 18)}</button></div>
      <div class="dots" role="img" aria-label="${this._typed.length} of ${this.pin.length} digits entered">${Array.from({ length: this.pin.length }, (t, a) => l`<span class=${a < this._typed.length ? "on" : ""}></span>`)}</div>
      <div class="note" role="alert">${this._wait ? `Too many tries. Ask a grown-up to help. (${this._wait} s)` : this._note}</div>
      <div class="grid">
        ${["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((t) => t ? l`<button class="tap" ?disabled=${!!this._wait} aria-label=${t === "del" ? "Delete" : t} @click=${() => this._key(t)}>${t === "del" ? "⌫" : t}</button>` : l`<span></span>`)}
      </div>
    </div>`;
  }
};
qa.styles = [_, G`
    :host([data-phone]) { position: fixed !important; }
    :host { position: absolute; inset: 0; z-index: 35; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); }
    .pad { border-radius: 32px; padding: 24px 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 340px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .dots { display: flex; gap: 14px; height: 20px; }
    .dots span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink2); transition: background .15s; }
    .dots span.on { background: var(--ink); border-color: var(--ink); }
    .grid { display: grid; grid-template-columns: repeat(3, 76px); gap: 12px; }
    .grid button { height: 76px; border-radius: 50%; background: var(--chip-strong); font-size: 28px; font-weight: var(--w-semi, 600); }
    .bad { animation: shake .4s; }
    .note { min-height: 20px; font-size: 15px; font-weight: var(--w-semi, 600); color: var(--danger, #c62a22); text-align: center; }
    .grid button[disabled] { opacity: .4; }
    @keyframes shake { 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
  `], qa.properties = { pin: {}, reason: {}, _typed: { state: !0 }, _bad: { state: !0 }, _note: { state: !0 }, _wait: { state: !0 } };
let pi = qa;
customElements.get("fh-pin") || customElements.define("fh-pin", pi);
const Vs = [
  [/teeth|tooth/i, "🪥"],
  [/hair|comb/i, "💇"],
  [/hands|soap/i, "🧼"],
  [/toilet|wee\b/i, "🚽"],
  [/pyjama|pjs/i, "🩳"],
  [/dress|clothes|uniform/i, "👕"],
  [/jumper|jacket|coat/i, "🧥"],
  [/lunch/i, "🥪"],
  [/drink bottle|water bottle|bottle/i, "🥤"],
  [/bowl|breakfast|dish(?!washer)|plate|sink/i, "🥣"],
  [/toy|lego/i, "🧸"],
  [/shoe|sock/i, "👟"],
  [/hat|sunscreen/i, "🧢"],
  [/story|book|read|library/i, "📚"],
  [/make (my |your )?bed|\bbed\b/i, "🛏️"],
  [/bath|shower|wash/i, "🛁"],
  [/dishwasher/i, "🍽️"],
  [/table/i, "🍽️"],
  [/bag|pack/i, "🎒"],
  [/trumpet/i, "🎺"],
  [/piano|keyboard/i, "🎹"],
  [/guitar/i, "🎸"],
  [/clarinet|practice|music/i, "🎵"],
  [/homework|school|spelling|maths/i, "✏️"],
  [/tidy|clean|room/i, "🧹"],
  [/scooter|bike/i, "🛴"],
  [/swim/i, "🏊"],
  [/soccer|footy|training|sport/i, "⚽"],
  [/dog|cat|pet|feed/i, "🐾"],
  [/plant|garden|water/i, "🪴"],
  [/bin|rubbish|recycling/i, "🗑️"],
  [/light/i, "💡"]
], ma = (e) => (typeof e == "string" ? void 0 : e.pic) ?? Vs.find(([t]) => t.test(typeof e == "string" ? e : e.summary))?.[1] ?? "⭐", Ae = (e) => {
  const t = I(e), a = Math.floor(t / 60) % 24;
  return `${a % 12 || 12}:${String(t % 60).padStart(2, "0")} ${a < 12 ? "am" : "pm"}`;
}, qe = { am: "Morning", after: "After school", bed: "Bedtime", any: "Any time" }, Ns = [["😄", "great"], ["🙂", "good"], ["😐", "okay"], ["😟", "worried"], ["😢", "sad"]], Ts = [["😄", "happy"], ["😐", "okay"], ["😢", "sad"]], ke = (e) => ["great", "good", "happy"].includes(e) ? "up" : e === "okay" ? "mid" : "down", Ws = 10 * 6e4, Ms = [{ name: "Pick the family movie", cost: 100 }, { name: "Choose Friday dinner", cost: 80 }], at = (e, t) => {
  try {
    const a = localStorage.getItem(e);
    return a === null ? t : JSON.parse(a);
  } catch {
    return t;
  }
}, O = (e, t) => {
  try {
    localStorage.setItem(e, JSON.stringify(t));
  } catch {
  }
}, ka = class ka extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.fitCtl = new yt(this), this._nowUid = "", this.familyCalendars = [], this.pin = "", this.owed = "todo.rewards_owed", this.jarTarget = 120, this.jarReward = "a family treat", this.privateWords = [], this.quiet = !1, this.oneAtATime = !1, this._showAll = !1, this._tabPicked = !1, this._chores = [], this._events = [], this._jump = 0, this._bursts = [], this._confetti = 0, this._studio = !1, this._celebrate = null, this._pinAsk = null, this._days = !1, this._msg = "", this._practice = null, this._now = /* @__PURE__ */ new Date(), this._feel = "", this._tab = "rewards", this._subFor = "", this._subGen = 0, this._evFor = "", this._busy = /* @__PURE__ */ new Set(), this._lookCache = null;
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
    return E(this.kid);
  }
  get _star() {
    return this.kid.star ?? 10;
  }
  get _picMode() {
    return this.kid.mode === "picture";
  }
  get _life() {
    return nt(this.hass, this._e.lifetime);
  }
  get _grow() {
    return nt(this.hass, this._e.grow);
  }
  get _look() {
    const t = this.hass?.states[this._e.avatar]?.state ?? "", a = `${this.kid.name}|${t}`;
    return this._lookCache?.[0] !== a && (this._lookCache = [a, Ft(t, this.kid.look ? Ft(this.kid.look) : {})]), this._lookCache[1];
  }
  get _wind() {
    return jt(this.kid.bedtime, this._now);
  }
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass") && this.kid) {
      const a = this._e;
      return Ri(t.get("hass"), this.hass, [a.points, a.lifetime, a.week, a.goal, a.grow, a.avatar, "input_number.family_jar"]);
    }
    return t.size === 1 && t.has("_now") ? this._now.getSeconds() === 0 || !!this._practice : !0;
  }
  updated(t) {
    if (!this.hass || !this.kid) return;
    const a = this._e;
    if (this._subFor !== a.chores && this.hass.connection) {
      this._unsub?.(), this._unsub = void 0, this._subFor = a.chores, this._chores = [];
      const i = ++this._subGen, o = a.chores;
      this.hass.connection.subscribeMessage((s) => {
        i === this._subGen && (this._chores = s.items.map(Ze));
      }, { type: "todo/item/subscribe", entity_id: o }).then((s) => {
        i === this._subGen ? this._unsub = s : s();
      }).catch(() => {
        this._chores = [];
      }), this._practice = at(`fh-practice-${a.slug}`, null);
    }
    this._evFor !== this.kid.name && (this._evFor = this.kid.name, this._tab = "rewards", this._tabPicked = !1, this._showAll = !1, this._feel = "", this._days = !1, this._loadWeek()), t.has("hass") && this._checkUnlocks(), this.renderRoot.querySelectorAll(".scrolly").forEach(Z);
  }
  /* ---------------- unlock celebrations (high-water marks, never replay) ---------------- */
  _checkUnlocks() {
    if (this._celebrate || !this.hass?.states[this._e.lifetime]) return;
    const t = this._life, a = this._grow, i = this._e.slug, o = at(`family-hub-seen-${i}`, null), s = at(`family-hub-seen-grow-${i}`, null);
    if (o === null || s === null) {
      O(`family-hub-seen-${i}`, Math.max(o ?? 0, t)), O(`family-hub-seen-grow-${i}`, Math.max(s ?? 0, a));
      return;
    }
    const r = [...ks(o, t), ...Fs(s, a)];
    if (r.length) {
      const n = this.kid.favourites ?? [];
      this._celebrate = [...r].sort((c, p) => Number(n.includes(p.id)) - Number(n.includes(c.id))), this._confetti++, this._sound("unlock"), this._picMode && z(`Wow Jack! You unlocked ${r[0].label}!`);
    }
  }
  _closeCelebrate(t) {
    const a = this._e.slug;
    O(`family-hub-seen-${a}`, Math.max(at(`family-hub-seen-${a}`, 0), this._life)), O(`family-hub-seen-grow-${a}`, Math.max(at(`family-hub-seen-grow-${a}`, 0), this._grow)), this._celebrate = null, t && !this._wind && (this._studio = !0);
  }
  async _loadWeek() {
    if (!this.hass) return;
    const t = P(/* @__PURE__ */ new Date()), a = M(t, 8), i = this.kid.name, o = [{ id: this._e.calendar, family: !1 }, ...this.familyCalendars.map((n) => ({ id: n, family: !0 }))].filter((n) => this.hass.states[n.id]), s = [], r = this.privateWords.map((n) => n.toLowerCase());
    await Promise.all(o.map(async (n) => {
      try {
        const c = await this.hass.callApi("GET", `calendars/${n.id}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(a.toISOString())}`);
        for (const p of c) {
          const d = p.summary ?? "(busy)";
          r.some((h) => d.toLowerCase().includes(h)) || s.push({ title: d, start: p.start?.date ? /* @__PURE__ */ new Date(`${p.start.date}T00:00:00`) : new Date(p.start.dateTime), allDay: !!p.start?.date, family: n.family });
        }
      } catch {
      }
    })), i === this.kid.name && (s.sort((n, c) => n.start.getTime() - c.start.getTime()), this._events = s);
  }
  /* ---------------- ticking ---------------- */
  _sound(t) {
    !this.quiet && !this._wind ? N(t) : t === "tick" && N("tap");
  }
  _award(t, a) {
    const i = { kid: this._e.slug, points: a * t.pts, lifetime: !0, jar: t.lane === "job" ? a : 0, grow: t.lane === "grow" ? a : 0, reason: `${a > 0 ? "" : "un-ticked "}${t.summary}` };
    return !t.pts && t.lane !== "job" && t.lane !== "grow" ? Promise.resolve() : this.hass.callService("script", "fh_add_points", i);
  }
  _toggle(t, a = !1) {
    if (!this.hass || this._busy.has(t.uid)) return;
    const i = t.status === "completed", o = at("fh-ticks", {});
    if (!(i && Date.now() - (o[t.uid] ?? 0) < 2e3)) {
      if (i && !a && Date.now() - (o[t.uid] ?? 0) > Ws) {
        this.pin ? this._pinAsk = { reason: `Untick “${t.summary}”?`, run: () => this._toggle(t, !0) } : this._say("Need to change that? Ask a grown-up.");
        return;
      }
      this._doToggle(t, i, o);
    }
  }
  async _doToggle(t, a, i) {
    this._busy.add(t.uid);
    const o = this._chores;
    this._chores = o.map((s) => s.uid === t.uid ? { ...s, status: a ? "needs_action" : "completed" } : s);
    try {
      if (await this.hass.callService("todo", "update_item", { item: t.uid, status: a ? "needs_action" : "completed" }, { entity_id: this._e.chores }), await this._award(t, a ? -1 : 1), a) {
        delete i[t.uid], O("fh-ticks", i), this._sound("untick");
        return;
      }
      i[t.uid] = Date.now(), O("fh-ticks", i), this._sound(t.lane === "job" ? "coin" : "tick"), this._jump++;
      const s = Date.now(), r = t.lane === "grow" ? "🌱" : t.pts ? this._picMode ? "★".repeat(Math.max(1, Math.round(t.pts / this._star))) : `+${t.pts}` : "✓";
      this._bursts = [...this._bursts, { id: s, text: r }], setTimeout(() => {
        this._bursts = this._bursts.filter((n) => n.id !== s);
      }, 1300), this._picMode && z(`${t.summary}. Done! ${t.pts ? "Here’s a star!" : ""}`), this._maybeAllDone();
    } catch (s) {
      console.warn("Family Hub: chore update failed", s), this._chores = o, this._say("Couldn’t save that one – try again");
    } finally {
      this._busy.delete(t.uid);
    }
  }
  _maybeAllDone() {
    const t = Hi(Zt(this.kid.bedtime, this._now), this._now), a = this._chores.filter((n) => n.lane === "routine" && n.slot === t), i = this._chores.filter((n) => n.lane === "job"), o = a.length ? a : i;
    if (!o.length || o.some((n) => n.status !== "completed")) return;
    const s = `fh-alldone-${this._e.slug}-${(/* @__PURE__ */ new Date()).toDateString()}-${t}`;
    if (at(s, !1)) return;
    O(s, !0);
    const r = this.kid.name;
    this._wind || (this._confetti++, this._sound(this.kid.sound ?? "done"), setTimeout(() => this._sound("done"), 700)), this._picMode && z(t === "am" ? `You did your whole morning, ${r}!` : t === "bed" ? `All ready for bed, ${r}. Sleep well!` : `All done, ${r}!`), this._say(t === "bed" ? `All set for bed, ${r}. Sleep well.` : [`All done, ${r}. You stuck with it today.`, `That’s everything, ${r}. Nice and steady.`, `Legend effort, ${r}.`][Math.floor(Math.random() * 3)]);
  }
  /* ---------------- practice timer ---------------- */
  _startPractice(t) {
    this._practice = { uid: t.uid, end: Date.now() + t.minutes * 6e4, mins: t.minutes }, O(`fh-practice-${this._e.slug}`, this._practice), this._sound("tap"), this._say(t.song ? `${t.minutes} minutes of music. Go!` : `${t.minutes} minutes on the clock. You’ve got this.`), t.song && this._song(t.minutes);
  }
  /** A timed job tagged @song plays music for as long as its timer runs: when the music stops, time is up. */
  _song(t) {
    this.dispatchEvent(new CustomEvent("song", { detail: { minutes: t }, bubbles: !0, composed: !0 }));
  }
  _stopPractice() {
    this._chores.find((t) => t.uid === this._practice?.uid)?.song && this._song(0), this._practice = null, O(`fh-practice-${this._e.slug}`, null);
  }
  _checkPractice() {
    const t = this._practice;
    if (!t || Date.now() < t.end) return;
    const a = this._chores.find((i) => i.uid === t.uid);
    this._stopPractice(), a?.song ? this._say("Time’s up! All done? Tick it off.") : a && a.status !== "completed" && (this._doToggle(a, !1, at("fh-ticks", {})), this._say(`Practice done – ${t.mins} minutes. Sounding good!`));
  }
  /* ---------------- rewards ---------------- */
  _redeem(t, a = !1) {
    const i = nt(this.hass, this._e.points);
    if (i < t.cost) {
      this._sound("locked"), this._picMode && z(`Not yet! ${Math.ceil((t.cost - i) / this._star)} more stars for ${t.name}.`), this._say(`Saving up: ${this._picMode ? `${Math.ceil((t.cost - i) / this._star)} more stars` : `${t.cost - i} to go`}. You’ll get there.`);
      return;
    }
    const o = t.approve ?? t.cost >= 60;
    if (o && this.pin && !a) {
      this._pinAsk = { reason: `${this.kid.name}: ${t.name}?`, run: () => this._redeem(t, !0) };
      return;
    }
    this.hass.callService("script", "fh_add_points", { kid: this._e.slug, points: -t.cost, lifetime: !1, reason: `reward: ${t.name}` }), this.owed && this.hass.states[this.owed] && this.hass.callService("todo", "add_item", { item: `${this.kid.name}: ${t.name}`, description: `${(/* @__PURE__ */ new Date()).toLocaleDateString("en-AU")} · ${t.cost} pts${o && !this.pin ? " · needs a grown-up OK" : ""}` }, { entity_id: this.owed }), this._confetti++, this._jump++, this._sound("unlock"), (t.dj ?? /\bdj\b|dinner music/i.test(t.name)) && O("fh-dj", { kid: this.kid.name, day: (/* @__PURE__ */ new Date()).toDateString() }), this._picMode && z(`Yay! ${t.name}!`), this._say(o ? `Nice saving, ${this.kid.name}. A grown-up will sort out: ${t.name}.` : `Nice saving, ${this.kid.name}! ${t.name} – your pick.`);
  }
  _feelPick(t) {
    this._feel = t, this._sound("tap"), this._picMode && z({ up: "Yay! I’m glad you feel happy.", mid: "Okay. Thanks for telling me.", down: "Thanks for telling me. Let’s find a grown-up for a hug." }[ke(t)]);
  }
  _feelReply(t) {
    (t === "chat" || t === "share") && this.hass?.callService("persistent_notification", "create", {
      title: t === "share" ? `${this.kid.name} has something good to share` : `${this.kid.name} would like a chat`,
      message: this._feel ? `${this.kid.name} said he’s feeling ${this._feel} and would like ${t === "share" ? "to tell you about it" : "a chat later"}.` : `${this.kid.name} would like a chat with a grown-up${this._wind ? " before bed" : ""}.`,
      notification_id: `fh_chat_${this._e.slug}`
    });
    const a = t === "hug" ? "Go find a grown-up for a big hug 🤗" : t === "ok" ? "Good to know. Thanks for sharing." : t === "share" ? "Lovely. A grown-up will come and hear all about it." : "A grown-up will come and chat soon.";
    this._say(a), this._picMode && z(a.replace(" 🤗", "")), this._feel = "";
  }
  /** Days off are a grown-up's call: the PIN opens a sheet with one big button per day. */
  _openDays() {
    if (!this.pin) {
      this._say("Set a parent PIN to mark days off.");
      return;
    }
    this._pinAsk = { reason: "Mark days off?", run: () => {
      this._days = !0;
    } };
  }
  _dayOff(t) {
    const a = (this.hass?.states[this._e.week]?.state ?? "-------").padEnd(7, "-").slice(0, 7), i = a[t] === "O" ? "-" : "O";
    this.hass.callService("input_text", "set_value", { entity_id: this._e.week, value: a.slice(0, t) + i + a.slice(t + 1) }), this._say(i === "O" ? "Marked as a day off." : "Day off removed.");
  }
  _daysSheet() {
    const t = (this.hass?.states[this._e.week]?.state ?? "-------").padEnd(7, "-").slice(0, 7);
    return l`<div class="celebrate" @click=${(a) => {
      a.target === a.currentTarget && (this._days = !1);
    }}>
      <div class="glass cbox" role="dialog" aria-modal="true" aria-label="Days off">
        <h2 class="t-head">Days off this week</h2>
        <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600);text-align:center">A day off never counts against ${this.kid.name}’s week.</span>
        <div class="daybtns">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((a, i) => l`<button class="tap" aria-pressed=${String(t[i] === "O")} @click=${() => this._dayOff(i)}>${a}<span>${t[i] === "O" ? "Day off" : t[i] === "G" ? "Good day" : "–"}</span></button>`)}</div>
        <button class="pill tap primary" style="height:52px;padding:0 28px;font-size:16px" @click=${() => {
      this._days = !1;
    }}>Done</button>
      </div></div>`;
  }
  _say(t) {
    this._msg = t, clearTimeout(this._msgTimer), this._msgTimer = window.setTimeout(() => {
      this._msg = "";
    }, 2800);
  }
  /* ---------------- render ---------------- */
  render() {
    if (!this.kid || !this.hass) return u;
    if (this._studio) return l`<fh-studio .hass=${this.hass} .kid=${this.kid} .look=${this._look} .life=${this._life} .grow=${this._grow} @close=${() => {
      this._studio = !1, this._jump++;
    }}></fh-studio>`;
    const t = this._e, a = this.hass, i = !a.states[t.points] || !a.states[t.chores];
    return l`<div style="display:contents;--kid:${T(this.kid.colour)}">
      ${this._hero()}
      ${i ? l`<section class="glass jobs"><div class="empty"><h2 class="t-sub">Set up ${this.kid.name}’s page</h2>
        <span>Create <b>${t.chores}</b> and <b>${t.points}</b> in Home Assistant.</span></div></section>` : this._jobs()}
      <div class="side scrolly" @scroll=${Z}>${this._wind ? l`${this._windCard()}<section class="glass card">${this._weekBody()}</section>` : this._tabs()}${this._jar()}${this._wind ? this._windChat() : this._feelCard()}</div>
      ${this._bursts.map((o) => l`<span class="burst" style="left:150px;top:260px">${o.text}</span>`)}
      ${this._confetti && !this._wind ? vi(this._confetti, Vi(this._confetti)) : u}
      ${this._celebrate ? this._celebration() : u}
      ${this._days ? this._daysSheet() : u}
      ${this._pinAsk ? l`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => {
      const o = this._pinAsk.run;
      this._pinAsk = null, o();
    }} @cancel=${() => {
      this._pinAsk = null;
    }}></fh-pin>` : u}
      ${this._msg ? l`<div class="toast" role="status">${this._msg}</div>` : u}
    </div>`;
  }
  _hero() {
    const t = this._e, a = this.hass, i = this._life, o = this._look, s = nt(a, t.points), r = ys(i), n = a.states[t.goal]?.state, c = Ie(i, this.kid.favourites, n && n !== "unknown" ? n : void 0), p = Oe(i), d = c ? Math.max(4, Math.round((i - p) / Math.max(1, c.req - p) * 100)) : 100, h = (a.states[t.week]?.state ?? "-------").padEnd(7, "-").slice(0, 7), m = (this._now.getDay() + 6) % 7, f = this._goodToday(), x = [...h].filter((K, A) => K === "G" || A === m && f).length;
    return l`<section class="glass hero" aria-label="${this.kid.name}’s avatar">
      <button class="tap avbtn" aria-label="Make ${this.kid.name} jump" @click=${() => {
      this._jump++, this._sound(this.kid.sound ?? "tap"), this._picMode && z(`Hi ${this.kid.name}! You have ${Math.floor(s / this._star)} stars.`);
    }}>
        ${ct(o, { size: 186, jump: this._jump, label: `${this.kid.name}’s avatar`, age: this.kid.age })}</button>
      <div style="display:flex;align-items:center;gap:10px;z-index:1"><h1 class="name">${this.kid.name}</h1>${this._picMode ? u : l`<span class="rank">${r.rank}</span>`}</div>
      ${this._picMode ? l`
        <div class="stat" style="width:100%;align-items:center;flex-direction:row;gap:12px"><span style="font-size:40px">🫙</span>
          <span style="display:flex;flex-direction:column;gap:2px">${(() => {
      const K = Math.floor(s / this._star);
      return K > 10 ? l`<b class="stars" style="font-size:30px">★ ${K}</b>` : K ? l`<span class="starjar">${"★".repeat(K).split("").map((A) => l`<i>${A}</i>`)}</span>` : l`<b class="stars" style="font-size:26px">☆</b>`;
    })()}
          <span>${Math.floor(s / this._star)} stars in my jar</span></span></div>` : l`
        <div style="width:100%;display:flex;flex-direction:column;gap:5px"><div class="xp meter"><div style="width:${Math.round(r.into / r.need * 100)}%"></div></div>
          <span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600);text-align:right">${r.need - r.into} more to ${r.nextRank}</span></div>
        <div class="stats">
          <div class="stat"><b>${s || "✨"}</b><span>${s ? "points to spend" : "Ready to start"}</span></div>
          <button class="stat tap" style="text-align:left" aria-label="Good days: ${x} this week. Grown-ups can mark a day off." @click=${() => this._openDays()}><span>Good days</span>
            <div class="dots" aria-hidden="true">${[...h].map((K, A) => l`<i class="${K === "G" || A === m && f ? "g" : K === "O" ? "o" : ""} ${A === m ? "t" : ""}"></i>`)}</div>
            <span>${x >= 5 ? "Full week ⭐" : `${x} this week`}</span></button>
        </div>`}
      ${this._wind ? l`<div class="nextup"><span style="font-size:13px;font-weight:var(--w-bold, 700);padding:6px">🌙 Studio opens in the morning</span></div>` : c ? l`<div class="nextup">
        <span class="shimmer" style="border-radius:50%;line-height:0">${ct(xt(o, c.cat, c.id, c.swatch), { size: 46, crop: "head", still: !0, age: this.kid.age })}</span>
        <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:14px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n === c.id ? "♥ Saving for" : "Next"}: ${c.label}</span>
          <div class="xp meter" style="height:7px"><div style="width:${d}%"></div></div>
          ${this._picMode ? u : l`<span class="muted" style="font-size:12px;font-weight:var(--w-semi, 600)">${c.req - i} to go</span>`}</span>
      </div>` : l`<div class="nextup"><span style="font-size:13px;font-weight:var(--w-bold, 700);padding:6px">You’ve unlocked the whole collection! New gear drops next term.</span></div>`}
      ${this.kid.special_time && !this._picMode ? l`<span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)">💛 Your time: ${this.kid.special_time}</span>` : u}
      ${this._wind ? u : (() => {
      const K = this.oneAtATime && this._block().todo.length > 0;
      return l`${K ? l`<span class="muted" style="font-size:13px;font-weight:var(--w-bold, 700);margin-top:auto">First jobs, then ${this._picMode ? "my look" : "studio"}</span>` : u}
          <button class="pill tap ${K ? "" : "primary"}" style="height:52px;width:100%;justify-content:center;font-size:16px;flex-shrink:0;${K ? "" : "margin-top:auto"}" @click=${() => {
        this._studio = !0, this._sound("tap");
      }}>${F("star", 20)}${this._picMode ? "🎨 My look" : "Style studio"}</button>`;
    })()}
    </section>`;
  }
  _goodToday() {
    const t = this._chores.filter((r) => r.lane === "routine"), a = this._chores.filter((r) => r.lane === "job"), i = t.filter((r) => r.status === "completed" && r.slot !== "bed").length, o = t.filter((r) => r.slot !== "bed").length, s = a.filter((r) => r.status === "completed").length;
    return t.length + a.length > 0 && i === o && (a.length === 0 || s >= Math.min(2, a.length));
  }
  /** What is on for this part of the day. */
  _block() {
    const t = Zt(this.kid.bedtime, this._now), a = Hi(t, this._now), i = this._chores, o = i.filter((d) => d.lane === "routine" && (d.slot === a || d.slot === "any" && !this._wind)), s = this._wind ? [] : i.filter((d) => d.lane === "job" && (d.slot === "any" || d.slot === a || a === "after" && d.slot === "am")), r = this._wind ? i.filter((d) => d.lane === "grow" && d.slot === "bed") : i.filter((d) => d.lane === "grow" && d.slot !== "bed" || d.lane === "grow" && a === "bed"), n = i.filter((d) => d.lane === "routine" && d.status !== "completed" && d.slot !== a && d.slot !== "any" && (a === "am" || a === "after" && d.slot === "bed")), c = this._picMode ? o : [...o, ...s, ...r], p = c.filter((d) => d.status !== "completed");
    return { bt: t, slot: a, routineNow: o, jobs: s, grow: r, later: n, visible: c, todo: p, done: c.length - p.length, total: c.length };
  }
  _jobs() {
    const { bt: t, slot: a, routineNow: i, jobs: o, grow: s, later: r, visible: n, todo: c, done: p, total: d } = this._block();
    this._nowUid = c[0]?.uid ?? "";
    const h = d - p, m = 2 * Math.PI * 22, f = d ? p / d : 0, x = this._wind ? h ? `Bedtime jobs: ${h} left · bed at ${Ae(t)}` : "All set for bed. Sleep well 🌙" : h ? `${h} left ${a === "am" ? "this morning" : a === "after" ? "this afternoon" : "tonight"}` : r.length ? "All done for now 🎉" : "All done – fresh start tomorrow", K = this.oneAtATime && !this._showAll, A = Math.min(60, I(t) - ut(this._now));
    return l`<section class="glass jobs" aria-label="Jobs">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1"><h1 class="t-title">${this._wind ? "Wind down" : this._picMode ? a === "am" ? "My morning" : a === "bed" ? "My bedtime" : "My jobs" : "Today"}</h1>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${x}</span></div>
        ${this.oneAtATime && this._showAll ? l`<button class="pill tap" @click=${() => {
      this._showAll = !1;
    }}>One at a time</button>` : u}
        ${this._picMode ? l`<button class="round tap" style="width:52px;height:52px;font-size:24px" aria-label="Read my jobs" @click=${() => z(i.filter((U) => U.status !== "completed").map((U) => U.summary).join(". ") || "All done! Great job!")}>🔊</button>` : u}
        ${this._wind && A > 0 ? l`<span class="bedclock" role="img" aria-label="${A} minutes until bed">${X(et(), "timer", { frac: A / 60, size: 52 })}<b>${A}<span>min</span></b></span>` : u}
        <div class="ring" role="img" aria-label="${p} of ${d} done"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--track)" stroke-width="6"></circle>
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray=${m} stroke-dashoffset=${m * (1 - f)} style="transition:stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)"></circle></svg><b>${p}/${d}</b></div>
      </div>
      ${K ? this._focusList(c, p, r.length) : l`<div class="list scrolly" data-fits @scroll=${Z}>
        ${this._picMode ? l`<div class="pics">${i.map((U) => this._pic(U))}</div>` : l`
            ${i.length ? l`<div class="sec"><h2>${qe[a]} routine</h2><span>just what we do</span></div>${i.map((U) => this._row(U))}` : u}
            ${o.length ? l`<div class="sec"><h2>Family jobs</h2><span>earn points · fill the jar</span></div>${o.map((U) => this._row(U))}` : u}
            ${s.length ? l`<div class="sec"><h2>Growing</h2><span>for you – surprises along the way</span></div>${s.map((U) => this._row(U))}` : u}`}
        ${r.length && !this._wind ? l`<div class="later"><span>Later: ${qe[r[0].slot]} (${r.length})</span><span>${r.map((U) => this._picMode ? ma(U) : "").join(" ")}</span></div>` : u}
        ${n.length ? u : l`<div class="wind"><span style="font-size:44px">🌤️</span><span>Nothing right now. Enjoy!</span></div>`}
      </div>`}
    </section>`;
  }
  /** One job at a time: Now, Next, and the rest tucked away. */
  _focusList(t, a, i) {
    const [o, s, ...r] = t;
    if (!o) return l`<div class="focus"><div class="allset"><span class="big-e">${this._wind ? "🌙" : "🎉"}</span>
      <h2 class="t-head">${this._wind ? "All set for bed" : a ? "All done!" : "Nothing right now"}</h2>
      <span class="muted" style="font-size:16px;font-weight:var(--w-semi, 600)">${this._wind ? "Sleep well." : a ? i ? "More later. Enjoy your free time!" : "Great work today." : "Enjoy!"}</span>
      ${a ? l`<button class="pill tap" @click=${() => {
      this._showAll = !0;
    }}>See what I did</button>` : u}</div></div>`;
    const n = r.length;
    return l`<div class="focus">
      <span class="label">Now</span>
      ${this._picMode ? this._pic(o, "big") : this._row(o, !0)}
      ${s ? l`<span class="label">Next</span>${this._picMode ? this._pic(s, "small") : this._row(s, !1, !0)}` : u}
      <span style="flex:1"></span>
      ${n || a ? l`<button class="later tap" @click=${() => {
      this._showAll = !0, this._sound("tap");
    }}>
        <span>${n ? `Later: ${n} more` : "That’s the last one!"}${a ? ` · ${a} done ✓` : ""}</span><span>Show all</span></button>` : u}
    </div>`;
  }
  _row(t, a = !1, i = !1) {
    const o = t.status === "completed", s = this._practice?.uid === t.uid ? this._practice : null, r = s ? Math.max(0, s.end - this._now.getTime()) : 0;
    return l`<div class="job row ${o ? "done" : ""} ${t.uid === this._nowUid ? "now" : ""} ${a ? "big" : ""} ${i ? "soonjob" : ""}" style="padding-right:10px" @click=${() => this._toggle(t)}>
      <button class="tap hit" aria-pressed=${String(o)}>
        <span class="box check">${o ? "✓" : ""}</span>
        ${this.kid.mode === "mixed" ? l`<span style="font-size:${a ? 40 : 28}px" aria-hidden="true">${ma(t)}</span>` : u}
        <span class="t content">${t.summary}</span></button>
      ${(t.lane === "grow" || t.song) && t.minutes && !o ? s ? l`<button class="play tap going" aria-label="Stop the timer, ${Math.max(1, Math.round(r / 6e4))} minutes left" @click=${(n) => {
      n.stopPropagation(), this._stopPractice();
    }}>${X(et(), "timer", { frac: r / (s.mins * 6e4), size: a ? 56 : 36 })}<span>${Math.floor(r / 6e4)}:${String(Math.floor(r % 6e4 / 1e3)).padStart(2, "0")}</span></button>` : l`<button class="play tap" aria-label="Start ${t.minutes} minute timer" @click=${(n) => {
      n.stopPropagation(), this._startPractice(t);
    }}>▶ ${t.minutes} min</button>` : u}
      ${t.lane === "job" ? l`<span class="plus">+${t.pts}</span>` : t.lane === "grow" && (o || !t.minutes) ? l`<span class="plus grow">🌱</span>` : u}
    </div>`;
  }
  _pic(t, a = "") {
    const i = t.status === "completed", o = Math.max(1, Math.round(t.pts / this._star));
    return l`<button class="pic tap ${i ? "done" : ""} ${t.uid === this._nowUid ? "now" : ""} ${a}" aria-pressed=${String(i)} @click=${() => this._toggle(t)}>
      <span class="e" aria-hidden="true">${ma(t)}</span><span class="pt">${t.summary}</span>
      ${t.pts && a !== "small" ? l`<span class="stars">${"★".repeat(o)}</span>` : u}${i ? l`<span class="tick">✓</span>` : u}</button>`;
  }
  _rewards() {
    const t = nt(this.hass, this._e.points), a = this.kid.rewards ?? Ms, i = this._star;
    return l`${a.map((o) => {
      const s = t >= o.cost;
      return l`<div class="rw"><span style="font-size:24px">${o.icon ?? "🎁"}</span><span class="n">${o.name}</span>
          <button class="tap ${s ? "" : "save"}" @click=${() => this._redeem(o)}>${this._picMode ? Math.round(o.cost / i) > 5 ? `${Math.round(o.cost / i)} ★` : "★".repeat(Math.max(1, Math.round(o.cost / i))) : s ? `${o.cost}` : `${o.cost - t} to go`}</button></div>`;
    })}`;
  }
  _tabs() {
    const a = this.oneAtATime && !this._tabPicked && this._block().todo.length > 0 ? "week" : this._tab, i = (o, s) => l`<button class="tab tap" aria-pressed=${String(a === o)} @click=${() => {
      this._tab = o, this._tabPicked = !0, this._sound("tap"), this._picMode && z(s);
    }}>${s}</button>`;
    return l`<section class="glass card tabcard" aria-label=${a === "rewards" ? "Rewards" : "Week"}>
      <div class="tabs">${i("rewards", this._picMode ? "⭐ My stars" : "🎁 Rewards")}${i("week", this._picMode ? "📅 Coming up" : "📅 My week")}</div>
      ${a === "rewards" ? this._rewards() : this._weekBody()}</section>`;
  }
  _windCard() {
    return l`<section class="glass card"><span class="label">Rewards</span><span style="font-size:15px;font-weight:var(--w-semi, 600)">The shop opens again in the morning 🌙</span>
      <span class="muted" style="font-size:13px">Bedtime ${Ae(Zt(this.kid.bedtime, this._now))}</span></section>`;
  }
  _jar() {
    const t = nt(this.hass, "input_number.family_jar"), a = this.jarTarget || 120, i = Math.min(1, t / a);
    return this.hass?.states["input_number.family_jar"] ? l`<section class="glass card" aria-label="Family jar"><div class="jar">
      <svg width="34" height="42" viewBox="0 0 48 60" aria-hidden="true"><rect x="8" y="2" width="32" height="7" rx="3" fill="var(--ink3)"></rect>
        <path d="M6 12 H42 V52 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 Z" fill="var(--chip-strong)" stroke="var(--ink3)" stroke-width="2"></path>
        <clipPath id="jc"><path d="M8 14 H40 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z"></path></clipPath>
        <rect clip-path="url(#jc)" x="6" y=${58 - 44 * i} width="36" height=${44 * i} fill="var(--accent)" style="transition:all .8s"></rect></svg>
      <span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="label">Family jar</span>
        <span style="font-size:15px;font-weight:var(--w-bold, 700)">${t >= a ? "Full! Time for " + this.jarReward : `${a - t} marbles to ${this.jarReward}`}</span>
      </span></div></section>` : l``;
  }
  _feelCard() {
    const t = this._picMode ? Ts : Ns, a = this._feel ? ke(this._feel) : "mid", i = this._picMode ? "height:56px;font-size:18px" : "", o = { up: "Lovely! Want to tell someone about it?", mid: "Thanks for telling me. Anything you need?", down: "Thanks for telling me. That sounds hard. A hug or a chat might help." }[a];
    return l`<section class="glass card" aria-label="How are you feeling">
      ${this._feel ? l`<span style="font-size:15px;font-weight:var(--w-semi, 600)">${o}</span>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${a === "up" ? l`<button class="pill tap" style=${i} @click=${() => this._feelReply("share")}>💬 Tell a grown-up</button><button class="pill tap" style=${i} @click=${() => this._feelReply("ok")}>👍 All good</button>` : l`<button class="pill tap" style=${i} @click=${() => this._feelReply("hug")}>🤗 Hug</button><button class="pill tap" style=${i} @click=${() => this._feelReply("chat")}>💬 Chat later</button><button class="pill tap" style=${i} @click=${() => this._feelReply("ok")}>I’m OK</button>`}</div>` : l`<div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span class="label">How are you feeling?</span>
            ${this._picMode ? l`<button class="round tap" style="font-size:20px" aria-label="Read the question" @click=${() => z("How are you feeling?")}>🔊</button>` : u}</div>
          <div class="feel ${this._picMode ? "three" : ""}">${t.map(([s, r]) => l`<button class="tap" aria-label=${r} @click=${() => this._feelPick(r)}>${s}</button>`)}</div>`}
    </section>`;
  }
  /** Worries often come up at bedtime: a quiet way to ask for a grown-up during wind-down. */
  _windChat() {
    return l`<section class="glass card" aria-label="Ask for a grown-up"><span style="font-size:15px;font-weight:var(--w-semi, 600)">Something on your mind?</span>
      <button class="pill tap" style="height:52px;justify-content:center;font-size:16px" @click=${() => {
      this._feel = "", this._feelReply("chat");
    }}>💬 Chat with a grown-up</button></section>`;
  }
  _weekBody() {
    const t = /* @__PURE__ */ new Date(), a = this._events.filter((o) => o.allDay ? o.start >= P(t) : o.start.getTime() > t.getTime() - 36e5).slice(0, 5), i = (o) => {
      if (Q(o, t)) return "Today";
      const s = Math.round((P(o).getTime() - P(t).getTime()) / 864e5);
      return this._picMode ? `${s} sleep${s > 1 ? "s" : ""}` : s === 1 ? "Tomorrow" : Yt(o);
    };
    return l`${this._wind ? l`<span class="label">${this._picMode ? "Coming up" : `${this.kid.name}’s week`}</span>` : u}
      ${a.length ? a.map((o, s) => l`<div class="wk"><span class="d">${s && i(a[s - 1].start) === i(o.start) ? "" : i(o.start)}</span>
        <span style="flex:1;font-weight:var(--w-semi, 600);display:flex;gap:6px;align-items:baseline"><span class="init sm" style="--c:${o.family ? "var(--p-family)" : "var(--kid)"};align-self:center" role="img" aria-label=${o.family ? "Family" : this.kid.name}>${o.family ? "F" : this.kid.name[0]}</span>
          <span>${o.title}${o.allDay ? "" : l` <span class="muted" style="font-weight:500">· ${B(o.start)}</span>`}</span></span></div>`) : l`<span class="muted" style="font-size:14px">Nothing on this week.</span>`}`;
  }
  _celebration() {
    const t = this._celebrate, a = this._look;
    return l`<div class="celebrate" @click=${(i) => {
      i.target === i.currentTarget && this._closeCelebrate(!1);
    }}>
      <div class="glass cbox" role="dialog" aria-label="New unlocks">
        <span class="rank" style="font-size:14px">${t.some((i) => Cs.has(i.id)) ? "SURPRISE!" : `NEW UNLOCK${t.length > 1 ? "S" : ""}`}</span>
        <h1 class="t-hero" style="text-align:center">${this.kid.name}, you unlocked ${t.length > 1 ? `${t.length} things` : t[0].label}!</h1>
        <div class="unl">${t.slice(0, 8).map((i, o) => l`<div style="animation-delay:${0.15 + o * 0.12}s">
          ${ct(xt(a, i.cat, i.id, i.swatch), { size: 96, crop: i.cat.crop, still: !0, age: this.kid.age })}${i.label}</div>`)}</div>
        <div style="display:flex;gap:12px"><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => this._closeCelebrate(!1)}>Later</button>
          ${this._wind ? u : l`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => this._closeCelebrate(!0)}>${F("star", 18)}Try it on</button>`}</div>
      </div>
    </div>`;
  }
};
ka.styles = [_, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 330px; flex-shrink: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 45%, transparent), transparent); pointer-events: none; }
    .name { font-size: 34px; font-weight: var(--w-heavy, 800); line-height: 1; }
    .rank { padding: 6px 12px; border-radius: 999px; background: var(--kid); color: #fff; font-size: 13px; font-weight: var(--w-heavy, 800); letter-spacing: .02em; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
    .stat { border-radius: 18px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .stat b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 13px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .dots { display: flex; gap: 5px; }
    .dots i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink3); }
    .dots i.g { background: var(--ok); border-color: var(--ok); }
    .dots i.o { border-style: dashed; opacity: .55; }
    .dots i.t { box-shadow: 0 0 0 2px var(--chip-strong), 0 0 0 4px var(--kid); }
    .daybtns { display: grid; grid-template-columns: repeat(7, 76px); gap: 10px; }
    .daybtns button { height: 84px; border-radius: 18px; background: var(--chip); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 15px; font-weight: var(--w-bold, 700); }
    .daybtns button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .daybtns button span { font-size: 12px; font-weight: var(--w-semi, 600); opacity: .85; }
    .nextup { width: 100%; display: flex; align-items: center; gap: 10px; border-radius: 18px; background: var(--chip); padding: 8px 12px 8px 8px; }
    .jobs { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
    /* a long list tightens before it scrolls: closer rows, then two columns */
    .list[data-fit] { gap: 5px; }
    .list[data-fit] .sec { margin-top: 1px; }
    .list[data-fit] .job { min-height: 46px; padding-top: 4px; padding-bottom: 4px; }
    .list[data-fit] .job .box { width: 28px; height: 28px; }
    .list[data-fit] .job .t { font-size: 16px; }
    .list[data-fit] .pic { min-height: 148px; }
    .list[data-fit] .pic .e { font-size: 72px; }
    .list[data-fit='2'], .list[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; column-gap: 10px; align-content: start; }
    .list[data-fit='2'] > :not(.job), .list[data-fit='3'] > :not(.job) { grid-column: 1 / -1; }
    :host([data-shape='tall']) { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto minmax(0, 1fr); }
    :host([data-shape='tall']) .hero { width: auto; grid-column: 1; grid-row: 1; }
    :host([data-shape='tall']) .side { width: auto; grid-column: 2; grid-row: 1; max-height: 560px; }
    :host([data-shape='tall']) .jobs { grid-column: 1 / -1; grid-row: 2; }
    :host([data-phone]) { display: flex; flex-direction: column; gap: 12px; flex: none; }
    :host([data-phone]) .jobs { order: 1; flex: none; }
    :host([data-phone]) .hero { order: 2; }
    :host([data-phone]) .side { order: 3; max-height: none; overflow: visible; }
    :host([data-phone]) .list, :host([data-phone]) .focus { overflow: visible; flex: none; display: flex !important; }
    :host([data-phone]) .pic.big { min-height: 230px; flex: none; }
    :host([data-phone]) .celebrate { position: fixed; border-radius: 0; }
    :host([data-phone]) .daybtns { grid-template-columns: repeat(4, 1fr); }
    .sec { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
    .sec h2 { font-size: 18px; font-weight: var(--w-heavy, 800); }
    .sec span { font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .job { display: flex; align-items: center; gap: 14px; padding: 10px 14px; min-height: 54px; flex-shrink: 0; border-radius: 18px; background: var(--chip); text-align: left; width: 100%; position: relative; }
    .job .box { width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid var(--ink3); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: var(--w-heavy, 800); transition: all .25s cubic-bezier(.2,1.4,.4,1); }
    /* a tap anywhere on the row ticks the job (the row listens; the button inside keeps it reachable by keyboard and screen reader) */
    .job { cursor: pointer; }
    .job > .hit { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; text-align: left; min-height: 44px; }
    .job.now { box-shadow: inset 0 0 0 2.5px var(--kid); }
    .pic.now { box-shadow: 0 0 0 4px var(--kid); }
    .focus { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
    .focus .label { font-size: 14px; margin-top: 4px; }
    .job.big { min-height: 96px; padding: 16px 18px; }
    .job.big .box { width: 52px; height: 52px; font-size: 26px; }
    .job.big .t { font-size: 28px; font-weight: var(--w-bold, 700); }
    .job.soonjob { opacity: .82; }
    .pic.big { flex: 4 1 0; min-height: 204px; max-height: 300px; }
    .pic.big .e { font-size: 124px; }
    .pic.big .pt { font-size: 28px; }
    .pic.small { min-height: 0; flex: 0 0 112px; flex-direction: row; justify-content: flex-start; gap: 16px; padding: 10px 20px; opacity: .85; }
    .pic.small .e { font-size: 72px; }
    .pic.small .pt { font-size: 20px; }
    .allset { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; }
    .allset .big-e { font-size: 72px; animation: hooray .9s cubic-bezier(.3,1.6,.5,1) both; }
    @keyframes hooray { from { transform: scale(.3) rotate(-20deg); opacity: 0; } to { transform: none; opacity: 1; } }
    button.later { width: 100%; min-height: 48px; align-items: center; text-align: left; }
    .feel.three { justify-content: space-around; }
    .feel.three button { font-size: 46px; width: 72px; height: 72px; }
    .job.done .box { background: var(--ok); border-color: var(--ok); transform: scale(1.08); }
    .job.done .t { color: var(--ink3); text-decoration: line-through; }
    .job .t { flex: 1; font-size: 18px; font-weight: var(--w-semi, 600); }
    .plus { font-size: 14px; font-weight: var(--w-heavy, 800); padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, var(--kid) 22%, transparent); white-space: nowrap; }
    .grow { background: color-mix(in srgb, var(--ok) 18%, transparent); }
    .play { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--primary); color: var(--on-primary); font-weight: var(--w-bold, 700); font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
    .play.going { height: auto; min-height: 44px; padding: 4px 14px 4px 4px; background: var(--chip-strong); color: var(--ink); font-variant-numeric: tabular-nums; font-size: 16px; }
    .later { padding: 10px 14px; border-radius: 16px; background: var(--chip-soft); font-size: 14px; font-weight: var(--w-semi, 600); color: var(--ink2); display: flex; justify-content: space-between; }
    .pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-content: start; }
    .pic { border-radius: 24px; background: var(--chip); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; min-height: 190px; justify-content: center; }
    .pic .pt { font-size: 17px; font-weight: var(--w-bold, 700); text-align: center; }
    .pic .e { font-size: 96px; line-height: 1.1; transition: transform .3s cubic-bezier(.2,1.6,.4,1); }
    .pic.done { background: color-mix(in srgb, var(--ok) 25%, var(--chip)); }
    .pic.done .e { transform: scale(.85) rotate(-8deg); opacity: .6; }
    .pic .tick { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; border-radius: 50%; background: var(--ok); color: var(--on-ok, #fff); display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: var(--w-heavy, 800); animation: avPop .4s cubic-bezier(.2,1.4,.4,1); }
    .stars { color: #f5b301; font-size: 20px; letter-spacing: 2px; }
    .avbtn { position: relative; flex: 0 1 223px; min-height: 110px; display: flex; justify-content: center; }
    .avbtn .avwrap, .avbtn svg { height: 100% !important; width: auto !important; max-height: 223px; }
    .starjar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0 3px; line-height: 1.05; }
    .starjar > i { font-style: normal; color: #f5b301; font-size: 24px; }
    .side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none; border-radius: 24px; }
    .side::-webkit-scrollbar { display: none; }
    .side > .card { flex-shrink: 0; }
    .side > .tabcard { flex: 0 1 auto; min-height: 180px; overflow-y: auto; scrollbar-width: none; gap: 8px; }
    .rw { display: flex; align-items: center; gap: 10px; padding: 5px 6px 5px 10px; flex-shrink: 0; border-radius: 14px; background: var(--chip); }
    .rw .n { flex: 1; font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.2; }
    .rw button { height: 44px; min-width: 56px; padding: 0 12px; border-radius: 999px; font-size: 14px; font-weight: var(--w-bold, 700); background: var(--primary); color: var(--on-primary); white-space: nowrap; }
    .rw button.save { background: var(--track); color: var(--ink2); }
    .jar { display: flex; align-items: center; gap: 12px; }
    .wk { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
    .wk .d { width: 78px; flex-shrink: 0; font-weight: var(--w-bold, 700); color: var(--ink2); font-size: 13px; }
    .bedclock { display: inline-flex; align-items: center; gap: 8px; line-height: 0; }
    .bedclock b { display: flex; flex-direction: column; align-items: center; font-size: 20px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .bedclock b span { font-size: 11px; font-weight: var(--w-bold, 700); color: var(--ink2); margin-top: 2px; }
    .ring { position: relative; width: 52px; height: 52px; }
    .ring svg { transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: var(--w-heavy, 800); }
    .feel { display: flex; justify-content: space-between; }
    .tabs { display: flex; gap: 6px; padding: 4px; border-radius: 999px; background: var(--chip-soft); }
    .tab { flex: 1; height: 40px; border-radius: 999px; font-size: 14px; font-weight: var(--w-bold, 700); color: var(--ink2); }
    .tab[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .feel button { font-size: 30px; width: 46px; height: 46px; border-radius: 50%; }
    .feel button:active { background: var(--chip-strong); }
    .celebrate { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); border-radius: 28px; }
    .cbox { border-radius: 32px; padding: 26px 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 720px; animation: sheet .5s cubic-bezier(.2,1.3,.3,1) both; }
    .unl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .unl > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: var(--w-bold, 700); animation: avPop .6s cubic-bezier(.2,1.4,.4,1) both; }
    @keyframes avPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
    .wind { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }
    ${$(Wa)}
    ${$(Ni)}
  `], ka.properties = {
  hass: { attribute: !1 },
  kid: { attribute: !1 },
  familyCalendars: { attribute: !1 },
  pin: {},
  owed: {},
  jarTarget: { type: Number },
  jarReward: {},
  privateWords: { attribute: !1 },
  quiet: { type: Boolean },
  oneAtATime: { type: Boolean },
  _showAll: { state: !0 },
  _tabPicked: { state: !0 },
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
  _feel: { state: !0 },
  _tab: { state: !0 },
  _days: { state: !0 }
};
let ci = ka;
const Cs = new Set(Je.map((e) => e.id));
customElements.get("fh-kid") || customElements.define("fh-kid", ci);
const js = ["light", "switch", "fan", "cover", "lock", "climate", "media_player", "input_boolean"], zs = /* @__PURE__ */ new Set(["on", "open", "playing", "unlocked", "heat", "cool", "heat_cool", "auto", "dry", "fan_only", "paused", "idle"]), Fa = class Fa extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.fitCtl = new yt(this), this.pin = "", this.hideScripts = [], this.hide = [], this._all = !1, this._unlocked = 0, this._askPin = null, this._went = "";
  }
  _rooms() {
    const t = this.hass, a = Object.values(t.areas ?? {}).sort((o, s) => o.name.localeCompare(s.name)), i = /* @__PURE__ */ new Map();
    for (const [o, s] of Object.entries(t.entities ?? {})) {
      const r = o.split(".")[0];
      if (!js.includes(r) || s.hidden || s.entity_category || this.hide.includes(o)) continue;
      const n = t.states[o];
      if (!n || n.state === "unavailable") continue;
      const c = s.area_id ?? (s.device_id ? t.devices?.[s.device_id]?.area_id : null);
      c && i.set(c, [...i.get(c) ?? [], n]);
    }
    return a.map((o) => ({ id: o.area_id, name: o.name, ents: (i.get(o.area_id) ?? []).sort((s, r) => s.entity_id.localeCompare(r.entity_id)) })).filter((o) => o.ents.length);
  }
  _toggle(t) {
    const a = t.entity_id.split(".")[0];
    a === "media_player" ? this.dispatchEvent(new CustomEvent("music", { detail: t.entity_id })) : a === "lock" ? this._guard(() => this.hass.callService("lock", t.state === "locked" ? "unlock" : "lock", { entity_id: t.entity_id })) : this.hass.callService("homeassistant", "toggle", { entity_id: t.entity_id });
  }
  _room(t, a) {
    const i = t.ents.filter((o) => o.entity_id.startsWith("light.")).map((o) => o.entity_id);
    i.length && this.hass.callService("light", a ? "turn_on" : "turn_off", { entity_id: i });
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
  _name(t, a) {
    const i = t.attributes.friendly_name ?? t.entity_id, o = i.replace(new RegExp(`^${a.replace(/[^\w ]/g, ".")}\\s*`, "i"), "");
    return o.length > 2 && !/^room\b/i.test(o) ? o[0].toUpperCase() + o.slice(1) : i;
  }
  _ic(t) {
    const a = t.entity_id.split(".")[0];
    return a === "light" ? "bulb" : a === "media_player" ? "music" : a === "lock" ? "home" : a === "switch" ? "bulb" : "home";
  }
  render() {
    if (!this.hass) return u;
    const t = this.hass, a = this._rooms(), i = (n) => !!t.entities?.[n]?.labels?.includes("family_hub"), o = Object.values(t.states).filter((n) => n.entity_id.startsWith("script.") && !this.hideScripts.includes(n.entity_id) && i(n.entity_id)), s = Object.values(t.states).filter((n) => n.entity_id.startsWith("automation.") && (this._all || i(n.entity_id))), r = a.reduce((n, c) => n + c.ents.filter((p) => p.entity_id.startsWith("light.") && p.state === "on").length, 0);
    return l`
      <section class="glass rooms" aria-label="Rooms">
        <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><h1 class="t-title">Home</h1>
          <span class="muted" style="font-size:13px">${r ? `${r} light${r > 1 ? "s" : ""} on` : "All lights off"} · ${a.length} rooms</span></div></div>
        <div class="rgrid" data-fits>
          ${a.map((n) => {
      const c = n.ents.filter((d) => d.entity_id.startsWith("light.")), p = c.some((d) => d.state === "on");
      return l`<div class="room ${p ? "lit" : ""}">
              <div class="rh"><h2>${n.name}</h2>${c.length ? l`<button class="toggle tap" role="switch" aria-label="${n.name} lights" aria-checked=${String(p)} @click=${() => this._room(n, !p)}></button>` : u}</div>
              ${n.ents.map((d) => {
        const h = zs.has(d.state), m = d.attributes.brightness;
        return l`<button class="dev tap ${h && d.entity_id.startsWith("light.") ? "on" : ""}" @click=${() => this._toggle(d)}>
                  <span class="dicon">${F(this._ic(d), 18)}</span><span class="n">${this._name(d, n.name)}</span>
                  <span class="s">${d.entity_id.startsWith("light.") && h && m ? `${Math.round(m / 255 * 100)}%` : d.state.replace(/_/g, " ")}</span></button>`;
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
    }}>${F("bulb", 20)}All on</button>
            <button class="scene tap ${this._went === "off" ? "go" : ""}" @click=${() => {
      this.hass.callService("light", "turn_off", { entity_id: "all" }), this._went = "off";
    }}>${F("bulbOff", 20)}All off</button>
            ${o.map((n) => l`<button class="scene tap ${this._went === n.entity_id ? "go" : ""}" @click=${() => {
      this.hass.callService("script", "turn_on", { entity_id: n.entity_id }), this._went = n.entity_id;
    }}>
              ${/movie|tv/i.test(n.entity_id) ? l`<span style="font-size:20px">🍿</span>` : /bed|night/i.test(n.entity_id) ? F("moon", 20) : F("star", 20)}${n.attributes.friendly_name ?? n.entity_id}</button>`)}
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
            ${s.length ? s.map((n) => l`<div class="auto"><span style="flex:1">${n.attributes.friendly_name ?? n.entity_id}</span>
              <button class="toggle tap" role="switch" aria-label=${n.attributes.friendly_name ?? n.entity_id} aria-checked=${String(n.state === "on")}
                @click=${() => this._guard(() => this.hass.callService("automation", n.state === "on" ? "turn_off" : "turn_on", { entity_id: n.entity_id }))}></button></div>`) : l`<span class="muted" style="font-size:14px">Household automations are in the grown-ups section.</span>`}
          </div>
        </section>
      </div>
      ${this._askPin ? l`<fh-pin .pin=${String(this.pin)} @ok=${() => {
      const n = this._askPin;
      this._askPin = null, this._unlocked = Date.now() + 5 * 6e4, n();
    }} @cancel=${() => {
      this._askPin = null;
    }}></fh-pin>` : u}`;
  }
};
Fa.styles = [_, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .rooms { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .rgrid { flex: 1; min-height: 0; overflow: auto; columns: 3 250px; column-gap: 12px; }
    /* more rooms than fit: narrower columns and closer rows, before any scrolling */
    .rgrid[data-fit] { columns: 4 200px; column-gap: 10px; }
    .rgrid[data-fit] .room { padding: 10px; gap: 6px; margin-bottom: 10px; border-radius: 18px; }
    .rgrid[data-fit] .dev { padding: 5px 8px; }
    .rgrid[data-fit] .rh h2 { font-size: 17px; }
    .rgrid[data-fit='2'], .rgrid[data-fit='3'] { columns: 5 170px; }
    .rgrid[data-fit='2'] .dev .s, .rgrid[data-fit='3'] .dev .s { display: none; }
    .rgrid[data-fit='3'] .dicon { width: 28px; height: 28px; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .rgrid { columns: 3 220px; }
    :host([data-shape='tall']) .side { width: auto; flex-direction: row; flex-shrink: 0; }
    :host([data-shape='tall']) .side > section { flex: 1 1 0; min-width: 0; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .rooms { padding: 14px; border-radius: 22px; }
    :host([data-phone]) .rgrid { columns: 1 !important; overflow: visible; flex: none; }
    :host([data-phone]) .side { flex-direction: column; }
    .room { break-inside: avoid; margin-bottom: 12px; border-radius: 22px; background: var(--chip); padding: 14px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .5s ease, background .5s ease; }
    .room.lit { background: color-mix(in srgb, #ffd166 22%, var(--chip)); box-shadow: 0 0 0 1px color-mix(in srgb, #ffb703 40%, transparent), 0 10px 30px -10px rgba(255,183,3,.55); }
    .rh { display: flex; align-items: center; gap: 8px; }
    .rh h2 { flex: 1; font-size: 19px; font-weight: var(--w-heavy, 800); }
    .dev { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 14px; background: var(--chip-soft); width: 100%; text-align: left; }
    .dev .dicon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--track); color: var(--ink2); flex-shrink: 0; transition: all .3s; }
    .dev.on .dicon { background: #ffd166; color: #7a4b00; box-shadow: 0 0 16px rgba(255,209,102,.8); }
    .dev .n { flex: 1; font-size: 14px; font-weight: var(--w-semi, 600); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dev .s { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); text-transform: capitalize; }
    .side { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .scenes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .scene { height: 64px; border-radius: 16px; background: var(--chip); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0 12px; font-size: 14px; font-weight: var(--w-bold, 700); text-align: left; }
    .scene.go { animation: go .8s ease; }
    @keyframes go { 30% { background: var(--primary); color: var(--on-primary); transform: scale(1.04); } }
    .auto { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-size: 14px; font-weight: var(--w-semi, 600); }
    .toggle { width: 50px; height: 30px; border-radius: 15px; background: var(--track); position: relative; flex-shrink: 0; transition: background .25s; }
    .toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.2); transition: transform .25s cubic-bezier(.2,1.4,.4,1); }
    .toggle[aria-checked='true'] { background: var(--ok); }
    .toggle[aria-checked='true']::after { transform: translateX(20px); }
    .alist { flex: 1; min-height: 0; overflow: auto; }
  `], Fa.properties = { hass: { attribute: !1 }, pin: {}, hideScripts: { attribute: !1 }, hide: { attribute: !1 }, _unlocked: { state: !0 }, _askPin: { state: !0 }, _went: { state: !0 }, _all: { state: !0 } };
let di = Fa;
customElements.get("fh-home") || customElements.define("fh-home", di);
const Et = (e, t) => e.entities?.[t]?.platform ?? "", Ti = (e) => !!e && e.state !== "unavailable", De = (e) => Object.keys(e.states).filter((t) => t.startsWith("media_player.") && Et(e, t) === "music_assistant" && !e.entities?.[t]?.hidden).map((t) => e.states[t]).filter(Ti), ea = (e) => !!e.services?.music_assistant && De(e).length > 0, Xe = (e, t) => {
  const a = De(e);
  return a.length ? a.sort((o, s) => String(o.attributes.friendly_name).localeCompare(String(s.attributes.friendly_name))) : (t.length ? t : Object.keys(e.states).filter((o) => o.startsWith("media_player."))).map((o) => e.states[o]).filter(Ti);
}, lt = (e, t, a) => {
  if (!a) return;
  const i = String(e.states[a]?.attributes.friendly_name ?? "").toLowerCase().trim();
  return t.find((o) => o.entity_id === a) ?? (i ? t.find((o) => String(o.attributes.friendly_name ?? "").toLowerCase().trim() === i) : void 0);
}, Pe = (e, t, a) => {
  const i = t.speaker;
  return lt(e, a, i) ?? (i && Ti(e.states[i]) ? e.states[i] : void 0) ?? a.find((o) => String(o.attributes.friendly_name ?? "").toLowerCase().includes(t.name.toLowerCase()));
}, fa = (e, t) => ({
  name: e.name ?? e.title ?? "",
  uri: e.uri ?? e.media_content_id ?? "",
  type: e.media_type ?? t,
  img: typeof e.image == "string" ? e.image : e.image?.path?.startsWith?.("http") ? e.image.path : e.thumbnail ?? void 0,
  sub: [(e.artists ?? []).map((a) => a.name).join(", "), e.album?.name].filter(Boolean).join(" · ") || void 0
});
let Wt;
const He = async (e) => {
  if (Wt !== void 0) return Wt;
  try {
    Wt = (await e.callWS({ type: "config_entries/get", domain: "music_assistant" }))[0]?.entry_id ?? null;
  } catch {
    Wt = null;
  }
  return Wt;
}, Ua = (e, t, a, i, o) => e.callWS({ type: "call_service", domain: t, service: a, service_data: i, ...o ? { target: o } : {}, return_response: !0 }).then((s) => s.response), Gs = [["tracks", 4], ["albums", 3], ["playlists", 3], ["artists", 1], ["radio", 2], ["podcasts", 1], ["audiobooks", 2]], Ls = async (e, t, a) => {
  const i = await He(e);
  if (i) {
    const s = await Ua(e, "music_assistant", "search", { config_entry_id: i, name: t, limit: 6 });
    return Gs.flatMap(([r, n]) => (s[r] ?? []).map((c) => fa(c, r.replace(/s$/, ""))).filter((c) => c.uri).slice(0, n));
  }
  if (!a) return [];
  const o = await Ua(e, "media_player", "search_media", { search_query: t }, { entity_id: a });
  return (Object.values(o)[0]?.result ?? []).map((s) => fa(s, s.media_content_type ?? "music")).filter((s) => s.uri);
}, Zs = async (e, t, a = "playlist") => {
  const i = await He(e);
  if (!i) return;
  const o = await Ua(e, "music_assistant", "search", { config_entry_id: i, name: t, media_type: [a], limit: 8 }), s = (o[`${a}s`] ?? o[a] ?? []).map((d) => fa(d, a)).filter((d) => d.uri), r = t.toLowerCase().trim(), n = r.split(/\s+/).filter((d) => d.length > 2), c = (d) => {
    const h = d.name.toLowerCase();
    return n.filter((m) => h.includes(m)).length;
  }, p = [...s].sort((d, h) => c(h) - c(d))[0];
  return s.find((d) => d.name.toLowerCase().trim() === r) ?? s.find((d) => d.name.toLowerCase().includes(r)) ?? (p && c(p) > 0 ? p : void 0);
}, Gt = (e, t, a, i = "play", o = !1) => e.services?.music_assistant && Et(e, t) === "music_assistant" ? e.callService("music_assistant", "play_media", { media_id: a, enqueue: i, ...o ? { radio_mode: !0 } : {} }, { entity_id: t }) : e.callService("media_player", "play_media", { media_content_id: a, media_content_type: "music", ...i === "play" ? {} : { enqueue: i } }, { entity_id: t }), Qs = async (e, t) => {
  if (Et(e, t) !== "music_assistant") return null;
  try {
    const a = Object.values(await Ua(e, "music_assistant", "get_queue", {}, { entity_id: t }))[0], i = (o) => o ? fa({ ...o.media_item ?? {}, name: o.media_item?.name ?? o.name, image: o.media_item?.image ?? o.image }, "track") : void 0;
    return a ? { items: a.items ?? 0, shuffle: !!a.shuffle_enabled, repeat: a.repeat_mode ?? "off", current: i(a.current_item), next: i(a.next_item) } : null;
  } catch {
    return null;
  }
}, Fe = (e, t, a) => {
  const i = e.entities?.[t]?.device_id;
  return i ? Object.values(e.entities ?? {}).find((o) => o.device_id === i && a.test(o.entity_id) && !!e.states[o.entity_id])?.entity_id : void 0;
}, hi = (e, t, a) => e.states["script.fh_music_sleep"] ? (e.callService("script", "fh_music_sleep", { player: t, minutes: a }), !0) : Et(e, t) === "sonos" ? (e.callService("sonos", "set_sleep_timer", { sleep_time: a * 60 }, { entity_id: t }), !0) : !1, Bs = (e, t) => e.states["script.fh_music_sleep"] ? (e.callService("script", "turn_off", {}, { entity_id: "script.fh_music_sleep" }), !0) : Et(e, t) === "sonos" ? (e.callService("sonos", "clear_sleep_timer", {}, { entity_id: t }), !0) : !1, Mt = (e) => `todo.${e.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_music`, Ys = async (e, t) => {
  if (!e.states[t]) return [];
  try {
    return (await e.callWS({ type: "todo/item/list", entity_id: t })).items.filter((i) => i.status !== "completed").map((i) => {
      const o = (i.description ?? "").split("|").map((s) => s.trim());
      return { uid: i.uid, name: i.summary, uri: o.find((s) => s.includes("://") && !/^(https?:|data:)/.test(s)) ?? o[0] ?? "", img: o.find((s) => /^(https?:|data:image)/.test(s)), type: "shelf", calm: /@calm/.test(i.description ?? "") };
    }).filter((i) => i.uri);
  } catch {
    return [];
  }
}, Js = (e, t, a, i = !1) => e.callService("todo", "add_item", { item: a.name.slice(0, 80), description: [a.uri, a.img, i ? "@calm" : ""].filter(Boolean).join(" | ") }, { entity_id: t }), Jt = [
  { id: "house", name: "House", icon: "home", about: "Rooms where they are", hint: "Drag the music or a record to a room. Slide up or down for volume." },
  { id: "scene", name: "Scene", icon: "scene", about: "The theme comes alive", hint: "" },
  { id: "dial", name: "Dial", icon: "dial", about: "One big knob and a tuner", hint: "Drag round an arc for louder. Tap an arc to add or drop the room. Slide the tuner to change the music." },
  { id: "desk", name: "Desk", icon: "desk", about: "Faders, a jog wheel and pads", hint: "Slide a fader for volume. Turn the wheel to move through the song. A pad starts a moment." },
  { id: "cables", name: "Crate", icon: "sleeve", about: "Records, a turntable and cables", hint: "Flick through the crate. Drop a record on the turntable or a speaker." },
  { id: "list", name: "List", icon: "list", about: "Plain tiles", hint: "Tap a room to control it. ＋ adds it to the music." }
], _e = {
  sea: "Sail two boats together to share the music.",
  reef: "Swim two fish together to share the music.",
  space: "Drag a planet onto an orbit to join that music.",
  bush: "Move two fires together to share the music.",
  sunset: "Fly two kites together to share the music.",
  fridge: "Push two magnets together to share the music.",
  orbit: "Drag a planet onto an orbit to join that music."
}, Ee = (e, t) => e === "glass" ? _e[t] ? t : "sea" : e === "fridge" ? "fridge" : "orbit", ye = (e, t, a) => e === "scene" ? `${_e[Ee(t, a)]} Carry a record from the shelf to a room.` : Jt.find((i) => i.id === e)?.hint ?? "", At = (e) => Math.max(0, Math.min(100, Math.round(e))), ot = (e, t, a, i = 6) => {
  const o = e.currentTarget, s = e.clientX, r = e.clientY;
  let n = !1;
  const c = (d) => {
    const h = d;
    !n && Math.hypot(h.clientX - s, h.clientY - r) < i || (n = !0, t(h));
  }, p = (d) => {
    o.removeEventListener("pointermove", c), o.removeEventListener("pointerup", p), o.removeEventListener("pointercancel", p), a(n && d.type !== "pointercancel", d);
  };
  o.setPointerCapture(e.pointerId), o.addEventListener("pointermove", c), o.addEventListener("pointerup", p), o.addEventListener("pointercancel", p);
}, Wi = (e, t, a, i) => (o) => {
  if (o.target.closest("[data-notrack]")) return;
  if (!t.hasVol) {
    ot(o, () => {
    }, (p) => {
      p || i?.();
    });
    return;
  }
  const s = t.vol, r = o.clientY, n = Math.max(40, a(o.currentTarget)), c = (p) => At(s + (r - p.clientY) / n * 100);
  ot(o, (p) => e.vol(t.id, c(p), !1), (p, d) => {
    p ? e.vol(t.id, c(d), !0) : i?.();
  });
}, Ma = (e, t) => (a) => {
  const i = a.key === "ArrowUp" || a.key === "ArrowRight" ? 5 : a.key === "ArrowDown" || a.key === "ArrowLeft" ? -5 : 0;
  i && t.hasVol ? (a.preventDefault(), e.vol(t.id, At(t.vol + i), !0)) : (a.key === "Enter" || a.key === " ") && (a.preventDefault(), e.toggle(t.id));
}, $e = (e) => e.offline ? "Offline" : e.live ? `${e.playing ? "" : "Paused · "}${e.vol}` : e.asleep ? "Asleep" : "Off", Ca = (e) => e.offline ? `${e.name}: offline.` : `${e.name}: ${e.live ? e.playing ? "playing" : "paused" : e.asleep ? "asleep" : "off"}${e.hasVol ? `, volume ${e.vol}` : ""}. Up and down arrows change the volume, Enter adds or drops the room.`, mt = (e) => e.colour ? `--c:${e.colour}` : "", mi = (e, t) => [200 + e * Math.cos(t * Math.PI / 180), 200 + e * Math.sin(t * Math.PI / 180)], Oa = (e, t, a) => {
  const [i, o] = mi(e, t), [s, r] = mi(e, a);
  return `M${i.toFixed(1)} ${o.toFixed(1)} A${e} ${e} 0 ${a - t > 180 ? 1 : 0} 1 ${s.toFixed(1)} ${r.toFixed(1)}`;
}, Is = (e) => {
  const t = e.rooms.length, a = 360 / Math.max(t, 3), i = 9, o = 2 * Math.PI * 106, s = (U, y, q) => (k) => {
    const w = k.currentTarget.ownerSVGElement, S = (V) => {
      const C = w.getBoundingClientRect(), Rt = ((Math.atan2(V.clientY - (C.top + C.height / 2), V.clientX - (C.left + C.width / 2)) * 180 / Math.PI - y) % 360 + 360) % 360;
      return At((Rt > q + (360 - q) / 2 ? 0 : Math.min(Rt, q)) / q * 100);
    };
    if (!U.hasVol) {
      ot(k, () => {
      }, (V) => {
        V || e.toggle(U.id);
      });
      return;
    }
    ot(k, (V) => e.vol(U.id, S(V), !1), (V, C) => {
      V ? e.vol(U.id, S(C), !0) : e.toggle(U.id);
    });
  }, r = e.dial, n = r.stops.length, c = r.stops.findIndex((U) => U.on), p = (U) => (U + 0.5) / Math.max(1, n) * 100, d = (U) => {
    const y = U.currentTarget, q = y.querySelector(".tneedle"), k = y.getBoundingClientRect(), w = (V) => Math.max(0, Math.min(1, (V.clientX - k.left) / k.width)), S = (V) => Math.max(0, Math.min(n - 1, Math.round(w(V) * n - 0.5)));
    n && ot(U, (V) => {
      q && (q.style.transition = "none", q.style.left = `${w(V) * 100}%`);
    }, (V, C) => {
      q && (q.style.transition = "", q.style.left = `${p(S(C))}%`), r.tune(S(C));
    }, 4);
  }, h = (U) => {
    const y = U.key === "ArrowRight" || U.key === "ArrowUp" ? 1 : U.key === "ArrowLeft" || U.key === "ArrowDown" ? -1 : 0;
    y && n && (U.preventDefault(), r.tune(Math.max(0, Math.min(n - 1, (c < 0 ? y > 0 ? -1 : n : c) + y))));
  }, m = r.sleep.left, f = m === null ? 0 : Math.max(0.02, Math.min(1, m / Math.max(1, r.sleep.mins))), x = f * 2 * Math.PI, K = 20 + 16 * Math.sin(x), A = 20 - 16 * Math.cos(x);
  return l`<div class="dialwrap">
    <section class="dcard dnext" aria-label="Up next"><h3>Up next</h3>
      ${r.next.length ? r.next.map((U) => l`<div class="dn"><i class="puck onshelf" style="--art:${U.art ? `url(${U.art})` : "linear-gradient(135deg, var(--p-3), var(--p-5))"}"></i><span><b>${U.title}</b><span>${U.sub}</span></span></div>`) : l`<p class="dnone">Nothing queued. Slide the tuner, or let someone choose.</p>`}
      ${r.more > 0 ? l`<p class="dnone">+${r.more} more after that</p>` : u}</section>
    <div class="dmid"><div class="bigdial" data-fits>
    <svg viewBox="0 0 400 400">
      <circle class="dplate" cx="200" cy="200" r="184"></circle>
      ${e.now.playing ? g`<circle class="dripple" cx="200" cy="200" r="100"></circle><circle class="dripple late" cx="200" cy="200" r="100"></circle>` : u}
      ${e.rooms.map((U, y) => {
    const q = -90 + y * a + i / 2, k = a - i, w = q + k * Math.max(0.03, U.vol / 100), [S, V] = mi(152, w), C = U.live;
    return g`<g class="darc" data-zone=${U.id} ?data-live=${C} ?data-playing=${U.playing} ?data-asleep=${U.asleep} ?data-offline=${U.offline} ?data-focus=${U.focus} ?data-hot=${e.over === U.id} style=${mt(U)} role="slider" tabindex="0" aria-label=${Ca(U)}
          aria-valuemin="0" aria-valuemax="100" aria-valuenow=${U.vol} @pointerdown=${s(U, q, k)} @keydown=${Ma(e, U)}>
          <path class="dhit" d=${Oa(152, q, q + k)}></path><path class="dtrack" d=${Oa(152, q, q + k)}></path>
          ${U.hasVol ? g`<path class="dfill" d=${Oa(152, q, w)}></path><circle class="dknob" cx=${S} cy=${V} r="13"></circle>` : u}</g>`;
  })}
      <circle class="dprogt" cx="200" cy="200" r="106"></circle>
      <circle class="dprog" cx="200" cy="200" r="106" stroke-dasharray="${e.now.frac * o} ${o}" transform="rotate(-90 200 200)"></circle>
    </svg>
    <button class="dcover tap" ?data-playing=${e.now.playing} style=${e.now.art ? `--art:url(${e.now.art})` : ""} aria-label=${e.now.playing ? "Pause" : "Play"} @click=${() => e.playPause()}><span>${v(e.now.playing ? "pause" : "play", 30)}</span></button>
    ${e.rooms.map((U, y) => {
    const q = -90 + y * a + a / 2, k = Math.cos(q * Math.PI / 180), w = Math.sin(q * Math.PI / 180), S = k > 0.3 ? "0" : k < -0.3 ? "-100%" : "-50%", V = Math.abs(k) > 0.3 ? "-50%" : w > 0 ? "0" : "-100%";
    return l`<button class="dlabel tap" style="left:${50 + 47.5 * k}%;top:${50 + 47.5 * w}%;transform:translate(${S},${V});text-align:${k > 0.3 ? "left" : k < -0.3 ? "right" : "center"}" aria-pressed=${String(U.focus)} aria-label="Show ${U.name} in the player" @click=${() => e.focus(U.id)}>
        <b>${U.asleep ? "☾ " : ""}${U.name}</b><span>${$e(U)}</span></button>`;
  })}
  </div></div>
    <section class="dcard dturn" aria-label="Whose turn"><h3>Whose turn</h3>
      <div class="dcoins">${r.turn.map((U) => l`<button class="dcoin tap" style="--c:${U.colour}" ?data-now=${U.now} aria-label="${U.name} chooses a song${U.now ? " (their turn)" : ""}" @click=${() => r.choose(U.name)}>${U.short}</button>`)}</div>
      <p class="dwho">${r.chooser ? l`<b>${r.chooser}</b> chooses next` : "Tap a face to choose a song"}</p>
      <button class="dsleep tap" ?data-on=${m !== null} @click=${() => r.sleepGo()}>
        <svg viewBox="0 0 40 40" aria-hidden="true"><circle class="swt" cx="20" cy="20" r="17"></circle>${m !== null ? g`<path class="sww" d="M20 20 L20 4 A16 16 0 ${x > Math.PI ? 1 : 0} 1 ${K.toFixed(2)} ${A.toFixed(2)} Z"></path>` : u}</svg>
        <span><b>Sleep fade</b><span>${m !== null ? `${m} min left` : `Fade out in ${r.sleep.mins} min`}</span></span></button></section>
    <div class="tuner" role="slider" tabindex="0" aria-label="Tuner. Slide to a favourite or a station to play it." aria-valuemin="1" aria-valuemax=${Math.max(1, n)} aria-valuenow=${c < 0 ? 1 : c + 1} aria-valuetext=${c < 0 ? "Not tuned" : r.stops[c].name} @pointerdown=${d} @keydown=${h}>
      <i class="tticks" aria-hidden="true"></i>
      ${r.stops.map((U, y) => l`<span class="tstop" ?data-on=${U.on} style="left:${p(y)}%;max-width:${(100 / n - 2).toFixed(1)}%">${U.name}</span>`)}
      ${n ? l`<i class="tneedle" aria-hidden="true" ?data-on=${c >= 0} style="left:${c < 0 ? 2 : p(c)}%"></i>` : l`<span class="tstop" style="left:50%">Pin music or add stations to fill the tuner</span>`}
    </div></div>`;
}, Os = (e) => {
  const t = e.rooms.filter((p) => p.live && p.hasVol), a = t.length ? Math.round(t.reduce((p, d) => p + d.vol, 0) / t.length) : 0, i = (p) => {
    if (!t.length) return;
    const d = t.map((x) => [x.id, x.vol]), h = p.clientY, m = Math.max(40, p.currentTarget.getBoundingClientRect().height), f = (x, K) => {
      const A = (h - x.clientY) / m * 100;
      for (const [U, y] of d) e.vol(U, At(y + A), K);
    };
    ot(p, (x) => f(x, !1), (x, K) => {
      x && f(K, !0);
    });
  }, o = (p) => {
    const d = p.live ? Math.max(1, Math.round(p.vol / 10)) : 0;
    return l`<div class="strip" data-zone=${p.id} ?data-live=${p.live} ?data-playing=${p.playing} ?data-asleep=${p.asleep} ?data-offline=${p.offline} ?data-focus=${p.focus} ?data-hot=${e.over === p.id} style=${mt(p)}>
      <button class="sname tap" aria-pressed=${String(p.focus)} aria-label="Show ${p.name} in the player" @click=${() => e.focus(p.id)}>${p.name}</button>
      <button class="lamp tap" aria-pressed=${String(p.focus ? p.live : p.inmix)} ?data-other=${p.live && !p.focus && !p.inmix} aria-label=${p.focus ? `${p.live ? "ON" : "OFF"}: ${p.name} is the room in the player. ${p.playing ? "Pause" : "Play"}` : p.inmix ? `ON. Remove ${p.name} from the music` : p.live ? `${p.name} has other music. Swap it for this music` : `OFF. Add ${p.name} to the music`} @click=${() => {
      p.focus ? e.playPause() : e.toggle(p.id);
    }}>${p.offline ? "–" : p.asleep && !p.live ? "☾" : p.focus ? p.live ? "ON" : "OFF" : p.inmix ? "ON" : p.live ? "♪" : "OFF"}</button>
      <div class="well"><span class="vu" aria-hidden="true">${Array.from({ length: 10 }, (h, m) => l`<i ?data-lit=${9 - m < d} ?data-peak=${9 - m >= d - 2 && 9 - m < d}></i>`)}</span>
        <div class="fader" role="slider" tabindex="0" aria-orientation="vertical" aria-label=${Ca(p)} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${p.vol} @pointerdown=${(h) => {
      const m = h.currentTarget.getBoundingClientRect(), f = h.clientY;
      Wi(e, p, (x) => x.getBoundingClientRect().height, () => {
        p.hasVol && e.vol(p.id, At((m.bottom - f) / m.height * 100), !0);
      })(h);
    }} @keydown=${Ma(e, p)}>
          <i class="slot"></i>${p.hasVol ? l`<i class="run" style="height:${p.vol}%"></i><i class="fcap" style="bottom:${p.vol}%"></i>` : u}</div></div>
      <span class="sval">${p.hasVol ? p.vol : "–"}</span></div>`;
  }, s = (p) => {
    const d = p.currentTarget.getBoundingClientRect(), h = d.left + d.width / 2, m = d.top + d.height / 2, f = (U) => Math.atan2(U.clientY - m, U.clientX - h) * 180 / Math.PI;
    let x = f(p), K = 0;
    const A = (U) => {
      const y = f(U);
      let q = y - x;
      return q > 180 ? q -= 360 : q < -180 && (q += 360), x = y, K += q, K;
    };
    ot(p, (U) => e.jogTo(A(U), !1), (U, y) => {
      U ? e.jogTo(A(y), !0) : e.jogTo(0, !0);
    }, 4);
  }, r = (p) => {
    const d = p.key === "ArrowRight" || p.key === "ArrowUp" ? 10 : p.key === "ArrowLeft" || p.key === "ArrowDown" ? -10 : 0;
    d && (p.preventDefault(), e.seekBy(d));
  }, n = e.jog, c = n.at * 3 + (n.turn ?? 0);
  return l`<div class="desk" data-fits>
    <div class="dside">
      <div class="dnow"><span class="dart" ?data-playing=${e.now.playing} style=${e.now.art ? `--art:url(${e.now.art})` : ""} aria-hidden="true"><i></i></span>
        <span class="dtx"><i>${e.now.playing ? "Now playing" : e.now.lead ? "Paused" : "Ready"}</i><b>${e.now.title}</b><span>${e.now.artist}</span></span></div>
      <div class="tkeys"><button class="tkey tap" aria-label="Previous" @click=${() => e.prev()}>${v("prev", 26)}</button>
        <button class="tkey go tap" data-go aria-label=${e.now.playing ? "Pause" : "Play"} @click=${() => e.playPause()}>${v(e.now.playing ? "pause" : "play", 28)}</button>
        <button class="tkey tap" aria-label="Next" @click=${() => e.next()}>${v("next", 26)}</button></div>
      <div class="dplay">
        <div class="jog" role="slider" tabindex="0" aria-label="Jog wheel. Turn it to move through the song; past the end it skips to the next." aria-valuemin="0" aria-valuemax=${Math.round(n.len)} aria-valuenow=${Math.round(n.at)} aria-valuetext=${n.says}
          ?data-held=${n.turn !== null} @pointerdown=${s} @keydown=${r}><i class="jring" style="transform:rotate(${c.toFixed(1)}deg)"><i></i></i><b>${n.read}</b></div>
        <div class="pads">${e.moments.map((p, d) => l`<button class="mpad tap" style="--c:var(--p-${[2, 5, 3, 4][d % 4]})" ?data-on=${p.on} ?data-busy=${p.busy} aria-pressed=${String(p.on)} @click=${() => e.moment(d)}><span aria-hidden="true">${p.icon}</span>${p.name}</button>`)}</div>
      </div>
    </div>
    <div class="dstrips">${e.rooms.map(o)}
    <div class="strip master" ?data-live=${t.length > 0}>
      <span class="sname">Whole house</span>
      <button class="lamp tap" data-drop="all" ?data-hot=${e.over === "all"} aria-label="Play in every room" @click=${() => e.all()}>ALL</button>
      <div class="well"><div class="fader" role="slider" tabindex="0" aria-orientation="vertical" aria-label="Volume of every room with music" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${a} @pointerdown=${i}
        @keydown=${(p) => {
    const d = p.key === "ArrowUp" ? 5 : p.key === "ArrowDown" ? -5 : 0;
    if (d) {
      p.preventDefault();
      for (const h of t) e.vol(h.id, At(h.vol + d), !0);
    }
  }}>
        <i class="slot"></i><i class="run" style="height:${a}%"></i><i class="fcap" style="bottom:${a}%"></i></div></div>
      <span class="sval">${t.length ? a : "–"}</span></div></div></div>`;
}, Re = 6, Ds = (e) => {
  const t = e.crate, a = t.items.length, i = Math.max(0, Math.min(a - 1, t.at)), o = Math.max(0, Math.min(i - 2, a - Re)), s = t.items.slice(o, o + Re), r = t.items[i], n = (K) => (K + 0.5) / e.rooms.length * 100, c = (K) => K.focus ? K.live : K.inmix, p = t.who === "Family" ? "Family crate" : `${t.who}’s crate`, d = (K, A) => l`<div class="cab" data-zone=${K.id} ?data-live=${K.live} ?data-playing=${K.playing} ?data-asleep=${K.asleep} ?data-offline=${K.offline} ?data-focus=${K.focus} ?data-hot=${e.over === K.id}
      style="--top:${n(A)}%;--n:${e.rooms.length};${mt(K)}" @pointerdown=${Wi(e, K, () => 180, () => e.focus(K.id))}>
    <span class="chit" role="slider" tabindex="0" aria-label=${Ca(K)} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${K.vol} @keydown=${Ma(e, K)}><span class="cone" aria-hidden="true"><i></i></span>
    <span class="ctext"><b>${K.asleep ? "☾ " : ""}${K.name}</b><span>${K.offline ? "Offline" : K.live ? K.hasVol ? `Volume ${K.vol}` : K.title || "Music" : K.asleep ? "Asleep" : "Plug in to play"}</span></span>
    ${K.hasVol ? l`<span class="cknob" aria-hidden="true" style="--turn:${-135 + K.vol * 2.7}deg"><i></i></span>` : u}</span>
    <button class="sock tap" data-notrack aria-pressed=${String(c(K))} aria-label="${K.inmix || K.focus ? "Remove" : "Add"} ${K.name} ${K.inmix || K.focus ? "from" : "to"} the music" @click=${() => e.toggle(K.id)}>${c(K) ? "" : "＋"}</button></div>`, h = e.rooms.map((K, A) => [K, A]).filter(([K]) => c(K)), m = (K) => 39 + (K - (h.length - 1) / 2) * Math.min(9, 60 / Math.max(1, h.length)), f = h.map(([K, A], U) => {
    const q = m(U), k = 76, w = n(A), S = 9 + Math.abs(w - q) * 0.18;
    return g`<path class="wire" ?data-playing=${K.playing} style="${mt(K)};animation-delay:${-U * 0.4}s" d="M${70.6} ${q} C${70.6 + 3.4} ${q + S}, ${k - 3.4} ${w + S}, ${k} ${w}"></path>`;
  }), x = (K, A) => {
    const U = o + A, y = U === i, q = 0.5 + (A - (s.length - 1) / 2) / Math.max(3, s.length - 1);
    return l`<button class="sleeve tap" ?data-front=${y} style="z-index:${10 - Math.abs(U - i)};--x:${q};--tilt:${(-9 + 17 * q).toFixed(1)}deg;--art:${K.img ? `url(${K.img})` : `linear-gradient(135deg, var(--p-${U % 5 + 1}), var(--p-${(U + 2) % 5 + 1}))`}"
      aria-label="${K.name}. ${y ? `Tap to play in ${t.room}` : "Tap to bring it to the front"}, or drag it to the turntable or a speaker."
      @pointerdown=${(k) => e.carryItem(k, K, (w) => t.flick(Math.max(0, Math.min(a - 1, i - Math.round(w / 52)))))} @click=${() => t.tap(U)}><i class="vinyl"></i><span class="sart">${K.img ? "" : K.name[0]}</span></button>`;
  };
  return l`<div class="rig" data-fits>
    <svg class="wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${f}</svg>
    <div class="cratecol">
      <div class="ctabs" role="group" aria-label="Whose crate">${t.tabs.map((K) => l`<button class="ctab tap" style="--c:${K.colour}" aria-pressed=${String(K.name === t.who)} @click=${() => t.pick(K.name)}>${K.name}</button>`)}</div>
      <div class="sleeves">${s.map(x)}</div>
      <div class="cbox">
        <div class="clabel">${a > 1 ? l`<button class="cnav tap" aria-label="Flick back" ?disabled=${i === 0} @click=${() => t.flick(i - 1)}>${v("prev", 20)}</button>` : u}
          <b>${t.calm ? "🌙 " : ""}${p}</b>${a > 1 ? l`<button class="cnav tap" aria-label="Flick forward" ?disabled=${i === a - 1} @click=${() => t.flick(i + 1)}>${v("next", 20)}</button>` : u}</div>
        ${r ? l`<span class="cpick"><b>${r.name}</b><span>${a > 1 ? `${i + 1} of ${a} · ` : ""}tap it to play in ${t.room}</span></span>` : l`<span class="cpick"><b>${t.calm ? "Nothing calm pinned yet" : "Nothing pinned yet"}</b><span>Search for music, then tap Pin.</span></span>`}
      </div>
    </div>
    <div class="tdeck">
      <div class="ttable" data-drop="deck" ?data-hot=${e.over === "deck"}>
        <div class="tplat"><button class="cdisc tap" ?data-playing=${e.now.playing} style=${e.now.art ? `--art:url(${e.now.art})` : ""} aria-label=${e.now.playing ? "Pause" : "Play"} @click=${() => e.playPause()}></button>
          <i class="tarm" aria-hidden="true" style="--arm:${e.now.lead ? (12 + 18 * e.now.frac).toFixed(1) : 0}deg"><i></i></i><i class="tpivot" aria-hidden="true"></i></div>
        <span class="ttitle"><b>${e.now.title}</b><span>${e.now.artist || (e.now.lead ? "" : "Drop a record here")}</span></span>
        ${h.map((K, A) => l`<i class="jack" aria-hidden="true" style="top:${m(A) / 78 * 100}%"></i>`)}
      </div>
      <div class="tkeys"><button class="tkey tap" aria-label="Previous" @click=${() => e.prev()}>${v("prev", 28)}</button>
        <button class="tkey go tap" data-go aria-label=${e.now.playing ? "Pause" : "Play"} @click=${() => e.playPause()}>${v(e.now.playing ? "pause" : "play", 30)}</button>
        <button class="tkey tap" aria-label="Next" @click=${() => e.next()}>${v("next", 28)}</button></div>
    </div>
    ${e.rooms.map(d)}</div>`;
}, Xs = g`<path class="amoon" d="M66 22a11 11 0 1 0 8 17 8.5 8.5 0 0 1-8-17z"></path>`, to = {
  sea: (e, t) => {
    const a = 22 + 62 * t;
    return g`<g class="bob">
    <path class="ahull" d="M12 98H88L76 114H24Z"></path><path class="aline" d="M50 98V14"></path>
    ${e.live ? g`<path class="afill" d="M54 92V${92 - a}L${54 + a * 0.52} 92Z"></path><path class="afill soft" d="M46 92V${92 - a * 0.7}L${46 - a * 0.32} 92Z"></path>${e.playing ? g`<path class="aflag" d="M50 14l18 6-18 6z"></path>` : u}` : g`<rect class="aidle" x="46" y="30" width="8" height="62" rx="4"></rect>`}</g>`;
  },
  reef: (e, t) => {
    const a = 20 + 22 * t;
    return g`<g class="swim">
    <path class=${e.live ? "afill" : "aidle"} d="M${50 - a} 70L${50 - a * 1.8} ${70 - a * 0.62}V${70 + a * 0.62}Z"></path>
    <ellipse class=${e.live ? "afill edge" : "aidle edge"} cx="50" cy="70" rx=${a * 1.15} ry=${a * 0.74}></ellipse>
    <circle class="aeye" cx=${50 + a * 0.6} cy=${70 - a * 0.16} r=${Math.max(3, a * 0.15)}></circle><circle class="apupil" cx=${50 + a * 0.65} cy=${70 - a * 0.16} r=${Math.max(1.5, a * 0.07)}></circle></g>
    ${e.playing ? g`<circle class="abub" cx=${58 + a} cy="52" r="3"></circle><circle class="abub late" cx=${66 + a} cy="60" r="4.5"></circle>` : u}`;
  },
  space: (e, t) => {
    const a = 9 + 21 * t;
    return g`${e.playing ? g`<circle class="aglow" cx="50" cy="68" r=${a + 9}></circle>` : u}
    <circle class=${e.live ? "afill" : "aidle edge"} cx="50" cy="68" r=${a}></circle>
    ${e.live ? g`<ellipse class="aring" cx="50" cy="68" rx=${a * 1.75} ry=${a * 0.42}></ellipse>` : u}`;
  },
  bush: (e, t) => {
    const a = 18 + 66 * t;
    return g`<path class="alog" d="M26 112l44-12 4 8-44 12z"></path><path class="alog" d="M74 112l-44-12-4 8 44 12z"></path>
    ${e.live ? g`<g class="flick"><path class="aflame" d="M50 ${106 - a}C${50 + a * 0.5} ${106 - a * 0.42},${50 + a * 0.34} 106,50 106C${50 - a * 0.34} 106,${50 - a * 0.5} ${106 - a * 0.42},50 ${106 - a}Z"></path>
      <path class="aflame in" d="M50 ${106 - a * 0.56}C${50 + a * 0.26} ${106 - a * 0.22},${50 + a * 0.18} 106,50 106C${50 - a * 0.18} 106,${50 - a * 0.26} ${106 - a * 0.22},50 ${106 - a * 0.56}Z"></path></g>` : g`<circle class="aember" cx="50" cy="102" r="5"></circle>`}`;
  },
  sunset: (e, t) => {
    const a = e.live ? 92 - 72 * t : 96;
    return g`<path class="aline thin" d="M50 ${a + 12}Q${56} ${(a + 126) / 2} 50 114"></path>
    <g class="sway"><path class=${e.live ? "afill edge" : "aidle edge"} d="M50 ${a - 16}L64 ${a}L50 ${a + 16}L36 ${a}Z"></path><path class="aline thin" d="M50 ${a - 16}V${a + 16}M36 ${a}H64"></path></g>`;
  },
  fridge: (e, t) => {
    const a = 102 - 84 * (e.hasVol ? t : 0);
    return g`<path class="aline" d="M50 14C53 44 47 76 50 106"></path>${[0, 1, 2, 3, 4].map((i) => g`<path class="aline thin" d="M43 ${18 + i * 21}h14"></path>`)}
    <g class="jig"><circle class="ashade" cx="52" cy=${a + 4} r="17"></circle><circle class=${e.live ? "afill" : "aidle"} cx="50" cy=${a} r="17"></circle><text class="ainit" x="50" y=${a + 6}>${e.name[0]}</text></g>`;
  },
  orbit: (e, t) => {
    const a = 8 + 18 * t;
    return g`<circle class="aorbit" cx="50" cy="68" r="38"></circle>${e.playing ? g`<circle class="aglow" cx="50" cy="68" r=${a + 8}></circle>` : u}
    <circle class=${e.live ? "afill" : "aidle edge"} cx="50" cy="68" r=${a}></circle>`;
  }
}, ao = {
  sea: g`<path class="bg1 drift" d="M-40 62q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0"></path><path class="bg2 drift slow" d="M-40 80q10 -5 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0"></path>`,
  reef: g`<path class="bgweed" d="M6 100q-5 -14 1 -26q-6 -10 1 -22"></path><path class="bgweed b" d="M94 100q5 -12 -1 -24q5 -10 -1 -20"></path>`,
  space: g`${[[8, 14], [22, 40], [40, 8], [63, 22], [81, 12], [93, 44], [52, 50]].map(([e, t], a) => g`<circle class="bgstar" style="animation-delay:${-a * 0.5}s" cx=${e} cy=${t} r=".7"></circle>`)}`,
  bush: g`<path class="bg2" d="M0 96h100"></path>${[[12, 30], [88, 22], [50, 14], [70, 44]].map(([e, t], a) => g`<circle class="bgfly" style="animation-delay:${-a * 0.8}s" cx=${e} cy=${t} r=".8"></circle>`)}`,
  sunset: g`<path class="bg2" d="M0 96q25 -8 50 0t50 0"></path>`,
  fridge: g``,
  orbit: g``
}, Ps = (e) => {
  const t = {}, a = e.rooms.filter((r) => r.stream), i = e.rooms.filter((r) => !r.stream), o = Math.min(13, (58 - 8 * Math.max(0, e.streams.length - 1)) / Math.max(1, a.length));
  let s = e.phone ? 16 : 40;
  for (const r of e.streams) {
    const n = a.filter((c) => c.stream === r).sort((c, p) => Number(p.lead) - Number(c.lead));
    n.forEach((c, p) => {
      t[c.id] = [s + p * (e.phone ? o * 2.2 : o), (i.length ? e.phone ? 33 : 27 : 44) + (p % 2 ? 6 : -4)];
    }), s += e.phone ? n.length * o * 2.2 + 14 : n.length * o + 8;
  }
  if (i.forEach((r, n) => {
    t[r.id] = [(e.phone ? 0 : 36) + (n + 0.5) / i.length * (e.phone ? 100 : 58), (a.length ? e.phone ? 70 : 68 : 50) + (n % 2 ? e.phone ? 14 : 6 : e.phone ? -12 : -6)];
  }), e.phone) for (const r of Object.keys(t)) t[r][0] = Math.max(17, Math.min(83, t[r][0]));
  return t;
}, Hs = { sea: "buoys", reef: "shells", space: "stars", orbit: "stars", bush: "lanterns", sunset: "beach balls", fridge: "photos" }, io = (e) => l`<span class="skeys"><button class="round tap" aria-label="Previous" @click=${() => e.prev()}>${v("prev", 22)}</button>
  <button class="round tap primary" aria-label=${e.now.playing ? "Pause" : "Play"} @click=${() => e.playPause()}>${v(e.now.playing ? "pause" : "play", 24)}</button>
  <button class="round tap" aria-label="Next" @click=${() => e.next()}>${v("next", 22)}</button></span>`, eo = (e, t) => {
  const a = e.crate, i = a.items.slice(0, 7), o = a.tabs.map((m) => m.name), s = o[(o.indexOf(a.who) + 1) % Math.max(1, o.length)], r = a.who === "Family" ? "Family" : `${a.who}’s`, n = Math.max(1, Math.ceil(i.length / 4)), c = (m) => `${(m % 4 + 0.5) / 4 * 100} ${(Math.floor(m / 4) + 0.5) / n * 100}`, p = t === "space" || t === "orbit", d = t === "fridge" || t === "bush", h = p ? `M${i.map((m, f) => c(f)).join(" L")}` : Array.from({ length: n }, (m, f) => `M0 ${f / n * 100 + 4} Q50 ${f / n * 100 + 14} 100 ${f / n * 100 + 4}`).join(" ");
  return l`<div class="sshelf" data-kind=${t}>
    <button class="slabel tap" title="Show ${s === "Family" ? "the family" : `${s}’s`} shelf" @click=${() => a.pick(s)}><b>${a.calm ? "🌙 " : ""}${r} ${Hs[t] ?? "shelf"}</b><span>${i.length ? "Carry one to a room" : "Pin music from Search"}</span></button>
    <div class="sitems" style="--rows:${n}">${i.length > 1 && (p || d) ? l`<svg class="sline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=${h}></path></svg>` : u}${i.map((m, f) => l`<button class="sitem tap" style="--i:${f};animation-delay:${-f * 0.55}s" ?data-lifted=${e.liftedItem === m} aria-label="${m.name}. Tap to play in ${a.room}, or drag it to a room or to the music."
      @pointerdown=${(x) => e.carryItem(x, m)} @click=${() => a.play(m)}><i class="sdeco" aria-hidden="true"></i><i class="puck onshelf" style="--art:${m.img ? `url(${m.img})` : `linear-gradient(135deg, var(--p-${f % 5 + 1}), var(--p-${(f + 2) % 5 + 1}))`}"></i></button>`)}</div>
  </div>`;
}, oo = (e) => l`<button class="puck spot" data-drop="deck" ?data-hot=${e.over === "deck"} ?data-playing=${e.now.playing} ?data-lifted=${!!e.lifted && e.lifted === e.now.lead} style=${e.now.art ? `--art:url(${e.now.art})` : ""}
  aria-label="${e.now.title}. Tap to ${e.now.playing ? "pause" : "play"}${e.now.lead ? ", drag onto a room to move the music there" : ""}." @pointerdown=${(t) => {
  e.now.lead && e.carry(t, e.now.lead);
}} @click=${() => {
  e.now.lead || e.playPause();
}}></button>`, _s = (e, t) => t.hasVol ? l`<span class="agrab" aria-hidden="true" @pointerdown=${(a) => {
  a.stopPropagation(), Wi(e, t, () => 150)(a);
}}><i></i></span>` : u, ui = (e, t, a) => l`
  <svg viewBox="0 0 100 120" role="slider" tabindex="0" aria-label=${Ca(t)} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${t.vol} @keydown=${Ma(e, t)}>${t.asleep ? Xs : u}${a(t, t.vol / 100)}</svg>
  ${_s(e, t)}
  <button class="aname tap" data-notrack aria-pressed=${String(t.focus)} aria-label="Show ${t.name} in the player" @click=${() => e.focus(t.id)}><b>${t.name}</b><span>${$e(t)}</span></button>`, Es = (e, t) => [(e.clientX - t.left) / t.width * 100, (e.clientY - t.top) / t.height * 100], so = (e, t, a) => (i) => {
  if (i.target.closest("[data-notrack]")) return;
  const o = i.currentTarget.closest(".vscene");
  ot(i, (s) => {
    const [r, n] = Es(s, o.getBoundingClientRect());
    e.setDrag({ id: t.id, x: r, y: n });
  }, (s, r) => {
    e.setDrag(null), s ? a(r, o.getBoundingClientRect()) : e.toggle(t.id);
  }, 8);
}, $s = (e, t) => {
  const a = to[t], i = Ps(e), o = e.sdrag, s = (r) => (n, c) => {
    const p = (h) => Math.hypot((i[h.id][0] - (n.clientX - c.left) / c.width * 100) / 100 * c.width, (i[h.id][1] - (n.clientY - c.top) / c.height * 100) / 100 * c.height), d = e.rooms.filter((h) => h.id !== r.id).sort((h, m) => p(h) - p(m))[0];
    d && p(d) < 96 ? d.stream && d.stream !== r.stream ? e.join(r.id, d.stream) : !d.stream && r.stream && e.join(d.id, r.stream) : r.stream && !r.lead && !e.rooms.some((h) => h.id !== r.id && h.stream === r.stream && p(h) < 170) && e.leave(r.id);
  };
  return l`<div class="vscene" data-kind=${t} data-fits>
    <svg class="backdrop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ao[t]}
      ${e.streams.map((r) => {
    const n = e.rooms.filter((c) => c.stream === r && o?.id !== c.id);
    return n.length > 1 ? g`<path class="tie" style="--c:${n[0].colour || "var(--stream, var(--primary))"}" d="M${n.map((c) => `${i[c.id][0]} ${i[c.id][1]}`).join(" L")}"></path>` : u;
  })}</svg>
    <div class="sun">${oo(e)}<span class="suntx"><b>${e.now.title}</b><span>${e.now.artist || (e.now.lead ? "Drag me to a room" : "Pick something to play")}</span>${io(e)}</span></div>
    ${e.rooms.map((r, n) => {
    const c = o?.id === r.id ? [o.x, o.y] : i[r.id];
    return l`<div class="actor free" data-zone=${r.id} ?data-live=${r.live} ?data-playing=${r.playing} ?data-asleep=${r.asleep} ?data-offline=${r.offline} ?data-focus=${r.focus} ?data-held=${o?.id === r.id} ?data-hot=${e.over === r.id && e.lifted !== r.id}
        style="${mt(r)};left:${c[0]}%;top:${c[1]}%;animation-delay:${-n * 0.45}s" @pointerdown=${so(e, r, s(r))}>${ui(e, r, a)}</div>`;
  })}
    ${eo(e, t)}
  </div>`;
}, oa = [36, 58], Da = 82, tr = (e, t) => {
  const a = to[t], i = e.sdrag, o = (p) => oa[Math.min(oa.length - 1, e.streams.indexOf(p))], s = (p) => (d, h) => {
    const m = d.target.closest(".vscene") ?? document.body, f = getComputedStyle(m), x = Number(f.getPropertyValue("--sq")) || 0.42, K = Number(f.getPropertyValue("--k")) || 1, A = Math.hypot(d.clientX - (h.left + h.width / 2), (d.clientY - (h.top + h.height * 0.42)) / x) / Math.min(h.height, h.width * 0.56) * 100 / K, U = [...e.streams.map((q) => [o(q), q]), [Da, ""]], [, y] = U.sort((q, k) => Math.abs(q[0] - A) - Math.abs(k[0] - A))[0];
    y && y !== p.stream ? e.join(p.id, y) : !y && p.stream && !p.lead && e.leave(p.id);
  }, r = e.rooms.filter((p) => !p.stream), n = (p) => {
    const d = p.stream ? e.rooms.filter((x) => x.stream === p.stream) : r, h = d.indexOf(p), m = p.stream ? e.streams.indexOf(p.stream) : 0, f = p.stream ? (m * 47 + h * 360 / d.length) % 360 : (100 + h * 360 / Math.max(1, d.length)) % 360;
    return l`<div class="arm" ?data-moving=${p.playing} ?data-away=${i?.id === p.id} style="--a:${f};--r:${p.stream ? o(p.stream) : Da};--t:${p.stream ? 70 + m * 40 : 0}s"><div class="hold"><div class="unspin"><div class="unsquash">
      <div class="actor planet" data-zone=${p.id} ?data-live=${p.live} ?data-playing=${p.playing} ?data-asleep=${p.asleep} ?data-offline=${p.offline} ?data-focus=${p.focus} ?data-hot=${e.over === p.id && e.lifted !== p.id} style=${mt(p)} @pointerdown=${so(e, p, s(p))}>${ui(e, p, a)}</div></div></div></div></div>`;
  }, c = i ? e.rooms.find((p) => p.id === i.id) : void 0;
  return l`<div class="vscene orbits" data-kind=${t} data-fits>
    <svg class="backdrop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${ao[t]}</svg>
    ${e.streams.slice(0, oa.length).map((p, d) => l`<span class="ring" style="--r:${oa[d]};--c:${d ? "var(--p-3)" : "var(--stream, var(--primary))"}"></span>`)}<span class="ring park" style="--r:${Da}"></span>
    <div class="sun">${l`<span class="suntx"><b>${e.now.title}</b><span>${e.now.artist || (e.now.lead ? "Same orbit, same music" : "Pick something to play")}</span>${io(e)}</span>`}</div>
    <div class="core">${oo(e)}</div>
    <div class="plane">${e.rooms.map(n)}</div>
    ${c && i ? l`<div class="actor free clone" data-held ?data-live=${c.live} style="${mt(c)};left:${i.x}%;top:${i.y}%">${ui(e, c, a)}</div>` : u}
    ${eo(e, t)}
  </div>`;
}, ar = (e) => {
  const t = Ee(e.look, e.theme);
  return t === "space" || t === "orbit" ? tr(e, t) : $s(e, t);
}, ir = (e, t, a) => l`<div class="scrim" style="border-radius:28px" @click=${(i) => {
  i.target === i.currentTarget && a();
}}>
  <section class="glass sheet" role="dialog" aria-modal="true" aria-label="How to show the rooms" style="width:min(640px,94%);gap:14px">
    <h2 class="t-head">How would you like to see the rooms?</h2>
    <div class="vgrid">${Jt.map((i) => l`<button class="vcard tap" aria-pressed=${String(i.id === e)} @click=${() => t(i.id)}>${F(i.icon, 34)}<b>${i.name}</b><span>${i.about}</span></button>`)}</div>
    <button class="pill tap" style="align-self:flex-end" @click=${a}>Close</button></section></div>`, er = G`
  .viewbtn { height: 44px; padding: 0 14px 0 12px; border-radius: 14px; background: var(--chip-strong); display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: var(--w-bold, 700); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 40%, transparent); }
  .vgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .vcard { min-height: 112px; padding: 12px 10px; border-radius: 20px; background: var(--chip); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; transition: transform .2s cubic-bezier(.2,1.4,.4,1); }
  .vcard b { font-size: 16px; font-weight: var(--w-bold, 700); } .vcard span { font-size: 12.5px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .vcard[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); transform: translateY(-3px); } .vcard[aria-pressed='true'] span { color: inherit; }
  :host([data-phone]) .vgrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  /* ---- dial ---- */
  .dialwrap { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(150px, 1fr) auto minmax(150px, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 10px 8px; container-type: size; }
  .dmid { grid-column: 2; grid-row: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 clamp(70px, 9cqw, 118px); }
  .bigdial { height: 97%; max-height: 620px; aspect-ratio: 1; position: relative; user-select: none; -webkit-user-select: none; }
  .dcard { grid-row: 1; align-self: center; min-width: 0; max-height: 100%; border-radius: 24px; background: var(--chip); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
  .dcard h3 { margin: 0; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); }
  .dnext { grid-column: 1; justify-self: end; width: min(100%, 270px); } .dturn { grid-column: 3; justify-self: start; width: min(100%, 270px); }
  .dn { display: flex; align-items: center; gap: 12px; min-width: 0; } .dn .puck.onshelf { width: 46px; flex: 0 0 46px; border-width: 2.5px; }
  .dn > span { min-width: 0; display: flex; flex-direction: column; line-height: 1.2; } .dn b, .dn span span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dn b { font-size: 15px; font-weight: var(--w-bold, 700); } .dn span span { font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dnone { margin: 0; font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); line-height: 1.3; }
  .dcoins { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .dcoin { width: 48px; height: 48px; border-radius: 50%; background: var(--c); color: var(--on-person, #fff); font-size: 15px; font-weight: var(--w-heavy, 800); box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); transition: transform .22s cubic-bezier(.2,1.4,.4,1); }
  .dcoin[data-now] { transform: scale(1.18); box-shadow: inset 0 -3px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c); animation: lamp2 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); margin: 0 6px; }
  .dwho { margin: 0; font-size: 15px; font-weight: var(--w-semi, 600); } .dwho b { font-weight: var(--w-heavy, 800); }
  .dsleep { min-height: 52px; display: flex; align-items: center; gap: 12px; text-align: left; border-radius: 16px; padding: 4px 8px 4px 4px; }
  .dsleep svg { width: 48px; height: 48px; flex-shrink: 0; } .swt { fill: var(--track); stroke: var(--ink2); stroke-width: 1.5; } .sww { fill: var(--accent); }
  .dsleep > span { display: flex; flex-direction: column; line-height: 1.2; } .dsleep b { font-size: 15px; font-weight: var(--w-bold, 700); } .dsleep span span { font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dsleep[data-on] { background: var(--chip-strong); }
  /* the tuner: ticks like a radio dial, a stop for each favourite and station, and a needle to slide */
  .tuner { grid-column: 1 / -1; grid-row: 2; justify-self: center; width: min(100%, 720px); height: 62px; position: relative; border-radius: 20px; background: var(--chip); touch-action: none; cursor: ew-resize; outline: none; user-select: none; -webkit-user-select: none; }
  .tuner:focus-visible { box-shadow: 0 0 0 3px var(--ink); }
  .tticks { position: absolute; left: 3%; right: 3%; top: 8px; height: 12px; background: repeating-linear-gradient(90deg, var(--ink2) 0 1.5px, transparent 1.5px 14.4px); opacity: .7; -webkit-mask-image: linear-gradient(#000 0 6px, transparent 6px), repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 86.4px); -webkit-mask-composite: source-over; mask-image: linear-gradient(#000 0 6px, transparent 6px), repeating-linear-gradient(90deg, #000 0 2px, transparent 2px 86.4px); }
  .tstop { position: absolute; bottom: 9px; transform: translateX(-50%); font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; }
  .tstop[data-on] { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  .tstop:only-of-type { max-width: 90%; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .tneedle { position: absolute; top: 4px; width: 6px; height: 30px; margin-left: -3px; border-radius: 3px; background: var(--danger, #c62a22); transition: left .35s cubic-bezier(.2,1.3,.4,1); pointer-events: none; opacity: .55; }
  .tneedle::before { content: ''; position: absolute; left: -6px; top: -5px; width: 18px; height: 18px; border-radius: 50%; background: inherit; }
  .tneedle[data-on] { opacity: 1; }
  .bigdial > svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; touch-action: none; }
  .dplate { fill: var(--chip); }
  .darc { --c: var(--stream, var(--primary)); cursor: grab; touch-action: none; outline: none; }
  .darc:focus-visible .dtrack { stroke: var(--ink); stroke-opacity: 1; } .darc:focus-visible .dknob { stroke: var(--ink); stroke-width: 5; }
  .tuner:focus-visible, .jog:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .dhit { fill: none; stroke: transparent; stroke-width: 46; }
  .dtrack { fill: none; stroke: var(--track); stroke-width: 26; stroke-linecap: round; }
  .dfill { fill: none; stroke: var(--ink3); stroke-width: 26; stroke-linecap: round; opacity: .55; transition: stroke .2s; }
  .darc[data-live] .dfill { stroke: var(--c); opacity: 1; }
  .darc[data-playing] .dfill { animation: breathe 2.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  .dknob { fill: #fff; stroke: var(--ink3); stroke-width: 4; }
  .darc[data-live] .dknob { stroke: var(--c); }
  .darc[data-hot] .dtrack, .darc:focus-visible .dtrack { stroke: var(--chip-strong); filter: drop-shadow(0 0 0 var(--primary)); stroke-width: 30; }
  .darc:focus-visible .dknob { stroke: var(--ink); stroke-width: 5; }
  .dprogt { fill: none; stroke: var(--track); stroke-width: 6; }
  .dprog { fill: none; stroke: var(--accent); stroke-width: 6; stroke-linecap: round; transition: stroke-dasharray 1s linear; }
  .dripple { fill: none; stroke: var(--accent); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: dripple 2.8s ease-out infinite; animation-iteration-count: var(--loops, infinite); }
  .dripple.late { animation-delay: -1.4s; }
  @keyframes dripple { from { transform: scale(1); opacity: .7; } to { transform: scale(1.22); opacity: 0; } }
  .dcover { position: absolute; left: 26%; top: 26%; width: 48%; height: 48%; border-radius: 50%; background: radial-gradient(circle, rgba(0,0,0,.28), rgba(0,0,0,.28)), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 0 0 3px #fff, 0 12px 26px -10px rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; }
  .dcover span { width: 40px; height: 40px; border-radius: 50%; background: #fff; color: #111; display: flex; align-items: center; justify-content: center; transition: transform .2s cubic-bezier(.2,1.4,.4,1); }
  .dcover:active span { transform: scale(.9); }
  .dlabel { position: absolute; min-width: 44px; min-height: 44px; padding: 2px 8px; display: flex; flex-direction: column; justify-content: center; line-height: 1.15; border-radius: 12px; white-space: nowrap; }
  .dlabel b { font-size: clamp(15px, 4.2cqh, 19px); font-weight: var(--w-bold, 700); } .dlabel span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .dlabel[aria-pressed='true'] b { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  .bigdial[data-fit] .dlabel b { font-size: 13px; }
  :host([data-shape='tall']:not([data-phone])) .dialwrap { grid-template-columns: 1fr 1fr; grid-template-rows: minmax(0, 1fr) auto auto; }
  :host([data-shape='tall']:not([data-phone])) .dmid { grid-column: 1 / -1; grid-row: 1; }
  :host([data-shape='tall']:not([data-phone])) .dcard { grid-row: 2; width: auto; justify-self: stretch; align-self: stretch; }
  :host([data-shape='tall']:not([data-phone])) .dturn { grid-column: 2; } :host([data-shape='tall']:not([data-phone])) .tuner { grid-row: 3; }
  :host([data-phone]) .dialwrap { flex: none; display: flex; flex-direction: column; container-type: normal; gap: 12px; } :host([data-phone]) .dmid { height: 330px; padding: 0; } :host([data-phone]) .bigdial { height: 62%; }
  :host([data-phone]) .dcard { width: auto; align-self: stretch; } :host([data-phone]) .tuner { order: -1; width: 100%; } :host([data-phone]) .tstop { font-size: 11.5px; }

  /* ---- desk ---- */
  .dside { flex: 0 0 27%; min-width: 0; display: flex; flex-direction: column; gap: 3cqh; padding: 4px 8px 4px 4px; }
  .dstrips { flex: 1; min-width: 0; display: flex; gap: 6px; }
  .dnow { flex: 1 1 0; min-height: 0; display: flex; align-items: center; gap: 12px; }
  .dart { height: 100%; max-height: 150px; aspect-ratio: 1; flex-shrink: 0; border-radius: 20px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 8px 16px -8px rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; }
  .dart i { width: 22%; height: 22%; border-radius: 50%; background: rgba(255,255,255,.7); box-shadow: 0 0 0 2px rgba(0,0,0,.15); opacity: 0; }
  .dart[data-playing] i { opacity: 1; animation: thump .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .dtx { min-width: 0; display: flex; flex-direction: column; gap: 2px; line-height: 1.15; }
  .dtx i { font-style: normal; font-size: 14px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); }
  .dtx b { font-size: clamp(17px, 6cqh, 26px); font-weight: var(--w-heavy, 800); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .dtx span { font-size: 15px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .desk .tkeys { flex: 0 0 clamp(50px, 14cqh, 64px); }
  .dplay { flex: 1.25 1 0; min-height: 0; display: flex; align-items: center; gap: 12px; }
  .jog { height: 100%; max-height: 160px; aspect-ratio: 1; flex-shrink: 0; position: relative; border-radius: 50%; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--track), 0 6px 0 rgba(0,0,0,.16); touch-action: none; cursor: grab; outline: none; display: flex; align-items: center; justify-content: center; }
  .jog[data-held] { cursor: grabbing; box-shadow: inset 0 0 0 3px var(--primary), 0 3px 0 rgba(0,0,0,.16); }
  .jog:focus-visible { box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.16); }
  .jring { position: absolute; inset: 11%; border-radius: 50%; border: 0.5em dotted var(--track); transition: transform 1s linear; pointer-events: none; }
  .jog[data-held] .jring { transition: none; }
  .jring i { position: absolute; right: 8%; top: 8%; width: 20%; height: 20%; border-radius: 50%; background: var(--track); box-shadow: inset 0 2px 3px rgba(0,0,0,.2); }
  .jog b { position: relative; font-size: clamp(15px, 5cqh, 20px); font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; }
  .pads { flex: 1; min-width: 0; align-self: stretch; display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 8px 8px; padding-bottom: 6px; }
  .mpad { min-width: 0; min-height: 44px; padding: 0 4px; text-align: center; border-radius: 14px; background: var(--c); color: var(--on-person, #fff); font-size: 14px; font-weight: var(--w-bold, 700); line-height: 1.1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; box-shadow: 0 6px 0 rgba(0,0,0,.22); transition: transform .08s, box-shadow .08s; }
  .mpad span { font-size: clamp(16px, 5.4cqh, 24px); line-height: 1; }
  .mpad:active, .mpad[data-busy] { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,.22); }
  .mpad[data-on] { box-shadow: 0 6px 0 rgba(0,0,0,.22), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c); animation: lamp2 .9s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes lamp2 { to { filter: brightness(1.15); } }
  .desk { container-type: size; flex: 1; min-height: 0; display: flex; gap: 6px; padding: 10px; border-radius: 22px; background: var(--chip); user-select: none; -webkit-user-select: none; }
  .strip { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 6px 2px; border-radius: 14px; --c: var(--stream, var(--primary)); }
  .strip[data-focus] { background: var(--chip-strong); }
  .strip[data-hot] { box-shadow: inset 0 0 0 3px var(--c); }
  .strip.master { background: var(--chip-soft); --c: var(--accent); margin-left: 4px; }
  .sname { width: 100%; min-height: 44px; padding: 2px 4px; border-radius: 8px; background: var(--chip-strong); font-size: 14px; font-weight: var(--w-bold, 700); line-height: 1.1; display: flex; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
  .lamp { width: 46px; height: 46px; border-radius: 50%; background: #5b6472; color: #fff; font-size: 13px; font-weight: var(--w-heavy, 800); flex-shrink: 0; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2); transition: background .2s, box-shadow .2s; }
  .lamp[aria-pressed='true'] { background: #15803d; color: #fff; box-shadow: inset 0 -3px 0 rgba(0,0,0,.2), 0 0 0 4px color-mix(in srgb, var(--ok) 30%, transparent); }
  .strip[data-playing] .lamp[aria-pressed='true'] { animation: lamp 1.4s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes lamp { to { box-shadow: inset 0 -3px 0 rgba(0,0,0,.2), 0 0 0 8px color-mix(in srgb, var(--ok) 12%, transparent); } }
  .lamp[data-other] { background: var(--c); font-size: 18px; }
  .master .lamp { background: var(--primary); color: var(--on-primary); }
  .master .lamp[data-hot] { box-shadow: 0 0 0 5px var(--accent); }
  .well { flex: 1; min-height: 60px; width: 100%; display: flex; justify-content: center; gap: 8px; padding: 10px 0; }
  .vu { width: 12px; display: flex; flex-direction: column; gap: 3px; }
  .vu i { flex: 1; border-radius: 3px; background: var(--track); }
  .vu i[data-lit] { background: var(--ok); } .vu i[data-lit]:nth-child(-n+4) { background: var(--accent); } .vu i[data-lit]:nth-child(-n+2) { background: var(--danger, #c62a22); }
  .strip[data-playing] .vu i[data-peak] { animation: vu .45s steps(2, jump-none) infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .strip[data-playing] .vu i[data-peak] + i[data-peak] { animation-delay: -.2s; }
  @keyframes vu { to { opacity: .3; } }
  .fader { width: 44px; position: relative; touch-action: none; cursor: ns-resize; outline: none; }
  .slot { position: absolute; left: 18px; top: 0; bottom: 0; width: 8px; border-radius: 4px; background: var(--track); }
  .run { position: absolute; left: 18px; bottom: 0; width: 8px; border-radius: 4px; background: var(--ink3); }
  .strip[data-live] .run { background: var(--c); }
  .fcap { position: absolute; left: 2px; width: 40px; height: 26px; margin-bottom: -13px; border-radius: 8px; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--ink3), 0 3px 0 rgba(0,0,0,.22); transition: bottom .12s ease-out; }
  .fcap::after { content: ''; position: absolute; left: 7px; right: 7px; top: 11px; height: 4px; border-radius: 2px; background: var(--ink3); }
  .strip[data-live] .fcap { background: var(--c); box-shadow: inset 0 0 0 2px rgba(255,255,255,.5), 0 3px 0 rgba(0,0,0,.25); } .strip[data-live] .fcap::after { background: #fff; }
  .fader:focus-visible .fcap { outline: 3px solid var(--ink); outline-offset: 2px; }
  .sval { font-size: 15px; font-weight: var(--w-bold, 700); color: var(--ink2); }
  .desk[data-fit] .sname { font-size: 11px; } .desk[data-fit] .well { padding: 6px 0; }
  :host([data-shape='tall']:not([data-phone])) .desk { flex-direction: column; gap: 12px; }
  :host([data-shape='tall']:not([data-phone])) .dside { flex: 0 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: 130px 64px; gap: 12px 16px; padding: 4px; }
  :host([data-shape='tall']:not([data-phone])) .dnow { grid-column: 1; grid-row: 1; } :host([data-shape='tall']:not([data-phone])) .desk .tkeys { grid-column: 1; grid-row: 2; }
  :host([data-shape='tall']:not([data-phone])) .dplay { grid-column: 2; grid-row: 1 / 3; } :host([data-shape='tall']:not([data-phone])) .dstrips { min-height: 0; }
  :host([data-phone]) .desk { flex: none; container-type: normal; flex-direction: column; gap: 14px; } :host([data-phone]) .dside { flex: none; gap: 12px; padding: 4px; } :host([data-phone]) .dnow { flex: none; height: 110px; } :host([data-phone]) .dplay { flex: none; height: 150px; }
  :host([data-phone]) .desk .tkeys { flex-basis: 60px; } :host([data-phone]) .dstrips { flex: none; height: 360px; overflow-x: auto; } :host([data-phone]) .strip { flex: 0 0 62px; }

  /* ---- crate ---- */
  .rig { flex: 1; min-height: 230px; position: relative; user-select: none; -webkit-user-select: none; container-type: size; --S: min(14.5cqw, 38cqh); --P: min(26cqw, 54cqh); }
  .wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 1; }
  .wire { fill: none; stroke: var(--c, var(--stream, var(--primary))); stroke-width: 7px; stroke-linecap: round; vector-effect: non-scaling-stroke; --c: var(--stream, var(--primary)); }
  .wire[data-playing] { animation: wire 1.3s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes wire { to { transform: translateY(1.6px); } }
  /* the crate: dividers behind, sleeves fanned in the box */
  .cratecol { position: absolute; left: 0; top: 0; bottom: 0; width: 34%; }
  .ctabs { position: absolute; left: 4%; right: 4%; top: 0; height: 27%; display: flex; gap: 5px; align-items: flex-start; }
  .ctab { flex: 1 1 0; min-width: 0; max-width: 96px; height: 100%; margin-top: 5%; padding: 9px 2px 0; border-radius: 10px 10px 0 0; background: var(--c); color: var(--on-person, #fff); font-size: 16px; font-weight: var(--w-bold, 700); display: flex; align-items: flex-start; justify-content: center; white-space: nowrap; overflow: hidden;
    transition: margin-top .25s cubic-bezier(.2,1.4,.4,1); }
  .ctab[aria-pressed='true'] { margin-top: 0; box-shadow: 0 -3px 0 var(--chip-strong); }
  .sleeves { position: absolute; z-index: 1; left: 7%; right: 7%; top: 26%; height: var(--S); }
  .sleeve { position: absolute; left: calc(var(--x) * (100% - var(--S))); top: 0; width: var(--S); height: var(--S); transform-origin: 50% 110%; transform: rotate(var(--tilt)); touch-action: none; border-radius: 8px;
    transition: transform .28s cubic-bezier(.2,1.3,.4,1); }
  .sleeve[data-front] { transform: rotate(var(--tilt)) translateY(-9%); }
  .sart { position: absolute; inset: 0; border-radius: 8px; background: var(--art) center / cover no-repeat, #fff; box-shadow: inset 0 0 0 2px rgba(255,255,255,.55), -4px 4px 10px -4px rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; color: #fff; font-family: 'Bricolage Grotesque', sans-serif; font-size: calc(var(--S) * .3); font-weight: var(--w-heavy, 800); font-style: normal; }
  .vinyl { position: absolute; left: 6%; right: 6%; top: 0; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(circle, #f4efe3 0 4%, var(--accent) 4.5% 20%, #17140f 20.5% 100%); transform: translateY(0); transition: transform .3s cubic-bezier(.2,1.3,.4,1); }
  .sleeve[data-front] .vinyl { transform: translateY(-15%); }
  .sleeve:focus-visible .sart { box-shadow: 0 0 0 3px var(--ink); }
  .cbox { position: absolute; left: 0; right: 0; top: calc(26% + var(--S) - 12px); bottom: 0; z-index: 2; border-radius: 14px; background: var(--chip-strong); box-shadow: 0 8px 0 rgba(0,0,0,.14), inset 0 0 0 1.5px rgba(255,255,255,.6); padding: 10px 14px; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; gap: 4px; overflow: hidden;
    background-image: linear-gradient(var(--track), var(--track)), linear-gradient(var(--track), var(--track)); background-size: calc(100% - 28px) 2px; background-repeat: no-repeat; background-position: 14px 8px, 14px calc(100% - 8px); }
  .clabel { display: flex; align-items: center; gap: 8px; max-width: 100%; }
  .clabel b { min-width: 0; padding: 6px 14px; border-radius: 6px; background: #fff; color: #17140f; font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 1px 3px rgba(0,0,0,.25); }
  .cnav { width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: var(--chip); display: flex; align-items: center; justify-content: center; } .cnav[disabled] { opacity: .35; }
  .cpick { max-width: 100%; display: flex; flex-direction: column; align-items: center; line-height: 1.2; text-align: center; }
  .cpick b { max-width: 100%; font-size: 16px; font-weight: var(--w-heavy, 800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .cpick span { font-size: 12.5px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .rig[data-fit] .cpick span { display: none; }
  /* the turntable */
  .tdeck { position: absolute; left: 37.5%; width: 33%; top: 0; bottom: 0; display: flex; flex-direction: column; gap: 3.5%; }
  .ttable { flex: 1; min-height: 0; position: relative; border-radius: 26px; background: var(--chip); padding: 3% 4% 2%; display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; transition: box-shadow .2s, background .2s; }
  .ttable[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--stream, var(--primary)); }
  .tplat { position: relative; width: var(--P); height: var(--P); margin-right: calc(var(--P) * .1); flex-shrink: 0; }
  .cdisc { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 6px 0 rgba(0,0,0,.18), 0 14px 22px -10px rgba(0,0,0,.6);
    background: radial-gradient(circle closest-side, #f4efe3 0 2.6%, transparent 3%), radial-gradient(circle closest-side, transparent 34%, #17140f 34.6% 46%, #3a342b 46.4% 47.2%, #17140f 47.6% 59%, #3a342b 59.4% 60.2%, #17140f 60.6% 72%, #3a342b 72.4% 73.2%, #17140f 73.6% 85%, #3a342b 85.4% 86.2%, #17140f 86.6% 100%), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / 70% 70% no-repeat, #17140f; }
  .cdisc[data-playing] { animation: puck 3.6s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .cdisc:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  .tpivot { position: absolute; left: 102.5%; top: 7.5%; width: 13%; height: 13%; margin: -6.5% 0 0 -6.5%; border-radius: 50%; background: radial-gradient(circle, #8b8477 0 34%, #26272b 36%); pointer-events: none; }
  .tarm { position: absolute; left: 102.5%; top: 7.5%; width: 0; height: 0; transform: rotate(var(--arm)); transition: transform .9s cubic-bezier(.3,1.2,.5,1); pointer-events: none; }
  .tarm::before { content: ''; position: absolute; left: calc(var(--P) * -.017); top: 0; width: calc(var(--P) * .034); height: calc(var(--P) * .6); border-radius: 4px; background: #8b8477; box-shadow: 2px 3px 4px rgba(0,0,0,.3); }
  .tarm i { position: absolute; left: calc(var(--P) * -.048); top: calc(var(--P) * .56); width: calc(var(--P) * .096); height: calc(var(--P) * .13); border-radius: 5px; background: #26272b; box-shadow: 2px 3px 4px rgba(0,0,0,.3); }
  .ttitle { max-width: 100%; display: flex; flex-direction: column; align-items: center; line-height: 1.2; text-align: center; }
  .ttitle b { max-width: 100%; font-size: clamp(15px, 5.4cqh, 22px); font-weight: var(--w-heavy, 800); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ttitle span { max-width: 100%; min-height: 1.2em; font-size: 15px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .jack { position: absolute; right: -9px; width: 18px; height: 18px; margin-top: -9px; border-radius: 50%; background: var(--stream, var(--primary)); box-shadow: 0 0 0 3px var(--chip-strong); z-index: 2; }
  .tkeys { flex: 0 0 clamp(56px, 17cqh, 76px); display: flex; gap: 8px; }
  .tkey { flex: 1 1 0; border-radius: 20px; background: var(--chip-strong); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 0 rgba(0,0,0,.2); margin-bottom: 6px; transition: transform .08s, box-shadow .08s; }
  .tkey.go { flex-grow: 1.3; background: var(--primary); color: var(--on-primary); }
  .tkey:active { transform: translateY(4px); box-shadow: 0 2px 0 rgba(0,0,0,.2); }
  /* a speaker for every room, on the end of a cable */
  .cab { position: absolute; right: 0; top: var(--top); width: 24%; height: min(88px, calc(100% / var(--n) - 8px)); min-height: 48px; transform: translateY(-50%); border-radius: 16px; background: #1b2230; color: #fff; display: flex; align-items: center; gap: 8px; padding: 0 10px 0 28px; touch-action: none; cursor: ns-resize; outline: none; --c: var(--stream, var(--primary)); box-shadow: 0 6px 12px -8px rgba(0,0,0,.6); }
  .cab[data-focus] { box-shadow: 0 0 0 3px var(--c), 0 6px 12px -8px rgba(0,0,0,.6); } .cab[data-hot] { box-shadow: 0 0 0 4px var(--accent); } .chit { flex: 1; min-width: 0; align-self: stretch; display: flex; align-items: center; gap: 8px; border-radius: 12px; outline: none; } .chit:focus-visible { box-shadow: 0 0 0 3px #fff; }
  .cone { height: min(46px, 72%); aspect-ratio: 1; border-radius: 50%; background: #0b0d12; box-shadow: inset 0 0 0 2px rgba(255,255,255,.28); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cone i { width: 56%; height: 56%; border-radius: 50%; background: #333a48; box-shadow: inset 0 0 0 5px rgba(0,0,0,.25); } .cab[data-live] .cone i { background: var(--c); }
  .cab[data-playing] .cone i { animation: thump .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes thump { from { transform: scale(.82); } to { transform: scale(1.14); } }
  .ctext { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
  .ctext b, .ctext span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .ctext b { font-size: 16px; font-weight: 700; } .ctext span { font-size: 14px; color: rgba(255,255,255,.78); }
  .cknob { width: 30px; height: 30px; border-radius: 50%; background: #3a4150; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.4); position: relative; flex-shrink: 0; transform: rotate(var(--turn)); transition: transform .15s ease-out; }
  .cknob i { position: absolute; left: 13.5px; top: 3px; width: 3px; height: 10px; border-radius: 2px; background: #fff; }
  .sock { position: absolute; top: 50%; left: -22px; width: 44px; height: 44px; margin-top: -22px; border-radius: 50%; background: var(--chip-strong); color: var(--ink); font-size: 18px; font-weight: 800; box-shadow: inset 0 0 0 3px var(--ink3); z-index: 2; }
  .sock[aria-pressed='true'] { background: var(--c); box-shadow: inset 0 0 0 3px rgba(255,255,255,.6); }
  :host([data-phone]) .rig { flex: none; display: flex; flex-direction: column; gap: 14px; container-type: normal; --S: 138px; --P: 200px; }
  :host([data-phone]) .cratecol { position: relative; width: auto; height: 330px; }
  :host([data-phone]) .tdeck { position: relative; left: auto; width: auto; height: 400px; gap: 12px; }
  :host([data-phone]) .tkeys { flex-basis: 64px; } :host([data-phone]) .ttitle b { font-size: 19px; }
  :host([data-phone]) .cab { position: relative; top: auto; width: auto; height: 64px; transform: none; padding: 0 56px 0 10px; }
  :host([data-phone]) .sock { left: auto; right: 6px; } :host([data-phone]) .wires, :host([data-phone]) .jack { display: none; }

  /* ---- scene ---- */
  .vscene { flex: 1; min-height: 250px; position: relative; border-radius: 22px; overflow: hidden; user-select: none; -webkit-user-select: none; container-type: size; --sq: .4; --k: .9; /* one orbit unit: a hundredth of the height, or less when the scene is narrow */ --u: min(1cqh, .56cqw); }
  .backdrop { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .backdrop path { fill: none; vector-effect: non-scaling-stroke; stroke-linecap: round; }
  .bg1 { stroke: color-mix(in srgb, var(--primary) 55%, transparent); stroke-width: 3px; } .bg2 { stroke: var(--track); stroke-width: 3px; }
  .tie { stroke: var(--c); stroke-width: 4px; stroke-dasharray: 2 9; opacity: .8; stroke-linejoin: round; }
  .drift { animation: sdrift 7s linear infinite; animation-iteration-count: var(--loops, infinite); } .drift.slow { animation-duration: 11s; }
  @keyframes sdrift { to { transform: translateX(-20%); } }
  .bgweed { stroke: #0f766e; stroke-width: 9px; opacity: .6; transform-box: fill-box; transform-origin: bottom; animation: weed 3.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); } .bgweed.b { stroke: #ea580c; animation-delay: -1.5s; }
  @keyframes weed { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
  .bgstar { fill: #fff; animation: twinkle 2s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); } .bgfly { fill: #fff3a8; animation: twinkle 2.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .sun { position: absolute; left: 14px; top: 10px; display: flex; align-items: center; gap: 12px; z-index: 2; }
  .puck.spot { position: static; margin: 0; width: clamp(64px, 18cqh, 96px); height: clamp(64px, 18cqh, 96px); flex-shrink: 0; }
  .puck.spot[data-playing] { animation: puck 8s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .suntx { display: flex; flex-direction: column; line-height: 1.2; } .suntx b { font-size: 17px; font-weight: var(--w-heavy, 800); } .suntx span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  .actor { width: clamp(112px, 38cqh, 190px); display: flex; flex-direction: column; align-items: center; gap: 0; border-radius: 18px; touch-action: none; cursor: grab; --c: var(--stream, var(--primary)); }
  .actor.free { position: absolute; transform: translate(-50%, -50%); transition: left .6s cubic-bezier(.3,1.3,.5,1), top .6s cubic-bezier(.3,1.3,.5,1); }
  .actor[data-held] { transition: none; z-index: 5; cursor: grabbing; filter: drop-shadow(0 14px 12px rgba(0,0,0,.3)); }
  .actor[data-held] > svg { transform: scale(1.12); }
  .actor > svg { width: 93%; height: auto; aspect-ratio: 108 / 98; margin-bottom: -8px; overflow: visible; outline: none; transition: transform .2s; }
  .actor > svg:focus-visible { border-radius: 14px; box-shadow: inset 0 0 0 3px var(--ink); }
  .actor[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--c); } .actor[data-focus] .aname { background: var(--chip-strong); box-shadow: 0 0 0 2px var(--c); }
  .agrab { position: absolute; right: -14px; top: 14px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: ns-resize; touch-action: none; }
  .agrab i { width: 22px; height: 22px; border-radius: 50%; background: var(--chip-strong); box-shadow: inset 0 0 0 2.5px var(--ink3), 0 2px 5px rgba(0,0,0,.25); position: relative; }
  .agrab i::before, .agrab i::after { content: ''; position: absolute; left: 7px; border: 4px solid transparent; }
  .agrab i::before { top: -1px; border-bottom-color: var(--ink2); } .agrab i::after { bottom: -1px; border-top-color: var(--ink2); }
  .actor[data-live] .agrab i { box-shadow: inset 0 0 0 2.5px var(--c), 0 2px 5px rgba(0,0,0,.25); }
  .aname { min-height: 44px; max-width: 150px; padding: 2px 10px; border-radius: 14px; background: var(--chip); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.15; }
  .aname b { max-width: 100%; font-size: clamp(15px, 3.6cqh, 18px); font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .aname span { font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); }
  /* the shelf in the world */
  .skeys { display: flex; gap: 6px; margin-top: 6px; } .skeys .round { width: 44px; height: 44px; }
  .puck.spot[data-hot] { box-shadow: 0 0 0 5px var(--accent), 0 8px 20px -6px rgba(0,0,0,.55); transform: scale(1.08); }
  .sshelf { position: absolute; left: 0; bottom: 0; width: 31%; max-height: 52%; z-index: 3; display: flex; flex-direction: column; align-items: flex-start; gap: 3cqh; padding: 0 12px 10px; pointer-events: none; }
  .sshelf > *, .sitem { pointer-events: auto; }
  .sitems { width: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 3.2cqh 8px; justify-items: center; position: relative; pointer-events: none; }
  .sline { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
  .sline path { fill: none; stroke: var(--ink2); stroke-width: 2px; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; opacity: .7; }
  .sitem { width: min(100%, 15cqh, 84px); min-width: 44px; position: relative; display: flex; flex-direction: column; align-items: center; touch-action: none; border-radius: 50%; }
  .sitem[data-lifted] .puck { opacity: .3; }
  .sitem:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
  .sdeco { display: none; }
  .slabel { min-height: 44px; max-width: 100%; padding: 4px 14px; border-radius: 14px; background: var(--chip-strong); display: flex; flex-direction: column; justify-content: center; text-align: left; line-height: 1.15; }
  .slabel b { font-size: 16px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .slabel span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* sea: buoys, each with a little flag, bobbing on the swell */
  .sshelf[data-kind='sea'] .sitems { margin-top: 3cqh; }
  .sshelf[data-kind='sea'] .sitem { animation: abob 3s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  .sshelf[data-kind='sea'] .sdeco { display: block; position: absolute; left: 50%; bottom: 96%; width: 3px; height: 42%; margin-left: -1.5px; border-radius: 2px; background: var(--ink); }
  .sshelf[data-kind='sea'] .sdeco::after { content: ''; position: absolute; left: 3px; top: 0; border: 6px solid transparent; border-left: 10px solid var(--accent); border-right: 0; }
  .sshelf[data-kind='sea'] .puck { border-color: #fff; box-shadow: 0 0 0 3px #d9482b, 0 8px 12px -6px rgba(0,0,0,.5); }
  /* reef: each record rests in an open shell on the sea floor */
  .sshelf[data-kind='reef'] .sdeco { display: block; position: absolute; left: -14%; right: -14%; bottom: -8%; height: 62%; border-radius: 0 0 999px 999px; background: repeating-conic-gradient(from -90deg at 50% 0, #ffd9c2 0 12deg, #f6b89a 12deg 24deg); box-shadow: inset 0 -3px 0 rgba(0,0,0,.14); }
  .sshelf[data-kind='reef'] .puck { position: relative; left: auto; bottom: auto; margin-bottom: 14%; }
  /* space and orbit: a constellation of favourites */
  .sshelf[data-kind='space'] .sitem, .sshelf[data-kind='orbit'] .sitem { width: min(78%, 12cqh, 68px); }
  .sshelf[data-kind='space'] .sitem:nth-of-type(odd), .sshelf[data-kind='orbit'] .sitem:nth-of-type(odd) { transform: translateY(-18%); }
  .sshelf[data-kind='space'] .puck, .sshelf[data-kind='orbit'] .puck { box-shadow: 0 0 14px 3px color-mix(in srgb, var(--accent) 70%, transparent); animation: twinkle2 2.4s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes twinkle2 { from { filter: brightness(.82); } to { filter: brightness(1.12); } }
  .sshelf[data-kind='space'] .sline path, .sshelf[data-kind='orbit'] .sline path { stroke: var(--ink); stroke-dasharray: 1 7; opacity: .8; }
  /* bush: lanterns strung between the trees */
  .sshelf[data-kind='bush'] .sdeco { display: block; position: absolute; left: 50%; bottom: 96%; width: 2px; height: 30%; margin-left: -1px; background: var(--ink2); }
  .sshelf[data-kind='bush'] .puck { box-shadow: 0 0 16px 4px rgba(255,214,102,.75); border-color: #ffe9a8; animation: twinkle2 1.8s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  /* sunset: beach balls on the sand */
  .sshelf[data-kind='sunset'] .sdeco { display: block; position: absolute; inset: -7%; border-radius: 50%; background: conic-gradient(#e11d48 0 60deg, #fff 60deg 120deg, #f59e0b 120deg 180deg, #fff 180deg 240deg, #0ea5e9 240deg 300deg, #fff 300deg); box-shadow: 0 6px 8px -4px rgba(0,0,0,.4); }
  .sshelf[data-kind='sunset'] .puck { position: relative; left: auto; bottom: auto; border: 0; box-shadow: none; transform: scale(.74); }
  .sshelf[data-kind='sunset'] .sitem:active .sdeco { transform: rotate(40deg); transition: transform .3s; }
  /* fridge door: photos pegged on a string */
  .sshelf[data-kind='fridge'] .sitem { border-radius: 3px; transform: rotate(calc((var(--i) - 3) * 1.5deg)); margin-top: 8%; }
  .sshelf[data-kind='fridge'] .puck { border-radius: 3px; border: 4px solid #fff; border-bottom-width: 13px; background: var(--art) center / cover; box-shadow: 0 4px 6px rgba(0,0,0,.28); }
  .sshelf[data-kind='fridge'] .sdeco { display: block; position: absolute; left: 50%; top: -9%; width: 9px; height: 16px; margin-left: -4.5px; border-radius: 2px; background: #c9a36a; box-shadow: 0 1px 2px rgba(0,0,0,.3); z-index: 1; }
  .sshelf[data-kind='fridge'] .slabel { background: var(--note, #fff6c4); border-radius: 2px; transform: rotate(-1.5deg); box-shadow: 0 3px 5px rgba(0,0,0,.2); }
  :host([data-phone]) .sshelf { width: 100%; flex-direction: row; align-items: flex-end; gap: 8px; } :host([data-phone]) .sitems { flex: 1; grid-template-columns: repeat(7, 1fr); gap: 4px; } :host([data-phone]) .sitem { width: 100%; min-width: 0; max-width: 44px; } :host([data-phone]) .slabel span, :host([data-phone]) .sline { display: none; }
  /* orbits */
  .ring { position: absolute; left: 50%; top: 42%; width: calc(var(--r) * var(--k) * 2 * var(--u)); height: calc(var(--r) * var(--k) * var(--sq) * 2 * var(--u)); transform: translate(-50%, -50%); border-radius: 50%; border: 2.5px solid color-mix(in srgb, var(--c) 70%, transparent); pointer-events: none; }
  .ring.park { border: 2px dashed var(--track); }
  .core { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); z-index: 1; border-radius: 50%; box-shadow: 0 0 34px 8px color-mix(in srgb, var(--accent) 55%, transparent); }
  .plane { position: absolute; left: 50%; top: 42%; width: 0; height: 0; transform: scaleY(var(--sq)); }
  .arm { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: rotate(calc(var(--a) * 1deg)); }
  .arm[data-moving] { animation: orbit var(--t) linear infinite; animation-delay: calc(var(--a) / 360 * var(--t) * -1); animation-play-state: var(--motion, running); }
  @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .hold { position: absolute; left: 0; top: 0; width: 0; height: 0; transform: translateX(calc(var(--r) * var(--k) * var(--u))); }
  .unspin { width: 0; height: 0; transform: rotate(calc(var(--a) * -1deg)); }
  .arm[data-moving] .unspin { animation: orbit var(--t) linear infinite reverse; animation-delay: calc(var(--a) / 360 * var(--t) * -1); animation-play-state: var(--motion, running); }
  .unsquash { width: 0; height: 0; transform: scaleY(calc(1 / var(--sq))); }
  .actor.planet { position: absolute; left: 0; top: 0; transform: translate(-50%, -42%); }
  .arm[data-away] { opacity: .25; } .actor.clone { pointer-events: none; }
  .orbits .actor { width: clamp(108px, 24cqh, 160px); } .orbits .actor > svg { aspect-ratio: 108 / 84; margin-bottom: -14px; } .orbits .aname { min-height: 44px; padding: 0 8px; background: transparent; justify-content: flex-start; } .orbits .aname span { font-size: 13px; }
  .orbits .actor[data-focus] .aname { background: transparent; box-shadow: none; } .orbits .actor[data-focus] .aname b { text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 2px; }
  .afill { fill: var(--c); } .afill.soft { opacity: .6; } .afill.edge, .aidle.edge { stroke: #fff; stroke-width: 2.5; }
  .aidle { fill: var(--ink3); opacity: .75; } .ahull { fill: #fff; stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  .aline { fill: none; stroke: var(--ink); stroke-width: 3.5; stroke-linecap: round; } .aline.thin { stroke-width: 1.8; opacity: .7; }
  .aflag { fill: var(--accent); } .amoon { fill: #f6d77a; stroke: rgba(0,0,0,.25); stroke-width: 1; }
  .aeye { fill: #fff; } .apupil { fill: #0b2236; } .abub { fill: none; stroke: #fff; stroke-width: 2; } .aring { fill: none; stroke: #fff; stroke-width: 2.5; opacity: .85; }
  .aglow { fill: var(--c); opacity: .3; transform-box: fill-box; transform-origin: center; animation: aglow 1.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes aglow { from { transform: scale(.9); } to { transform: scale(1.2); opacity: .12; } }
  .aorbit { display: none; }
  .alog { fill: #6b4a2b; stroke: #3d2a18; stroke-width: 1.5; } .aflame { fill: var(--c); } .aflame.in { fill: #ffd166; } .aember { fill: #b45309; opacity: .8; }
  .ashade { fill: rgba(0,0,0,.2); } .ainit { fill: #fff; font-size: 17px; font-weight: 700; text-anchor: middle; }
  .bob, .swim, .flick, .sway, .jig { transform-box: fill-box; transform-origin: 50% 100%; }
  .actor[data-playing] .bob { animation: abob 2.6s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes abob { from { transform: translateY(-3px) rotate(-3deg); } to { transform: translateY(3px) rotate(3deg); } }
  .actor[data-playing] .swim { transform-origin: center; animation: aswim 2.8s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes aswim { from { transform: translateX(-6px) rotate(-4deg); } to { transform: translateX(6px) rotate(4deg); } }
  .actor[data-playing] .abub { animation: abub 2.4s ease-in infinite; animation-iteration-count: var(--loops, infinite); } .abub.late { animation-delay: -1.2s; }
  @keyframes abub { from { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } to { transform: translateY(-46px); opacity: 0; } }
  .actor[data-playing] .flick { animation: aflick .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes aflick { from { transform: scale(.96, 1.04) skewX(-3deg); } to { transform: scale(1.04, .95) skewX(3deg); } }
  .actor[data-playing] .sway { transform-origin: center; animation: asway 2.2s ease-in-out infinite alternate; animation-delay: inherit; animation-iteration-count: var(--loops, infinite); }
  @keyframes asway { from { transform: translateX(-5px) rotate(-8deg); } to { transform: translateX(5px) rotate(8deg); } }
  .actor[data-playing] .jig { transform-origin: center; animation: ajig .5s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
  @keyframes ajig { from { transform: rotate(-6deg); } to { transform: rotate(6deg); } }
  .vscene[data-kind='space'] .aidle, .vscene[data-kind='orbit'] .aidle { fill: transparent; stroke: var(--ink2); stroke-width: 2; opacity: 1; }
  .vscene[data-fit] .aname span { display: none; }
  :host([data-phone]) .vscene { flex: none; height: 580px; --k: .54; --sq: .9; } :host([data-phone]) .actor, :host([data-phone]) .orbits .actor { width: 92px; }
`, Xa = 0.8, sa = { thumbs: {}, res: {}, key: "" }, ra = {}, or = [{ name: "ABC Kids listen", match: "ABC Kids listen" }, { name: "ABC Jazz", match: "ABC Jazz" }], sr = [{ name: "Dinner", find: "dinner" }, { name: "Dance", find: "dance hits" }, { name: "Tidy-up", find: "motivation" }, { name: "Wind down", find: "sleep sounds" }], rr = [[/dinner|eat|meal|breakfast|lunch/i, "🍽️"], [/danc|party|disco/i, "🪩"], [/tidy|clean|chore|job/i, "🧹"], [/wind|sleep|bed|calm|night/i, "🌙"], [/morning|wake/i, "☀️"], [/read|story|homework|study/i, "📚"]], na = (e) => `${Math.floor(e / 60)}:${String(Math.floor(e % 60)).padStart(2, "0")}`, Se = ["Dinner’s ready!", "Time to get ready, please.", "Please come to the kitchen.", "Five minutes until bedtime.", "Time to leave – shoes on!", "I love you!"], nr = { track: "Song", album: "Album", playlist: "Playlist", artist: "Artist", radio: "Radio", podcast: "Podcast", audiobook: "Story" }, Pa = () => (/* @__PURE__ */ new Date()).toDateString(), Ct = (e, t) => {
  try {
    const a = localStorage.getItem(e);
    return a === null ? t : JSON.parse(a);
  } catch {
    return t;
  }
}, la = (e, t) => {
  try {
    localStorage.setItem(e, JSON.stringify(t));
  } catch {
  }
}, ya = class ya extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.fitCtl = new yt(this), this.players = [], this.stations = [], this.source = "media-source://radio_browser/country/AU", this.preferred = "", this.kids = [], this.people = [], this.pin = "", this.quiet = {}, this.sleepMinutes = 30, this.map = [], this.hide = [], this.lock = !0, this.moments = [], this.callVolume = 70, this.callLanguage = "en-AU", this.callVoice = "", this._jog = null, this._momentOn = null, this._momentBusy = "", this._sleepAt = null, this._padSet = Ct("fh-moments", {}), this.theme = "", this._view = Ct("fh-music-view", ""), this._dv = {}, this._viewAsk = !1, this._peek = !1, this._sd = null, this._shelfAsked = !1, this._crateAt = 0, this._carry = null, this._carried = 0, this._prev = "rooms", this._shelfTo = "", this._tab = "rooms", this._focus = "", this._cleared = "", this._thumbs = {}, this._resolved = {}, this._loaded = !1, this._radioTried = 0, this._msg = "", this._q = null, this._qKey = "", this._text = "", this._caps = !0, this._hits = null, this._busy = !1, this._keys = !0, this._sel = "", this._shelf = "Family", this._items = {}, this._edit = !1, this._juke = ((t) => t.day === Pa() ? t : { day: Pa(), on: !1, who: "", picks: [] })(Ct("fh-juke", { day: "", on: !1, who: "", picks: [] })), this._keep = Ct("fh-keep", !1), this._callTo = [], this._callMsg = "", this._pinAsk = null, this._pinTo = null, this._adding = !1, this._jpick = !1, this._ckeys = !1, this._now = Date.now(), this._was = "", this._lastUri = "", this._lastCall = 0, this._fedFor = "", this._fedName = "", this._undo = null, this._coach = !1, this._coachT = 0, this._coachFor = "";
  }
  get _pads() {
    return (this.moments.length ? this.moments : sr).slice(0, 4);
  }
  _padPut(t, a) {
    const { [t]: i, ...o } = this._padSet;
    this._padSet = a ? { ...o, [t]: { uri: a.uri, title: a.name } } : o, la("fh-moments", this._padSet), this._say(a ? `${t} now plays ${a.name}` : `${t} is back to its own music`);
  }
  connectedCallback() {
    super.connectedCallback(), this._tick = window.setInterval(() => {
      this._cur?.state === "playing" && (this._now = Date.now());
    }, 1e3);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), clearInterval(this._tick);
  }
  _say(t, a) {
    this._msg = t, this._undo = a ?? null, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "", this._undo = null;
    }, a ? 7e3 : Math.max(4e3, t.split(/\s+/).length * 450));
  }
  get _list() {
    const t = this.hass, a = Xe(t, this.players);
    let i = a;
    if (this.lock && this.map.length) {
      const s = this.map.flatMap((n) => (n.rooms ?? []).flatMap((c) => (c.zones ?? (c.player ? [{ player: c.player, name: c.name }] : [])).map((p) => ({ id: p.player ?? "", name: p.name ?? c.name ?? "" })))).filter((n) => n.id), r = /* @__PURE__ */ new Set();
      i = s.map((n) => lt(t, a, n.id) ?? t.states[n.id] ?? { entity_id: n.id, state: "unavailable", attributes: { friendly_name: n.name || n.id.split(".").pop() } }).filter((n) => !r.has(n.entity_id) && !!r.add(n.entity_id));
    }
    if (!this.hide.length) return i;
    const o = new Set(this.hide.map((s) => lt(t, i, s)?.entity_id ?? s));
    return i.filter((s) => !o.has(s.entity_id));
  }
  _off(t) {
    return !t || t.state === "unavailable";
  }
  /** Home speakers that cannot be reached right now. */
  get _offline() {
    return this._list.filter((t) => this._off(t));
  }
  get _cur() {
    const t = this._list;
    return t.find((a) => a.entity_id === this._focus) ?? lt(this.hass, t, this.preferred) ?? t.find((a) => a.state === "playing") ?? t.find((a) => !this._off(a)) ?? t[0];
  }
  get _stations() {
    return (this.stations.length ? this.stations : or).map((a) => typeof a == "string" ? { name: a, match: a } : a);
  }
  get _everyone() {
    return [...this.people.filter((t) => !this.kids.some((a) => a.name === t.name)), ...this.kids.map((t) => ({ name: t.name, colour: t.colour }))];
  }
  /** Tonight's DJ, if a child has cashed in the reward. */
  get _dj() {
    const t = Ct("fh-dj", null);
    return t && t.day === Pa() ? t.kid : "";
  }
  /** What the family calls it: the room's name on the map, else the speaker's own name. */
  _name(t) {
    if (!t) return "a speaker";
    for (const a of this._floors) for (const i of a.rooms) for (const o of i.zones) if (o.p.entity_id === t.entity_id) return o.name || i.name;
    return String(t.attributes.friendly_name ?? "a speaker");
  }
  _mix(t) {
    return (t?.attributes.group_members ?? []).filter((a) => a !== t?.entity_id);
  }
  _guard(t, a) {
    this.pin ? this._pinAsk = { reason: t, run: a } : a();
  }
  async _loadRadio() {
    const t = this.source + JSON.stringify(this.stations);
    if (sa.key === t) {
      this._thumbs = sa.thumbs, this._resolved = sa.res;
      return;
    }
    if (!(this._loaded || !this.hass || Date.now() - this._radioTried < 3e4)) {
      this._loaded = !0, this._radioTried = Date.now();
      try {
        const a = await this.hass.callWS({ type: "media_source/browse_media", media_content_id: this.source }), i = {}, o = {};
        for (const s of this._stations) {
          const r = s.id ? s.id.startsWith("media-source://") ? s.id : `media-source://radio_browser/${s.id}` : "", n = a.children.find((c) => r ? c.media_content_id === r : c.title.toLowerCase().includes((s.match ?? s.name).toLowerCase()));
          n ? (o[s.name] = n.media_content_id, n.thumbnail && (i[s.name] = n.thumbnail)) : r && (o[s.name] = r);
        }
        this._thumbs = i, this._resolved = o, Object.assign(sa, { thumbs: i, res: o, key: t });
      } catch (a) {
        console.warn("Family Hub: radio browse failed", a), this._loaded = !1;
      }
    }
  }
  /** A room view other than the list takes the whole page: the player steps aside and its controls move into the bar above the view. */
  get _full() {
    return this._tab === "rooms" && this._mode !== "list" && !this._peek && !!this._cur;
  }
  willUpdate() {
    this.toggleAttribute("data-full", !!this.hass && this._full);
  }
  updated(t) {
    const a = this._cur;
    if (!this.hass || !a) return;
    const i = `${a.entity_id}|${a.attributes.media_content_id ?? ""}|${a.state === "playing"}`;
    if (i !== this._qKey && (this._qKey = i, Qs(this.hass, a.entity_id).then((o) => {
      this._q = o, this._feed();
    })), t.has("hass")) {
      const o = `${a.entity_id}:${a.state}`;
      this._was === `${a.entity_id}:playing` && a.state === "idle" && !this._feed(!0) && this._keep && this._lastUri && Gt(this.hass, a.entity_id, this._lastUri, "play", !0).catch(() => {
      }), this._was = o;
    }
  }
  _play(t) {
    const a = this._cur, i = this._resolved[t.name];
    if (a) {
      if (!i) {
        this._say(`Couldn’t find ${t.name} – check the station list`);
        return;
      }
      this._gentle(a.entity_id, () => {
        this.hass.callService("media_player", "play_media", { entity_id: a.entity_id, media_content_id: i, media_content_type: "music" }).then(() => {
          ra[a.entity_id] = t.name, this.requestUpdate(), this._say(`${t.name} in ${this._name(a)}`);
        }).catch((o) => this._say(`${this._name(a)} couldn’t play that: ${o?.message ?? "error"}`));
      });
    }
  }
  /* ---------------- transport ---------------- */
  /** Every way music can start goes through _gentle, so a bedroom after bedtime always asks a grown-up first. Pausing, turning down and leaving never ask. */
  _svc(t, a = {}, i = this._cur?.entity_id) {
    if (!i) return;
    const o = this.hass.states[i]?.state, s = t === "media_play" || t === "media_play_pause" && o !== "playing" && o !== "buffering", r = () => {
      this.hass.callService("media_player", t, { entity_id: i, ...a }).catch((n) => this._say(`${this._name(this.hass.states[i])} didn’t respond: ${n?.message ?? "error"}`));
    };
    s ? this._gentle(i, r) : r();
  }
  _start(t, a = "play", i = !1, o = this._cur) {
    if (!o) {
      this._say("No speaker to play on");
      return;
    }
    this._gentle(o.entity_id, () => {
      this._lastUri = t.uri, Gt(this.hass, o.entity_id, t.uri, a, i).then(() => this._say(a === "play" ? `${i ? "Radio from " : ""}${t.name} on ${this._name(o)}` : a === "next" ? `${t.name} plays next` : `${t.name} added to the queue`)).catch((s) => this._say(`${this._name(o)} couldn’t play that: ${s?.message ?? "error"}`));
    });
  }
  _heart() {
    const t = this._cur && Fe(this.hass, this._cur.entity_id, /^button\..*favou?rite_current_song$/);
    if (!t || this.hass.states[t].state === "unavailable") {
      this._say("Nothing playing to save");
      return;
    }
    this.hass.callService("button", "press", {}, { entity_id: t }), this._say("Saved to favourites ♥");
  }
  _sleep() {
    const t = this._cur;
    if (!t) return;
    if (this._off(t)) {
      this._say(`${this._name(t)} is offline`);
      return;
    }
    if (this._sleepAt && this._sleepAt.id === t.entity_id && this._sleepAt.until > Date.now()) {
      const i = Bs(this.hass, t.entity_id);
      this._sleepAt = null, this._say(i ? `Sleep fade cancelled in ${this._name(t)}` : "Couldn’t cancel the sleep fade");
      return;
    }
    const a = hi(this.hass, t.entity_id, this.sleepMinutes);
    a && (this._sleepAt = { id: t.entity_id, until: Date.now() + this.sleepMinutes * 6e4 }), this._say(a ? `${this._name(t)} will fade out in ${this.sleepMinutes} minutes` : "The sleep timer needs the Family Hub sleep script in Home Assistant");
  }
  /* ---------------- rooms ---------------- */
  _join(t) {
    const a = this._cur;
    !a || t === a.entity_id || (this._mix(a).includes(t) ? this.hass.callService("media_player", "unjoin", {}, { entity_id: t }) : this._gentle(t, () => {
      this.hass.callService("media_player", "join", { group_members: [t] }, { entity_id: a.entity_id }).catch((i) => this._say(`Couldn’t add that room: ${i?.message ?? "error"}`));
    }));
  }
  /** Music for every room at once reaches the bedrooms too: after bedtime that needs a grown-up. */
  _wholeHouse(t) {
    this._floors.some((a) => a.rooms.some((i) => i.asleep && i.zones.length)) ? this._guard("Some bedrooms are asleep. Play in the whole house anyway?", () => {
      this._cleared = "*";
      try {
        t();
      } finally {
        this._cleared = "";
      }
    }) : t();
  }
  _everywhere(t, a = this._cur) {
    if (a) {
      if (this._off(a)) {
        this._say(`${this._name(a)} is offline`);
        return;
      }
      if (t) {
        const i = this.hass, o = this._mix(a), s = this._list.filter((n) => !this._off(n)).map((n) => n.entity_id).filter((n) => n !== a.entity_id), r = this._list.filter((n) => n.entity_id !== a.entity_id && !o.includes(n.entity_id) && this._leader(n)?.entity_id === n.entity_id).map((n) => ({ id: n.entity_id, members: this._mix(n), playing: n.state === "playing" }));
        i.callService("media_player", "join", { group_members: s }, { entity_id: a.entity_id }).then(() => this._say("Playing in the whole house", () => {
          for (const n of s) o.includes(n) || i.callService("media_player", "unjoin", {}, { entity_id: n });
          window.setTimeout(() => {
            for (const n of r)
              n.members.length && i.callService("media_player", "join", { group_members: n.members }, { entity_id: n.id }), n.playing && i.callService("media_player", "media_play", {}, { entity_id: n.id });
          }, 600), this._say("Put back as it was");
        })).catch((n) => this._say(`Couldn’t group every room: ${n?.message ?? "error"}`));
      } else for (const i of this._mix(a)) this.hass.callService("media_player", "unjoin", {}, { entity_id: i });
    }
  }
  _move(t, a = this._cur) {
    if (a) {
      if (this._asleep(t.entity_id) && this._cleared !== t.entity_id && this._cleared !== "*") {
        this._gentle(t.entity_id, () => this._move(t, a));
        return;
      }
      if (!ea(this.hass)) {
        this.hass.callService("media_player", "join", { group_members: [t.entity_id] }, { entity_id: a.entity_id }).then(() => this._say(`${this._name(t)} added (moving music needs Music Assistant)`)).catch((i) => this._say(`Couldn’t add that room: ${i?.message ?? "error"}`));
        return;
      }
      this.hass.callService("music_assistant", "transfer_queue", { source_player: a.entity_id, auto_play: !0 }, { entity_id: t.entity_id }).then(() => {
        this._focus = t.entity_id, this._say(`Music moved to ${this._name(t)}`);
      }).catch((i) => this._say(`Couldn’t move the music: ${i?.message ?? "error"}`));
    }
  }
  /* ---------------- the house ---------------- */
  get _mode() {
    return Jt.some((t) => t.id === this._view) ? this._view : this.map.length ? "house" : "list";
  }
  _setVol(t, a, i) {
    this._dv = { ...this._dv, [t]: a }, i && (this._svc("volume_set", { volume_level: a / 100 }, t), window.setTimeout(() => {
      if (this._dv[t] === a) {
        const { [t]: o, ...s } = this._dv;
        this._dv = s;
      }
    }, 900));
  }
  /** What the other room views draw from, and the few things they can do. */
  _vctx() {
    const t = this._cur, a = this._mix(t), i = t && this._leader(t), o = t?.attributes ?? {}, s = [...new Set(this._list.map((b) => this._leader(b)?.entity_id).filter((b) => !!b && b !== i?.entity_id))], r = this._floors.flatMap((b) => b.rooms.flatMap((R) => R.zones.map((Y) => {
      const St = Y.p, gt = St.entity_id, tt = this._leader(St), Gi = typeof St.attributes.volume_level == "number";
      return {
        id: gt,
        name: Y.name,
        stream: tt?.entity_id ?? "",
        vol: gt in this._dv ? this._dv[gt] : Gi ? Math.round(St.attributes.volume_level * 100) : 0,
        hasVol: Gi,
        live: !!tt,
        playing: tt?.state === "playing",
        focus: gt === t?.entity_id,
        inmix: a.includes(gt),
        offline: this._off(St),
        asleep: R.asleep,
        lead: tt?.entity_id === gt,
        colour: tt && tt.entity_id !== i?.entity_id ? `var(--p-${[3, 5, 4, 2][s.indexOf(tt.entity_id) % 4]})` : "",
        title: String(tt?.attributes.media_title ?? "")
      };
    }))), n = Number(o.media_duration) || 0, c = o.media_position_updated_at ? new Date(o.media_position_updated_at).getTime() : 0, p = t?.state === "playing", d = n ? Math.min(n, (Number(o.media_position) || 0) + (p && c ? (this._now - c) / 1e3 : 0)) : 0, h = n ? d / n : 0, m = this._pads, f = this._jog, x = this._momentOn && this.hass.states[this._momentOn.lead]?.state === "playing" ? this._momentOn.name : "";
    this._shelfAsked || (this._shelfAsked = !0, this._loadShelves());
    const K = this.kids.find((b) => b.name === this._shelf), A = !!K && jt(K.bedtime), U = this._items[this._shelf] ?? [], y = A ? U.filter((b) => b.calm) : U, q = Math.max(0, Math.min(y.length - 1, this._crateAt));
    this._mode === "dial" && this._loadRadio();
    const k = this._juke, w = (b) => k.picks.filter((R) => R.done && R.who === b).length, S = k.on ? k.picks.filter((b) => !b.done).sort((b, R) => +(R.who === this._dj) - +(b.who === this._dj) || w(b.who) - w(R.who) || b.t - R.t) : [], V = S.length ? S.slice(0, 3).map((b) => ({ title: b.name, sub: `${b.who}’s pick`, art: b.img ?? "" })) : this._q?.next ? [{ title: this._q.next.name, sub: this._q.next.sub ?? "From the queue", art: this._q.next.img ?? "" }] : [], C = this._everyone, Mi = Qt(C.map((b) => b.name)), Rt = new Set(S.map((b) => b.who)), Ci = [...C].sort((b, R) => Number(Rt.has(b.name)) - Number(Rt.has(R.name)) || w(b.name) - w(R.name))[0]?.name ?? "", ja = (this._items.Family ?? []).slice(0, 4), no = this._stations.filter((b) => !ja.some((R) => R.name.toLowerCase() === b.name.toLowerCase())).slice(0, Math.max(0, 7 - ja.length)), ji = t && p ? ra[t.entity_id] : "", zi = [...ja.map((b) => ({ name: b.name, on: p && !ji && this._lastUri === b.uri, go: () => {
      t && this._gentle(t.entity_id, () => {
        delete ra[t.entity_id], this._shelfPlay(b, t);
      });
    } })), ...no.map((b) => ({ name: b.name, on: ji === b.name, go: () => {
      t && this._gentle(t.entity_id, () => this._play(b));
    } }))], lo = this._sleepAt && this._sleepAt.id === t?.entity_id && this._sleepAt.until > Date.now() ? Math.max(1, Math.ceil((this._sleepAt.until - Date.now()) / 6e4)) : null;
    return {
      rooms: r,
      dial: {
        next: V,
        more: S.length ? Math.max(0, S.length - 3) : Math.max(0, (this._q?.items ?? 0) - 2),
        turn: C.map((b) => ({ name: b.name, short: Mi[b.name] ?? b.name[0], colour: T(b.colour), now: b.name === Ci })),
        chooser: Ci,
        choose: (b) => {
          this._saveJuke({ who: b }), this._prev = "rooms", this._tab = "juke", this._jpick = !0;
        },
        sleep: { mins: this.sleepMinutes, left: lo },
        sleepGo: () => this._sleep(),
        stops: zi.map((b) => ({ name: b.name, on: b.on })),
        tune: (b) => zi[b]?.go()
      },
      moments: m.map((b) => ({ name: b.name, icon: b.icon ?? rr.find(([R]) => R.test(b.name))?.[1] ?? "🎵", on: x === b.name, busy: this._momentBusy === b.name })),
      moment: (b) => {
        !this._momentBusy && m[b] && this._moment(m[b]);
      },
      jog: { turn: f, at: d, read: f === null ? n ? na(d) : "" : n ? na(Math.max(0, Math.min(n, d + f / 360 * 120))) : Math.abs(f) < 60 ? "" : f > 0 ? "Next" : "Back", len: n, says: n ? `${na(d)} of ${na(n)}` : "No length" },
      jogTo: (b, R) => this._jogTo(b, R, d, n),
      seekBy: (b) => {
        n ? this._svc("media_seek", { seek_position: Math.max(0, Math.min(n - 1, Math.round(d + b))) }) : this._svc(b > 0 ? "media_next_track" : "media_previous_track");
      },
      prev: () => this._svc("media_previous_track"),
      next: () => this._svc("media_next_track"),
      crate: {
        tabs: this._shelfNames.map((b) => ({ name: b, colour: T(this.kids.find((R) => R.name === b)?.colour ?? "family") })),
        who: this._shelf,
        pick: (b) => {
          this._shelf = b, this._crateAt = 0;
        },
        items: y,
        at: q,
        calm: A,
        room: this._name(t),
        play: (b) => {
          Date.now() - this._carried < 400 || !t || this._gentle(t.entity_id, () => this._shelfPlay(b, t));
        },
        flick: (b) => {
          this._crateAt = b;
        },
        tap: (b) => {
          Date.now() - this._carried < 400 || (b !== q ? this._crateAt = b : t && y[b] && this._gentle(t.entity_id, () => this._shelfPlay(y[b], t)));
        }
      },
      streams: [...i ? [i.entity_id] : [], ...s],
      sdrag: this._sd,
      setDrag: (b) => {
        this._sd = b;
      },
      join: (b, R) => {
        b !== R && this._gentle(b, () => {
          this.hass.callService("media_player", "join", { group_members: [b] }, { entity_id: R }).catch((Y) => this._say(`Couldn’t add that room: ${Y?.message ?? "error"}`));
        });
      },
      leave: (b) => {
        this.hass.callService("media_player", "unjoin", {}, { entity_id: b });
      },
      look: et(),
      theme: this.theme,
      phone: D() === "phone",
      over: this._carry?.over ?? "",
      lifted: this._carry?.from ?? "",
      liftedItem: this._carry?.item ?? null,
      shelf: this._items.Family ?? [],
      now: { title: String(o.media_title ?? (i ? "Music" : "Nothing playing")), artist: String(o.media_artist ?? o.media_album_name ?? ""), art: o.entity_picture ? String(o.entity_picture) : "", playing: p, frac: h, lead: i?.entity_id ?? "" },
      vol: (b, R, Y) => this._setVol(b, R, Y),
      toggle: (b) => {
        b !== t?.entity_id && (a.includes(b) ? this._join(b) : this._gentle(b, () => {
          i ? this._join(b) : this._focus = b;
        }));
      },
      focus: (b) => {
        this._focus = b;
      },
      playPause: () => this._svc("media_play_pause"),
      all: () => this._wholeHouse(() => this._everywhere(!0)),
      carry: (b, R) => {
        const Y = this.hass.states[R];
        Y && this._carryDown(b, { lead: Y });
      },
      carryItem: (b, R, Y) => this._carryDown(b, { item: R, flick: Y }),
      playItem: (b) => {
        Date.now() - this._carried > 400 && this._start(b);
      }
    };
  }
  /** One press for an occasion: find the music, set the rooms and the volume, play. */
  _moment(t) {
    const a = this.hass, i = this._list, o = this._cur, s = t.rooms === "all", r = Array.isArray(t.rooms) ? t.rooms : [], n = this._padSet[t.name], c = r.map((h) => lt(a, i, h) ?? (a.states[h]?.entity_id.startsWith("media_player.") ? a.states[h] : void 0)).filter((h) => !!h), p = (s ? [...o ? [o] : [], ...i.filter((h) => h.entity_id !== o?.entity_id)] : c.length ? c : o ? [o] : []).filter((h) => !this._off(h));
    if (!p.length) {
      this._say(this._offline.length ? "Those speakers are offline" : "No speaker to play on");
      return;
    }
    c.length < r.length && console.warn("Family Hub: a moment names a speaker that was not found", t);
    const d = async () => {
      this._momentBusy = t.name;
      try {
        const h = n ? { name: n.title, uri: n.uri } : t.uri ? { name: t.name, uri: t.uri } : await Zs(a, t.find ?? t.name, t.kind ?? "playlist");
        if (!h) {
          this._say(`Couldn’t find “${t.find ?? t.name}” to play`);
          return;
        }
        const m = p[0], f = p.map((x) => x.entity_id);
        for (const x of this._mix(m)) f.includes(x) || a.callService("media_player", "unjoin", {}, { entity_id: x });
        if (typeof t.volume == "number") for (const x of f) this._svc("volume_set", { volume_level: Math.max(0, Math.min(100, t.volume)) / 100 }, x);
        t.shuffle && this._svc("shuffle_set", { shuffle: !0 }, m.entity_id), this._lastUri = h.uri, await Gt(a, m.entity_id, h.uri, "play"), f.length > 1 && await a.callService("media_player", "join", { group_members: f.slice(1) }, { entity_id: m.entity_id }).catch((x) => this._say(`Couldn’t add every room: ${x?.message ?? "error"}`)), this._focus = m.entity_id, this._momentOn = { name: t.name, lead: m.entity_id }, this._say(`${t.name}: ${h.name === t.name ? "" : `${h.name} `}in ${s ? "every room" : p.map((x) => this._name(x)).join(" and ")}`);
      } catch (h) {
        this._say(`${t.name} couldn’t start: ${h?.message ?? "error"}`);
      } finally {
        this._momentBusy = "";
      }
    };
    p.some((h) => this._asleep(h.entity_id)) ? this._guard(`${t.name} plays in a bedroom after bedtime. Play anyway?`, () => {
      d();
    }) : d();
  }
  /** The jog wheel: a turn moves through the song (a full turn is two minutes); past either end it skips. Music with no length skips a track each way. */
  _jogTo(t, a, i, o) {
    if (!a) {
      this._jog = t;
      return;
    }
    if (this._jog = null, !o) {
      Math.abs(t) >= 60 && this._svc(t > 0 ? "media_next_track" : "media_previous_track");
      return;
    }
    const s = i + t / 360 * 120;
    s >= o - 1 ? this._svc("media_next_track") : s < 0 && i < 5 ? this._svc("media_previous_track") : this._svc("media_seek", { seek_position: Math.max(0, Math.round(s)) });
  }
  /** The speaker a room's music comes from, if anything is on there (playing or paused). */
  _leader(t) {
    const a = (s) => s.attributes.group_members ?? [], i = a(t);
    let o = t;
    if (!(i.length > 1 && i[0] === t.entity_id)) {
      const s = this._list.filter((r) => r.entity_id !== t.entity_id && a(r).includes(t.entity_id));
      o = s.find((r) => a(r)[0] === r.entity_id) ?? s[0] ?? t;
    }
    return ["playing", "paused", "buffering"].includes(o.state) ? o : void 0;
  }
  /** Floors, top one first. Speakers the settings do not place go on a last row, so none can go missing. */
  get _floors() {
    const t = this.hass, a = this._list, i = /* @__PURE__ */ new Set(), o = ut(), s = I(this.quiet.end ?? "06:30"), r = (p) => {
      const d = lt(t, a, p);
      return d && i.add(d.entity_id), d;
    }, n = this.map.map((p) => ({ name: p.name ?? "", rooms: (p.rooms ?? []).map((d) => {
      const h = (d.zones ?? (d.player ? [{ player: d.player, name: d.name }] : [])).map((f) => ({ name: f.name ?? "", p: r(f.player) })).filter((f) => !!f.p).map((f) => ({ ...f, name: f.name || String(f.p.attributes.friendly_name ?? "") })), m = (d.kids ?? []).map((f) => this.kids.find((x) => x.name === f)).filter((f) => !!f).map((f) => I(Zt(f.bedtime)));
      return { name: d.name ?? h[0]?.name ?? "", size: d.size ?? Math.max(1, h.length), stairs: !!d.stairs, asleep: m.length > 0 && (o >= Math.min(...m) || o < s), zones: h };
    }).filter((d) => d.stairs || d.zones.length) })).filter((p) => p.rooms.some((d) => d.zones.length)), c = a.filter((p) => !i.has(p.entity_id)).map((p) => ({ name: String(p.attributes.friendly_name ?? ""), size: 1, stairs: !1, asleep: !1, zones: [{ name: String(p.attributes.friendly_name ?? ""), p }] }));
    return c.length && n.push({ name: n.length ? "Other" : "", rooms: c }), n;
  }
  _asleep(t) {
    return this._floors.some((a) => a.rooms.some((i) => i.asleep && i.zones.some((o) => o.p.entity_id === t)));
  }
  /** Bedrooms after bedtime need a grown-up (when a PIN is set) before music goes there. */
  _gentle(t, a) {
    if (this._off(this._list.find((i) => i.entity_id === t) ?? this.hass.states[t])) {
      this._say(`${this._name(this._list.find((i) => i.entity_id === t))} is offline`);
      return;
    }
    this._asleep(t) && this._cleared !== t && this._cleared !== "*" ? this._guard(`${this._name(this.hass.states[t])} is in a bedroom after bedtime. Play there anyway?`, () => {
      this._cleared = t;
      try {
        a();
      } finally {
        this._cleared = "";
      }
    }) : a();
  }
  _volDown(t, a) {
    if (!t.isPrimary || t.target.closest(".zname, .join, .puck") || typeof a.attributes.volume_level != "number" || D() === "phone" && !t.target.closest(".grab")) return;
    const i = t.currentTarget, o = a.entity_id, s = t.clientY, r = Math.round(a.attributes.volume_level * 100), n = i.getBoundingClientRect().height * Xa;
    let c = !1, p = r;
    const d = (m) => {
      !c && Math.abs(m.clientY - s) < 6 || (c = !0, p = Math.max(0, Math.min(100, Math.round(r + (s - m.clientY) / n * 100))), this._setVol(o, p, !1));
    }, h = () => {
      i.removeEventListener("pointermove", d), i.removeEventListener("pointerup", h), i.removeEventListener("pointercancel", h), c && this._setVol(o, p, !0);
    };
    i.setPointerCapture(t.pointerId), i.addEventListener("pointermove", d), i.addEventListener("pointerup", h), i.addEventListener("pointercancel", h);
  }
  _volKey(t, a) {
    const i = t.key === "ArrowUp" || t.key === "ArrowRight" ? 5 : t.key === "ArrowDown" || t.key === "ArrowLeft" ? -5 : 0;
    !i || typeof a.attributes.volume_level != "number" || (t.preventDefault(), this._svc("volume_set", { volume_level: Math.max(0, Math.min(1, a.attributes.volume_level + i / 100)) }, a.entity_id));
  }
  /** Pick something up and carry it to a room: the music itself (a tap pauses or plays it), or a record from a shelf. */
  _carryDown(t, a) {
    if (!t.isPrimary) return;
    const i = a.lead, o = a.item;
    let s = !1, r = 0;
    i && t.stopPropagation();
    const n = t.currentTarget, c = this.renderRoot.querySelector(".panel"), p = t.clientX, d = t.clientY, h = String(i?.attributes.entity_picture ?? o?.img ?? ""), m = (K, A) => {
      const U = (q) => {
        const k = q.getBoundingClientRect();
        return K >= k.left && K <= k.right && A >= k.top && A <= k.bottom;
      };
      if ([...this.renderRoot.querySelectorAll('[data-drop="all"]')].some(U)) return "all";
      const y = o ? this.renderRoot.querySelector('[data-drop="deck"]') : null;
      return y && U(y) ? "deck" : [...this.renderRoot.querySelectorAll("[data-zone]")].find(U)?.dataset.zone ?? "";
    }, f = (K) => {
      const A = c.getBoundingClientRect();
      if (r = Math.max(r, Math.hypot(K.clientX - p, K.clientY - d)), !(!this._carry && !s && Math.hypot(K.clientX - p, K.clientY - d) < 10)) {
        if (s) {
          const U = n.closest(".cratecol")?.getBoundingClientRect();
          U && (K.clientX < U.left || K.clientX > U.right || K.clientY < U.top || K.clientY > U.bottom) && (s = !1, a.flick(0));
        }
        if (!this._carry && !s && r < 60 && a.flick && Math.abs(K.clientX - p) > Math.abs(K.clientY - d) * 1.4 && (s = !0), s) {
          a.flick(K.clientX - p);
          return;
        }
        this._carry = { from: i?.entity_id, item: o, art: h, x: (K.clientX - A.left) / A.width * 100, y: (K.clientY - A.top) / A.height * 100, over: m(K.clientX, K.clientY) };
      }
    }, x = () => {
      n.removeEventListener("pointermove", f), n.removeEventListener("pointerup", x), n.removeEventListener("pointercancel", x);
      let K = this._carry;
      if (this._carry = null, s) {
        this._carried = Date.now();
        return;
      }
      if (K && r < 40 && (!K.over || K.over === i?.entity_id) && (K = null), !K) {
        i && (this._focus = i.entity_id, this._svc("media_play_pause", {}, i.entity_id));
        return;
      }
      this._carried = Date.now();
      const A = K.over && K.over !== "all" ? this.hass.states[K.over] : void 0;
      if (i && K.over === "all") this._wholeHouse(() => {
        this._focus = i.entity_id, this._everywhere(!0, i);
      });
      else if (o && K.over === "all") this._wholeHouse(() => {
        const U = this._cur;
        U && (this._shelfPlay(o, U), this._everywhere(!0, U));
      });
      else if (i && A && A.entity_id !== i.entity_id) this._gentle(A.entity_id, () => this._move(A, i));
      else if (o && K.over === "deck") {
        const U = this._cur;
        U && this._gentle(U.entity_id, () => this._shelfPlay(o, U));
      } else o && A && this._gentle(A.entity_id, () => {
        this._focus = A.entity_id, this._shelfPlay(o, A);
      });
    };
    n.setPointerCapture(t.pointerId), n.addEventListener("pointermove", f), n.addEventListener("pointerup", x), n.addEventListener("pointercancel", x);
  }
  /** The house in small: rooms as buttons, for choosing where to call or where a record goes. */
  _mini(t, a, i = !1) {
    return l`<div class="map snug">${this._floors.map((o) => l`<div class="floor">
      ${o.rooms.map((s) => s.stairs ? l`<div class="mstairs" role="img" aria-label="Stairs"></div>` : l`<div class="mroom" style="--size:${s.size}">${s.zones.map((r) => {
      const n = r.p.entity_id, c = t(n);
      return l`<button class="mz tap" data-zone=${n} ?data-offline=${this._off(r.p)} aria-pressed=${String(c)} aria-label=${r.name} ?data-live=${!!this._leader(r.p)} ?data-hot=${this._carry?.over === n} @click=${() => a(n)}>
          ${i && c ? l`<span class="shout">${F("megaphone", 22)}</span>` : u}<b>${s.asleep ? "☾ " : ""}${r.name}</b></button>`;
    })}</div>`)}</div>`)}</div>`;
  }
  _house() {
    const t = this._cur, a = this._mix(t), i = t && this._leader(t), o = this._floors, s = this._carry, r = [...new Set(this._list.map((c) => this._leader(c)?.entity_id).filter((c) => !!c && c !== i?.entity_id))], n = (c, p) => {
      const d = c.p, h = d.attributes, m = d.entity_id, f = this._leader(d), x = f?.state === "playing", K = m === t?.entity_id, A = a.includes(m), U = m in this._dv ? this._dv[m] : typeof h.volume_level == "number" ? Math.round(h.volume_level * 100) : null, y = f && f.entity_id !== i?.entity_id ? `--c:var(--p-${[3, 5, 4, 2][r.indexOf(f.entity_id) % 4]})` : "", q = this._off(d), k = q ? "Offline" : f ? `${x ? "" : "Paused · "}${f.attributes.media_title ?? "Music"}` : p ? "Asleep" : "Quiet", w = f?.attributes.entity_picture ? `--art:url(${f.attributes.entity_picture})` : "";
      return l`<div class="mzone" data-zone=${m} ?data-offline=${q} ?data-focus=${K} ?data-live=${!!f} ?data-playing=${x} ?data-asleep=${p} ?data-hot=${s?.over === m && s.from !== m} style=${y} @pointerdown=${(S) => this._volDown(S, d)}>
        ${f && U !== null ? l`<span class="pool" style="height:${Math.max(6, U) * Xa}%"></span>` : u}
        ${f ? l`<span class="zspk" aria-hidden="true" style="--amp:${(1.15 + (U ?? 40) / 100 * 1.5).toFixed(2)}"><i></i><i></i>${K ? l`<b></b>` : u}</span>` : u}
        ${s && f?.entity_id !== m ? l`<span class="land" aria-hidden="true"></span>` : u}
        <button class="zname tap" aria-pressed=${String(K)} aria-label="${c.name}: ${k}${U !== null ? `, volume ${U}` : ""}" @click=${() => {
        this._focus = m;
      }}><b>${p ? "☾ " : ""}${c.name}</b><span>${k}${f && U !== null ? ` · ${U}` : ""}</span></button>
        ${K || q ? u : l`<button class="join tap" aria-pressed=${String(A)} aria-label="${A ? "Remove" : "Add"} ${c.name} ${A ? "from" : "to"} the music" @click=${() => {
        A ? this._join(m) : this._gentle(m, () => this._join(m));
      }}>${A ? "✓" : "＋"}</button>`}
        ${U !== null ? l`<button class="grab" role="slider" aria-label="Volume in ${c.name}" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${U} style="bottom:${Math.max(6, U) * Xa}%" @keydown=${(S) => this._volKey(S, d)}><i></i></button>` : u}
        ${f?.entity_id === m ? l`<span class="puck" role="button" tabindex="0" ?data-lifted=${s?.from === m} style=${w} aria-label="${f.attributes.media_title ?? "Music"} in ${c.name}. Tap to ${x ? "pause" : "play"}, drag to move it to another room."
          @pointerdown=${(S) => this._carryDown(S, { lead: f })} @keydown=${(S) => {
        (S.key === "Enter" || S.key === " ") && (S.preventDefault(), this._focus = m, this._svc("media_play_pause", {}, m));
      }}></span>` : u}
      </div>`;
    };
    return l`<div class="maprow"><div class="map" data-fits>
      ${o.map((c) => l`<div class="floor">${o.length > 1 ? l`<span class="flabel">${c.name}</span>` : u}
        ${c.rooms.map((p) => p.stairs ? l`<div class="mstairs" role="img" aria-label="Stairs"></div>` : l`<div class="mroom" style="--size:${p.size}" role="group" aria-label=${p.name}>${p.zones.map((d) => n(d, p.asleep))}</div>`)}</div>`)}
    </div>${this._sideShelf()}</div>`;
  }
  /** Beside the house: a shelf of records to tap or carry to a room, and a place to drop music for the whole house. */
  _sideShelf() {
    const t = ea(this.hass), a = this._cur, i = this._carry;
    t && !this._shelfAsked && (this._shelfAsked = !0, this._loadShelves());
    const o = this.kids.find((x) => x.name === this._shelf), s = !!o && jt(o.bedtime), r = this._items[this._shelf] ?? [], n = s ? r.filter((x) => x.calm) : r, c = 9, p = n.length > c ? n.slice(0, c - 1) : n, d = Qt(this._shelfNames), h = n.length <= 4 ? 2 : 3, m = (x) => T(this.kids.find((K) => K.name === x)?.colour ?? "family"), f = (x) => {
      Date.now() - this._carried < 400 || !a || this._gentle(a.entity_id, () => this._shelfPlay(x, a));
    };
    return l`<div class="mshelf" role="group" aria-label="Shelf">
      ${t ? l`<div class="shead"><b>${s ? "🌙 " : ""}${this._shelf === "Family" ? "Family shelf" : `${this._shelf}’s shelf`}</b>
          ${this._shelfNames.map((x) => l`<button class="swho tap" style="--c:${m(x)}" aria-pressed=${String(this._shelf === x)} aria-label=${x === "Family" ? "Family shelf" : `${x}’s shelf`} @click=${() => {
      this._shelf = x;
    }}><i>${d[x] ?? x[0]}</i></button>`)}</div>
        ${p.length ? l`<div class="srecs" style="--cols:${h};--rows:${Math.ceil(Math.min(n.length, c) / h)}">${p.map((x, K) => l`<button class="srec tap" ?data-lifted=${i?.item === x} aria-label="${x.name}. Tap to play in ${this._name(a)}, or drag it onto a room."
              @pointerdown=${(A) => this._carryDown(A, { item: x })} @click=${() => f(x)}>
              <i class="puck onshelf" style="--art:${x.img ? `url(${x.img})` : `linear-gradient(135deg, var(--p-${K % 5 + 1}), var(--p-${(K + 2) % 5 + 1}))`}"></i><span>${x.name}</span></button>`)}
            ${n.length > c ? l`<button class="srec more tap" aria-label="See the whole shelf" @click=${() => {
      this._tab = "shelves";
    }}>＋${n.length - p.length}<span>more</span></button>` : u}</div>` : l`<div class="snone">${F("sleeve", 34)}<span>${s ? "Nothing calm pinned yet." : "Nothing pinned yet."}<br>Search for music, then tap Pin.</span></div>`}` : l`<span style="flex:1"></span>`}
      <button class="wholeh tap" data-drop="all" ?data-open=${!!i} ?data-hot=${i?.over === "all"} @click=${() => this._wholeHouse(() => this._everywhere(!0))}>
        ${F("home", 26)}<span><b>Whole house</b><span>${i ? "Drop it here" : "Drop music here"}</span></span></button>
    </div>`;
  }
  /* ---------------- search ---------------- */
  async _search() {
    const t = this._text.trim();
    if (!(!t || this._busy)) {
      this._busy = !0, this._sel = "";
      try {
        this._hits = await Ls(this.hass, t, this._cur?.entity_id), this._keys = !1;
      } catch (a) {
        this._hits = [], this._say(`Search didn’t work: ${a?.message ?? "error"}`);
      } finally {
        this._busy = !1;
      }
    }
  }
  /* ---------------- shelves ---------------- */
  get _shelfNames() {
    return ["Family", ...this.kids.map((t) => t.name)];
  }
  async _loadShelves() {
    const t = {};
    for (const a of this._shelfNames) t[a] = await Ys(this.hass, Mt(a));
    this._items = t;
  }
  /** Where a tapped record plays: the room picked on the little house, else the child's own speaker, else the room in focus. */
  _shelfRoom(t) {
    return (this._shelfTo ? this.hass.states[this._shelfTo] : void 0) ?? (t && Pe(this.hass, t, this._list)) ?? this._cur;
  }
  _shelfPlay(t, a) {
    const i = this.kids.find((s) => s.name === this._shelf), o = a ?? this._shelfRoom(i);
    if (!o) {
      this._start(t, "play", !1, o);
      return;
    }
    this._gentle(o.entity_id, () => {
      this._start(t, "play", !1, o), i && jt(i.bedtime) && hi(this.hass, o.entity_id, this.sleepMinutes) && window.setTimeout(() => this._say(`Fading out in ${this.sleepMinutes} minutes. Sleep well.`), 3400);
    });
  }
  _pin(t, a) {
    const i = this._pinTo, o = Mt(t);
    if (i) {
      if (this._pinTo = null, !this.hass.states[o]) {
        this._say(`Create the to-do list ${o} in Home Assistant first`);
        return;
      }
      Js(this.hass, o, i, a).then(() => {
        this._say(`Pinned to ${t === "Family" ? "the family shelf" : `${t}’s shelf`}`), this._loadShelves();
      });
    }
  }
  _unpin(t) {
    this.hass.callService("todo", "remove_item", { item: t.uid }, { entity_id: Mt(this._shelf) }).then(() => this._loadShelves());
  }
  /* ---------------- jukebox ---------------- */
  _saveJuke(t) {
    this._juke = { ...this._juke, ...t }, la("fh-juke", this._juke);
  }
  /** Whose pick is next: tonight's DJ first, then whoever has had the fewest turns. */
  _nextPick() {
    const t = this._juke.picks.filter((i) => !i.done), a = (i) => this._juke.picks.filter((o) => o.done && o.who === i).length;
    return t.sort((i, o) => +(o.who === this._dj) - +(i.who === this._dj) || a(i.who) - a(o.who) || i.t - o.t)[0];
  }
  /** Keep exactly one pick queued ahead, so the order can stay fair as people add songs. */
  _feed(t = !1) {
    const a = this._cur, i = this._juke;
    if (!i.on || !a || !this.hass) return !1;
    const o = a.state !== "playing" && a.state !== "buffering", s = String(a.attributes.media_content_id ?? "");
    if (o && this._asleep(a.entity_id)) return !1;
    const r = !!this._q?.next && this._q.next.name === this._fedName;
    if (!(t || o) && (!this._q || r) || !t && !o && this._fedFor === s) return !1;
    const n = this._nextPick();
    return n ? (this._fedFor = s, this._fedName = n.name, n.done = !0, this._saveJuke({ picks: [...i.picks] }), this._lastUri = n.uri, Gt(this.hass, a.entity_id, n.uri, t || o ? "play" : this._q?.next ? "replace_next" : "add").catch((c) => this._say(`Couldn’t queue ${n.name}: ${c?.message ?? "error"}`)), this._qKey = "", !0) : !1;
  }
  _addPick(t) {
    const a = this._juke.who || this._everyone[0]?.name || "Someone";
    this._saveJuke({ on: !0, picks: [...this._juke.picks, { ...t, who: a, t: Date.now() }] }), this._say(`${a} added ${t.name}`), this._adding = !1, this._jpick = !1, this._tab = this._prev === "rooms" ? "rooms" : "juke", this._feed();
  }
  /* ---------------- call a room ---------------- */
  _call(t = !1) {
    const a = this._callMsg.trim(), i = this._callTo.length ? this._callTo : [], o = Object.keys(this.hass.states).filter((K) => K.startsWith("tts.")).sort((K, A) => Number(A.includes("cloud")) - Number(K.includes("cloud")))[0];
    if (!a) {
      this._say("Pick or type a message first");
      return;
    }
    if (!i.length) {
      this._say("Pick a room first");
      return;
    }
    if (!o) {
      this._say("Home Assistant has no voice set up for speaking");
      return;
    }
    if (Date.now() - this._lastCall < 15e3) {
      this._say("Give it a moment before calling again");
      return;
    }
    const s = ha(/* @__PURE__ */ new Date(), this.quiet.start ?? "20:00", this.quiet.end ?? "06:30"), r = i.filter((K) => this._asleep(K)), n = !Se.includes(a);
    if (!t && this.pin && (s || r.length || n)) {
      this._pinAsk = { reason: s ? "Quiet time. Call anyway?" : r.length ? `${this._name(this.hass.states[r[0]])} is asleep. Call anyway?` : "A typed message needs a grown-up.", run: () => this._call(!0) };
      return;
    }
    this._lastCall = Date.now();
    const c = this.hass, p = this.callLanguage, d = this.callVoice ? { options: { voice: this.callVoice } } : {}, h = Math.max(0, Math.min(100, Math.round(this.callVolume))), m = (K) => (A) => this._say(`Couldn’t call ${this._name(c.states[K])}: ${A?.message ?? "error"}`), f = (K) => {
      c.callService("tts", "speak", { media_player_entity_id: K, message: a, cache: !0, ...p ? { language: p } : {}, ...d }, { entity_id: o }).catch(() => c.callService("tts", "speak", { media_player_entity_id: K, message: a, cache: !0 }, { entity_id: o })).catch(m(K));
    }, x = i.filter((K) => !!c.services?.music_assistant?.play_announcement && c.entities?.[K]?.platform === "music_assistant");
    for (const K of i) x.includes(K) || f(K);
    x.length && c.callApi("POST", "tts_get_url", { engine_id: o, message: a, cache: !0, ...p ? { language: p } : {}, ...d }).then((K) => {
      if (!K?.url) throw new Error("no speech");
      for (const A of x) c.callService("music_assistant", "play_announcement", { url: K.url, announce_volume: h }, { entity_id: A }).catch(() => f(A));
    }).catch(() => {
      for (const K of x) f(K);
    }), this._say(`Calling ${i.length === 1 ? this._name(this.hass.states[i[0]]) : `${i.length} rooms`}`);
  }
  /* ---------------- render ---------------- */
  render() {
    if (!this.hass) return u;
    const t = this._cur, a = ea(this.hass), i = [["rooms", "Rooms", "home"], ...a ? [["shelves", "Shelves", "sleeve"], ["juke", "Jukebox", "jukebox"]] : [], ["radio", "Radio", "radio"], ["call", "Call a room", "megaphone"]], o = (d) => {
      d === "search" && this._tab !== "search" && (this._prev = this._tab, this._keys = !0), this._tab = d, this._adding = !1, d === "radio" && this._loadRadio(), d === "shelves" && this._loadShelves();
    }, s = this._tab === "search", r = this._carry, n = this._full, c = this._one && !s;
    c && this._coachFor !== this._mode && (this._coachFor = this._mode, window.setTimeout(() => this._showCoach(), 0));
    const p = l`<div class="tabs ${n ? "inline" : ""}" role="tablist">${i.map(([d, h, m]) => l`<button class="tap" role="tab" aria-label=${h} aria-selected=${String(this._tab === d)} @click=${() => o(d)}>${F(m, 26)}<span>${h}</span></button>`)}</div>`;
    return l`${t ? this._hero(t) : l`<section class="glass stage"><div class="deck">No speakers found</div></section>`}
      <section class="glass panel" ?data-one=${c} @pointerdown=${(d) => {
      this._coach && !d.target.closest(".helpb") && (clearTimeout(this._coachT), this._coach = !1);
    }}>
        <div class="mhead" ?data-one=${c}><h1 class="t-title">Music</h1>${c ? this._oneRow() : u}
          ${s ? this._searchBar() : a ? l`<button class="finder tap" aria-label="Search for music" @click=${() => o("search")}>${F("search", 24)}<span>${c ? "Search…" : "Search songs, albums, stories…"}</span></button>` : l`<span style="flex:1"></span>`}${c ? this._oneNow() : u}${n && !s ? p : u}</div>
        ${s || n ? u : p}
        ${vi(this._tab, l`<div class="body">${this._tab === "rooms" ? this._rooms() : this._tab === "search" ? this._searchTab() : this._tab === "shelves" ? this._shelves() : this._tab === "juke" ? this._jukeTab() : this._tab === "radio" ? this._radio() : this._callTab()}</div>`)}
        ${r ? l`<span class="puck fly" style="left:${r.x}%;top:${r.y}%;${r.art ? `--art:url(${r.art})` : ""}"></span>` : u}
      </section>
      ${this._pinTo ? this._pinSheet() : u}
      ${this._pinAsk ? l`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => {
      const d = this._pinAsk.run;
      this._pinAsk = null, d();
    }} @cancel=${() => {
      this._pinAsk = null;
    }}></fh-pin>` : u}
      <div class="toast" role="status">${this._msg || u}${this._msg && this._undo ? l` <button class="pill tap" style="height:36px;margin-left:12px;background:#fff;color:#111" @click=${() => {
      const d = this._undo;
      this._msg = "", this._undo = null, d?.();
    }}>Undo</button>` : u}</div>`;
  }
  _hero(t) {
    const a = t.attributes, i = t.state === "playing", o = a.entity_picture ? `url(${a.entity_picture})` : "", s = typeof a.volume_level == "number" ? Math.round(a.volume_level * 100) : null, r = this._mix(t).length, n = this._q, c = Number(a.media_duration) || 0, p = a.media_position_updated_at ? new Date(a.media_position_updated_at).getTime() : 0, d = c ? Math.min(c, (Number(a.media_position) || 0) + (i && p ? (this._now - p) / 1e3 : 0)) : 0, h = c ? d / c : 0, m = X(et(), "player", { img: a.entity_picture, frac: h, playing: i });
    return l`<section class="glass stage" style=${o ? `--art:${o}` : ""} aria-label="Now playing">
      <div class="bg"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="live" style="${i ? "" : "animation:none;background:rgba(255,255,255,.5)"}"></span>
        <span style="font-size:13px;font-weight:var(--w-bold, 700);text-transform:uppercase;letter-spacing:.06em;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i ? "Playing in" : "Ready in"} ${this._name(t)}${r ? ` + ${r} more` : ""}</span></div>
      <div class="deck">${m === u ? l`<div class="cover ${i ? "" : "paused"}"></div>` : m}</div>
      <div class="titles" style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="display" style="font-size:24px;font-weight:var(--w-heavy, 800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_title ?? (t.state === "off" ? "Off" : "Nothing playing")}</span>
        <span style="font-size:15px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_artist ?? a.media_album_name ?? "Search, pick from a shelf or tap a station"}</span>
      </div>
      ${c ? l`<div class="bar" role="progressbar" aria-label="Track progress" aria-valuenow=${Math.round(h * 100)} aria-valuemin="0" aria-valuemax="100"><i style="width:${h * 100}%"></i></div>` : u}
      <div class="ctl">
        <button class="tap" aria-label="Shuffle" aria-pressed=${String(!!a.shuffle)} @click=${() => this._svc("shuffle_set", { shuffle: !a.shuffle })}>${F("shuffle", 22)}</button>
        <button class="tap" aria-label="Previous" @click=${() => this._svc("media_previous_track")}>${v("prev", 28)}</button>
        <button class="tap go" aria-label=${i ? "Pause" : "Play"} @click=${() => this._svc("media_play_pause")}>${v(i ? "pause" : "play", 30)}</button>
        <button class="tap" aria-label="Next" @click=${() => this._svc("media_next_track")}>${v("next", 28)}</button>
        <button class="tap" aria-label="Save this song to favourites" @click=${() => this._heart()}>♥</button>
      </div>
      <div class="upnext">${n?.next ? l`<span style="opacity:.7">Up next</span><b style="overflow:hidden;text-overflow:ellipsis">${n.next.name}</b>${n.items > 2 ? l`<span style="opacity:.7">+${n.items - 2} more</span>` : u}` : this._juke.on ? l`<span>🎶 Jukebox is on · ${this._juke.picks.filter((f) => !f.done).length} waiting</span>` : u}</div>
      <div class="mini">
        <button class="tog tap" aria-pressed=${String(this._keep)} title="When the music runs out, carry on with similar songs" @click=${() => {
      this._keep = !this._keep, la("fh-keep", this._keep), this._say(this._keep ? "When the music runs out, I’ll keep it going" : "The music will stop at the end");
    }}>∞ Keep going</button>
        <button class="tog tap" @click=${() => this._sleep()}>🌙 Sleep ${this.sleepMinutes}</button>
      </div>
      ${s !== null ? l`<div style="display:flex;align-items:center;gap:12px"><span style="opacity:.7">${F("music", 18)}</span>
        <input type="range" min="0" max="100" .value=${String(s)} aria-label="Volume in ${this._name(t)}" @change=${(f) => this._svc("volume_set", { volume_level: Number(f.target.value) / 100 })}>
        <span style="width:30px;text-align:right;font-size:13px;font-weight:var(--w-bold, 700);opacity:.8">${s}</span></div>` : u}
    </section>`;
  }
  /** A wide screen showing one of the full room views: the title row carries everything, so the view gets the height. */
  get _one() {
    return this._full && D() !== "phone" && D() !== "tall";
  }
  _oneRow() {
    const t = this._cur, a = this._mix(t), i = this._mode, o = Jt.find((s) => s.id === i);
    return l`
        <button class="viewbtn tap" aria-haspopup="dialog" aria-label="Change how the rooms are shown. Now: ${o.name}" @click=${() => {
      this._viewAsk = !0;
    }}>${F(o.icon, 22)}${o.name}</button>
        ${i === "house" ? u : l`<button class="pill tap primary" data-drop="all" ?data-hot=${this._carry?.over === "all"} @click=${() => this._wholeHouse(() => this._everywhere(!0))}>Everywhere</button>`}
        ${a.length ? l`<button class="pill tap" @click=${() => this._everywhere(!1)}>Just ${this._name(t)}</button>` : u}
        ${this._offline.length ? l`<button class="offnote tap" data-offnote @click=${() => this._say(`Offline: ${this._offline.map((s) => this._name(s)).join(", ")}`)}>${F("plug", 18)}${this._offline.length === this._list.length ? "Every speaker is offline" : `${this._offline.length} ${this._offline.length === 1 ? "speaker" : "speakers"} offline`}</button>` : u}
        <button class="round tap helpb" aria-label="How this view works" aria-pressed=${String(this._coach)} @click=${() => this._showCoach(!0)}>?</button>`;
  }
  _oneNow() {
    const t = this._cur;
    return this._mode !== "house" ? l`<button class="round tap peekb" aria-label="Show the full player" @click=${() => {
      this._peek = !0;
    }}>${F("music", 22)}</button>` : l`
        ${t ? l`<div class="nowbar"><button class="nthumb tap" aria-pressed=${String(this._peek)} aria-label=${this._peek ? "Hide the player" : "Show the full player"} style=${t.attributes.entity_picture ? `--art:url(${t.attributes.entity_picture})` : ""} @click=${() => {
      this._peek = !this._peek;
    }}></button>
          <span class="ntx"><b>${t.attributes.media_title ?? "Nothing playing"}</b><span>${this._name(t)}</span></span>
          <button class="round tap" aria-label="Previous" @click=${() => this._svc("media_previous_track")}>${v("prev", 24)}</button>
          <button class="round tap ngo primary" aria-label=${t.state === "playing" ? "Pause" : "Play"} @click=${() => this._svc("media_play_pause")}>${v(t.state === "playing" ? "pause" : "play", 26)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._svc("media_next_track")}>${v("next", 24)}</button></div>` : u}
`;
  }
  _showCoach(t = !1) {
    clearTimeout(this._coachT), this._coach = t ? !this._coach : !0, this._coach && (this._coachT = window.setTimeout(() => {
      this._coach = !1;
    }, 6e3));
  }
  _rooms() {
    const t = this._cur, a = this._mix(t), i = ea(this.hass), o = Object.keys(this.hass.states).find((p) => p.startsWith("media_player.") && this.hass.entities?.[p]?.platform === "sonos"), s = o && this.hass.states[o].attributes.source === "TV" ? o : "", r = (p, d) => {
      const h = s && Fe(this.hass, s, p);
      if (!h) return u;
      const m = this.hass.states[h].state === "on";
      return l`<button class="pill tap" aria-pressed=${String(m)} style=${m ? "background:var(--primary);color:var(--on-primary)" : ""} @click=${() => this.hass.callService("switch", m ? "turn_off" : "turn_on", {}, { entity_id: h })}>${d} ${m ? "on" : "off"}</button>`;
    }, n = this._mode, c = Jt.find((p) => p.id === n);
    return l`${this._viewAsk ? ir(n, (p) => {
      this._view = p, la("fh-music-view", p), this._viewAsk = !1;
    }, () => {
      this._viewAsk = !1;
    }) : u}${this._one ? l`<span class="coach" ?data-on=${this._coach}>${ye(n, et(), this.theme)}</span>` : l`<div class="acts">
        <button class="viewbtn tap" aria-haspopup="dialog" aria-label="Change how the rooms are shown. Now: ${c.name}" @click=${() => {
      this._viewAsk = !0;
    }}>${F(c.icon, 22)}${c.name}</button>
        ${n === "house" ? u : l`<button class="pill tap primary" data-drop="all" ?data-hot=${this._carry?.over === "all"} @click=${() => this._wholeHouse(() => this._everywhere(!0))}>Everywhere</button>`}
        ${a.length ? l`<button class="pill tap" @click=${() => this._everywhere(!1)}>Just ${this._name(t)}</button>` : u}
        ${this._offline.length ? l`<button class="offnote tap" data-offnote @click=${() => this._say(`Offline: ${this._offline.map((p) => this._name(p)).join(", ")}`)}>${F("plug", 18)}${this._offline.length === this._list.length ? "Every speaker is offline" : `${this._offline.length} ${this._offline.length === 1 ? "speaker" : "speakers"} offline`}</button>` : u}
        <span class="soft hint">${ye(n, et(), this.theme)}</span>
        ${n !== "list" && t ? l`<div class="nowbar"><button class="nthumb tap" aria-pressed=${String(this._peek)} aria-label=${this._peek ? "Hide the player" : "Show the full player"} style=${t.attributes.entity_picture ? `--art:url(${t.attributes.entity_picture})` : ""} @click=${() => {
      this._peek = !this._peek;
    }}></button>
          <span class="ntx"><b>${t.attributes.media_title ?? "Nothing playing"}</b><span>${this._name(t)}</span></span>
          <button class="round tap" aria-label="Previous" @click=${() => this._svc("media_previous_track")}>${v("prev", 24)}</button>
          <button class="round tap ngo primary" aria-label=${t.state === "playing" ? "Pause" : "Play"} @click=${() => this._svc("media_play_pause")}>${v(t.state === "playing" ? "pause" : "play", 26)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._svc("media_next_track")}>${v("next", 24)}</button></div>` : u}
        ${s ? l`<span class="soft">TV sound</span>${r(/^switch\..*night_sound$/, "Night")}${r(/^switch\..*speech_enhancement$/, "Clear speech")}` : u}
      </div>`}
      ${n === "house" ? this._house() : n === "dial" ? Is(this._vctx()) : n === "desk" ? Os(this._vctx()) : n === "cables" ? Ds(this._vctx()) : n === "scene" ? ar(this._vctx()) : l`<div class="grid scrolly" data-fits @scroll=${Z}>${this._list.map((p) => {
      const d = p.attributes, h = p.state === "playing", m = p.entity_id === t?.entity_id, f = a.includes(p.entity_id), x = typeof d.volume_level == "number" ? Math.round(d.volume_level * 100) : null;
      return l`<div class="spk ${m ? "focus" : f ? "inmix" : ""}" ?data-offline=${this._off(p)}>
        <div class="top"><button class="rsel tap" aria-pressed=${String(m)} @click=${() => {
        this._focus = p.entity_id;
      }}>
          <span class="thumb ${h ? "eq" : ""}" style=${d.entity_picture ? `--art:url(${d.entity_picture})` : ""}>${h ? l`<i></i><i></i><i></i>` : F("music", 20)}</span>
          <span style="display:flex;flex-direction:column;min-width:0;gap:2px"><span style="font-size:15px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d.friendly_name}</span>
            <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f ? `With ${this._name(t)}` : h ? d.media_title ?? "Playing" : this._off(p) ? "Offline" : p.state[0].toUpperCase() + p.state.slice(1)}</span></span></button>
          ${m ? u : l`<button class="join tap" aria-pressed=${String(f)} aria-label="${f ? "Remove" : "Add"} ${d.friendly_name} ${f ? "from" : "to"} the music" @click=${() => this._join(p.entity_id)}>${f ? "✓" : "＋"}</button>`}</div>
        ${x !== null ? l`<input type="range" min="0" max="100" .value=${String(x)} aria-label="Volume in ${d.friendly_name}" @change=${(K) => this._svc("volume_set", { volume_level: Number(K.target.value) / 100 }, p.entity_id)}>` : u}
        ${!m && !f && i && t?.state === "playing" ? l`<button class="pill tap" style="height:36px;font-size:13px;align-self:flex-start" @click=${() => this._move(p)}>Move the music here</button>` : u}
      </div>`;
    })}</div>`}`;
  }
  _searchBar() {
    const t = this._hits;
    return l`<div class="sbar"><input class="field" inputmode=${D() === "phone" ? "text" : "none"} aria-label="Search for music" placeholder="A song, an album, a story…" .value=${this._text}
          @focus=${() => {
      this._keys = !0;
    }} @input=${(a) => {
      this._text = a.target.value;
    }} @keydown=${(a) => {
      a.key === "Enter" && this._search();
    }}>
        <button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" ?disabled=${this._busy} @click=${() => this._search()}>${this._busy ? "Looking…" : "Search"}</button>
        ${t ? l`<button class="round tap" style="width:52px;height:52px;font-size:17px;font-weight:var(--w-heavy, 800)" aria-label=${this._keys ? "Hide the keyboard" : "Show the keyboard"} aria-pressed=${String(this._keys)} @click=${() => {
      this._keys = !this._keys;
    }}>Aa</button>` : u}
        <button class="round tap" style="width:52px;height:52px" aria-label="Close search" @click=${() => {
      this._tab = this._adding ? "juke" : this._prev, this._adding = !1;
    }}>${F("close", 22)}</button></div>`;
  }
  _searchTab() {
    const t = this._hits, a = t?.find((i) => i.uri === this._sel);
    return l`${this._adding ? l`<div class="banner">🎶 Adding to the jukebox for ${this._juke.who || "everyone"}<span style="flex:1"></span><button class="pill tap" style="height:36px" @click=${() => {
      this._adding = !1, this._tab = "juke";
    }}>Back</button></div>` : u}
      ${this._keys && !t ? l`<div class="empty" style="flex:1"><span style="color:var(--ink2)">${F("search", 44)}</span><span>Songs, albums, playlists, stories and radio, from every service at once.</span></div>` : u}
      ${this._keys ? l`<div style="margin:auto 0">${Ka((i) => {
      [this._text, this._caps] = ga(this._text, i, this._caps);
    }, this._caps, () => {
      this._caps = !this._caps;
    }, !0)}</div>` : u}
      ${t && !this._keys ? t.length ? l`<div class="hits scrolly" data-fits @scroll=${Z}>${t.map((i) => l`<button class="hit tap" aria-pressed=${String(i.uri === this._sel)} @click=${() => {
      this._sel = i.uri;
    }}>
          <span class="art" style=${i.img ? `--art:url(${i.img})` : ""}>${i.img ? "" : F("music", 18)}</span>
          <span class="tx"><b>${i.name}</b><span>${i.sub ?? ""}</span></span><span class="kind">${nr[i.type] ?? i.type}</span></button>`)}</div>
        <div class="acts">${a ? this._adding ? l`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._addPick(a)}>＋ Add to the jukebox</button>` : l`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._start(a)}>▶ Play in ${this._name(this._cur)}</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(a, "next")}>Play next</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(a, "add")}>＋ Queue</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(a, "play", !0)}>∞ Radio from this</button>
            <button class="pill tap" style="height:48px" @click=${() => this._guard("Pin to a shelf?", () => {
      this._pinTo = a;
    })}>📌 Pin</button>` : l`<span class="soft">Tap a result to play it, queue it or pin it to a shelf.</span>`}</div>` : l`<div class="empty"><span>Nothing found for “${this._text}”. Try fewer words.</span></div>` : u}`;
  }
  _pinSheet() {
    const t = this._pinTo;
    return l`<div class="scrim" style="border-radius:28px" @click=${(a) => {
      a.target === a.currentTarget && (this._pinTo = null);
    }}>
      <section class="glass sheet" role="dialog" aria-modal="true" aria-label="Pin to a shelf" style="width:min(560px,92%);gap:12px">
        <h2 class="t-head">Pin “${t.name}”</h2><span class="soft">Whose shelf? Calm picks are the only ones offered at wind-down.</span>
        ${this._shelfNames.map((a) => l`<div class="setrow"><b style="font-size:17px">${a === "Family" ? "Family shelf" : `${a}’s shelf`}</b><span style="display:flex;gap:8px">
          <button class="pill tap primary" @click=${() => this._pin(a, !1)}>Pin</button><button class="pill tap" @click=${() => this._pin(a, !0)}>🌙 Pin as calm</button></span></div>`)}
        <span class="soft" style="margin-top:6px">Or put it on a moment pad on the Desk. It plays where that pad plays.</span>
        <div class="acts">${this._pads.map((a) => {
      const i = this._padSet[a.name];
      return l`<button class="pill tap" style="height:44px" aria-label="Put it on the ${a.name} pad${i ? `, which now plays ${i.title}` : ""}" @click=${() => {
        this._padPut(a.name, t), this._pinTo = null;
      }}>${a.name}</button>
          ${i ? l`<button class="pill tap" style="height:44px" aria-label="Put the ${a.name} pad back to its own music instead of ${i.title}" @click=${() => this._padPut(a.name, null)}>↺</button>` : u}`;
    })}</div>
        <button class="pill tap" style="align-self:flex-end" @click=${() => {
      this._pinTo = null;
    }}>Cancel</button></section></div>`;
  }
  _shelves() {
    const t = this.kids.find((n) => n.name === this._shelf), a = !!t && jt(t.bedtime), i = this._items[this._shelf] ?? [], o = a ? i.filter((n) => n.calm) : i, s = this._shelfRoom(t), r = (n) => T(this.kids.find((c) => c.name === n)?.colour ?? "family");
    return l`<div class="shelfrow"><div class="crate">
      <div class="chiprow dividers">${this._shelfNames.map((n) => l`<button class="pchip tap" style="--c:${r(n)}" aria-pressed=${String(this._shelf === n)} @click=${() => {
      this._shelf = n, this._edit = !1, this._shelfTo = "";
    }}>
        <span class="avatar">${n[0]}</span>${n}</button>`)}
</div>
      ${a ? l`<div class="banner">🌙 Wind-down: calm picks only, fading out after ${this.sleepMinutes} minutes.</div>` : u}
      ${o.length ? l`<div class="covers scrolly" data-fits @scroll=${Z}>${o.map((n) => l`<button class="st tap" ?data-lifted=${this._carry?.item === n} @pointerdown=${(c) => {
      this._edit || this._carryDown(c, { item: n });
    }} @click=${() => {
      !this._edit && Date.now() - this._carried > 400 && this._shelfPlay(n);
    }}>
          <i class="disc"></i><span class="img" style=${n.img ? `--art:url(${n.img})` : ""}>${n.img ? "" : n.name[0]}</span><span class="lbl">${n.calm ? "🌙 " : ""}${n.name}</span>
          ${this._edit ? l`<span class="x tap" role="button" aria-label="Remove ${n.name}" @click=${(c) => {
      c.stopPropagation(), this._unpin(n);
    }}>✕</span>` : u}</button>`)}</div>` : l`<div class="empty"><span style="font-size:40px">📚</span><h2 class="t-sub">${a ? "Nothing calm pinned yet" : "Nothing pinned yet"}</h2>
          <span>${this.hass.states[Mt(this._shelf)] ? "Search for an album, a playlist or a story, then tap Pin." : `This shelf needs the to-do list ${Mt(this._shelf)} in Home Assistant.`}</span></div>`}</div>
      <div class="dropside"><span class="soft">Drag a record to a room, or tap it to play in <b>${this._name(s)}</b>.</span>
        ${this._mini((n) => n === s?.entity_id, (n) => {
      this._shelfTo = n;
    })}
        <span style="flex:1"></span><span style="align-self:flex-end">
        ${i.length ? l`<button class="pill tap" @click=${() => {
      this._edit ? this._edit = !1 : this._guard("Change this shelf?", () => {
        this._edit = !0;
      });
    }}>${this._edit ? "Done" : "Edit"}</button>` : u}</span></div></div>`;
  }
  _jukeTab() {
    const t = this._juke, a = Qt(this._everyone.map((m) => m.name)), i = (m) => T(this._everyone.find((f) => f.name === m)?.colour ?? "family"), o = this._nextPick(), s = (m) => t.picks.filter((f) => f.done && f.who === m).length;
    this._shelfAsked || (this._shelfAsked = !0, this._loadShelves());
    const r = new Set(t.picks.filter((m) => !m.done).map((m) => m.who)), n = [...this._everyone].sort((m, f) => Number(r.has(m.name)) - Number(r.has(f.name)) || s(m.name) - s(f.name))[0]?.name ?? "", c = () => {
      this._jpick = !1, this._adding = !0, this._prev = this._prev === "rooms" ? "rooms" : "juke", this._tab = "search", this._keys = !0, this._hits = null, this._text = "", this._caps = !0;
    };
    if (this._jpick && t.who) {
      const m = /* @__PURE__ */ new Set(), f = [...this._items[t.who] ?? [], ...this._items.Family ?? []].filter((x) => !m.has(x.uri) && !!m.add(x.uri));
      return l`<div class="banner">🎶 ${t.who}: tap a picture to add it<span style="flex:1"></span><button class="pill tap" style="height:44px" @click=${c}>${F("search", 18)} Search instead</button><button class="pill tap" style="height:44px" @click=${() => {
        this._jpick = !1, this._prev === "rooms" && (this._tab = "rooms");
      }}>Back</button></div>
        ${f.length ? l`<div class="covers scrolly jcovers" data-fits @scroll=${Z}>${f.map((x) => l`<button class="st tap" aria-label="Add ${x.name}" @click=${() => this._addPick(x)}>
          <i class="disc"></i><span class="img" style=${x.img ? `--art:url(${x.img})` : ""}>${x.img ? "" : x.name[0]}</span><span class="lbl">${x.name}</span></button>`)}</div>` : l`<div class="empty"><span style="font-size:40px">📚</span><h2 class="t-sub">Nothing pinned to choose from yet</h2><span>A grown-up can pin music from Search. Until then, use Search instead.</span></div>`}`;
    }
    const p = t.picks.filter((m) => !m.done).sort((m, f) => +(f === o) - +(m === o) || m.t - f.t), d = t.picks.filter((m) => m.done).sort((m, f) => f.t - m.t), h = (m) => l`<div class="pickrow ${m.done ? "played" : ""}" ?data-next=${m === o}>
      <span class="pcover"><i class="disc"></i><span class="art" style=${m.img ? `--art:url(${m.img})` : ""}>${m.img ? "" : F("music", 26)}</span>
        <span class="init" style="--c:${i(m.who)}" role="img" aria-label=${m.who}>${a[m.who] ?? m.who[0]}</span></span>
      <span class="nm">${m.name}${m.sub ? l` <span class="muted" style="font-weight:var(--w-semi, 600)">· ${m.sub}</span>` : u}</span>
      <span class="when">${m.done ? this._q?.next?.name === m.name ? "Up next" : "Played" : m === o ? "Next" : "Waiting"}</span></div>`;
    return l`${this._dj ? l`<div class="banner">🎧 ${this._dj} is the DJ tonight: ${this._dj}’s picks play first.</div>` : u}
      <div class="coins" role="group" aria-label="Who’s choosing?"><span class="soft">Who’s choosing?</span>${this._everyone.map((m) => l`<button class="coin tap" style="--c:${T(m.colour)}" aria-pressed=${String(t.who === m.name)} ?data-next=${m.name === n} aria-label="${m.name}${m.name === n ? ", chooses next" : ""}${r.has(m.name) ? ", has a song waiting" : ""}" @click=${() => {
      this._saveJuke({ who: m.name }), this._prev = "juke", this._jpick = !0;
    }}>
        <span class="face">${a[m.name] ?? m.name[0]}${r.has(m.name) ? l`<i class="has">✓</i>` : u}</span><span class="cname">${m.name}</span><span class="cnext">${m.name === n ? "Next" : ""}</span></button>`)}</div>
      <div class="acts"><button class="pill tap primary" style="height:48px;padding:0 20px" ?disabled=${!t.who} @click=${() => {
      this._prev = "juke", this._jpick = !0;
    }}>＋ ${t.who ? `${t.who} adds a song` : "Pick who’s choosing"}</button>
        <button class="jsw tap" role="switch" aria-checked=${String(t.on)} @click=${() => {
      this._saveJuke({ on: !t.on }), t.on || this._feed();
    }}><i></i>${t.on ? "Jukebox is on" : "Jukebox is off"}</button>
        <span class="soft" style="flex:1">Everyone gets a turn.</span>
        ${t.picks.length ? l`<button class="pill tap" @click=${() => {
      const m = t.picks;
      this._saveJuke({ picks: [] }), this._say("Jukebox cleared", () => this._saveJuke({ picks: m }));
    }}>Clear</button>` : u}</div>
      ${t.picks.length ? l`<div class="picks scrolly" data-fits @scroll=${Z}>${p.map(h)}${d.map(h)}</div>` : l`<div class="empty"><span style="color:var(--ink2)">${F("jukebox", 48)}</span><h2 class="t-sub">The jukebox is empty</h2><span>Pick who’s choosing, then add a song.</span></div>`}`;
  }
  _radio() {
    const t = this._cur, a = t && t.state === "playing" ? ra[t.entity_id] : "";
    return l`<span class="muted" style="font-size:13px">Tap a station to play it on <b>${this._cur?.attributes.friendly_name ?? "a speaker"}</b>. Pick a different room in the Rooms tab.</span>
      <div class="grid presets" style="grid-template-columns:repeat(auto-fill,minmax(132px,1fr))">${this._stations.map((i) => {
      const o = this._thumbs[i.name], s = a === i.name;
      return l`<button class="st tap ${s ? "on" : ""}" @click=${() => this._play(i)}>
          <span class="img" style=${o ? `--art:url(${o})` : `background:linear-gradient(135deg, var(--p-${i.name.length % 5 + 1}), var(--primary));color:#fff`}>${o ? "" : i.name.split(" ").map((r) => r[0]).join("").slice(0, 3)}</span>${i.name}</button>`;
    })}</div>`;
  }
  _callTab() {
    const t = this._list.map((s) => s.entity_id), a = t.length > 0 && t.every((s) => this._callTo.includes(s)), i = (s) => {
      this._callTo = this._callTo.includes(s) ? this._callTo.filter((r) => r !== s) : [...this._callTo, s];
    }, o = this._callTo.map((s) => this._name(this.hass.states[s]));
    return l`${this._ckeys ? l`<div style="display:flex;align-items:center;gap:12px"><span class="soft" style="flex:1">Calling ${o.length ? o.join(", ") : "no rooms yet"}</span><button class="pill tap" @click=${() => {
      this._ckeys = !1;
    }}>Rooms and messages</button></div>` : l`<div class="callrow">
        <div class="callside"><span class="soft">Tap the rooms to call</span>
          ${this._mini((s) => this._callTo.includes(s), i, !0)}
          <button class="pill tap" style="align-self:flex-start" aria-pressed=${String(a)} @click=${() => {
      this._callTo = a ? [] : t;
    }}>Everyone</button></div>
        <div class="bubbles">${Se.map((s) => l`<button class="bubble tap" aria-pressed=${String(this._callMsg === s)} @click=${() => {
      this._callMsg = s;
    }}>${s}</button>`)}</div></div>`}
      <div style="display:flex;gap:10px"><input class="field" inputmode=${D() === "phone" ? "text" : "none"} aria-label="Message to say" placeholder="Or type what to say…" .value=${this._callMsg} @focus=${() => {
      this._ckeys = !0;
    }} @input=${(s) => {
      this._callMsg = s.target.value;
    }}>
        <button class="pill tap primary sayit" @click=${() => this._call()}>${F("megaphone", 22)} Say it</button></div>
      ${this._ckeys ? l`<div style="margin:auto 0 0">${Ka((s) => {
      [this._callMsg, this._caps] = ga(this._callMsg, s, this._caps);
    }, this._caps, () => {
      this._caps = !this._caps;
    }, !0)}</div>` : l`<span class="soft">It is spoken over the music in that room, then the music carries on.</span>`}`;
  }
};
ya.styles = [_, wi, er, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .stage { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; color: #fff; background: #111; }
    .stage .bg { position: absolute; inset: -40px; background: var(--art) center / cover; filter: blur(40px) saturate(160%) brightness(.65); transform: scale(1.2); transition: background .6s; }
    .stage > *:not(.bg) { position: relative; }
    .deck { flex: 1 1 0; min-height: 120px; display: flex; align-items: center; justify-content: center; }
    .cover { height: 100%; max-height: 250px; aspect-ratio: 1; border-radius: 22px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 20px 50px -12px rgba(0,0,0,.6); transition: transform .5s cubic-bezier(.2,1.2,.3,1); }
    .cover.paused { transform: scale(.9); }
    .bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,.25); overflow: hidden; }
    .bar > i { display: block; height: 100%; background: #fff; border-radius: 2px; transition: width 1s linear; }
    .ctl { display: flex; align-items: center; justify-content: space-between; }
    .ctl button { color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .ctl button[aria-pressed='true'] { background: rgba(255,255,255,.22); }
    .ctl .go { width: 66px; height: 66px; background: #fff; color: #111; }
    .upnext { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 13px; font-weight: var(--w-semi, 600); opacity: .85; white-space: nowrap; overflow: hidden; }
    .mini { display: flex; align-items: center; gap: 10px; }
    .mini .tog { height: 44px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .mini .tog[aria-pressed='true'] { background: #fff; color: #111; }
    input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; box-sizing: content-box; padding: 12px 0; background-clip: content-box; border-radius: 3px; background-color: var(--rail, rgba(255,255,255,.3)); outline: none; margin: 0; }
    input[type=range]:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--primary), 0 2px 6px rgba(0,0,0,.3); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: var(--knob, #fff); box-shadow: 0 2px 6px rgba(0,0,0,.3); }
    .panel { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .mhead { display: flex; align-items: center; gap: 16px; }
    /* one row on a wide screen: the view gets the height */
    .panel[data-one] { padding: 12px 14px; gap: 10px; }
    .mhead[data-one] { gap: 8px; } .mhead[data-one] h1 { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .mhead[data-one] .finder { height: 48px; padding: 0 16px; flex: 1 1 120px; } .mhead[data-one] .nowbar { max-width: 32%; flex: 0 1 auto; }
    .mhead[data-one] .pill, .mhead[data-one] .viewbtn, .mhead[data-one] .offnote { flex-shrink: 0; }
    .helpb, .peekb { width: 48px; height: 48px; flex-shrink: 0; font-size: 20px; font-weight: var(--w-heavy, 800); }
    .helpb { color: var(--ink); }
    .body { position: relative; }
    .coach { position: absolute; left: 0; right: 0; bottom: 10px; margin: 0 auto; width: fit-content; max-width: 86%; z-index: 6; padding: 10px 18px; border-radius: 999px; background: rgba(15,15,20,.86); color: #fff; font-size: 16px; font-weight: var(--w-semi, 600); text-align: center; pointer-events: none; opacity: 0; transition: opacity .4s; }
    .coach[data-on] { opacity: 1; }
    :host([data-full]) .stage { display: none; }
    .tabs.inline { flex: 0 0 auto; } .tabs.inline button { flex: 0 0 54px; height: 54px; padding: 0; } .tabs.inline button span { display: none; }
    .nowbar { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 46%; padding: 4px 6px 4px 4px; border-radius: 999px; background: var(--chip); }
    .nthumb { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 0 0 2px var(--chip-strong); }
    .nthumb[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); }
    .ntx { min-width: 0; display: flex; flex-direction: column; line-height: 1.15; padding-right: 4px; } .ntx b, .ntx span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ntx b { font-size: 14px; font-weight: var(--w-bold, 700); } .ntx span { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .nowbar .round { width: 44px; height: 44px; flex-shrink: 0; } .nowbar .ngo { background: var(--primary); color: var(--on-primary); }
    .acts .hint { flex: 1; min-width: 0; }
    .acts [data-offnote] ~ .hint { visibility: hidden; height: 0; }
    /* a home speaker that cannot be reached keeps its place, greyed, and the page says how many */
    .offnote { height: 44px; padding: 0 14px 0 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: var(--w-bold, 700); white-space: nowrap; background: color-mix(in srgb, var(--accent) 26%, var(--chip-strong)); box-shadow: inset 0 0 0 2px var(--accent); }
    /* offline: the picture fades, the words stay readable */
    [data-offline] { filter: grayscale(1); }
    [data-offline] :is(svg, .puck, .thumb, .cone, .well, .dtrack, .dfill, .dknob, input) { opacity: .45; }
    .mzone[data-offline], .mz[data-offline] { background: repeating-linear-gradient(135deg, transparent 0 10px, var(--track) 10px 12px); }
    :host([data-phone]) .nowbar { max-width: 100%; flex: 1 1 100%; order: 8; } :host([data-phone]) .tabs.inline { flex: 1 1 100%; }
    .panel { position: relative; }
    .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 12px; animation: fadeIn .28s ease-out; }
    /* search is a field, not a tab: it is always in the same place and looks like somewhere to type */
    .finder { flex: 1; min-width: 0; height: 54px; padding: 0 22px; border-radius: 27px; display: flex; align-items: center; gap: 12px; text-align: left; font-size: 17px; font-weight: var(--w-semi, 600); color: var(--ink2);
      background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent), 0 6px 14px -8px rgba(0,0,0,.35); transition: box-shadow .2s; }
    .finder:active { box-shadow: inset 0 0 0 3px var(--primary); }
    .finder span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sbar { flex: 1; min-width: 0; display: flex; gap: 10px; animation: fadeIn .2s ease-out; }
    .sbar .field { border-radius: 27px; padding: 0 22px; }
    /* calling: speech bubbles and a house to tap */
    .callrow { flex: 1; min-height: 0; display: flex; gap: 16px; }
    .callside, .dropside { flex: 0 0 50%; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .bubbles { flex: 1; min-width: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 12px; align-content: start; }
    .bubble { min-height: 62px; padding: 8px 16px; border-radius: 22px 22px 22px 6px; background: var(--chip); font-size: 16px; font-weight: var(--w-semi, 600); text-align: left; line-height: 1.2; transition: transform .2s cubic-bezier(.2,1.4,.4,1), background .2s; }
    .bubble:nth-child(even) { border-radius: 22px 22px 6px 22px; }
    .bubble[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); transform: scale(1.03); }
    .sayit { height: 52px; padding: 0 24px; font-size: 16px; display: inline-flex; align-items: center; gap: 8px; }
    .map.snug { flex: none; }
    .map.snug .floor { flex: none; height: 100px; min-height: 0; }
    .map.snug .mstairs { flex-basis: 36px; }
    .mz { flex: 1 1 0; min-width: 0; padding: 4px 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; font-size: 13px; position: relative; transition: background .2s; }
    .mz + .mz { border-left: 2px dashed var(--track); }
    .mz b { max-width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-align: center; line-height: 1.15; font-size: 12.5px; font-weight: var(--w-bold, 700); }
    .mz[data-live] { background: linear-gradient(to top, color-mix(in srgb, var(--primary) 30%, transparent) 28%, transparent 28%); }
    .mz[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .mz[data-hot] { background: var(--chip-strong); box-shadow: inset 0 0 0 4px var(--primary); color: var(--ink); }
    .shout { display: flex; animation: shout .7s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes shout { from { transform: rotate(-8deg) scale(.95); } to { transform: rotate(6deg) scale(1.1); } }
    /* shelves: a crate of records next to the house */
    .shelfrow { flex: 1; min-height: 0; display: flex; gap: 16px; }
    .crate { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .dividers .pchip { border-radius: 16px 16px 6px 6px; box-shadow: inset 0 -4px 0 var(--c); margin-left: 0; opacity: 1; }
    .dividers .pchip[aria-pressed='true'] { background: var(--c); color: var(--on-person, #fff); box-shadow: none; transform: translateY(-3px); }
    .crate .st { touch-action: pan-y; background: transparent; padding: 0 14px 0 0; }
    .crate .st .img { position: relative; box-shadow: 0 8px 16px -8px rgba(0,0,0,.5); transition: transform .25s cubic-bezier(.2,1.2,.3,1); }
    .disc { position: absolute; top: 3%; right: 14px; width: calc(100% - 14px); aspect-ratio: 1; border-radius: 50%; transform: translateX(11%) scale(.94); transition: transform .3s cubic-bezier(.2,1.2,.3,1);
      background: radial-gradient(circle, #f4efe3 0 3%, var(--accent) 3.5% 16%, #17140f 16.5% 100%); }
    .crate .st:active .disc, .crate .st[data-lifted] .disc { transform: translateX(26%) scale(.94) rotate(40deg); }
    .crate .st[data-lifted] .img { transform: scale(.94); }
    .presets .st { background: transparent; align-items: center; text-align: center; }
    .presets .st .img { width: 100%; border-radius: 50%; box-shadow: 0 0 0 4px var(--chip-strong), 0 8px 16px -8px rgba(0,0,0,.5); }
    .presets .st.on { box-shadow: none; }
    .presets .st.on .img { box-shadow: 0 0 0 5px var(--ok), 0 8px 16px -8px rgba(0,0,0,.5); }
    :host([data-phone]) .callrow, :host([data-phone]) .shelfrow { flex-direction: column; flex: none; }
    :host([data-phone]) .callside, :host([data-phone]) .dropside { flex: none; }
    :host([data-phone]) .bubbles { grid-template-columns: 1fr; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .mhead { flex-wrap: wrap; }
    :host([data-phone]) .tabs { flex-wrap: nowrap; overflow-x: auto; max-width: 100%; scrollbar-width: none; }
    :host([data-phone]) .tabs button { flex: 1 1 auto; padding: 0 12px; }
    :host([data-phone]) .tabs button:not([aria-selected='true']) span { display: none; }
    :host([data-phone]) .body { flex: none; }
    :host([data-phone]) .mhead .finder, :host([data-phone]) .sbar { flex: 1 1 100%; }
    :host([data-phone]) .acts .soft { flex: 1 1 100%; order: 9; }
    :host([data-shape='tall']) .acts .hint { flex: 1 1 100%; order: 9; }
    :host([data-phone]) .stage { flex-direction: column; flex-wrap: nowrap; align-items: stretch; border-radius: 22px; }
    :host([data-phone]) .deck { flex: 0 0 auto; height: 210px; }
    :host([data-phone]) .panel { padding: 14px; border-radius: 22px; min-height: 320px; }
    :host([data-phone]) .grid, :host([data-phone]) .hits, :host([data-phone]) .covers, :host([data-phone]) .picks { overflow: visible; flex: none; }
    :host([data-phone]) .hits { grid-template-columns: 1fr; }
    :host([data-phone]) .msgs { grid-template-columns: 1fr 1fr; }
    /* the places on the page: a picture each, and the one you are in stands up */
    .tabs { display: flex; gap: 8px; }
    .tabs button { flex: 1 1 0; min-width: 0; height: 56px; padding: 0 10px; border-radius: 18px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); display: flex; align-items: center; justify-content: center; gap: 8px; white-space: nowrap;
      transition: transform .22s cubic-bezier(.2,1.4,.4,1), background .2s, color .2s; }
    .tabs button[aria-selected='true'] { background: var(--primary); color: var(--on-primary); transform: translateY(-3px); box-shadow: 0 8px 14px -8px color-mix(in srgb, var(--primary) 80%, transparent); }
    .tabs button[aria-selected='true'] .i { animation: nod .5s ease-out; }
    .acts .seg button { height: 44px; color: var(--ink); }
    .acts .seg button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    @keyframes nod { 30% { transform: rotate(-14deg) scale(1.2); } 65% { transform: rotate(8deg); } }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; align-content: start; }
    .grid[data-fit] { gap: 6px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .spk { border-radius: 20px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; --rail: var(--track); --knob: var(--primary); }
    .spk.focus { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .spk.inmix { box-shadow: 0 0 0 3px var(--ok); }
    .spk .top { display: flex; align-items: center; gap: 10px; }
    .spk .rsel { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; text-align: left; min-height: 44px; }
    .grid[data-fit] .spk input { margin: 6px 0; }
    .thumb { width: 44px; height: 44px; border-radius: 12px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 7px; }
    .eq i { width: 4px; border-radius: 2px; background: #fff; animation: eq .9s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); box-shadow: 0 0 4px rgba(0,0,0,.4); }
    .eq i:nth-child(2) { animation-delay: .3s; } .eq i:nth-child(3) { animation-delay: .6s; }
    @keyframes eq { from { height: 4px; } to { height: 20px; } }
    .join { width: 44px; height: 44px; border-radius: 50%; background: var(--track); font-size: 20px; font-weight: var(--w-heavy, 800); flex-shrink: 0; }
    .join[aria-pressed='true'] { background: var(--ok); color: var(--on-ok, #fff); }
    .field { flex: 1; min-width: 0; height: 52px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 16px; font: inherit; font-size: 20px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .hits { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; align-content: start; }
    .hits[data-fit] { gap: 3px 10px; }
    .hit { display: flex; align-items: center; gap: 10px; padding: 6px 10px 6px 6px; min-height: 52px; border-radius: 14px; background: var(--chip); text-align: left; min-width: 0; }
    .hits[data-fit] .hit { min-height: 46px; padding: 3px 10px 3px 4px; }
    .hit[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .hit .art, .pickrow .art { width: 40px; height: 40px; border-radius: 9px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--ink2); }
    .hit .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
    .hit .tx b, .hit .tx span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hit .tx b { font-size: 15px; font-weight: var(--w-bold, 700); }
    .hit .tx span { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .kind { font-size: 11px; font-weight: var(--w-heavy, 800); padding: 3px 8px; border-radius: 999px; background: var(--track); color: var(--ink); flex-shrink: 0; }
    .acts { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .covers { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 12px; align-content: start; }
    .crate .covers { gap: 14px 6px; padding: 2px 0 0 2px; }
    .covers[data-fit] { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
    .st { border-radius: 20px; background: var(--chip); padding: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 14px; font-weight: var(--w-bold, 700); position: relative; min-width: 0; }
    .st .img { aspect-ratio: 1; border-radius: 14px; background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-3))) center / cover no-repeat, #fff; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: var(--w-heavy, 800); color: #fff; }
    .st .lbl { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
    .st.on { box-shadow: 0 0 0 3px var(--ok); }
    .st .x { position: absolute; top: 4px; right: 4px; width: 36px; height: 36px; border-radius: 50%; background: #dc2626; color: #fff; font-size: 18px; font-weight: var(--w-heavy, 800); }
    .chiprow { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pchip { height: 44px; padding: 0 14px 0 8px; border-radius: 999px; background: var(--chip); display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .pchip[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--c, var(--primary)); }
    .pchip .avatar { width: 30px; height: 30px; font-size: 13px; background: var(--c); }
    /* jukebox: a coin each, and the night's picks as a line of records */
    .coins { display: flex; align-items: flex-end; gap: 6px; flex-wrap: wrap; }
    .coins .soft { align-self: center; margin-right: 6px; }
    .coin { min-width: 66px; padding: 6px 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 3px; border-radius: 16px; }
    .coin .face { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--c); color: var(--on-person, #fff); font-size: 19px; font-weight: var(--w-heavy, 800);
      box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 3px 6px rgba(0,0,0,.22); transition: transform .22s cubic-bezier(.2,1.4,.4,1), box-shadow .2s; }
    .coin[aria-pressed='true'] .face { transform: translateY(-5px) scale(1.1); box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--c), 0 10px 14px -6px rgba(0,0,0,.4); }
    .coin .cname { font-size: 12.5px; font-weight: var(--w-bold, 700); }
    .coin[aria-pressed='true'] .cname { text-decoration: underline; text-underline-offset: 3px; }
    .coin .face { position: relative; } .coin .has { position: absolute; right: -4px; bottom: -4px; width: 22px; height: 22px; border-radius: 50%; background: var(--ok); color: var(--on-ok, #fff); font-size: 13px; font-style: normal; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--chip-strong); }
    .coin .cnext { height: 16px; font-size: 12px; font-weight: var(--w-heavy, 800); color: var(--ink); }
    .coin[data-next] .face { box-shadow: inset 0 -4px 0 rgba(0,0,0,.18), 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .jcovers { flex: 1; min-height: 0; }
    .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px; }
    .tally { display: flex; gap: 3px; height: 7px; }
    .tally i { width: 7px; height: 7px; border-radius: 50%; background: var(--c); }
    .jsw { height: 48px; padding: 0 16px 0 10px; border-radius: 999px; background: var(--chip); display: inline-flex; align-items: center; gap: 10px; font-size: 14px; font-weight: var(--w-semi, 600); }
    .jsw i { width: 50px; height: 30px; border-radius: 15px; background: var(--ink3); position: relative; transition: background .2s; flex-shrink: 0; }
    .jsw i::after { content: ''; position: absolute; left: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: transform .22s cubic-bezier(.2,1.4,.4,1); }
    .jsw[aria-checked='true'] i { background: var(--ok); }
    .jsw[aria-checked='true'] i::after { transform: translateX(20px); }
    .picks { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 14px 10px; align-content: start; padding: 6px 2px 2px; }
    .picks[data-fit] { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
    .pickrow { display: flex; flex-direction: column; gap: 6px; padding: 8px; border-radius: 18px; background: var(--chip); font-size: 14px; font-weight: var(--w-bold, 700); min-width: 0; transition: transform .25s cubic-bezier(.2,1.2,.3,1); }
    .pickrow[data-next] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); animation: nextup 1.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes nextup { to { transform: translateY(-4px); } }
    .pickrow.played .pcover { opacity: .55; }
    .pickrow.played .art { filter: grayscale(.8); }
    .pickrow.played .nm .muted { color: var(--ink2); }
    .pcover { position: relative; display: block; padding-right: 12px; }
    .pcover .disc { right: 0; width: calc(100% - 12px); top: 3%; }
    .pickrow[data-next] .disc { transform: translateX(13%) scale(.94); animation: puck 6s linear infinite; animation-iteration-count: var(--loops, infinite); }
    .pickrow .pcover .art { position: relative; width: 100%; height: auto; aspect-ratio: 1; border-radius: 12px; box-shadow: 0 8px 14px -8px rgba(0,0,0,.5); background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-5))) center / cover; color: #fff; }
    .pcover .init { position: absolute; left: -4px; top: -4px; min-width: 28px; height: 28px; border-radius: 50%; font-size: 13px; box-shadow: 0 0 0 2.5px var(--chip-strong); }
    .pickrow .nm { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; min-height: 2.4em; }
    .when { align-self: flex-start; padding: 3px 9px; border-radius: 999px; background: var(--track); color: var(--ink); font-size: 11.5px; font-weight: var(--w-heavy, 800); }
    .pickrow[data-next] .when { background: var(--primary); color: var(--on-primary); }
    .banner { padding: 10px 14px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 24%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); display: flex; align-items: center; gap: 10px; }
    .msgs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .msgs button { min-height: 52px; padding: 6px 12px; border-radius: 16px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); text-align: left; }
    .msgs button[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .soft { color: var(--ink2); font-size: 13px; font-weight: var(--w-semi, 600); }

    /* ---- the house: rooms you can see, music you can pick up ---- */
    .map { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 8px; position: relative; user-select: none; -webkit-user-select: none; }
    .floor { flex: 1 1 0; min-height: 96px; display: flex; gap: 8px; }
    .flabel { flex: 0 0 22px; writing-mode: vertical-rl; transform: rotate(180deg); text-align: center; font-size: 13px; font-weight: var(--w-bold, 700); letter-spacing: .08em; text-transform: uppercase; color: var(--ink2); }
    .mroom { flex: var(--size, 1) 1 0; min-width: 0; display: flex; border-radius: 20px; background: var(--chip); overflow: hidden; }
    .mstairs { flex: 0 0 54px; border-radius: 20px; background: repeating-linear-gradient(135deg, var(--track) 0 3px, transparent 3px 13px); }
    .mzone { flex: 1 1 0; min-width: 0; position: relative; touch-action: none; --c: var(--stream, var(--primary)); }
    :host([data-phone]) .mzone { touch-action: pan-y; }
    .mzone + .mzone { border-left: 2px dashed var(--track); }
    .mzone[data-focus] { background: var(--chip-strong); box-shadow: inset 0 0 0 3px var(--primary); }
    .mzone[data-hot] { box-shadow: inset 0 0 0 4px var(--c); }
    .mzone[data-asleep] .zname b { opacity: .7; }
    .pool { position: absolute; left: 0; right: 0; bottom: 0; background: color-mix(in srgb, var(--c) 40%, transparent); transition: height .2s ease-out; pointer-events: none; }
    .pool::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: 8px; background: radial-gradient(circle at 12px 14px, color-mix(in srgb, var(--c) 40%, transparent) 11px, transparent 12px) 0 0 / 24px 8px repeat-x; }
    .mzone[data-playing] .pool::before { animation: wave 1.5s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes wave { to { background-position-x: 24px; } }
    /* the sound takes the shape of the theme (Glass only; the other looks dress it themselves) */
    .pool::after { content: ''; position: absolute; inset: 0; pointer-events: none; }
    :host([data-look='glass'][data-theme='sea']) .pool::after { inset: auto 0 100% 0; height: 12px; opacity: .6; background: radial-gradient(circle at 18px 21px, color-mix(in srgb, var(--c) 40%, transparent) 17px, transparent 18px) 0 0 / 36px 12px repeat-x; }
    :host([data-look='glass'][data-theme='sea']) .mzone[data-playing] .pool::after { animation: wave2 2.7s linear infinite reverse; animation-iteration-count: var(--loops, infinite); }
    @keyframes wave2 { to { background-position-x: 36px; } }
    :host([data-look='glass'][data-theme='reef']) .pool::after { background: radial-gradient(circle at 18px 100px, transparent 3px, rgba(255,255,255,.85) 3.5px 5px, transparent 5.5px), radial-gradient(circle at 62px 40px, transparent 5px, rgba(255,255,255,.7) 5.5px 7px, transparent 7.5px), radial-gradient(circle at 84px 84px, rgba(255,255,255,.75) 2px, transparent 2.5px); background-size: 96px 120px; }
    :host([data-look='glass'][data-theme='reef']) .mzone[data-playing] .pool::after { animation: bubbles 4.5s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes bubbles { to { background-position-y: -120px; } }
    :host([data-look='glass'][data-theme='space']) .pool { background: linear-gradient(to top, color-mix(in srgb, var(--c) 46%, transparent), color-mix(in srgb, var(--c) 8%, transparent)); }
    :host([data-look='glass'][data-theme='space']) .pool::before { height: 3px; background: var(--c); box-shadow: 0 0 14px 3px var(--c); animation: none; }
    :host([data-look='glass'][data-theme='space']) .pool::after { background: radial-gradient(circle at 14px 20px, #fff 1.4px, transparent 2px), radial-gradient(circle at 52px 58px, #fff 1px, transparent 1.6px), radial-gradient(circle at 70px 14px, #fff 1.8px, transparent 2.4px), radial-gradient(circle at 30px 70px, #fff 1px, transparent 1.6px); background-size: 86px 84px; }
    :host([data-look='glass'][data-theme='space']) .mzone[data-playing] .pool::after { animation: twinkle 1.7s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes twinkle { from { opacity: .25; } to { opacity: 1; } }
    :host([data-look='glass'][data-theme='bush']) .pool::before { height: 14px; background: radial-gradient(circle at 26px 30px, color-mix(in srgb, var(--c) 40%, transparent) 27px, transparent 28px) 0 0 / 52px 14px repeat-x; animation-duration: 4s; }
    :host([data-look='glass'][data-theme='bush']) .pool::after { background: radial-gradient(circle at 20px 30px, #fff3a8 2.2px, transparent 3.4px), radial-gradient(circle at 78px 62px, #fff3a8 1.8px, transparent 3px), radial-gradient(circle at 50px 12px, #fff3a8 1.6px, transparent 2.8px); background-size: 104px 80px; }
    :host([data-look='glass'][data-theme='bush']) .mzone[data-playing] .pool::after { animation: fireflies 3.2s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes fireflies { from { opacity: .15; background-position: 0 0; } to { opacity: 1; background-position: 14px -10px; } }
    :host([data-look='glass'][data-theme='sunset']) .pool::before { height: 4px; background: linear-gradient(90deg, transparent, rgba(255,226,160,.95), transparent) 0 0 / 180px 4px repeat-x; animation: shimmer 3.4s linear infinite; animation-iteration-count: var(--loops, infinite); animation-play-state: paused; }
    :host([data-look='glass'][data-theme='sunset']) .mzone[data-playing] .pool::before { animation-play-state: running; }
    :host([data-look='glass'][data-theme='sunset']) .pool::after { background: repeating-linear-gradient(to bottom, rgba(255,226,160,.34) 0 2px, transparent 2px 16px); }
    :host([data-look='glass'][data-theme='sunset']) .mzone[data-playing] .pool::after { animation: bands 2.6s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes shimmer { to { background-position-x: 180px; } }
    @keyframes bands { to { background-position-y: 16px; } }
    @keyframes scribble { to { background-position: 5px 0, 0 0; } }
    .zname { position: absolute; left: 6px; top: 4px; right: 56px; min-height: 48px; padding: 4px 8px; display: flex; flex-direction: column; justify-content: center; gap: 1px; text-align: left; border-radius: 14px; }
    .zname b, .zname span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zname b { font-size: 16px; font-weight: var(--w-bold, 700); }
    .zname span { font-size: 14px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .mzone > .join { position: absolute; right: 8px; top: 6px; }
    .grab { position: absolute; right: 4px; width: 56px; height: 44px; margin-bottom: -22px; display: flex; align-items: center; justify-content: center; touch-action: none; cursor: ns-resize; }
    .grab i { display: block; width: 44px; height: 12px; border-radius: 6px; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--c), 0 1px 4px rgba(0,0,0,.2); }
    .mzone:not([data-live]) .grab i { box-shadow: inset 0 0 0 2px var(--ink3); }
    .puck { position: absolute; left: 50%; bottom: 14%; width: 68px; height: 68px; margin-left: -34px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box; touch-action: none; cursor: grab;
      background: radial-gradient(circle, #fff 0 7%, transparent 8%), var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 8px 20px -6px rgba(0,0,0,.55); }
    .mzone[data-playing] .puck { animation: puck 8s linear infinite; animation-iteration-count: var(--loops, infinite); }
    @keyframes puck { to { transform: rotate(360deg); } }
    .puck[data-lifted] { opacity: .3; animation: none; }
    .puck.fly { margin: -42px 0 0 -42px; width: 84px; height: 84px; bottom: auto; pointer-events: none; z-index: 5; animation: lift .18s ease-out; box-shadow: 0 20px 32px -8px rgba(0,0,0,.6); }
    @keyframes lift { from { transform: scale(.7); } }
    .acts .pill[data-hot] { box-shadow: 0 0 0 4px var(--accent); }
    /* the map with its shelf: records to carry to a room, and somewhere to drop music for the whole house */
    .maprow { flex: 1; min-height: 0; display: flex; gap: 12px; }
    .maprow > .map { min-width: 0; }
    .mshelf { flex: 0 0 clamp(236px, 25%, 310px); min-width: 0; border-radius: 22px; background: var(--chip); padding: 12px; display: flex; flex-direction: column; gap: 10px; user-select: none; -webkit-user-select: none; }
    .shead { display: flex; align-items: center; justify-content: flex-start; gap: 4px; flex-wrap: wrap; }
    .shead b { flex: 1 1 100%; min-width: 0; font-size: 12px; font-weight: var(--w-bold, 700); letter-spacing: .09em; text-transform: uppercase; color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .swho { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .swho i { width: 34px; height: 34px; border-radius: 50%; background: var(--c); color: var(--on-person, #fff); font-style: normal; font-size: 13px; font-weight: var(--w-heavy, 800); display: flex; align-items: center; justify-content: center; transform: scale(.88); transition: transform .22s cubic-bezier(.2,1.4,.4,1); }
    .swho[aria-pressed='true'] i { transform: scale(1.12); box-shadow: 0 0 0 2.5px var(--chip-strong), 0 0 0 5px var(--c); }
    .srecs { flex: 1; min-height: 0; container-type: size; display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 8px; align-content: start; justify-items: center; --row: calc((100cqh - (var(--rows) - 1) * 8px) / var(--rows)); }
    .srec { width: min(100%, calc(var(--row) - 30px)); min-width: 44px; display: flex; flex-direction: column; align-items: center; gap: 4px; touch-action: none; border-radius: 14px; }
    .puck.onshelf { position: static; margin: 0; width: 100%; height: auto; aspect-ratio: 1; display: block; transition: transform .25s cubic-bezier(.2,1.4,.4,1); }
    .srec:active .puck.onshelf { transform: scale(1.08) rotate(14deg); }
    .srec[data-lifted] .puck.onshelf { opacity: .3; }
    .srec span { max-width: 100%; height: 26px; font-size: 13px; line-height: 13px; font-weight: var(--w-semi, 600); text-align: center; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .srec.more { justify-content: center; align-self: stretch; background: var(--chip-strong); font-size: 13px; font-weight: var(--w-bold, 700); }
    .snone { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; font-size: 13px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .wholeh { min-height: 58px; padding: 6px 12px; border-radius: 18px; border: 2.5px dashed var(--ink3); display: flex; align-items: center; justify-content: center; gap: 10px; text-align: left; line-height: 1.15; transition: background .2s, border-color .2s, transform .2s cubic-bezier(.2,1.4,.4,1); }
    .wholeh b { display: block; font-size: 14.5px; font-weight: var(--w-bold, 700); } .wholeh span span { display: block; font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .wholeh[data-open] { border-color: var(--primary); animation: landp 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    .wholeh[data-hot] { border-style: solid; border-color: var(--primary); background: color-mix(in srgb, var(--primary) 22%, transparent); transform: scale(1.03); animation: none; }
    /* each room's speaker: louder music sends its ripples further */
    .zspk { position: absolute; right: 30px; top: 28px; width: 0; height: 0; pointer-events: none; }
    .zspk i { position: absolute; left: -22px; top: -22px; width: 44px; height: 44px; border-radius: 50%; box-sizing: border-box; border: 2.5px solid var(--c); opacity: 0; }
    .zspk b { position: absolute; left: -9px; top: -9px; width: 18px; height: 18px; border-radius: 50%; background: var(--c); box-shadow: 0 0 0 3px var(--chip-strong); }
    .mzone[data-playing] .zspk i { animation: zrip 2.4s ease-out infinite; animation-iteration-count: var(--loops, infinite); }
    .mzone[data-playing] .zspk i + i { animation-delay: -1.2s; }
    @keyframes zrip { from { transform: scale(.5); opacity: .85; } to { transform: scale(var(--amp, 1.8)); opacity: 0; } }
    /* while something is being carried, every room shows where it can land */
    .land { position: absolute; left: 50%; top: 60%; width: 58px; height: 58px; margin: -29px 0 0 -29px; border-radius: 50%; box-sizing: border-box; border: 2.5px dashed var(--c); pointer-events: none; animation: landp 1.1s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    .mzone[data-hot] .land { border-style: solid; background: color-mix(in srgb, var(--c) 28%, transparent); }
    @keyframes landp { from { transform: scale(.94); } to { transform: scale(1.06); } }
    :host([data-phone]) .maprow, :host([data-shape='tall']) .maprow { flex-direction: column; }
    :host([data-phone]) .maprow { flex: none; }
    :host([data-phone]) .mshelf, :host([data-shape='tall']) .mshelf { flex: none; }
    :host([data-phone]) .srecs, :host([data-shape='tall']) .srecs { flex: none; container-type: normal; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); --row: 126px; }
    /* on a tall screen the shelf is a strip under the house: whose shelf, the records, the whole house */
    :host([data-shape='tall']:not([data-phone])) .mshelf { flex-direction: row; align-items: center; gap: 14px; }
    :host([data-shape='tall']:not([data-phone])) .shead { flex: 0 0 108px; }
    :host([data-shape='tall']:not([data-phone])) .srecs { flex: 1 1 0; min-width: 0; }
    :host([data-shape='tall']:not([data-phone])) .snone { flex-direction: row; text-align: left; }
    :host([data-shape='tall']:not([data-phone])) .wholeh { flex: 0 0 176px; align-self: stretch; }
    :host([data-phone]) .map { flex: none; }
    :host([data-phone]) .map:not(.snug) .floor { flex: none; flex-wrap: wrap; }
    :host([data-phone]) .map:not(.snug) .mroom { flex: var(--size, 1) 1 calc(var(--size, 1) * 140px); height: 150px; }
    :host([data-phone]) .mstairs { display: none; }
    .map[data-fit] .floor { min-height: 78px; }
    .map[data-fit] .puck { width: 56px; height: 56px; margin-left: -28px; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .stage { width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; }
    :host([data-shape='tall']) .stage > *:not(.bg) { flex: 1 1 100%; }
    :host([data-shape='tall']) .stage { gap: 6px; padding: 14px 18px; flex: 0 0 auto; }
    :host([data-shape='tall']) .panel { min-height: 0; }
    :host([data-shape='tall']) .deck { flex: 0 0 140px; height: 140px; min-height: 0; }
    :host([data-shape='tall']) .stage .titles { flex: 1 1 0; min-width: 0; }
  `], ya.properties = {
  hass: { attribute: !1 },
  players: { attribute: !1 },
  stations: { attribute: !1 },
  source: {},
  preferred: {},
  kids: { attribute: !1 },
  people: { attribute: !1 },
  pin: {},
  quiet: { attribute: !1 },
  sleepMinutes: { type: Number },
  map: { attribute: !1 },
  hide: { attribute: !1 },
  lock: { type: Boolean },
  moments: { attribute: !1 },
  callVolume: { type: Number },
  callLanguage: {},
  callVoice: {},
  _jog: { state: !0 },
  _sleepAt: { state: !0 },
  _momentOn: { state: !0 },
  _padSet: { state: !0 },
  _momentBusy: { state: !0 },
  theme: { reflect: !0, attribute: "data-theme" },
  _view: { state: !0 },
  _dv: { state: !0 },
  _viewAsk: { state: !0 },
  _sd: { state: !0 },
  _peek: { state: !0 },
  _carry: { state: !0 },
  _shelfTo: { state: !0 },
  _crateAt: { state: !0 },
  _tab: { state: !0 },
  _focus: { state: !0 },
  _thumbs: { state: !0 },
  _resolved: { state: !0 },
  _msg: { state: !0 },
  _q: { state: !0 },
  _text: { state: !0 },
  _caps: { state: !0 },
  _hits: { state: !0 },
  _busy: { state: !0 },
  _keys: { state: !0 },
  _sel: { state: !0 },
  _shelf: { state: !0 },
  _items: { state: !0 },
  _edit: { state: !0 },
  _juke: { state: !0 },
  _keep: { state: !0 },
  _callTo: { state: !0 },
  _callMsg: { state: !0 },
  _pinAsk: { state: !0 },
  _pinTo: { state: !0 },
  _adding: { state: !0 },
  _jpick: { state: !0 },
  _now: { state: !0 },
  _ckeys: { state: !0 },
  _coach: { state: !0 }
};
let gi = ya;
customElements.get("fh-music") || customElements.define("fh-music", gi);
const pa = ["#1d1d1f", "#e63946", "#f77f00", "#fcbf49", "#2a9d8f", "#118ab2", "#7b2cbf", "#ff70a6", "#8d5a3b", "#ffffff"], lr = [4, 10, 22], Ha = "family-hub-fridge", we = "media-source://media_source/local/.", pr = ["🦖", "🐉", "🚚", "⭐", "❤️", "🌈", "🏄", "🎺"], Ra = class Ra extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.fitCtl = new yt(this), this._ink = pa[0], this._size = 10, this.artists = [], this._stamp = "", this._artist = "", this._erase = !1, this._chalk = !1, this._blank = !0, this._pics = [], this._view = "", this._msg = "", this._stick = !1, this._strokes = [], this._cur = null, this._last = null, this._hue = 0;
  }
  _say(t) {
    this._msg = t, clearTimeout(this._t), this._t = window.setTimeout(() => {
      this._msg = "";
    }, 2400);
  }
  firstUpdated() {
    this._canvas = this.renderRoot.querySelector("canvas"), this._ctx = this._canvas.getContext("2d");
    const t = this.renderRoot.querySelector(".pad");
    this._ro = new ResizeObserver(() => this._fit(t)), this._ro.observe(t), this._loadFridge();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._ro?.disconnect();
  }
  _fit(t) {
    const a = this._canvas, i = window.devicePixelRatio || 1, o = t.clientWidth, s = t.clientHeight;
    if (!o || !s || a.width === Math.round(o * i) && a.height === Math.round(s * i)) return;
    const r = a.width ? this._ctx.getImageData(0, 0, a.width, a.height) : null;
    a.width = Math.round(o * i), a.height = Math.round(s * i), a.style.width = `${o}px`, a.style.height = `${s}px`, r && this._ctx.putImageData(r, 0, 0);
  }
  _pt(t) {
    const a = this._canvas, i = a.getBoundingClientRect();
    return { x: (t.clientX - i.left) * (a.width / i.width), y: (t.clientY - i.top) * (a.height / i.height) };
  }
  _down(t) {
    if (this._canvas.setPointerCapture(t.pointerId), this._last = this._pt(t), this._stamp) {
      const a = { ink: "", size: this._size, erase: !1, hue: 0, pts: [[this._last.x, this._last.y, 0, 0, 0]], stamp: this._stamp };
      this._strokes.push(a), this._drawStamp(a), this._blank = !1, this._last = null;
      return;
    }
    this._cur = { ink: this._ink, size: this._size, erase: this._erase, hue: this._hue, pts: [] }, this._strokes.push(this._cur), this._strokes.length > 400 && this._strokes.splice(0, this._strokes.length - 400), this._seg(this._cur, this._last, this._last, t.pressure), this._blank = !1;
  }
  _move(t) {
    if (!this._last || !this._cur) return;
    const a = t.getCoalescedEvents?.();
    for (const i of a?.length ? a : [t]) {
      const o = this._pt(i);
      this._seg(this._cur, this._last, o, i.pressure), this._last = o;
    }
  }
  _up() {
    this._last = null, this._cur = null;
  }
  /** Draw one segment and record it, so undo can replay strokes instead of keeping bitmaps. */
  _seg(t, a, i, o) {
    t.pts.push([a.x, a.y, i.x, i.y, o]), this._draw(t, a.x, a.y, i.x, i.y, o, t.pts.length);
  }
  _draw(t, a, i, o, s, r, n) {
    const c = this._ctx, p = window.devicePixelRatio || 1, d = r > 0 && r !== 0.5 ? 0.6 + r : 1;
    if (c.globalCompositeOperation = t.erase ? "destination-out" : "source-over", c.lineCap = "round", c.lineJoin = "round", c.lineWidth = (t.erase ? t.size * 2.4 : t.size) * p * d, t.ink === "rainbow" && !t.erase) {
      const h = (t.hue + n * 4) % 360;
      this._hue = h, c.strokeStyle = `hsl(${h} 90% 55%)`;
    } else c.strokeStyle = t.ink === "rainbow" ? "#000" : t.ink;
    c.beginPath(), c.moveTo(a, i), c.lineTo(o + 0.01, s), c.stroke();
  }
  _drawStamp(t) {
    const a = this._ctx, i = window.devicePixelRatio || 1, [o, s] = t.pts[0];
    a.globalCompositeOperation = "source-over", a.font = `${(30 + t.size * 3) * i}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`, a.textAlign = "center", a.textBaseline = "middle", a.fillText(t.stamp, o, s);
  }
  _redraw() {
    const t = this._canvas;
    this._ctx.clearRect(0, 0, t.width, t.height);
    const i = this._strokes.lastIndexOf(null) + 1;
    for (const o of this._strokes.slice(i)) o && (o.stamp ? this._drawStamp(o) : o.pts.forEach((s, r) => this._draw(o, s[0], s[1], s[2], s[3], s[4], r + 1)));
    this._blank = !this._strokes.slice(i).length;
  }
  _undoOne() {
    this._strokes.pop(), this._redraw();
  }
  _clear() {
    this._blank || this._strokes.push(null), this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height), this._blank = !0;
  }
  /** Flatten onto the paper colour and return a PNG blob. */
  _png() {
    const t = this._canvas, a = document.createElement("canvas"), i = Math.min(1, 1600 / t.width);
    a.width = Math.round(t.width * i), a.height = Math.round(t.height * i);
    const o = a.getContext("2d");
    return o.fillStyle = this._chalk ? "#23332b" : "#fffdf7", o.fillRect(0, 0, a.width, a.height), o.drawImage(t, 0, 0, a.width, a.height), new Promise((s) => a.toBlob(s, "image/png"));
  }
  async _toFridge() {
    if (this._blank) {
      this._say("Draw something first!");
      return;
    }
    const t = await this._png();
    if (!t) return;
    const a = /* @__PURE__ */ new Date(), i = `${a.getFullYear()}${String(a.getMonth() + 1).padStart(2, "0")}${String(a.getDate()).padStart(2, "0")}-${String(a.getHours()).padStart(2, "0")}${String(a.getMinutes()).padStart(2, "0")}${String(a.getSeconds()).padStart(2, "0")}`;
    this._stick = !0, setTimeout(() => {
      this._stick = !1;
    }, 900);
    let o = !1;
    if (this.hass?.fetchWithAuth)
      try {
        const s = new FormData();
        s.append("media_content_id", we), s.append("file", new File([t], `doodle-${i}${this._artist ? `-${this._artist.toLowerCase()}` : ""}.png`, { type: "image/png" })), o = (await this.hass.fetchWithAuth("/api/media_source/local_source/upload", { method: "POST", body: s })).ok;
      } catch {
        o = !1;
      }
    if (!o) {
      const s = await new Promise((r) => {
        const n = new FileReader();
        n.onload = () => r(String(n.result)), n.readAsDataURL(t);
      });
      try {
        const r = JSON.parse(localStorage.getItem(Ha) ?? "[]");
        r.unshift({ title: `doodle-${i}${this._artist ? `-${this._artist.toLowerCase()}` : ""}`, url: s }), localStorage.setItem(Ha, JSON.stringify(r.slice(0, 8)));
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
      t = JSON.parse(localStorage.getItem(Ha) ?? "[]");
    } catch {
    }
    if (this.hass)
      try {
        const i = (await this.hass.callWS({ type: "media_source/browse_media", media_content_id: we })).children.filter((s) => /^doodle-/.test(s.title)).sort((s, r) => r.title.localeCompare(s.title)).slice(0, 12);
        t = [...(await Promise.all(i.map(async (s) => {
          try {
            const r = await this.hass.callWS({ type: "media_source/resolve_media", media_content_id: s.media_content_id });
            return { title: s.title, url: r.url, id: s.media_content_id };
          } catch {
            return null;
          }
        }))).filter((s) => !!s), ...t].sort((s, r) => r.title.localeCompare(s.title));
      } catch {
      }
    this._pics = t;
  }
  render() {
    return l`
      <section class="glass brushes" data-fits aria-label="Brushes">
        ${pa.map((t) => l`<button class="ink tap" style="background:${t}" aria-label="Colour" aria-pressed=${String(!this._erase && !this._stamp && this._ink === t)} @click=${() => {
      this._ink = t, this._erase = !1, this._stamp = "";
    }}></button>`)}
        <button class="ink tap rainbow" aria-label="Rainbow" aria-pressed=${String(!this._erase && !this._stamp && this._ink === "rainbow")} @click=${() => {
      this._ink = "rainbow", this._erase = !1, this._stamp = "";
    }}></button>
        <span class="rule"></span>
        ${pr.map((t) => l`<button class="size tap" style="font-size:26px" aria-label="Stamp" aria-pressed=${String(this._stamp === t)} @click=${() => {
      this._stamp = this._stamp === t ? "" : t, this._erase = !1;
    }}>${t}</button>`)}
        <span class="rule"></span>
        ${lr.map((t) => l`<button class="size tap" aria-label="Brush ${t}" aria-pressed=${String(this._size === t)} @click=${() => {
      this._size = t;
    }}><i style="width:${Math.min(t, 22)}px;height:${Math.min(t, 22)}px"></i></button>`)}
        <button class="size tap" aria-label="Eraser" aria-pressed=${String(this._erase)} @click=${() => {
      this._erase = !this._erase;
    }} style="font-size:22px">🧽</button>
      </section>
      <section class="glass easel ${this._stick ? "stick" : ""}">
        <div class="pad ${this._chalk ? "chalk" : ""}">
          <canvas @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up} @pointercancel=${this._up} @pointerleave=${this._up}></canvas>
          ${this._blank ? l`<div class="hint">Draw something brilliant</div>` : u}
        </div>
        <div class="acts">
          <button class="pill tap" @click=${() => this._undoOne()}>${F("left", 18)}Undo</button>
          <button class="pill tap" @click=${() => this._clear()}>${F("close", 18)}Clear</button>
          <button class="pill tap" @click=${() => {
      this._chalk = !this._chalk, this._chalk && this._ink === pa[0] ? this._ink = "#ffffff" : !this._chalk && this._ink === "#ffffff" && (this._ink = pa[0]);
    }}>${F(this._chalk ? "sun" : "moon", 18)}${this._chalk ? "Paper" : "Chalkboard"}</button>
          <span style="flex:1"></span>
          ${this.artists.length ? l`<span class="muted" style="font-size:13px;font-weight:var(--w-bold, 700)">Artist</span>${this.artists.map((t) => l`<button class="pill tap" style=${this._artist === t ? "background:var(--primary);color:var(--on-primary)" : ""} @click=${() => {
      this._artist = this._artist === t ? "" : t;
    }}>${t}</button>`)}` : ""}
          <button class="pill tap primary" style="height:48px;padding:0 20px;font-size:16px" @click=${() => this._toFridge()}>${F("star", 18)}Stick it on the fridge</button>
        </div>
      </section>
      <section class="glass gallery" aria-label="The fridge">
        <span class="label">The fridge</span>
        ${this._pics.length ? l`<div class="snaps">${this._pics.map((t) => {
      const a = /-(\d{6})-([a-z]+)/.exec(t.title)?.[2];
      return l`<button class="snap tap" aria-label="View doodle" style="background-image:url('${t.url}')" @click=${() => {
        this._view = t.url;
      }}>${a ? l`<span class="by">${a}</span>` : ""}</button>`;
    })}</div>` : l`<span class="muted" style="font-size:14px">Nothing on the fridge yet. Your best doodles go here for everyone to see.</span>`}
      </section>
      ${this._view ? l`<button class="view" aria-label="Close" @click=${() => {
      this._view = "";
    }}><img src=${this._view} alt="Doodle"></button>` : u}
      ${this._msg ? l`<div class="toast" role="status">${this._msg}</div>` : u}`;
  }
};
Ra.styles = [_, G`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .brushes { width: 132px; flex-shrink: 0; border-radius: 28px; padding: 14px 10px; display: grid; grid-template-columns: 1fr 1fr; justify-items: center; align-content: start; gap: 10px 6px; overflow: auto; }
    .brushes[data-fit='1'] { width: 190px; grid-template-columns: repeat(3, 1fr); }
    .brushes[data-fit='2'], .brushes[data-fit='3'] { width: 248px; grid-template-columns: repeat(4, 1fr); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .brushes { width: auto !important; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important; flex-shrink: 0; }
    :host([data-shape='tall']) .brushes .rule { display: none; }
    :host([data-shape='tall']) .gallery { width: auto; max-height: 260px; }
    :host([data-shape='tall']) .snaps { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .easel { min-height: 440px; }
    :host([data-phone]) .hint { font-size: 22px; text-align: center; padding: 0 20px; }
    :host([data-phone]) .acts { flex-wrap: wrap; }
    :host([data-phone]) .view { position: fixed; border-radius: 0; }
    .brushes .rule { grid-column: 1 / -1; height: 1px; width: 90px; background: var(--track); }
    .ink { width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.12); transition: transform .2s cubic-bezier(.2,1.4,.4,1); flex-shrink: 0; }
    .ink[aria-pressed='true'] { transform: scale(1.18); box-shadow: 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .rainbow { background: conic-gradient(#e63946, #fcbf49, #2a9d8f, #118ab2, #7b2cbf, #e63946); }
    .size { width: 50px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .size[aria-pressed='true'] { background: var(--chip-strong); }
    .size i { border-radius: 50%; background: var(--ink); display: block; }
    .easel { flex: 1; min-width: 0; border-radius: 28px; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .pad { flex: 1; min-height: 0; border-radius: 20px; overflow: hidden; position: relative; background: #fffdf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); transition: background .4s; }
    .pad.chalk { background: #23332b; }
    canvas { position: absolute; inset: 0; touch-action: none; cursor: crosshair; }
    .hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: var(--w-bold, 700); color: rgba(0,0,0,.12); }
    .chalk .hint { color: rgba(255,255,255,.18); }
    .acts { display: flex; gap: 8px; align-items: center; }
    .gallery { width: 250px; flex-shrink: 0; border-radius: 28px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .snaps { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; }
    .snap { aspect-ratio: 4/3; border-radius: 10px; background: #fff center / cover; box-shadow: 0 6px 14px -6px rgba(0,0,0,.35); position: relative; }
    .snap:nth-child(odd) { transform: rotate(-2.5deg); } .snap:nth-child(even) { transform: rotate(2deg); }
    .snap::before { content: ''; position: absolute; top: -6px; left: 50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--accent); box-shadow: 0 2px 3px rgba(0,0,0,.3); }
    .snap .by { position: absolute; bottom: -8px; right: -4px; background: var(--chip-strong); border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: var(--w-heavy, 800); text-transform: capitalize; }
    .stick { animation: stick .9s cubic-bezier(.2,1.3,.4,1); }
    @keyframes stick { 0% { transform: scale(1); } 40% { transform: scale(.4) translate(60%, -10%) rotate(8deg); opacity: .6; } 100% { transform: scale(1); opacity: 1; } }
    .view { position: absolute; inset: 0; z-index: 30; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; border-radius: 28px; }
    .view img { max-width: 92%; max-height: 92%; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.5); animation: sheet .4s cubic-bezier(.2,1.2,.3,1); }
  `], Ra.properties = {
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
let Ki = Ra;
customElements.get("fh-doodle") || customElements.define("fh-doodle", Ki);
const cr = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], Sa = class Sa extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.kids = [], this.events = [], this.leaveBy = "08:15", this.rules = [], this.privateWords = [], this.uv = 0, this.termLabel = "", this.travel = 15, this._items = {}, this._now = /* @__PURE__ */ new Date(), this._cheer = 0, this._wasReady = !0, this._unsubs = [];
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
    return t.size === 1 && t.has("hass") ? Ri(t.get("hass"), this.hass, this.kids.map((a) => E(a).avatar)) : !0;
  }
  async _sub() {
    if (!this.hass?.connection) {
      setTimeout(() => this._sub(), 500);
      return;
    }
    for (const t of this.kids) {
      const a = E(t).chores;
      try {
        const i = await this.hass.connection.subscribeMessage((o) => {
          this._items = { ...this._items, [t.name]: o.items.map(Ze) };
        }, { type: "todo/item/subscribe", entity_id: a });
        this.isConnected ? this._unsubs.push(i) : i();
      } catch {
      }
    }
  }
  _bring(t, a) {
    const i = new Set(t.bring?.[cr[this._now.getDay()]] ?? []), o = a.filter((s) => s.who === t.name || s.title.toLowerCase().includes(t.name.toLowerCase())).map((s) => s.title.toLowerCase()).join(" | ");
    for (const s of this.rules)
      s.kid && s.kid !== t.name || new RegExp(s.match, "i").test(o) && i.add(s.item);
    return this.uv >= 3 && i.add("Hat 🧢"), [...i];
  }
  /** A child's own events today (their calendar, or family events that name them). */
  _own(t) {
    const a = t.name.toLowerCase(), i = this.privateWords.map((o) => o.toLowerCase());
    return this.events.filter((o) => Q(o.start, this._now) && !i.some((s) => o.title.toLowerCase().includes(s)) && (o.who === t.name || o.title.toLowerCase().includes(a)));
  }
  /** Leave time in minutes since midnight: first own event before 10am minus travel, else the default. */
  _leave(t) {
    const a = this._own(t).filter((s) => !s.allDay && s.start.getHours() < 10).sort((s, r) => s.start.getTime() - r.start.getTime())[0], i = I(t.leave_by ?? this.leaveBy), o = a ? a.start.getHours() * 60 + a.start.getMinutes() - this.travel : 1 / 0;
    return o < i ? { at: o, why: a.title } : { at: i, why: "school" };
  }
  /** Everyone's morning steps, pooled: the team fills one row of stars together. */
  _team() {
    let t = 0, a = 0;
    for (const i of this.kids) for (const o of this._items[i.name] ?? []) o.lane === "routine" && o.slot === "am" && (a++, o.status === "completed" && t++);
    return { done: t, total: a };
  }
  updated() {
    const { done: t, total: a } = this._team(), i = a > 0 && t === a;
    i && !this._wasReady && (this._cheer++, N("done")), Object.keys(this._items).length && (this._wasReady = i);
  }
  render() {
    if (!this.hass) return u;
    const t = ut(this._now), a = this.kids.map((h) => ({ k: h, ...this._leave(h) })), i = a.filter((h) => h.at - t > -5).sort((h, m) => h.at - m.at)[0], o = i ? i.at - t : -99, s = (h) => B(new Date(new Date(this._now).setHours(Math.floor(h / 60), h % 60, 0, 0))), r = i ? a.filter((h) => h.at === i.at).length === a.length ? "everyone leaves" : `${a.filter((h) => h.at === i.at).map((h) => h.k.name).join(" & ")} leaves` : "", n = this._now, c = this.privateWords.map((h) => h.toLowerCase()), p = this._team(), d = p.total > 0 && p.done === p.total;
    return l`
      <section class="glass board">
        <div style="flex:1"><h1 class="t-title">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ""}</span></div>
        ${p.total ? l`<div class="team" role="img" aria-label="Team morning: ${p.done} of ${p.total} done">
          ${p.total <= 18 ? l`<div class="stars">${Array.from({ length: p.total }, (h, m) => l`<i class=${m < p.done ? "on" : ""}>★</i>`)}</div>` : l`<div class="teambar"><div style="width:${p.done / p.total * 100}%"></div></div>`}
          <span style="font-size:15px;font-weight:var(--w-bold, 700)">${d ? "Everyone’s ready – go team! 🎉" : "Team morning: every job done adds a star"}</span></div>` : u}
        <div style="display:flex;align-items:center;gap:14px;justify-content:flex-end;flex:1">
          ${o > 0 ? X(et(), "timer", { frac: Math.min(1, o / 60), size: 64 }) : u}
          <div style="text-align:right"><div class="leave ${o <= 0 && o > -5 ? "go" : ""}">${o > 0 ? `${o} min` : o > -5 ? "Time to go!" : "Have a great day"}</div>
            <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${i && o > 0 ? `until ${r} at ${s(i.at)}` : ""}</span></div></div>
      </section>
      <div class="kcols" style="--n:${this.kids.length}">
        ${this.kids.map((h) => {
      const m = E(h), f = Ft(this.hass.states[m.avatar]?.state, h.look ? Ft(h.look) : {}), x = (this._items[h.name] ?? []).filter((k) => k.lane === "routine" && k.slot === "am"), K = x.find((k) => k.status !== "completed"), A = this.events.filter((k) => Q(k.start, n) && !c.some((w) => k.title.toLowerCase().includes(w)) && (k.who === h.name || k.colour === "family" || k.title.toLowerCase().includes(h.name.toLowerCase()))), U = this._bring(h, A), y = a.find((k) => k.k === h), q = y.at - t;
      return l`<button class="glass kcol tap" style="--kid:${T(h.colour)}" @click=${() => this.dispatchEvent(new CustomEvent("open-kid", { detail: h.name }))}>
            <div class="khead">${ct(f, { size: 60, crop: "head", jump: this._cheer, age: h.age, ring: T(h.colour) })}<h2>${h.name}</h2></div>
            <div class="lchip ${q <= 0 && q > -5 ? "now" : q <= 10 && q > 0 ? "soon" : ""}"><span>Leave ${s(y.at)}${y.why !== "school" ? ` · ${y.why}` : ""}</span><span>${q > 0 ? `${q} min` : q > -5 ? "Go!" : "✓"}</span></div>
            ${x.length ? K ? l`<div class="nextstep"><span class="e">${ma(K.summary)}</span><span><small>Next</small>${K.summary}</span></div>` : l`<div class="nextstep set"><span class="e">🌟</span><span><small>Morning jobs</small>All set</span></div>` : u}
            ${U.length ? l`<span class="label">Bring</span><div class="bring">${U.map((k) => l`<span>${k}</span>`)}</div>` : u}
            <span class="label">Today</span>
            ${A.length ? A.slice(0, 4).map((k) => l`<div class="mev2"><span class="mt">${k.allDay ? "All day" : B(k.start)}</span><span>${k.title}</span></div>`) : l`<span class="muted" style="font-size:14px">Just school today</span>`}
          </button>`;
    })}
      </div>
      ${this._cheer ? vi(this._cheer, Vi(this._cheer)) : u}`;
  }
};
Sa.styles = [_, G`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; position: relative; }
    .board { border-radius: 26px; padding: 12px 20px; display: flex; align-items: center; gap: 18px; }
    .team { flex: 1.4; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    .stars { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 4px; font-size: 30px; line-height: 1; }
    .stars i { font-style: normal; color: var(--track); transition: color .3s; }
    .stars i.on { color: #f5b301; animation: starpop .6s cubic-bezier(.3,1.8,.5,1) both; }
    @keyframes starpop { from { transform: scale(.2) rotate(-40deg); } to { transform: none; } }
    .teambar { width: 100%; height: 14px; border-radius: 7px; background: var(--track); overflow: hidden; }
    .teambar > div { height: 100%; border-radius: 7px; background: #f5b301; transition: width .6s; }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .leave.go { animation: hop .7s cubic-bezier(.3,1.5,.5,1) 3; }
    @keyframes hop { 0%, 100% { transform: none; } 40% { transform: translateY(-10px) rotate(-2deg); } 70% { transform: translateY(0) rotate(1deg); } }
    .kcols { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 14px; }
    :host([data-shape='tall']) .board { flex-wrap: wrap; }
    :host([data-shape='tall']) .kcols { grid-template-columns: 1fr; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .kcols { flex: none; }
    :host([data-phone]) .board > div { flex: 1 1 100% !important; justify-content: flex-start !important; }
    .kcol { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; text-align: left; border-top: 6px solid var(--kid); }
    .khead { display: flex; align-items: center; gap: 12px; }
    .khead h2 { font-size: 24px; font-weight: var(--w-heavy, 800); flex: 1; }
    .nextstep { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; background: color-mix(in srgb, var(--kid) 16%, var(--chip)); font-size: 20px; font-weight: var(--w-bold, 700); min-height: 64px; }
    .nextstep .e { font-size: 38px; line-height: 1; }
    .nextstep small { display: block; font-size: 13px; font-weight: var(--w-bold, 700); color: var(--ink2); }
    .nextstep.set { background: color-mix(in srgb, var(--ok) 20%, var(--chip)); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); }
    .lchip { font-size: 15px; font-weight: var(--w-heavy, 800); padding: 8px 12px; border-radius: 12px; background: var(--chip); display: flex; justify-content: space-between; }
    .lchip.soon { background: color-mix(in srgb, var(--accent) 32%, var(--chip)); }
    .lchip.now { background: color-mix(in srgb, var(--accent) 55%, var(--chip)); animation: hop .7s cubic-bezier(.3,1.5,.5,1) 3; }
    .mev2 { display: flex; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .mev2 .mt { width: 72px; color: var(--ink2); flex-shrink: 0; }
    ${$(Wa)}
    ${$(Ni)}
  `], Sa.properties = {
  hass: { attribute: !1 },
  kids: { attribute: !1 },
  events: { attribute: !1 },
  leaveBy: {},
  rules: { attribute: !1 },
  privateWords: { attribute: !1 },
  uv: { type: Number },
  termLabel: {},
  travel: { type: Number },
  _items: { state: !0 },
  _now: { state: !0 },
  _cheer: { state: !0 }
};
let fi = Sa;
customElements.get("fh-morning") || customElements.define("fh-morning", fi);
const dr = ["All day", "07:00", "08:00", "09:00", "10:00", "12:00", "15:00", "15:30", "16:00", "17:00", "18:00", "19:00"], bt = (e) => String(e).padStart(2, "0"), ve = (e) => `${e.getFullYear()}-${bt(e.getMonth() + 1)}-${bt(e.getDate())} ${bt(e.getHours())}:${bt(e.getMinutes())}:00`, Ve = (e) => `${e.getFullYear()}-${bt(e.getMonth() + 1)}-${bt(e.getDate())}`, wa = class wa extends j {
  constructor() {
    super(...arguments), this.lookCtl = new H(this), this.calendars = [], this.defaultCal = "", this._t = "", this._day = 0, this._time = "All day", this._dur = 60, this._cal = "", this._busy = !1, this._err = "", this._caps = !0;
  }
  _key(t) {
    [this._t, this._caps] = ga(this._t, t, this._caps);
  }
  async _save() {
    const t = this._cal || this.defaultCal || this.calendars[0]?.entity;
    if (!this._t.trim() || !t || !this.hass) {
      this._err = "Add a title first";
      return;
    }
    const a = M(P(/* @__PURE__ */ new Date()), this._day), i = { summary: this._t.trim() };
    if (this._time === "All day")
      i.start_date = Ve(a), i.end_date = Ve(M(a, 1));
    else {
      const [o, s] = this._time.split(":").map(Number), r = new Date(a);
      r.setHours(o, s, 0, 0), i.start_date_time = ve(r), i.end_date_time = ve(new Date(r.getTime() + this._dur * 6e4));
    }
    this._busy = !0, this._err = "";
    try {
      await this.hass.callService("calendar", "create_event", i, { entity_id: t }), this.dispatchEvent(new CustomEvent("saved", { detail: this._t.trim() }));
    } catch (o) {
      this._err = `Couldn’t add it: ${o?.message ?? "error"}`;
    } finally {
      this._busy = !1;
    }
  }
  render() {
    const t = P(/* @__PURE__ */ new Date()), a = this._cal || this.defaultCal || this.calendars[0]?.entity, i = Qt(this.calendars.map((o) => o.name ?? o.entity));
    return l`<div class="glass box" role="dialog" aria-label="Add to the calendar" @click=${(o) => o.stopPropagation()}>
      <div style="display:flex;gap:10px;align-items:center">
        <h2 class="t-head">Add to the calendar</h2><span style="flex:1"></span>
        <button class="round tap" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent("close"))}>${F("close", 18)}</button></div>
      <div style="display:flex;gap:10px"><input class="field" inputmode=${D() === "phone" ? "text" : "none"} aria-label="What’s on" placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @input=${(o) => {
      this._t = o.target.value;
    }}>
        <button class="pill tap primary" style="height:58px;padding:0 24px;font-size:17px" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? "Adding…" : "Add"}</button></div>
      ${this._err ? l`<span style="color:#dc2626;font-weight:var(--w-semi, 600)">${this._err}</span>` : ""}
      <div class="chips">${Array.from({ length: 8 }, (o, s) => l`<button class="tap" aria-pressed=${String(this._day === s)} @click=${() => {
      this._day = s;
    }}>${s === 0 ? "Today" : s === 1 ? "Tomorrow" : `${Yt(M(t, s))} ${M(t, s).getDate()}`}</button>`)}</div>
      <div class="chips">${dr.map((o) => l`<button class="tap" aria-pressed=${String(this._time === o)} @click=${() => {
      this._time = o;
    }}>${o === "All day" ? o : new Date(2e3, 0, 1, Number(o.slice(0, 2)), Number(o.slice(3))).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" }).replace(" ", "").toLowerCase()}</button>`)}
        ${this._time !== "All day" ? [30, 60, 90, 120].map((o) => l`<button class="tap" aria-pressed=${String(this._dur === o)} @click=${() => {
      this._dur = o;
    }}>${o < 60 ? `${o} min` : `${o / 60} hr`}</button>`) : ""}</div>
      <div class="chips">${this.calendars.map((o) => l`<button class="tap" aria-pressed=${String(a === o.entity)} @click=${() => {
      this._cal = o.entity;
    }}><span class="init" style="--c:${T(o.colour)}" aria-hidden="true">${i[o.name ?? o.entity] ?? ""}</span>${o.name ?? o.entity}</button>`)}</div>
      ${Ka((o) => this._key(o), this._caps, () => {
      this._caps = !this._caps;
    }, !0)}
    </div>`;
  }
};
wa.styles = [_, wi, G`
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
    :host([data-phone]) { position: fixed; align-items: flex-start; padding-top: 12px; }
    :host([data-phone]) .box { width: 96%; max-height: 88vh; padding: 14px; }
    :host([data-phone]) .keys { display: none; }
    .box { width: min(1100px, 94%); max-height: 96%; overflow-y: auto; border-radius: 30px; padding: 16px 20px; display: flex; flex-direction: column; gap: 9px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .field { flex: 1; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips button { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
  `], wa.properties = { hass: { attribute: !1 }, calendars: { attribute: !1 }, defaultCal: {}, _t: { state: !0 }, _day: { state: !0 }, _time: { state: !0 }, _dur: { state: !0 }, _cal: { state: !0 }, _busy: { state: !0 }, _err: { state: !0 }, _caps: { state: !0 } };
let Ui = wa;
customElements.get("fh-add-event") || customElements.define("fh-add-event", Ui);
const ro = "0.19.0", Ne = "family-hub-theme", hr = {
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
}, mr = "fh-kid,fh-home,fh-music,fh-groceries,fh-doodle,fh-morning,fh-add-event", va = class va extends j {
  constructor() {
    super(...arguments), this.fitCtl = new yt(this), this.lookCtl = new H(this), this._view = "week", this._anchor = /* @__PURE__ */ new Date(), this._events = [], this._soon = [], this._theme = "sea", this._look = "glass", this._opts = {}, this._prefTick = 0, this._sheet = "", this._now = /* @__PURE__ */ new Date(), this._toast = "", this._wx = {}, this._reminders = [], this._awakeUntil = 0, this._nightManual = !1, this._page = "planner", this._kid = 0, this._photo = "", this._musicFocus = "", this._photos = [], this._photoIdx = 0, this._lastTouch = Date.now(), this._idle = !1, this._calError = !1, this._undo = null, this._dinner = null, this._dinnerCooldown = 0, this._alarm = 0, this._alarmSeen = 0, this._pinAsk = null, this._fetchedKey = "", this._fetchGen = 0, this._dayKey = "", this._onResize = () => {
      const t = Number(this._config?.scale), a = parseFloat(getComputedStyle(this).getPropertyValue("--header-height")) || 0, i = this.getBoundingClientRect().width || window.innerWidth, o = window.innerHeight - a, s = i < 600 ? "phone" : o > i * 1.15 ? "tall" : "wide";
      s === "phone" && D() !== "phone" && this._view === "week" && (this._view = "day"), Qo(s);
      const [r, n] = s === "tall" ? [900, 1280] : [1280, 800], c = t > 0 ? t : s === "phone" ? Math.min(1.25, Math.max(0.8, i / 430)) : Math.min(1.6, Math.max(0.6, Math.min(i / r, o / n)));
      Math.abs(c - this._z) > 0.01 && (this._z = Math.round(c * 100) / 100, this.requestUpdate());
    }, this._z = 1, this._touched = () => {
      this._lastTouch = Date.now(), this._idle && (this._idle = !1);
    }, this._clip = {};
  }
  /** The child whose page is open, and his settings (config defaults + what a grown-up changed on the panel). */
  get _kidOn() {
    return this._page === "kid" ? this._config?.kids?.[this._kid] : void 0;
  }
  get _kp() {
    const t = this._kidOn;
    return t ? Ei(t) : void 0;
  }
  /** The look on screen right now: a child's own look on his page, otherwise the panel's. */
  get _lk() {
    const t = this._kp;
    return t && t.look !== "panel" ? L(t.look).id : this._look;
  }
  _optOn(t) {
    return this._kp && t.id === "hand" ? this._kp.font === "hand" : !!this._opts[t.id];
  }
  _setKidPref(t) {
    const a = this._kidOn;
    a && (Do(a.name, t), this._prefTick++, N("tap"));
  }
  /** Looks and settings are for grown-ups when a PIN is set. */
  _openLooks() {
    const t = this._kidOn, a = () => {
      this._sheet = t ? "kidprefs" : "themes";
    };
    this._config.parent_pin ? this._pinAsk = { reason: t ? `Change ${t.name}’s settings?` : "Change the look?", run: a } : a();
  }
  willUpdate() {
    this._config && (this._lk !== et() && Za(this._lk), Jo(this._kp ? { full: 1, soft: 0.35, off: 0 }[this._kp.sound] : 1));
  }
  setConfig(t) {
    if (!t) throw new Error("Family Hub: missing configuration");
    for (const o of t.kids ?? []) if (!o.name) throw new Error("Family Hub: every kid needs a name");
    for (const o of t.calendars ?? []) if (!o.entity?.startsWith("calendar.")) throw new Error(`Family Hub: "${o.entity}" isn't a calendar entity`);
    if (t.parent_pin !== void 0 && !/^\d{4,8}$/.test(String(t.parent_pin))) throw new Error("Family Hub: parent_pin should be 4–8 digits (put it in quotes)");
    this._config = t;
    let a = null;
    try {
      a = localStorage.getItem(Ne);
    } catch {
    }
    this._theme = $t(a || t.theme || "sea").id;
    let i = null;
    try {
      i = localStorage.getItem($i);
    } catch {
    }
    this._look = L(i || t.look).id, Za(this._look);
    try {
      this._opts = JSON.parse(localStorage.getItem(te) || "{}") ?? {};
    } catch {
      this._opts = {};
    }
    this._morningWindow() && (this._page = "morning"), this._onResize();
  }
  getCardSize() {
    return 12;
  }
  static getStubConfig() {
    return { type: "custom:family-hub-card", family_name: "everyone", theme: "sea" };
  }
  connectedCallback() {
    super.connectedCallback(), Le("Inter", "Bricolage Grotesque"), this._tick = window.setInterval(() => this._onTick(), 1e3), this._poll = window.setInterval(() => {
      this._fetchedKey = "", this._refresh(), this._loadSoon();
    }, 5 * 6e4), this.addEventListener("pointerdown", this._touched, { capture: !0 }), window.addEventListener("resize", this._onResize), this._onResize(), this._ro = new ResizeObserver(() => this._onResize()), this._ro.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), window.removeEventListener("resize", this._onResize), this._ro?.disconnect(), clearInterval(this._tick), clearInterval(this._poll), clearInterval(this._photoTimer), this._photoTimer = void 0, this._photos = [], this.removeEventListener("pointerdown", this._touched, { capture: !0 });
  }
  _onTick() {
    const t = /* @__PURE__ */ new Date();
    if ((this._timerLeft() !== null || this._dinner || this._undo || t.getSeconds() % 15 === 0) && (this._now = t), this._undo && Date.now() > this._undo.until && (this._undo = null), t.getSeconds() % 15) return;
    Io(ha(t, this._config?.quiet?.start ?? "20:00", this._config?.quiet?.end ?? "06:30"));
    const i = Date.now() - this._lastTouch;
    !this._idle && i > 6e4 && (this._idle = !0);
    const o = (this._config?.idle_seconds ?? 180) * 1e3, s = this._morningWindow() ? "morning" : "planner";
    o > 0 && i > o && (this._page !== s || this._sheet) && (this._page = s, this._sheet = "", this._view = "week", this._anchor = /* @__PURE__ */ new Date());
    const r = da(t);
    r !== this._dayKey && (this._dayKey = r, i > o && (this._anchor = /* @__PURE__ */ new Date()), this._fetchedKey = "", this._refresh(), this._loadSoon());
  }
  /** Pass fresh hass to the open page without re-rendering the whole card. */
  shouldUpdate(t) {
    if (t.size === 1 && t.has("hass") && this._config) {
      const a = t.get("hass");
      return this.renderRoot?.querySelectorAll(mr).forEach((i) => {
        i.hass = this.hass;
      }), Ri(a, this.hass, this._watch());
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
      ...(t.people ?? []).map((a) => a.entity),
      ...(t.kids ?? []).map((a) => E(a).avatar),
      ...(t.meds ?? []).flatMap((a) => [`input_datetime.fh_med_${a.id}`, `input_text.fh_med_${a.id}_by`])
    ].filter((a) => !!a);
  }
  updated(t) {
    (t.has("hass") || t.has("_view") || t.has("_anchor")) && this._refresh(), t.has("hass") && this._checkAlarm();
    const a = this.renderRoot.querySelector(".fh");
    if (a) for (const i of L(this._lk).options ?? []) a.toggleAttribute(`data-opt-${i.id}`, this._optOn(i));
    this._page === "planner" && this._view === "week" && this._measureWeek(), this.renderRoot.querySelectorAll(".scrolly").forEach(Z);
  }
  /** Short labels for everyone on the panel, kept distinct ("Ju" and "Ja" rather than two "J"s). */
  get _short() {
    const t = this._config;
    return Qt([
      ...(t.people ?? []).map((a) => a.name),
      ...(t.kids ?? []).map((a) => a.name),
      ...(t.calendars ?? []).map((a) => a.name ?? this.hass?.states[a.entity]?.attributes.friendly_name ?? a.entity)
    ]);
  }
  /** The person chip: their colour and their initial, so colour is never the only cue. */
  _chip(t, a, i = !1) {
    return l`<span class="init ${i ? "sm" : ""}" style="--c:${T(a)}" role="img" aria-label=${t}>${this._short[t] ?? (t[0] ?? "").toUpperCase()}</span>`;
  }
  _measureWeek() {
    const t = {};
    this.renderRoot.querySelectorAll(".evs").forEach((a) => {
      const i = [...a.querySelectorAll(":scope > .ev")];
      for (const n of i)
        n.style.display = "", n.style.visibility = "";
      let o = 0;
      for (const n of i) {
        if (a.scrollHeight <= a.clientHeight + 1) break;
        n.classList.contains("past") && (n.style.display = "none", o++);
      }
      const s = a.clientHeight;
      let r = !1;
      for (const n of i) {
        if (n.style.display === "none") continue;
        const c = r || n.offsetTop + n.offsetHeight > s + 1;
        n.style.visibility = c ? "hidden" : "", c && (o++, r = !0);
      }
      o && (t[a.dataset.day] = o);
    }), JSON.stringify(t) !== JSON.stringify(this._clip) && (this._clip = t, this.requestUpdate());
  }
  // ---------- data ----------
  _range() {
    if (this._view === "day") {
      const a = P(this._anchor);
      return [a, M(a, 1)];
    }
    if (this._view === "month") {
      const a = Ue(this._anchor);
      return [a, M(a, 42)];
    }
    const t = zt(this._anchor);
    return [t, M(t, 7)];
  }
  _refresh() {
    if (!this.hass || !this._config) return;
    const [t, a] = this._range(), i = `${this._view}|${t.toISOString()}`;
    if (i === this._fetchedKey) return;
    const o = !this._fetchedKey && !this._dayKey;
    this._fetchedKey = i, this._loadEvents(t, a).then((s) => {
      s && (this._events = s);
    }), this._loadWeather(), this._loadReminders(), (o || !this._soon.length) && this._loadSoon(), this._config.photos && !this._photos.length && !this._photoTimer && this._loadPhotos();
  }
  async _loadSoon() {
    const t = P(/* @__PURE__ */ new Date()), a = await this._loadEvents(t, M(t, 3), !0);
    a && (this._soon = a);
  }
  async _loadPhotos() {
    const t = this.hass, a = this._config.photos;
    this._photoTimer = window.setInterval(() => this._nextPhoto(), (this._config.photo_minutes ?? 10) * 6e4);
    try {
      const i = await t.callWS({ type: "media_source/browse_media", media_content_id: a });
      this._photos = i.children.filter((o) => o.media_class === "image").map((o) => o.media_content_id);
      for (let o = this._photos.length - 1; o > 0; o--) {
        const s = Math.floor(Math.random() * (o + 1));
        [this._photos[o], this._photos[s]] = [this._photos[s], this._photos[o]];
      }
      this._nextPhoto();
    } catch (i) {
      console.warn("Family Hub: photo folder not found", a, i);
    }
  }
  async _nextPhoto() {
    if (!this._photos.length || !this.hass) return;
    const t = this._photos[this._photoIdx++ % this._photos.length];
    try {
      const a = await this.hass.callWS({ type: "media_source/resolve_media", media_content_id: t }), i = new Image();
      i.onload = () => {
        this._photo = a.url;
      }, i.src = a.url;
    } catch {
    }
  }
  async _loadEvents(t, a, i = !1) {
    const o = this._config.calendars ?? [];
    if (!o.length || !this.hass) return [];
    const s = i ? 0 : ++this._fetchGen, r = [];
    let n = 0;
    return await Promise.all(o.map(async (c) => {
      try {
        const p = await this.hass.callApi("GET", `calendars/${c.entity}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(a.toISOString())}`), d = c.name ?? this.hass.states[c.entity]?.attributes.friendly_name ?? c.entity;
        for (const h of p) {
          const m = !!h.start?.date, f = m ? /* @__PURE__ */ new Date(`${h.start.date}T00:00:00`) : new Date(h.start.dateTime), x = m ? /* @__PURE__ */ new Date(`${h.end.date}T00:00:00`) : new Date(h.end.dateTime);
          r.push({ title: h.summary ?? "(busy)", start: f, end: x, allDay: m, colour: c.colour, who: d });
        }
      } catch (p) {
        n++, console.warn("Family Hub: calendar fetch failed", c.entity, p);
      }
    })), this._calError = n === o.length, !i && s !== this._fetchGen ? null : (r.sort((c, p) => Number(p.allDay) - Number(c.allDay) || c.start.getTime() - p.start.getTime()), r);
  }
  async _loadWeather() {
    const t = this._config.weather;
    if (!(!t || !this.hass?.states[t]))
      try {
        const i = (await this.hass.callWS({ type: "call_service", domain: "weather", service: "get_forecasts", service_data: { type: "daily" }, target: { entity_id: t }, return_response: !0 }))?.response?.[t]?.forecast?.[0];
        this._wx = { max: i?.temperature, min: i?.templow, uv: i?.uv_index, rain: i?.precipitation };
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
      const a = await this.hass.callWS({ type: "todo/item/list", entity_id: t });
      this._reminders = a.items.filter((i) => i.status === "needs_action").slice(0, 5);
    } catch {
      this._reminders = [];
    }
  }
  _private(t) {
    const a = t.toLowerCase();
    return (this._config.private ?? []).some((i) => a.includes(i.toLowerCase()));
  }
  _eventsOn(t, a = this._events) {
    const i = P(t), o = M(i, 1);
    return a.filter((s) => s.start < o && s.end > i && !(s.allDay && s.end.getTime() === i.getTime()));
  }
  _morningWindow(t = /* @__PURE__ */ new Date()) {
    const a = this._config, i = a?.morning;
    return !i || !a.kids?.length ? !1 : _i(t, a.school_terms, a.public_holidays) && be(t, i.start ?? "06:30", i.end ?? "08:45");
  }
  _termLabel(t = /* @__PURE__ */ new Date()) {
    const a = da(t), i = this._config.school_terms ?? [], o = i.findIndex(([c, p]) => a >= c && a <= p);
    if (o < 0) return _i(t, i, this._config.public_holidays) ? "School day" : "Holidays";
    const s = /* @__PURE__ */ new Date(`${i[o][0]}T00:00:00`), r = Math.floor((zt(t).getTime() - zt(s).getTime()) / (7 * 864e5)) + 1, n = s.getMonth();
    return `Term ${n <= 2 ? 1 : n <= 5 ? 2 : n <= 8 ? 3 : 4}, week ${r}`;
  }
  // ---------- timer, alarm, meds ----------
  _timerLeft() {
    const t = this.hass?.states["timer.kitchen"];
    if (!t) return null;
    if (t.state === "active" && t.attributes.finishes_at) return Math.max(0, new Date(t.attributes.finishes_at).getTime() - Date.now());
    if (t.state === "paused" && t.attributes.remaining) {
      const [a, i, o] = String(t.attributes.remaining).split(":").map(Number);
      return ((a * 60 + i) * 60 + o) * 1e3;
    }
    return null;
  }
  /** Share of the timer still to run (falls back to a 10-minute scale). */
  _timerFrac(t) {
    if (t === null) return 0;
    const a = String(this.hass?.states["timer.kitchen"]?.attributes.duration ?? ""), [i, o, s] = a.split(":").map(Number), r = a && Number.isFinite(s) ? ((i * 60 + o) * 60 + s) * 1e3 : 6e5;
    return t / Math.max(r, t, 1);
  }
  _addTimer(t) {
    this.hass?.callService("script", "fh_timer_add", { minutes: t }), N("tap");
  }
  _checkAlarm() {
    const t = La(this.hass);
    if (t?.alarm && t.ts && t.ts !== this._alarmSeen && Date.now() / 1e3 - t.ts < 120) {
      this._alarmSeen = t.ts, this._alarm = t.ts, N("alarm");
      let a = 0;
      const i = window.setInterval(() => {
        if (!this._alarm || ++a > 12) {
          clearInterval(i), this._alarm = 0;
          return;
        }
        N("alarm");
      }, 5e3);
    }
  }
  _medStatus(t, a) {
    const i = this.hass?.states[`input_datetime.fh_med_${t}`], o = i?.attributes.timestamp ? new Date(i.attributes.timestamp * 1e3) : null, s = o && Q(o, /* @__PURE__ */ new Date()) ? o : null, r = ut(this._now), n = I(a);
    return { given: s, by: this.hass?.states[`input_text.fh_med_${t}_by`]?.state ?? "", due: !s && r >= n - 60, late: !s && r > n + 45 };
  }
  _giveMed(t, a) {
    const i = this.hass;
    i.callService("input_datetime", "set_datetime", { entity_id: `input_datetime.fh_med_${t}`, timestamp: Math.floor(Date.now() / 1e3) }), i.callService("input_text", "set_value", { entity_id: `input_text.fh_med_${t}_by`, value: a }), i.callService("persistent_notification", "dismiss", { notification_id: `fh_meds_${t.split("_").pop()}` }).catch(() => {
    }), N("tick"), this._say(`Logged – given by ${a}`);
  }
  // ---------- actions ----------
  /** Toasts stay long enough for a slow reader: at least 4.5 s, longer for longer messages. */
  _say(t, a = Math.max(4500, t.split(/\s+/).length * 450)) {
    this._toast = t, clearTimeout(this._toastTimer), this._toastTimer = window.setTimeout(() => {
      this._toast = "";
    }, a);
  }
  _setTheme(t) {
    this._theme = t, N("tap");
    try {
      localStorage.setItem(Ne, t);
    } catch {
    }
  }
  _setLook(t) {
    this._look = t, Za(t), N("tap");
    try {
      localStorage.setItem($i, t);
    } catch {
    }
  }
  _toggleOpt(t) {
    this._opts = { ...this._opts, [t]: !this._opts[t] }, N("tap");
    try {
      localStorage.setItem(te, JSON.stringify(this._opts));
    } catch {
    }
  }
  _shift(t) {
    const a = this._anchor;
    this._anchor = this._view === "day" ? M(a, t) : this._view === "week" ? M(a, 7 * t) : new Date(a.getFullYear(), a.getMonth() + t, 1);
  }
  _allOn() {
    const t = this._config.all_on;
    this.hass?.callService("light", "turn_on", { entity_id: t?.length ? t : "all" }), N("tap"), this._say(t?.length ? "Living areas on" : "All lights on");
  }
  _allOff() {
    const t = Object.values(this.hass?.states ?? {}).filter((a) => a.entity_id.startsWith("light.") && a.state === "on").map((a) => a.entity_id);
    if (!t.length) {
      this._say("Everything’s already off");
      return;
    }
    this.hass?.callService("light", "turn_off", { entity_id: t }), N("untick"), this._undo = { ids: t, until: Date.now() + 1e4 };
  }
  _undoOff() {
    this._undo && (this.hass?.callService("light", "turn_on", { entity_id: this._undo.ids }), this._undo = null, this._say("Back on"));
  }
  /** A timed job tagged @song: play the tidy-up song on the child's speaker for that long, then fade it out. */
  _tidySong(t, a) {
    const i = this.hass, o = i ? Xe(i, this._config.music_players ?? []) : [], s = i && (Pe(i, t, o) ?? lt(i, o, this._config.music_player) ?? o[0]);
    if (!i || !s) return;
    if (!a) {
      i.callService("media_player", "media_pause", { entity_id: s.entity_id });
      return;
    }
    const r = t.tidy_song ?? this._config.tidy_song;
    if (!r) {
      this._say("Set tidy_song in the card settings to add music to this job");
      return;
    }
    Gt(i, s.entity_id, r, "play").then(() => hi(i, s.entity_id, a)).catch(() => this._say(`${s.attributes.friendly_name} couldn’t play the tidy-up song`));
  }
  _dinnerStart() {
    if (Date.now() < this._dinnerCooldown) {
      this._say("Already called – give them a minute");
      return;
    }
    N("tap");
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
    this.hass.callService("script", "turn_on", { entity_id: t }), this._dinnerCooldown = Date.now() + 6e4, N("done"), this._say("Calling everyone for dinner 🍽️");
  }
  _media(t) {
    const a = this._config.music_player;
    a && this.hass?.callService("media_player", t, { entity_id: a });
  }
  _assist() {
    this.dispatchEvent(new CustomEvent("hass-action", { bubbles: !0, composed: !0, detail: { config: { tap_action: { action: "assist", start_listening: !0 } }, action: "tap" } }));
  }
  _openKid(t) {
    const a = (this._config.kids ?? []).findIndex((i) => i.name === t);
    a >= 0 && (this._kid = a, this._page = "kid");
  }
  // ---------- render ----------
  render() {
    if (!this._config) return u;
    const t = this._page === "kid" ? this._config.kids?.[this._kid] : void 0, a = $t(t?.theme ?? this._theme), i = this._isNight(), s = L(this._lk).themed ? `${ta(a)}${this._photo ? `;--bg:url('${this._photo}')` : ""};` : "", r = this._now.getHours(), n = r >= 21 || r < 6 ? "night" : r >= 18 ? "eve" : "day", c = this._kp, p = this._config.calm === !1 ? !1 : c ? c.calm : this._config.calm === !0, d = this._now.getHours(), h = d < 5 || d >= 21 ? "rgba(10,20,60,.28)" : d < 7 ? "rgba(255,170,150,.16)" : d >= 17 && d < 19 ? "rgba(255,150,60,.14)" : d >= 19 ? "rgba(30,40,110,.2)" : "transparent", m = /rain|pour|storm|lightning/.test(this.hass?.states[this._config.weather ?? ""]?.state ?? "");
    return i ? l`<div class="fh" lang="en-AU" data-tod="night" style=${`${s}--z:${this._z}`}>${this._night()}</div>` : l`
      <div lang="en-AU" class="fh ${this._idle ? "idle" : ""} ${m ? "rainy" : ""}" data-tod=${n} ?data-calm=${p} style=${`${s}--tod:${h};--z:${this._z}`}>
        ${this._config.ambient === !1 || this._photo ? u : l`<fh-ambient .look=${this._lk} .theme=${a.id} .tod=${n} .calm=${p} .demo=${this._config.ambient_demo ?? ""}></fh-ambient>`}
        ${this._header()}
        <div class="body">${this._body()}</div>
        ${this._dock()}
        ${this._sheetView()}
        ${this._dinner ? this._dinnerView() : u}
        ${this._undo ? l`<div class="toast" role="status" style="display:flex;align-items:center;gap:14px">Lights off <button class="pill tap" style="height:36px;background:#fff;color:#111" @click=${() => this._undoOff()}>Undo</button></div>` : this._toast ? l`<div class="toast" role="status">${this._toast}</div>` : u}
        ${this._alarm ? this._alarmView() : u}
        ${this._pinAsk ? l`<fh-pin .pin=${String(this._config.parent_pin ?? "")} reason=${this._pinAsk.reason} @ok=${() => {
      const f = this._pinAsk.run;
      this._pinAsk = null, f();
    }} @cancel=${() => {
      this._pinAsk = null;
    }}></fh-pin>` : u}
      </div>`;
  }
  _body() {
    const t = this._config, a = (t.calendars ?? []).filter((i) => i.colour === "family").map((i) => i.entity);
    switch (this._page) {
      case "groceries":
        return l`<fh-groceries .hass=${this.hass} .entity=${t.groceries ?? "todo.shopping_list"} .usuals=${t.grocery_usuals ?? ["Milk", "Bread", "Eggs", "Bananas", "Cheese", "Coffee"]} .recipients=${t.grocery_recipients ?? []}></fh-groceries>`;
      case "kid": {
        const i = t.kids?.[this._kid];
        if (!i) break;
        const o = ha(this._now, t.quiet?.start ?? "20:00", t.quiet?.end ?? "06:30");
        return l`<fh-kid .hass=${this.hass} .kid=${i} .familyCalendars=${a} .pin=${String(t.parent_pin ?? "")} .owed=${"todo.rewards_owed"}
          .jarTarget=${t.jar?.target ?? 120} .jarReward=${t.jar?.reward ?? "a family treat"} .privateWords=${t.private ?? []} .quiet=${o} .oneAtATime=${Ei(i).focus} @song=${(s) => this._tidySong(i, s.detail.minutes)}></fh-kid>`;
      }
      case "home":
        return l`<fh-home .hass=${this.hass} .pin=${String(t.parent_pin ?? "")} .hide=${t.home_hide ?? []} .hideScripts=${t.announce_script ? [t.announce_script] : []}
        @say=${(i) => this._say(i.detail)} @music=${(i) => {
          this._musicFocus = i.detail, this._page = "music";
        }}></fh-home>`;
      case "music":
        return l`<fh-music .hass=${this.hass} .players=${t.music_players ?? []} .stations=${t.radio ?? []} .source=${t.radio_source ?? "media-source://radio_browser/country/AU"} .preferred=${this._musicFocus || (t.music_player ?? "")}
        .kids=${t.kids ?? []} .people=${t.people ?? []} .pin=${String(t.parent_pin ?? "")} .quiet=${t.quiet ?? {}} .sleepMinutes=${t.music_sleep_minutes ?? 30} .map=${t.music_map ?? []} .hide=${t.music_hide ?? []} .moments=${t.music_moments ?? []} .lock=${t.music_lock !== !1} .callVolume=${t.call_volume ?? 70} .callLanguage=${t.call_language ?? "en-AU"} .callVoice=${t.call_voice ?? ""} .theme=${this._theme}></fh-music>`;
      case "doodle":
        return l`<fh-doodle .hass=${this.hass} .artists=${(t.kids ?? []).map((i) => i.name)}></fh-doodle>`;
      case "morning":
        return l`<fh-morning .hass=${this.hass} .kids=${t.kids ?? []} .events=${this._soon} .leaveBy=${t.morning?.leave_by ?? "08:15"} .rules=${t.bring_rules ?? []}
        .privateWords=${t.private ?? []} .uv=${this._wx.uv ?? 0} .termLabel=${this._termLabel()} .travel=${t.morning?.travel ?? 15} @open-kid=${(i) => this._openKid(i.detail)}></fh-morning>`;
    }
    return l`${this._planner()}${this._aside()}`;
  }
  _isNight() {
    if (this._nightManual) return !0;
    const t = this._config.night;
    return !t || this._alarm ? !1 : be(this._now, t.start, t.end) && Date.now() > this._awakeUntil;
  }
  /** One fixed row of at most two chips, most urgent first, so the header never changes height. */
  _capsule() {
    const t = this._config, a = [], i = this._timerLeft();
    if (i !== null && (this._page !== "planner" || i < 6e4)) {
      const c = Math.floor(i / 6e4), p = Math.floor(i % 6e4 / 1e3);
      a.push([1, l`<button class="cap tap ${i < 6e4 ? "hot" : ""}" aria-label="Kitchen timer, ${c} minutes ${p} seconds left" @click=${() => {
        this._sheet = "timer";
      }}>⏲ <b>${c}:${String(p).padStart(2, "0")}</b></button>`]);
    }
    const o = La(this.hass);
    o && !o.alarm && a.push([4, l`<span class="cap">${o.t}</span>`]);
    for (const c of t.meds ?? []) {
      const p = this._medStatus(c.id, c.time);
      p.due ? a.push([p.late ? 0 : 2, l`<button class="cap tap ${p.late ? "hot" : ""}" @click=${() => {
        this._sheet = "meds";
      }}>💊 ${p.late ? "Overdue" : "Due"} ${c.time}</button>`]) : p.given && this._now.getHours() < 12 && a.push([5, l`<button class="cap tap ok" @click=${() => {
        this._sheet = "meds";
      }}>💊 ✓ ${B(p.given)}</button>`]);
    }
    const s = Date.now(), r = this._soon.find((c) => !c.allDay && c.start.getTime() > s && c.start.getTime() - s < 12 * 36e5 && !this._private(c.title));
    if (r) {
      const c = Math.round((r.start.getTime() - s) / 6e4), p = c < 60 ? `in ${c} min` : `${Q(r.start, /* @__PURE__ */ new Date()) ? "" : "Tomorrow "}${B(r.start)}`;
      a.push([3, l`<span class="cap evcap">${this._chip(r.who, r.colour)}<span class="ell">${r.title}</span><span style="white-space:nowrap">· ${p}</span></span>`]);
    }
    const n = t.music_player ? this.hass?.states[t.music_player] : void 0;
    return n?.state === "playing" && this._page !== "music" && this._page !== "planner" && a.push([6, l`<button class="cap tap" @click=${() => {
      this._page = "music";
    }}>♪ ${n.attributes.media_title ?? "Playing"}</button>`]), l`<div class="capsule" aria-live="polite">${a.sort((c, p) => c[0] - p[0]).slice(0, 2).map((c) => c[1])}</div>`;
  }
  /** On a child's page: only his own next event (and the kitchen timer in its last minute). */
  _kidCapsule(t) {
    const a = Date.now(), i = [], o = this._timerLeft();
    o !== null && o < 6e4 && i.push(l`<button class="cap tap hot" @click=${() => {
      this._sheet = "timer";
    }}>⏲ <b>0:${String(Math.floor(o / 1e3)).padStart(2, "0")}</b></button>`);
    const s = t.name.toLowerCase(), r = this._soon.find((n) => !n.allDay && n.start.getTime() > a && n.start.getTime() - a < 12 * 36e5 && !this._private(n.title) && (n.who === t.name || n.title.toLowerCase().includes(s)));
    if (r) {
      const n = Math.round((r.start.getTime() - a) / 6e4), c = n < 60 ? `in ${n} min` : `${Q(r.start, /* @__PURE__ */ new Date()) ? "" : "Tomorrow "}${B(r.start)}`;
      i.push(l`<span class="cap evcap">${this._chip(t.name, t.colour)}<span class="ell">Next: ${r.title}</span><span style="white-space:nowrap">· ${c}</span></span>`);
    }
    return l`<div class="capsule" aria-live="polite">${i}</div>`;
  }
  _header() {
    const t = this._config, a = this.hass, i = this._now, o = xe(i), s = t.weather ? a?.states[t.weather] : void 0, r = s?.attributes.temperature, n = this._wx, c = this._kidOn;
    return l`
      <header>
        <div class="clock">
          ${X(this._lk, "clock", { now: i, arcs: this._arcs(this._eventsOn(i, this._soon)) })}
          <span style="font-size:16px;font-weight:var(--w-semi, 600)" class="muted">${vs(i)}${c ? `, ${c.name}` : t.family_name ? `, ${t.family_name}` : ""}</span>
          <span style="display:flex;align-items:baseline;gap:10px"><span class="display hm">${o.hm}</span><span class="muted" style="font-size:16px;font-weight:var(--w-semi, 600)">${o.ampm} · ${Ss(i)}</span></span>
        </div>
        ${c ? this._kidCapsule(c) : this._capsule()}
        <div class="right">
          ${s && !c ? l`
            <div class="glass weather">
              <span style="color:var(--accent)">${F(ms(s.state), 28)}</span>
              <span style="display:flex;flex-direction:column;line-height:1.15">
                <span style="font-weight:var(--w-bold, 700);font-size:20px">${r !== void 0 ? `${Math.round(r)}°` : "–"}${n.max !== void 0 ? l`<span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)"> · top ${Math.round(n.max)}°</span>` : u}</span>
                <span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)">${hr[s.state] ?? s.state}${n.rain ? ` · ${n.rain} mm` : ""}</span>
              </span>
              ${(n.uv ?? 0) >= 3 ? l`<span class="badge" title="UV ${n.uv}">🧢 UV ${Math.round(n.uv)}</span>` : u}
              ${(n.max ?? 0) >= 35 ? l`<span class="badge hot">🥵 Hot</span>` : u}
            </div>` : u}
          ${(t.people ?? []).length && !c ? l`
            <div class="glass presence" role="list" aria-label="Who is home">
              ${t.people.map((p) => {
      const d = p.entity ? a?.states[p.entity]?.state === "home" : !0;
      return l`<span class="avatar ${d ? "" : "away"}" role="listitem" aria-label="${p.name}, ${d ? "home" : "away"}" title="${p.name} – ${d ? "home" : "away"}" style="--c:${T(p.colour)}">${this._short[p.name] ?? p.name[0]}</span>`;
    })}
            </div>` : u}
          ${c ? u : l`<button class="glass tap round" style="width:52px;height:52px" data-act="assist" aria-label="Ask Home Assistant" @click=${() => this._assist()}>${F("mic", 22)}</button>`}
          <button class="glass tap round" style="width:52px;height:52px" data-act="looks" aria-label=${c ? `${c.name}’s settings` : "Looks and themes"} @click=${() => this._openLooks()}>${F("palette")}</button>
          ${t.babysitter && !c ? l`<button class="glass tap round" style="width:52px;height:52px;font-size:20px" aria-label="House info" @click=${() => {
      this._sheet = "sitter";
    }}>ℹ️</button>` : u}
          <button class="glass tap round" style="width:52px;height:52px" data-act="night" aria-label="Night mode" @click=${() => {
      this._nightManual = !0;
    }}>${F("moon")}</button>
        </div>
      </header>`;
  }
  _planner() {
    const t = this._view, [a, i] = this._range(), o = t === "week" ? ["This week", ws(a, M(i, -1))] : t === "day" ? [Q(a, /* @__PURE__ */ new Date()) ? "Today" : Yt(a), Ia(a)] : [this._anchor.toLocaleDateString("en-AU", { month: "long" }), String(this._anchor.getFullYear())];
    t === "week" && !Q(zt(/* @__PURE__ */ new Date()), a) && (o[0] = "Week of");
    const s = this._config.calendars ?? [];
    return l`
      <section class="glass planner" aria-label="Family planner">
        <div class="bar">
          <div style="display:flex;flex-direction:column;line-height:1.15;min-width:190px">
            <h1 class="t-title">${o[0]}</h1>
            <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${o[1]}</span>
          </div>
          <button class="round tap" aria-label="Previous" @click=${() => this._shift(-1)}>${F("left", 20)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._shift(1)}>${F("right", 20)}</button>
          <button class="pill tap" @click=${() => {
      this._anchor = /* @__PURE__ */ new Date();
    }}>Today</button>
          <button class="pill tap" @click=${() => {
      this._sheet = "add";
    }}>${F("plus", 18)}Add</button>
          <span style="flex:1"></span>
          <div class="seg" role="group" aria-label="View">
            ${["day", "week", "month"].map((r) => l`<button class="tap" aria-pressed=${String(t === r)} @click=${() => {
      this._view = r;
    }}>${r[0].toUpperCase() + r.slice(1)}</button>`)}
          </div>
        </div>
        ${s.length ? l`<div class="legend">${s.map((r) => {
      const n = r.name ?? this.hass?.states[r.entity]?.attributes.friendly_name ?? r.entity;
      return l`<span style="display:flex;align-items:center;gap:6px">${this._chip(n, r.colour)}${n}</span>`;
    })}</div>` : u}
        ${this._calError ? l`<button class="pill tap" style="background:#fee2e2;color:#7f1d1d;align-self:flex-start" @click=${() => {
      location.reload();
    }}>Calendars couldn’t load – tap to reload</button>` : u}
        ${s.length ? t === "week" ? this._week(a) : t === "day" ? this._day(a) : this._month() : l`<div class="empty"><span style="color:var(--accent)">${F("calendar", 40)}</span><h2 class="t-sub">Connect your calendars</h2><span>Add Google Calendar in Home Assistant, then list the calendars in this card's settings.</span></div>`}
      </section>`;
  }
  _arcs(t) {
    return t.filter((a) => !this._private(a.title)).map((a) => ({ start: a.start, end: a.end, allDay: a.allDay, colour: T(a.colour) }));
  }
  /** 'past' once an event has finished today, 'next' for the next thing coming up. */
  _evState(t) {
    const a = Date.now();
    if (!t.allDay && t.end.getTime() < a) return "past";
    const i = this._soon.find((o) => !o.allDay && o.start.getTime() > a && o.start.getTime() - a < 12 * 36e5 && !this._private(o.title));
    return i && i.title === t.title && i.start.getTime() === t.start.getTime() ? "next" : "";
  }
  _evCard(t) {
    return this._private(t.title) ? l`<div class="ev priv"><span class="t">${t.allDay ? "" : B(t.start)}</span><span>💊</span></div>` : l`<div class="ev ${this._evState(t)}" style="--c:${T(t.colour)}">
      <span class="t">${t.allDay ? "All day" : B(t.start)}</span>
      <span class="n content">${t.title}</span>
      <span class="w">${t.who}</span>
    </div>`;
  }
  _week(t) {
    const a = /* @__PURE__ */ new Date(), i = Array.from({ length: 7 }, (s, r) => M(t, r)), o = i.map((s) => Q(s, a) ? "1.4fr" : "1fr").join(" ");
    return l`<div class="week fade" style="grid-template-columns:${o}">
      ${i.map((s) => {
      const r = this._eventsOn(s), n = Q(s, a), c = r.filter((m) => !this._private(m.title)), p = r.filter((m) => this._private(m.title)), d = da(s), h = this._clip[d] ?? 0;
      return l`<div class="col ${n ? "today" : ""}">
          <div class="dayhead"><span class="muted" style="font-size:14px;font-weight:var(--w-bold, 700)">${Yt(s)}</span><span class="num">${s.getDate()}</span>${X(this._lk, "day", { arcs: this._arcs(c) })}${p.length ? l`<span class="pchip" title="Private reminder">💊</span>` : u}</div>
          <div class="evs" data-day=${d}>${c.map((m) => this._evCard(m))}</div>
          ${h ? l`<button class="more tap" @click=${() => {
        this._anchor = s, this._view = "day";
      }}>+${h} more</button>` : u}
        </div>`;
    })}
    </div>`;
  }
  _day(t) {
    const a = this._eventsOn(t), i = Q(t, /* @__PURE__ */ new Date()), o = l`<div class="daylist fade scrolly" data-fits @scroll=${Z}>
      ${a.length ? a.map((r) => this._private(r.title) ? l`<div class="dayrow" style="opacity:.7"><span style="width:90px;font-size:16px;font-weight:var(--w-semi, 600)" class="muted">${r.allDay ? "All day" : B(r.start)}</span><span style="font-size:18px">💊 Private</span></div>` : l`
        <div class="dayrow ${this._evState(r)}" style="--c:${T(r.colour)}">
          <span style="width:90px;font-size:16px;font-weight:var(--w-bold, 700)" class="muted">${r.allDay ? "All day" : B(r.start)}</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:3px"><span class="content" style="font-size:20px;font-weight:var(--w-bold, 700)">${r.title}</span>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600);display:flex;align-items:center;gap:6px">${this._chip(r.who, r.colour, !0)}${r.who}</span></span>
        </div>`) : l`<div class="empty"><h2 class="t-sub">Nothing on</h2><span>A free day!</span></div>`}
    </div>`, s = X(this._lk, "dayview", { arcs: this._arcs(a), now: i ? this._now : void 0, size: 340 });
    return s === u ? o : l`<div class="dayview fade"><div class="dayart">${s}</div>${o}</div>`;
  }
  _month() {
    const t = Ue(this._anchor), a = this._anchor.getMonth(), i = /* @__PURE__ */ new Date();
    return l`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px" class="fade">
      <div class="mhead">${Array.from({ length: 7 }, (o, s) => l`<span>${Yt(M(t, s))}</span>`)}</div>
      <div class="month">
        ${Array.from({ length: 42 }, (o, s) => M(t, s)).map((o) => {
      const s = this._eventsOn(o).filter((n) => !this._private(n.title)), r = Q(o, i);
      return l`<button class="cell tap ${o.getMonth() !== a ? "out" : ""} ${r ? "today" : ""}" style="text-align:left" aria-label="${Ia(o)}${r ? ", today" : ""}, ${s.length ? `${s.length} event${s.length > 1 ? "s" : ""}` : "nothing on"}" @click=${() => {
        this._anchor = o, this._view = "day";
      }}>
            <span style="font-size:14px;font-weight:var(--w-bold, 700)">${o.getDate()}</span>
            ${s.slice(0, 2).map((n) => l`<span class="mev">${this._chip(n.who, n.colour, !0)}${n.title}</span>`)}
            ${s.length > 2 ? l`<span class="mev muted">+${s.length - 2}</span>` : u}
          </button>`;
    })}
      </div>
    </div>`;
  }
  _aside() {
    const t = this._config, a = t.music_player ? this.hass?.states[t.music_player] : void 0, i = a?.state === "playing", o = this._timerLeft(), s = o !== null ? Math.floor(o / 6e4) : 0, r = o !== null ? Math.floor(o % 6e4 / 1e3) : 0, n = nt(this.hass, "input_number.family_jar"), c = t.jar?.target ?? 120;
    return l`<aside>
      ${a ? l`<section class="glass card np ${i ? "playing" : ""}" aria-label="Now playing">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="label">${i ? "Now playing" : "Music"}</span><span class="muted" style="font-size:12px">${a.attributes.friendly_name}</span></div>
        <div class="np-main" style="display:flex;align-items:center;gap:12px">
          <div class="art" style=${a.attributes.entity_picture ? `--pic:url(${a.attributes.entity_picture})` : ""}></div>
          <div class="np-row" style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1">
            <span style="font-size:16px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.attributes.media_title ?? (a.state === "off" ? "Off" : "Nothing playing")}</span>
            <span class="muted" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.attributes.media_artist ?? ""}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:22px">
          <button class="tap" aria-label="Previous track" @click=${() => this._media("media_previous_track")}>${v("prev")}</button>
          <button class="tap primary round" style="width:54px;height:54px" aria-label=${i ? "Pause" : "Play"} @click=${() => this._media("media_play_pause")}>${v(i ? "pause" : "play", 20)}</button>
          <button class="tap" aria-label="Next track" @click=${() => this._media("media_next_track")}>${v("next")}</button>
        </div>
      </section>` : u}

      <section class="glass card" aria-label="Kitchen timer">
        <span class="label">Kitchen timer</span>
        <div class="timerrow ${o !== null ? "on" : ""}">${X(this._lk, "timer", { frac: this._timerFrac(o) })}<span class="display" role="timer" aria-label="Kitchen timer" style="font-size:32px;font-weight:var(--w-bold, 700);font-variant-numeric:tabular-nums">${o !== null ? `${s}:${String(r).padStart(2, "0")}` : "0:00"}</span>
          <span class="muted hint" style="font-size:13px">${o !== null ? "running · beeps everywhere" : "tap to start"}</span>
          ${o !== null ? l`<button class="tap muted" style="margin-left:auto;font-size:14px;font-weight:var(--w-bold, 700)" @click=${() => this.hass?.callService("timer", "cancel", { entity_id: "timer.kitchen" })}>Clear</button>` : u}</div>
        <div class="grid3">${[1, 5, 10].map((p) => l`<button class="tap quick" @click=${() => this._addTimer(p)}>+${p} min</button>`)}</div>
      </section>

      <section class="glass card" aria-label="Reminders" style="flex:1;min-height:0">
        ${this.hass?.states["input_number.family_jar"] ? l`<div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">🫙</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;font-weight:var(--w-bold, 700)">Family jar · ${n >= c ? "full! 🎉" : `${n}/${c}`}</span>
          <div class="xpbar meter"><div style="width:${Math.min(100, n / c * 100)}%"></div></div></span></div>` : u}
        <span class="label">Reminders</span>
        ${this._reminders.length ? this._reminders.map((p) => l`<div class="rem"><span class="ring check"></span><span class="content">${p.summary}</span></div>`) : l`<span class="muted" style="font-size:14px">${t.reminders ? "All done!" : "Pick a to-do list for reminders in the card settings."}</span>`}
      </section>
    </aside>`;
  }
  _dock() {
    const t = (i, o, s, r = !1) => l`<button class="item tap" data-nav=${i} aria-current=${r ? "page" : "false"} @click=${() => {
      N("tap"), s();
    }}>${F(i, 26)}${o}</button>`, a = this._config.kids ?? [];
    return l`<nav class="glass dock" aria-label="Main">
      ${a.map((i, o) => {
      const s = E(i), r = this.hass?.states[s.avatar]?.state, n = r || i.look ? Ft(r, i.look ? Ft(i.look) : {}) : null, c = this._page === "kid" && this._kid === o;
      return l`<button class="item kidbtn tap" style="--kidc:${T(i.colour)}" aria-current=${c ? "page" : "false"} @click=${() => {
        N("tap"), this._kid = o, this._page = "kid";
      }}>
          <span class="avatar" style="width:44px;height:44px;background:${T(i.colour)}">${n ? ct(n, { size: 44, crop: "head", still: !0, label: i.name, age: i.age, ring: T(i.colour) }) : i.name[0]}</span>${i.name}</button>`;
    })}
      ${a.length ? l`<span class="sep" aria-hidden="true"></span>` : u}
      ${this._morningWindow() ? t("sun", "Morning", () => {
      this._page = "morning";
    }, this._page === "morning") : u}
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
      <button class="item tap" data-nav="lights-on" @click=${() => this._allOn()}><span style="color:var(--accent)">${F("bulb", 26)}</span>All on</button>
      <button class="item tap" data-nav="lights-off" @click=${() => this._allOff()}>${F("bulbOff", 26)}All off</button>
      <button class="item tap ${Date.now() < this._dinnerCooldown ? "called" : ""}" data-nav="dinner" @click=${() => this._dinnerStart()}>${F("megaphone", 26)}${Date.now() < this._dinnerCooldown ? "Called ✓" : "Dinner"}</button>
    </nav>`;
  }
  _dinnerView() {
    const t = Math.max(1, Math.ceil(((this._dinner?.at ?? 0) - Date.now()) / 1e3));
    return l`<div class="scrim"><section class="glass sheet" style="width:min(520px,90%);align-items:center;text-align:center" role="alertdialog" aria-label="Calling dinner">
      <span style="font-size:56px">🍽️</span><h2 class="t-head">Calling everyone in ${t}…</h2>
      <span class="muted">${ha(this._now, "19:30", "07:00") ? "Quiet hours: kitchen and lounge only" : "Lounge, kitchen and bedrooms"}</span>
      <button class="pill tap" style="height:56px;padding:0 28px;font-size:17px" @click=${() => this._dinnerCancel()}>Cancel</button></section></div>`;
  }
  _alarmView() {
    return l`<button class="alarm" @click=${() => {
      this._alarm = 0, this.hass?.callService("input_text", "set_value", { entity_id: "input_text.fh_panel_message", value: "" });
    }}>
      <span style="font-size:96px">⏰</span><span class="display" style="font-size:64px;font-weight:var(--w-heavy, 800);text-align:center;padding:0 40px">${La(this.hass)?.t || "Timer’s done!"}</span><span style="font-size:20px;font-weight:var(--w-semi, 600)">Tap to stop</span></button>`;
  }
  _sheetView() {
    const t = this._sheet;
    if (!t) return u;
    const a = () => {
      this._sheet = "";
    };
    if (t === "add") return l`<fh-add-event .hass=${this.hass} .calendars=${this._config.calendars ?? []} .defaultCal=${this._config.add_calendar ?? ""}
      @click=${a} @close=${a} @saved=${(o) => {
      a(), this._say(`Added “${o.detail}”`), this._fetchedKey = "", this._refresh(), this._loadSoon();
    }}></fh-add-event>`;
    const i = t === "themes" ? this._themeBody() : t === "kidprefs" ? this._kidPrefsBody() : t === "meds" ? this._medsBody() : t === "timer" ? this._timerBody() : this._sitterBody();
    return l`<div class="scrim" @click=${(o) => {
      o.target === o.currentTarget && a();
    }}>
      <section class="glass sheet" role="dialog" aria-modal="true" aria-label=${{ themes: "Pick a look", kidprefs: "Settings", meds: "Medication", timer: "Kitchen timer", sitter: "House info" }[t] ?? "Panel"} style=${t === "themes" ? "" : t === "kidprefs" ? "width:min(860px,94%);gap:14px" : "width:min(640px,92%)"}>${i}</section></div>`;
  }
  _sheetHead(t, a = "") {
    return l`<div style="display:flex;align-items:flex-start;gap:16px">
      <div style="flex:1"><h2 class="t-head">${t}</h2>${a ? l`<span class="muted">${a}</span>` : u}</div>
      <button class="round tap" aria-label="Close" @click=${() => {
      this._sheet = "";
    }}>${F("close", 18)}</button></div>`;
  }
  _themeBody() {
    return l`${this._sheetHead("Pick a look", "Changes the whole panel.")}
      <div class="themes looks">
        ${Pt.map((t) => l`<button class="tcard tap" aria-pressed=${String(t.id === this._look)} @click=${() => this._setLook(t.id)}>
          ${ee(t, 120, ta($t(this._theme)))}
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${t.name}</span><span class="muted" style="font-size:13px">${t.tagline}</span>
        </button>`)}
      </div>
      ${(L(this._look).options ?? []).map((t) => this._optRow(t, !!this._opts[t.id], () => this._toggleOpt(t.id)))}
      ${L(this._look).themed ? l`<span class="label">Background</span>
      <div class="themes">
        ${Xt.map((t) => l`<button class="tcard tap" aria-pressed=${String(t.id === this._theme)} @click=${() => this._setTheme(t.id)}>
          <span class="tprev" style=${ta(t)}>${[1, 2, 3, 4, 5].map((a) => l`<span style="background:var(--p-${a})"></span>`)}</span>
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${t.name}</span><span class="muted" style="font-size:13px">${t.tagline}</span>
        </button>`)}
      </div>` : u}
      <div style="display:flex;justify-content:space-between;align-items:center">
        ${L(this._look).themed ? l`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => {
      const t = Xt.filter((a) => a.id !== this._theme);
      this._setTheme(t[Math.floor(Math.random() * t.length)].id);
    }}>${F("shuffle", 20)}Surprise me</button>` : l`<span></span>`}
        <span class="muted" style="font-size:12px">Family Hub v${ro}</span>
      </div>`;
  }
  /** A look's switch: a two-way toggle when it names both sides (Print | Handwriting), otherwise an on/off switch. */
  _optRow(t, a, i) {
    return t.off && t.on ? l`<div class="setrow"><span class="setlabel"><b>${t.label}</b>${t.hint ? l`<span class="muted">${t.hint}</span>` : u}</span>
      <div class="seg" role="group" aria-label=${t.label}>
        <button class="tap" aria-pressed=${String(!a)} @click=${() => {
      a && i();
    }}>${t.off}</button>
        <button class="tap" aria-pressed=${String(a)} style=${t.onStyle ?? ""} @click=${() => {
      a || i();
    }}>${t.on}</button></div></div>` : this._switchRow(t.label, t.hint ?? "", a, i);
  }
  _switchRow(t, a, i, o) {
    return l`<div class="setrow"><span class="setlabel"><b>${t}</b>${a ? l`<span class="muted">${a}</span>` : u}</span>
      <button class="tap opt" role="switch" aria-checked=${String(i)} aria-label=${t} @click=${o}><span class="sw" aria-hidden="true"></span></button></div>`;
  }
  _kidPrefsBody() {
    const t = this._kidOn, a = this._kp;
    if (!t || !a) return l``;
    this._prefTick;
    const i = L(this._lk), o = i.options?.find((r) => r.id === "hand"), s = [["panel", "Same as the panel", `Follows the family’s choice (${L(this._look).name})`], ...Pt.map((r) => [r.id, r.name, r.tagline])];
    return l`${this._sheetHead(`${t.name}’s settings`, `Only for ${t.name}’s page.`)}
      <div class="themes" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        ${s.map(([r, n, c]) => l`<button class="tcard tap" aria-pressed=${String(a.look === r)} @click=${() => this._setKidPref({ look: r })}>
          ${r === "panel" ? l`<span class="tprev" style="height:84px;background:var(--chip);align-items:center;justify-content:center">${F("home", 30)}</span>` : ee(L(r), 84, ta($t(this._theme)))}
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${n}</span><span class="muted" style="font-size:13px">${c}</span></button>`)}
      </div>
      ${o ? this._optRow(o, a.font === "hand", () => this._setKidPref({ font: a.font === "hand" ? "print" : "hand" })) : u}
      ${this._switchRow("One job at a time", "Shows Now, Next and Later instead of the whole list.", a.focus, () => this._setKidPref({ focus: !a.focus }))}
      ${this._switchRow("Calm mode", "No looping motion or tilted cards.", a.calm, () => this._setKidPref({ calm: !a.calm }))}
      <div class="setrow"><span class="setlabel"><b>Sounds</b><span class="muted">Timers and alarms always sound.</span></span>
        <div class="seg" role="group" aria-label="Sounds">${["full", "soft", "off"].map((r) => l`<button class="tap" aria-pressed=${String(a.sound === r)} @click=${() => this._setKidPref({ sound: r })}>${r[0].toUpperCase() + r.slice(1)}</button>`)}</div></div>`;
  }
  _medsBody() {
    const t = this._config.parents ?? (this._config.people ?? []).map((a) => a.name);
    return l`${this._sheetHead("Medication", "Kept off the kids’ pages and the night screen.")}
      ${(this._config.meds ?? []).map((a) => {
      const i = this._medStatus(a.id, a.time);
      return l`<div class="card" style="background:var(--chip);border-radius:20px">
          <div style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">💊</span>
            <span style="flex:1;display:flex;flex-direction:column"><b style="font-size:18px">${a.who ? `${a.who} – ` : ""}${a.label}</b><span class="muted">Due ${a.time}</span></span>
            <b style="font-size:16px;color:${i.given ? "var(--ok)" : i.late ? "#dc2626" : "var(--ink2)"}">${i.given ? `✓ ${B(i.given)}${i.by ? ` · ${i.by}` : ""}` : i.late ? "Overdue" : "Not yet"}</b></div>
          ${i.given ? u : l`<div style="display:flex;gap:10px;flex-wrap:wrap">${t.map((o) => l`<button class="pill tap primary" style="height:50px;padding:0 20px;font-size:16px" @click=${() => this._giveMed(a.id, o)}>Given by ${o}</button>`)}</div>`}
        </div>`;
    })}`;
  }
  _timerBody() {
    const t = this._timerLeft() ?? 0, a = Math.floor(t / 6e4), i = Math.floor(t % 6e4 / 1e3);
    return l`${this._sheetHead("Kitchen timer")}
      <span style="align-self:center;line-height:0">${X(this._lk, "timer", { frac: this._timerFrac(this._timerLeft()), size: 170 })}</span>
      <span class="display" style="font-size:88px;font-weight:var(--w-bold, 700);text-align:center;font-variant-numeric:tabular-nums">${a}:${String(i).padStart(2, "0")}</span>
      <div class="grid3" style="gap:10px">${[1, 5, 10].map((o) => l`<button class="tap quick" style="height:56px;font-size:18px" @click=${() => this._addTimer(o)}>+${o} min</button>`)}</div>
      <button class="pill tap" style="height:52px;justify-content:center" @click=${() => {
      this.hass?.callService("timer", "cancel", { entity_id: "timer.kitchen" }), this._sheet = "";
    }}>Cancel timer</button>`;
  }
  _sitterBody() {
    const t = this._config.babysitter;
    return l`${this._sheetHead(t.title ?? "House info", "For babysitters and visitors")}
      <div class="card" style="background:#fee2e2;color:#7f1d1d;border-radius:20px"><b style="font-size:20px">Emergency: 000</b><span>Poisons Information Centre: 13 11 26</span></div>
      ${(t.lines ?? []).map((a) => l`<div style="font-size:17px;font-weight:var(--w-semi, 600);padding:4px 2px">${a}</div>`)}`;
  }
  _night() {
    const t = this._now, a = xe(t), i = t.getHours() < 6, o = i ? t : M(t, 1), s = this._eventsOn(o, this._soon).filter((h) => !this._private(h.title)).slice(0, 3), r = t.getHours() * 60 + t.getMinutes(), n = Math.round(Math.sin(r / 7) * 38), c = Math.round(Math.cos(r / 11) * 24), p = this._arcs(this._eventsOn(t, this._soon)).map((h) => ({ ...h, colour: "rgba(255,178,107,.7)" })), d = X(this._lk, "night", { now: t, arcs: p, size: 230 });
    return l`<button class="night" aria-label="Wake the panel" @click=${() => {
      this._nightManual = !1, this._awakeUntil = Date.now() + 10 * 6e4, this._lastTouch = Date.now();
    }}>
      <div class="nwander" style="transform:translate(${n}px, ${c}px)">
      <div class="nclock">${d === u ? u : l`<span class="nart">${d}</span>`}<div><span class="display big">${a.hm}</span><div class="ndate">${Ia(t)}</div></div></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px">
        ${s.length ? l`<div class="dglass" style="width:460px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:12px">
          <span style="font-size:13px;font-weight:var(--w-semi, 600);text-transform:uppercase;letter-spacing:.06em;opacity:.8">${i ? "Today" : "Tomorrow"}</span>
          ${s.map((h) => l`<div style="display:flex;align-items:center;gap:12px;font-size:18px"><span style="width:80px;opacity:.8">${h.allDay ? "All day" : B(h.start)}</span>${h.title}</div>`)}
        </div>` : l`<span></span>`}
        <span class="breathe" style="font-size:16px;opacity:.7">Tap anywhere to wake</span>
      </div>
      </div>
    </button>`;
  }
};
va.styles = [_, G`${$(Wa)}`], va.properties = {
  hass: { attribute: !1 },
  _config: { state: !0 },
  _view: { state: !0 },
  _anchor: { state: !0 },
  _events: { state: !0 },
  _soon: { state: !0 },
  _theme: { state: !0 },
  _look: { state: !0 },
  _opts: { state: !0 },
  _prefTick: { state: !0 },
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
  _calError: { state: !0 },
  _idle: { state: !0 },
  _undo: { state: !0 },
  _dinner: { state: !0 },
  _alarm: { state: !0 },
  _pinAsk: { state: !0 }
};
let xi = va;
customElements.get("family-hub-card") || customElements.define("family-hub-card", xi);
const bi = window;
bi.customCards = bi.customCards || [];
bi.customCards.push({ type: "family-hub-card", name: "Family Hub", description: "Glassy, themeable family planner for wall panels.", preview: !1 });
console.info(`%c FAMILY-HUB %c v${ro} `, "background:#0b5fa5;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px", "background:#ffd166;color:#0b2236;border-radius:0 3px 3px 0;padding:2px 6px");
export {
  xi as FamilyHubCard
};

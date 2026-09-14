/* ═══════════════════════════════════════════════════════════════
   GATE CORE — pure, UI-free primitives for the verification gate.
   Runs unchanged in the browser (window.GateCore) and in Node
   (module.exports), so every function here is tested against
   published vectors rather than eyeballed.
   ═══════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';
  const subtle = () => root.crypto.subtle;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const toU8 = x => x instanceof Uint8Array ? x : new Uint8Array(x);

  /* ── bytes ───────────────────────────────────────────────── */
  function randomBytes(n){ const a = new Uint8Array(n); root.crypto.getRandomValues(a); return a; }
  function concat(a, b){ const o = new Uint8Array(a.length + b.length); o.set(a, 0); o.set(b, a.length); return o; }
  function bytesEqual(a, b){
    if (a.length !== b.length) return false;
    let r = 0; for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
    return r === 0;
  }
  /** Constant-time compare: a mismatch must not leak how many leading
   *  digits of a code were right. */
  function timingSafeEqual(a, b){
    a = String(a); b = String(b);
    if (a.length !== b.length) return false;
    let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return r === 0;
  }
  async function sha256(data){ return new Uint8Array(await subtle().digest('SHA-256', toU8(data))); }

  /* ── base32 (RFC 4648) — the alphabet authenticator apps expect ── */
  const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function base32Encode(bytes){
    let bits = 0, value = 0, out = '';
    for (const b of toU8(bytes)) {
      value = ((value << 8) | b) & 0xfff; bits += 8;
      while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
  }
  function base32Decode(str){
    const clean = String(str).toUpperCase().replace(/[\s=-]/g, '');
    let bits = 0, value = 0; const out = [];
    for (const ch of clean) {
      const idx = B32.indexOf(ch);
      if (idx < 0) throw new Error('invalid base32 character');
      value = ((value << 5) | idx) & 0xfff; bits += 5;
      if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(out);
  }

  /* ── HOTP (RFC 4226) / TOTP (RFC 6238) ───────────────────── */
  async function hotp(secretBytes, counter, digits = 6){
    const msg = new DataView(new ArrayBuffer(8));
    msg.setUint32(0, Math.floor(counter / 0x100000000));
    msg.setUint32(4, counter % 0x100000000);
    const key = await subtle().importKey('raw', toU8(secretBytes), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const mac = new Uint8Array(await subtle().sign('HMAC', key, msg.buffer));
    const off = mac[mac.length - 1] & 0x0f;                       // dynamic truncation
    const bin = ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
    return String(bin % 10 ** digits).padStart(digits, '0');
  }
  function totpAt(secretBytes, unixSeconds, { period = 30, digits = 6 } = {}){
    return hotp(secretBytes, Math.floor(unixSeconds / period), digits);
  }
  /**
   * Accepts a code within ±window steps of now, to absorb clock drift.
   * Refuses any counter at or before `lastCounter`, so a code that already
   * passed cannot be replayed inside its lifetime (RFC 6238 §5.2).
   */
  async function totpCheck(secretBytes, code, { now = Date.now() / 1000, window = 1, period = 30, digits = 6, lastCounter = -1 } = {}){
    code = String(code ?? '').replace(/\s/g, '');
    if (!/^\d+$/.test(code) || code.length !== digits) return { ok: false, reason: 'format' };
    const c0 = Math.floor(now / period);
    for (let w = -window; w <= window; w++) {
      const c = c0 + w;
      if (timingSafeEqual(await hotp(secretBytes, c, digits), code)) {
        if (c <= lastCounter) return { ok: false, reason: 'replay', counter: c };
        return { ok: true, counter: c };
      }
    }
    return { ok: false, reason: 'mismatch' };
  }
  function otpauthURI({ secretB32, label, issuer, period = 30, digits = 6 }){
    const i = encodeURIComponent(issuer), l = encodeURIComponent(label);
    return `otpauth://totp/${i}:${l}?secret=${secretB32}&issuer=${i}&algorithm=SHA1&digits=${digits}&period=${period}`;
  }

  /* ── WebAuthn ────────────────────────────────────────────── */
  function b64urlEncode(bytes){
    let s = ''; for (const b of toU8(bytes)) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str){
    str = String(str).replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const bin = atob(str), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  /** Authenticators return ECDSA signatures DER-encoded; WebCrypto wants raw r||s. */
  function derToRaw(der, n = 32){
    const d = toU8(der); let i = 0;
    if (d[i++] !== 0x30) throw new Error('bad DER sequence');
    const len = d[i++]; if (len & 0x80) i += (len & 0x7f);
    const readInt = () => {
      if (d[i++] !== 0x02) throw new Error('bad DER integer');
      const l = d[i++]; let v = d.slice(i, i + l); i += l;
      while (v.length > n && v[0] === 0) v = v.slice(1);
      if (v.length > n) throw new Error('DER integer too long');
      const p = new Uint8Array(n); p.set(v, n - v.length); return p;
    };
    const r = readInt(), s = readInt();
    return concat(r, s);
  }
  function rawToDer(raw, n = 32){
    const encInt = v => {
      let k = 0; while (k < v.length - 1 && v[k] === 0) k++;
      v = v.slice(k);
      if (v[0] & 0x80) { const t = new Uint8Array(v.length + 1); t.set(v, 1); v = t; }
      return [0x02, v.length, ...v];
    };
    const r = encInt(toU8(raw).slice(0, n)), s = encInt(toU8(raw).slice(n));
    return new Uint8Array([0x30, r.length + s.length, ...r, ...s]);
  }
  function parseAuthData(authData){
    const ad = toU8(authData);
    if (ad.length < 37) throw new Error('authenticatorData too short');
    const flags = ad[32];
    return {
      rpIdHash: ad.slice(0, 32), flags,
      userPresent: !!(flags & 0x01), userVerified: !!(flags & 0x04),
      signCount: new DataView(ad.buffer, ad.byteOffset + 33, 4).getUint32(0)
    };
  }
  /**
   * Verifies an assertion against the public key saved at registration:
   * type, challenge, origin, rpId hash, user-presence AND user-verification
   * flags, signature counter, and the signature itself.
   */
  async function verifyAssertion(o){
    const fail = reason => ({ ok: false, reason });
    try {
      const cdBytes = toU8(o.clientDataJSON);
      const cd = JSON.parse(dec.decode(cdBytes));
      if (cd.type !== 'webauthn.get') return fail('type');
      if (cd.challenge !== b64urlEncode(o.expectedChallenge)) return fail('challenge');
      if (cd.origin !== o.expectedOrigin) return fail('origin');
      const ad = toU8(o.authenticatorData), info = parseAuthData(ad);
      if (!bytesEqual(info.rpIdHash, await sha256(enc.encode(o.expectedRpId)))) return fail('rpId');
      if (!info.userPresent) return fail('userPresence');
      if (!info.userVerified) return fail('userVerification');
      // A counter that fails to advance suggests a cloned authenticator.
      // Many platform authenticators always report 0, which is allowed.
      if (o.storedSignCount && info.signCount && info.signCount <= o.storedSignCount) return fail('signCount');
      if (!o.publicKeySpki) return { ok: true, signatureChecked: false, signCount: info.signCount };
      const signed = concat(ad, await sha256(cdBytes));
      const sig = toU8(o.signature), spki = toU8(o.publicKeySpki);
      let valid;
      if (o.alg === -7) {
        const key = await subtle().importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
        valid = await subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, key, derToRaw(sig), signed);
      } else if (o.alg === -257) {
        const key = await subtle().importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
        valid = await subtle().verify('RSASSA-PKCS1-v1_5', key, sig, signed);
      } else return fail('alg');
      return valid ? { ok: true, signatureChecked: true, signCount: info.signCount } : fail('signature');
    } catch (e) {
      return fail('malformed');
    }
  }

  /* ── face descriptors ────────────────────────────────────── */
  function euclidean(a, b){
    let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; }
    return Math.sqrt(s);
  }
  /** Nearest enrolled sample decides. Lower distance = more similar. */
  function faceDecision(enrolled, probe, threshold = 0.5){
    let best = Infinity;
    for (const d of enrolled) best = Math.min(best, euclidean(d, probe));
    return { match: best <= threshold, distance: best };
  }

  const api = {
    randomBytes, concat, bytesEqual, timingSafeEqual, sha256,
    base32Encode, base32Decode, hotp, totpAt, totpCheck, otpauthURI,
    b64urlEncode, b64urlDecode, derToRaw, rawToDer, parseAuthData, verifyAssertion,
    euclidean, faceDecision
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GateCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

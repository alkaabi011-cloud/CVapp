/* ═══════════════════════════════════════════════════════════════
   VERIFICATION GATE — lock screen, enrolment UI and attempt log.

   What this is, stated plainly: a LOCAL lock screen. Its secrets
   (TOTP key, WebAuthn public key, face descriptor) live on this same
   device, and the CV data behind it is not encrypted. It stops a person
   who picks up the device; it does not stop someone technical with access
   to the browser. The UI says so too, rather than implying more.

   Public API kept exactly as requested:  totp_setup()  totp_verify()
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const C = window.GateCore;

  /* ── strings, merged into the app dictionary ─────────────── */
  Object.assign(I18N.ar, {
    gate_title:'بوابة التحقق', gate_sub:'قفل التطبيق برمز أو بصمة أو وجه',
    gate_settings_row:'بوابة التحقق', gate_settings_row_sub:'رمز TOTP · بصمة الجهاز · التعرّف على الوجه',
    gate_enable:'قفل التطبيق عند فتحه', gate_enable_need:'سجّل طريقة تحقق واحدة على الأقل لتفعيل القفل.',
    gate_lock_now:'اقفل الآن',
    gate_one_method_warn:'لديك طريقة تحقق واحدة فقط. إن تعطّلت (كاميرا معطلة أو جهاز جديد) ستُقفَل خارج سيرتك. يُنصح بتسجيل طريقتين.',
    gate_threat_title:'ما الذي تحميه هذه البوابة؟',
    gate_threat_body:'تمنع من يمسك جهازك من فتح التطبيق. لكنها لا تُشفّر بياناتك، ومفاتيحها محفوظة على الجهاز نفسه: من يملك خبرة تقنية ووصولاً إلى المتصفح يستطيع قراءة البيانات أو تجاوز القفل. والتعرّف على الوجه هنا بلا كشف للحيوية — صورة لوجهك قد تفتح القفل.',
    m_totp:'رمز المصادقة (TOTP)', m_webauthn:'بصمة الجهاز', m_face:'التعرّف على الوجه', m_system:'النظام',
    st_enrolled:'مفعّل', st_not_enrolled:'غير مفعّل', since:'منذ', or:'أو',
    totp_desc:'تطبيق مثل Google Authenticator أو Microsoft Authenticator',
    totp_setup_btn:'إعداد رمز المصادقة',
    totp_scan:'امسح الرمز بتطبيق المصادقة، أو أدخل المفتاح يدوياً:',
    totp_confirm_label:'أدخل الرمز المكوّن من ٦ أرقام للتأكيد',
    totp_confirm_btn:'تأكيد وتفعيل',
    totp_secret_warn:'لا تشارك هذا المفتاح أبداً — من يملكه يستطيع توليد رموزك.',
    copy_key:'نسخ المفتاح', remove_method:'إزالة', confirm_remove_method:'إزالة هذه الطريقة؟', test_btn:'اختبار',
    wa_desc:'Face ID أو Touch ID أو Windows Hello أو بصمة الأندرويد — يتحقق منها جهازك',
    wa_register:'تسجيل بصمة الجهاز', wa_use:'افتح ببصمة الجهاز',
    wa_unavailable:'بصمة الجهاز غير متاحة على هذا الجهاز أو المتصفح.',
    wa_insecure:'بصمة الجهاز تتطلب اتصالاً آمناً (HTTPS).',
    wa_no_pubkey:'هذا المتصفح لم يُتِح المفتاح العام، لذا يُعتمد على تحقق الجهاز دون فحص التوقيع.',
    face_desc:'على جهازك فقط · لا تُحفظ أي صورة',
    face_enroll:'تسجيل الوجه', face_use:'افتح بالوجه',
    face_delete:'حذف الواصف نهائياً',
    face_delete_confirm:'سيُحذف واصف وجهك من هذا الجهاز نهائياً ولا يمكن استرجاعه. لم يُرفَع إلى أي مكان ولا يدخل في ملفات النسخ الاحتياطي، لذا لا توجد نسخة أخرى. متابعة؟',
    face_deleted:'تم حذف الواصف نهائياً', face_enrolled_ok:'تم تسجيل الوجه',
    cam_unsupported:'الكاميرا غير مدعومة هنا (تتطلب HTTPS).',
    cam_consent_title:'قبل تشغيل الكاميرا',
    cam_consent_1:'ستُفتح الكاميرا الأمامية لهذه الخطوة فقط، وتُغلَق فور انتهائها.',
    cam_consent_2:'المعالجة تتم داخل جهازك. لا تُرسَل أي صورة أو فيديو إلى أي خادم، ولا تُحفَظ أي صورة.',
    cam_consent_3:'يُحفَظ فقط ١٢٨ رقماً تصف ملامح وجهك، ويمكنك حذفها نهائياً في أي وقت.',
    cam_consent_4:'تنبيه: هذه الطريقة لا تميّز الوجه الحقيقي من صورة له.',
    cam_consent_agree:'أوافق، شغّل الكاميرا', cam_consent_decline:'لا، إلغاء',
    cam_loading_models:'جارٍ تحميل نماذج التعرّف (مرة واحدة)…', cam_starting:'جارٍ تشغيل الكاميرا…',
    cam_look:'انظر إلى الكاميرا', cam_hold:'ثبّت وجهك…', cam_one_face:'يجب أن يظهر وجه واحد فقط',
    cam_no_face:'لا يظهر وجه', cam_denied:'تم رفض إذن الكاميرا', cam_unavailable:'الكاميرا غير متاحة',
    cam_models_failed:'تعذّر تحميل نماذج التعرّف', cam_cancel:'إلغاء',
    lock_title:'التطبيق مقفل', lock_sub:'تحقّق من هويتك للمتابعة', lock_totp_ph:'رمز من ٦ أرقام',
    lock_unlock:'فتح', lock_rate:'محاولات كثيرة. انتظر {s} ثانية', unlocked:'تم الفتح',
    log_title:'سجل المحاولات', log_sub:'آخر ٢٠ محاولة على هذا الجهاز — لا تُسجَّل الرموز ولا بيانات الوجه',
    log_empty:'لا توجد محاولات بعد', log_ok:'نجاح', log_fail:'فشل',
    r_mismatch:'رمز غير صحيح', r_format:'صيغة غير صحيحة', r_replay:'رمز مستخدم مسبقاً', r_cancelled:'أُلغي',
    r_no_match:'الوجه غير مطابق', r_timeout:'انتهت المهلة', r_signature:'توقيع غير صالح',
    r_challenge:'تحدٍّ غير مطابق', r_origin:'مصدر غير مطابق', r_rpId:'نطاق غير مطابق',
    r_userVerification:'لم يتم التحقق من المستخدم', r_userPresence:'لم يُؤكَّد الحضور',
    r_signCount:'عداد مشبوه (نسخة؟)', r_malformed:'استجابة تالفة', r_alg:'خوارزمية غير مدعومة', r_type:'نوع غير صالح',
    r_rate_limited:'حظر مؤقت بعد محاولات فاشلة', r_error:'خطأ', r_denied:'رُفض إذن الكاميرا',
    r_no_signature_check:'دون فحص التوقيع',
    r_unlock:'فتح القفل', r_confirm:'تأكيد الإعداد', r_test:'اختبار', r_enrolled:'تسجيل',
    r_removed:'إزالة', r_deleted:'حذف الواصف', r_gate_on:'تفعيل القفل', r_gate_off:'إيقاف القفل'
  });
  Object.assign(I18N.en, {
    gate_title:'Verification gate', gate_sub:'Lock the app with a code, biometrics or your face',
    gate_settings_row:'Verification gate', gate_settings_row_sub:'TOTP code · device biometrics · face',
    gate_enable:'Lock the app when it opens', gate_enable_need:'Enrol at least one method to turn the lock on.',
    gate_lock_now:'Lock now',
    gate_one_method_warn:'You have only one method. If it fails (broken camera, new device) you will be locked out of your CV. Enrol two.',
    gate_threat_title:'What this gate protects against',
    gate_threat_body:'It stops someone who picks up your device from opening the app. It does not encrypt your data, and its secrets are stored on this same device: someone technical with access to the browser can read the data or bypass the lock. Face matching has no liveness check — a photo of your face may unlock it.',
    m_totp:'Authenticator code (TOTP)', m_webauthn:'Device biometrics', m_face:'Face recognition', m_system:'System',
    st_enrolled:'Active', st_not_enrolled:'Not set up', since:'since', or:'or',
    totp_desc:'An app such as Google Authenticator or Microsoft Authenticator',
    totp_setup_btn:'Set up authenticator',
    totp_scan:'Scan with your authenticator app, or enter the key manually:',
    totp_confirm_label:'Enter the 6-digit code to confirm',
    totp_confirm_btn:'Confirm & activate',
    totp_secret_warn:'Never share this key — anyone who has it can generate your codes.',
    copy_key:'Copy key', remove_method:'Remove', confirm_remove_method:'Remove this method?', test_btn:'Test',
    wa_desc:'Face ID, Touch ID, Windows Hello or Android fingerprint — checked by your device',
    wa_register:'Register device biometrics', wa_use:'Unlock with device biometrics',
    wa_unavailable:'Device biometrics are not available on this device or browser.',
    wa_insecure:'Device biometrics require a secure (HTTPS) connection.',
    wa_no_pubkey:'This browser did not expose the public key, so the device check is relied on without a signature check.',
    face_desc:'On-device only · no image is stored',
    face_enroll:'Enrol face', face_use:'Unlock with face',
    face_delete:'Delete descriptor permanently',
    face_delete_confirm:'Your face descriptor will be permanently deleted from this device and cannot be recovered. It was never uploaded and is not included in backup files, so no other copy exists. Continue?',
    face_deleted:'Descriptor permanently deleted', face_enrolled_ok:'Face enrolled',
    cam_unsupported:'Camera is not supported here (requires HTTPS).',
    cam_consent_title:'Before the camera turns on',
    cam_consent_1:'Only the front camera opens, and only for this step. It closes as soon as it finishes.',
    cam_consent_2:'Processing happens on your device. No image or video is sent to any server, and no image is saved.',
    cam_consent_3:'Only 128 numbers describing your face are stored, and you can delete them permanently at any time.',
    cam_consent_4:'Note: this method cannot tell a real face from a photo of one.',
    cam_consent_agree:'I agree, turn on camera', cam_consent_decline:'No, cancel',
    cam_loading_models:'Loading recognition models (one time)…', cam_starting:'Starting camera…',
    cam_look:'Look at the camera', cam_hold:'Hold still…', cam_one_face:'Only one face should be visible',
    cam_no_face:'No face detected', cam_denied:'Camera permission was denied', cam_unavailable:'Camera unavailable',
    cam_models_failed:'Could not load recognition models', cam_cancel:'Cancel',
    lock_title:'App locked', lock_sub:'Verify it’s you to continue', lock_totp_ph:'6-digit code',
    lock_unlock:'Unlock', lock_rate:'Too many attempts. Wait {s}s', unlocked:'Unlocked',
    log_title:'Attempt log', log_sub:'Last 20 attempts on this device — codes and face data are never logged',
    log_empty:'No attempts yet', log_ok:'Success', log_fail:'Failed',
    r_mismatch:'wrong code', r_format:'invalid format', r_replay:'code already used', r_cancelled:'cancelled',
    r_no_match:'face did not match', r_timeout:'timed out', r_signature:'invalid signature',
    r_challenge:'challenge mismatch', r_origin:'origin mismatch', r_rpId:'domain mismatch',
    r_userVerification:'user not verified', r_userPresence:'presence not confirmed',
    r_signCount:'suspicious counter (clone?)', r_malformed:'malformed response', r_alg:'unsupported algorithm', r_type:'invalid type',
    r_rate_limited:'temporarily blocked after failed attempts', r_error:'error', r_denied:'camera denied',
    r_no_signature_check:'signature not checked',
    r_unlock:'unlock', r_confirm:'setup confirmed', r_test:'test', r_enrolled:'enrolment',
    r_removed:'removed', r_deleted:'descriptor deleted', r_gate_on:'lock enabled', r_gate_off:'lock disabled'
  });

  const IC = {
    lock:'M5 10.5h14v10H5z M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3',
    totp:'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z M12 7.5V12l3 2',
    finger:'M12 11v3.5c0 2.5-1 4.5-2.5 6 M8.2 8.6A5 5 0 0 1 17 12v1.5c0 2-.4 3.9-1.2 5.6 M5.5 15.5c.3-1.1.5-2.3.5-3.5a6 6 0 0 1 9.4-4.9 M15 20.2c.4-.9.7-1.9.9-2.9',
    face:'M8 3.5H5.5a2 2 0 0 0-2 2V8 M16 3.5h2.5a2 2 0 0 1 2 2V8 M8 20.5H5.5a2 2 0 0 1-2-2V16 M16 20.5h2.5a2 2 0 0 0 2-2V16 M9 10v1 M15 10v1 M9.5 15.5c1.5 1 3.5 1 5 0',
    log:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
    camera:'M4 8h3l1.5-2h7L17 8h3v11H4z M12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
    trash:'M5 7h14M9.5 7V5h5v2M7 7l.8 12.2A1 1 0 0 0 8.8 20h6.4a1 1 0 0 0 1-.8L17 7'
  };

  /* ── state ───────────────────────────────────────────────── */
  const KEY = 'cvb.gate', LOG_KEY = 'cvb.gate.log', SESSION_KEY = 'cvb.gate.unlocked';
  const LOG_CAP = 100, LOG_SHOW = 20;
  const MAX_FAILS = 5, BASE_LOCK_MS = 30e3, MAX_LOCK_MS = 15 * 60e3;
  const FACE_THRESHOLD = 0.5;          // stricter than face-api's usual 0.6
  const blank = () => ({ enabled:false, totp:null, webauthn:null, face:null, fails:0, lockUntil:0, lockLevel:0 });
  const load = () => { try { return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return blank(); } };
  let G = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(G)); } catch (e) { toast('⚠ ' + e.message); } };
  const methodsEnrolled = () => ['totp', 'webauthn', 'face'].filter(m => !!G[m]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ── attempt log — method, purpose, outcome, time. Never codes or descriptors. ── */
  function readLog(){ try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch (e) { return []; } }
  function logAttempt(m, ok, r, p){
    const log = readLog();
    log.push({ t: Date.now(), m, ok: !!ok, r: r || '', p: p || '' });
    while (log.length > LOG_CAP) log.shift();
    try { localStorage.setItem(LOG_KEY, JSON.stringify(log)); } catch (e) {}
    renderLog();
  }

  /* ── rate limiting: only unlock attempts count; cancelling is not a guess ── */
  const rateLimited = () => Date.now() < (G.lockUntil || 0);
  const secondsLeft = () => Math.max(0, Math.ceil(((G.lockUntil || 0) - Date.now()) / 1000));
  function registerFailure(){
    G.fails = (G.fails || 0) + 1;
    if (G.fails >= MAX_FAILS) {
      G.lockUntil = Date.now() + Math.min(MAX_LOCK_MS, BASE_LOCK_MS * 2 ** (G.lockLevel || 0));
      G.lockLevel = (G.lockLevel || 0) + 1;
      G.fails = 0;
      logAttempt('system', false, 'rate_limited', 'unlock');
    }
    save();
  }
  function registerSuccess(){ G.fails = 0; G.lockLevel = 0; G.lockUntil = 0; save(); }
  function finalize(m, res, purpose){
    // Log the attempt BEFORE any block it triggers, so the log reads cause -> effect.
    logAttempt(m, res.ok, res.ok ? (res.signatureChecked === false ? 'no_signature_check' : '') : res.reason, purpose);
    if (res.ok) purpose === 'unlock' ? registerSuccess() : save();
    else if (purpose === 'unlock' && res.reason !== 'cancelled') registerFailure();
  }

  /* ═══════ TOTP ═══════ */
  let pendingSecret = null;   // held in memory only until confirmed — an abandoned setup leaves nothing on disk

  async function totp_setup(){
    const secretB32 = C.base32Encode(C.randomBytes(20));      // 160 bits, per RFC 4226 recommendation
    pendingSecret = secretB32;
    const label = ((typeof S !== 'undefined' && S.personal && S.personal.fullName) || '').trim() || 'CV';
    return { secretB32, uri: C.otpauthURI({ secretB32, label, issuer: 'CV Builder' }) };
  }

  async function totp_verify(code, { purpose = 'unlock' } = {}){
    if (purpose === 'unlock' && rateLimited()) return { ok: false, reason: 'rate_limited' };
    const confirming = purpose === 'confirm';
    const secretB32 = confirming ? pendingSecret : (G.totp && G.totp.secretB32);
    if (!secretB32) return { ok: false, reason: 'error' };
    const res = await C.totpCheck(C.base32Decode(secretB32), code,
      { lastCounter: confirming ? -1 : (G.totp.lastCounter ?? -1) });
    if (res.ok) {
      if (confirming) { G.totp = { secretB32, lastCounter: res.counter, enrolledAt: Date.now() }; pendingSecret = null; }
      else G.totp.lastCounter = res.counter;
    }
    finalize('totp', res, purpose);
    return res;
  }

  /* ═══════ WebAuthn ═══════ */
  async function waAvailable(){
    if (!window.isSecureContext) return { ok: false, why: 'wa_insecure' };
    if (!window.PublicKeyCredential) return { ok: false, why: 'wa_unavailable' };
    try {
      return (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
        ? { ok: true } : { ok: false, why: 'wa_unavailable' };
    } catch (e) { return { ok: false, why: 'wa_unavailable' }; }
  }

  async function waRegister(){
    const av = await waAvailable();
    if (!av.ok) { toast(t(av.why)); return; }
    try {
      const cred = await navigator.credentials.create({ publicKey: {
        challenge: C.randomBytes(32),
        rp: { name: 'CV Builder' },                       // rp.id defaults to this page's host
        user: { id: C.randomBytes(16), name: 'cv-builder',
                displayName: ((typeof S !== 'undefined' && S.personal.fullName) || '').trim() || 'CV Builder' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        timeout: 60000, attestation: 'none'
      }});
      const r = cred.response;
      const spki = typeof r.getPublicKey === 'function' ? r.getPublicKey() : null;
      const alg  = typeof r.getPublicKeyAlgorithm === 'function' ? r.getPublicKeyAlgorithm() : null;
      G.webauthn = { credId: C.b64urlEncode(cred.rawId), publicKey: spki ? C.b64urlEncode(spki) : null,
                     alg, signCount: 0, enrolledAt: Date.now() };
      save(); logAttempt('webauthn', true, '', 'enrolled'); toast(t('done'));
    } catch (e) {
      const reason = e.name === 'NotAllowedError' ? 'cancelled' : 'error';
      logAttempt('webauthn', false, reason, 'enrolled'); toast(t('r_' + reason));
    }
    renderSecurity();
  }

  async function waVerify(purpose = 'unlock'){
    if (purpose === 'unlock' && rateLimited()) return { ok: false, reason: 'rate_limited' };
    if (!G.webauthn) return { ok: false, reason: 'error' };
    const challenge = C.randomBytes(32);
    let res;
    try {
      const a = await navigator.credentials.get({ publicKey: {
        challenge, userVerification: 'required', timeout: 60000,
        allowCredentials: [{ type: 'public-key', id: C.b64urlDecode(G.webauthn.credId) }]
      }});
      res = await C.verifyAssertion({
        publicKeySpki: G.webauthn.publicKey ? C.b64urlDecode(G.webauthn.publicKey) : null,
        alg: G.webauthn.alg,
        authenticatorData: a.response.authenticatorData,
        clientDataJSON: a.response.clientDataJSON,
        signature: a.response.signature,
        expectedChallenge: challenge,
        expectedOrigin: location.origin,
        expectedRpId: location.hostname,
        storedSignCount: G.webauthn.signCount
      });
      if (res.ok && res.signCount) G.webauthn.signCount = res.signCount;
    } catch (e) {
      res = { ok: false, reason: e.name === 'NotAllowedError' ? 'cancelled' : 'error' };
    }
    finalize('webauthn', res, purpose);
    return res;
  }

  /* ═══════ Face (face-api, fully local) ═══════ */
  function loadScript(src){
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = () => rej(new Error('failed to load ' + src));
      document.head.appendChild(s);
    });
  }
  let faceReady = null;
  function loadFaceApi(){
    if (faceReady) return faceReady;
    faceReady = (async () => {
      // Library and weights are served from this app's own origin — no CDN,
      // no upload. The service worker caches them after first use.
      if (!window.faceapi) await loadScript('vendor/face-api/face-api.js');
      if (faceapi.tf && faceapi.tf.ready) await faceapi.tf.ready();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('models')
      ]);
    })().catch(e => { faceReady = null; throw e; });
    return faceReady;
  }
  const camSupported = () => !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  function modal(html){
    const el = document.createElement('div');
    el.className = 'gate-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="gm-box">${html}</div>`;
    document.body.appendChild(el);
    return el;
  }

  /** Explicit consent, every time, BEFORE getUserMedia is ever called.
   *  Focus lands on "No" so a stray Enter can never mean yes. */
  function cameraConsent(){
    return new Promise(resolve => {
      const el = modal(`
        <h3>${svg(IC.camera)}<span>${t('cam_consent_title')}</span></h3>
        <ul class="gm-list">
          <li>${t('cam_consent_1')}</li><li>${t('cam_consent_2')}</li>
          <li>${t('cam_consent_3')}</li><li class="warn">${t('cam_consent_4')}</li>
        </ul>
        <div class="gm-actions">
          <button class="btn btn-soft" data-c="no">${t('cam_consent_decline')}</button>
          <button class="btn btn-brand" data-c="yes">${t('cam_consent_agree')}</button>
        </div>`);
      const done = yes => { el.remove(); resolve(yes); };
      el.addEventListener('click', ev => { const b = ev.target.closest('[data-c]'); if (b) done(b.dataset.c === 'yes'); });
      el.addEventListener('keydown', ev => { if (ev.key === 'Escape') done(false); });
      setTimeout(() => el.querySelector('[data-c="no"]').focus(), 30);
    });
  }

  function cameraModal(){
    const el = modal(`
      <div class="cam-frame"><video playsinline muted autoplay></video><div class="cam-ring"></div></div>
      <div class="cam-status" aria-live="polite"></div>
      <div class="cam-progress"><i></i></div>
      <button class="btn btn-soft btn-block" data-cam="cancel">${t('cam_cancel')}</button>`);
    let onCancel = () => {};
    el.querySelector('[data-cam="cancel"]').onclick = () => onCancel();
    return {
      video: el.querySelector('video'),
      status(msg, cls){ const s = el.querySelector('.cam-status'); s.textContent = msg; s.className = 'cam-status' + (cls ? ' ' + cls : ''); },
      progress(p){ el.querySelector('.cam-progress i').style.width = Math.round(Math.min(1, p) * 100) + '%'; },
      cancelWith(cb){ onCancel = cb; },
      close(){ el.remove(); }
    };
  }

  /**
   * mode 'enroll': collect 5 samples of exactly one face.
   * mode 'verify': require 3 CONSECUTIVE matching frames, so a single
   * lucky frame cannot open the gate.
   */
  async function faceFlow(mode, purpose = 'unlock'){
    const logPurpose = mode === 'enroll' ? 'enrolled' : purpose;
    const fin = res => { finalize('face', res, logPurpose); return res; };
    if (mode === 'verify' && !G.face) return { ok: false, reason: 'error' };
    if (purpose === 'unlock' && mode === 'verify' && rateLimited()) return { ok: false, reason: 'rate_limited' };
    if (!camSupported()) { toast(t('cam_unsupported')); return fin({ ok: false, reason: 'error' }); }

    if (!(await cameraConsent())) return fin({ ok: false, reason: 'cancelled' });

    const ui = cameraModal();
    let stream = null, cancelled = false;
    ui.cancelWith(() => { cancelled = true; });
    try {
      ui.status(t('cam_loading_models'));
      try { await loadFaceApi(); }
      catch (e) { ui.status(t('cam_models_failed'), 'err'); await sleep(1800); return fin({ ok: false, reason: 'error' }); }
      if (cancelled) return fin({ ok: false, reason: 'cancelled' });

      ui.status(t('cam_starting'));
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      } catch (e) {
        const denied = e.name === 'NotAllowedError' || e.name === 'SecurityError';
        ui.status(t(denied ? 'cam_denied' : 'cam_unavailable'), 'err'); await sleep(1800);
        return fin({ ok: false, reason: denied ? 'denied' : 'error' });
      }
      ui.video.srcObject = stream;
      await ui.video.play().catch(() => {});

      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
      const NEED = mode === 'enroll' ? 5 : 3;
      const deadline = Date.now() + (mode === 'enroll' ? 25000 : 12000);
      const samples = [];
      let streak = 0, sawFace = false;

      while (!cancelled && Date.now() < deadline) {
        if (ui.video.readyState < 2) { await sleep(100); continue; }
        const found = await faceapi.detectAllFaces(ui.video, opts).withFaceLandmarks().withFaceDescriptors();
        if (cancelled) break;
        if (found.length !== 1) {
          streak = 0; ui.progress(mode === 'enroll' ? samples.length / NEED : 0);
          ui.status(t(found.length ? 'cam_one_face' : 'cam_no_face'), found.length ? 'err' : '');
          await sleep(150); continue;
        }
        sawFace = true;
        const d = Array.from(found[0].descriptor);
        if (mode === 'enroll') {
          samples.push(d.map(x => Math.round(x * 1e4) / 1e4));
          ui.status(t('cam_hold')); ui.progress(samples.length / NEED);
          if (samples.length >= NEED) break;
          await sleep(350);                     // spacing covers small pose changes
        } else {
          if (C.faceDecision(G.face.samples, d, G.face.threshold || FACE_THRESHOLD).match) {
            streak++; ui.status(t('cam_hold')); ui.progress(streak / NEED);
            if (streak >= NEED) break;
          } else { streak = 0; ui.progress(0); ui.status(t('cam_look')); }
          await sleep(150);
        }
      }

      if (cancelled) return fin({ ok: false, reason: 'cancelled' });
      if (mode === 'enroll') {
        if (samples.length < NEED) return fin({ ok: false, reason: 'timeout' });
        G.face = { samples, threshold: FACE_THRESHOLD, enrolledAt: Date.now() };
        return fin({ ok: true });
      }
      return fin(streak >= NEED ? { ok: true } : { ok: false, reason: sawFace ? 'no_match' : 'timeout' });
    } finally {
      if (stream) stream.getTracks().forEach(tr => tr.stop());   // camera light off, on every path
      ui.close();
    }
  }

  function deleteFace(){
    if (!G.face || !confirm(t('face_delete_confirm'))) return;
    G.face = null;
    if (!methodsEnrolled().length) G.enabled = false;
    save();
    logAttempt('face', true, '', 'deleted');
    toast(t('face_deleted'));
    renderSecurity();
  }

  /* ═══════ Lock screen ═══════ */
  const isUnlocked = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch (e) { return false; } };
  function setInert(on){
    ['#main', '#tabbar', '#topbar'].forEach(s => { const el = document.querySelector(s); if (el) el.inert = on; });
    document.querySelectorAll('elevenlabs-convai, .install-banner').forEach(el => { el.inert = on; });
  }
  let rateTimer = null;

  function showLock(){
    setInert(true);
    document.getElementById('gateLock')?.remove();
    const has = m => !!G[m];
    const el = document.createElement('div');
    el.id = 'gateLock'; el.className = 'gate-lock';
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="gl-card">
      <span class="gl-lockic">${svg(IC.lock)}</span>
      <h2>${t('lock_title')}</h2><p>${t('lock_sub')}</p>
      ${has('totp') ? `<form class="gl-totp">
          <input class="code-input" name="code" inputmode="numeric" autocomplete="one-time-code"
                 maxlength="6" placeholder="000000" aria-label="${t('lock_totp_ph')}">
          <button class="btn btn-brand" type="submit">${t('lock_unlock')}</button></form>` : ''}
      ${has('totp') && (has('webauthn') || has('face')) ? `<div class="gl-or">${t('or')}</div>` : ''}
      ${has('webauthn') ? `<button class="btn btn-brand btn-block" data-gl="webauthn">${svg(IC.finger)}<span>${t('wa_use')}</span></button>` : ''}
      ${has('face') ? `<button class="btn btn-soft btn-block" data-gl="face">${svg(IC.face)}<span>${t('face_use')}</span></button>` : ''}
      <div class="gl-msg" id="glMsg" aria-live="polite"></div>
    </div>`;
    document.body.appendChild(el);

    el.addEventListener('submit', async ev => {
      ev.preventDefault();
      const inp = el.querySelector('input[name=code]');
      const code = inp.value; inp.value = '';
      afterAttempt(await totp_verify(code, { purpose: 'unlock' }));
    });
    el.addEventListener('click', async ev => {
      const b = ev.target.closest('[data-gl]'); if (!b) return;
      lockBusy(true);
      const r = b.dataset.gl === 'webauthn' ? await waVerify('unlock') : await faceFlow('verify', 'unlock');
      lockBusy(false);
      afterAttempt(r);
    });
    const inp = el.querySelector('input[name=code]');
    if (inp) {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '').slice(0, 6);
        if (inp.value.length === 6) el.querySelector('.gl-totp').requestSubmit();
      });
      setTimeout(() => inp.focus(), 400);
    }
    tickRate();
  }
  function hideLock(){ clearInterval(rateTimer); document.getElementById('gateLock')?.remove(); setInert(false); }
  function lockBusy(on){ document.querySelectorAll('#gateLock button, #gateLock input').forEach(x => { x.disabled = on; }); }
  function afterAttempt(r){
    if (r.ok) return unlock();
    const msg = document.getElementById('glMsg');
    if (msg) msg.textContent = r.reason === 'cancelled' ? '' : t('r_' + r.reason);
    tickRate();
  }
  function tickRate(){
    clearInterval(rateTimer);
    const update = () => {
      const lock = document.getElementById('gateLock');
      if (!lock) return clearInterval(rateTimer);
      const limited = rateLimited();
      lock.querySelectorAll('button, input').forEach(x => { x.disabled = limited; });
      const msg = document.getElementById('glMsg');
      if (limited) msg.textContent = t('lock_rate').replace('{s}', secondsLeft());
      else clearInterval(rateTimer);
    };
    update();
    if (rateLimited()) rateTimer = setInterval(update, 1000);
  }
  function unlock(){
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) {}
    hideLock(); toast(t('unlocked'));
  }
  function lockNow(){
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    showLock();
  }

  /* ═══════ Security view ═══════ */
  let totpDraft = null;
  async function qrDataURL(text){
    if (!window.qrcode) await loadScript('vendor/qrcode/qrcode.js');
    const q = qrcode(0, 'M'); q.addData(text); q.make();
    return q.createDataURL(5, 3);
  }
  const lang = () => (LANG === 'ar' ? 'ar' : 'en');
  function fmtDate(ts){
    try { return new Intl.DateTimeFormat(lang(), { dateStyle: 'medium' }).format(new Date(ts)); }
    catch (e) { return new Date(ts).toLocaleDateString(); }
  }
  function fmtWhen(ts){
    const s = (Date.now() - ts) / 1000;
    try {
      const rtf = new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' });
      if (s < 60) return rtf.format(-Math.round(s), 'second');
      if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
      if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
      return new Intl.DateTimeFormat(lang(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ts));
    } catch (e) { return new Date(ts).toLocaleString(); }
  }
  const badge = on => `<span class="gate-badge ${on ? 'on' : ''}">${t(on ? 'st_enrolled' : 'st_not_enrolled')}</span>`;
  const head = (icon, title, sub, on) => `<div class="gate-head"><span class="gate-ic">${svg(icon)}</span>
      <div class="gh-txt"><b>${title}</b><small>${sub}</small></div>${on === undefined ? '' : badge(on)}</div>`;
  const since = ts => `${t('since')} ${fmtDate(ts)}`;

  async function renderSecurity(){
    const root = document.getElementById('securityRoot');
    if (!root) return;
    const wa = await waAvailable();
    const n = methodsEnrolled().length;

    const totpBody = G.totp
      ? `<div class="gate-actions">
           <button class="btn btn-soft" data-g="totp-test">${t('test_btn')}</button>
           <button class="btn btn-danger-soft" data-g="totp-remove">${t('remove_method')}</button></div>`
      : totpDraft
      ? `<div class="totp-setup">
           <p class="gate-note">${t('totp_scan')}</p>
           <img class="totp-qr" src="${totpDraft.qr}" alt="otpauth QR">
           <div class="totp-key">${esc(totpDraft.secretB32.match(/.{1,4}/g).join(' '))}</div>
           <button class="btn btn-soft btn-sm" data-g="totp-copy">${t('copy_key')}</button>
           <div class="gate-warn">${t('totp_secret_warn')}</div>
           <div class="field"><label for="totpConfirm">${t('totp_confirm_label')}</label>
             <input class="code-input" id="totpConfirm" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000"></div>
           <div class="gl-msg" id="totpMsg" aria-live="polite"></div>
           <div class="gate-actions">
             <button class="btn btn-soft" data-g="totp-cancel">${t('cam_cancel')}</button>
             <button class="btn btn-brand" data-g="totp-confirm">${t('totp_confirm_btn')}</button></div>
         </div>`
      : `<div class="gate-actions"><button class="btn btn-brand" data-g="totp-setup">${t('totp_setup_btn')}</button></div>`;

    root.innerHTML = `
      <div class="card gate-card">
        ${head(IC.lock, t('gate_title'), t('gate_sub'))}
        <label class="check"><input type="checkbox" data-g="toggle" ${G.enabled ? 'checked' : ''} ${n ? '' : 'disabled'}>
          <span>${t('gate_enable')}</span></label>
        ${n ? '' : `<div class="gate-note">${t('gate_enable_need')}</div>`}
        ${n === 1 ? `<div class="gate-warn">${t('gate_one_method_warn')}</div>` : ''}
        <div class="gate-actions"><button class="btn btn-soft" data-g="lock" ${G.enabled && n ? '' : 'disabled'}>${svg(IC.lock)}<span>${t('gate_lock_now')}</span></button></div>
        <div class="gate-info"><b>${t('gate_threat_title')}</b>${t('gate_threat_body')}</div>
      </div>

      <div class="card gate-card">
        ${head(IC.totp, t('m_totp'), G.totp ? since(G.totp.enrolledAt) : t('totp_desc'), !!G.totp)}
        ${totpBody}
      </div>

      <div class="card gate-card">
        ${head(IC.finger, t('m_webauthn'), G.webauthn ? since(G.webauthn.enrolledAt) : t('wa_desc'), !!G.webauthn)}
        ${!G.webauthn && !wa.ok ? `<div class="gate-note">${t(wa.why)}</div>` : ''}
        ${G.webauthn && !G.webauthn.publicKey ? `<div class="gate-note">${t('wa_no_pubkey')}</div>` : ''}
        <div class="gate-actions">${G.webauthn
          ? `<button class="btn btn-soft" data-g="wa-test">${t('test_btn')}</button>
             <button class="btn btn-danger-soft" data-g="wa-remove">${t('remove_method')}</button>`
          : `<button class="btn btn-brand" data-g="wa-register" ${wa.ok ? '' : 'disabled'}>${svg(IC.finger)}<span>${t('wa_register')}</span></button>`}
        </div>
      </div>

      <div class="card gate-card">
        ${head(IC.face, t('m_face'), G.face ? since(G.face.enrolledAt) : t('face_desc'), !!G.face)}
        ${!G.face && !camSupported() ? `<div class="gate-note">${t('cam_unsupported')}</div>` : ''}
        <div class="gate-actions">${G.face
          ? `<button class="btn btn-soft" data-g="face-test">${t('test_btn')}</button>`
          : `<button class="btn btn-brand" data-g="face-enroll" ${camSupported() ? '' : 'disabled'}>${svg(IC.camera)}<span>${t('face_enroll')}</span></button>`}
        </div>
        ${G.face ? `<div class="gate-actions"><button class="btn btn-danger-soft btn-block" data-g="face-delete">${svg(IC.trash)}<span>${t('face_delete')}</span></button></div>` : ''}
      </div>

      <div class="card gate-card">
        ${head(IC.log, t('log_title'), t('log_sub'))}
        <ul class="gate-log" id="gateLog"></ul>
      </div>`;
    renderLog();
  }

  function renderLog(){
    const host = document.getElementById('gateLog');
    if (!host) return;
    const rows = readLog().slice(-LOG_SHOW).reverse();
    if (!rows.length) { host.innerHTML = `<li class="gl-empty">${t('log_empty')}</li>`; return; }
    host.innerHTML = rows.map(x => {
      const cls = x.ok ? (x.m === 'system' ? 'sys' : 'ok') : 'no';
      const detail = x.ok
        ? t('log_ok') + (x.r ? ' — ' + t('r_' + x.r) : '')
        : t('log_fail') + (x.r ? ' — ' + t('r_' + x.r) : '');
      return `<li><span class="gl-dot ${cls}">${x.ok ? '✓' : '✕'}</span>
        <span class="gl-main"><b>${esc(t('m_' + x.m))} · ${esc(t('r_' + x.p))}</b><small>${esc(detail)}</small></span>
        <time class="gl-time" datetime="${new Date(x.t).toISOString()}">${esc(fmtWhen(x.t))}</time></li>`;
    }).join('');
  }

  document.addEventListener('change', e => {
    const el = e.target.closest('#securityRoot [data-g="toggle"]');
    if (!el) return;
    if (el.checked && !methodsEnrolled().length) { el.checked = false; return; }
    G.enabled = el.checked;
    // turning it on while present must not immediately lock you out of this session
    if (G.enabled) { try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (_) {} }
    save();
    logAttempt('system', true, '', G.enabled ? 'gate_on' : 'gate_off');
    renderSecurity();
  });

  document.addEventListener('click', async e => {
    const b = e.target.closest('#securityRoot [data-g]');
    if (!b || b.dataset.g === 'toggle') return;
    const a = b.dataset.g;
    const report = r => toast(r.ok ? t('log_ok') : t('log_fail') + (r.reason ? ' — ' + t('r_' + r.reason) : ''));

    if (a === 'lock') return lockNow();
    if (a === 'totp-setup') {
      b.disabled = true;
      try { const d = await totp_setup(); totpDraft = { ...d, qr: await qrDataURL(d.uri) }; }
      catch (err) { pendingSecret = null; toast(t('r_error')); }
      return renderSecurity();
    }
    if (a === 'totp-cancel') { totpDraft = null; pendingSecret = null; return renderSecurity(); }
    if (a === 'totp-copy') {
      try { await navigator.clipboard.writeText(totpDraft.secretB32); toast(t('copied')); }
      catch (_) { toast(t('r_error')); }
      return;
    }
    if (a === 'totp-confirm') {
      const r = await totp_verify(document.getElementById('totpConfirm').value, { purpose: 'confirm' });
      if (r.ok) { totpDraft = null; toast(t('done')); return renderSecurity(); }
      const m = document.getElementById('totpMsg'); if (m) m.textContent = t('r_' + r.reason);
      return;
    }
    if (a === 'totp-test') {
      const code = prompt(t('lock_totp_ph'));
      if (code !== null) report(await totp_verify(code, { purpose: 'test' }));
      return;
    }
    if (a === 'totp-remove' || a === 'wa-remove') {
      if (!confirm(t('confirm_remove_method'))) return;
      const m = a === 'totp-remove' ? 'totp' : 'webauthn';
      G[m] = null;
      if (!methodsEnrolled().length) G.enabled = false;
      save(); logAttempt(m, true, '', 'removed');
      return renderSecurity();
    }
    if (a === 'wa-register') return waRegister();
    if (a === 'wa-test') return report(await waVerify('test'));
    if (a === 'face-enroll') { const r = await faceFlow('enroll'); if (r.ok) toast(t('face_enrolled_ok')); return renderSecurity(); }
    if (a === 'face-test') return report(await faceFlow('verify', 'test'));
    if (a === 'face-delete') return deleteFace();
  });

  /* ═══════ lifecycle ═══════ */
  function boot(){
    if (G.enabled && !methodsEnrolled().length) { G.enabled = false; save(); }   // never lock with no way in
    if (G.enabled && !isUnlocked()) showLock();
  }
  /** Full reset from Settings erases gate secrets and the log too. */
  function wipe(){
    try { localStorage.removeItem(KEY); localStorage.removeItem(LOG_KEY); sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    G = load(); totpDraft = null; pendingSecret = null;
  }

  window.totp_setup = totp_setup;
  window.totp_verify = totp_verify;
  window.Gate = { boot, renderSecurity, lockNow, wipe, state: () => G, log: readLog };
})();

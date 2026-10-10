/**
 * Taxentric Referral Program — Apps Script backend (2026 season)
 *
 * Handles:
 *   POST type "referrer_signup"  → someone joins the referral program (Referrals tab)
 *   POST type "client_signup"    → a referred friend signs up (Client Signups tab)
 *   GET  ?action=visit&ref=CODE  → counts a click on a referral link, returns referrer's first name
 *   GET  ?code=CODE              → dashboard stats for a referrer
 *
 * Spam protection on every POST:
 *   1. Honeypot field (hidden from people, filled in by bots)
 *   2. Minimum time on page before submitting
 *   3. Name and email checks
 *   4. reCAPTCHA v3: success, score, action and hostname all verified with Google
 *   5. Duplicate check: the same email never creates a second row
 * Blocked attempts are written to a "Blocked" tab so you can see what was stopped.
 *
 * SETUP: the reCAPTCHA secret key is NOT in this file. Add it under
 * Project Settings (gear icon) → Script Properties → Add script property
 *   Property: RECAPTCHA_SECRET    Value: <your secret key>
 */

const CONFIG = {
  REFERRALS_SHEET: 'Referrals',
  CLIENT_SHEET: 'Client Signups',
  BLOCKED_SHEET: 'Blocked',
  SITE_URL: 'https://referrals.taxentric.com',

  // reCAPTCHA v3 scores run 0.0 (bot) to 1.0 (human). 0.5 is Google's recommended starting point.
  MIN_SCORE: 0.5,
  ALLOWED_HOSTNAMES: ['referrals.taxentric.com', 'taxentricsolutions-max.github.io'],
  MIN_SECONDS_ON_PAGE: 3,
  LOG_BLOCKED: true,

  // Referrer reward for each service a referred friend signs up for
  SERVICES: {
    tax_prep:    { label: 'Tax Preparation',      reward: 50 },
    bookkeeping: { label: 'Monthly Bookkeeping',  reward: 100 },
    annual_plan: { label: 'Annual Plan',          reward: 250 }
  },

  // Values you type in the "Reward Status" column of Client Signups.
  // Pending → friend signed up, not yet qualified
  // Qualified → friend filed/paid; reward is owed
  // Paid → you've paid the referrer
  // Not Eligible → doesn't count
  EARNED_STATUSES: ['qualified', 'paid'],
  PAID_STATUSES: ['paid']
};

// Referrals tab layout — unchanged from last season so existing formulas (I, J…) and Zapier keep working.
const REF_COL = { TIMESTAMP: 0, NAME: 1, EMAIL: 2, CODE: 3, REFERRED_BY: 4, URL: 5, DASHBOARD: 6, CLICKS: 7 };

// Client Signups tab columns. Matched by header name, so existing columns are reused and
// any missing ones are added to the right. The left-hand names are what this script writes.
const CLIENT_FIELDS = [
  { key: 'timestamp',    header: 'Timestamp',      aliases: ['date', 'submitted'] },
  { key: 'code',         header: 'Referral Code',  aliases: ['referralcode', 'code', 'ref'] },
  { key: 'referrerName', header: 'Referred By',    aliases: ['referrer', 'referrername', 'referredby'] },
  { key: 'name',         header: 'Client Name',    aliases: ['visitorname', 'name', 'friendname', 'fullname'] },
  { key: 'email',        header: 'Client Email',   aliases: ['email', 'emailaddress'] },
  { key: 'phone',        header: 'Phone',          aliases: ['phonenumber'] },
  { key: 'service',      header: 'Service',        aliases: ['serviceinterest'] },
  { key: 'reward',       header: 'Reward Amount',  aliases: ['reward'] },
  { key: 'status',       header: 'Reward Status',  aliases: ['status'] },
  { key: 'source',       header: 'Source',         aliases: [] }
];

/* =========================================================
   Entry points
   ========================================================= */

function doPost(e) {
  let data = {};
  try {
    if (!e || !e.postData || !e.postData.contents) return jsonError('No data received');
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonError('Invalid request');
  }

  const type = data.type || 'referrer_signup';
  const expectedAction = type === 'client_signup' ? 'client_signup' : 'referral_signup';

  const check = runSpamChecks(data, expectedAction);
  if (!check.ok) {
    logBlocked(type, check.reason, check.score, data);
    return jsonError(check.publicMessage || 'We could not verify your submission. Please try again.');
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (type === 'client_signup') return handleClientSignup(data);
    return handleReferrerSignup(data);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonError('Something went wrong on our end. Please try again.');
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};

  // Click on a referral link (called once per visit by invite.html)
  if (p.action === 'visit' && p.ref) {
    const code = cleanCode(p.ref);
    const referrer = findReferrer(code);
    if (!referrer) return jsonError('Referral code not found');
    incrementClicks(referrer.row);
    return jsonSuccess({ referralCode: code, firstName: firstName(referrer.name) });
  }

  // Dashboard stats
  const code = cleanCode(p.code || p.ref || '');
  if (code) {
    const stats = getDashboardStats(code);
    return stats ? jsonSuccess(stats) : jsonError('Referral code not found');
  }

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

/* =========================================================
   Handlers
   ========================================================= */

function handleReferrerSignup(data) {
  const sheet = getSheet(CONFIG.REFERRALS_SHEET);
  const name = tidyName(data.name);
  const email = String(data.email).trim().toLowerCase();

  // Same email again → hand back their existing code instead of creating a duplicate row
  const existing = findReferrerByEmail(email);
  if (existing) {
    return jsonSuccess(referrerPayload(existing.code, true));
  }

  const code = newUniqueCode();
  const urls = referrerPayload(code, false);
  const referredBy = data.referredBy ? cleanCode(data.referredBy) : '';

  sheet.appendRow([
    new Date(),          // A Timestamp
    name,                // B Name
    email,               // C Email
    code,                // D ReferralCode
    referredBy,          // E ReferredBy
    urls.referralURL,    // F ReferralURL
    urls.dashboardURL,   // G DashboardURL
    0                    // H Clicks
  ]);

  return jsonSuccess(urls);
}

function handleClientSignup(data) {
  const service = CONFIG.SERVICES[data.service];
  if (!service) return jsonError('Please choose a service.');

  const code = cleanCode(data.referralCode || '');
  const referrer = code ? findReferrer(code) : null;
  const email = String(data.email).trim().toLowerCase();
  const sheet = getSheet(CONFIG.CLIENT_SHEET);
  const cols = ensureClientColumns(sheet);

  // Same email + same service already recorded → don't add it twice
  if (clientAlreadyRecorded(sheet, cols, email, service.label)) {
    return jsonSuccess({ recorded: true, duplicate: true });
  }

  const values = {
    timestamp: new Date(),
    code: referrer ? code : (code ? code + ' (not found)' : ''),
    referrerName: referrer ? referrer.name : '',
    name: tidyName(data.name),
    email: email,
    phone: String(data.phone || '').trim().slice(0, 30),
    service: service.label,
    reward: referrer ? service.reward : 0,
    status: referrer ? 'Pending' : 'Not Eligible',
    source: 'invite_page'
  };

  // Write only into this script's columns so any formula columns you've added are left alone
  const newRow = sheet.getLastRow() + 1;
  CLIENT_FIELDS.forEach(f => { sheet.getRange(newRow, cols[f.key] + 1).setValue(values[f.key]); });

  return jsonSuccess({ recorded: true });
}

/* =========================================================
   Dashboard
   ========================================================= */

function getDashboardStats(code) {
  const referrer = findReferrer(code);
  if (!referrer) return null;

  const byService = {};
  Object.keys(CONFIG.SERVICES).forEach(k => {
    byService[k] = { label: CONFIG.SERVICES[k].label, reward: CONFIG.SERVICES[k].reward, signups: 0, qualified: 0, earned: 0 };
  });

  let signups = 0, earned = 0, paid = 0, pending = 0;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.CLIENT_SHEET);
  if (sheet && sheet.getLastRow() > 1) {
    const cols = ensureClientColumns(sheet);
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
    rows.forEach(r => {
      if (cleanCode(r[cols.code]) !== code) return;
      signups++;
      const key = serviceKeyFromLabel(r[cols.service]);
      const status = String(r[cols.status] || '').trim().toLowerCase();
      const amount = Number(r[cols.reward]) || (key ? CONFIG.SERVICES[key].reward : 0);
      if (key) byService[key].signups++;
      if (CONFIG.EARNED_STATUSES.indexOf(status) > -1) {
        earned += amount;
        if (key) { byService[key].qualified++; byService[key].earned += amount; }
        if (CONFIG.PAID_STATUSES.indexOf(status) > -1) paid += amount;
      } else if (status === '' || status === 'pending') {
        pending++;
      }
    });
  }

  return {
    referralCode: code,
    firstName: firstName(referrer.name),
    referralURL: CONFIG.SITE_URL + '/?ref=' + code,
    clicks: Number(referrer.clicks) || 0,
    signups: signups,
    pending: pending,
    rewards: earned,     // kept for older pages
    earned: earned,
    paid: paid,
    owed: earned - paid,
    services: byService
  };
}

/* =========================================================
   Spam checks
   ========================================================= */

function runSpamChecks(data, expectedAction) {
  // 1. Honeypot
  if (data.website) return { ok: false, reason: 'honeypot filled', score: '' };

  // 2. Time on page
  const elapsed = Number(data.elapsedMs);
  if (!elapsed || elapsed < CONFIG.MIN_SECONDS_ON_PAGE * 1000) {
    return { ok: false, reason: 'submitted too fast (' + (elapsed || 0) + 'ms)', score: '' };
  }

  // 3. Name and email
  const nameProblem = checkName(data.name);
  if (nameProblem) return { ok: false, reason: 'name: ' + nameProblem, score: '', publicMessage: 'Please enter your full name.' };
  if (!isValidEmail(data.email)) return { ok: false, reason: 'invalid email', score: '', publicMessage: 'Please enter a valid email address.' };

  // 4. reCAPTCHA
  const captcha = verifyRecaptcha(data.recaptchaToken, expectedAction);
  if (!captcha.ok) return { ok: false, reason: captcha.reason, score: captcha.score };

  return { ok: true, score: captcha.score };
}

function verifyRecaptcha(token, expectedAction) {
  const secret = PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET');
  if (!secret) return { ok: false, reason: 'RECAPTCHA_SECRET script property is not set', score: '' };
  if (!token) return { ok: false, reason: 'no reCAPTCHA token', score: '' };

  let json;
  try {
    const res = UrlFetchApp.fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    json = JSON.parse(res.getContentText());
  } catch (err) {
    return { ok: false, reason: 'reCAPTCHA request failed: ' + err, score: '' };
  }

  const score = typeof json.score === 'number' ? json.score : '';
  if (!json.success) return { ok: false, reason: 'reCAPTCHA failed: ' + (json['error-codes'] || []).join(', '), score: score };
  if (json.action !== expectedAction) return { ok: false, reason: 'reCAPTCHA action mismatch: ' + json.action, score: score };
  if (CONFIG.ALLOWED_HOSTNAMES.indexOf(json.hostname) === -1) return { ok: false, reason: 'reCAPTCHA hostname not allowed: ' + json.hostname, score: score };
  if (score < CONFIG.MIN_SCORE) return { ok: false, reason: 'low reCAPTCHA score', score: score };
  return { ok: true, score: score };
}

function checkName(raw) {
  const name = String(raw || '').trim().replace(/\s+/g, ' ');
  if (name.length < 2) return 'too short';
  if (name.length > 80) return 'too long';
  if (/https?:|www\.|@|\.com|\.ru|\.net/i.test(name)) return 'contains a link or email';
  if (/\d/.test(name)) return 'contains numbers';
  if (!/^[\p{L}][\p{L}\s.'’-]*$/u.test(name)) return 'unexpected characters';
  // Random strings like "xKqWzPmT": several capitals inside one word
  const gibberish = name.split(' ').some(w => (w.slice(1).match(/\p{Lu}/gu) || []).length >= 3 && w !== w.toUpperCase());
  if (gibberish) return 'looks randomly generated';
  // Long words with no vowels
  if (name.split(' ').some(w => w.length >= 6 && !/[aeiouyàâäéèêëïîôöùûüÿ]/i.test(w))) return 'looks randomly generated';
  return '';
}

function isValidEmail(raw) {
  const email = String(raw || '').trim();
  return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
}

function logBlocked(type, reason, score, data) {
  if (!CONFIG.LOG_BLOCKED) return;
  try {
    const sheet = getSheet(CONFIG.BLOCKED_SHEET, ['Timestamp', 'Form', 'Reason', 'reCAPTCHA Score', 'Name', 'Email']);
    sheet.appendRow([new Date(), type, reason, score, String(data.name || '').slice(0, 80), String(data.email || '').slice(0, 120)]);
  } catch (err) {
    Logger.log('Could not log blocked attempt: ' + err);
  }
}

/* =========================================================
   Sheet helpers
   ========================================================= */

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

/** Returns a map of field key → zero-based column index, adding any missing headers. */
function ensureClientColumns(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const norm = h => h.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normHeaders = headers.map(norm);
  const cols = {};
  const used = {};

  CLIENT_FIELDS.forEach(f => {
    const candidates = [norm(f.header)].concat(f.aliases);
    for (let c of candidates) {
      const idx = normHeaders.indexOf(c);
      if (idx > -1 && !used[idx] && headers[idx] !== '') { cols[f.key] = idx; used[idx] = true; return; }
    }
  });

  let nextCol = headers.filter(h => h !== '').length === 0 ? 0 : lastCol;
  CLIENT_FIELDS.forEach(f => {
    if (cols[f.key] === undefined) {
      sheet.getRange(1, nextCol + 1).setValue(f.header).setFontWeight('bold');
      cols[f.key] = nextCol;
      nextCol++;
    }
  });
  return cols;
}

function clientAlreadyRecorded(sheet, cols, email, serviceLabel) {
  if (sheet.getLastRow() < 2) return false;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  return rows.some(r => String(r[cols.email]).trim().toLowerCase() === email && String(r[cols.service]) === serviceLabel);
}

function referrerRows() {
  const sheet = getSheet(CONFIG.REFERRALS_SHEET);
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 8)).getValues();
}

function findReferrer(code) {
  if (!code) return null;
  const rows = referrerRows();
  for (let i = 0; i < rows.length; i++) {
    if (cleanCode(rows[i][REF_COL.CODE]) === code) {
      return { row: i + 2, name: rows[i][REF_COL.NAME], clicks: rows[i][REF_COL.CLICKS], code: code };
    }
  }
  return null;
}

function findReferrerByEmail(email) {
  const rows = referrerRows();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][REF_COL.EMAIL]).trim().toLowerCase() === email) {
      return { row: i + 2, code: cleanCode(rows[i][REF_COL.CODE]) };
    }
  }
  return null;
}

function incrementClicks(row) {
  const cell = getSheet(CONFIG.REFERRALS_SHEET).getRange(row, REF_COL.CLICKS + 1);
  cell.setValue((Number(cell.getValue()) || 0) + 1);
}

function newUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
    if (!findReferrer(code)) return code;
  }
  throw new Error('Could not generate a unique code');
}

function referrerPayload(code, existing) {
  return {
    referralCode: code,
    referralURL: CONFIG.SITE_URL + '/?ref=' + code,
    dashboardURL: CONFIG.SITE_URL + '/dashboard.html?code=' + code,
    existing: !!existing
  };
}

function serviceKeyFromLabel(label) {
  const l = String(label || '').toLowerCase();
  for (const k in CONFIG.SERVICES) {
    if (CONFIG.SERVICES[k].label.toLowerCase() === l) return k;
  }
  if (l.indexOf('book') > -1) return 'bookkeeping';
  if (l.indexOf('annual') > -1) return 'annual_plan';
  if (l.indexOf('tax') > -1) return 'tax_prep';
  return null;
}

/* =========================================================
   Small utilities
   ========================================================= */

function cleanCode(v) { return String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16); }
function tidyName(v) { return String(v || '').trim().replace(/\s+/g, ' ').slice(0, 80); }
function firstName(v) { return String(v || '').trim().split(' ')[0] || ''; }

function jsonSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function jsonError(message) {
  return ContentService.createTextOutput(JSON.stringify({ error: message })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this once from the editor (select "testSetup" and click Run) to check your setup.
 * It reports whether the secret key is set and which tabs exist. It does not change any data.
 */
function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log('Secret key set: ' + !!PropertiesService.getScriptProperties().getProperty('RECAPTCHA_SECRET'));
  [CONFIG.REFERRALS_SHEET, CONFIG.CLIENT_SHEET, CONFIG.BLOCKED_SHEET].forEach(n => {
    Logger.log(n + ' tab: ' + (ss.getSheetByName(n) ? 'found' : 'missing (will be created when needed)'));
  });
  ['Jane Doe', "Mary-Kate O'Neil", 'José Núñez', 'xKqWzPmTr', 'Buy cheap www.spam.com', 'Jkhgfdsq Bvcxwz'].forEach(n => {
    Logger.log('Name check "' + n + '": ' + (checkName(n) || 'OK'));
  });
}

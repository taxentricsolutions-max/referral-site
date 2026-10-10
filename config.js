/* Shared settings for every page. Change values here, not in the individual pages. */
window.TAXENTRIC = {
  // Your Apps Script web app address. If you ever create a NEW deployment, paste its URL here.
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxApsamoSM4JF-FFzbz9utnbwYGIO9RaW1fD6IAAraC1s54vbKY4tuVWhLWieK9v8aW5A/exec",
  RECAPTCHA_SITE_KEY: "6Lfth1osAAAAADjieFotr6MOwsLFl9pc05YP88f5",
  PORTAL_SIGNUP_URL: "https://portal.taxentric.com/en-us/signup",
  PORTAL_URL: "https://portal.taxentric.com",
  SERVICES: {
    tax_prep:    { label: "Tax Preparation",     reward: 50,  when: "when your friend files a paid tax return with us" },
    bookkeeping: { label: "Monthly Bookkeeping", reward: 100, when: "when your friend starts a monthly bookkeeping plan" },
    annual_plan: { label: "Annual Plan",         reward: 250, when: "when your friend signs up for an annual plan" }
  }
};

/* Small helpers shared by the pages */
window.TX = {
  pageLoadedAt: Date.now(),

  recaptchaToken(action) {
    return new Promise((resolve, reject) => {
      if (!window.grecaptcha) return reject(new Error("reCAPTCHA did not load"));
      grecaptcha.ready(() => {
        grecaptcha.execute(TAXENTRIC.RECAPTCHA_SITE_KEY, { action }).then(resolve, reject);
      });
    });
  },

  async post(payload) {
    const res = await fetch(TAXENTRIC.SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Network error");
    return res.json();
  },

  async get(params) {
    const url = TAXENTRIC.SCRIPT_URL + "?" + new URLSearchParams(params).toString();
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network error");
    return res.json();
  },

  validEmail(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); },

  money(n) { return "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 }); },

  setYear() { document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); }); },

  copy(text, button) {
    const done = () => { const t = button.textContent; button.textContent = "Copied!"; setTimeout(() => { button.textContent = t; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
    else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); }
  }
};

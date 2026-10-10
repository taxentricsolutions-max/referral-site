document.addEventListener("DOMContentLoaded", () => {
  TX.setYear();

  const $ = (id) => document.getElementById(id);
  const loading = $("dash-loading");
  const lookup = $("lookup");
  const dash = $("dash");
  const errorEl = $("dash-error");

  const clean = (v) => String(v || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

  function showLookup(message) {
    loading.classList.add("hidden");
    dash.classList.add("hidden");
    lookup.classList.remove("hidden");
    if (message) { errorEl.textContent = message; errorEl.classList.remove("hidden"); }
  }

  async function load(code) {
    loading.classList.remove("hidden");
    lookup.classList.add("hidden");
    errorEl.classList.add("hidden");
    try {
      const data = await TX.get({ code });
      if (data.error || !data.referralCode) return showLookup("We couldn't find that referral code. Please check it and try again.");
      render(data);
    } catch (err) {
      console.error(err);
      showLookup("We couldn't load your dashboard right now. Please try again in a moment.");
    }
  }

  function render(d) {
    if (d.firstName) $("dash-title").textContent = d.firstName + "'s referrals";
    $("dash-sub").textContent = "Referral code " + d.referralCode;

    $("s-earned").textContent = TX.money(d.earned != null ? d.earned : d.rewards);
    $("s-paid").textContent = TX.money(d.paid);
    $("s-signups").textContent = d.signups || 0;
    $("s-clicks").textContent = d.clicks || 0;

    const tbody = $("s-table");
    tbody.innerHTML = "";
    const services = d.services || {};
    Object.keys(TAXENTRIC.SERVICES).forEach((key) => {
      const conf = TAXENTRIC.SERVICES[key];
      const s = services[key] || { signups: 0, qualified: 0, earned: 0, reward: conf.reward };
      const tr = document.createElement("tr");
      [conf.label, TX.money(s.reward || conf.reward), s.signups || 0, s.qualified || 0, TX.money(s.earned)].forEach((v) => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    $("s-pending").textContent = d.pending
      ? d.pending + (d.pending === 1 ? " friend is" : " friends are") + " signed up and waiting for their service to be confirmed."
      : "";

    const link = d.referralURL || (location.origin + "/?ref=" + d.referralCode);
    $("d-link").textContent = link;
    $("d-copy").onclick = (ev) => TX.copy(link, ev.currentTarget);

    loading.classList.add("hidden");
    lookup.classList.add("hidden");
    dash.classList.remove("hidden");
  }

  lookup.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = clean($("lookup-code").value);
    if (!code) return showLookup("Please enter your referral code.");
    history.replaceState(null, "", "?code=" + code);
    load(code);
  });

  const code = clean(new URLSearchParams(location.search).get("code"));
  if (code) load(code); else showLookup();
});

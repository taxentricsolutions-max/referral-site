document.addEventListener("DOMContentLoaded", () => {
  TX.setYear();

  const params = new URLSearchParams(window.location.search);
  const ref = (params.get("ref") || params.get("code") || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const welcome = document.getElementById("welcome");

  const setWelcome = (first) => {
    welcome.textContent = "";
    welcome.append(first ? first + " invited you to " : "A friend invited you to ");
    const span = document.createElement("span");
    span.className = "gradient-text";
    span.textContent = "Taxentric Solutions";
    welcome.append(span);
  };

  if (ref) {
    try { localStorage.setItem("referredBy", ref); } catch (e) {}
    if (params.get("refName")) setWelcome(params.get("refName").split(" ")[0]);

    // Count the click once per browser session and fetch the referrer's first name
    let counted = false;
    try { counted = sessionStorage.getItem("visit_" + ref) === "1"; } catch (e) {}
    const visit = counted ? TX.get({ code: ref }) : TX.get({ action: "visit", ref });
    visit.then((data) => {
      if (data && data.firstName) setWelcome(data.firstName);
      try { sessionStorage.setItem("visit_" + ref, "1"); } catch (e) {}
    }).catch(() => {});
  } else {
    // Visited without a referral link
    document.getElementById("hero-eyebrow").textContent = "Welcome";
    welcome.innerHTML = 'Get started with <span class="gradient-text">Taxentric Solutions</span>';
    document.getElementById("form-sub").textContent = "Then we'll take you to create your secure client portal account.";
  }

  const form = document.getElementById("client-form");
  const btn = document.getElementById("client-btn");
  const btnText = btn.textContent;
  const errorEl = document.getElementById("client-error");
  const showError = (msg) => { errorEl.textContent = msg; errorEl.classList.remove("hidden"); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");

    const name = document.getElementById("c-name").value.trim().replace(/\s+/g, " ");
    const email = document.getElementById("c-email").value.trim();
    const phone = document.getElementById("c-phone").value.trim();
    const website = document.getElementById("c-website").value;
    const service = (document.querySelector('input[name="service"]:checked') || {}).value;

    if (!service) return showError("Please choose a service above.");
    if (name.length < 2) return showError("Please enter your full name.");
    if (!TX.validEmail(email)) return showError("Please enter a valid email address.");

    btn.disabled = true;
    btn.textContent = "Saving…";

    try {
      const token = await TX.recaptchaToken("client_signup");
      const data = await TX.post({
        type: "client_signup",
        referralCode: ref,
        service,
        name,
        email,
        phone,
        website,
        elapsedMs: Date.now() - TX.pageLoadedAt,
        recaptchaToken: token
      });
      if (data.error) throw new Error(data.error);

      form.classList.add("hidden");
      document.querySelector("#form-panel h2").classList.add("hidden");
      document.getElementById("form-sub").classList.add("hidden");
      const done = document.getElementById("client-done");
      done.classList.remove("hidden");
      document.getElementById("portal-link").href = TAXENTRIC.PORTAL_SIGNUP_URL;
      done.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      console.error(err);
      showError(err && err.message && !/network|fetch/i.test(err.message)
        ? err.message
        : "Something went wrong. Please try again in a moment.");
      btn.disabled = false;
      btn.textContent = btnText;
    }
  });
});

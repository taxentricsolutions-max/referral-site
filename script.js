document.addEventListener("DOMContentLoaded", () => {
  TX.setYear();

  // If this visitor arrived through someone else's link, remember who referred them
  const urlRef = new URLSearchParams(window.location.search).get("ref");
  try { if (urlRef) localStorage.setItem("referredBy", urlRef); } catch (e) {}
  let referredBy = "";
  try { referredBy = localStorage.getItem("referredBy") || ""; } catch (e) {}

  const form = document.getElementById("signup-form");
  const submitBtn = document.getElementById("submit-btn");
  const errorEl = document.getElementById("form-error");
  const signupSection = document.getElementById("signupSection");
  const result = document.getElementById("result");

  const showError = (msg) => { errorEl.textContent = msg; errorEl.classList.remove("hidden"); };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.classList.add("hidden");

    const name = document.getElementById("name").value.trim().replace(/\s+/g, " ");
    const email = document.getElementById("email").value.trim();
    const website = document.getElementById("website").value;

    if (name.length < 2) return showError("Please enter your full name.");
    if (!TX.validEmail(email)) return showError("Please enter a valid email address.");

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating your link…";

    try {
      const token = await TX.recaptchaToken("referral_signup");
      const data = await TX.post({
        type: "referrer_signup",
        name,
        email,
        referredBy,
        website,
        elapsedMs: Date.now() - TX.pageLoadedAt,
        recaptchaToken: token
      });

      if (data.error) throw new Error(data.error);
      if (!data.referralCode || !data.referralURL) throw new Error("Invalid server response");

      showResult(data);
    } catch (err) {
      console.error(err);
      showError(err && err.message && !/network|fetch|invalid server/i.test(err.message)
        ? err.message
        : "Something went wrong. Please try again in a moment.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Get my referral link";
    }
  });

  function showResult(data) {
    const link = data.referralURL;
    const message = "I use Taxentric Solutions for my taxes and bookkeeping and recommend them. You can get started here: " + link;

    document.getElementById("refLink").textContent = link;
    document.getElementById("refCode").textContent = data.referralCode;
    document.getElementById("dashboardLink").href = data.dashboardURL;

    if (data.existing) {
      document.getElementById("result-title").textContent = "Welcome back!";
      document.getElementById("result-sub").textContent = "You're already in the program. Here's your referral link.";
    }

    document.getElementById("shareSms").href = "sms:?&body=" + encodeURIComponent(message);
    document.getElementById("shareWa").href = "https://api.whatsapp.com/send?text=" + encodeURIComponent(message);
    document.getElementById("shareFb").href = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(link);
    document.getElementById("shareEmail").href = "mailto:?subject=" + encodeURIComponent("Check out Taxentric Solutions") + "&body=" + encodeURIComponent(message);

    document.getElementById("copy-link").onclick = (ev) => TX.copy(link, ev.currentTarget);
    document.getElementById("copy-code").onclick = (ev) => TX.copy(data.referralCode, ev.currentTarget);

    signupSection.classList.add("hidden");
    result.classList.remove("hidden");
    result.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  const dashRefCode = document.querySelector("#dashRefCode");
  const dashClicks = document.querySelector("#dashClicks");
  const dashSignups = document.querySelector("#dashSignups");
  const dashRewards = document.querySelector("#dashRewards");
  const dashContent = document.querySelector("#dashboardContent");
  const dashError = document.querySelector("#dashError");

  if (!code) {
    dashError.textContent = "Referral code missing.";
    dashError.classList.remove("hidden");
    return;
  }

  fetch(`https://script.google.com/macros/s/AKfycbz60mk8JClGWN4SdvOHEB0DC10LMXTKqea_aMg291ssIkipze1kOU1Tn_JOdCoHqAQ54g/exec?code=${encodeURIComponent(code)}`
  )
    .then(res => res.json())
    .then(data => {
      if (data.status !== "success") {
        throw new Error(data.message || "Invalid response");
      }

      dashRefCode.textContent = data.referralCode;
      dashClicks.textContent = data.clicks;
      dashSignups.textContent = data.signups;
      dashRewards.textContent = data.rewards ?? "0";

      dashContent.classList.remove("hidden");
    })
    .catch(err => {
      console.error(err);
      dashError.textContent = "Unable to load dashboard.";
      dashError.classList.remove("hidden");
    });

});

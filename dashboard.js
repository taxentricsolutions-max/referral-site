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

  fetch(`https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbyVJJcWmT0SF__E2T4q-pzunNcE4PBQ6E8Jq6ZEGhK4fn4ELwgqp8KDSzu8VUgmHiE9iA/exec?code=${encodeURIComponent(code)}`
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

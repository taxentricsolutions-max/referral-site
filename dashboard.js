const params = new URLSearchParams(window.location.search);
const code = params.get("code");

const dashRefCode = document.querySelector("#dashRefCode");
const dashClicks = document.querySelector("#dashClicks");
const dashSignups = document.querySelector("#dashSignups");
const dashRewards = document.querySelector("#dashRewards");
const dashContent = document.querySelector("#dashboardContent");
const dashError = document.querySelector("#dashError");

if (code) {
  fetch(`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec?code=${code}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        dashRefCode.textContent = data.referralCode;
        dashClicks.textContent = data.clicks;
        dashSignups.textContent = data.signups;
        dashRewards.textContent = data.rewards;
        dashContent.classList.remove("hidden");
      } else {
        dashError.textContent = data.message;
        dashError.classList.remove("hidden");
      }
    })
    .catch(err => {
      console.error(err);
      dashError.classList.remove("hidden");
    });
} else {
  dashError.textContent = "Referral code missing.";
  dashError.classList.remove("hidden");
}

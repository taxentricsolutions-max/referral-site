const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqKacblu42HnYPvDF4HfmLsnytwrc9rwkDGs2k5wAJ9SjlNynytMhoVpZ0bPz7AGBdnw/exec";

// Get referral code from URL query string
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get("code");

// DOM elements
const totalClicks = document.querySelector("#totalClicks");
const totalSignups = document.querySelector("#totalSignups");
const totalFiled = document.querySelector("#totalFiled");
const dashboardLink = document.querySelector("#dashboardLink");

if (!referralCode) {
  alert("Referral code not found in URL.");
} else {
  fetchReferralData(referralCode);
}

async function fetchReferralData(code) {
  try {
    const response = await fetch(`${SCRIPT_URL}?refCode=${encodeURIComponent(code)}`);
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();

    // Populate dashboard
    totalClicks.textContent = data.clicks || 0;
    totalSignups.textContent = data.signups || 0;
    totalFiled.textContent = data.filed || 0;

    // Optional: if you want to dynamically update the portal link
    dashboardLink.href = data.dashboardURL || "https://portal.taxentric.com";

  } catch (err) {
    console.error(err);
    alert("Failed to load dashboard data.");
  }
}

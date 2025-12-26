const API_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec"; // Replace with your Web App URL

// Signup Form
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const referredBy = document.getElementById("referredBy").value;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "signup", name, email, referredBy, code: "" })
    });

    const data = await response.json();

    // Use referral code returned by Apps Script
    const refCode = data.refCode;
    const shareLink = `${window.location.href}?ref=${refCode}`;

    document.getElementById("refCode").textContent = refCode;
    document.getElementById("shareLink").textContent = shareLink;

    document.getElementById("fbShare").href = `https://www.facebook.com/sharer/sharer.php?u=${shareLink}`;
    document.getElementById("twShare").href = `https://twitter.com/intent/tweet?url=${shareLink}`;
    document.getElementById("waShare").href = `https://api.whatsapp.com/send?text=${shareLink}`;

    document.getElementById("result").classList.remove("hidden");

  } catch (err) {
    alert("Signup failed. Please try again.");
    console.error(err);
  }
});

// Tracker
document.getElementById("trackBtn").addEventListener("click", async () => {
  const code = document.getElementById("trackerCode").value;

  try {
    const response = await fetch(`${API_URL}?code=${code}`);
    const data = await response.json();

    document.getElementById("trackerResult").innerHTML =
      `Clicks: ${data.clicks || 0} <br> Signups: ${data.signups || 0}`;
  } catch (err) {
    alert("Could not retrieve tracker data.");
    console.error(err);
  }
});

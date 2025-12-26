const API_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec";

// Signup Form
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const referredBy = document.getElementById("referredBy").value;

  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "signup", name, email, referredBy, code: "" })
  });
  const resultText = await response.text();

  if (resultText === "SIGNUP OK") {
    const refCode = generateCode(); // optional client-side display
    const shareLink = `${window.location.href}?ref=${refCode}`;

    document.getElementById("refCode").textContent = refCode;
    document.getElementById("shareLink").textContent = shareLink;
    document.getElementById("fbShare").href = `https://www.facebook.com/sharer/sharer.php?u=${shareLink}`;
    document.getElementById("twShare").href = `https://twitter.com/intent/tweet?url=${shareLink}`;
    document.getElementById("waShare").href = `https://api.whatsapp.com/send?text=${shareLink}`;

    document.getElementById("result").classList.remove("hidden");
  } else {
    alert("Signup failed. Try again.");
  }
});

// Tracker
document.getElementById("trackBtn").addEventListener("click", async () => {
  const code = document.getElementById("trackerCode").value;
  const response = await fetch(`${API_URL}?code=${code}`);
  const data = await response.json();
  document.getElementById("trackerResult").innerHTML =
    `Clicks: ${data.clicks || 0} <br> Signups: ${data.signups || 0}`;
});

// Simple client-side code generator (optional)
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const API_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get("ref");

if (refCode) {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "trackClick", code: refCode })
  });
}

document.getElementById("signupForm").onsubmit = async e => {
  e.preventDefault();

  const code = generateCode();

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "signup",
      name: name.value,
      email: email.value,
      code,
      referredBy: refCode
    })
  });

  const link = `${location.origin}?ref=${code}`;

  document.getElementById("result").innerHTML = `
    <h3>Your Referral Code: ${code}</h3>
    <input value="${link}" readonly onclick="this.select()">
    <p>
      <a href="https://twitter.com/intent/tweet?url=${link}" target="_blank">Share on X</a> |
      <a href="https://www.facebook.com/sharer/sharer.php?u=${link}" target="_blank">Facebook</a> |
      <a href="https://wa.me/?text=${link}" target="_blank">WhatsApp</a>
    </p>
  `;
};

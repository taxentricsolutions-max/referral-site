const signupToggle = document.getElementById("signupToggle");
const trackToggle = document.getElementById("trackToggle");
const signupSection = document.getElementById("signupSection");
const trackerSection = document.getElementById("trackerSection");

function switchSection(show, hide) {
  hide.style.opacity = 0;
  setTimeout(() => {
    hide.classList.add("hidden");
    show.classList.remove("hidden");
    show.style.opacity = 0;
    setTimeout(() => {
      show.style.opacity = 1;
    }, 20);
  }, 200);
}

/* TOGGLE HANDLERS */
signupToggle.addEventListener("click", () => {
  signupToggle.classList.add("active");
  trackToggle.classList.remove("active");
  switchSection(signupSection, trackerSection);
});

trackToggle.addEventListener("click", () => {
  trackToggle.classList.add("active");
  signupToggle.classList.remove("active");
  switchSection(trackerSection, signupSection);
});

/* SIGNUP FORM */
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;

  const response = await fetch("https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec", {
    method: "POST",
    body: JSON.stringify({ name, email })
  });

  const data = await response.json();

  document.getElementById("refCode").textContent = data.referralCode;
  document.getElementById("shareLink").textContent = data.shareUrl;
  document.getElementById("result").classList.remove("hidden");
});

/* TRACKER */
document.getElementById("trackBtn").addEventListener("click", async () => {
  const code = document.getElementById("trackerCode").value;

  const response = await fetch(
    `https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec?code=${code}`
  );
  const data = await response.json();

  document.getElementById("trackerResult").innerHTML =
    `You have <strong>${data.count}</strong> referrals.`;
});

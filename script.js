// ==========================
// CONFIG
// ==========================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzWhwyeN7V-QA6YVy9TJn8TZjWRBryiN9WXyvrmhIylH2xTUQaDWu4fLTs9P2gvtFuCeQ/exec";

// ==========================
// SELECTORS
// ==========================
const form = document.querySelector("#signup-form");
const submitBtn = document.querySelector("#submit-btn");
const successMsg = document.querySelector("#success-message");
const resultBox = document.querySelector("#result");
const refCodeSpan = document.querySelector("#refCode");
const copyBtn = document.querySelector("#copy-btn");

const signupToggle = document.querySelector("#signupToggle");
const trackToggle = document.querySelector("#trackToggle");
const signupSection = document.querySelector("#signupSection");
const trackerSection = document.querySelector("#trackerSection");

const trackBtn = document.querySelector("#trackBtn");
const trackerCodeInput = document.querySelector("#trackerCode");
const trackerResult = document.querySelector("#trackerResult");

const shareFb = document.querySelector("#shareFb");
const shareTw = document.querySelector("#shareTw");
const shareWa = document.querySelector("#shareWa");

// ==========================
// TAB TOGGLE
// ==========================
signupToggle.addEventListener("click", () => {
  signupToggle.classList.add("active");
  trackToggle.classList.remove("active");
  signupSection.classList.remove("hidden");
  trackerSection.classList.add("hidden");
});

trackToggle.addEventListener("click", () => {
  trackToggle.classList.add("active");
  signupToggle.classList.remove("active");
  trackerSection.classList.remove("hidden");
  signupSection.classList.add("hidden");
});

// ==========================
// SIGN UP FORM SUBMISSION
// ==========================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.querySelector("#name").value.trim();
  const email = document.querySelector("#email").value.trim();

  if (!name || !email) {
    alert("Please enter your name and email.");
    return;
  }

  submitBtn.innerText = "Submitting...";
  submitBtn.disabled = true;

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({ name, email })
    });

    const result = await response.json();

    if (result.status !== "success") {
      throw new Error(result.message || "Submission failed");
    }

    // SUCCESS UI
    form.reset();
    successMsg.classList.remove("hidden");

    document.getElementById("refCode").innerText = result.refCode;
    document.getElementById("result").classList.remove("hidden");

  } catch (err) {
    alert("Something went wrong. Please try again.");
    console.error(err);
  }

  submitBtn.innerText = "Get Started";
  submitBtn.disabled = false;
});


// ==========================
// COPY REFERRAL CODE
// ==========================
copyBtn.addEventListener("click", () => {
  const code = refCodeSpan.textContent;
  navigator.clipboard.writeText(code);
  alert("Referral code copied!");
});

// ==========================
// TRACK STATS
// ==========================
trackBtn.addEventListener("click", () => {
  const code = trackerCodeInput.value.trim();
  if (!code) {
    alert("Please enter a referral code.");
    return;
  }

  // Dummy tracking output (replace with real API logic if needed)
  trackerResult.textContent = `Referrals for ${code}: 0`; 
});

// ==========================
// SHARE BUTTONS
// ==========================
shareFb.addEventListener("click", () => {
  const url = encodeURIComponent(window.location.href + "?ref=" + refCodeSpan.textContent);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
});

shareTw.addEventListener("click", () => {
  const url = encodeURIComponent(window.location.href + "?ref=" + refCodeSpan.textContent);
  window.open(`https://twitter.com/intent/tweet?url=${url}`, "_blank");
});

shareWa.addEventListener("click", () => {
  const url = encodeURIComponent(window.location.href + "?ref=" + refCodeSpan.textContent);
  window.open(`https://wa.me/?text=${url}`, "_blank");
});

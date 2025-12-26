const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec";

document.addEventListener("DOMContentLoaded", () => {

  // --- SIGN UP ---
  const form = document.querySelector("#signup-form");
  const submitBtn = document.querySelector("#submit-btn");
  const successMsg = document.querySelector("#success-message");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      if (!response.ok) throw new Error("Submission failed");
      const data = await response.json();

      const refCode = data.referralCode || "ABC123";
      document.getElementById("refCode").innerText = refCode;
      successMsg.classList.remove("hidden");

      const baseUrl = "https://taxentricsolutions-max.github.io/referral-site/?ref=" + refCode;
      document.getElementById("shareFb").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}`;
      document.getElementById("shareTw").href = `https://twitter.com/intent/tweet?url=${encodeURIComponent(baseUrl)}&text=${encodeURIComponent("Join our referral program!")}`;
      document.getElementById("shareWa").href = `https://api.whatsapp.com/send?text=${encodeURIComponent("Check this out: " + baseUrl)}`;

    } catch (err) {
      alert("Something went wrong. Please try again.");
      console.error(err);
    }

    submitBtn.innerText = "Get Started";
    submitBtn.disabled = false;
  });

  // --- TOGGLE ---
  const signupToggle = document.getElementById("signupToggle");
  const trackToggle = document.getElementById("trackToggle");
  const signupSection = document.getElementById("signupSection");
  const trackerSection = document.getElementById("trackerSection");

  signupToggle.addEventListener("click", () => {
    signupSection.classList.remove("hidden");
    trackerSection.classList.add("hidden");
    signupToggle.classList.add("active");
    trackToggle.classList.remove("active");
  });

  trackToggle.addEventListener("click", () => {
    signupSection.classList.add("hidden");
    trackerSection.classList.remove("hidden");
    signupToggle.classList.remove("active");
    trackToggle.classList.add("active");
  });

  // --- COPY BUTTON ---
  const copyBtn = document.getElementById("copy-btn");
  copyBtn.addEventListener("click", () => {
    const refCode = document.getElementById("refCode").innerText;
    navigator.clipboard.writeText(refCode).then(() => alert("Copied to clipboard!"));
  });

});

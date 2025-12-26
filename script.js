const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec";

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

    form.reset();
    successMsg.classList.remove("hidden");

  } catch (err) {
    alert("Something went wrong. Please try again.");
    console.error(err);
  }

  submitBtn.innerText = "Get Started";
  submitBtn.disabled = false;
});

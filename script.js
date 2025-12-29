document.addEventListener("DOMContentLoaded", () => {

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzJX6TOLaWw3GlPfcan3gkPUHL56yztMf5Nq9w_wJ4wxCbYAC_rBZ7mmaSXBQukXvZxqw/exec";

  /* ===============================
     AUTO-FILL REFERRAL TRACKING
  ================================ */
  const params = new URLSearchParams(window.location.search);
  const referredByFromURL = params.get("ref");

  if (referredByFromURL) {
    localStorage.setItem("referredBy", referredByFromURL);
  }

  const storedReferredBy = localStorage.getItem("referredBy") || "";

  /* ===============================
     DOM ELEMENTS
  ================================ */
  const form = document.querySelector("#signup-form");
  const submitBtn = document.querySelector("#submit-btn");
  const successMsg = document.querySelector("#success-message");
  const resultDiv = document.querySelector("#result");

  const refCodeSpan = document.querySelector("#refCode");
  const copyBtn = document.querySelector("#copy-btn");

  const shareFb = document.querySelector("#shareFb");
  const shareTw = document.querySelector("#shareTw");
  const shareWa = document.querySelector("#shareWa");
  const shareSms = document.querySelector("#shareSms");
  const dashboardLink = document.querySelector("#dashboardLink");

  if (!form) {
    console.error("Signup form not found");
    return;
  }

  /* ===============================
     FORM SUBMIT
  ================================ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#name").value.trim();
    const email = document.querySelector("#email").value.trim();

    if (!name || !email) {
      alert("Please enter your name and email.");
      return;
    }

    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;

    try {
  const formData = new FormData();
formData.append("name", name);
formData.append("email", email);
formData.append("referredBy", storedReferredBy || "");

const response = await fetch(SCRIPT_URL, {
  method: "POST",
  body: formData  // No headers needed – browser sets multipart/form-data or urlencoded
});

      if (!response.ok) throw new Error("Network error");

      const data = await response.json();
      if (data.status !== "success") throw new Error(data.message);

      successMsg.classList.remove("hidden");
      resultDiv.classList.remove("hidden");

      refCodeSpan.textContent = data.referralCode;
      dashboardLink.href = data.dashboardURL;

      shareFb.href =
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.referralURL)}`;

      shareTw.href =
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          "Join me at Taxentric!"
        )}&url=${encodeURIComponent(data.referralURL)}`;

      shareWa.href =
        `https://api.whatsapp.com/send?text=${encodeURIComponent(
          "Join me at Taxentric! " + data.referralURL
        )}`;

      const shareText = `Join me at Taxentric! Use my referral link: ${data.referralURL}`;
      shareSms.href = `sms:?body=${encodeURIComponent(shareText)}`;

      form.reset();

    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    }

    submitBtn.textContent = "Get Started";
    submitBtn.disabled = false;
  });

  /* ===============================
     COPY CODE
  ================================ */
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(refCodeSpan.textContent);
    alert("Referral code copied!");
  });

});

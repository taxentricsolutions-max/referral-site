document.addEventListener("DOMContentLoaded", () => {

  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcY0TRwlCdtx4rv2SoSCcOKn17byfgaBtdVYmx3OFJN5H-Ayqet7KcqK9bxUga1dPlcw/exec";

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

 // Inside your form submit handler — leave exactly this:
const formData = new FormData();
formData.append("name", name);
formData.append("email", email);
formData.append("referredBy", storedReferredBy || "");

try {
  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"  // This is the magic
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      referredBy: storedReferredBy || ""
    })
  });

  // With mode: "no-cors", we can't read response, so assume success if no throw
  // Or remove mode: "no-cors" if you want to read the response (still works with text/plain)

  successMsg.classList.remove("hidden");
  resultDiv.classList.remove("hidden");

  // Since we can't read real response, generate client-side (or keep server-side if removing no-cors)
  // But to match your original: generate code client-side temporarily, or use proxy below

  // Better: remove mode: "no-cors" — text/plain allows reading response
  // Full working version without no-cors:

  if (!response.ok) throw new Error("Network error");
  const data = await response.json();
  if (data.status !== "success") throw new Error(data.message);

  // ... rest of your success code (refCodeSpan, share links, etc.)

} catch (err) {
  console.error(err);
  alert("Something went wrong. Please try again.");
}

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

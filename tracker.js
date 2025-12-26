const API_URL = "https://script.google.com/macros/s/AKfycbxYKeSzL7hrrxrB69r-0352jz0Mvd2BJc-bP4F_uOj_shF6ypODrt6Uyafg6vr4UZ5G9A/exec";

function lookup() {
  fetch(`${API_URL}?code=${code.value}`)
    .then(r => r.json())
    .then(data => {
      stats.innerHTML = `
        <p>Clicks: ${data.clicks}</p>
        <p>Signups: ${data.signups}</p>
      `;
    });
}

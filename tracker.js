const API_URL = "PASTE_YOUR_APPS_SCRIPT_URL";

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

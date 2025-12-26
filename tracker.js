const API_URL = "https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec";

function lookup() {
  fetch(`${https://script.google.com/macros/s/AKfycbweM6Q6adZKmlVedialFERzzxkAqSyonh0MWIMpz2H5UNwN0MGhcs3KWcscfMBTIc6EBQ/exec}?code=${code.value}`)
    .then(r => r.json())
    .then(data => {
      stats.innerHTML = `
        <p>Clicks: ${data.clicks}</p>
        <p>Signups: ${data.signups}</p>
      `;
    });
}

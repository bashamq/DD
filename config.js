// Replace only the URL below with your deployed Google Apps Script Web App URL.
const API_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callback = "cb_" + Date.now() + "_" + Math.floor(Math.random()*10000);
    const script = document.createElement("script");
    const query = new URLSearchParams({action, callback, ...params});
    script.src = API_URL + "?" + query.toString();

    window[callback] = data => {
      cleanup();
      if (data && data.ok === false) reject(new Error(data.error || "Server error"));
      else resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Google Sheet API connection failed. Check API_URL and Apps Script deployment."));
    };

    document.body.appendChild(script);

    function cleanup() {
      delete window[callback];
      script.remove();
    }
  });
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

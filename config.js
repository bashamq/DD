// Chenab Engineering - Shared API Configuration
const API_URL = "https://script.google.com/macros/s/AKfycbwHMX9vrCtwnfM-Ino3s64YS1ywNDIfadPZG3M5ElPs66P9PF5RarF53b8sW-LIa2PV/exec";

function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callback = "chenab_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
    const script = document.createElement("script");
    let done = false;
    let timer;

    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { delete window[callback]; } catch (_) {}
      if (script.parentNode) script.parentNode.removeChild(script);
      fn(value);
    };

    window[callback] = data => {
      if (data && data.ok === false) {
        finish(reject, new Error(data.error || "Server error"));
      } else {
        finish(resolve, data || {});
      }
    };

    script.onerror = () => finish(
      reject,
      new Error("Google Sheet API connection failed. Please check the Apps Script deployment.")
    );

    const q = new URLSearchParams({
      action: String(action || ""),
      callback,
      _ts: Date.now().toString(),
      ...params
    });

    script.src = API_URL + "?" + q.toString();
    script.async = true;
    document.head.appendChild(script);

    timer = setTimeout(() => finish(
      reject,
      new Error("Google Sheet API timed out. Please check your internet connection or Apps Script deployment.")
    ), 12000);
  });
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

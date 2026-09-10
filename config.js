// Chenab Engineering - Shared API Configuration
// Keep this file in the same GitHub Pages folder as the HTML files.

const API_URL =
  "https://script.google.com/macros/s/AKfycbwHMX9vrCtwnfM-Ino3s64YS1ywNDIfadPZG3M5ElPs66P9PF5RarF53b8sW-LIa2PV/exec";

/*
  IMPORTANT:
  The GitHub Pages site is on a different domain from Apps Script.
  Therefore this shared helper uses JSONP (script tag) rather than fetch().
  Code.gs must return callback(...); when ?callback=... is supplied.
*/

function api(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callback =
      "chenab_cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    const script = document.createElement("script");
    let finished = false;

    const query = new URLSearchParams({
      action: String(action || ""),
      callback,
      _ts: String(Date.now()),
      ...params
    });

    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[callback]; } catch (_) {}
      clearTimeout(timeout);
    }

    function fail(message) {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(message));
    }

    window[callback] = function (data) {
      if (finished) return;
      finished = true;
      cleanup();

      if (data && data.ok === false) {
        reject(new Error(data.error || "Server error"));
        return;
      }

      resolve(data);
    };

    script.onerror = function () {
      fail(
        "Google Sheet API connection failed. Please check Apps Script Web App deployment."
      );
    };

    script.src = API_URL + "?" + query.toString();
    document.head.appendChild(script);

    const timeout = setTimeout(() => {
      fail(
        "Google Sheet API timed out. Please check the Apps Script Web App deployment."
      );
    }, 20000);
  });
}

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

// Chenab Engineering - Shared API Configuration

const API_URL =
  "https://script.google.com/macros/s/AKfycbwHMX9vrCtwnfM-Ino3s64YS1ywNDIfadPZG3M5ElPs66P9PF5RarF53b8sW-LIa2PV/exec";

function api(action, params = {}) {
  return new Promise((resolve, reject) => {

    const callback =
      "chenab_cb_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 1000000);

    const script = document.createElement("script");

    let finished = false;
    let timeoutId = null;

    const query = new URLSearchParams();

    query.set("action", String(action || ""));
    query.set("callback", callback);
    query.set("_ts", String(Date.now()));
    query.set("_v", "20260911");

    Object.keys(params || {}).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        query.set(key, String(params[key]));
      }
    });

    function cleanup() {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callback];
      } catch (e) {
        window[callback] = undefined;
      }
    }

    function fail(message) {
      if (finished) return;

      finished = true;
      cleanup();

      reject(new Error(message));
    }

    window[callback] = function(data) {

      if (finished) return;

      finished = true;
      cleanup();

      if (!data) {
        reject(
          new Error("Google API returned an empty response.")
        );
        return;
      }

      if (data.ok === false) {
        reject(
          new Error(
            data.error || "Google Apps Script returned an error."
          )
        );
        return;
      }

      resolve(data);
    };

    script.async = true;

    script.onerror = function() {
      fail(
        "Google Sheet API connection failed. " +
        "Please check the Apps Script Web App deployment."
      );
    };

    script.src = API_URL + "?" + query.toString();

    document.head.appendChild(script);

    timeoutId = setTimeout(function() {
      fail(
        "Google Sheet API timed out. " +
        "Please check your internet connection or Apps Script deployment."
      );
    }, 25000);

  });
}


function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, function(character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character];
  });
}


async function apiHealth() {
  return api("health");
}

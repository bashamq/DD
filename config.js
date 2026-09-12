// ============================================================
// CHENAB ENGINEERING
// SHARED API + LOGIN SESSION CONFIGURATION
// ============================================================

const API_URL =
"https://script.google.com/macros/s/AKfycbwHMX9vrCtwnfM-Ino3s64YS1ywNDIfadPZG3M5ElPs66P9PF5RarF53b8sW-LIa2PV/exec";


function api(action, params = {}) {

  return new Promise((resolve, reject) => {

    const callback =
      "chenab_cb_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script =
      document.createElement("script");

    let finished = false;
    let timeout;


    function cleanup() {

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      try {
        delete window[callback];
      } catch (_) {}

      clearTimeout(timeout);
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


      if (data && data.ok === false) {

        const error =
          String(data.error || "Server error");


        // Session expired
        if (
          error === "AUTH_REQUIRED" ||
          error === "SESSION_EXPIRED"
        ) {

          try {
            if (typeof clearSession === "function") {
              clearSession();
            }
          } catch (_) {}

          const current =
            location.pathname.split("/").pop();

          if (current !== "login.html") {

            location.href =
              "login.html?next=" +
              encodeURIComponent(
                current + location.search
              );

          }

          return;
        }


        reject(
          new Error(error)
        );

        return;
      }


      resolve(data || {});

    };


    script.onerror = function() {

      fail(
        "Google Sheet API connection failed. " +
        "Please check Apps Script Web App deployment."
      );

    };


    // ========================================================
    // BUILD PARAMETERS
    // ========================================================

    const finalParams = {
      ...params
    };


    // ========================================================
    // ADD LOGIN SESSION TOKEN
    // ========================================================

    try {

      if (
        typeof getSession === "function"
      ) {

        const session =
          getSession();

        if (
          session &&
          session.token
        ) {

          finalParams.token =
            session.token;

        }

      }

    } catch (_) {}


    // ========================================================
    // SEND REQUEST
    // ========================================================

    const query =
      new URLSearchParams({

        action:
          String(action || ""),

        callback:
          callback,

        _ts:
          String(Date.now()),

        ...finalParams

      });


    script.src =
      API_URL +
      "?" +
      query.toString();

    script.async = true;

    document.head.appendChild(script);


    timeout =
      setTimeout(() => {

        fail(
          "Google Sheet API timed out. " +
          "Please check Apps Script deployment."
        );

      }, 20000);

  });

}


// ============================================================
// HTML ESCAPE
// ============================================================

function esc(v) {

  return String(v ?? "")
    .replace(
      /[&<>"']/g,
      c => ({

        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[c])
    );

}

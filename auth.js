/* CEW Design & Development Control System
   Authentication Helper
*/

(function () {
  "use strict";

  const SESSION_KEY = "cew_session";

  // Get current login session
  window.getSession = function () {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };

  // Save login session
  window.setSession = function (session) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );
  };

  // Clear login session
  window.clearSession = function () {
    sessionStorage.removeItem(SESSION_KEY);
  };

  // Get logged-in user
  window.currentUser = function () {
    const s = getSession();

    return s && s.user
      ? s.user
      : null;
  };

  // SHA-256 password hash
  window.sha256Hex = async function (text) {

    if (!window.crypto || !window.crypto.subtle) {
      throw new Error(
        "Browser security does not support SHA-256. Please use HTTPS."
      );
    }

    const data =
      new TextEncoder().encode(String(text));

    const hashBuffer =
      await crypto.subtle.digest(
        "SHA-256",
        data
      );

    return Array.from(
      new Uint8Array(hashBuffer)
    )
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  };

  // Require login
  window.requireLogin = function () {

    const s = getSession();

    if (!s || !s.token || !s.user) {

      const next = encodeURIComponent(
        location.pathname.split("/").pop() +
        location.search
      );

      location.href =
        "login.html?next=" + next;

      return false;
    }

    return true;
  };

  // Require specific role
  window.requireRole = function (role) {

    if (!requireLogin()) {
      return false;
    }

    const u = currentUser();

    if (
      !u ||
      String(u.role || "").toLowerCase() !==
      String(role || "").toLowerCase()
    ) {

      document.body.innerHTML = `
        <div style="
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#eef4f8;
          font-family:Arial,sans-serif;
          padding:24px;
          box-sizing:border-box;
        ">

          <div style="
            max-width:520px;
            width:100%;
            background:#fff;
            border-radius:18px;
            padding:36px;
            text-align:center;
            box-shadow:0 15px 40px rgba(0,0,0,.12);
          ">

            <div style="font-size:46px;">
              🔒
            </div>

            <h2 style="
              color:#17324a;
              margin:14px 0 8px;
            ">
              Access Restricted
            </h2>

            <p style="
              color:#5f7180;
              line-height:1.6;
            ">
              This page is available only to
              authorized users.
            </p>

            <button
              onclick="location.href='index.html'"
              style="
                border:0;
                background:#176f9f;
                color:white;
                padding:12px 22px;
                border-radius:9px;
                cursor:pointer;
                font-weight:700;
              "
            >
              Back to System
            </button>

          </div>
        </div>
      `;

      return false;
    }

    return true;
  };

  // Logout
  window.logout = function () {

    clearSession();

    location.href =
      "login.html";
  };

})();

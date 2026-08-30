import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

function showFatalError(title, detail) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div dir="rtl" style="min-height:100vh;background:#16241F;color:#F4EEDC;padding:24px;font-family:sans-serif;box-sizing:border-box;">
      <div style="font-size:20px;font-weight:700;margin-bottom:12px;">حدث خطأ فعلي - تفاصيله هنا:</div>
      <div style="font-size:13px;color:#C9BFA0;margin-bottom:16px;">${title}</div>
      <div dir="ltr" style="direction:ltr;text-align:left;font-size:12px;background:rgba(255,255,255,0.06);padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">${detail}</div>
    </div>
  `;
}

window.addEventListener("error", (e) => {
  showFatalError("JS Error", (e.error && e.error.stack) || e.message || String(e));
});
window.addEventListener("unhandledrejection", (e) => {
  showFatalError("Unhandled Promise Rejection", (e.reason && (e.reason.stack || e.reason.message)) || String(e.reason));
});

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  showFatalError("Render crash", err.stack || err.message || String(err));
}

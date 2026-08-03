export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("PWA Service Worker registered."))
      .catch((error) => console.error("Service Worker registration failed:", error));
  });
}

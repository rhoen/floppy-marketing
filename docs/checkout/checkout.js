(function () {
  "use strict";

  const REQUEST_TIMEOUT_MS = 15000;
  const STRIPE_CHECKOUT_ORIGIN = "https://checkout.stripe.com";
  const config = window.FLOPPY_CHECKOUT_CONFIG || {};

  const card = document.getElementById("checkout-card");
  const state = document.getElementById("checkout-state");
  const statusMark = document.getElementById("status-mark");
  const statusIndicator = document.getElementById("status-indicator");
  const eyebrow = document.getElementById("checkout-eyebrow");
  const title = document.getElementById("checkout-title");
  const lead = document.getElementById("checkout-lead");
  const support = document.getElementById("checkout-support");
  const actions = document.getElementById("checkout-actions");
  const retryButton = document.getElementById("retry-checkout");

  let requestInFlight = false;

  function parseCheckoutEndpoint(value) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("The checkout endpoint is not configured.");
    }

    const endpoint = new URL(value);
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password
    ) {
      throw new Error("The checkout endpoint must be a secure URL.");
    }

    return endpoint;
  }

  function parseStripeCheckoutUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("The checkout response did not include a URL.");
    }

    const checkoutUrl = new URL(value);
    if (
      checkoutUrl.origin !== STRIPE_CHECKOUT_ORIGIN ||
      checkoutUrl.username ||
      checkoutUrl.password
    ) {
      throw new Error("The checkout response did not contain a trusted Stripe URL.");
    }

    return checkoutUrl;
  }

  function showLoading() {
    card.classList.remove("result-card--error");
    card.setAttribute("aria-busy", "true");
    statusMark.classList.add("status-mark--loading");
    statusIndicator.className = "status-spinner";
    statusIndicator.textContent = "";
    eyebrow.textContent = "Secure checkout";
    title.textContent = "Opening checkout…";
    lead.textContent =
      "We’re preparing your secure Stripe checkout. You’ll be redirected in a moment.";
    support.hidden = true;
    actions.hidden = true;
    retryButton.disabled = true;
  }

  function showError() {
    card.classList.add("result-card--error");
    card.setAttribute("aria-busy", "false");
    statusMark.classList.remove("status-mark--loading");
    statusIndicator.className = "";
    statusIndicator.textContent = "!";
    eyebrow.textContent = "Checkout unavailable";
    title.textContent = "We couldn’t open checkout.";
    lead.textContent =
      "Check your connection and try again. Nothing has been charged.";
    support.hidden = false;
    actions.hidden = false;
    retryButton.disabled = false;
  }

  async function openCheckout() {
    if (requestInFlight) return;

    requestInFlight = true;
    showLoading();

    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const endpoint = parseCheckoutEndpoint(config.checkoutEndpoint);
      const response = await fetch(endpoint.href, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("The checkout endpoint returned an error.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("The checkout endpoint returned an unexpected response.");
      }

      const data = await response.json();
      const checkoutUrl = parseStripeCheckoutUrl(data.checkoutUrl);
      window.location.replace(checkoutUrl.href);
    } catch {
      showError();
    } finally {
      window.clearTimeout(timeout);
      requestInFlight = false;
    }
  }

  state.hidden = false;
  retryButton.addEventListener("click", openCheckout);
  openCheckout();
})();

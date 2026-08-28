(function () {
  "use strict";

  const REQUEST_TIMEOUT_MS = 15000;
  const HEADLINES = [
    { lead: "Welcome to the", accent: "Floppy revolution." },
    { lead: "You’re making a", accent: "great decision." },
    { lead: "Get ready to", accent: "change your life." },
    { lead: "Welcome to", accent: "Team Floppy." },
  ];
  const config = window.FLOPPY_EMAIL_SIGNUP_CONFIG || {};

  const card = document.getElementById("signup-card");
  const title = document.getElementById("signup-title");
  const form = document.getElementById("email-signup-form");
  const emailInput = document.getElementById("email");
  const submitButton = document.getElementById("submit-button");
  const submitLabel = document.getElementById("submit-label");
  const submitSpinner = document.getElementById("submit-spinner");
  const formStatus = document.getElementById("form-status");
  const successState = document.getElementById("success-state");
  const successTitle = document.getElementById("success-title");

  function setRandomHeadline() {
    const headline = HEADLINES[Math.floor(Math.random() * HEADLINES.length)];
    title.replaceChildren(
      document.createTextNode(headline.lead + " "),
      Object.assign(document.createElement("span"), {
        className: "headline-accent",
        textContent: headline.accent,
      })
    );
  }

  function parseEndpoint(value) {
    if (typeof value !== "string" || !value.trim()) {
      throw new Error("The download email endpoint is not configured.");
    }

    const endpoint = new URL(value);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password) {
      throw new Error("The download email endpoint must be a secure URL.");
    }

    return endpoint;
  }

  function setLoading(isLoading) {
    card.setAttribute("aria-busy", String(isLoading));
    form.setAttribute("aria-busy", String(isLoading));
    submitButton.disabled = isLoading;
    submitLabel.textContent = isLoading ? "Sending…" : "Send me Floppy";
    submitSpinner.hidden = !isLoading;
  }

  function clearError() {
    emailInput.removeAttribute("aria-invalid");
    formStatus.hidden = true;
    formStatus.textContent = "";
  }

  function showError(message, focusInput) {
    formStatus.textContent = message;
    formStatus.hidden = false;

    if (focusInput) {
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
    }
  }

  function showSuccess() {
    form.hidden = true;
    successState.hidden = false;
    card.setAttribute("aria-busy", "false");
    emailInput.value = "";
    successTitle.focus();
  }

  async function submitEmail(event) {
    event.preventDefault();
    if (submitButton.disabled) return;

    clearError();
    setLoading(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(function () {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    try {
      const endpoint = parseEndpoint(config.downloadEmailEndpoint);
      const response = await fetch(endpoint.href, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "omit",
        redirect: "error",
        body: JSON.stringify({ email: emailInput.value.trim() }),
        signal: controller.signal,
      });

      if (response.status === 400) {
        showError("That email doesn’t look right. Check it and try again.", true);
        return;
      }

      if (response.status === 429) {
        showError("A lot of people are joining right now. Wait a moment and try again.", false);
        return;
      }

      if (!response.ok) {
        throw new Error("The download email endpoint returned an error.");
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("The download email endpoint returned an unexpected response.");
      }

      const data = await response.json();
      if (data.accepted !== true) {
        throw new Error("The download email request was not accepted.");
      }

      showSuccess();
    } catch {
      showError("That didn’t go through. Check your connection and try again.", false);
    } finally {
      window.clearTimeout(timeout);
      if (!form.hidden) setLoading(false);
    }
  }

  setRandomHeadline();
  emailInput.addEventListener("input", clearError);
  form.addEventListener("submit", submitEmail);
  form.hidden = false;
})();

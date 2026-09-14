(function () {
  "use strict";

  const EVENTS_TAB_ID = "events";
  const view = document.getElementById("view");

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function eventApi() {
    return window.PocketHatcheryEvents || null;
  }

  function isEventsTabActive() {
    const button = document.querySelector(`.nav-button[data-tab="${EVENTS_TAB_ID}"]`);
    return !!button?.classList.contains("is-active");
  }

  function eventTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function renderEvents() {
    if (!view || !isEventsTabActive()) return;
    const api = eventApi();
    const events = api?.getAll() || [];
    const limit = Number(api?.maxToastsPerLaunch || 3);
    const cards = events.map((event, index) => `
      <article class="paper-panel event-card">
        <div class="event-index" aria-hidden="true">${events.length - index}</div>
        <div class="event-copy">
          <p>${escapeHtml(event.message)}</p>
          <time datetime="${new Date(event.at).toISOString()}">${escapeHtml(eventTime(event.at))}</time>
        </div>
      </article>`).join("");

    view.innerHTML = `
      <section class="archive-page events-page" data-events-page>
        <header class="events-heading">
          <p class="eyebrow">Hatchery notices</p>
          <h1>Events</h1>
          <p>Only the first ${limit} toast popups appear during each launch. Later notices are filed here so you can read them when you want.</p>
        </header>
        <article class="paper-panel events-summary">
          <div>
            <p class="eyebrow">This launch</p>
            <strong>${events.length.toLocaleString()} filed event${events.length === 1 ? "" : "s"}</strong>
            <small>Newest notices appear first. The log resets on the next launch.</small>
          </div>
          ${events.length ? '<button class="button" type="button" data-action="clear-events">Clear events</button>' : ""}
        </article>
        ${events.length ? `<div class="event-list">${cards}</div>` : `
          <article class="paper-panel events-empty">
            <span class="events-empty-mark" aria-hidden="true">✓</span>
            <div><h2>Nothing filed yet</h2><p>Any notification suppressed after the toast limit is reached will appear here.</p></div>
          </article>`}
      </section>`;
  }

  function scheduleRender() {
    window.queueMicrotask(renderEvents);
  }

  const observer = view ? new MutationObserver(() => {
    if (!isEventsTabActive()) return;
    if (view.querySelector("[data-events-page]")) return;
    renderEvents();
  }) : null;
  observer?.observe(view, { childList: true });

  document.addEventListener("click", (event) => {
    const tabButton = event.target.closest(`[data-tab="${EVENTS_TAB_ID}"]`);
    if (tabButton) scheduleRender();

    const clearButton = event.target.closest('[data-action="clear-events"]');
    if (!clearButton) return;
    eventApi()?.clear();
    renderEvents();
  });

  window.addEventListener("pocket-hatchery-events-changed", () => {
    if (isEventsTabActive()) renderEvents();
  });
})();

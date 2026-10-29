/**
 * Rendering helpers for build requests: status pill, progress track and
 * update timeline. Shared by account.html (customer) and admin.html.
 * Needs window.CPC from firebase-app.js.
 */
const BuildStatus = {
  esc(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
  },

  date(ms, withTime) {
    if (!ms) return '';
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    if (withTime) Object.assign(opts, { hour: 'numeric', minute: '2-digit' });
    return new Date(ms).toLocaleString(undefined, opts);
  },

  pill(status) {
    const id = status || 'new';
    return `<span class="status-pill status-pill--${this.esc(id)}">${this.esc(CPC.statusLabel(id))}</span>`;
  },

  track(status) {
    if (status === CPC.CLOSED.id) return '';
    const idx = Math.max(0, CPC.STATUSES.findIndex(s => s.id === (status || 'new')));
    const steps = CPC.STATUSES.map((s, i) => {
      const cls = i < idx ? 'is-done' : i === idx ? 'is-current' : '';
      return `<li class="${cls}"><span>${this.esc(s.label)}</span></li>`;
    }).join('');
    return `<ol class="track" aria-label="Build progress: ${this.esc(CPC.statusLabel(status))}">${steps}</ol>`;
  },

  updates(r) {
    const items = Object.values(r.updates || {}).sort((a, b) => (b.at || 0) - (a.at || 0));
    const received = `
      <li>
        <div class="timeline__meta">${this.date(r.timestamp, true)} · Received</div>
        <p>We got your request. Expect your build plan by email within 24–48 hours.</p>
      </li>`;
    const rows = items.map(u => `
      <li>
        <div class="timeline__meta">${this.date(u.at, true)}${u.status ? ' · ' + this.esc(CPC.statusLabel(u.status)) : ''}</div>
        ${u.text ? `<p>${this.esc(u.text).replace(/\n/g, '<br>')}</p>` : ''}
      </li>`).join('');
    return `<ol class="timeline">${rows}${received}</ol>`;
  },

  requestCard(id, r) {
    return `
      <article class="req-card card" id="req-${this.esc(id)}">
        <header class="req-card__head">
          <div>
            <h3>${this.esc(r.buildType && r.buildType !== 'None' ? r.buildType : 'Custom build')}</h3>
            <p class="muted small">Requested ${this.date(r.timestamp)}${r.budget && r.budget !== 'Not specified' ? ' · Budget ' + this.esc(r.budget) : ''}</p>
          </div>
          ${this.pill(r.status)}
        </header>
        ${this.track(r.status)}
        <div class="req-card__body">
          <div>
            <h4>Updates</h4>
            ${this.updates(r)}
          </div>
          ${r.message ? `<div><h4>Your request</h4><p class="req-card__msg">${this.esc(r.message).replace(/\n/g, '<br>')}</p></div>` : ''}
        </div>
      </article>`;
  }
};

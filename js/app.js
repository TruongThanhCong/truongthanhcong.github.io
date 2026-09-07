/**
 * Academic Personal Website - Main Application Script
 * Truong Thanh Cong | Faculty of Data Science, UFM
 */

(function () {
  'use strict';

  // --- Utility Functions ---
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const getLang = () => document.documentElement.getAttribute('lang') === 'vi' ? 'vi' : 'en';

  // --- Language Management ---
  const LANG_KEY = 'site-lang';
  function applyLang(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
      const val = lang === 'vi' ? el.getAttribute('data-vi') : el.getAttribute('data-en');
      if (val !== null) el.textContent = val;
    });
    document.querySelectorAll('[data-lang-show]').forEach(el => {
      el.hidden = el.getAttribute('data-lang-show') !== lang;
    });
    document.querySelectorAll('[data-lang-opt]').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('data-lang-opt') === lang);
    });
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}

    // Update dynamic text on toggle buttons if open/closed
    document.querySelectorAll('.referee-expand-btn').forEach(btn => {
      const count = btn.getAttribute('data-count');
      const label = lang === 'vi' ? `${count} bài` : `${count} paper${Number(count) > 1 ? 's' : ''}`;
      const textSpan = btn.querySelector('.referee-btn-text');
      if (textSpan) textSpan.textContent = label;
    });

    document.querySelectorAll('.referee-count-badge').forEach(el => {
      const count = el.getAttribute('data-count');
      if (count) {
        el.textContent = lang === 'vi' ? `${count} lượt` : `${count} review${Number(count) > 1 ? 's' : ''}`;
      }
    });

    const moreBtn = document.getElementById('btnToggleMoreJournals');
    if (moreBtn) {
      const isOpen = moreBtn.classList.contains('is-active');
      const count = moreBtn.getAttribute('data-count') || '';
      const textSpan = moreBtn.querySelector('.more-journals-text');
      if (textSpan) {
        textSpan.textContent = isOpen
          ? (lang === 'vi' ? 'Thu gọn' : 'Show less')
          : (lang === 'vi' ? `Xem thêm (${count} tạp chí)` : `Show more (${count} journals)`);
      }
    }
  }

  // --- Palette / Theme Management ---
  const PALETTE_KEY = 'site-palette';
  function applyPalette(palette) {
    const p = palette || 'burgundy';
    document.documentElement.setAttribute('data-palette', p);
    try { localStorage.setItem(PALETTE_KEY, p); } catch (e) {}
  }
  window.setPalette = applyPalette;

  // --- Accordion Toggle for Journal Referee Papers ---
  window.toggleReferee = function (id) {
    const panel = document.getElementById(id);
    const btn = document.querySelector(`[data-target="${id}"]`);
    if (!panel || !btn) return;

    const isOpen = panel.classList.toggle('is-open');
    btn.classList.toggle('is-active', isOpen);
  };

  // --- Accordion Toggle for Remaining Journals ---
  window.toggleMoreJournals = function () {
    const moreContainer = document.getElementById('refereeMore');
    const btn = document.getElementById('btnToggleMoreJournals');
    if (!moreContainer || !btn) return;

    const isOpen = moreContainer.classList.toggle('is-open');
    btn.classList.toggle('is-active', isOpen);
    const count = btn.getAttribute('data-count') || '';
    const lang = getLang();
    const textSpan = btn.querySelector('.more-journals-text');
    if (textSpan) {
      textSpan.textContent = isOpen
        ? (lang === 'vi' ? 'Thu gọn' : 'Show less')
        : (lang === 'vi' ? `Xem thêm (${count} tạp chí)` : `Show more (${count} journals)`);
    }
  };

  // --- 1. Load Publications ---
  async function loadPublications() {
    const container = document.getElementById('pubContainer');
    if (!container) return;

    try {
      const res = await fetch('Selected_publications.json');
      const data = await res.json();
      const pubs = (data.selected_publications || []).slice();
      pubs.sort((a, b) => (b.year || 0) - (a.year || 0));

      const byYear = {};
      const order = [];
      pubs.forEach(p => {
        const y = p.year || '—';
        if (!byYear[y]) { byYear[y] = []; order.push(y); }
        byYear[y].push(p);
      });

      const html = order.map(year => {
        const items = byYear[year].map(p => {
          const authors = (p.authors || []).map(a => a === 'Thanh-Cong Truong' ? `<b>${esc(a)}</b>` : esc(a)).join(', ');
          const venue = p.journal || p.conference || '';
          const abbr = p.abbreviation || venue;
          const titleHtml = p.link
            ? `<a href="${esc(p.link)}" target="_blank">${esc(p.title)}</a>`
            : esc(p.title);

          let badgeHtml = '';
          if (p.indexing) {
            const badgeClass = p.indexing === 'SCIE' ? 'pub-badge-scie' : 'pub-badge-scopus';
            badgeHtml = `<span class="pub-badge ${badgeClass}">${esc(p.indexing)}</span>`;
          }

          const doiHtml = p.link
            ? `<a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer" class="pub-doi-link" title="Digital Object Identifier: ${esc(p.link)}">DOI <span class="pub-doi-icon">↗</span></a>`
            : '';

          return `<li class="pub-item">
            <span class="pub-node"></span>
            <span class="pub-body">
              ${abbr ? `<span class="pub-journal">${esc(abbr)}</span>` : ''}${badgeHtml}
              ${titleHtml}${authors ? ' — ' + authors : ''}${doiHtml}
            </span>
          </li>`;
        }).join('');

        return `<div class="pub-year-group">
          <div class="pub-year">${esc(year)}</div>
          <ul class="pub-list">${items}</ul>
        </div>`;
      }).join('');

      container.innerHTML = html || '<p class="loading-hint">—</p>';
    } catch (err) {
      container.innerHTML = '<p class="loading-hint">Could not load Selected_publications.json.</p>';
    }
  }

  // --- 2. Load Professional Service (service.json) ---
  async function loadService() {
    const container = document.getElementById('serviceContainer');
    if (!container) return;

    try {
      const res = await fetch('service.json');
      const s = await res.json();
      let out = '';

      // General Co-chair
      if (s.general_co_chair && s.general_co_chair.length) {
        out += `<div class="group-label" data-en="General Co-chair" data-vi="Đồng trưởng ban tổ chức">General Co-chair</div><ul class="entry-list">`;
        s.general_co_chair.forEach(e => {
          const yr = e.link ? `<a href="${esc(e.link)}" target="_blank" class="entry-year-link">${esc(e.year)}</a>` : `<span class="entry-year">${esc(e.year)}</span>`;
          out += `<li class="entry"><span class="entry-tag tag-chair">${esc(e.tag)}</span> ${yr} — <i>${esc(e.description)}</i></li>`;
        });
        out += '</ul>';
      }

      // Conference Committees
      if (s.conference_committees && s.conference_committees.length) {
        out += `<div class="group-label" data-en="Conference Committees" data-vi="Ban chương trình hội nghị">Conference Committees</div><ul class="entry-list">`;
        s.conference_committees.forEach(e => {
          const yr = e.link ? `<a href="${esc(e.link)}" target="_blank" class="entry-year-link">${esc(e.year)}</a>` : `<span class="entry-year">${esc(e.year)}</span>`;
          out += `<li class="entry"><span class="entry-tag tag-committee">${esc(e.tag)}</span> ${yr} — <i>${esc(e.description)}</i></li>`;
        });
        out += '</ul>';
      }

      container.innerHTML = out;
      applyLang(getLang());
    } catch (err) {
      container.innerHTML = '<p class="loading-hint">Could not load service.json.</p>';
    }
  }

  // --- 3. Load Journal Referee (peer_review.json with Accordion & Top 10 H-index) ---
  async function loadReferee() {
    const container = document.getElementById('refereeContainer');
    if (!container) return;

    try {
      const res = await fetch('peer_review.json');
      const data = await res.json();
      const reviews = (data.reviews || []).slice();

      // Sort by H-index descending
      reviews.sort((a, b) => (b.h_index || 0) - (a.h_index || 0));

      const lang = getLang();

      function renderRefereeItem(e, idx) {
        const pubClean = esc(e.publisher).toLowerCase().replace(/[^a-z0-9]/g, '');
        const pubTag = e.publisher ? `<span class="entry-tag tag-publisher tag-pub-${pubClean}">${esc(e.publisher)}</span>` : '';
        const jLink = e.link ? `<a href="${esc(e.link)}" target="_blank">${esc(e.journal)}</a>` : esc(e.journal);
        const hTag = e.h_index ? `<span class="hindex-tag" title="SCImago / Scopus H-index">H=${esc(e.h_index)}</span>` : '';
        const hasPapers = e.papers && e.papers.length > 0;
        const panelId = `referee-panel-${idx}`;

        let rightSide = '';
        if (hasPapers) {
          const label = lang === 'vi' ? `${e.papers.length} bài` : `${e.papers.length} paper${e.papers.length > 1 ? 's' : ''}`;
          rightSide = `<button type="button" class="referee-expand-btn" data-target="${panelId}" data-count="${e.papers.length}" onclick="toggleReferee('${panelId}')" title="Xem chi tiết bài báo / View papers">
            <span class="referee-btn-text">${label}</span>
            <span class="referee-expand-icon">▼</span>
          </button>`;
        } else if (e.review_count) {
          const countLabel = lang === 'vi' ? `${e.review_count} lượt` : `${e.review_count} review${e.review_count > 1 ? 's' : ''}`;
          rightSide = `<span class="referee-count-badge" data-count="${e.review_count}">${countLabel}</span>`;
        }

        let itemHtml = `<li class="referee-item">
          <div class="referee-main">
            <div class="referee-journal-wrap">
              ${pubTag} ${jLink} ${hTag}
            </div>
            ${rightSide}
          </div>`;

        if (hasPapers) {
          itemHtml += `<div id="${panelId}" class="referee-papers-panel">`;
          e.papers.forEach(p => {
            const dateStr = (p.dates || []).join(', ');
            itemHtml += `<div class="referee-paper-row">
              <span class="referee-paper-title">"${esc(p.title)}"</span>
              ${dateStr ? `<span class="referee-paper-meta">${esc(dateStr)}</span>` : ''}
            </div>`;
          });
          itemHtml += `</div>`;
        }

        itemHtml += `</li>`;
        return itemHtml;
      }

      const topReviews = reviews.slice(0, 10);
      const remainingReviews = reviews.slice(10);

      const isVi = lang === 'vi';
      const labelText = isVi ? 'Phản biện tạp chí' : 'Journal Referee';
      const verifiedText = isVi ? 'Xác thực qua' : 'Verified on';

      let out = `
        <div class="group-label group-label-split">
          <span class="group-title-wrap"><span data-en="Journal Referee" data-vi="Phản biện tạp chí">${labelText}</span></span>
          <span class="verified-badges">
            <span class="verified-label" data-en="Verified on" data-vi="Xác thực qua">${verifiedText}</span>
            <a href="https://orcid.org/0000-0001-6603-392X" target="_blank" rel="noopener noreferrer" class="verified-link orcid-link" title="Xem hồ sơ phản biện xác thực trên ORCID">
              <i class="ai ai-orcid"></i> ORCID
            </a>
            <span class="verified-sep">·</span>
            <a href="https://www.webofscience.com/wos/author/rid/AAK-4338-2020" target="_blank" rel="noopener noreferrer" class="verified-link wos-link" title="Xem hồ sơ phản biện xác thực trên Web of Science ResearcherID">
              <i class="ai ai-researcherid"></i> Web of Science
            </a>
          </span>
        </div>
      `;
      out += `<ul class="entry-list">${topReviews.map((e, idx) => renderRefereeItem(e, idx)).join('')}</ul>`;

      if (remainingReviews.length > 0) {
        const remCount = remainingReviews.length;
        const btnLabel = lang === 'vi' ? `Xem thêm (${remCount} tạp chí)` : `Show more (${remCount} journals)`;
        out += `
          <ul id="refereeMore" class="entry-list referee-more-container">${remainingReviews.map((e, idx) => renderRefereeItem(e, 10 + idx)).join('')}</ul>
          <button id="btnToggleMoreJournals" class="more-journals-btn" data-count="${remCount}" onclick="toggleMoreJournals()">
            <span class="more-journals-text">${btnLabel}</span>
            <span class="more-journals-icon">▼</span>
          </button>
        `;
      }

      container.innerHTML = out;
      applyLang(getLang());
    } catch (err) {
      container.innerHTML = '<p class="loading-hint">Could not load peer_review.json.</p>';
    }
  }

  // --- 4. Load Projects (projects.json) ---
  async function loadProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container) return;

    try {
      const res = await fetch('projects.json');
      const p = await res.json();
      const items = (p.projects || []).map(e => {
        const desc = e.link ? `<a href="${esc(e.link)}" target="_blank">${esc(e.description)}</a>` : esc(e.description);
        return `<li class="entry"><span class="entry-tag tag-project">${esc(e.code)}</span> <span>${desc}</span></li>`;
      }).join('');

      container.innerHTML = `<ul class="entry-list">${items}</ul>`;
    } catch (err) {
      container.innerHTML = '<p class="loading-hint">Could not load projects.json.</p>';
    }
  }

  // --- Initialization ---
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Language
    let initialLang = 'en';
    try { initialLang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) {}
    applyLang(initialLang);

    // 2. Initial Palette
    let initialPalette = 'burgundy';
    try { initialPalette = localStorage.getItem(PALETTE_KEY) || 'burgundy'; } catch (e) {}
    applyPalette(initialPalette);

    // 3. Setup Lang Toggle Button
    const langBtn = document.getElementById('langToggle');
    if (langBtn) {
      langBtn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('lang') === 'vi' ? 'vi' : 'en';
        applyLang(cur === 'vi' ? 'en' : 'vi');
      });
    }

    // 4. Run async data loaders
    loadPublications();
    loadService();
    loadReferee();
    loadProjects();
  });

})();

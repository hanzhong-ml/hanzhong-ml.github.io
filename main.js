(function () {
  const data = window.SITE_DATA;
  if (!data) {
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function paperItem(paper) {
    const title = escapeHtml(paper.title);
    const authors = paper.authors ? `<div class="pub-meta">${escapeHtml(paper.authors)}</div>` : "";
    const venue = paper.venue ? `<div class="pub-meta">${escapeHtml(paper.venue)}</div>` : "";
    const year = paper.year ? `<div class="pub-year">${escapeHtml(paper.year)}</div>` : "";
    const link = paper.url
      ? `<a class="pub-title" href="${escapeHtml(paper.url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : `<div class="pub-title">${title}</div>`;

    return `<article class="pub-item"><div class="pub-main">${link}${authors}${venue}</div>${year}</article>`;
  }

  function richText(value) {
    if (typeof value === "string") {
      return escapeHtml(value);
    }

    if (value && typeof value === "object" && value.text && value.url) {
      const isExternal = /^(https?:)?\/\//.test(value.url);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a class="inline-link" href="${escapeHtml(value.url)}"${target}>${escapeHtml(value.text)}</a>`;
    }

    return "";
  }

  function inlineContent(value) {
    return Array.isArray(value) ? value.map((part) => richText(part)).join("") : richText(value);
  }

  function aboutParagraphs(about) {
    if (typeof about === "string") {
      return about
        .split(/\n\s*\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => escapeHtml(line));
    }

    if (!Array.isArray(about)) {
      return [];
    }

    return about
      .map((paragraph) => inlineContent(paragraph))
      .filter(Boolean);
  }

  function emailAddress(email) {
    if (!email || !email.user || !email.domain) {
      return "";
    }

    return `${email.user}@${email.domain}`;
  }

  function talkItem(talk) {
    const title = escapeHtml(talk.title);
    const titleNode = talk.url
      ? `<a href="${escapeHtml(talk.url)}" target="_blank" rel="noopener noreferrer">${title}</a>`
      : title;

    return `<article class="talk-item"><strong>${titleNode}</strong></article>`;
  }

  function renderHomePage() {
    const hero = document.getElementById("hero-content");
    const highlights = document.getElementById("highlights-list");
    if (!hero || !highlights) {
      return;
    }

    const profile = data.profile;
    const aboutLines = aboutParagraphs(profile.about);

    hero.innerHTML = `
      <div class="hero-identity">
        <h1 class="hero-name">
          ${escapeHtml(profile.name)}
          <span class="name-zh" lang="zh-Hans">(${escapeHtml(profile.nameZh)})</span>
        </h1>
      </div>
      <section class="hero-about">
        ${aboutLines.map((line) => `<p class="hero-about-text">${line}</p>`).join("")}
        <p class="hero-note">${inlineContent(profile.collaboration)}</p>
      </section>
      <aside class="hero-card">
        <div class="portrait is-fallback">
          <img
            src="${escapeHtml(profile.photo)}"
            alt="Portrait of ${escapeHtml(profile.name)}"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <div class="portrait-fallback">HZ</div>
        </div>
        <div class="hero-cta">
          <a class="btn" href="mailto:${escapeHtml(emailAddress(profile.email))}" aria-label="Email ${escapeHtml(
            profile.name
          )}">Email</a>
          ${profile.links
            .map(
              (link) =>
                `<a class="btn" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                  link.label
                )}</a>`
            )
            .join("")}
        </div>
      </aside>
    `;

    highlights.innerHTML = data.highlights
      .map(
        (group) => `
        <section class="pub-block${group.title ? "" : " is-flat"}">
          ${group.title ? `<h3>${escapeHtml(group.title)}</h3>` : ""}
          <div class="pub-list">${group.papers.map((paper) => paperItem(paper)).join("")}</div>
        </section>
      `
      )
      .join("");
  }

  function renderPublicationsPage() {
    const note = document.getElementById("pub-note");
    const list = document.getElementById("pub-groups");
    if (!list) {
      return;
    }

    if (note) {
      note.textContent = data.publications.note;
    }

    const preferredOrder = {
      "Journal Publications": 0,
      "Conference Publications": 1
    };
    const orderedGroups = data.publications.groups
      .map((group, index) => ({ group, index }))
      .sort((a, b) => {
        const aRank = preferredOrder[a.group.title] ?? 99;
        const bRank = preferredOrder[b.group.title] ?? 99;
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return a.index - b.index;
      })
      .map((entry) => entry.group);

    list.innerHTML = orderedGroups
      .map(
        (group) => `
        <section class="pub-block">
          <h3>${escapeHtml(group.title)}</h3>
          <div class="pub-list">${group.items.map((paper) => paperItem(paper)).join("")}</div>
        </section>
      `
      )
      .join("");
  }

  function renderTalksPage() {
    const list = document.getElementById("talks-list");
    if (!list) {
      return;
    }

    list.innerHTML = data.talks.map((item) => talkItem(item)).join("");
  }

  function renderContactPage() {
    const container = document.getElementById("contact-content");
    if (!container) {
      return;
    }

    container.innerHTML = `
      <div class="join-copy join-intro">
        <h1 class="section-title">Join My Group</h1>
        <p class="join-lede">
          My group pursues long-term curiosity-driven research in reinforcement learning, foundation models, operations
          research, statistics, optimization, and related areas. Prospective students and (remote) visitors are welcome to
          contact me after reading the checklist below.
        </p>
      </div>
      <aside class="join-panel" id="before-email">
        <h2>Before You Email</h2>
        <ul class="join-list compact">
          <li>Attach: (i) CV, (ii) transcript, and (iii) publications or other relevant materials, if available.</li>
          <li>Briefly explain which of my topics or papers fit your background and interests.</li>
          <li>Include your timeline, availability, and whether you are applying as a student or a (remote) visitor.</li>
          <li>Suggested subject: <strong>Prospective student/visitor - Your Name - Institution</strong></li>
        </ul>
      </aside>
      <div class="join-copy join-students">
        <div class="join-section">
          <h2>Previous Mentees</h2>
          <p>
            I have had the privilege of working with and learning from talented undergraduate and early-stage graduate students.
          </p>
          <ul class="join-list people-list">
            <li>
              <span class="person-row">
                <span>
                  <a class="inline-link" href="https://zkshan2002.github.io/" target="_blank" rel="noopener noreferrer">Zikang Shan</a>
                  (PKU), working on
                  <a class="inline-link" href="https://arxiv.org/pdf/2404.18922" target="_blank" rel="noopener noreferrer">RLHF</a>
                  and
                  <a class="inline-link" href="https://arxiv.org/pdf/2604.10701" target="_blank" rel="noopener noreferrer">value modeling in LLM RL</a>.
                </span>
                <span class="person-time">2024-2026</span>
              </span>
            </li>
            <li>
              <span class="person-row">
                <span>
                  <a class="inline-link" href="https://scholar.google.com/citations?hl=en&user=wmDqYvUAAAAJ" target="_blank" rel="noopener noreferrer">Guhao Feng</a>
                  (PKU), working on
                  <a class="inline-link" href="https://arxiv.org/pdf/2312.17248" target="_blank" rel="noopener noreferrer">representation complexity of RL</a>
                  and
                  <a class="inline-link" href="https://arxiv.org/pdf/2404.18922" target="_blank" rel="noopener noreferrer">RLHF</a>.
                </span>
                <span class="person-time">2023-2024</span>
              </span>
            </li>
            <li>
              <span class="person-row">
                <span>
                  <a class="inline-link" href="https://jlianghe.github.io/" target="_blank" rel="noopener noreferrer">Jianliang He</a>
                  (FDU to Yale), working on
                  <a class="inline-link" href="https://arxiv.org/pdf/2404.12648" target="_blank" rel="noopener noreferrer">average-reward RL</a>.
                </span>
                <span class="person-time">2024</span>
              </span>
            </li>
            <li>
              <span class="person-row">
                <span>
                  <a class="inline-link" href="https://www.jyhuang.site/" target="_blank" rel="noopener noreferrer">Jiayi Huang</a>
                  (PKU to UIUC), working on
                  <a class="inline-link" href="https://arxiv.org/pdf/2312.04464" target="_blank" rel="noopener noreferrer">instance-dependent RL</a>
                  and
                  <a class="inline-link" href="https://arxiv.org/pdf/2306.06836" target="_blank" rel="noopener noreferrer">heavy-tailed RL</a>.
                </span>
                <span class="person-time">2023-2024</span>
              </span>
            </li>
            <li>
              <span class="person-row">
                <span>
                  <a class="inline-link" href="https://miaolu3.github.io/" target="_blank" rel="noopener noreferrer">Miao Lu</a>
                  (USTC to Stanford), working on
                  <a class="inline-link" href="https://arxiv.org/pdf/2305.09659" target="_blank" rel="noopener noreferrer">distributionally robust RL</a>.
                </span>
                <span class="person-time">2022-2023</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  function handlePortraitFallback() {
    const portrait = document.querySelector(".portrait");
    if (!portrait) {
      return;
    }

    const image = portrait.querySelector("img");
    if (!image) {
      return;
    }

    image.addEventListener("error", function () {
      portrait.classList.add("is-fallback");
    });

    image.addEventListener("load", function () {
      portrait.classList.remove("is-fallback");
    });
  }

  function renderLastUpdated() {
    const slots = document.querySelectorAll("[data-last-updated]");
    if (!slots.length) {
      return;
    }

    const stamp = data.site && data.site.lastUpdated;
    if (!stamp) {
      return;
    }

    slots.forEach((slot) => {
      slot.textContent = `Last updated: ${stamp}.`;
    });
  }

  function setupMobileNavigation() {
    const toggle = document.querySelector(".mobile-menu-toggle");
    const navigation = document.getElementById("mobile-navigation");
    if (!toggle || !navigation) {
      return;
    }

    function closeNavigation() {
      navigation.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open navigation");
    }

    toggle.addEventListener("click", function () {
      const willOpen = navigation.hidden;
      navigation.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNavigation);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !navigation.hidden) {
        closeNavigation();
        toggle.focus();
      }
    });

    document.addEventListener("click", function (event) {
      if (!navigation.hidden && !event.target.closest(".site-header")) {
        closeNavigation();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && !navigation.hidden) {
        closeNavigation();
      }
    });
  }

  function setupHomeAnchorScrolling() {
    if (document.body.getAttribute("data-page") !== "home") {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", function (event) {
        const hash = link.getAttribute("href");
        const target = hash && hash !== "#" ? document.querySelector(hash) : null;

        if (!target) {
          return;
        }

        event.preventDefault();

        if (window.location.hash !== hash) {
          window.history.pushState(null, "", hash);
        }

        target.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start",
        });
      });
    });

    const initialTarget = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;

    if (initialTarget) {
      window.requestAnimationFrame(function () {
        initialTarget.scrollIntoView({ behavior: "auto", block: "start" });
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.getAttribute("data-page");

    if (page === "home") {
      renderHomePage();
    }

    if (page === "publications") {
      renderPublicationsPage();
    }

    if (page === "talks") {
      renderTalksPage();
    }

    if (page === "contact") {
      renderContactPage();
    }

    renderLastUpdated();
    setupMobileNavigation();
    setupHomeAnchorScrolling();
    handlePortraitFallback();
  });
})();

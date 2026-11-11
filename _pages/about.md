---
permalink: /
title: "Aquamarine"
author_profile: true
home_page: true
private_metadata: true
sitemap: false
redirect_from: 
  - /about/
  - /about.html
---

<div class="home-intro">
  <p class="home-summary">Research and personal projects</p>
  <div class="home-paths"><a href="{{ '/publications/' | relative_url }}">Publications <span aria-hidden="true">↗</span></a><a href="{{ '/experiences/' | relative_url }}">Experiences <span aria-hidden="true">↗</span></a></div>
  <nav class="home-paths home-section-links" aria-label="About sections">
    <a href="#education-heading">Education</a><a href="#news-heading">Updates</a><a href="#honors">Honors</a>
  </nav>
  <div class="home-access" data-daily-prompt><button type="button" data-open-access>Unlock personal details</button></div>
</div>

<section class="home-education" aria-labelledby="education-heading">
  <h2 id="education-heading">Education &amp; Research</h2>
  <div class="education-grid">
    <article class="education-card">
      <div class="education-logos">
        <a class="education-symbol" href="https://www.fudan.edu.cn/" aria-label="Fudan University"><img src="{{ '/images/education/fudan-emblem.png' | relative_url }}?v=20261102-polish14" alt="" width="71" height="71" loading="lazy"></a>
        <span class="education-logo-divider" aria-hidden="true" hidden data-protected-section></span>
        <a class="education-symbol" href="#access-dialog" data-protected-href="https://polymer.fudan.edu.cn/" aria-label="Department of Macromolecular Science" hidden data-protected-section><img hidden data-protected-src="{{ '/images/education/macromolecular-science-emblem.png' | relative_url }}?v=20261102-polish14" alt="" width="98" height="98" loading="lazy"></a>
      </div>
      <p class="education-period">2026 — 2031 · Expected</p>
      <h3>Fudan University</h3>
      <p class="education-degree">PhD<span hidden data-protected-section> · Polymer Chemistry and Physics</span></p>
      <a href="#access-dialog" hidden data-protected-section data-protected-href="https://polymer.fudan.edu.cn/">Department of Macromolecular Science ↗</a>
    </article>
    <article class="education-card">
      <div class="education-logos">
        <a class="education-symbol" href="https://www.tongji.edu.cn/" aria-label="Tongji University"><img src="{{ '/images/education/tongji-emblem.png' | relative_url }}?v=20261102-polish14" alt="" width="90" height="90" loading="lazy"></a>
        <span class="education-logo-divider" aria-hidden="true" hidden data-protected-section></span>
        <a class="education-symbol education-symbol--wordmark" href="#access-dialog" data-protected-href="https://ghc.tongji.edu.cn/" aria-label="Guohao College · Elite Class" hidden data-protected-section><img hidden data-protected-src="{{ '/images/education/guohao-wordmark.png' | relative_url }}?v=20261102-polish14" alt="" width="136" height="41" loading="lazy"></a>
      </div>
      <p class="education-period">2022 — 2026</p>
      <h3>Tongji University</h3>
      <p class="education-degree">BSc<span hidden data-protected-section> · New Energy Materials and Devices</span></p>
      <a href="#access-dialog" hidden data-protected-section data-protected-href="https://ghc.tongji.edu.cn/">Guohao College · Elite Class ↗</a>
    </article>
  </div>
  <div class="research-ribbon">
    <span class="cosmic-eyebrow">RESEARCH FOCUS</span>
    <p>Supramolecularly Assembled Materials · Chiral Induced Spin Selectivity (CISS)</p>
    <p class="research-supervisors" hidden data-protected-section>Macromolecular Chemistry and Physics · Supervisors: <a href="#access-dialog" data-protected-href="http://www.nielab.com/">Prof. Zhihong Nie &amp; Prof. Yutao Sang</a></p>
  </div>
</section>

{% include home-news.html %}

{% capture honors_html %}{% include home-honors.html %}{% endcapture %}
{{ honors_html | strip_newlines }}




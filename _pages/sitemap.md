---
layout: archive
title: Sitemap
permalink: /sitemap/
author_profile: false
---

<ul>
{% for item in site.data.navigation.main %}
  <li><a href="{{ item.url | relative_url }}">{{ item.title | escape }}</a></li>
{% endfor %}
</ul>

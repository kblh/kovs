---
title: "Koncerty"
layout: "default.njk"
tags: "nav"
---

<div class="max-w-7xl mx-auto px-4 py-6 w-full">
{% for item in collections.koncerty reversed %}
  <div>
    {% if item.data.date %}
      <time datetime="{{ item.data.date }}">{{ item.data.date | date }}</time>
      –
    {% endif %}
    <a href="{{ baseUrl }}{{ item.url }}"><strong>{{ item.data.title }}</strong></a>
  </div>
  <hr>
{% endfor %}
</div>

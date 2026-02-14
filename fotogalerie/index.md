---
title: "Fotogalerie"
desc: "Rozcestník fotogalerií"
tags: "pages"
layout: "default.njk"
templateEngineOverride: njk,md
navOrder: 3
---

# Fotogalerie

Vítejte na stránce fotogalerií. Vyberte si jednu z následujících galerií:

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
{% for item in collections.galerie %}
  {% if item.url != page.url %}
  <div class="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
    <a href="{{ item.url }}" class="block">
      <div class="p-6">
        <h3 class="text-2xl font-bold mb-2 text-gray-800 hover:text-blue-600 transition-colors">
          {{ item.data.title }}
        </h3>
        {% if item.data.desc %}
        <p class="text-gray-600 mb-4">{{ item.data.desc }}</p>
        {% endif %}
        <span class="text-blue-600 font-medium hover:underline">Zobrazit galerii →</span>
      </div>
    </a>
  </div>
  {% endif %}
{% endfor %}
</div>

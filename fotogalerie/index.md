---
title: "Fotogalerie"
desc: "Rozcestník fotogalerií"
tags: "pages"
layout: "default.njk"
templateEngineOverride: njk
navOrder: 3
---

<section class="border-b border-foreground/15">
  <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
    <div class="lg:grid lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-start-2 lg:col-span-10">

        <p class="u-label mb-8 flex items-center gap-3">
          <span class="u-line"></span>
          Fotogalerie
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {% for item in collections.galerie %}
            {% if item.url != page.url %}
              <a href="{{ baseUrl }}{{ item.url }}"
                 class="group border-t border-foreground pt-6 block hover:border-accent transition-colors duration-500">
                <h3 class="font-heading text-2xl lg:text-3xl mb-2 group-hover:text-accent transition-colors duration-500">
                  {{ item.data.title }}
                </h3>
                {% if item.data.desc %}
                  <p class="text-muted text-sm leading-relaxed mb-4">{{ item.data.desc }}</p>
                {% endif %}
                <span class="text-micro uppercase tracking-label text-muted group-hover:text-accent transition-colors duration-500">
                  Zobrazit galerii →
                </span>
              </a>
            {% endif %}
          {% endfor %}
        </div>

      </div>
    </div>
  </div>
</section>

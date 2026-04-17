---
title: "Koncerty"
layout: "default.njk"
tags: "nav"
templateEngineOverride: njk
---

<section class="border-b border-foreground/15">
  <div class="max-w-container-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
    <div class="lg:grid lg:grid-cols-12 lg:gap-8">
      <div class="lg:col-start-2 lg:col-span-10">

        <p class="u-label mb-8 flex items-center gap-3">
          <span class="u-line"></span>
          Přehled koncertů
        </p>

        <div class="divide-y divide-foreground/10">
          {% for item in collections.koncerty | reverse %}
            <div class="group py-6 first:pt-0">
              <a href="{{ baseUrl }}{{ item.url }}"
                 class="flex flex-col lg:flex-row lg:items-baseline lg:justify-between gap-2 hover:text-accent transition-colors duration-500 -mx-4 px-4">
                <h2 class="font-heading text-2xl lg:text-3xl group-hover:text-accent transition-colors duration-500">
                  {{ item.data.title }}
                </h2>
                {% if item.data.date %}
                  <time class="text-muted text-micro uppercase tracking-time shrink-0"
                        datetime="{{ item.data.date }}">
                    {{ item.data.date | date }}
                  </time>
                {% endif %}
              </a>
              {% if item.data.place %}
                <p class="text-muted text-sm mt-2 leading-relaxed">{{ item.data.place }}</p>
              {% endif %}
            </div>
          {% endfor %}
        </div>

      </div>
    </div>
  </div>
</section>

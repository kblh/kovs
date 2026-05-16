# Interpreti

- Nová kolekce interpreti (viz příklady)
- Struktura souborů
interpreti
  img
- nová šablona interpret.njk - detail interpreta
  - pokud existuje fotka (např. /interpreti/img/michael-housa.jpg), vloží se do šablony
- nová šablona interpreti.njk - seznam všech interpretů (podobně jako /koncerty/)
  - jednotlivé "řádky" s interprety budou obsahovat: name, instrument, img
- odkaz do hlavního menu na stránku interpreti
- vytvoř z příkladů (Michael Housa a Bronislava Smržová) md soubory kolekce
- uprav šablonu concert.njk - pod informacemi o koncertu přidej výpis interpretů, kteří se koncertu ůčastní - "řádky" s interprety budou vypadat stejně, jako v šabloně interpreti.njk

## Příklady jednotlivých souborů

### Příklad 1

---
name: "Michael Housa"
instrument: "dirigent"
layout: "interpret.njk"
templateEngineOverride: njk,md
---

## Vzdělání

Vystudoval ZUŠ v Mladé Boleslavi u Marie Švejdové. Po maturitě na všeobecném gymnáziu v Mladé Boleslavi nastoupil na Pražskou konzervatoř do třídy Jitky Novákové, kde roku 2024 absolvoval s vyznamenáním. Od roku 2023 studuje dirigování na Akademii múzických umění v Praze pod vedením MgA. Mgr. Lukáše Vasilka, Jaroslava Brycha, doc. MgA. Tomáše Koutníka a doc. Mgr. Norberta Baxy.

## Úspěchy

Pravidelně se během studií na ZUŠ účastnil soutěží (ať už sólově, v komorní či v orchestrální hře v pozici sólisty a koncertního mistra) na celostátní úrovni. Ještě během studií na gymnáziu založil studentský gymnaziální orchestr, se kterým v roce 2018 vystoupil v pozici sólisty a koncertního mistra na mezinárodním festivalu umění v Číně. Jakožto člen České studentské filharmonie spolupracoval s celou řadou významných dirigentů a sólistů českého i světového původu. Jako dirigent pravidelně spolupracuje se Severočeskou filharmonií Teplice v rámci hudebních kurzů.

## Současná činnost

Jako dirigent pracuje s orchestry Far Musica a Euterpe Philharmonia (jehož je zároveň zakladatelem), podporuje kompozice svých kolegů skladatelů skrze premierování jejich děl. V pozici hudební nápovědy se pravidelně účastní koncertů po celé České republice s různými orchestry. Jako houslista spolupracuje s Českou studentskou filharmonií, Big Evr Bandem a dalšími orchestry.


### Příklad 2

---
name: "Bronislava Smržová"
instrument: "soprán"
layout: "interpret.njk"
templateEngineOverride: njk,md
---

Bronislava Smržová Tomanová se věnuje hudbě od dětství. Absolvovala Gymnázium Jana Nerudy s hudebním zaměřením obor zpěv a housle, Pedagogickou fakultu UK, Pražskou konzervatoř a velkou řadu mistrovských pěveckých kurzů. Jako sólistka vystupovala mimo jiné např. s Orchestrem BERG, orchestrem Hudby hradní stráže a Policie ČR. Ve spolupráci s dirigentem a skladatelem Janem Zástěrou se účastnila natáčení několika CD a také slavnostního koncertu v rámci Národní pouti do Říma k výročí svatořečení Anežky České. V roce 2022 úspěšně debutovala v Jihočeském divadle v roli Královny noci. Věnuje se také pedagogické činnosti. Je zakladatelkou letních pěveckých kurzů a festivalu Zpívající Kouřim pro mladé zpěváky.


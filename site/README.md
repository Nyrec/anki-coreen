# Site de révision « 한국어 노트 »

Le site regroupe toutes les cartes Anki par thème, niveau et cours, avec des fiches et des histoires. Il fonctionne hors ligne une fois ouvert une première fois.

- `build.py` : lit `archive/`, puis `done/` et `inbox/` de toutes les branches, et écrit le site dans `_site/`.
- `fr.tsv` : traduction française des cartes qui n'ont que l'anglais (une ligne `coréen<TAB>français`). Une carte absente de ce fichier s'affiche en anglais.
- `content.js` : fiches de révision et histoires.
- `template.html`, `sw.js`, `manifest.webmanifest`, icônes : la page et sa mise en cache.

Le workflow `Site de révision` reconstruit le site chaque matin et à chaque modification de `site/` ou `archive/` sur `main`. Il ne publie que si GitHub Pages est activé (Réglages > Pages > Source : GitHub Actions).

Construire en local : `python site/build.py --out _site`

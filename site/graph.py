"""Réseau 뇌 · Cerveau : relie mots, cours, thèmes, synthèses, histoires et émissions.

Nœuds : clé « type:identifiant »
  m:<mot>  c:<cours>  t:<thème>  f:<synthèse>  s:<histoire>  p:<émission>
Liens :
  mot — cours, mot — thème, synthèse — thème, synthèse — mot (première colonne des tableaux),
  mot — mot (cité dans la note, ou dans l'exemple quand le mot est assez rare),
  histoire/émission — mot (mots présents dans le texte, les plus rares d'abord),
  cours — cours suivant du même professeur.
La disposition est calculée une fois ici (forces de Fruchterman-Reingold) pour que
le graphe s'affiche tout de suite, même sur téléphone.
"""
import re, math, random

HANGUL = re.compile(r'^[가-힣]+$')


def _stems(k):
    """Formes cherchées dans un texte pour retrouver le mot k."""
    k = re.sub(r'\(.*?\)', '', k).strip()
    if not HANGUL.match(k) or len(k) < 2:
        return []
    if k.endswith('하다') and len(k) >= 4:
        return [k[:-2]]            # 공부하다 → 공부
    if k.endswith('다') and len(k) >= 3:
        st = k[:-1]
        return [st] if len(st) >= 2 else []
    return [k]


def build(cards, courses, themes, fiches, stories, pods):
    keys, kind = [], []
    idx = {}

    def node(key):
        if key not in idx:
            idx[key] = len(keys); keys.append(key)
        return idx[key]

    edges = set()

    def link(a, b):
        if a != b:
            edges.add((min(a, b), max(a, b)))

    for c in courses:
        node('c:' + c['id'])
    theme_keys = {k for k, _, _ in themes if not k.startswith('p:')}
    used_themes = {t for c in cards for t in c.get('t', []) if t in theme_keys}
    for k, _, _ in themes:
        if k in used_themes:
            node('t:' + k)
    for f in fiches:
        node('f:' + f['id'])
    for s in stories:
        node('s:' + s['id'])
    for p in pods:
        node('p:' + p['id'])
    word = {}
    for c in cards:
        word[c['k']] = node('m:' + c['k'])

    # mot — cours, mot — thème
    for c in cards:
        i = word[c['k']]
        link(i, idx['c:' + c['c']])
        for t in c.get('t', []):
            if 't:' + t in idx:
                link(i, idx['t:' + t])

    # cours — cours suivant
    for pre in ('C', 'J'):
        seq = sorted([c['id'] for c in courses if c['id'].startswith(pre) and c['id'][1:].isdigit()], key=lambda x: int(x[1:]))
        for a, b in zip(seq, seq[1:]):
            link(idx['c:' + a], idx['c:' + b])

    # synthèses
    for f in fiches:
        i = idx['f:' + f['id']]
        for t in f['themes']:
            if 't:' + t in idx:
                link(i, idx['t:' + t])
        for w in f['words']:
            for part in re.split(r'\s*[/,]\s*', re.sub(r'\(.*?\)', '', w)):
                part = part.strip()
                if part in word:
                    link(i, word[part])

    # mot — mot
    forms = {}
    for c in cards:
        for st in _stems(c['k']):
            forms.setdefault(st, []).append(c['k'])
    exs = [c.get('x', '') for c in cards]
    RX = {st: re.compile('(?<![가-힣])' + st) for st in forms}
    df = {st: sum(1 for x in exs if st in x and RX[st].search(x)) for st in forms}
    for c in cards:
        i = word[c['k']]
        note = c.get('n', '')
        for k2 in word:
            if k2 != c['k'] and len(k2) >= 2 and HANGUL.match(k2) and k2 in note and re.search('(?<![가-힣])' + k2, note):
                link(i, word[k2])
        x = c.get('x', '')
        if not x:
            continue
        hits = [(df[st], k2) for st, ks in forms.items() if df[st] <= 12 and st in x and RX[st].search(x) for k2 in ks if k2 != c['k']]
        for _, k2 in sorted(hits)[:6]:
            link(i, word[k2])

    # histoires et émissions — mots
    def text_links(i, text):
        hits = [(df[st], k2) for st, ks in forms.items() if df[st] <= 40 and len(st) >= 2 and st in text and RX[st].search(text) for k2 in ks]
        for _, k2 in sorted(hits)[:45]:
            link(i, word[k2])
    for s in stories:
        text_links(idx['s:' + s['id']], ' '.join(l[1] if len(l) == 4 else l[0] for l in s['lines']))
    for p in pods:
        text_links(idx['p:' + p['id']], ' '.join(l[0] for l in p['lines']))

    pos = layout(len(keys), sorted(edges))
    return dict(k=keys, xy=[v for xy in pos for v in xy], e=[v for e in sorted(edges) for v in e])


def layout(n, edges, iters=240, seed=7):
    """Positions entières dans [-1000, 1000]."""
    try:
        import numpy as np
    except ImportError:
        rnd = random.Random(seed)
        return [(rnd.randint(-1000, 1000), rnd.randint(-1000, 1000)) for _ in range(n)]
    rng = np.random.default_rng(seed)
    P = rng.uniform(-1, 1, (n, 2)).astype(np.float32)
    E = np.array(edges, dtype=np.int64).reshape(-1, 2)
    deg = np.bincount(E.ravel(), minlength=n).astype(np.float32) + 1
    k = 1.0 / math.sqrt(n) * 1.6
    t = 0.12
    for it in range(iters):
        disp = np.zeros_like(P)
        for s in range(0, n, 700):              # répulsion par blocs (mémoire raisonnable)
            d = P[s:s + 700, None, :] - P[None, :, :]
            dist2 = (d * d).sum(-1) + 1e-6
            f = (k * k / dist2) * deg[None, :] ** 0.5
            disp[s:s + 700] += (d * f[..., None]).sum(1)
        d = P[E[:, 0]] - P[E[:, 1]]
        dist = np.sqrt((d * d).sum(-1)) + 1e-6
        f = (dist / k)[:, None] * d
        np.add.at(disp, E[:, 0], -f)
        np.add.at(disp, E[:, 1], f)
        disp -= P * 0.6 * deg[:, None] ** 0.5     # gravité : le réseau reste compact
        ln = np.sqrt((disp * disp).sum(-1)) + 1e-6
        P += disp / ln[:, None] * np.minimum(ln, t)[:, None]
        t = max(0.004, t * 0.985)
    P -= P.mean(0)
    P /= np.abs(P).max() + 1e-6
    return [(int(x * 1000), int(y * 1000)) for x, y in P]


def parse_fiches(content_js):
    out = []
    for chunk in re.split(r'\n(?=\{id:")', content_js):
        m = re.match(r'\{id:"([^"]+)".*?themes:\[([^\]]*)\]', chunk, re.S)
        if not m:
            continue
        themes = re.findall(r'"([^"]+)"', m.group(2))
        words = re.findall(r'\[\["([^"]+)"|\],\["([^"]+)"', chunk)
        out.append(dict(id=m.group(1), themes=themes, words=[a or b for a, b in words]))
    return out


def parse_themes(template):
    m = re.search(r'const THEMES=\[(.*?)\n\];', template, re.S)
    return re.findall(r'\["([\w:]+)","([^"]+)","([^"]+)"\]', m.group(1)) if m else []

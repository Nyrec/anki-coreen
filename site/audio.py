#!/usr/bin/env python3
"""Enregistre l'audio manquant avec les voix neuronales coréennes (edge-tts).

  python site/audio.py --todo todo.json --dir /chemin/audio [--max 6000]
todo.json : liste [voix, texte à prononcer, nom de fichier], écrite par build.py --todo.
Les fichiers déjà présents dans --dir ne sont pas refaits.
"""
import argparse, asyncio, json, os, sys
VOICES = {"hyunsu": "ko-KR-HyunsuMultilingualNeural", "sunhi": "ko-KR-SunHiNeural", "injoon": "ko-KR-InJoonNeural"}
ap = argparse.ArgumentParser()
ap.add_argument("--todo", required=True); ap.add_argument("--dir", required=True)
ap.add_argument("--max", type=int, default=6000); ap.add_argument("--jobs", type=int, default=6)
a = ap.parse_args()
os.makedirs(a.dir, exist_ok=True)
todo = [t for t in json.load(open(a.todo, encoding="utf-8")) if not os.path.exists(os.path.join(a.dir, t[2]))][: a.max]
print(f"{len(todo)} fichiers à enregistrer", flush=True)
ok = ko = 0
async def one(sem, voice, text, fn):
    global ok, ko
    import edge_tts
    path = os.path.join(a.dir, fn); tmp = path + ".part"
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, VOICES[voice]).save(tmp)
                if os.path.getsize(tmp) < 800: raise RuntimeError("fichier vide")
                os.replace(tmp, path); ok += 1
                if ok % 200 == 0: print(f"  {ok} faits", flush=True)
                return
            except Exception as e:
                await asyncio.sleep(2 + 4 * attempt)
        ko += 1
        if os.path.exists(tmp): os.remove(tmp)
        if ko <= 10: print("  échec :", voice, text[:40], flush=True)
async def main():
    sem = asyncio.Semaphore(a.jobs)
    await asyncio.gather(*(one(sem, *t) for t in todo))
if todo: asyncio.run(main())
print(f"terminé : {ok} enregistrés, {ko} échecs", flush=True)

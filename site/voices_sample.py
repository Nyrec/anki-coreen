#!/usr/bin/env python3
"""Génère les échantillons de voix coréennes dans site/static/voix/ pour que Maxence choisisse."""
import asyncio, json, os, subprocess, sys
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "voix")
os.makedirs(OUT, exist_ok=True)
TEXTS = [
    ("mot", "기분 전환이 되다"),
    ("phrase", "주말에 청소에다가 빨래까지 해야 해서 정신이 없었어요."),
    ("histoire", "지난달에 회사 근처에 있는 원룸으로 이사를 했어요. 전에 살던 집은 방음이 잘 안 돼서 밤마다 잠을 못 잤거든요. 아직 커튼도 못 달았지만 조용한 집에서 푹 잘 수 있어서 행복해요."),
]
EDGE = [
    ("sunhi", "Microsoft SunHi (femme)", "ko-KR-SunHiNeural", "+0%"),
    ("sunhi-lent", "Microsoft SunHi (femme, plus lent)", "ko-KR-SunHiNeural", "-15%"),
    ("injoon", "Microsoft InJoon (homme)", "ko-KR-InJoonNeural", "+0%"),
    ("hyunsu", "Microsoft Hyunsu (homme, voix récente)", "ko-KR-HyunsuMultilingualNeural", "+0%"),
]
manifest = []
async def edge():
    import edge_tts
    for vid, label, voice, rate in EDGE:
        files = []
        try:
            for tid, text in TEXTS:
                fn = f"{vid}-{tid}.mp3"
                await edge_tts.Communicate(text, voice, rate=rate).save(os.path.join(OUT, fn))
                files.append(fn)
            manifest.append({"id": vid, "label": label, "files": files})
            print("ok", vid)
        except Exception as e:
            print("ÉCHEC", vid, repr(e))
def melo():
    try:
        from melo.api import TTS
        model = TTS(language="KR", device="cpu")
        spk = model.hps.data.spk2id["KR"]
        files = []
        for tid, text in TEXTS:
            wav = os.path.join(OUT, f"melo-{tid}.wav")
            model.tts_to_file(text, spk, wav, speed=1.0)
            files.append(os.path.basename(wav))
        manifest.append({"id": "melo", "label": "Open source MeloTTS (femme)", "files": files})
        print("ok melo")
    except Exception as e:
        print("ÉCHEC melo", repr(e))
if "edge" in sys.argv: asyncio.run(edge())
if "melo" in sys.argv: melo()
mf = os.path.join(OUT, "manifest.json")
old = json.load(open(mf, encoding="utf-8")) if os.path.exists(mf) else {"voices": []}
ids = {m["id"] for m in manifest}
voices = [v for v in old["voices"] if v["id"] not in ids] + manifest
json.dump({"texts": [{"id": t, "ko": k} for t, k in TEXTS], "voices": voices}, open(mf, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

"""Importe inbox/*.txt dans la collection AnkiWeb, sans le Mac.

Sans UPLOAD=true : récupère la collection, ajoute les cartes en local, n'envoie rien.
Ne fait jamais d'envoi complet : si AnkiWeb en demande un, s'arrête en erreur.
"""
import os
import pathlib
import shutil
import sys
import tempfile

from anki.collection import Collection

NOTETYPE = "Korean"
ROOT = pathlib.Path(__file__).parent


def parse(text):
    deck, tags_col, deck_col, rows = None, None, None, []
    for line in text.splitlines():
        if not line.strip():
            continue
        if line.startswith("#"):
            low = line.lower()
            if low.startswith("#deck column:"):
                deck_col = int(line.split(":", 1)[1])
            elif low.startswith("#tags column:"):
                tags_col = int(line.split(":", 1)[1])
            elif low.startswith("#deck:"):
                deck = line.split(":", 1)[1].strip()
            continue
        rows.append(line.split("\t"))
    return deck, tags_col, deck_col, rows


def add_file(col, text):
    model = col.models.by_name(NOTETYPE)
    if not model:
        sys.exit("type de note Korean introuvable")
    deck, tags_col, deck_col, rows = parse(text)
    skip = {c - 1 for c in (tags_col, deck_col) if c}
    added = dup = 0
    for row in rows:
        fields = [v for i, v in enumerate(row) if i not in skip]
        name = row[deck_col - 1].strip() if deck_col and deck_col <= len(row) else deck
        if not name or not fields or len(fields) > len(model["flds"]):
            raise ValueError(f"ligne invalide : {row[:1]}")
        note = col.new_note(model)
        note.fields[: len(fields)] = fields
        note.tags = row[tags_col - 1].split() if tags_col and tags_col <= len(row) else []
        if note.duplicate_or_empty():
            dup += 1
            continue
        col.add_note(note, col.decks.id(name))
        added += 1
    return added, dup


def required(col, auth):
    out = col.sync_collection(auth, False)
    if out.new_endpoint:
        auth.endpoint = out.new_endpoint
    return out


def main():
    files = sorted(p for p in (ROOT / "inbox").glob("*.txt"))
    if not files:
        print("rien à importer")
        return
    tmp = tempfile.mkdtemp()
    col = Collection(os.path.join(tmp, "collection.anki2"))
    auth = col.sync_login(os.environ["ANKIWEB_USER"], os.environ["ANKIWEB_PASS"], None)
    out = required(col, auth)
    Req = type(out).ChangesRequired
    if out.required != Req.FULL_DOWNLOAD:
        sys.exit(f"état de synchro inattendu au départ : {out.required}")
    col.close_for_full_sync()
    col.full_upload_or_download(auth=auth, server_usn=out.server_media_usn, upload=False)
    col.reopen(after_full_sync=True)
    total = 0
    for path in files:
        added, dup = add_file(col, path.read_text(encoding="utf-8-sig"))
        total += added
        print(f"{path.name}: {added} ajoutées, {dup} déjà présentes")
    if os.environ.get("UPLOAD") != "true":
        print(f"ESSAI : {total} cartes préparées, rien envoyé")
        col.close()
        return
    if total:
        out = required(col, auth)
        if out.required not in (Req.NO_CHANGES, Req.NORMAL_SYNC):
            sys.exit(f"AnkiWeb demande une synchro complète ({out.required}) : arrêt, rien écrasé")
    col.close()
    (ROOT / "done").mkdir(exist_ok=True)
    for path in files:
        shutil.move(str(path), ROOT / "done" / path.name)
    print(f"ENVOYÉ : {total} cartes")


if __name__ == "__main__":
    main()

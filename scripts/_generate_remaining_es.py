#!/usr/bin/env python3
"""Translate remaining .es-batches (PT→ES) via Google Translate, saving after each batch."""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(r"C:\Users\felic\Videos\Moxt")
BATCH_DIR = ROOT / "scripts" / ".es-batches"
OUT_DIR = ROOT / "scripts" / ".es-out"
PLACEHOLDER = re.compile(r"\{[^{}]+\}")

# Batches not yet in .es-out (or incomplete)
TARGETS = ["rest2", "rest3", "rest6", "rest7", "rest8"]


def mask_placeholders(text: str):
    values = []

    def replace(match):
        values.append(match.group(0))
        return f"ZXPLACEHOLDER{len(values) - 1}ZX"

    return PLACEHOLDER.sub(replace, text), values


def unmask_placeholders(text: str, values: list[str]) -> str:
    for index, value in enumerate(values):
        text = text.replace(f"ZXPLACEHOLDER{index}ZX", value)
    return text


def translate(text: str) -> str:
    if not text:
        return text
    masked, values = mask_placeholders(text)
    query = urllib.parse.urlencode(
        {"client": "gtx", "sl": "pt", "tl": "es", "dt": "t", "q": masked}
    )
    url = f"https://translate.googleapis.com/translate_a/single?{query}"
    for attempt in range(5):
        try:
            with urllib.request.urlopen(url, timeout=45) as response:
                result = json.load(response)
            translated = "".join(part[0] for part in result[0] if part and part[0])
            return unmask_placeholders(translated, values)
        except Exception as exc:
            if attempt == 4:
                raise
            wait = 2**attempt
            print(f"  retry after {wait}s: {exc}", flush=True)
            time.sleep(wait)
    return text


def process_batch(name: str) -> int:
    source = BATCH_DIR / f"{name}.json"
    dest = OUT_DIR / f"{name}.json"
    if dest.exists() and dest.stat().st_size > 1000:
        # Resume: load existing
        existing = json.loads(dest.read_text(encoding="utf-8-sig"))
        translations = dict(existing.get("translations") or existing)
    else:
        translations = {}

    rows = json.loads(source.read_text(encoding="utf-8-sig"))["rows"]
    pending = [row for row in rows if row["k"] not in translations]
    print(f"\n=== {name}: {len(rows)} rows, {len(translations)} done, {len(pending)} pending ===", flush=True)

    for number, row in enumerate(pending, start=1):
        src = row.get("pt") or row["en"]
        translations[row["k"]] = translate(src)
        if number % 20 == 0 or number == len(pending):
            dest.write_text(
                json.dumps({"translations": translations}, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
                newline="\n",
            )
            print(f"  {name}: {len(translations)}/{len(rows)} saved", flush=True)
            time.sleep(0.25)

    dest.write_text(
        json.dumps({"translations": translations}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"Wrote {dest} ({len(translations)})", flush=True)
    return len(translations)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or TARGETS
    total = 0
    for name in names:
        total += process_batch(name)
    print(f"\nDone. Total map entries written this run (sum): {total}", flush=True)


if __name__ == "__main__":
    main()

"""Static validation for the Beauty Twin AI native WeChat mini-program."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = [
    "pages/home/home",
    "pages/vanity/vanity",
    "pages/care/care",
    "pages/makeup/makeup",
    "pages/skin/skin",
    "pages/store/store",
    "pages/cycle/cycle",
]
ASSET_RE = re.compile(r"/assets/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|webp)")
UNSUPPORTED_RE = re.compile(r"</?(?:b|small|strong|br|i|p|img|div|span|a)(?:\s|>)")
BUTTON_RE = re.compile(r"<button\b[^>]*>")


def fail(errors: list[str]) -> int:
    if errors:
        print("FAIL")
        for error in errors:
            print(f"- {error}")
        return 1
    print("PASS")
    return 0


def main() -> int:
    errors: list[str] = []
    try:
        app = json.loads((ROOT / "app.json").read_text(encoding="utf-8-sig"))
    except Exception as exc:
        return fail([f"app.json is invalid: {exc}"])

    if app.get("pages") != EXPECTED:
        errors.append("app.json page list does not match the seven-page baseline")
    if "tabBar" in app:
        errors.append("global tabBar must remain absent; page-level bottom-nav is used")

    for page in EXPECTED:
        base = ROOT / page
        for suffix in (".json", ".ts", ".wxml", ".wxss"):
            if not Path(f"{base}{suffix}").exists():
                errors.append(f"missing page file: {page}{suffix}")
        try:
            config = json.loads(Path(f"{base}.json").read_text(encoding="utf-8-sig"))
        except Exception as exc:
            errors.append(f"invalid page JSON: {page}: {exc}")
            continue
        if config.get("usingComponents", {}).get("bottom-nav") != "/components/bottom-nav/bottom-nav":
            errors.append(f"bottom-nav is not declared in {page}.json")
        wxml = Path(f"{base}.wxml").read_text(encoding="utf-8-sig")
        if "<bottom-nav" not in wxml:
            errors.append(f"bottom-nav markup missing in {page}.wxml")
        if UNSUPPORTED_RE.search(wxml):
            errors.append(f"unsupported HTML tag found in {page}.wxml")
        for button in BUTTON_RE.findall(wxml):
            if "bindtap=" not in button:
                errors.append(f"button without bindtap in {page}.wxml: {button[:80]}")
        for ref in ASSET_RE.findall(wxml):
            target = ROOT / ref.lstrip("/")
            if not target.exists():
                errors.append(f"missing asset {ref} referenced by {page}.wxml")

    for source in list((ROOT / "pages").glob("*/*.ts")) + list((ROOT / "components").glob("*/*.ts")):
        text = source.read_text(encoding="utf-8-sig")
        for ref in ASSET_RE.findall(text):
            target = ROOT / ref.lstrip("/")
            if not target.exists():
                errors.append(f"missing asset {ref} referenced by {source.as_posix()}")

    for asset in (ROOT / "assets").rglob("*"):
        if asset.is_file() and asset.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
            if asset.stat().st_size == 0:
                errors.append(f"zero-byte image: {asset.relative_to(ROOT).as_posix()}")

    nav_wxml = (ROOT / "components/bottom-nav/bottom-nav.wxml").read_text(encoding="utf-8-sig")
    if "open-type=\"reLaunch\"" not in nav_wxml:
        errors.append("bottom-nav must use native navigator reLaunch routing")
    if nav_wxml.count("wx:for") != 1:
        errors.append("bottom-nav must be data-driven with one navigator loop")

    return fail(errors)


if __name__ == "__main__":
    sys.exit(main())

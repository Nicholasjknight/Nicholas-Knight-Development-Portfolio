#!/usr/bin/env python3
"""Validate tracked public static pages without network access."""
from __future__ import annotations

import json
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree

ROOT = Path(__file__).resolve().parents[1]
TEXT_SUFFIXES = {".html", ".css", ".js", ".json", ".md", ".txt", ".xml"}
IMAGE_SUFFIXES = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"}
IMAGE_BUDGET = 3_000_000
SKIP_CANONICAL = {"404.html", "thank-you.html"}
NONPUBLIC_DIRS = {
    ".github", "admin", "data", "db", "docs", "node_modules", "scripts",
    "test-results", "_rollback", "_seo_audit", "_sf_audit", "__shots",
}


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True
    )
    tracked = [
        ROOT / raw.decode("utf-8")
        for raw in result.stdout.split(b"\0")
        if raw
    ]
    return [path for path in tracked if path.exists()]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.canonicals: list[str] = []
        self.refs: list[str] = []
        self.schemas: list[str] = []
        self._schema: list[str] | None = None

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if tag == "link" and "canonical" in (values.get("rel") or "").lower().split():
            if values.get("href"):
                self.canonicals.append(values["href"])
        for key in ("href", "src"):
            if values.get(key):
                self.refs.append(values[key])
        if values.get("srcset"):
            self.refs.extend(
                value.strip().split()[0]
                for value in values["srcset"].split(",")
                if value.strip()
            )
        if tag == "script" and (values.get("type") or "").lower() == "application/ld+json":
            self._schema = []

    def handle_data(self, data: str) -> None:
        if self._schema is not None:
            self._schema.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._schema is not None:
            self.schemas.append("".join(self._schema).strip())
            self._schema = None


def host(value: str) -> str:
    return value.lower().removeprefix("www.")


def local_target(page: Path, reference: str) -> Path | None:
    reference = reference.strip()
    if not reference or reference.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
        return None
    if any(token in reference for token in ("{{", "}}", "<%", "%>")):
        return None
    parsed = urlparse(reference)
    if parsed.scheme or parsed.netloc or parsed.path.startswith("/api/"):
        return None
    clean = unquote(parsed.path)
    if not clean:
        return None
    target = ROOT / clean.lstrip("/") if clean.startswith("/") else page.parent / clean
    target = target.resolve()
    try:
        target.relative_to(ROOT)
    except ValueError:
        return target
    if clean.endswith("/"):
        return target / "index.html"
    if not target.suffix:
        html = target.with_suffix(".html")
        return html if html.exists() else target / "index.html"
    return target


def main() -> int:
    errors: list[str] = []
    domain = (ROOT / "CNAME").read_text(encoding="utf-8").strip()
    public_pages: set[Path] = set()
    expected_locations: set[str] = set()
    manifest_entries = 0
    try:
        manifest = json.loads(
            (ROOT / "data" / "route-manifest.json").read_text(encoding="utf-8")
        )
        origin = str(manifest["origin"]).rstrip("/")
        route_groups = manifest["routes"]
        for classification, entries in route_groups.items():
            if not isinstance(entries, list):
                errors.append(
                    f"data/route-manifest.json: routes[{classification!r}] must be a list"
                )
                continue
            manifest_entries += len(entries)
        for entry in route_groups["public-indexable"]:
            file_path = ROOT / entry["file"]
            public_pages.add(file_path)
            route = entry["route"]
            expected_locations.add(f"{origin}/" if route == "/" else f"{origin}{route}")
            if not entry.get("sitemap"):
                errors.append(
                    f"data/route-manifest.json: {entry['file']} is public-indexable "
                    "but not opted into the sitemap"
                )
    except (FileNotFoundError, KeyError, TypeError, json.JSONDecodeError) as exc:
        errors.append(f"data/route-manifest.json: invalid or missing ({exc})")

    locations: list[str] = []
    try:
        tree = ElementTree.parse(ROOT / "sitemap.xml")
        locations = [
            (node.text or "").strip()
            for node in tree.iter()
            if node.tag.rsplit("}", 1)[-1] == "loc"
        ]
    except (FileNotFoundError, ElementTree.ParseError) as exc:
        errors.append(f"sitemap.xml: invalid or missing ({exc})")

    if len(locations) != len(set(locations)):
        errors.append("sitemap.xml: duplicate locations")
    actual_locations = set(locations)
    for location in sorted(expected_locations - actual_locations):
        errors.append(f"sitemap.xml: manifest route missing {location}")
    for location in sorted(actual_locations - expected_locations):
        errors.append(f"sitemap.xml: non-indexable or unknown route {location}")

    for location in locations:
        parsed = urlparse(location)
        if parsed.scheme != "https" or host(parsed.hostname or "") != host(domain):
            errors.append(f"sitemap.xml: domain mismatch {location}")
            continue
        route = unquote(parsed.path).lstrip("/")
        target = ROOT / ("index.html" if not route else route)
        if route.endswith("/"):
            target = target / "index.html"
        elif not target.suffix:
            target = target.with_suffix(".html")
        if not target.exists():
            errors.append(f"sitemap.xml: missing page for {location}")

    for path in tracked_files():
        parents = {part.lower() for part in path.relative_to(ROOT).parts[:-1]}
        if path.suffix.lower() not in TEXT_SUFFIXES or parents.intersection(NONPUBLIC_DIRS):
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            errors.append(f"{path.relative_to(ROOT)}: invalid UTF-8 ({exc})")
            continue
        for marker in ("\ufffd", "Ã¢â‚¬", "Ã‚Â·", "ÃƒÂ©", "ÃƒÂ¢"):
            if marker in text:
                errors.append(f"{path.relative_to(ROOT)}: mojibake marker {marker!r}")

    images: set[Path] = set()
    for page in sorted(public_pages):
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        relative = page.relative_to(ROOT)
        if page.name not in SKIP_CANONICAL:
            if len(parser.canonicals) != 1:
                errors.append(f"{relative}: expected one canonical, found {len(parser.canonicals)}")
            else:
                canonical = urlparse(parser.canonicals[0])
                if canonical.scheme != "https" or host(canonical.hostname or "") != host(domain):
                    errors.append(f"{relative}: canonical does not match CNAME {domain}")
        for index, schema in enumerate(parser.schemas, start=1):
            try:
                json.loads(schema)
            except json.JSONDecodeError as exc:
                errors.append(f"{relative}: invalid JSON-LD block {index} ({exc})")
        for reference in parser.refs:
            target = local_target(page, reference)
            if target is not None and not target.exists():
                errors.append(f"{relative}: missing local reference {reference}")
            elif target is not None and target.suffix.lower() in IMAGE_SUFFIXES:
                images.add(target)

    for image in sorted(images):
        if image.stat().st_size > IMAGE_BUDGET:
            errors.append(
                f"{image.relative_to(ROOT)}: {image.stat().st_size} bytes exceeds {IMAGE_BUDGET}"
            )

    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors))
        print(f"Static-site validation failed with {len(errors)} error(s).")
        return 1
    print(
        f"Validated {len(public_pages)} public HTML files from {manifest_entries} classified "
        f"routes, {len(locations)} sitemap URLs, canonicals, JSON-LD, links, UTF-8, "
        "and image budgets."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

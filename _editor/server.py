"""
Local editor for the portfolio.

Run it by double-clicking "Edit website.bat" (or: python _editor/server.py).
It serves the site on http://127.0.0.1:<port>, opens the editor in your browser,
and lets the editor save content.js and upload pictures into assets/uploads/.

It only listens on your own computer (127.0.0.1), uses no extra packages,
and is never part of the published website (GitHub Pages skips folders
that start with an underscore).
"""
import json
import re
import shutil
import sys
import threading
import time
import webbrowser
from datetime import datetime
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content.js"
UPLOADS = ROOT / "assets" / "uploads"
BACKUPS = ROOT / "_editor" / "backups"
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf"}
MAX_UPLOAD = 25 * 1024 * 1024
MAX_BACKUPS = 30

HEADER = (
    "// All the text, links and pictures on the portfolio live in this file.\n"
    "// The easiest way to change it is the editor: double-click \"Edit website.bat\".\n"
    "// You can also edit it by hand; keep the same structure.\n"
)


def slugify(name: str) -> str:
    stem = Path(name).stem.lower()
    stem = re.sub(r"[^a-z0-9]+", "-", stem).strip("-")
    return (stem or "file")[:48]


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Always serve fresh files so the preview shows the latest changes.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if self.command == "POST":
            sys.stdout.write("  %s\n" % (fmt % args))

    # --- safety checks: only accept requests from this computer's own pages ---
    def _allowed(self) -> bool:
        port = self.server.server_address[1]
        hosts = {f"127.0.0.1:{port}", f"localhost:{port}"}
        if self.headers.get("Host") not in hosts:
            return False
        origin = self.headers.get("Origin")
        if origin and origin not in {f"http://{h}" for h in hosts}:
            return False
        return True

    def _json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> bytes:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_UPLOAD:
            raise ValueError("File is empty or larger than 25 MB.")
        return self.rfile.read(length)

    def do_POST(self):
        if not self._allowed():
            return self._json(403, {"error": "Not allowed."})
        route = urlparse(self.path)
        try:
            if route.path == "/api/save":
                return self._save()
            if route.path == "/api/upload":
                return self._upload(parse_qs(route.query))
        except ValueError as e:
            return self._json(400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001 - report anything else to the editor
            return self._json(500, {"error": f"Something went wrong: {e}"})
        return self._json(404, {"error": "Unknown action."})

    def _save(self):
        data = json.loads(self._body().decode("utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Content must be an object.")
        BACKUPS.mkdir(parents=True, exist_ok=True)
        if CONTENT.exists():
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy2(CONTENT, BACKUPS / f"content-{stamp}.js")
            old = sorted(BACKUPS.glob("content-*.js"))
            for f in old[:-MAX_BACKUPS]:
                f.unlink(missing_ok=True)
        text = HEADER + "window.SITE = " + json.dumps(data, indent=2, ensure_ascii=False) + ";\n"
        tmp = CONTENT.with_suffix(".js.tmp")
        tmp.write_text(text, encoding="utf-8")
        tmp.replace(CONTENT)
        return self._json(200, {"ok": True, "savedAt": datetime.now().strftime("%H:%M:%S")})

    def _upload(self, query):
        original = (query.get("name") or ["file"])[0]
        ext = Path(original).suffix.lower()
        if ext == ".jpeg":
            ext = ".jpg"
        if ext not in ALLOWED_EXT:
            raise ValueError("Only JPG, PNG, WEBP, GIF or PDF files can be uploaded.")
        data = self._body()
        UPLOADS.mkdir(parents=True, exist_ok=True)
        base = slugify(original)
        target = UPLOADS / f"{base}{ext}"
        n = 2
        while target.exists():
            target = UPLOADS / f"{base}-{n}{ext}"
            n += 1
        target.write_bytes(data)
        rel = target.relative_to(ROOT).as_posix()
        return self._json(200, {"ok": True, "path": rel})


def main():
    handler = partial(Handler, directory=str(ROOT))
    server = None
    for port in range(8000, 8020):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            continue
    if server is None:
        print("Couldn't find a free port between 8000 and 8019.")
        sys.exit(1)

    port = server.server_address[1]
    editor_url = f"http://127.0.0.1:{port}/_editor/"
    print()
    print("  Portfolio editor is running.")
    print(f"  Editor:  {editor_url}")
    print(f"  Site:    http://127.0.0.1:{port}/")
    print()
    print("  Keep this window open while you edit. Close it (or press Ctrl+C) when you're done.")
    print()
    if "--no-browser" not in sys.argv:
        threading.Thread(target=lambda: (time.sleep(0.6), webbrowser.open(editor_url)), daemon=True).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

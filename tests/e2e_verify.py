#!/usr/bin/env python3
"""
End-to-end Playwright verification + visual side-by-side comparison_grid.png builder
for PINK vs. PURPLE Huntrix Dress-Up Studio (reproducing YouTube znyzrXWXHyE).
"""
import os
import threading
import http.server
import socketserver
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF_DIR = os.path.join(ROOT, ".qa", "reference")
TMP_DIR = os.path.join(ROOT, ".qa", "tmp")
os.makedirs(TMP_DIR, exist_ok=True)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, format, *args):
        pass


def start_server():
    httpd = socketserver.TCPServer(("127.0.0.1", 0), QuietHandler)
    port = httpd.server_address[1]
    t = threading.Thread(target=httpd.serve_forever, daemon=True)
    t.start()
    return httpd, port


def crop_sb_tile(sheet_name, row, col):
    im = Image.open(os.path.join(REF_DIR, sheet_name)).convert("RGB")
    tw = im.width // 5
    th = im.height // 5
    return im.crop((col * tw, row * th, (col + 1) * tw, (row + 1) * th))


def build_comparison_grid(shots):
    """Build 8-row side-by-side Original Video (LEFT) vs Our Build (RIGHT) grid."""
    cell_w, cell_h = 480, 270
    header_h = 44
    label_h = 28
    pad = 12
    cols_w = cell_w * 2 + pad * 3
    total_h = header_h + len(shots) * (cell_h + label_h + pad) + pad

    grid = Image.new("RGB", (cols_w, total_h), (24, 14, 38))
    draw = ImageDraw.Draw(grid)
    try:
        font_hdr = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
        font_lbl = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
    except Exception:
        font_hdr = ImageFont.load_default()
        font_lbl = ImageFont.load_default()

    draw.text((pad + 10, 10), "ORIGINAL VIDEO (youtu.be/znyzrXWXHyE)", fill=(255, 160, 220), font=font_hdr)
    draw.text((pad * 2 + cell_w + 10, 10), "OUR INTERACTIVE BUILD (Live Studio)", fill=(195, 165, 255), font=font_hdr)

    for idx, (label, ref_img, build_path) in enumerate(shots):
        y = header_h + idx * (cell_h + label_h + pad)
        draw.rectangle([pad, y, cols_w - pad, y + label_h - 2], fill=(46, 26, 74))
        draw.text((pad + 10, y + 6), f"{idx + 1}. {label}", fill=(255, 245, 255), font=font_lbl)

        img_y = y + label_h
        left = ref_img.resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        right = Image.open(build_path).convert("RGB").resize((cell_w, cell_h), Image.Resampling.LANCZOS)
        grid.paste(left, (pad, img_y))
        grid.paste(right, (pad * 2 + cell_w, img_y))

    out_path = os.path.join(ROOT, ".qa", "comparison_grid.png")
    grid.save(out_path, optimize=True)
    print(f"Saved comparison grid -> {out_path} ({grid.size})")


def main():
    httpd, port = start_server()
    url = f"http://127.0.0.1:{port}/index.html"
    errors = []

    viewports = [
        ("desktop", 1280, 800),
        ("ipad_land", 1024, 768),
        ("ipad_port", 768, 1024),
        ("mobile", 390, 844),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Verify zero overflow & zero errors across all 4 responsive viewports
        for name, vw, vh in viewports:
            ctx = browser.new_context(viewport={"width": vw, "height": vh})
            page = ctx.new_page()
            page.on("pageerror", lambda err: errors.append(f"[{name}] pageerror: {err}"))
            page.on("console", lambda msg: errors.append(f"[{name}] console.error: {msg.text}") if msg.type == "error" else None)

            page.goto(url, wait_until="networkidle")
            page.wait_for_function("() => window.__GAME__ && window.__GAME__.isReady()", timeout=15000)
            page.wait_for_timeout(250)

            overflow = page.evaluate("""() => ({
                scrollW: document.documentElement.scrollWidth,
                innerW: window.innerWidth,
                topRect: document.getElementById('top-pill').getBoundingClientRect(),
                toolRect: document.getElementById('tool-pill').getBoundingClientRect(),
            })""")
            assert overflow["scrollW"] <= vw + 1, f"{name}: horizontal overflow {overflow['scrollW']} > {vw}"
            assert overflow["topRect"]["right"] <= vw + 1, f"{name}: top-pill clipped right"
            assert overflow["toolRect"]["right"] <= vw + 1, f"{name}: tool-pill clipped right"
            print(f"[PASS] Viewport {name} ({vw}x{vh}): 0 overflow, top/bottom pills inside bounds")

            if name == "mobile":
                page.screenshot(path=os.path.join(TMP_DIR, "mobile_check.png"))
            ctx.close()

        # 2. Full desktop interactive playthrough & comparison shots
        ctx = browser.new_context(viewport={"width": 1280, "height": 720})
        page = ctx.new_page()
        page.on("pageerror", lambda err: errors.append(f"[play] pageerror: {err}"))
        page.on("console", lambda msg: errors.append(f"[play] console.error: {msg.text}") if msg.type == "error" else None)

        page.goto(url, wait_until="networkidle")
        page.wait_for_function("() => window.__GAME__ && window.__GAME__.isReady()", timeout=15000)
        page.wait_for_timeout(300)

        # Shot 1: Split Bedroom + Chained MY DESIGN BOOK (Step 0)
        shot1 = os.path.join(TMP_DIR, "step0_bedroom.png")
        page.screenshot(path=shot1)

        # Test gallery overlay open & close
        page.click("#btn-gallery")
        page.wait_for_timeout(150)
        assert page.locator("#gallery-overlay:not(.hidden)").count() == 1
        assert page.locator(".thumb-card").count() == 12
        page.click("#btn-gallery-close")
        page.wait_for_timeout(100)

        # Test destructive reset confirmation modal (clicking reset opens centered modal, does NOT reset immediately)
        page.evaluate("window.__GAME__.completeStep(0)")
        page.click("#btn-reset")
        assert page.locator("#reset-modal:not(.hidden)").count() == 1
        assert page.evaluate("window.__GAME__.getState().completedSteps.bedroom_invite") is True
        page.click("#btn-reset-no")
        assert page.locator("#reset-modal.hidden").count() == 1

        # Shot 2: Purple watercolor painting + flower palette (Step 3)
        page.evaluate("""() => {
            window.__GAME__.goToStep(3);
            window.__GAME__.getState().progress.purple_paint.coverage = 0.72;
        }""")
        page.wait_for_timeout(200)
        shot2 = os.path.join(TMP_DIR, "step3_purple_paint.png")
        page.screenshot(path=shot2)

        # Shot 3: Purple cut + pearl rhinestones (Step 4)
        page.evaluate("() => { window.__GAME__.goToStep(4); window.__GAME__.completeStep(4); }")
        page.wait_for_timeout(200)
        shot3 = os.path.join(TMP_DIR, "step4_purple_gems.png")
        page.screenshot(path=shot3)

        # Shot 4: Purple starry runway dressed + heart makeup (Step 5)
        page.evaluate("() => { window.__GAME__.goToStep(5); window.__GAME__.completeStep(5); }")
        page.wait_for_timeout(250)
        shot4 = os.path.join(TMP_DIR, "step5_purple_runway.png")
        page.screenshot(path=shot4)

        # Shot 5: Pink marker + glitter in MY DESIGN BOOK (Step 8)
        page.evaluate("""() => {
            window.__GAME__.goToStep(8);
            const p = window.__GAME__.getState().progress.pink_marker_glitter;
            p.marker = 0.95; p.glitter = 0.92; p.fanDry = 0.0;
            window.__GAME__.selectTool('glitter');
        }""")
        page.wait_for_timeout(200)
        shot5 = os.path.join(TMP_DIR, "step8_pink_glitter.png")
        page.screenshot(path=shot5)

        # Shot 6: White handheld Mini Fan drying pink glitter (Step 8 fan active)
        page.evaluate("""() => {
            const p = window.__GAME__.getState().progress.pink_marker_glitter;
            p.marker = 1.0; p.glitter = 1.0; p.fanDry = 0.45;
            window.__GAME__.selectTool('fan');
        }""")
        page.wait_for_timeout(200)
        shot6 = os.path.join(TMP_DIR, "step8_mini_fan.png")
        page.screenshot(path=shot6)

        # Shot 7: 3x3 Pink Memory Match Shoes mini-game (Step 9 mid-game)
        page.evaluate("""() => {
            window.__GAME__.goToStep(9);
            window.__GAME__.flipMemory(0);
            window.__GAME__.flipMemory(5);
            window.__GAME__.flipMemory(1);
            window.__GAME__.flipMemory(7);
            window.__GAME__.flipMemory(2);
        }""")
        page.wait_for_timeout(220)
        shot7 = os.path.join(TMP_DIR, "step9_memory_shoes.png")
        page.screenshot(path=shot7)

        # Complete remaining pairs via real hook and verify unlock
        page.evaluate("""() => {
            window.__GAME__.flipMemory(8);
            window.__GAME__.flipMemory(3);
            window.__GAME__.flipMemory(6);
        }""")
        assert page.evaluate("window.__GAME__.getState().progress.pink_memory_shoes.shoesUnlocked") is True

        # Shot 8: Grand PINK vs. PURPLE Concert Spotlight Runway Showdown (Step 11)
        page.evaluate("""() => {
            window.__GAME__.goToStep(11);
            window.__GAME__.selectTool('vote_both');
        }""")
        page.wait_for_timeout(350)
        shot8 = os.path.join(TMP_DIR, "step11_showdown.png")
        page.screenshot(path=shot8)

        # Save flagship README preview screenshot.jpg
        Image.open(shot8).convert("RGB").save(os.path.join(ROOT, "screenshot.jpg"), quality=90, optimize=True)

        ctx.close()
        browser.close()

    httpd.shutdown()
    assert not errors, f"Runtime errors detected: {errors}"

    # Build 8-beat side-by-side comparison_grid.png
    shots = [
        ("Split Pink/Purple Bedroom & Contest Invite (00:05)", crop_sb_tile("sb0_00.jpg", 0, 1), shot1),
        ("MY DESIGN BOOK Flower Watercolor Painting (03:20)", crop_sb_tile("sb0_01.jpg", 0, 0), shot2),
        ("Golden Scissors Cut & Pearl Rhinestones (04:40)", crop_sb_tile("sb0_01.jpg", 0, 3), shot3),
        ("Purple Starry Runway & Heart Shimmer Makeup (06:10)", crop_sb_tile("sb0_01.jpg", 2, 4), shot4),
        ("Team Pink Marker & Glitter in Design Book (08:50)", crop_sb_tile("sb0_02.jpg", 0, 0), shot5),
        ("White Handheld Mini Fan Drying Glitter (09:15)", crop_sb_tile("sb0_02.jpg", 1, 0), shot6),
        ("3x3 Pink Memory Match Shoes Mini-Game (10:15)", crop_sb_tile("sb0_02.jpg", 2, 2), shot7),
        ("Grand PINK vs. PURPLE Runway Showdown (11:45)", crop_sb_tile("sb0_02.jpg", 3, 0), shot8),
    ]
    build_comparison_grid(shots)
    print("[PASS] All E2E checks & comparison_grid.png succeeded with 0 errors!")


if __name__ == "__main__":
    main()

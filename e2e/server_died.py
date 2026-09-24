"""Login qilingandan keyin server o'chsa: sahifalar oq ekran emas, xato paneli ko'rsatishi kerak.
Ishga tushirish: server va web ishlab turganda; skript o'zi 4000 portni to'xtatadi."""
import sys, os, subprocess, time
from playwright.sync_api import sync_playwright, expect
OUT = sys.argv[1] if len(sys.argv) > 1 else "e2e/shots"
with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={"width": 1280, "height": 800})
    errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("http://localhost:5173/")
    page.fill("input[type=email]", "manager@mars.uz"); page.fill("input[type=password]", "mars2026")
    page.click("button:has-text('Kirish')")
    expect(page.get_by_role("heading", name="Bosh sahifa")).to_be_visible()
    subprocess.run("lsof -ti:4000 | xargs kill", shell=True); time.sleep(1)
    for path in ["/history", "/mentors", "/groups"]:
        page.click(f"a[href='{path}']")
        expect(page.get_by_text("Ma'lumotni yuklab bo'lmadi")).to_be_visible()
        expect(page.get_by_text("Server ishlamayapti")).to_be_visible()
    page.screenshot(path=f"{OUT}/server-died.png")
    b.close()
print("PAGE ERRORS:", errs or "yo'q"); print("SERVER-DIED OK")

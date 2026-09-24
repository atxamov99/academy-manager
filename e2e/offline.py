"""Server o'chiq bo'lsa sahifalar oq ekranga tushmasligi kerak. Faqat web (5173) ishlab turganda ishga tushiring."""
import sys, os
from playwright.sync_api import sync_playwright, expect
OUT = sys.argv[1] if len(sys.argv) > 1 else "e2e/shots"
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={"width": 1280, "height": 800})
    errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("http://localhost:5173/")
    page.fill("input[type=email]", "manager@mars.uz"); page.fill("input[type=password]", "x")
    page.click("button:has-text('Kirish')")
    expect(page.get_by_text("Server ishlamayapti")).to_be_visible()
    page.screenshot(path=f"{OUT}/offline-login.png")
    b.close()
print("PAGE ERRORS:", errs or "yo'q"); print("OFFLINE OK")

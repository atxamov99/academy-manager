"""E2E: login -> "Mentor kerak" -> almashtirish -> tekshiruv. Ishga tushirish: python3 e2e/flow.py [screenshot_papka]"""
import sys, os
from playwright.sync_api import sync_playwright, expect

OUT = sys.argv[1] if len(sys.argv) > 1 else "e2e/shots"
os.makedirs(OUT, exist_ok=True)
URL = "http://localhost:5173"
errors = []

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 1400, "height": 900})
    page.on("console", lambda m: m.type == "error" and errors.append(m.text))
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(URL)
    page.screenshot(path=f"{OUT}/01-login.png")
    page.fill("input[type=email]", "manager@mars.uz")
    page.fill("input[type=password]", "mars2026")
    page.click("button:has-text('Kirish')")
    expect(page.get_by_role("heading", name="Bosh sahifa")).to_be_visible()
    needs = page.locator("section", has_text="Mentor kerak").first
    expect(needs.get_by_text("FN-101")).to_be_visible()
    page.screenshot(path=f"{OUT}/02-dashboard.png", full_page=True)

    # FN-101 qatoridagi "Mentor topish"
    row = needs.locator("div.flex", has_text="FN-101").first
    row.get_by_role("button", name="Mentor topish").click()
    expect(page.get_by_role("heading", name="Mentorni almashtirish")).to_be_visible()
    expect(page.get_by_text("Eng mos")).to_be_visible()
    # Modal fon qatlami butun ekranni qoplashi kerak (bug: <main> transform ichida qolib ketgan edi)
    ov = page.locator("div.fixed.inset-0").first.bounding_box()
    vw = page.viewport_size
    assert ov["x"] == 0 and ov["y"] == 0 and ov["width"] == vw["width"] and ov["height"] == vw["height"], ov
    page.get_by_text("Nega boshqalar mos emas").click()
    page.screenshot(path=f"{OUT}/03-replace-modal.png")

    best = page.locator("button", has_text="Eng mos").first
    name = best.locator("span.font-semibold").first.inner_text()
    best.click()
    page.get_by_role("button", name="ni qo'yish").click()
    expect(page.get_by_role("heading", name="Tayyor")).to_be_visible()
    expect(page.get_by_text(name).first).to_be_visible()
    page.screenshot(path=f"{OUT}/04-done.png")
    page.get_by_role("button", name="Yopish").last.click()

    # FN-101 endi ertangi "mentor kerak"da yo'q
    page.wait_for_timeout(500)
    expect(needs.get_by_text("FN-101")).to_have_count(0)
    page.screenshot(path=f"{OUT}/05-dashboard-after.png", full_page=True)

    # Mentorlar: statistikalar
    page.click("a:has-text('Mentorlar')")
    expect(page.get_by_text("shu oy").first).to_be_visible()
    page.get_by_role("button", name="Yangi mentor").click()
    ov = page.locator("div.fixed.inset-0").first.bounding_box()
    assert ov["height"] == page.viewport_size["height"], ov
    expect(page.get_by_role("heading", name="Yangi mentor")).to_be_in_viewport()
    page.screenshot(path=f"{OUT}/06b-mentor-form.png")
    page.keyboard.press("Escape")
    page.screenshot(path=f"{OUT}/06-mentors.png", full_page=True)
    page.click(f"a:has-text('{name}')")
    expect(page.get_by_text("Haftalik dars jadvali")).to_be_visible()
    expect(page.get_by_text("zamena").first).to_be_visible()
    page.screenshot(path=f"{OUT}/07-mentor-detail.png", full_page=True)

    # Guruh tarixi
    page.click("a:has-text('Guruhlar')")
    page.click("a:has-text('FN-101')")
    expect(page.get_by_text("Mentor almashtirish tarixi")).to_be_visible()
    page.screenshot(path=f"{OUT}/08-group.png", full_page=True)

    page.click("a:has-text('Tarix va hisobot')")
    expect(page.get_by_text("Beqaror guruhlar")).to_be_visible()
    page.screenshot(path=f"{OUT}/09-history.png", full_page=True)

    # Telefon kengligi
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(URL)
    expect(page.get_by_role("heading", name="Bosh sahifa")).to_be_visible()
    page.screenshot(path=f"{OUT}/10-mobile.png", full_page=True)
    b.close()

real = [e for e in errors if "fonts.g" not in e]
print("CONSOLE ERRORS:", real or "yo'q")
print("E2E OK — tanlangan mentor:", name)

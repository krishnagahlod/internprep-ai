from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser Error: {err}"))
        
        print("Navigating to http://localhost:3000/history")
        page.goto("http://localhost:3000/history", wait_until="networkidle")
        print("Page loaded.")
        
        browser.close()

run()

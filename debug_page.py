from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # 监听控制台输出
    page.on("console", lambda msg: print(f"[CONSOLE {msg.type}] {msg.text}"))
    
    # 监听页面错误
    page.on("pageerror", lambda err: print(f"[PAGE ERROR] {err}"))
    
    print("Navigating to http://localhost:5173/ ...")
    page.goto('http://localhost:5173/')
    page.wait_for_load_state('networkidle')
    
    # 等待一下确保 Vue 渲染完成
    page.wait_for_timeout(2000)
    
    # 获取页面内容
    content = page.content()
    print("\n=== PAGE HTML (first 2000 chars) ===")
    print(content[:2000])
    
    # 检查 #app 元素
    app_element = page.locator('#app')
    print(f"\n=== #app element ===")
    print(f"Count: {app_element.count()}")
    if app_element.count() > 0:
        print(f"Inner HTML: {app_element.inner_html()[:500]}")
        print(f"Bounding box: {app_element.bounding_box()}")
    
    # 截图
    page.screenshot(path='d:/code/project/debug_screenshot.png', full_page=True)
    print("\nScreenshot saved to d:/code/project/debug_screenshot.png")
    
    browser.close()

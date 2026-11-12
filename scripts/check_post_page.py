"""Pre-push checks for the post page, run against a local preview.
Usage: hugo server -p 8811 --environment production, then python3 scripts/check_post_page.py [base_url]
Needs Playwright for Python (pip install playwright; playwright install chromium).
1 fold: lines of the first paragraph on the first screen (1366x625, 1280x609)
2 jump: every contents entry lands on its heading with the right entry highlighted
3 overflow, layout shift, script errors
4 usage events reach the analytics function
Remote images load from their real host; the lab
vendor's hosts and all trackers are blocked."""
import sys, json, re
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8811'
TOP = ['thm-room-diveintopentesting','thm-room-aiautomationdetectioneng','thm-room-brokenauthentication','thm-room-linprivauto','thm-room-thecleanexit','thm-room-shellsfundamentals','thm-room-monitoringawslogins','thm-room-advancedpacketanalysis','thm-room-os-intro','log-analysis-with-siem']
REMOTE = ['thm-room-btautopsye0','thm-room-malremnuxv2','thm-room-attackingkerberos']
fails = []
def route(r):
    u = r.request.url
    if u.startswith(BASE): return r.continue_()
    if 'i.imgur.com' in u or 'githubusercontent' in u:
        return r.continue_()
    return r.abort()
INIT = """window.__ev=[];window.gtag=function(){window.__ev.push([].slice.call(arguments))};
window.__cls=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(e){}"""
def page_for(b, w, h):
    c = b.new_context(viewport={'width': w, 'height': h})
    c.add_init_script(INIT)
    c.route('**/*', route)
    p = c.new_page()
    errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    return c, p, errs
with sync_playwright() as pw:
    b = pw.chromium.launch()
    # 1 fold
    print('== fold: visible px of first paragraph / write-up start y')
    for w, h in [(1366, 625), (1280, 609)]:
        for s in TOP:
            c, p, errs = page_for(b, w, h)
            p.goto(f'{BASE}/post/{s}/', wait_until='domcontentloaded'); p.wait_for_timeout(400)
            r = p.evaluate("""()=>{const c=document.querySelector('.post-content');const para=c.querySelector('p');const pr=para.getBoundingClientRect();
              return {top:Math.round(c.getBoundingClientRect().top), ptop:Math.round(pr.top), vis:Math.max(0,Math.round(Math.min(innerHeight,pr.bottom)-pr.top)), lh:parseFloat(getComputedStyle(para).lineHeight),
              rail:!!document.querySelector('.toc-rail details[open]'), ow:document.documentElement.scrollWidth-innerWidth, cls:window.__cls}}""")
            lines = int(r['vis'] // r['lh'])
            ok = lines >= 4
            if not ok: fails.append(f'fold {w}x{h} {s}: {lines} lines')
            if r['ow'] > 0: fails.append(f'overflow {w} {s}: {r["ow"]}px')
            if r['cls'] > 0.02: fails.append(f'cls {w} {s}: {r["cls"]:.3f}')
            if errs: fails.append(f'js {s}: {errs[:2]}')
            print(f"  {w}x{h} {s:38s} content y={r['top']:4d} para y={r['ptop']:4d} lines={lines:2d} rail_open={r['rail']} cls={r['cls']:.3f} {'ok' if ok else 'FAIL'}")
            c.close()
    # 2 jump
    print('== jump: each contents entry, fresh page per click')
    for w, h in [(1366, 768), (1280, 720), (390, 844)]:
        for s in (['thm-room-diveintopentesting','thm-room-aiautomationdetectioneng','thm-room-thecleanexit','log-analysis-with-siem','thm-room-btautopsye0','thm-room-attackingkerberos'] if w == 1366 else ['thm-room-aiautomationdetectioneng', 'thm-room-btautopsye0']):
            c, p, errs = page_for(b, w, h)
            p.goto(f'{BASE}/post/{s}/', wait_until='domcontentloaded'); p.wait_for_timeout(300)
            n = p.evaluate("document.querySelectorAll('.toc a[href^=\"#\"]').length")
            idxs = sorted(set([0, n // 3, n // 2, (2 * n) // 3, n - 2, n - 1])) if n > 6 else list(range(n))
            idxs = [i for i in idxs if 0 <= i < n]
            bad = []; worst = 0
            for i in idxs:
                p.goto('about:blank'); p.goto(f'{BASE}/post/{s}/', wait_until='domcontentloaded'); p.wait_for_timeout(250)
                if w < 1200: p.evaluate("document.querySelector('.toc').open=true")
                p.evaluate(f"document.querySelectorAll('.toc a[href^=\"#\"]')[{i}].click()")
                p.wait_for_timeout(1800)
                r = p.evaluate(f"""()=>{{const a=document.querySelectorAll('.toc a[href^="#"]')[{i}];const id=decodeURIComponent(a.getAttribute('href').slice(1));
                  const t=document.getElementById(id);const maxed=Math.abs(document.documentElement.scrollHeight-innerHeight-scrollY)<3;
                  const act=document.querySelector('.toc a.active');return {{top:Math.round(t.getBoundingClientRect().top),maxed,active:act===a,ar:act?act.getAttribute('aria-current'):null,
                  inrail:(()=>{{const d=document.querySelector('.toc');const R=d.getBoundingClientRect(),A=a.getBoundingClientRect();return A.top>=R.top-1&&A.bottom<=R.bottom+1}})()}}}}""")
                off = abs(r['top'] - 16)
                landed = off <= 20 or (r['maxed'] and r['top'] >= 0)
                worst = max(worst, 0 if landed else off)
                if not landed or not r['active'] or (w >= 1200 and not r['inrail']): bad.append((i, r))
            if errs: fails.append(f'js {s}: {errs[:2]}')
            if bad: fails.append(f'jump {w}x{h} {s}: {len(bad)}/{len(idxs)} {bad[:2]}')
            print(f"  {w}x{h} {s:38s} entries={n:3d} tested={len(idxs)} bad={len(bad)} worst_off={worst}")
            c.close()
    # 2b arriving on a section link
    print('== arrive on a #section link')
    for s in ['thm-room-aiautomationdetectioneng', 'thm-room-btautopsye0', 'log-analysis-with-siem']:
        c, p, errs = page_for(b, 1366, 768)
        p.goto(f'{BASE}/post/{s}/', wait_until='domcontentloaded')
        hid = p.evaluate("(()=>{const a=[...document.querySelectorAll('.toc a[href^=\"#\"]')];return a[a.length-2].getAttribute('href')})()")
        p.goto('about:blank'); p.goto(f'{BASE}/post/{s}/{hid}', wait_until='domcontentloaded'); p.wait_for_timeout(3500)
        top = p.evaluate(f"Math.round(document.getElementById(decodeURIComponent('{hid}'.slice(1))).getBoundingClientRect().top)")
        ok = abs(top - 16) <= 20
        if not ok: fails.append(f'arrive {s}: top={top}')
        print(f'  {s:38s} {hid[:40]:40s} top={top} {"ok" if ok else "FAIL"}'); c.close()
    # 3 overflow at more widths
    print('== overflow')
    for w in [320, 390, 768, 1200, 1280, 1366, 1920]:
        for path in ['/post/thm-room-diveintopentesting/', '/post/log-analysis-with-siem/', '/post/thm-room-thecleanexit/', '/paths/soc-level-2/', '/']:
            c, p, errs = page_for(b, w, 800)
            p.goto(BASE + path, wait_until='domcontentloaded'); p.wait_for_timeout(300)
            ow = p.evaluate('document.documentElement.scrollWidth-innerWidth')
            if ow > 0: fails.append(f'overflow {w} {path}: {ow}px')
            if errs: fails.append(f'js {path}: {errs[:2]}')
            c.close()
    print('  done')
    # 4 events
    print('== events')
    c, p, errs = page_for(b, 1366, 768)
    p.goto(f'{BASE}/post/thm-room-diveintopentesting/', wait_until='domcontentloaded'); p.wait_for_timeout(300)
    p.evaluate("document.querySelectorAll('.post-jump a')[1].click()"); p.wait_for_timeout(300)
    p.evaluate("document.querySelectorAll('.toc a')[2].click()"); p.wait_for_timeout(300)
    p.mouse.wheel(0, 300); p.wait_for_timeout(200)
    p.evaluate("window.scrollTo(0, document.documentElement.scrollHeight)"); p.wait_for_timeout(500)
    p.evaluate("(()=>{const a=document.querySelector('.rail-next-room');a.addEventListener('click',e=>e.preventDefault());a.click()})()")
    p.evaluate("(()=>{const a=document.querySelector('.path-strip-next');a.addEventListener('click',e=>e.preventDefault());a.click()})()")
    ev = p.evaluate('window.__ev'); names = [e[1] for e in ev]
    print('  ', names); print('  sample', json.dumps(ev[0]), json.dumps([e for e in ev if e[1].startswith('scroll')][:1]))
    for want in ['post_view', 'jump_click', 'toc_click', 'scroll_25', 'scroll_50', 'scroll_75', 'rail_next', 'strip_next']:
        if want not in names: fails.append(f'event missing: {want}')
    leak = [e for e in ev if set(e[2].keys()) - {'post', 'in_path', 'vw', 'after_jump'}]
    if leak: fails.append(f'event params: {leak[:1]}')
    if errs: fails.append(f'js events: {errs[:2]}')
    c.close()
    # 5 saved progress with a broken store, zoom, search hand-off
    print('== progress store, zoom, search')
    for bad in ['null', '[]', '"x"', '{"soc-level-2":null}', '{"soc-level-2":{"read":"x","next":{}}}', '{bad json']:
        for path in ['/', '/paths/', '/paths/soc-level-2/', '/post/thm-room-aiautomationdetectioneng/']:
            c, p, errs = page_for(b, 1366, 768)
            c.add_init_script("try{localStorage.setItem('classroom-paths', %s)}catch(e){}" % json.dumps(bad))
            p.goto(BASE + path, wait_until='domcontentloaded'); p.wait_for_timeout(250)
            if errs: fails.append(f'progress store {bad} {path}: {errs[:1]}')
            c.close()
    c, p, errs = page_for(b, 1366, 768)
    p.goto(f'{BASE}/post/thm-room-aiautomationdetectioneng/', wait_until='load'); p.wait_for_timeout(500)
    z = p.evaluate("document.querySelectorAll('.post-content img.zoomable').length")
    if z:
        p.locator('.post-content img.zoomable').first.click(); p.wait_for_timeout(200)
        o = p.evaluate("!!document.querySelector('dialog.img-zoom[open]')")
        p.keyboard.press('Escape'); p.wait_for_timeout(200)
        cl = p.evaluate("!document.querySelector('dialog.img-zoom') && document.documentElement.style.overflow===''")
        print(f'  zoomable={z} opened={o} closed_clean={cl}')
        if not (o and cl): fails.append('zoom dialog')
    else: fails.append('no zoomable images found')
    c.close()
    for q, want in [('splunk', 'results'), ('zzqqxxyy', 'none')]:
        c, p, errs = page_for(b, 1366, 768)
        p.goto(f'{BASE}/search/?q={q}', wait_until='load'); p.wait_for_timeout(10500)
        r = p.evaluate("({n:document.getElementById('searchResults').children.length, note:(document.querySelector('.search-note')||{}).textContent||''})")
        print(f'  search {q}: {r}')
        if want == 'results' and not r['n']: fails.append('search results missing')
        if want == 'none' and 'No walkthrough matches' not in r['note']: fails.append('search no-match note missing')
        if errs: fails.append(f'js search: {errs[:2]}')
        c.close()
    # 6 behaviours added after review
    print('== reload keeps position, Back releases the pin, focus follows a jump, rail fits the window')
    c, p, errs = page_for(b, 1366, 657)
    p.goto(f'{BASE}/post/log-analysis-with-siem/', wait_until='domcontentloaded'); p.wait_for_timeout(300)
    r = p.evaluate("(()=>{const s=document.querySelector('.rail-stick').getBoundingClientRect();return {bottom:Math.round(s.bottom),h:innerHeight}})()")
    print('  rail bottom', r)
    if r['bottom'] > r['h']: fails.append(f'rail taller than window: {r}')
    p.evaluate("document.querySelectorAll('.toc a')[3].click()"); p.wait_for_timeout(400)
    foc = p.evaluate("document.activeElement && document.activeElement.id")
    hid = p.evaluate("decodeURIComponent(location.hash.slice(1))")
    print('  focus after jump', foc == hid)
    if foc != hid: fails.append('focus did not follow the jump')
    y0 = p.evaluate('scrollY')
    p.evaluate("document.querySelectorAll('.toc a')[8].click()"); p.wait_for_timeout(300)
    p.go_back(); p.wait_for_timeout(1500)
    yb = p.evaluate('scrollY'); print('  back: y', y0, '->', yb)
    if abs(yb - y0) > 60: fails.append(f'Back did not return to the earlier section: {y0} vs {yb}')
    p.mouse.move(600, 300); p.mouse.wheel(0, 3000); p.wait_for_timeout(9000)
    y1 = p.evaluate('scrollY'); p.reload(wait_until='domcontentloaded'); p.wait_for_timeout(2500)
    y2 = p.evaluate('scrollY'); print('  reload: y', y1, '->', y2)
    if abs(y2 - y1) > 200: fails.append(f'reload lost the reading position: {y1} vs {y2}')
    if errs: fails.append(f'js review-behaviours: {errs[:2]}')
    c.close()
    b.close()
print('\nFAILS:', len(fails)); [print('  -', f) for f in fails]

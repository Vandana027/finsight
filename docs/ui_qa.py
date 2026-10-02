import re, sys
from playwright.sync_api import sync_playwright
B=sys.argv[1]; AX=open('/home/claude/qa/node_modules/axe-core/axe.min.js').read()
slugs=re.findall(r'^  \{ slug: "([a-z-]+)"', open('data/calculators.ts').read(), re.M)
assert len(slugs)==12, len(slugs)
REMOVED=['goal-lumpsum','time-duration-one-time','time-duration-regular','investment-planner','stock-vs-fd','children-education','education-loan-emi','gst','gratuity']
BADHREF=re.compile('|'.join(REMOVED))
links=set()
MODE=sys.argv[2]; W=[int(x) for x in sys.argv[3].split(',')] if MODE=='ui' else []; issues=[]; pages=0
def flag(w,where,msg): issues.append(f"[{w}px] {where}: {msg}")
HEAD="section[aria-label=Results] p.text-4xl"
def wait_charts(pg):
    pg.wait_for_selector("section[aria-label=Results] .recharts-surface",timeout=8000)
with sync_playwright() as p:
    br=p.chromium.launch()
    for w in W:
        ctx=br.new_context(viewport={"width":w,"height":850}); pg=ctx.new_page(); errs=[]
        pg.on("console",lambda m: errs.append(m.text) if m.type in("error","warning") else None); pg.on("pageerror",lambda e: errs.append(str(e)))
        pg.on("requestfailed",lambda r: errs.append("reqfail "+r.url)); pg.on("response",lambda r: errs.append(f"{r.status} {r.url}") if r.status>=400 else None)
        def overflow(where):
            o=pg.evaluate("()=>{const bad=[];document.querySelectorAll('body *').forEach(e=>{const r=e.getBoundingClientRect();if(r.width>0&&(r.right>innerWidth+1||r.left<-1)&&!e.closest('.overflow-auto,.overflow-x-auto,.sr-only')&&getComputedStyle(e).position!=='fixed')bad.push(e.tagName+'.'+String(e.className).slice(0,50))});return [document.documentElement.scrollWidth-innerWidth,bad.slice(0,3)]}")
            if o[0]>0 or o[1]: flag(w,where,f"overflow {o}")
        for path in ["/","/calculators"]+[f"/calculators/{s}" for s in slugs]:
            pg.goto(B+path,wait_until="networkidle"); pages+=1
            if re.search(r"NaN|Infinity|undefined|\bnull\b",pg.inner_text("body")): flag(w,path,"bad text")
            overflow(path)
            for h in pg.locator("a[href]").evaluate_all("e=>e.map(a=>a.getAttribute('href'))"):
                if h.startswith("/"): links.add(h.split("#")[0])
                if BADHREF.search(h): flag(w,path,f"link to removed calculator {h}")
            if BADHREF.search(pg.inner_text("body").lower().replace(" ","-")) and path!="/calculators/nope": flag(w,path,"removed calculator text/slug visible")
            if pg.locator("h1").count()!=1: flag(w,path,f"h1 count {pg.locator('h1').count()}")
            if path.startswith("/calculators/"):
                try: wait_charts(pg)
                except Exception: flag(w,path,"chart did not render")
                if not pg.locator(HEAD).first.inner_text().strip(): flag(w,path,"empty headline")
                if pg.evaluate("()=>[...document.querySelectorAll('section[aria-label=Results] > div')].some(d=>!d.innerText.trim()&&!d.querySelector('svg'))"): flag(w,path,"empty card")
                if pg.locator("text=Related calculators").count()!=1: flag(w,path,"related missing")
        for rs in REMOVED:
            r=pg.goto(B+f"/calculators/{rs}",wait_until="networkidle")
            if r.status!=404 or "couldn’t find" not in pg.inner_text("body"): flag(w,f"/calculators/{rs}",f"removed route not a 404 ({r.status})")
        pg.goto(B+"/calculators/nope",wait_until="networkidle")
        if "couldn’t find" not in pg.inner_text("body"): flag(w,"/nope","404 page missing")
        # catalogue
        pg.goto(B+"/calculators",wait_until="networkidle"); n=lambda: pg.locator("main a[href^='/calculators/']").count()
        if n()!=12: flag(w,"cat",f"{n()} cards")
        for q,exp in [(" SIP ",lambda c:c>=3),("sip calculator",lambda c:c>=1),("EMI",lambda c:c==1),("gst",lambda c:c==0),("gratuity",lambda c:c==0),("education loan",lambda c:c==0),("PPF",lambda c:c==1),("zzz",lambda c:c==0)]:
            pg.fill("#search-box",q); 
            if not exp(n()): flag(w,"search",f"{q!r} -> {n()}")
        if not pg.get_by_text("No calculator matches").count()==0 and False: pass
        pg.fill("#search-box","zzz")
        if not pg.get_by_text("No calculator matches").count(): flag(w,"search","empty state")
        pg.fill("#search-box",""); pg.get_by_role("button",name="Borrow").click()
        if n()!=1: flag(w,"filter","Borrow")
        pg.goto(B+"/calculators?category=Save",wait_until="networkidle")
        if n()!=3: flag(w,"deep-link category",f"{n()}")
        pg.goto(B+"/calculators#search",wait_until="networkidle")
        if pg.evaluate("document.activeElement.id")!="search-box": flag(w,"search anchor","not focused")
        if w<768:
            pg.goto(B+"/",wait_until="networkidle"); pg.get_by_role("button",name="Open menu").click()
            pg.get_by_role("link",name="Calculators").last.click(); pg.wait_for_url("**/calculators**")
        # related links and breadcrumbs
        pg.goto(B+"/calculators/sip",wait_until="networkidle")
        rel=pg.locator("section[aria-labelledby=related-h] a[href^='/calculators/']").evaluate_all("e=>e.map(a=>a.getAttribute('href'))")
        if sorted(set(rel))!=sorted(["/calculators/lumpsum","/calculators/step-up","/calculators/goal-sip","/calculators/compound-interest"]): flag(w,"sip related",str(rel))
        pg.locator("section[aria-labelledby=related-h] a[href='/calculators/lumpsum']").first.click(); pg.wait_for_url("**/calculators/lumpsum")
        if pg.locator("h1").inner_text()!="Lumpsum Calculator": flag(w,"related nav","wrong page")
        pg.go_back(); pg.wait_for_url("**/calculators/sip"); pg.go_forward(); pg.wait_for_url("**/calculators/lumpsum")
        pg.get_by_label("Breadcrumb").get_by_role("link",name="Calculators").click(); pg.wait_for_url("**/calculators")
        pg.goto(B+"/",wait_until="networkidle")
        if "12 calculators" not in pg.inner_text("main"): flag(w,"home","count text missing")
        if pg.locator("a[href^='/calculators/']").evaluate_all("e=>new Set(e.map(a=>a.getAttribute('href'))).size")!=12: flag(w,"home","does not link to all 12 calculators")
        # form behaviours
        pg.goto(B+"/calculators/sip",wait_until="networkidle"); wait_charts(pg)
        head=lambda: pg.locator(HEAD).first.inner_text()
        h0=head(); pg.fill("#f-amount","25000"); pg.wait_for_timeout(100)
        if head()==h0: flag(w,"sip","no live update")
        pg.fill("#f-amount","1,00,000"); pg.locator("#f-rate").focus()   # blur -> grouped
        if pg.input_value("#f-amount")!="1,00,000": flag(w,"sip",f"blur grouping {pg.input_value('#f-amount')!r}")
        pg.locator("#f-amount").focus()
        if pg.input_value("#f-amount")!="100000": flag(w,"sip","focus should ungroup")
        pg.fill("#f-amount","₹ 1,25,000"); pg.locator("#f-rate").focus()
        if "1,25,000" not in pg.inner_text(HEAD.replace("p.text-4xl","div")) and pg.locator("#f-amount-err").count(): flag(w,"sip","paste with rupee sign rejected")
        pg.get_by_role("button",name="Reset").click()
        if pg.input_value("#f-amount")!="10000" or head()!=h0: flag(w,"sip","reset")
        for bad,label in [("abc","text"),("1e5","exp"),("-5","neg"),("","empty"),("999999999","max"),("0","zero-below-min")]:
            pg.fill("#f-amount",bad)
            if not pg.locator("#f-amount-err").count(): flag(w,"sip",f"no error for {label}")
            if "Check your inputs" not in pg.inner_text("section[aria-label=Results]"): flag(w,"sip",f"results not replaced for {label}")
        pg.fill("#f-years","2.5")
        if "whole number" not in pg.locator("#f-years-err").inner_text(): flag(w,"sip","fractional years accepted")
        pg.get_by_role("button",name="Reset").click()
        pg.fill("#f-amount","10000000"); pg.fill("#f-rate","30"); pg.fill("#f-years","50"); overflow("sip large")
        pg.get_by_role("button",name="Calculate").click()
        if re.search("NaN|Infinity",pg.inner_text("section[aria-label=Results]")): flag(w,"sip","NaN large")
        pg.get_by_role("button",name="Reset").click(); pg.get_by_role("radio",name="Yearly").click()
        if pg.get_by_role("radio",name="Yearly").get_attribute("aria-checked")!="true": flag(w,"sip","radio state")
        # table toggle
        pg.locator("summary",has_text="View the data as a table").click()
        if pg.locator("table tbody tr").count()<5: flag(w,"sip","data table empty")
        # conditional
        pg.goto(B+"/calculators/goal-sip",wait_until="networkidle")
        if pg.locator("#f-inflation").count(): flag(w,"goal-sip","inflation visible")
        pg.locator("[role=radiogroup]").nth(1).get_by_role("radio",name="Yes").click()
        if not pg.locator("#f-inflation").count(): flag(w,"goal-sip","inflation hidden on yes")
        pg.fill("#f-inflation","abc"); 
        if not pg.locator("#f-inflation-err").count(): flag(w,"goal-sip","no validation on shown inflation")
        pg.locator("[role=radiogroup]").nth(1).get_by_role("radio",name="No").click()
        if "Check your inputs" in pg.inner_text("section[aria-label=Results]") or pg.locator("#f-inflation-err").count(): flag(w,"goal-sip","hidden field validated")
        pg.locator("[role=radiogroup]").nth(1).get_by_role("radio",name="Yes").click()
        if pg.input_value("#f-inflation")!="abc": pass
        pg.goto(B+"/calculators/dcf",wait_until="networkidle")
        pg.locator("[role=radiogroup]").first.get_by_role("radio",name="Custom").click()
        if not pg.locator("#f-g1c").count(): flag(w,"dcf","custom missing")
        pg.goto(B+"/calculators/ppf",wait_until="networkidle"); pg.get_by_role("radio",name="Monthly").click()
        if "1,50,000" not in pg.inner_text("section[aria-label=Results]"): flag(w,"ppf","cap message")
        # submit with invalid focuses first invalid field
        pg.goto(B+"/calculators/emi",wait_until="networkidle"); pg.fill("#f-loan","abc"); pg.get_by_role("button",name="Calculate").click()
        if pg.evaluate("document.activeElement.id")!="f-loan": flag(w,"emi","invalid submit focus")
        # refresh + back nav
        pg.goto(B+"/calculators/cagr",wait_until="networkidle"); pg.fill("#f-end","300000"); pg.reload(wait_until="networkidle")
        if pg.input_value("#f-end")!="250000": flag(w,"cagr","state after refresh")
        pg.go_back(); pg.wait_for_load_state('networkidle'); pg.go_forward(); pg.wait_for_load_state('networkidle')
        if w in (390,1440):
            for s in ["sip","dcf","retirement"]:
                pg.goto(B+f"/calculators/{s}",wait_until="networkidle"); pg.wait_for_timeout(1400); pg.screenshot(path=f"/home/claude/qa/n-{s}-{w}.png",full_page=(w==390))
            pg.goto(B+"/",wait_until="networkidle"); pg.screenshot(path=f"/home/claude/qa/n-home-{w}.png",full_page=(w==390))
            pg.goto(B+"/calculators",wait_until="networkidle"); pg.screenshot(path=f"/home/claude/qa/n-cat-{w}.png")
        e=[x for x in errs if "favicon" not in x and "/calculators/nope" not in x and "status of 404" not in x and "_rsc" not in x and not any(("/calculators/"+r) in x for r in REMOVED)]
        if e: flag(w,"console/network",str(e[:3]))
        ctx.close()
    # axe on every route at two widths
    for w in ((390,1280) if MODE=='axe' else ()):
        ctx=br.new_context(viewport={"width":w,"height":900}); pg=ctx.new_page()
        for path in ["/","/calculators"]+[f"/calculators/{s}" for s in slugs]+["/calculators/nope"]:
            pg.goto(B+path,wait_until="networkidle"); pg.wait_for_timeout(300); pg.add_script_tag(content=AX)
            r=pg.evaluate("async()=>(await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']})).violations.map(v=>v.id+'('+v.impact+'):'+v.nodes.length+' '+v.nodes[0].html.slice(0,90))")
            pages+=1
            for v in r: flag(w,"axe "+path,v)
        ctx.close()
    # keyboard-only pass
    if MODE=='ui' and W and W[0]==1280:
        bad=[l for l in sorted(links) if br.new_context().request.get(B+l).status!=200]
        if bad: flag(1280,"dead links",str(bad[:5]))
        ctx=br.new_context(viewport={"width":1280,"height":900}); pg=ctx.new_page(); pg.goto(B+"/calculators/emi",wait_until="networkidle")
        seen=[]
        for _ in range(25):
            pg.keyboard.press("Tab"); seen.append(pg.evaluate("(()=>{const a=document.activeElement;const s=getComputedStyle(a);return (a.id||a.tagName)+'|'+(s.outlineStyle!=='none'||s.boxShadow!=='none'||a.closest('div')?.className.includes('focus-within'))})()"))
        if any(s.endswith("|false") for s in seen[:12]): flag(1280,"keyboard","element without visible focus: "+str([s for s in seen if s.endswith('|false')][:3]))
        ctx.close(); br.close()
    
print("pages visited",pages,"| ISSUES",len(issues)); [print(i) for i in issues[:60]]

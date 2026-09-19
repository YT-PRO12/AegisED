import sys,time,urllib.request
for attempt in range(60):
    try:
        with urllib.request.urlopen(sys.argv[1],timeout=2) as response:
            if response.status==200:break
    except Exception:
        time.sleep(1)
else:raise SystemExit('Service did not become ready: '+sys.argv[1])

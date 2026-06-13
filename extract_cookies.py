import browser_cookie3
import tempfile
import subprocess
import os

try:
    print("Extracting Chrome cookies...")
    cj = browser_cookie3.chrome(domain_name='google.com')
    
    cookies_content = ""
    count = 0
    for cookie in cj:
        if 'notebooklm' in cookie.domain or 'google.com' in cookie.domain:
            domain = cookie.domain
            # Format: domain, include_subdomains, path, https_only, expires, name, value
            flag = "TRUE" if domain.startswith(".") else "FALSE"
            secure = "TRUE" if cookie.secure else "FALSE"
            expires = str(cookie.expires) if cookie.expires else "0"
            line = f"{domain}\t{flag}\t{cookie.path}\t{secure}\t{expires}\t{cookie.name}\t{cookie.value}\n"
            cookies_content += line
            count += 1
            
    if count == 0:
        print("No Google cookies found.")
        exit(1)
        
    print(f"Extracted {count} cookies. Running nlm login...")
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
        f.write(cookies_content)
        cookie_path = f.name
        
    result = subprocess.run(['nlm', 'login', '-m', '-f', cookie_path], capture_output=True, text=True)
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)
    
    os.remove(cookie_path)
    
except Exception as e:
    print("Error:", str(e))

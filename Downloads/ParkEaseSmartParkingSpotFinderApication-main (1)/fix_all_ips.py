import os
import re

old_ips = ["10.96.210.172", "10.67.158.172", "10.38.124.172", "192.168.1.1"] # Common old IPs seen
new_ip = "10.38.124.81"

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        updated = content
        for old in old_ips:
            updated = updated.replace(old, new_ip)
        
        # Also catch generic 10.x.x.x that looks like a backend URL
        # But be careful not to break other things. 
        # Usually it's in a string like "http://10..."
        updated = re.sub(r'http://10\.\d+\.\d+\.\d+', f'http://{new_ip}', updated)

        if updated != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated)
            print(f"Updated: {filepath}")
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

root_dir = r"c:\Users\MAYANK\Downloads\ParkEaseSmartParkingSpotFinderApication-main (1)"

for root, dirs, files in os.walk(root_dir):
    if "node_modules" in root or ".git" in root:
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".json", ".md")):
            fix_file(os.path.join(root, file))

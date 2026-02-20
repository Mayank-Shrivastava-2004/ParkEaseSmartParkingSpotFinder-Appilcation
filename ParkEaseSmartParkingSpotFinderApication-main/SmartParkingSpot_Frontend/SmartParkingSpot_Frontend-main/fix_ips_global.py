import os

old_ip = "10.67.158.172"
new_ip = "10.96.210.87"
root_dir = "c:\\Users\\MAYANK\\Downloads\\ParkEaseSmartParkingSpotFinderApication-main (1)\\ParkEaseSmartParkingSpotFinderApication-main\\SmartParkingSpot_Frontend\\SmartParkingSpot_Frontend-main"

def replace_in_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_ip in content:
            new_content = content.replace(old_ip, new_ip)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
    except Exception as e:
        # Silently ignore binary files or encoding issues
        pass

for root, dirs, files in os.walk(root_dir):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if '.git' in dirs:
        dirs.remove('.git')
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.json', '.md')):
            replace_in_file(os.path.join(root, file))

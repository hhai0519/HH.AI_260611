import os
import glob

base = r'c:\Users\HH.AI_260806\Desktop\HH.AI_260806\skills'
found_files = []
for root, dirs, files in os.walk(base):
    for f in files:
        path = os.path.join(root, f)
        try:
            with open(path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
                if r'C:\Users\HH.AI_260806\Desktop\HH.AI_260806' in content or r'C:/Users/HH.AI_260806/Desktop/HH.AI_260806' in content:
                    found_files.append(path)
        except Exception:
            pass

print("Files with absolute path:", found_files)

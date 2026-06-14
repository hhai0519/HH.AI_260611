import os, json, glob

MANIFEST_PATH = 'Data/00_Skill_Manifest.json'

with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Step 1: Remove ghosts
keys_to_delete = []
for key, value in manifest.items():
    p = value.get('path', '')
    p = os.path.normpath(p)
    if p and not os.path.exists(p):
        keys_to_delete.append(key)

for k in keys_to_delete:
    del manifest[k]

print(f'Deleted {len(keys_to_delete)} ghost entries.')

# Step 2: Add missing files
skill_mds = glob.glob('skills/**/*.md', recursive=True)
skill_mds = [f for f in skill_mds if os.path.basename(f) == 'SKILL.md']

manifest_paths = {os.path.normpath(v.get('path', '')).replace('\\\\', '/'): k for k, v in manifest.items()}

added_count = 0
for md in skill_mds:
    p_normalized = os.path.normpath(md).replace('\\\\', '/')
    # Check if already registered
    is_registered = False
    for mp in manifest_paths:
        if p_normalized.endswith(mp.strip('./')):
            is_registered = True
            break
    
    if not is_registered:
        # Parse YAML frontmatter
        name = os.path.basename(os.path.dirname(md))
        desc = ''
        version = '1.0.0'
        typ = 'skill'
        try:
            with open(md, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            in_frontmatter = False
            for line in lines:
                if line.strip() == '---':
                    if in_frontmatter: break
                    in_frontmatter = True
                    continue
                if in_frontmatter:
                    if line.startswith('name:'): name = line.split(':', 1)[1].strip(' "\'\n')
                    if line.startswith('description:'): desc = line.split(':', 1)[1].strip(' "\'\n')
                    if line.startswith('version:'): version = line.split(':', 1)[1].strip(' "\'\n')
                    if line.startswith('type:'): typ = line.split(':', 1)[1].strip(' "\'\n')
        except Exception as e:
            print(f'Error reading {md}: {e}')
            
        manifest[name] = {
            'description': desc,
            'version': version,
            'type': typ,
            'path': './' + p_normalized,
            'capabilities': {}
        }
        added_count += 1
        print(f'Added {name}')

with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f'Added {added_count} new entries.')

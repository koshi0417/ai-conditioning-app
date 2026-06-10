import re

with open('/Users/takahashihiroshi/VPC/ai-conditioning-app/styles.css', 'r') as f:
    css = f.read()

# Replace typical transparent glass backgrounds
css = re.sub(r'background:\s*rgba\(\d+,\s*\d+,\s*\d+,\s*0\.[0-9]+\);', 'background: var(--bg-primary);', css)
css = re.sub(r'background:\s*#111827;', 'background: var(--bg-primary);', css)
css = re.sub(r'background:\s*#0a0e1a;', 'background: var(--bg-primary);', css)

# Make sure glass-card has bg-primary
css = re.sub(r'background: var\(--bg-card\);', 'background: var(--bg-primary);', css)

# Remove borders everywhere except where explicitly needed (maybe keep them all none for neumorphism)
css = re.sub(r'border:\s*1px\s*solid\s*[^;]+;', 'border: none;', css)

# Loading screen background
css = css.replace('background: rgba(10, 14, 26, 0.92);', 'background: var(--bg-primary);')
css = css.replace('background: rgba(10,14,26,0.9);', 'background: var(--bg-primary);')

# Text color for headers
css = css.replace('color: white;', 'color: var(--text-primary);')
css = css.replace('color: #fff;', 'color: var(--text-primary);')

# Specific fixes
css = css.replace('background: var(--bg-primary); !important;', 'background: var(--bg-primary) !important;')

with open('/Users/takahashihiroshi/VPC/ai-conditioning-app/styles.css', 'w') as f:
    f.write(css)

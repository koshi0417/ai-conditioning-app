import re

def convert_to_neumorphism(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update :root variables
    new_root = """:root {
  --bg-primary: #e0e5ec;
  --bg-secondary: #e0e5ec;
  --bg-card: #e0e5ec;
  --bg-card-hover: #e0e5ec;
  --border-glass: rgba(255,255,255,0.4);
  --border-glass-hover: rgba(255,255,255,0.8);
  --accent-blue: #6c8cff;
  --accent-cyan: #38bdf8;
  --accent-lavender: #a78bfa;
  --accent-pink: #f472b6;
  --accent-green: #34d399;
  --accent-orange: #fb923c;
  --text-primary: #4a5568;
  --text-secondary: #718096;
  --text-muted: #a0aec0;
  --gradient-main: linear-gradient(135deg, #6c8cff 0%, #a78bfa 50%, #38bdf8 100%);
  --gradient-warm: linear-gradient(135deg, #f472b6 0%, #fb923c 100%);
  --gradient-cool: linear-gradient(135deg, #38bdf8 0%, #34d399 100%);
  
  /* Neumorphism Shadows */
  --shadow-out: 9px 9px 16px rgba(163, 177, 198, 0.6), -9px -9px 16px rgba(255, 255, 255, 0.5);
  --shadow-out-sm: 5px 5px 10px rgba(163, 177, 198, 0.6), -5px -5px 10px rgba(255, 255, 255, 0.5);
  --shadow-in: inset 6px 6px 10px rgba(163, 177, 198, 0.6), inset -6px -6px 10px rgba(255, 255, 255, 0.5);
  --shadow-in-sm: inset 3px 3px 6px rgba(163, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.5);
  
  --shadow-glow: var(--shadow-out);
  --shadow-card: var(--shadow-out);
  
  --radius-lg: 20px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}"""
    content = re.sub(r':root\s*\{[^}]+\}', new_root, content)

    # 2. Disable ambient background
    content = re.sub(r'(body::before\s*\{)([^}]+)(\})', r'\1 display: none; \3', content)

    # 3. Modify glass-card
    # Instead of backdrop-filter, just use bg-primary and shadow-out
    content = content.replace('backdrop-filter: blur(12px);', '')
    content = content.replace('-webkit-backdrop-filter: blur(12px);', '')
    
    # 4. Buttons
    # btn-primary: make it popup, and push in on active
    content = re.sub(r'(\.btn-primary\s*\{)([^}]+)(\})',
                     r'\1\2 box-shadow: var(--shadow-out) !important; color: white !important; \3', content)
    content = re.sub(r'(\.btn-primary:active\s*\{)([^}]+)(\})',
                     r'\1 transform: scale(0.98); box-shadow: var(--shadow-in) !important; \3', content)
    
    # btn-secondary
    content = re.sub(r'(\.btn-secondary\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-out-sm) !important; border: none !important; color: var(--accent-blue) !important; \3', content)
    content = re.sub(r'(\.btn-secondary:active\s*\{)([^}]+)(\})',
                     r'\1 transform: scale(0.98); box-shadow: var(--shadow-in-sm) !important; \3', content)

    # 5. Inputs and ranges
    content = re.sub(r'(\.time-input\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-in) !important; border: none !important; color: var(--text-primary) !important; \3', content)
    
    content = re.sub(r'(input\[type="range"\]\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-in-sm) !important; border: none !important; \3', content)

    # preset-btn
    content = re.sub(r'(\.preset-btn\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-out-sm) !important; border: none !important; color: var(--text-secondary) !important; \3', content)
    content = re.sub(r'(\.preset-btn\.active\s*\{)([^}]+)(\})',
                     r'\1\2 box-shadow: var(--shadow-in-sm) !important; color: var(--accent-blue) !important; transform: scale(0.98); \3', content)

    # 6. Bottom Nav
    content = re.sub(r'(\.bottom-nav\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: 0 -5px 15px rgba(163, 177, 198, 0.4) !important; border-top: 1px solid rgba(255,255,255,0.5) !important; backdrop-filter: none !important; \3', content)

    # 7. Loading / Screen backgrounds
    content = content.replace('background: rgba(10, 14, 26, 0.9);', 'background: var(--bg-primary);')
    content = content.replace('background: var(--bg-primary);', 'background: var(--bg-primary);')

    # 8. Chat UI
    content = re.sub(r'(\.chat-window\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-out) !important; border: none !important; backdrop-filter: none !important; \3', content)
    content = re.sub(r'(\.chat-header\s*\{)([^}]+)(\})',
                     r'\1\2 background: transparent !important; box-shadow: var(--shadow-out-sm) !important; \3', content)
    content = re.sub(r'(\.chat-input\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-in-sm) !important; border: none !important; color: var(--text-primary) !important; \3', content)
    content = re.sub(r'(\.chat-msg\.ai\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-out-sm) !important; color: var(--text-primary) !important; \3', content)
    content = re.sub(r'(\.chat-msg\.user\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--accent-blue) !important; box-shadow: var(--shadow-out-sm) !important; color: white !important; \3', content)

    # 9. Icons (change from color to neumorphic out shadow if possible)
    content = re.sub(r'(\.card-icon\s*\{)([^}]+)(\})',
                     r'\1\2 background: var(--bg-primary) !important; box-shadow: var(--shadow-out-sm) !important; border: none !important; \3', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("styles.css has been updated to Neumorphism.")

if __name__ == '__main__':
    convert_to_neumorphism('/Users/takahashihiroshi/VPC/ai-conditioning-app/styles.css')

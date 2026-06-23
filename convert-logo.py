import base64

with open('public/vision-ai-logo.png', 'rb') as f:
    data = f.read()
    b64 = base64.b64encode(data).decode('utf-8')
    
with open('src/assets/visionAiLogoBase64.ts', 'w') as f:
    f.write(f'export const VISION_AI_LOGO_BASE64 = "data:image/png;base64,{b64}";\n')

print("Base64 logo file created successfully!")

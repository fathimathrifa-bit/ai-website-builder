import os
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("CRITICAL ERROR: GEMINI_API_KEY is not configured in your backend .env file!")

client = genai.Client(api_key=API_KEY)

def extract_code_blocks(text):
    html_match = re.search(r'```html(.*?)```', text, re.DOTALL | re.IGNORECASE)
    css_match = re.search(r'```css(.*?)```', text, re.DOTALL | re.IGNORECASE)
    
    html_content = html_match.group(1).strip() if html_match else ""
    css_content = css_match.group(1).strip() if css_match else ""
    
    if not html_content and "<html>" in text.lower():
        html_content = text
        
    return html_content, css_content

@app.route('/api/generate-website', methods=['POST'])
def generate_website():
    try:
        data = request.get_json() or {}
        user_prompt = data.get('prompt', '').strip()
        target_section = data.get('section', None)
        
        if not user_prompt:
            return jsonify({"success": False, "error": "Prompt input field is blank."}), 400
        
        system_instructions = (
            "You are an expert Frontend Engineer and Modern UI/UX Designer.\n"
            "Your task is to generate semantic HTML5 and clean responsive CSS3 structural layouts.\n\n"
            "CRITICAL FORMAT RULES:\n"
            "1. Deliver the code split across code blocks labeled ```html and ```css.\n"
            "2. Write no plain conversational introductions, feedback or summaries before or after code fences.\n"
            "3. Make structures beautiful, using flexible modern UI typography designs.\n"
            "4. Incorporate high-resolution placeholder image URLs using absolute image paths from Unsplash."
        )
        
        if target_section:
            full_prompt = f"{system_instructions}\n\nUpdate layout code. Generate ONLY the modified structural section: '{target_section}' based on request context: {user_prompt}"
        else:
            full_prompt = f"{system_instructions}\n\nGenerate an entire, premium web home landing page layout for: {user_prompt}"

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=full_prompt
        )
        
        html_code, css_code = extract_code_blocks(response.text)
        
        if not html_code and not css_code:
            return jsonify({"success": False, "error": "The AI output format was incorrect. Try adjusting your wording."}), 500

        return jsonify({"success": True, "html": html_code, "css": css_code})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=False)
# Story generation utilities using Open Router
import requests
import os

def generate_story_with_openrouter(prompt, max_tokens=500, temperature=0.7):
    """
    Generate a story using Open Router with free Llama 3.3 70B model.
    """
    # Get Open Router API key from environment variable
    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_api_key:
        raise ValueError("OPENROUTER_API_KEY environment variable not set")
    
    # Prepare the request to Open Router
    headers = {
        "Authorization": f"Bearer {openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("APP_URL", "http://localhost:5000"), 
        "X-Title": "Comic Crafter"
    }
    
    payload = {
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "messages": [
            {"role": "system", "content": "You are a creative storyteller that specializes in generating engaging, imaginative stories for comic books. Your stories should be vivid, detailed, and perfect for adaptation into visual comics."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload
    )
    
    if response.status_code != 200:
        raise Exception(f"Open Router API error: {response.text}")
    
    result = response.json()
    story_text = result['choices'][0]['message']['content'].strip()
    
    return {
        "story": story_text,
        "model_used": "meta-llama/llama-3.3-70b-instruct:free",
        "tokens_used": result.get('usage', {}).get('total_tokens', 0)
    }

def test_story_generation():
    """
    Test the story generation functionality.
    """
    try:
        result = generate_story_with_openrouter(
            "Write a short superhero story about a character who gains the power to control shadows.",
            max_tokens=300
        )
        print("Story generated successfully!")
        print(f"Model used: {result['model_used']}")
        print(f"Tokens used: {result['tokens_used']}")
        print("Story:")
        print(result['story'])
        return True
    except Exception as e:
        print(f"Error generating story: {e}")
        return False

if __name__ == "__main__":
    print("Testing Open Router story generation...")
    test_story_generation()
import requests
import json
import os

def test_story_generation():
    """
    Test the story generation endpoint with sample data.
    """
    # Set your Open Router API key here for testing
    api_key = os.getenv("OPENROUTER_API_KEY", "YOUR_API_KEY_HERE")
    
    if api_key == "YOUR_API_KEY_HERE":
        print("Please set your OPENROUTER_API_KEY environment variable")
        return
    
    # URL for the story generation endpoint
    url = "http://localhost:5000/story/generate"
    
    # Sample prompt for story generation
    data = {
        "prompt": "Write a short superhero story about a character who gains the power to control shadows.",
        "max_tokens": 300,
        "temperature": 0.7
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, data=json.dumps(data), headers=headers)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Story generated successfully!")
            print(f"Model used: {result['model_used']}")
            print(f"Tokens used: {result['tokens_used']}")
            print("Story:")
            print(result['story'])
        else:
            print(f"❌ Error generating story: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the server. Make sure it's running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error during story generation: {e}")

if __name__ == "__main__":
    print("Testing story generation endpoint...")
    test_story_generation()
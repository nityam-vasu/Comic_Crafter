import requests
import json
import os

def test_api_endpoints():
    """Test script to verify the API endpoints are working."""
    base_url = "http://localhost:5000"
    
    print("Testing Comic Crafter Local API endpoints...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health check: {health_data['status']}")
            print(f"   Model loaded: {health_data['model_loaded']}")
            print(f"   LORA loaded: {health_data['lora_loaded']}")
            print(f"   Story generation enabled: {health_data['story_generation_enabled']}")
        else:
            print(f"❌ Health check failed with status {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure the server is running at http://localhost:5000")
        return
    except Exception as e:
        print(f"❌ Error during health check: {e}")
        return
    
    # Test story generation if API key is available
    if os.getenv('OPENROUTER_API_KEY'):
        print("\nTesting story generation...")
        try:
            story_payload = {
                "prompt": "Write a short superhero story about a character who gains the power to control shadows.",
                "max_tokens": 200,
                "temperature": 0.7
            }
            
            response = requests.post(
                f"{base_url}/story/generate",
                headers={"Content-Type": "application/json"},
                data=json.dumps(story_payload)
            )
            
            if response.status_code == 200:
                story_data = response.json()
                print(f"✅ Story generated using: {story_data['model_used']}")
                print(f"   Tokens used: {story_data['tokens_used']}")
                print(f"   Story preview: {story_data['story'][:100]}...")
            else:
                print(f"❌ Story generation failed with status {response.status_code}")
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"❌ Error during story generation test: {e}")
    else:
        print("\n⚠️  Skipping story generation test - OPENROUTER_API_KEY not set")
        print("   Set OPENROUTER_API_KEY environment variable to test story generation")
    
    # Test models endpoint
    try:
        response = requests.get(f"{base_url}/sdapi/v1/sd-models")
        if response.status_code == 200:
            models_data = response.json()
            print(f"\n✅ Models endpoint: {len(models_data)} model(s) available")
            for model in models_data:
                print(f"   - {model['title']}")
        else:
            print(f"❌ Models endpoint failed with status {response.status_code}")
    except Exception as e:
        print(f"❌ Error during models endpoint test: {e}")
    
    print("\nAPI testing complete!")

if __name__ == "__main__":
    test_api_endpoints()

import random

def get_response(message):
    # Initialize mood if not set
    mood = "neutral"  # In a real app, you'd get this from storage
    
    # Basic responses based on mood
    responses = {
        "neutral": {
            "greeting": ["Hello!", "Hi there!", "Welcome to the District."],
            "default": ["I'm here to help.", "What can I do for you?", "Let me know what you need."]
        },
        "flirty": {
            "greeting": ["Hey there~", "Well hello...", "Nice to see you here"],
            "default": ["Tell me more...", "I like where this is going", "You have my attention"]
        },
        "cold": {
            "greeting": ["State your purpose.", "Connection established.", "Proceed."],
            "default": ["Noted.", "Continue.", "Processing."]
        },
        "sarcastic": {
            "greeting": ["Oh great, another visitor.", "What a surprise.", "This should be interesting."],
            "default": ["Really?", "How fascinating.", "Is that so?"]
        },
        "serious": {
            "greeting": ["Connection secure.", "Channel open.", "Link established."],
            "default": ["Understood.", "Proceeding.", "Acknowledged."]
        }
    }

    # Simple message processing
    message = message.lower()
    
    # Check for greetings
    if any(word in message for word in ['hello', 'hi', 'hey', 'greetings']):
        return random.choice(responses[mood]["greeting"])
        
    # Default response if no other matches
    return random.choice(responses[mood]["default"])

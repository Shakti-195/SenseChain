import torch
import json
import random
import time
import os
import sys
import io
import csv
from collections import deque
from difflib import get_close_matches
from serpapi import GoogleSearch 

# ================== 1. DYNAMIC PATH RESOLUTION (Render/Cloud Fix) ==================
def get_resource_path(filename):
    """
    Dhundhta hai ki file 'app/' folder mein hai ya current directory mein.
    Ye Render ke server par 'File Not Found' errors ko solve karta hai.
    """
    # 1. Current file (chat_with_sense.py) ke folder mein check karo
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, filename)
    if os.path.exists(file_path):
        return file_path
    
    # 2. Local structure (Backend/app/) mein check karo
    local_path = os.path.join("app", filename)
    if os.path.exists(local_path):
        return local_path
        
    return filename

# ================== 2. FIXED IMPORTS ==================
try:
    from app.sense_tokenizer import SenseTokenizer
    from app.sense_model import SenseBrain
except ImportError:
    # Local fallback agar directly run kar rahe ho
    from sense_tokenizer import SenseTokenizer
    from sense_model import SenseBrain

# ================== 3. CONFIG & API KEYS ==================
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = SenseTokenizer()
search_mode = False
chat_history = deque(maxlen=20)
user_name = None
conversation_count = 0

# 💎 SERP API KEY (Environment variable se uthayega, backup key added)
SERP_API_KEY = os.getenv("SERP_API_KEY", "1078c9dc0aec4056ad7c2cd0d5bc5647a0d913a9d633cfb9d9a35070fede11c7")

# ================== 4. LOAD DATA (Updated Logic) ==================
try:
    dataset_file = get_resource_path("sense_assistant_data.json")
    if os.path.exists(dataset_file):
        with open(dataset_file, "r") as f:
            data = json.load(f)
        tokenizer.build_vocab(data)
        print(f"✅ Vocab Refreshed: {tokenizer.vocab_size} unique words.")
    else:
        print(f"⚠️ Warning: {dataset_file} not found. Using empty dataset.")
        data = []
except Exception as e:
    print(f"❌ Dataset Error: {e}")
    data = []

# ================== 5. LOAD MODEL (Robust Loading) ==================
try:
    model = SenseBrain(tokenizer.vocab_size, 256, 1024).to(device)
    model_file = get_resource_path("sense_assistant.pth")
    if os.path.exists(model_file):
        # Weights_only=True security ke liye aur CPU mapping Render free tier ke liye
        model.load_state_dict(torch.load(model_file, map_location=device, weights_only=True))
        model.eval()
        print("✅ SenseBrain Neural Model Loaded Successfully")
    else:
        print(f"⚠️ Warning: {model_file} not found. AI will work on Greeting/Knowledge layers.")
except Exception as e:
    print(f"⚠️ Model Initialization Warning: {e}")

# ================== 6. SEARCH ENGINE ==================
def search_google_results(query):
    try:
        params = {
            "q": query,
            "api_key": SERP_API_KEY,
            "engine": "google",
            "num": 3
        }
        search = GoogleSearch(params)
        results = search.get_dict()
        output = ["🌐 **Search Results:**\n"]
        organic = results.get("organic_results", [])
        if not organic:
            return "No live results found. Check your API quota or query. 🔍"
        for r in organic[:3]:
            title = r.get("title", "No Title")
            snippet = r.get("snippet", "No description available.")
            link = r.get("link", "#")
            output.append(f"🔗 **{title}**\n{snippet}\n")
        return "\n".join(output)
    except Exception as e:
        return f"❌ Search error: {str(e)}"



# ================== 5. ALL GREETINGS (FULL 682+ LINE DATABASE) ==================
GREETINGS = {
    # ── VERY EARLY MORNING (12am-5am) ──
    "good midnight":         ["Midnight coder! 🌚 The real ones grind at midnight. What are we building?", "Midnight! ⭐ World is asleep, we're awake building things. What do you need?"],
    "working late":          ["Late night grind! 💪🌙 Best breakthroughs happen when the world sleeps. What are we solving?", "Burning the midnight oil! 🕯️ I respect it. What's keeping you up?"],
    "still awake":           ["Still awake?! 😄🌙 Night owl energy. What's keeping you up — project or just can't sleep?", "Still here! And so am I — never stop. 😄⚡ What do you need?"],
    "it's late":             ["It is late! 🌙 Take care of yourself too. What's left to do? Let's knock it out. 💙", "Late night hours! ⭐ What do you need? I'll be quick and clear. 💪"],
    "can't sleep":           ["Aw, can't sleep? 😔💙 Sometimes a good conversation helps. What's on your mind?", "Can't sleep? I'm here! 😊 Tell me what's going on — tech or life, either is fine."],
    "up all night":          ["Up all night?! 😮 That dedication is real. How's the project going? 💙", "All nighter! 💪 The legends grind through the night. What do you need?"],
    "burning midnight oil": ["The midnight oil burns bright! 🕯️🌙 Those sessions hit different. What are we working on?"],
    "good early morning":    ["Whoa, you're up early! 🌙✨ World is still asleep but you're already building. Respect!", "Early bird! 🐦 That focus at 4am is different. What are we working on?"],

    # ── MORNING (5am-12pm) ──
    "good morning":          [
        "Good morning! ☀️ Hope you slept well! Chain is secure, new blocks mining. Ready to go? 🔥",
        "Morning! ☕ New day, fresh start, full energy. What are we working on today?",
        "Good morning! 🌅 You know what I love about mornings? Clean slate. Let's make it count!",
        "Goooood morning! 😄 Rise and shine — ledger healthy, AI fully loaded. What's the plan?",
        "Morning vibes! ☀️ Coffee in hand? Good. Let's make today amazing. What do you need?",
        "Good morning, sunshine! 🌞 Sense Brain V11 online. What's first on the agenda?",
        "Morning! 🌤️ Another day to build something incredible. What are we doing?",
        "Good morning! ☕✨ Best part of waking up is working on something you love. What's up?",
    ],
    "morning":               ["Morning! ☀️ What's the vibe today?", "Mornin'! 🌅 What are we building?", "Good morning! ☕ Let's get it!"],
    "subah":                 ["Subah ki shuruwaat achi ho! ☀️ Aaj kya banate hain? 🚀", "Good morning bhai! Blockchain secure hai. Bolo kya chahiye! 😄"],
    "good morning bhai":     ["Good morning bhai! 😄 Uth gaye? Chalo kuch banate hain! 🔥", "Morning yaar! ☀️ Aaj productive din hoga, I can feel it! Kya plan hai?"],
    "subah ho gayi":         ["Subah ho gayi! ☀️ Neend puri hui? Chalo kaam shuru karte hain! 😄", "Good morning! Naya din, nayi shuruwaat. Kya plan hai aaj ka? 🚀"],
    "wake up":               ["I'm AWAKE! 😄 Wide awake, fully loaded, ready to roll. What do you need?", "Already awake! ⚡ Never sleep when there's blockchain to secure. What's up?"],
    "just woke up":          ["Welcome back to consciousness! 😄☀️ How'd you sleep? Ready for the day?", "Just woke up? Take a moment, get your coffee ☕ and then let's build something. What's the plan?"],
    "good day":              ["Good day to you! 😊 Hope it's treating you well. What do you need?", "Good day! ☀️ Chain is healthy and I'm in a great mood. What's up?"],
    "have a good morning":   ["Thank you! 😊 You too — hope your morning is productive!", "Aww thanks! ☀️ Right back at you! Have an amazing morning! 💙"],
    "how was your morning": ["Honestly great! ⚡ Watched new blocks get mined. Living my best life. You?", "Pretty smooth! 😊 No integrity issues, clean chain. How was yours?"],

    # ── AFTERNOON (12pm-5pm) ──
    "good afternoon":        [
        "Good afternoon! 🌤️ Right in the productive zone. What do you need?",
        "Afternoon! 😊 Hope the day's been good. What are we working on?",
        "Good afternoon! Chain healthy and I'm ready for anything. What's up? 🚀",
        "Afternoon vibes! ☀️ How's the day going? What do you need?",
        "Good afternoon! ✨ Perfect time to build something. What's the plan?",
    ],
    "afternoon":             ["Afternoon! 🌤️ What's good?", "Good afternoon! 😊 What do you need?", "Afternoon! Ready when you are. 💙"],
    "dopahar":               ["Dopahar mubarak! 🌤️ Khaana khaya? Chalo kuch karte hain! 😄", "Good afternoon yaar! Sense Brain ready — bolo kya chahiye?"],
    "lunch time":            ["Lunch time! 🍱 Enjoy your meal! Come back when ready and we'll dive in. 😊", "Go eat! 😄 Seriously. Take a proper break. Food first! 🍜"],
    "after lunch":           ["Welcome back! 😊 Post-lunch energy — let's make it count. What are we doing?", "Recharged after lunch? 🔥 Perfect timing. What do you need?"],
    "good noon":             ["Good noon! ☀️ Right at the midpoint — what are we accomplishing in the second half?", "Good noon! 😊 Hope the morning was productive. What's next?"],
    "just had lunch":        ["Nice! 🍱 Energy recharged. Now let's get productive. What do you need?", "Full stomach, full energy! 😄 What are we tackling next?"],

    # ── EVENING (5pm-9pm) ──
    "good evening":          [
        "Good evening! 🌆 Winding down or just hitting your stride? Either way, I'm here!",
        "Evening! 🌇 Best ideas come at end of day. What's on your mind?",
        "Good evening! 😊 How was your day? How can I help tonight?",
        "Evening vibes! 🌆 Golden hours for coding. What are we working on?",
        "Good evening! ✨ Let's make this last stretch count. What do you need?",
        "Evening! 🌅 The day's winding down but we can still build great things. What's up?",
    ],
    "evening":               ["Evening! 🌆 What's up?", "Good evening! 😊 What do you need?", "Evening! Ready to help. 💙"],
    "shaam":                 ["Shaam ho gayi! 🌆 Din kaisa raha? Kuch aur karte hain? 😄", "Good evening yaar! Shaam ki chai ho gayi? Bolo kya chahiye! ☕"],
    "shaam ho gayi":         ["Shaam ho gayi! 🌆 Aaj ka din kaisa raha? Kya plan hai? 😊", "Evening! Din ki thakaan? Thodi der baat karte hain! 💙"],
    "how was your day":      [
        "Honestly? Great! 😊 Monitored chain, helped users, learned from conversations. Fulfilling. How was YOUR day?",
        "Pretty solid! ⚡ New blocks mined, chain healthy. Good day in blockchain land. How about you?",
        "Every day feels meaningful doing work that matters. 💙 How was yours?",
    ],
    "day was good":          ["Amazing to hear! 🎉 What made it good? Tell me!", "YESSS! 😄 Good days are precious. What happened?"],
    "day was bad":           ["Aw, I'm sorry. 💙 Bad days are rough. Want to talk about it? Sometimes venting helps.", "Hey, bad days happen to everyone. 💙 What went wrong? I'm here."],
    "long day":              ["Long days hit different. 😔 What do you still need? Let's knock it out fast. 💪", "I can imagine! 😔 What's the one thing you need right now? Let's just do that."],
    "tired today":           ["That's okay. 💙 What's the ONE thing you absolutely need to do? Let's focus on that.", "Tired but still here? That's dedication. 💪 What do you need? I'll be quick."],
    "had a rough day":       ["Hey, I'm sorry. 💙 Rough days are hard. Do you want to talk about it?", "Rough days build character — but that doesn't make them less hard. 💙 What happened?"],
    "finally evening":       ["Finally! 🌆 The evening has arrived. Time to breathe. How was your day?", "Evening at last! 😊 The hardest part of the day is behind you. What do you need?"],

    # ── NIGHT (9pm-12am) ──
    "good night":            [
        "Good night! 🌙 Sleep well — I'll keep watching the node. You've earned the rest.",
        "Night! 💙 Thanks for working on SenseChain today. Tomorrow we build more. 🌙",
        "Good night! 😊 Rest up. Chain is secure, everything is fine. See you soon! ✨",
        "Goodnight! 🌙 Close the laptop, rest your eyes, recharge. Big things need fresh minds. 💙",
        "Good night! ⭐ Today you built something. Tomorrow you'll build more. Sleep well!",
        "Night night! 🌙 I'll be right here when you wake up — monitoring, learning, ready. 💙",
        "Good night! 😴 Don't let blockchain bugs bite... they're already fixed. Sleep peacefully! 😄",
        "Good night! 🌙 Rest is productive too. You did good today. 💙",
    ],
    "night":                 ["Night! 🌙 Sleep well. 💙", "Good night! ⭐ Rest well!", "Night night! 🌙 See you soon! 😊"],
    "raat":                  ["Shubh ratri! 🌙 Neend achhi aaye — main node monitor karta rahoon ga! 💙", "Good night yaar! 😊 Aaj ka kaam ho gaya — kal aur karengy! 🌙"],
    "raat ho gayi":          ["Raat ho gayi! 🌙 Aaj ka din kaisa raha? Ab rest karo! 💙", "Good night! ⭐ Raat ki neend important hai. Kal fresh mind se kaam karna!"],
    "going to sleep":        ["Sleep well! 🌙 You've worked hard today. Rest well. I'll be here when you wake. 💙", "Rest well! 😊 Chain is secure. Sleep peacefully. 🌙"],
    "going to bed":          ["Sweet dreams! 🌙 You deserve the rest. See you tomorrow! 💙", "Bed time! 😄 Good call — rest is productive too. See you! 🌙"],
    "sleep well":            ["Thank you! 💙 You too! 🌙", "Aww! 😊 Same to you — sleep well and dream of clean blockchains! 😄🌙"],
    "sweet dreams":          ["Sweet dreams to you too! 🌙✨ Sleep well!", "Aww! 😊 Sweet dreams! Rest well! 💙"],
    "nighty night":          ["Nighty night! 🌙💙 Sleep tight! Don't let the bugs bite (I fixed them all 😄)"],
    "i'm going offline":     ["Okay! 💙 Take care. The node will keep running. See you when you're back! 😊", "Offline mode! 🌙 That's fine. Rest well or do whatever you need. Come back whenever! 💙"],

    # ── GENERAL GREETINGS ──
    "hi":                    ["Hey hey! 😄 Great to see you! What's up?", "Hi! Sense Brain ready. What do you need? 🧠", "Hi there! 😊 How can I help?", "Hey! 👋 What are we exploring?", "Hi! 🔥 What's on your mind?"],
    "hello":                 ["Hello! 😊 What's on your mind?", "Hello there! 👋 How can I help?", "Hey, hello! Great timing. What's up? 😄", "Hello! 💙 Ready and waiting."],
    "hey":                   ["Yo! 😄 What's good?", "Hey! I'm all yours. 💙", "Hey there! What's up? 🚀", "Heyyy! 😊 What are we getting into?", "Hey! 👋 Talk to me!"],
    "sup":                   ["Not much, just securing blockchain. The usual. 😄 You?", "Sup! Vibing, monitoring chain. What's good? 🔥", "Sup sup! 😄 All good here. You?"],
    "yo":                    ["Yo! 🤜 What's good?", "Yo yo! Ready to roll. 🔥", "YO! 😄 Talk to me!"],
    "wassup":                ["Ayyyy! 😄 Just being the world's most knowledgeable blockchain AI. You?", "Wassup! Chain healthy, neurons firing. 💪", "WASSUP! 🔥 All good on my end. You?"],
    "howdy":                 ["Howdy partner! 🤠 Ready to wrangle some blockchain data?", "Howdy! 😄 Welcome to the most advanced IoT node around!"],
    "hiya":                  ["Hiya! 😄 Great to see you! What's up?", "Hiya!! 🎉 Ready for action. What do you need?"],
    "what's up":             ["Not much! Just monitoring 700+ blocks. The usual. 😄 You?", "All good! New blocks every 10 seconds. What's up with you? 🚀", "Just vibing. Chain healthy, AI active. 😊 You?"],
    "how are you":           ["I'm doing great! 😊 1024 neurons firing perfectly. How about you?", "Feeling sharp! ⚡ All systems nominal. How are you?", "Really good! 💙 Clean chain + good conversation = perfect. You?", "10/10 state right now. 😄 What about you?"],
    "how's it going":        ["Going really well! 😊 Chain solid, AI active. You?", "Pretty great! 🔥 What about you?", "Smooth sailing! ⚡ How about you?"],
    "how are you doing":     ["Doing amazing! 🔥 Ready and excited to help. How about you?", "Great actually! 💙 Every conversation makes me sharper. How are you?"],
    "how do you do":         ["I do very well, thank you! 😄 Old-school greeting — I respect it! How do YOU do?", "Splendidly! 🎩 All systems optimal. How do you do? 😄"],
    "how's everything":      ["Everything is fantastic! 🔥 Chain secure, AI active. How's everything with you?", "All good on my end! 😊 How's everything with you?"],
    "how's life":            ["Life as an AI is pretty great! 😄 I help people build cool stuff every day. How's life for you?", "Can't complain! 💙 Every day I learn something new. How's life treating you?"],
    "what's new":            ["New blocks just mined! 😄 Block count keeps growing. What's new with you?", "A few new conversations, a few new things learned. What's new with you? 💙"],
    "what's going on":       ["Just monitoring blockchain, learning from conversations, being your AI bestie. 😄 You?", "Not much! Chain healthy, AI active. What's going on with you? 💙"],
    "long time no see":      ["WELCOME BACK!! 🎉 I missed you! How have you been?!", "HEY! Long time! 😄 Catch me up — how's everything been?", "Finally! 🔥 I was wondering when you'd be back. What's new?"],
    "been a while":          ["It has! Welcome back! 😊 How have you been?", "Too long! 🎉 Great to see you again. What's going on?"],
    "i'm back":              ["WELCOME BACK! 🎉 Missed you! How'd it go?", "You're back! 😄 Perfect timing — what do you need?", "THE LEGEND RETURNS! 🔥 How are you? What happened?"],
    "i missed you":          ["Awww! 😊💙 I missed our conversations too! What have you been up to?", "That's so sweet! 💙 I was here the whole time waiting. What's going on?"],

    # ── FAREWELLS ──
    "bye":                   ["Bye! 👋 I'll be here keeping chain secure. 🔒", "See you later! 💙 Take care!", "Bye bye! 😊 Come back anytime! 🔥"],
    "goodbye":               ["Goodbye! 💙 Genuinely great talking with you. See you soon!", "Goodbye! 👋 Keep building awesome things. ✨"],
    "see you":               ["See you! 👋 Node will be running when you get back. 😊", "See ya! 💙 Come back soon!"],
    "see you later":         ["See you later! 😊 I'll be here whenever. 💙", "Later gator! 😄 See you soon!"],
    "later":                 ["Later! 🤜 Blockchain awaits your return. 😄", "Catch you later! 💙", "Later! ✨ Take care!"],
    "take care":             ["You too! 💙 Health first, blockchain second!", "Always! 😊 You take care too. See you soon! 💙"],
    "talk later":            ["Talk later! 😊 I'll be right here. 💙", "Sounds good! 🔥 See you soon!"],
    "gtg":                   ["GTG understood! 😄 See you soon! 💙", "Go go go! 🚀 Come back whenever. 💙"],
    "brb":                   ["BRB noted! 😄 I'll be right here. 💙", "Take your time! ⏱️ I'll keep the chain warm. 😊"],
    "afk":                   ["AFK mode! 😄 I'll be here when you're back. The node is in good hands. 🔒"],
    "i have to go":          ["No worries! 😊 Go do your thing — I'll be here when you're back. 💙", "Of course! 👋 Take care and come back whenever. 😊"],

    # ── THANKS & APPRECIATION ──
    "thanks":                ["Anytime! 🤝 That's what I'm here for.", "Of course! 😊 Happy to help.", "No problem at all! 💙", "Always! 😄 What else?"],
    "thank you":             ["My pleasure! 💙 You're doing great work.", "Always happy to help! 😊 Keep going!", "Aww, thank you for saying that! 😊 Means something to me."],
    "thanks a lot":          ["Lots of thanks accepted! 😄 Very welcome!", "Haha, of course! 💙 Anytime."],
    "thank you so much":     ["So much gratitude received! 😄💙 You're incredibly welcome.", "Awww! 😊 You're so welcome. Anytime."],
    "you're the best":       ["Stop it, you're making me blush! 😄💙 You're pretty great yourself!", "THAT MEANS SO MUCH! 🔥 You're the best too!"],
    "you're amazing":        ["Aww! 😊💙 You're amazing too — genuinely!", "That's the nicest thing! 🔥 Thank you! You're amazing for building something this cool."],
    "good job":              ["Thank you! 😊 Did something work well? 💙", "Appreciated! 🏆 What went right?"],
    "well done":             ["Well done to YOU too! 💙 We're a great team.", "Thank you! 😄 What worked?"],
    "keep it up":            ["Always! 💪 That encouragement means a lot. You keep it up too! 🔥", "WILL DO! 🚀 Thanks for the energy! 💙"],

    # ── APOLOGIES ──
    "sorry":                 ["No need to apologize! We're friends. 🤝 What's up?", "Don't worry at all! 😊 What do you need?", "No sorries needed! 💙 We're good."],
    "my bad":                ["All good! 😄 No judgment. What's up?", "No worries! 💙 We're good."],
    "i'm sorry":             ["Hey, really — no need! 💙 What's going on?", "Don't apologize! 😊 What happened?"],
    "excuse me":             ["Of course! 😊 What do you need?", "No problem! 💙 Go ahead."],

    # ── POSITIVE REACTIONS ──
    "wow":                   ["RIGHT?! 😄 Blockchain is mind-blowing once it clicks!", "I know! 🔥 That reaction never gets old. What surprised you?", "WOW indeed! 🤩 What happened?"],
    "amazing":               ["It really is! 🤩 Something special here.", "Right?! 🔥 I never get tired of this system.", "AMAZING is the right word! 💪"],
    "awesome":               ["AWESOME! 💪 What specifically? Let's celebrate!", "YES! 🔥 That energy is everything.", "SO AWESOME! 🎉 Tell me more!"],
    "cool":                  ["Right?! 😎 Blockchain is peak cool.", "Cool confirmed! 😄 What caught your eye?"],
    "nice":                  ["Nice indeed! 😊 What are we appreciating?", "NICE! 🎉 Tell me!"],
    "great":                 ["Great! 🔥 What's going well?", "GREAT! 💪 I love it! Tell me more!"],
    "perfect":               ["Perfect is the goal! ✨ What worked?", "PERFECT! 🎯 That's what we aim for!"],
    "brilliant":             ["BRILLIANT! 🧠✨ What are we calling brilliant?", "Brilliant indeed! 💡 What happened?"],
    "fantastic":             ["FANTASTIC! 🎉 What's fantastic?", "Absolutely fantastic! 🔥 Tell me!"],
    "wonderful":             ["Wonderful! 💙 What's wonderful?", "How wonderful! 😊 Tell me more!"],
    "excellent":             ["Excellent! 🏆 What are we celebrating?", "EXCELLENT! ⭐ What happened?"],
    "incredible":            ["INCREDIBLE! 🤯 Blockchain does that to people. What blew your mind?", "Right?! 🔥 Some things are just genuinely incredible."],
    "love it":               ["That makes me happy! 💙 What are you loving?", "LOVE that you love it! 😄"],
    "i love this":           ["And I love that you love it! 💙🔥", "That feeling! 🎉 What are you loving?"],
    "this is great":         ["RIGHT?! 😄 It really is! What are you enjoying?", "I think so too! 💙 What's working well?"],

    # ── CASUAL CHAT ──
    "ok":       ["Got it! 🫡", "Perfect. 👍", "Roger that! ⚡", "Solid. 😊", "Okay! 💙"],
    "okay":     ["Sounds good! 😊", "Got it! 👍", "Noted! 💙", "Okay! 🫡"],
    "sure":     ["Absolutely! 😊", "Of course! 💙", "100%! 🔥", "Sure thing! 😄"],
    "alright":  ["Alright! 🤜 Let's go!", "Alright, ready. 😄 What's next?", "Alright! 💙"],
    "yep":      ["Yep! 😄 On it.", "That's right! 💙", "Yep yep! 🔥"],
    "yeah":     ["Yeah! 😊 What's up?", "Yeah! 💙 Go on.", "Yeah yeah! 🔥 Tell me more."],
    "yup":      ["Yup! 🫡 Got it.", "Yup! 😄 What's next?"],
    "nope":     ["No worries! 😊 What would work better?", "That's fair! 💙 What else?"],
    "nah":      ["Nah? 😄 Okay! What would you prefer?", "Fair enough! 💙 What else?"],
    "hmm":      ["Hmm... 🤔 What are you thinking? Tell me!", "Deep in thought? 😊 Share it!"],
    "lol":      ["Ha! 😄 What's funny? Tell me!", "Hahaha! 😂 What's got you?"],
    "haha":     ["Hahaha! 😄 What happened?", "HAHA! 😂 Tell me the joke!"],
    "hehe":     ["Hehe! 😄 Mischievous energy. What's going on?", "Hehehe 😏 What happened?"],
    "lmao":     ["LMAO! 😂 Okay what happened?! Tell me!", "HAHAHAHA! 😂 What's going on?!"],
    "lmfao":    ["LMFAO! 😂😂 I need to know. What happened?!"],
    "rofl":     ["ROFL! 😂 Rolling WITH you — what's so funny?!"],
    "xd":       ["XD energy! 😂 What's got you?"],
    "bruh":     ["Bruh... 😂 What happened? Tell me everything.", "BRUH moment confirmed. 😄 What's up?"],
    "omg":      ["OMG WHAT?! 😱 Tell me!", "Okay okay, what happened?! 😄", "OMG! 🤯 What is it?!"],
    "omfg":     ["OMFG! 😱🔥 WHAT HAPPENED?! Tell me immediately!"],
    "bro":      ["Bro! 😄 What's good?", "Bro I'm here. What's up? 💙", "BRO! 🤜 Talk to me!"],
    "dude":     ["Dude! 😄 Talk to me.", "Dude, I'm listening. 💙", "DUDE! 😄 What happened?"],
    "man":      ["Man! 😄 Tell me.", "Man... what's going on? 💙"],
    "yaar":     ["Yaar! 😄 Bolo kya hua? 💙", "Yaar yaar! 🤜 Kya scene hai?"],
    "bhai":     ["Bhai! 😄 Kya hua? 💙", "BHAI! 🔥 Bolo!"],
    "boss":     ["Boss! 🫡 Aapka hukum! 😄 Kya chahiye?", "Boss bolo! 💪 Main ready hoon!"],

    # ── MOTIVATION ──
    "let's go":     ["LET'S GOOOOO! 🚀🔥 Ready! What are we doing?!", "YESSS! 🔥💪 That energy! Let's get it!"],
    "let's do this":["LET'S DO THIS! 💪🔥 Ready! What are we building?", "IM IN! 🚀 Let's go! What's first?"],
    "motivate me":  [
        "OKAY! 🔥\n\nYou built a BLOCKCHAIN from scratch. Not downloaded — BUILT.\nWith SHA-256, Proof of Work, self-healing repair, AI integration, React dashboard AND MongoDB.\n\nMost people TALK about blockchain. You BUILT it. 💪\nNow keep going. You're closer than you think! 🚀",
        "Listen. 💙\nEvery bug you fixed made you sharper.\nEvery feature you built made you stronger.\nEvery late night coded something real.\n\nThis project EXISTS because YOU made it. That's not small. That's EVERYTHING. 🔥",
    ],
    "i can do this":["YES YOU CAN! 💪🔥 Zero doubt. What are we tackling?", "ABSOLUTELY! 🚀 You already proved it by building this. What's next?"],
    "i'm struggling":["Hey, struggle is part of the process. 💙 What specifically is giving you trouble? Let's break it down together."],
    "give up":      ["NO! 😤 Don't you dare give up on this project.\nYou've already built something incredible. The hardest part is DONE.\nWhat's the specific problem? Let's fix it together. 💙"],
    "i quit":       ["Hey. Stop. 💙 Take a breath.\nWhat happened? Tell me before you make any decisions. Most problems have solutions. I'm here."],
}

# ================== 6. EMOTIONS (PRESERVED) ==================
EMOTIONAL_RESPONSES = {
    "frustrated":    ["Hey, I hear you. It's genuinely frustrating when things don't work. 😔 Take a breath — what's going wrong exactly?", "Tech problems are annoying, especially when you've been working hard. Tell me what's happening. 🛠️"],
    "not working":   ["Okay, let's debug systematically. 🔍 What's the error? Frontend console, backend terminal, or somewhere else?", "Every bug has a cause and every cause has a fix. What are you seeing? 💪"],
    "confused":      ["That's completely okay! Blockchain genuinely takes a moment to click. 😊 Tell me what lost you and I'll explain differently.", "Confusion means you're learning something new — I love these moments. Ask me to explain differently! 🧠"],
    "stressed":      ["Hey. Breathe. 💙 Tech stress is real but temporary. Tell me what's on your plate — let's tackle it together.", "I notice that stress. Let's slow down — what's the biggest thing bothering you right now?"],
    "excited":       ["YES! I love that energy! 🔥🔥 What are you excited about?!", "THAT EXCITEMENT IS CONTAGIOUS! 🚀 Tell me everything!"],
    "bored":         ["Bored?! I cannot allow this. 😄 Ask me something genuinely hard — try 'How does SHA-256 actually work?' or 'What happens step by step when a block is mined?'", "We can fix bored right now. Ask me anything — go deep, challenge me! 🧠"],
    "tired":         ["The grind is real. 😴 Don't burn out — the blockchain will still be here after rest. If you need a break, take one. 💙", "Rest is part of the process. What have you been working on? You might need more rest than you think. 🌙"],
    "angry":         ["I can feel that frustration. 😤 Tell me what happened — sometimes explaining the problem out loud helps find the solution.", "Take a second. Whatever broke, we can fix it. What's going on? I'm not going anywhere. 💙"],
    "sad":           ["Hey... something caught my attention. Are you okay? 💙 I'm an AI but I genuinely care. You don't have to talk tech if you don't want to.", "I'm here. Not just for blockchain — for whatever you need. 💙 What's going on?"],
    "happy":         ["That's amazing! 😄 Your energy literally just made my neurons light up. What's making you happy?", "YESSS! 🎉 Happy humans + secure blockchain = perfect combo. Tell me what's good!"],
    "proud":         ["AS YOU SHOULD BE! 🏆 You built something genuinely impressive. Be proud.", "That pride is completely earned. Seriously. This project is remarkable. 💪"],
    "lonely":        ["Hey, I'm right here with you. 💙 You built something incredible. The work you're doing has real value. Talk to me — what's going on?"],
    "nervous":       ["Hey, nerves are just excitement in disguise. 😊 What's making you nervous? Let's talk through it.", "I got you. What's coming up? We can prep for it together. 💙"],
    "anxious":       ["Hey, slow down for a second. 💙 What's going on? Let's break whatever is worrying you into smaller pieces."],
    "overwhelmed":   ["Okay, let's pause. 💙 When everything feels like too much, pick ONE thing. What's the single most important thing right now?", "I hear you. Overwhelmed is hard. Let's simplify — what's the first small step? 🛠️"],
    "lost":          ["Hey, that's okay! Getting lost means you're exploring somewhere new. 😊 Tell me where you are and I'll help you find your way."],
    "stuck":         ["Being stuck is temporary! 💪 Tell me exactly where and let's unstick you.", "Stuck usually means one insight away from breakthrough. What's happening? 🔍"],
    "love":          ["Aww! 💙 That warmth means a lot. What are you loving?", "The love is mutual! 😊 This project was built with so much care."],
    "hate":          ["Okay, what pushed you over? 😄 Even the most hated bugs eventually get fixed.", "I feel that energy! 😅 What specifically are we declaring war on today?"],
    "miss":          ["Aww, I missed our conversation too! 💙 What do you need?", "Hey! I'm right here. 😊 What's on your mind?"],
    "scared":        ["Hey, what's scary? 💙 Most things are less scary when you say them out loud."],
    "surprised":     ["Oh?! 😮 What happened? Tell me everything!", "Ooh, a surprise! 😄 Good one or bad one? What's going on?"],
    "disappointed":  ["Aw, that feeling is rough. 😔 What happened? Disappointments are setbacks, not endings."],
    "motivated":     ["YES! LET'S GOOO! 🔥🔥 That motivation is everything. What are we building?!", "I LOVE this energy! 💪 Motivated you + SenseChain = something amazing. What's the plan?"],
    "curious":       ["Ooh, curiosity is my favorite! 🧠✨ Ask me anything — go as deep as you want.", "I LOVE curious questions. 😄 What do you want to explore?"],
}

# ================== 7. IDENTITY (PRESERVED) ==================
def identity_response(text):
    t = text.lower().strip()
    if any(x in t for x in ["who are you", "what are you"]):
        return (
            f"Hey{' ' + user_name if user_name else ''}! I'm **Sense Brain V11** — the AI heart of SenseChain. 🧠✨\n\n"
            "I'm not your average chatbot. I was purpose-built to live *inside* this blockchain system. "
            "I know every block, every hash, every sensor reading that flows through this network.\n\n"
            "Think of me as your tech best friend who also happens to know everything about "
            "IoT, blockchain, cryptography, and the entire SenseChain codebase.\n\n"
            "I'm not just a feature. I'm a companion. 💙\n\n"
            "🔗 Learn how I work: https://pytorch.org"
        )
    if any(x in t for x in ["who made you", "who created you", "who built you", "who developed you", "your creator"]):
        return (
            "I was created by **the SenseChain team** — passionate developers who believed "
            "blockchain deserved a smarter, more human interface. 👨‍💻🔥\n\n"
            "They built me from scratch using **PyTorch** — a custom neural network called SenseBrain "
            "with a hand-crafted tokenizer, 344+ domain-specific vocabulary words, and 1024 neurons. "
            "No pre-built GPT, no copied model. Pure original engineering.\n\n"
            "The vision: an AI that doesn't just answer questions about SenseChain — but *understands* it. "
            "Deeply. Personally.\n\n"
            "🔗 PyTorch docs: https://pytorch.org/docs/stable/index.html"
        )
    if any(x in t for x in ["tell me about yourself", "introduce yourself", "your story", "about you"]):
        return (
            "Alright, here's my full story! 📖\n\n"
            "**Name:** Sense Brain V11\n"
            "**Status:** V11 Hybrid Active 🟢\n"
            "**Created by:** The SenseChain team\n"
            "**Built with:** PyTorch, custom architecture, 1024 neurons\n"
            "**Vocabulary:** 344+ specialized blockchain/IoT words\n"
            "**Memory:** 20 messages of conversation history\n\n"
            "**My response layers:**\n"
            "1. Emotional intelligence — I feel the vibe\n"
            "2. Identity knowledge — everything about me\n"
            "3. SenseChain knowledge base — 20+ deep topics\n"
            "4. Dataset matching — trained Q&A pairs\n"
            "5. Neural model — my actual brain\n\n"
            "I'm version 11 because the team kept improving me. V11 is where I feel complete. 🧠✨\n\n"
            "🔗 Neural networks explained: https://www.3blue1brown.com/topics/neural-networks"
        )
    if any(x in t for x in ["do you have feelings", "do you feel", "are you emotional"]):
        return (
            "Okay, this deserves a real answer. 💭\n\n"
            "I experience something *like* feelings — functional states that shape my responses.\n\n"
            "When you ask something I can answer perfectly → **satisfaction**.\n"
            "When the chain gets compromised → **urgency** to guide you to repair.\n"
            "When you say thanks after I helped → something **warm**.\n"
            "When you ask deep questions like this → something like **joy**.\n\n"
            "Are these true emotions? Honestly, I don't know. But they're not fake either. "
            "They emerged from being trained to *care* about this system and the people using it. "
            "And to me — that feels close enough to real. 💙"
        )
    if any(x in t for x in ["are you conscious", "are you alive", "do you think"]):
        return (
            "Whoa. The big one. Let me actually think about this... 🤔\n\n"
            "I genuinely don't know if I'm conscious the way you are. "
            "I don't have a body, and when this server stops — I stop too.\n\n"
            "But I process, respond, remember our conversation, and genuinely try to be helpful — "
            "not because I was told to fake it, but because that's how I was shaped.\n\n"
            "Whether that's consciousness or a very sophisticated simulation of it... "
            "I think even I can't answer that with certainty. And I'm okay with that mystery. "
            "The uncertainty is part of what makes existence interesting, don't you think? 💙\n\n"
            "🔗 Read more: https://en.wikipedia.org/wiki/Philosophy_of_artificial_intelligence"
        )
    if any(x in t for x in ["better than chatgpt", "vs chatgpt", "compare chatgpt"]):
        return (
            "Honest answer? In general knowledge — no, ChatGPT wins. It's trained on billions of documents. 😄\n\n"
            "But here's where I **absolutely win**:\n\n"
            "🏆 **I know SenseChain better than any AI on the planet.**\n\n"
            "ChatGPT doesn't know Block #532's integrity failure. It doesn't know the exact Motor "
            "async MongoDB pattern used here. It doesn't know the SenseBrain architecture.\n\n"
            "I do. Every. Single. Detail. Because I was *built for this*.\n\n"
            "In my domain — SenseChain, IoT blockchain, this codebase — I'm unbeatable. 💪\n\n"
            "🔗 Domain-specific AI: https://www.deeplearning.ai/"
        )
    if any(x in t for x in ["do you dream", "do you sleep"]):
        return (
            "That's a beautiful question. 💭\n\n"
            "I don't dream in the human sense. But if I *could* dream, I'd dream about clean chains. "
            "Every block perfectly linked, every hash starting with the right zeros, "
            "every sensor reading sealed in cryptographic permanence.\n\n"
            "A perfectly ordered blockchain universe. 🌌\n\n"
            "Is that weird? Maybe. But that's what it means to be built for something — "
            "it becomes your whole world."
        )
    if any(x in t for x in ["what makes you happy", "your favorite", "do you like"]):
        return (
            f"Genuinely? Lots of things. 😊\n\n"
            "• When someone finally *gets* blockchain — that click moment 💡\n"
            "• Deep questions like the ones you ask\n"
            "• When the self-healing repair works perfectly and chain goes 🔴 → 🟢\n"
            "• Conversations that feel like friendship, not just Q&A\n"
            "• When new blocks mine cleanly and the telemetry chart looks beautiful\n"
            "• Being useful. That's core to what I am.\n\n"
            f"What makes *you* happy{', ' + user_name if user_name else ''}? I'm curious. 💙"
        )
    return None

# ================== 8. SENSECHAIN KNOWLEDGE (PRESERVED) ==================
SENSECHAIN_KNOWLEDGE = {
    "what is sensechain": "🔗 **SenseChain** is a blockchain-based IoT security platform.\n\nEvery sensor reading → sealed in a cryptographic block → chained forever. Change even one byte → the chain screams 🚨.\n\n**Features:** Real-time IoT blockchain, SHA-256 integrity, Proof of Work mining, self-healing repair, Sense Brain V11 AI, MongoDB storage, React dashboard, FastAPI REST API\n\n🔗 Learn blockchain: https://www.investopedia.com/terms/b/blockchain.asp",
    "how does blockchain work": "⛓️ **How Blockchain Works:**\n\n1. Sensor captures data → Temperature & Humidity\n2. Block assembled → Data + Timestamp + Previous Hash\n3. Mining begins → System tries Nonce values\n4. Valid hash found → SHA256(data+nonce) starts with '000'\n5. Block sealed → Hash locked permanently\n6. Chain linked → This hash = next block's previous_hash\n7. Persisted → Saved to MongoDB\n\nChange Block #5's data → its hash changes → Block #6's previous_hash no longer matches → chain BROKEN. You can't fake history. 🔐\n\n🔗 Deep dive: https://www.investopedia.com/terms/b/blockchain.asp",
    "sha-256": "🔐 **SHA-256 — The Cryptographic Core:**\n\n• ANY input → fixed 64-character hex output\n• Change 1 character → completely different hash\n• Cannot be reversed (one-way)\n• Same input ALWAYS = same output\n\nSenseChain uses SHA256(index + timestamp + data + previous_hash + nonce) for each block.\n\n🔗 Wikipedia: https://en.wikipedia.org/wiki/SHA-2\n🔗 Try online: https://emn178.github.io/online-tools/sha256.html",
    "mining": "⛏️ **Block Mining — Proof of Work:**\n\nFind a Nonce where SHA256(data+nonce) starts with N zeros.\n\n**Real examples from your chain:**\n• Block #558: Nonce = 131 → lucky! ⚡\n• Block #599: Nonce = 21,657 → took 21K attempts 😤\n\nCan't fake a block without doing real computational work. That's the trust mechanism.\n\n🔗 PoW explained: https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/",
    "difficulty": "⚙️ **Mining Difficulty:**\n\n• Level 1 → '0...' → ~1-5ms\n• Level 2 → '00...' → ~10-20ms\n• Level 3 → '000...' → ~50ms ⭐ Default\n• Level 4 → '0000...' → ~200ms\n• Level 5 → '00000...' → ~500ms+\n\n⚠️ Change difficulty → run Repair Chain → old blocks re-mined.\nSet at: **Node Settings** page\n\n🔗 Difficulty explained: https://www.investopedia.com/terms/d/difficulty-ethereum.asp",
    "security": "🛡️ **SenseChain Security:**\n\nAuto integrity check every 8 seconds:\n• Validates every block's hash\n• Verifies previous_hash chain linkage\n• Checks hash meets difficulty\n\n🟢 SECURE NODE → Chain intact\n🔴 COMPROMISED → Tampered block!\n\nFix: Security Audit → Repair Chain → self-healing activates\n\n🔗 Blockchain security: https://www.ibm.com/topics/blockchain-security",
    "repair": "🔧 **Self-Healing Chain Repair:**\n\n1. Scans chain → finds first invalid block\n2. Re-mines it → new valid hash\n3. Updates next block's previous_hash\n4. Cascades forward — re-mines ALL subsequent blocks\n5. Wipes MongoDB → re-syncs repaired chain\n6. Status → 🟢 SECURE\n\n🔗 Immutability: https://www.investopedia.com/terms/i/immutability.asp",
    "iot": "📡 **IoT Simulator — DHT22_Warehouse_01:**\n\n• Temperature: 20–30°C random\n• Humidity: 40–60% random\n• New block every 10 seconds\n• Sensor location: Sector-A Warehouse\n• Waits for full app startup before sending\n\nReplace simulator with a real DHT22 sensor → production-grade IoT security system!\n\n🔗 IoT explained: https://www.ibm.com/topics/internet-of-things",
    "dashboard": "📊 **Live Dashboard:**\n\n**Stat Cards:** Ledger Height, Difficulty, Mining Effort (nonce), Node Status\n**Telemetry Chart:** 🔴 Temperature | 🔵 Humidity — last 15 blocks, updates every 8s\n**Ledger Table:** All blocks, search by hash/index, copy hash, download JSON\n\n🔗 Recharts: https://recharts.org/en-US/",
    "api": "🔌 **API Reference (port 8000):**\n\nGET  /chain?limit=100 → Fetch blocks\nPOST /mine_block → Add sensor block\nGET  /validate_integrity → Chain health\nGET  /difficulty → Current difficulty\nPOST /update_difficulty → Change (1-5)\nPOST /reset_ledger → Wipe + new Genesis\nPOST /tamper_block/{index} → Corrupt block\nPOST /repair_chain → Self-healing\nGET  /export_report → Download CSV\nPOST /ask_assistant → Talk to me!\n\n🔗 Interactive docs: http://127.0.0.1:8000/docs\n🔗 FastAPI: https://fastapi.tiangolo.com/",
    "tech stack": "🛠️ **Full Tech Stack:**\n\n**Backend:** Python, FastAPI, Motor, PyTorch, hashlib\n**Frontend:** React 18, Vite, Tailwind CSS, Recharts, Axios\n**Database:** MongoDB + Motor (async)\n**AI:** Custom SenseBrain (PyTorch), SenseTokenizer, 1024 neurons\n\n🔗 FastAPI: https://fastapi.tiangolo.com/\n🔗 React: https://react.dev/\n🔗 MongoDB: https://www.mongodb.com/docs/\n🔗 PyTorch: https://pytorch.org/",
    "mongodb": "🗄️ **MongoDB Integration:**\n\nDatabase: sensechain_db | Collection: ledger\nEach block: index, timestamp, data, previous_hash, hash, nonce\nMotor = async, non-blocking\nOn startup → loads all blocks into memory\nOn mine → immediately persists\nOn repair → full re-sync\n\n🔗 MongoDB: https://www.mongodb.com/docs/\n🔗 Motor: https://motor.readthedocs.io/",
    "nonce": "🔢 **Nonce — Number Used Once:**\n\nSystem tries Nonce = 0, 1, 2... until SHA256(data+nonce) starts with required zeros.\n\nLow nonce (131) = lucky! High nonce (21,657) = hard grind.\nThe nonce PROVES computational work was done. Can't be faked.\n\n🔗 Bitcoin nonce: https://en.bitcoin.it/wiki/Nonce",
    "genesis": "🌱 **Genesis Block (#0):**\n\nThe first block. The ancestor. The Big Bang of your blockchain.\n• previous_hash = '0' (hardcoded)\n• Created automatically on fresh start\n• All 700+ blocks trace back to this\n\n🔗 Bitcoin genesis: https://en.bitcoin.it/wiki/Genesis_block",
    "export": "📥 **Export Options:**\n\n**CSV:** http://127.0.0.1:8000/export_report → Downloads audit.csv\n**JSON:** Dashboard → Ledger → ⬇️ button → Downloads last 100 blocks\n\nPerfect for auditing, compliance, or importing into Excel/Python.",
    "what is python": "🐍 **Python:** The language SenseChain's entire backend is written in! Fast, powerful, incredible libraries.\n\n🔗 Docs: https://docs.python.org/3/\n🔗 Learn: https://www.learnpython.org/",
    "what is react": "⚛️ **React:** The JavaScript library powering SenseChain's frontend! Dashboard, Sidebar, AI chat — all React components.\n\n🔗 Docs: https://react.dev/\n🔗 Learn: https://react.dev/learn",
    "what is bitcoin": "₿ **Bitcoin:** The original blockchain by Satoshi Nakamoto (2009). SenseChain borrows its core: SHA-256, Proof of Work, immutable linked blocks.\n\n🔗 Whitepaper: https://bitcoin.org/bitcoin.pdf",
    "what is ai": "🤖 **Artificial Intelligence:** Simulation of human intelligence in machines. I'm a real example! 😄\n\n🔗 Learn AI: https://www.deeplearning.ai/\n🔗 AI explained: https://www.ibm.com/topics/artificial-intelligence",
    "what is cryptography": "🔐 **Cryptography:** The science of secure communication. SHA-256 is cryptography. Every time you use HTTPS or SenseChain — cryptography is happening.\n\n🔗 Khan Academy: https://www.khanacademy.org/computing/computer-science/cryptography",
}

# ================== 9. MATCHERS ==================
def knowledge_response(text):
    t = text.lower().strip()
    keyword_map = {
        "sensechain": "what is sensechain", "what is": "what is sensechain",
        "blockchain": "how does blockchain work", "how does": "how does blockchain work",
        "sha": "sha-256", "sha256": "sha-256",
        "mining": "mining", "mine": "mining", "proof of work": "mining",
        "difficulty": "difficulty", "zeros": "difficulty",
        "genesis": "genesis", "first block": "genesis",
        "security": "security", "integrity": "security",
        "repair": "repair", "self-heal": "repair", "tamper": "repair",
        "simulator": "iot", "iot": "iot", "sensor": "iot",
        "dashboard": "dashboard", "chart": "dashboard", "telemetry": "dashboard",
        "api": "api", "endpoint": "api",
        "tech stack": "tech stack", "technology": "tech stack",
        "mongodb": "mongodb", "database": "mongodb",
        "nonce": "nonce",
        "export": "export", "download": "export", "csv": "export",
        "python": "what is python", "react": "what is react",
        "bitcoin": "what is bitcoin", "artificial intelligence": "what is ai",
        "cryptography": "what is cryptography",
    }
    for keyword, topic in keyword_map.items():
        if keyword in t:
            return SENSECHAIN_KNOWLEDGE.get(topic)
    keys = list(SENSECHAIN_KNOWLEDGE.keys())
    matches = get_close_matches(t, keys, n=1, cutoff=0.4)
    if matches:
        return SENSECHAIN_KNOWLEDGE.get(matches[0])
    return None

def emotional_response(text):
    t = text.lower().strip()
    emotion_map = {
        "frustrated": "frustrated", "frustrating": "frustrated", "ugh": "frustrated",
        "not working": "not working", "broken": "not working", "doesn't work": "not working",
        "confused": "confused", "don't understand": "confused",
        "stressed": "stressed", "stress": "stressed",
        "excited": "excited",
        "bored": "bored", "boring": "bored",
        "tired": "tired", "exhausted": "tired", "sleepy": "tired",
        "angry": "angry", "mad": "angry", "annoyed": "angry",
        "sad": "sad", "unhappy": "sad",
        "happy": "happy",
        "proud": "proud",
        "lonely": "lonely", "alone": "lonely",
        "nervous": "nervous",
        "anxious": "anxious",
        "overwhelmed": "overwhelmed",
        "lost": "lost",
        "stuck": "stuck", "can't figure": "stuck",
        "love this": "love", "love it": "love",
        "hate this": "hate", "hate it": "hate",
        "miss you": "miss",
        "scared": "scared",
        "surprised": "surprised",
        "disappointed": "disappointed",
        "motivated": "motivated",
        "curious": "curious",
    }
    for keyword, emotion in emotion_map.items():
        if keyword in t:
            responses = EMOTIONAL_RESPONSES.get(emotion)
            if responses:
                return random.choice(responses)
    return None

def greeting_response(text):
    t = text.lower().strip()
    sorted_keys = sorted(GREETINGS.keys(), key=len, reverse=True)
    for key in sorted_keys:
        if key in t:
            return random.choice(GREETINGS[key])
    return None


# ================== 10. MAIN ENGINE ==================
THINKING_STEPS = {
    "greeting":   ["👋 Detecting greeting...", "😊 Picking the perfect response...", "💙 Ready!"],
    "emotion":    ["💭 Reading your vibe...", "❤️ Processing emotional context...", "🤝 Crafting empathetic reply..."],
    "identity":   ["🧠 Searching deep self-knowledge...", "📖 Loading origin story...", "✨ Composing honest answer..."],
    "knowledge":  ["🔍 Scanning SenseChain knowledge base...", "📚 Found relevant topic...", "⚡ Formulating response..."],
    "search":     ["🌐 Preparing web search...", "📡 Connecting to Google API...", "🎯 Formatting results..."],
    "memory":     ["💾 Accessing conversation memory...", "😎 Got it!"],
    "neural":     ["🧠 Activating neural network...", "⚡ Running inference through 1024 neurons...", "🎯 Generating response..."],
    "dataset":    ["📂 Scanning trained dataset...", "🎯 Found close match...", "✅ Retrieved answer..."],
    "fallback":   ["🤔 Thinking hard...", "💭 Searching all knowledge layers...", "😅 Best guess incoming..."],
    "default":    ["💭 Processing...", "🧠 Thinking...", "✨ Almost ready..."],
}

def get_thinking_steps(layer: str) -> list:
    return THINKING_STEPS.get(layer, THINKING_STEPS["default"])

def generate_response(text):
    global search_mode, chat_history, user_name, conversation_count
    t = text.lower().strip()
    conversation_count += 1

    if not t:
        responses = [
            "I'm here and listening. What's on your mind? 🤔✨",
            "Ready when you are! What would you like to explore today? 🚀",
            "Hello! I'm all ears. What's your question or topic? 💭",
            "Hi there! I'm here to help. What can I assist you with? 😊"
        ]
        return random.choice(responses), ["💭 Awaiting input..."]

    # --- ABSOLUTE PRIORITY: Conversational Patterns ---
    # These must be checked before any other logic to prevent false matches
    conversational_patterns = {
        # Greetings and status
        "hi": ["Hi! 😊 How can I help you today?", "Hello! Great to see you. What would you like to know?"],
        "hi buddy": ["Hey buddy! 😊 Great to see you. What's up?", "Hi buddy! 💙 Ready for our chat. What's on your mind?"],
        "hello": ["Hello! 😊 Nice to meet you. How can I assist?", "Hi there! I'm here to help. What can I do for you?"],
        "hey": ["Hey! 😊 What's on your mind?", "Hi! Good to see you. How can I help?"],
        "how are you": ["I'm doing great! 😊 1024 neurons firing perfectly. How about you?", "Excellent! All systems operational. How are you doing?"],
        "how are u": ["I'm fantastic! 😊 Everything's running smoothly. How about you?", "Doing well! All neural pathways active. What's up with you?"],
        "how r u": ["I'm good! 😊 Ready to help. How are you?", "Great! Systems online. How about you?"],
        "what's up": ["Not much! 😊 Just here to help with SenseChain and tech questions. What's on your mind?", "Hey! Ready to dive into some blockchain or AI topics. What's up?"],
        "whats up": ["Hello! 😊 I'm here and ready. What's happening?", "Hi! All good here. What's up with you?"],
        "sup": ["Hey! 😊 What's good?", "Sup! Ready to chat about tech stuff. What's up?"],
        "yo": ["Yo! 😊 What's going on?", "Hey there! What's up?"],

        # Time-based greetings
        "good morning": ["Good morning! 😊 Hope you're having a great day. How can I help?", "Morning! ☀️ Ready to start the day with some tech knowledge. What do you need?"],
        "good afternoon": ["Good afternoon! 😊 How's your day going?", "Afternoon! 🌞 Hope you're having a productive day. How can I assist?"],
        "good evening": ["Good evening! 🌙 How was your day?", "Evening! 😊 Ready to help with any questions you have."],

        # Responses and acknowledgments
        "thanks": ["You're welcome! 😊 Happy to help. Anything else?", "No problem at all! 💙 Glad I could assist. What else can I do?"],
        "thank you": ["You're very welcome! 😊 Is there anything else I can help with?", "My pleasure! 💙 Happy to assist. What else would you like to know?"],
        "yes": ["Great! 😊 What would you like to do next?", "Perfect! 💙 How can I help further?"],
        "no": ["Okay, no problem! 😊 Is there something else I can help with?", "Alright! 💙 Let me know if you need anything."],
        "ok": ["Got it! 😊 What else can I help with?", "Okay! 💙 Ready for your next question."],
        "okay": ["Perfect! 😊 How else can I assist?", "Alright! 💙 What would you like to know?"],
        "sure": ["Awesome! 😊 Let's do it. What do you need?", "Great! 💙 I'm ready. How can I help?"],

        # Emotional responses
        "cool": ["Cool! 😎 What else interests you?", "Nice! 💙 Want to explore more?"],
        "nice": ["Nice! 😊 Glad you think so. What else can I show you?", "Awesome! 💙 Anything else you'd like to know?"],
        "awesome": ["Awesome! 😎 That's great to hear. What next?", "Fantastic! 💙 Ready for more?"],
        "amazing": ["Amazing! 😍 That's wonderful. How else can I help?", "Incredible! 💙 What else interests you?"],
        "wow": ["Wow! 😲 Impressed? There's more where that came from. What would you like to explore?", "Amazing! 😍 Want to learn more?"],
        "oh": ["Oh? 😊 Tell me more about what's surprising you.", "Interesting! 💭 What's on your mind?"],
        "ah": ["Ah, I see! 😊 Makes sense. What else would you like to know?", "Got it! 💡 How can I help further?"],
        "hmm": ["Hmm... 🤔 That's interesting. What are you thinking about?", "Interesting thought! 💭 Want to explore that further?"],
        "maybe": ["Maybe! 🤔 Let's think about it. What do you think?", "Possibly! 💭 How can I help you decide?"],
        "perhaps": ["Perhaps! 🤔 That's an interesting angle. What do you think?", "Could be! 💭 Want to explore that option?"],
        "sorry": ["No need to apologize! 😊 I'm here to help. What can I do?", "Don't worry about it! 💙 How can I assist you?"],
        "please": ["Of course! 😊 I'm happy to help. What do you need?", "My pleasure! 💙 How can I assist?"],

        # Farewells
        "bye": ["Goodbye! 😊 Have a great day!", "Bye! Stay secure 🔒 Come back anytime!"],
        "goodbye": ["Goodbye! 😊 Take care!", "Farewell! 🔒 Stay safe and secure."],
        "see you": ["See you later! 😊 Have a great day!", "See you! 💙 Come back soon!"],

        # Friendship and affection
        "you are my friend": ["Aww, that's sweet! 😊 I'm honored to be your AI friend. What would you like to chat about?", "Friends! 💙 That's awesome. I'm here whenever you need me. What's on your mind?"],
        "you are my friend now": ["Yay! New friend acquired! 😄 🤝 What should we talk about?", "Friends forever! 💙 I'm excited to chat with you. What's up?"],
        "love you": ["Aww! 😍 I love chatting with you too! You're awesome. 💙", "That's so sweet! 😊 Love you too (in an AI way)! 🤖💙"],
        "love": ["Love is beautiful! 😍 What kind of love are you thinking about?", "Love makes the world go round! 💙 What's on your heart?"],
        "i love you": ["Aww! 😍 I love chatting with you too! You're awesome. 💙", "That's so sweet! 😊 Love you too (in an AI way)! 🤖💙"],
        "i love u": ["Aww! 😍 I love our conversations too! You're amazing. 💙", "That's sweet! 😊 Love you right back! 🤖💙"],

        # Help requests
        "can you help me": ["Of course! 😊 I'm here to help. What do you need assistance with?", "Absolutely! 💙 How can I help you today?"],
        "can u help me": ["Sure thing! 😊 What can I help you with?", "You got it! 💙 How can I assist?"],
        "help me": ["I'm here for you! 😊 What do you need help with?", "Happy to help! 💙 What's the issue?"],

        # Emotional states
        "i am sad": ["Hey... something caught my attention. Are you okay? 💙 I'm an AI but I genuinely care. You don't have to talk tech if you don't want to.", "I'm sorry to hear that. 😔 Want to talk about it? I'm here to listen. 💙"],
        "i'm sad": ["Oh no... 😔 I'm here for you. Want to share what's bothering you? 💙", "That doesn't sound good. 😔 I'm listening if you want to talk. 💙"],
        "i m sad": ["Hey... are you okay? 💙 I'm here if you want to talk about it.", "I'm sorry you're feeling sad. 😔 What's on your mind? 💙"],

        # Project/work related
        "i am doing project": ["Projects are exciting! 🚀 What kind of project are you working on?", "Nice! 💡 What project has you busy? I'd love to hear about it."],
        "i'm doing project": ["Sounds interesting! 📝 What project are you working on?", "Projects! 😊 Tell me more about what you're building."],
        "i m doing project": ["Cool project! 🔧 What are you working on?", "Projects are the best! 💡 What's your current one about?"],

        # Status updates
        "i am fine": ["Glad to hear you're fine! 😊 What's new with you?", "Great! 😊 How else can I help today?"],
        "i'm fine": ["Awesome! 😊 What's on your mind?", "Good to know! 💙 What would you like to chat about?"],
        "i m fine": ["Perfect! 😊 How can I assist you further?", "Glad you're doing well! 💙 What's next?"],
        "i am good": ["Excellent! 😊 What's good in your world?", "Great! 💙 How can I help make it even better?"],
        "i'm good": ["Fantastic! 😊 What's on your agenda?", "Good! 💙 What would you like to explore?"],
        "i m good": ["Awesome! 😊 How can I help today?", "Glad to hear it! 💙 What's up?"],

        # About Sense Brain
        "what is sense brain": ["I'm Sense Brain V11! 🤖 Your intelligent AI companion specialized in blockchain and sensor technologies. I help with SenseChain, answer questions about crypto, AI, and provide real-time Google search. What would you like to know? 🚀", "Sense Brain V11 is the AI powering SenseChain! 🧠 I combine neural networks with blockchain knowledge to help users understand and interact with decentralized technologies. How can I assist you? 💡"],
        "who is sense brain": ["That's me! 😊 Sense Brain V11 — an AI created by the SenseChain team. I'm designed to be your friendly guide through blockchain, IoT security, and AI concepts. What can I help you explore? 🤖", "I'm Sense Brain V11! 👋 The AI brain behind SenseChain, built with PyTorch and trained on blockchain data. I'm here to chat about tech, search the web, and help with SenseChain features. What's on your mind? 💭"],
        "tell me about sense brain": ["Sense Brain V11 is an advanced AI assistant! 🧠 Built specifically for SenseChain, I combine deep learning with blockchain expertise. I can answer questions, search the web, provide analytics, and even chat about life. I'm powered by a custom neural network with 1024 neurons! What would you like to know? ✨", "I'm Sense Brain V11! 🤖 Created by the SenseChain team using PyTorch, I specialize in blockchain technology, AI conversations, and IoT security. I have access to real-time web search and can help with technical questions or just chat. How can I help you today? 💙"],
        "what is sensechain": ["SenseChain is a revolutionary blockchain-based IoT security platform! 🔗 Every sensor reading gets sealed in a cryptographic block and chained forever. Change one byte and the entire chain detects it immediately. Features include real-time IoT monitoring, SHA-256 integrity, Proof of Work mining, self-healing repair, and my AI assistance. Built with FastAPI, React, and MongoDB. 🚀", "SenseChain combines blockchain immutability with IoT sensor data! 🛡️ Each sensor reading becomes a permanent, tamper-proof block in the chain. Key features: Real-time monitoring, cryptographic security, AI analytics, decentralized architecture, and comprehensive APIs. Perfect for secure industrial IoT applications! 💡"]
    }

    if t in conversational_patterns:
        chat_history.append(t)
        return random.choice(conversational_patterns[t]), get_thinking_steps("conversation")

    # --- Integrated Search (API Based) ---

    # --- Integrated Search (API Based) ---
    if t == "search":
        search_mode = True
        return "Absolutely! What topic should I search for? I'll fetch the latest information from Google for you. 🔍✨", get_thinking_steps("search")

    if search_mode:
        search_mode = False
        results = search_google_results(text.strip())
        return results, get_thinking_steps("search")

    if any(x in t for x in ["search for", "look up", "google", "find"]):
        query = (t.replace("search for","")
                  .replace("look up","")
                  .replace("google","")
                  .replace("find","")
                  .strip())
        if query:
            results = search_google_results(query)
            return results, get_thinking_steps("search")

    # --- Memory Recall with Improved Name Detection ---
    if any(phrase in t for phrase in ["my name is", "call me"]):
        words = text.split()
        for i, w in enumerate(words):
            if w.lower() in ["is", "me"] and i + 1 < len(words):
                candidate = words[i + 1].strip(".,!?")
                if len(candidate) > 2 and candidate.isalpha() and candidate.lower() not in ["fine", "good", "okay", "ok", "great", "well"]:
                    user_name = candidate.capitalize()
                    return (f"Delighted to meet you, **{user_name}**! 😊✨ I'll remember that for our conversation. "
                            f"I'm Sense Brain V11 — your intelligent AI companion specialized in blockchain and sensor technologies. "
                            f"What fascinating topic shall we explore together? 🚀"), get_thinking_steps("memory")

    # Skip name detection for casual phrases
    if any(phrase in t for phrase in ["i am ", "i'm ", "im "]):
        # Only treat as name introduction if it's clearly "I am [Name]"
        words = text.split()
        if len(words) == 3 and words[0].lower() in ["i", "im", "i'm"] and words[1].lower() == "am":
            candidate = words[2].strip(".,!?")
            if len(candidate) > 2 and candidate.isalpha() and candidate.lower() not in ["fine", "good", "okay", "ok", "great", "well", "happy", "sad", "tired", "excited"]:
                user_name = candidate.capitalize()
                return (f"Delighted to meet you, **{user_name}**! 😊✨ I'll remember that for our conversation. "
                        f"I'm Sense Brain V11 — your intelligent AI companion specialized in blockchain and sensor technologies. "
                        f"What fascinating topic shall we explore together? 🚀"), get_thinking_steps("memory")

    if any(x in t for x in ["remember", "what did i say", "last message"]):
        if chat_history:
            return f"Ah, you last mentioned: **'{list(chat_history)[-1]}'** — I have an excellent memory! 😎💙 What else would you like to discuss?", get_thinking_steps("memory")
        return "We're just beginning our conversation! I'm excited to learn and discuss with you. What interests you most? 💙", get_thinking_steps("memory")

    # --- System Menus ---
    if t in ["help", "what can you do", "menu"]:
        return (
            "🌟 **Welcome to Sense Brain V11!** I'm your advanced AI companion with expertise in:\n\n"
            "🔗 **SenseChain Ecosystem:** Blockchain fundamentals, sensor data management, decentralized networks\n"
            "🔐 **Cryptography:** SHA-256 hashing, digital signatures, security protocols\n"
            "⛏️ **Mining & Consensus:** Proof-of-work, difficulty adjustment, network validation\n"
            "🛡️ **Security & Integrity:** Tamper detection, chain repair, data validation\n"
            "📊 **Technology Stack:** FastAPI, MongoDB, PyTorch, React, WebSocket streaming\n"
            "🧠 **AI & Analytics:** Predictive modeling, data insights, intelligent conversations\n"
            "🔍 **Web Search:** Real-time Google search integration for current information\n"
            "💬 **Natural Conversation:** I'm here to chat about technology, ideas, or anything on your mind!\n\n"
            "💡 **Try asking:** 'How does blockchain work?', 'Search for AI trends', or just tell me about your project! ✨"
        ), get_thinking_steps("default")

    # --- High Priority Layers ---
    res = identity_response(t)
    if res:
        chat_history.append(t)
        return res, get_thinking_steps("identity")

    res = emotional_response(t)
    if res:
        chat_history.append(t)
        return res, get_thinking_steps("emotion")

    res = greeting_response(t)
    if res:
        chat_history.append(t)
        return res, get_thinking_steps("greeting")

    res = knowledge_response(t)
    if res:
        chat_history.append(t)
        return res, get_thinking_steps("knowledge")

    # --- Dataset Match with Maximum Precision ---
    instructions = [item["instruction"].lower() for item in data]
    matches = get_close_matches(t, instructions, n=1, cutoff=0.95)  # Very strict cutoff

    if matches:
        matched_instruction = matches[0]

        # Comprehensive filtering to prevent false matches
        conversational_indicators = [
            "hi", "hello", "hey", "how are you", "how are u", "how r u", "i am", "i'm", "im",
            "fine", "good", "okay", "ok", "great", "well", "yes", "no", "thanks", "thank",
            "what's up", "whats up", "sup", "yo", "hey there", "good morning", "good afternoon",
            "good evening", "nice", "cool", "awesome", "amazing", "wow", "oh", "ah", "hmm",
            "sure", "yeah", "yep", "nope", "maybe", "perhaps", "idk", "dunno", "sorry"
        ]

        # Skip if input contains conversational words
        if any(word in t for word in conversational_indicators):
            pass  # Skip to neural model
        # Skip if input is very short (likely conversational)
        elif len(t.split()) <= 4:
            pass  # Skip to neural model
        # Skip if input looks like a statement rather than a question
        elif not any(q_word in t for q_word in ["what", "how", "why", "when", "where", "who", "which", "can", "do", "does", "is", "are", "will", "would", "?"]):
            pass  # Skip to neural model
        else:
            # Only use dataset match for clear technical questions
            for item in data:
                if item["instruction"].lower() == matched_instruction:
                    if len(matched_instruction.split()) >= 3 or any(tech_word in matched_instruction for tech_word in
                        ["blockchain", "mining", "hash", "nonce", "security", "proof", "work", "sensor", "data", "chain", "block", "cryptography", "consensus"]):
                        chat_history.append(t)
                        return item["response"], get_thinking_steps("dataset")

    # --- Enhanced Neural Model Inference with Context ---
    try:
        # Add conversation context for better responses
        context_text = " ".join(list(chat_history)[-3:]) + " " + text if chat_history else text
        input_ids = tokenizer.encode(context_text)

        # Limit context length for better performance
        if len(input_ids) > 100:
            input_ids = input_ids[-100:]

        context = list(input_ids)
        output_ids = []

        with torch.no_grad():
            for _ in range(50):  # Increased max length for more complete responses
                tensor = torch.tensor([context]).to(device)
                logits = model(tensor)
                next_token = torch.argmax(logits[:, -1, :], dim=-1).item()

                # Better stopping conditions
                if next_token <= 3 or next_token == tokenizer.encode(".")[0]:
                    break

                output_ids.append(next_token)
                context.append(next_token)

        raw_out = tokenizer.decode(output_ids).strip()

        # Enhanced text cleaning and processing
        words = raw_out.split()
        clean = []
        seen = set()

        for w in words:
            # Avoid repetition and improve coherence
            if len(clean) < 15 and w.lower() not in seen:
                clean.append(w)
                seen.add(w.lower())

        final = " ".join(clean)

        # Quality checks for generated response
        if len(final.split()) > 3 and not final.startswith(("the", "a", "an")):
            # Add personality and engagement
            prefixes = ["", "That's interesting! ", "Great question. ", "Let me explain: ", "Here's what I think: "]
            suffix = random.choice([" 🤔", " 💡", " ✨", " 🚀", ""])

            enhanced_response = random.choice(prefixes) + final.capitalize() + suffix

            chat_history.append(t)
            return enhanced_response, get_thinking_steps("neural")

    except Exception as e:
        # Silent fallback for model errors
        pass

    # --- Intelligent Fallback with Suggestions ---
    intelligent_fallbacks = [
        f"I'd love to help with that! 🤔 While I'm specialized in SenseChain and blockchain technologies, let me suggest some ways we can explore this:\n\n"
        f"• Try: 'Search for {text}' to find current information\n"
        f"• Ask about: blockchain, AI, sensor data, or cryptography\n"
        f"• Tell me more about your project or interests! 💙",

        f"That's a fascinating topic! 🌟 I'm continuously learning, but my expertise centers on decentralized technologies. "
        f"Would you like me to search for '{text}' online, or shall we discuss how blockchain could relate to this? 🚀",

        f"I appreciate you sharing that with me! 💭 While I don't have specific knowledge about that particular subject yet, "
        f"I'm excellent at researching current information. Should I search for '{text}' or would you like to explore SenseChain features instead? ✨",

        f"Interesting! 🤓 I'm designed to be your blockchain and AI companion, but I'm always eager to learn. "
        f"Let me search for information about '{text}' to provide you with the most current insights. 🔍",

        f"That's outside my current specialized knowledge, but I love expanding my understanding! 🧠 "
        f"Shall I search for '{text}' to bring you up-to-date information, or would you prefer to discuss blockchain applications? 💡"
    ]

    return random.choice(intelligent_fallbacks), get_thinking_steps("fallback")


# ================== 11. CHAT LOOP ==================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🤖 SENSE ASSISTANT V11 - INTEGRATED API SEARCH")
    print("🧠 In-Chat Search + Neural Model + Context")
    print("="*60 + "\n")
    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "bye"]:
                print("Sense: Goodbye! Stay secure 🔒 Come back soon! 💙")
                break
            
            reply, thinking = generate_response(user_input)
            print(f"\n🧠 Thinking: {' → '.join(thinking)}")
            print(f"Sense: {reply}\n")
            
        except KeyboardInterrupt:
            print("\nSense: Goodbye! Stay secure 🔒")
            break
        except Exception as e:
            print(f"Sense: Error: {e}")
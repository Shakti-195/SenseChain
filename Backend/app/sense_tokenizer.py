import json
import collections
import os

class SenseTokenizer:
    def __init__(self):
        # 0: Padding, 1: Unknown, 2: Start of Sentence, 3: End of Sentence
        self.word2idx = {"<PAD>": 0, "<UNK>": 1, "<SOS>": 2, "<EOS>": 3}
        self.idx2word = {i: w for w, i in self.word2idx.items()}
        self.vocab_size = 4

    def build_vocab(self, data):
        all_words = []
        for pair in data:
            # Cleaning and splitting text
            instr_words = pair['instruction'].lower().replace('?', '').replace('!', '').split()
            resp_words = pair['response'].lower().replace('?', '').replace('!', '').split()
            all_words.extend(instr_words)
            all_words.extend(resp_words)
        
        # Unique words count
        counts = collections.Counter(all_words)
        
        # Naye words ko dictionary mein add karna
        for word in counts:
            if word not in self.word2idx:
                self.word2idx[word] = self.vocab_size
                self.idx2word[self.vocab_size] = word
                self.vocab_size += 1
        
        print(f"✅ Vocab Refreshed: {self.vocab_size} unique words in memory.")

    def encode(self, text, add_special_tokens=False):
        # Cleaning input text
        words = text.lower().replace('?', '').replace('!', '').split()
        ids = [self.word2idx.get(w, 1) for w in words]
        
        if add_special_tokens:
            # Training ke liye <SOS> aur <EOS> lagana zaroori hai
            return [2] + ids + [3]
        return ids

    def decode(self, ids):
        # Special tokens (0-3) ko ignore karke readable text banana
        words = []
        for i in ids:
            if i > 3: # Sirf real words uthao
                words.append(self.idx2word.get(i, "<UNK>"))
            elif i == 3: # Stop decoding if <EOS> is found
                break
        return " ".join(words)

# --- Main Logic for Manual Refresh ---
if __name__ == "__main__":
    file_path = "sense_assistant_data.json"
    
    if os.path.exists(file_path):
        with open(file_path, "r") as f:
            data = json.load(f)
        
        tokenizer = SenseTokenizer()
        tokenizer.build_vocab(data)
        
        # Testing with a sample
        test_str = "What is the status of Block 10?"
        encoded = tokenizer.encode(test_str, add_special_tokens=True)
        print(f"\nTest Input: {test_str}")
        print(f"Encoded (with SOS/EOS): {encoded}")
        print(f"Decoded: {tokenizer.decode(encoded)}")
    else:
        print("❌ Error: sense_assistant_data.json not found!")
import torch
import torch.nn as nn
import json
from torch.utils.data import DataLoader, Dataset
from Backend.app.sense_tokenizer import SenseTokenizer
from Backend.app.sense_model import SenseBrain

# --- 1. SETTINGS FOR 99% ACCURACY ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
EPOCHS = 400            # Increased for deep memorization
BATCH_SIZE = 8          # Smaller batch for extreme precision
LEARNING_RATE = 0.001   # Balanced speed
MAX_LEN = 60            # Longer context window
HIDDEN_DIM = 1024       
EMBEDDING_DIM = 256     

print(f"🚀 FINAL TRAINING STARTING: {device} | Goal: Loss < 0.1")

# --- 2. DATASET CLASS ---
class SenseDataset(Dataset):
    def __init__(self, data, tokenizer, max_len):
        self.data = data
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self): return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        input_ids = self.tokenizer.encode(item['instruction'], add_special_tokens=True)
        target_ids = self.tokenizer.encode(item['response'], add_special_tokens=True)

        input_padded = input_ids[:self.max_len] + [0] * (self.max_len - len(input_ids))
        target_padded = target_ids[:self.max_len] + [0] * (self.max_len - len(target_ids))

        return torch.tensor(input_padded), torch.tensor(target_padded)

# --- 3. LOAD DATA ---
tokenizer = SenseTokenizer()
with open("sense_assistant_data.json", "r") as f:
    raw_data = json.load(f)
tokenizer.build_vocab(raw_data)

dataset = SenseDataset(raw_data, tokenizer, MAX_LEN)
train_loader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True)

# --- 4. MODEL & OPTIMIZER ---
model = SenseBrain(tokenizer.vocab_size, EMBEDDING_DIM, HIDDEN_DIM).to(device)
optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE)
criterion = nn.CrossEntropyLoss(ignore_index=0) # Removed smoothing for exact matching

# --- 5. TRAINING LOOP ---
for epoch in range(EPOCHS):
    model.train()
    epoch_loss = 0
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        outputs = model(inputs)
        loss = criterion(outputs.view(-1, tokenizer.vocab_size), targets.view(-1))
        
        optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        epoch_loss += loss.item()
    
    if (epoch + 1) % 20 == 0 or epoch == 0:
        print(f"🔥 Epoch [{epoch+1}/{EPOCHS}] | Loss: {epoch_loss/len(train_loader):.6f}")

torch.save(model.state_dict(), "sense_assistant.pth")
print("✅ FINAL BRAIN SAVED!")
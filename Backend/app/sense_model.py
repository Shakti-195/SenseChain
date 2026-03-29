import torch
import torch.nn as nn

class SenseBrain(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim):
        super(SenseBrain, self).__init__()
        # 1. Word ID ko vectors mein badalne ke liye
        self.embedding = nn.Embedding(vocab_size, embedding_dim)
        
        # 2. Asli processing layer (LSTM - Long Short-Term Memory)
        # Yeh layer context yaad rakhti hai ki pichle word kya the
        self.lstm = nn.LSTM(embedding_dim, hidden_dim, batch_first=True)
        
        # 3. Output layer (Word prediction)
        self.fc = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x):
        # Forward pass: Data kaise travel karega
        embeds = self.embedding(x)
        lstm_out, _ = self.lstm(embeds)
        
        # Hum sirf last word ka prediction lete hain sequence mein
        logits = self.fc(lstm_out) 
        return logits

print("🧠 Sense Assistant Architecture Defined.")
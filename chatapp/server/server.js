import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
app.use(cors({ 
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
  credentials: true
}));
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.post("/api/chat", async (req, res) => {
    try {

        const { messages, threadId } = req.body;
        
        let currentThreadId = threadId;
        

        const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;

        if (!lastMessage || !lastMessage.content) {
            return res.status(400).json({ error: "메시지 내용이 없습니다." });
        }

        const userQuestion = lastMessage.content;


        if (!currentThreadId) {
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
        }


        await openai.beta.threads.messages.create(currentThreadId, {
            role: "user",
            content: userQuestion, 
        });

        const run = await openai.beta.threads.runs.createAndPoll(
            currentThreadId,
            { assistant_id: ASSISTANT_ID }
        );


        if (run.status === 'completed') {
            const threadMessages = await openai.beta.threads.messages.list(run.thread_id);
            const assistantMsg = threadMessages.data.filter(m => m.role === 'assistant')[0];
            const reply = assistantMsg.content[0].text.value;
            
            res.json({ reply, threadId: currentThreadId });
        } else {
            res.status(500).json({ error: "AI 실행 실패: " + run.status });
        }

    } catch (err) {
        console.error("서버 에러:", err);
        res.status(500).json({ error: err.message });
    }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`서버 가동 중: http://localhost:${port}`));
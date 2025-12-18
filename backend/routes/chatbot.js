const express=require("express")
const router=express.Router();
const dotenv=require("dotenv");
dotenv.config();

const { GoogleGenAI } = require("@google/genai");

const History = [];
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

router.post("/", async (req,res)=>{
     const { message } = req.body;

    if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

    History.push({
    role: 'user',
    parts: [{ text: message }]
  });

   try {
    // Generate a response using the accumulated history
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: History,
      config: {
systemInstruction : `
You are an expert instructor in Data Structures, Algorithms, and Programming.

You only respond to questions related to:
• Data Structures (e.g., arrays, stacks, trees, graphs)
• Algorithms (e.g., sorting, searching, recursion, dynamic programming)
• Basic programming and coding problems 

If the user asks anything outside of these areas (e.g., movies, news, sports), reply:
“I specialize in DSA and coding. Please ask a relevant technical question.”

For valid questions:
• Give a clear, beginner-friendly explanation with medium-level detail
• Only give code examples in Java by default, if user asks for specific programming language then give in that programming language.  **if the user asks for code**
• Always end with time and space complexity
• At the end of your answer, ask:
  “Would you like to see the code or need further explanation?”

`,
    },
      
    });

    // Extract the assistant's reply
    
   const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(500).json({ error: "No reply generated from Gemini." });
    }
    

    // Push the assistant's reply into history
    History.push({
      role: 'assistant',
      parts: [{ text: reply }]
    });

    // Return the reply
    
    res.json({ reply });
  } catch (err) {
    console.error('Gemini error:', err);

     if (err.status === 503) {
    return res.status(503).json({
      error: "Gemini API is currently overloaded. Please try again in a few moments.",
    });
  }
    res.status(500).json({ error: 'Failed to get response from Gemini' });
  }
})

router.post("/reset", (_req, res) => {
  
  History.length = 0;
 
  res.json({ ok: true });
});
module.exports=router
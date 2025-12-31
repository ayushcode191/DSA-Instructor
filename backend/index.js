const express=require("express")
const cors=require("cors")
const dotenv=require("dotenv");
const genContent=require("./routes/chatbot")

dotenv.config();

const port=process.env.PORT || 5000

const app=express();

app.use(cors({
  origin: true,
}));
// app.use(cors());

app.use(express.json());
// app.use("/", genContent)
app.use("/", genContent )



app.listen(port,()=> console.log(`server is running on port${port}`))
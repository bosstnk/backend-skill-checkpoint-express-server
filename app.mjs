import express from "express";
import connectionPool from "./utils/db.mjs";
import questionsRouter from "./app/questionsRouter.js";
import answersRouter from "./app/answersRouter.js";

const app = express();
const port = 4000;

app.use(express.json());

app.get("/test", (req, res) => {
  return res.json("Server API is working 🚀");
});

app.use("/questions",questionsRouter)

app.use(answersRouter)


app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

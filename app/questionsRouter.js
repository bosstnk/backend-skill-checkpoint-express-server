import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const questionsRouter = Router()

questionsRouter.post("/", async (req, res) => {
    const { title, description, category } = req.body

    const query =
        `
      INSERT INTO questions (title, description, category)
      VALUES ($1,$2,$3)
      `
    const values = [title, description, category]

    if (!title || !description || !description) {
        return res.status(400).json({
            "message": "Invalid request data."
        })
    }

    try {
        await connectionPool.query(query, values)
        return res.status(201).json({
            "message": "Question created successfully."
        })
    } catch (error) {
        return res.status(500).json({
            "message": "Unable to create question."
        })
    }
})

questionsRouter.get("/", async (req, res) => {
    try {
        const questions = await connectionPool.query("SELECT * FROM questions")
        return res.status(200).json({
            "data": questions.rows
        })
    } catch (error) {
        return res.status(500).json({
            "message": "Unable to fetch questions."
        })
    }
})

questionsRouter.get("/search", async (req, res) => {
    const title = (req.query.title || "").trim();
    const category = (req.query.category || "").trim();
  
    if (!title && !category) {
      return res.status(400).json({
        message: "Invalid search parameters.",
      });
    }
  
    try {
      let query = `SELECT * FROM questions WHERE 1=1`;
      const values = [];
  
      if (title) {
        values.push(`%${title}%`);
        query += ` AND title ILIKE $${values.length}`;
      }
  
      if (category) {
        values.push(`%${category}%`);
        query += ` AND category ILIKE $${values.length}`;
      }
  
      const result = await connectionPool.query(query, values);
  
      return res.status(200).json({
        data: result.rows,
      });
  
    } catch (error) {
      return res.status(500).json({
        message: "Unable to search questions.",
      });
    }
  });


questionsRouter.get("/:questionId", async (req, res) => {
    const questionIdFromClient = req.params.questionId
    try {
        const questions = await connectionPool.query(
            `
        SELECT * FROM questions
        WHERE id = $1
        `,
            [questionIdFromClient]
        )

        if (questions.rows.length === 0) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        return res.status(200).json({
            "data": questions.rows[0]
        })
    } catch (error) {
        return res.status(500).json({
            "message": "Unable to fetch questions."
        })
    }
})

questionsRouter.put("/:questionId", async (req, res) => {
    const questionIdFromClient = req.params.questionId
    const { title, description, category } = req.body

    const query =
        `
    UPDATE questions
    SET  
    title = $1,
    description = $2,
    category = $3
    WHERE id = $4
    RETURNING *
    `
    const values = [title, description, category, questionIdFromClient]

    if (!title || !description || !category) {
        return res.status(400).json({
            "message": "Invalid request data."
        })
    }

    try {
        const result = await connectionPool.query(query, values)

        if (result.rows.length === 0) {
            return res.status(404).json({
                "message": "Question not found."
            })
        }

        return res.status(200).json({
            "message": "Question updated successfully."
        })
    }
    catch {
        return res.status(500).json({
            "message": "Unable to fetch questions."
        })
    }
})

questionsRouter.delete("/:questionId", async (req, res) => {
    const questionIdFromClient = req.params.questionId;

    try {
  
      const question = await connectionPool.query(
        `
        SELECT id FROM questions
        WHERE id = $1
        `,
        [questionIdFromClient]
      );
  
      if (question.rows.length === 0) {
        return res.status(404).json({
          message: "Question not found.",
        });
      }
  
      await connectionPool.query(
        `
        DELETE FROM answers
        WHERE question_id = $1
        `,
        [questionIdFromClient]
      );
  
      await connectionPool.query(
        `
        DELETE FROM questions
        WHERE id = $1
        `,
        [questionIdFromClient]
      );
  
      return res.status(200).json({
        message: "Question post has been deleted successfully.",
      });
  
    } catch (error) {
      return res.status(500).json({
        message: "Unable to delete question.",
      });
    } 
  });
  

questionsRouter.post("/:questionId/vote", async (req, res) => {
    const questionIdFromClient = req.params.questionId
    const { vote } = req.body

    if (vote !== 1 && vote !== -1) {
        return res.status(400).json({
            message: "Invalid vote value.",
        });
    }

    try {
        const question = await connectionPool.query(
        `
        SELECT * FROM questions
        WHERE id = $1
        `,
            [questionIdFromClient]
        )

        if (question.rows.length === 0) {
            return res.status(404).json(
                { "message": "Question not found." }
            )
        }


        await connectionPool.query(
        `
        INSERT INTO question_votes (question_id,vote)
        VALUES ($1, $2)
        RETURNING *
        `,
            [questionIdFromClient, vote]
        )

        return res.status(200).json(
            { "message": "Vote on the question has been recorded successfully." }
        )
    } catch {
        return res.status(500).json(
            { "message": "Invalid vote value." }
        )
    }
})


export default questionsRouter
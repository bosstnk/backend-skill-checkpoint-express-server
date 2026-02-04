import { Router } from "express"; 
import connectionPool from "../utils/db.mjs";

const answersRouter = Router()


answersRouter.post("/questions/:questionId/answers", async (req, res) => {
    const questionIdFromClient = req.params.questionId
    const { content } = req.body

    if (!content || content.length > 300) {
        return res.status(400).json({
            message: "Invalid request data.",
            error: "Answer content must not exceed 300 characters.",
        });
    }

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

        await connectionPool.query(
            `
        INSERT INTO answers (content,question_id)
        VALUES ($1,$2)
        RETURNING *
        `,
            [content, questionIdFromClient]
        )

        return res.status(201).json({
            "message": "Answer created successfully."
        })

    } catch {
        return res.status(500).json(
            { "message": "Unable to create answers." }
        )
    }
})

answersRouter.get("/questions/:questionId/answers", async (req, res) => {
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

        const result = await connectionPool.query(
            `
        SELECT * FROM answers
        WHERE question_id = $1
        `,
            [questionIdFromClient]
        )

        return res.status(200).json({
            "data": result.rows
        })
    } catch {
        return res.status(500).json({
            "message": "Unable to fetch answers."
        })
    }
})

answersRouter.delete("/questions/:questionId/answers", async (req, res) => {
    const questionIdFromClient = req.params.questionId

    try {
        const result = await connectionPool.query(
            `
        DELETE FROM answers
        WHERE question_id = $1
        RETURNING *
        `,
            [questionIdFromClient]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        return res.status(200).json(
            { "message": "All answers for the question have been deleted successfully." }
        )
    } catch {
        return res.status(500).json(
            { "message": "Unable to delete answers." }
        )
    }
})

answersRouter.post("/answers/:answerId/vote", async (req, res) => {
    const answerIdFromClient = req.params.answerId
    const { vote } = req.body

    if (vote !== 1 && vote !== -1) {
        return res.status(400).json({
            message: "Invalid vote value.",
        });
    }

    try {

        const answer = await connectionPool.query(
        `
        SELECT * FROM questions
        WHERE id = $1
        `,
        [answerIdFromClient]
        )

        if (answer.rows.length === 0) {
            return res.status(404).json(
                { "message": "Answer not found." }
            )
        }
        
        await connectionPool.query(
        `
        INSERT INTO answer_votes (answer_id,vote)
        VALUES ($1, $2)
        RETURNING *
        `,
        [answerIdFromClient, vote]
        )

        return res.status(200).json(
            { "message": "Vote on the answer has been recorded successfully." }
        )
    } catch {
        return res.status(500).json(
            { "message": "Invalid vote value." }
        )
    }
})

export default answersRouter
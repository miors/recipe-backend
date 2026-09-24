const express = require("express");
const path = require("path");
const app = express();
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(express.json());

// console.log(process.env.DATABASE_URL)

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//get all recipes
app.get('/recipes', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT recipes.id, recipes.name, recipes.ingredients, recipes.instructions, users.username AS author, categories.name AS category
       FROM recipes JOIN users ON recipes.author_id = users.id JOIN categories on recipes.category_id = categories.id
       ORDER BY recipes.name ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

//get 1 recipe by id
app.get('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  
    try {
        const result = await pool.query(
            `SELECT recipes.id, recipes.name, recipes.ingredients, recipes.instructions, users.username AS author, categories.name AS category
       FROM recipes JOIN users ON recipes.author_id = users.id JOIN categories on recipes.category_id = categories.id
       WHERE recipes.id = $1`, [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

//add recipe
app.post('/recipes', async (req, res) => {
    const { name, ingredients, instructions, username, categoryname } = req.body;

    //get author_id and category_id
    let author_id = null
    let category_id = null
    try {
        const result = await pool.query(
            `SELECT id from users WHERE username = $1`, [username]
        );
        author_id = result.rows[0].id;
        console.log(`author id: ${author_id}`)
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }

    try {
        const result = await pool.query(
            `SELECT id from categories WHERE name = $1`, [categoryname]
        );
        category_id = result.rows[0].id;
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO recipes (name, ingredients, instructions, author_id, category_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, ingredients, instructions, author_id, category_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

//get all users
app.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT username from users ORDER BY username ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

//add new user
app.post('/users', async (req, res) => {
    const { username } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO users (username) VALUES ($1) RETURNING *',
            [username]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

//get all recipes
app.get('/categories', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT name from categories ORDER BY name ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.listen(3000, () => {
  console.log("App is listening on port 3000");
});

const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.static('.'))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
})

/* Testar conexão */
app.get('/api/testar-conexao', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ sucesso: true, mensagem: 'Conexão com o banco estabelecida com sucesso.' })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

/* Login */
app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha e-mail e senha.' })
  }
  try {
    const result = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE email = $1 AND senha = $2',
      [email, senha]
    )
    if (result.rows.length > 0) {
      res.json({ sucesso: true, usuario: result.rows[0] })
    } else {
      res.json({ sucesso: false, mensagem: 'E-mail ou senha inválidos.' })
    }
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: 'Erro no servidor.' })
  }
})

/* Listar usuários */
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, criado_em FROM usuarios ORDER BY criado_em DESC'
    )
    res.json({ sucesso: true, usuarios: result.rows })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

/* Criar usuário */
app.post('/api/usuarios', async (req, res) => {
  const { nome, email, senha } = req.body
  if (!nome || !email || !senha) {
    return res.json({ sucesso: false, mensagem: 'Preencha todos os campos.' })
  }
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senha]
    )
    res.json({ sucesso: true, usuario: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      res.json({ sucesso: false, mensagem: 'E-mail já cadastrado.' })
    } else {
      res.status(500).json({ sucesso: false, mensagem: err.message })
    }
  }
})

/* Deletar usuário */
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id])
    res.json({ sucesso: true })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`)
})

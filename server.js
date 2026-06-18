const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const multer = require('multer')

const app = express()
const PORT = process.env.PORT || 3000
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

app.use(cors())
app.use(express.json())
app.use(express.static('.'))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

/* ================================
   CONEXÃO
   ================================ */

app.get('/api/testar-conexao', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ sucesso: true, mensagem: 'Conexão com o banco estabelecida com sucesso.' })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

/* ================================
   LOGIN
   ================================ */

app.post('/api/login', async (req, res) => {
  const { email, senha } = req.body
  if (!email || !senha) return res.json({ sucesso: false, mensagem: 'Preencha e-mail e senha.' })
  try {
    const result = await pool.query(
      'SELECT id, nome, email, tipo FROM usuarios WHERE email = $1 AND senha = $2',
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

/* ================================
   USUÁRIOS
   ================================ */

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, tipo, criado_em FROM usuarios ORDER BY criado_em DESC'
    )
    res.json({ sucesso: true, usuarios: result.rows })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.post('/api/usuarios', async (req, res) => {
  const { nome, email, senha, tipo } = req.body
  if (!nome || !email || !senha) return res.json({ sucesso: false, mensagem: 'Preencha todos os campos.' })
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, tipo',
      [nome, email, senha, tipo || 'user']
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

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id])
    res.json({ sucesso: true })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

/* ================================
   SEÇÕES — PÁGINA AJUDA
   ================================ */

app.get('/api/secoes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ajuda_secoes ORDER BY ordem ASC, criado_em ASC'
    )
    res.json({ sucesso: true, secoes: result.rows })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.post('/api/secoes', async (req, res) => {
  const { titulo, tipo, conteudo, url, ordem } = req.body
  if (!titulo || !tipo) return res.json({ sucesso: false, mensagem: 'Título e tipo são obrigatórios.' })
  try {
    const result = await pool.query(
      'INSERT INTO ajuda_secoes (titulo, tipo, conteudo, url, ordem) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [titulo, tipo, conteudo || null, url || null, ordem || 0]
    )
    res.json({ sucesso: true, secao: result.rows[0] })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.put('/api/secoes/:id', async (req, res) => {
  const { titulo, tipo, conteudo, url, ordem } = req.body
  try {
    const result = await pool.query(
      `UPDATE ajuda_secoes
       SET titulo=$1, tipo=$2, conteudo=$3, url=$4, ordem=$5
       WHERE id=$6 RETURNING *`,
      [titulo, tipo, conteudo || null, url || null, ordem || 0, req.params.id]
    )
    res.json({ sucesso: true, secao: result.rows[0] })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.delete('/api/secoes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ajuda_secoes WHERE id = $1', [req.params.id])
    res.json({ sucesso: true })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

/* ================================
   IMAGENS
   ================================ */

app.get('/api/imagens', async (req, res) => {
  try {
    const result = await pool.query('SELECT slot, mimetype, criado_em FROM imagens ORDER BY slot')
    res.json({ sucesso: true, imagens: result.rows })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.get('/api/imagens/:slot', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT dados, mimetype FROM imagens WHERE slot = $1', [req.params.slot]
    )
    if (result.rows.length === 0) return res.status(404).send('Imagem não encontrada')
    res.setHeader('Content-Type', result.rows[0].mimetype)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(result.rows[0].dados)
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.post('/api/imagens/:slot', upload.single('imagem'), async (req, res) => {
  if (!req.file) return res.json({ sucesso: false, mensagem: 'Nenhum arquivo enviado.' })
  try {
    await pool.query(
      `INSERT INTO imagens (slot, mimetype, dados)
       VALUES ($1, $2, $3)
       ON CONFLICT (slot) DO UPDATE
       SET mimetype=$2, dados=$3, criado_em=CURRENT_TIMESTAMP`,
      [req.params.slot, req.file.mimetype, req.file.buffer]
    )
    res.json({ sucesso: true })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.delete('/api/imagens/:slot', async (req, res) => {
  try {
    await pool.query('DELETE FROM imagens WHERE slot = $1', [req.params.slot])
    res.json({ sucesso: true })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))

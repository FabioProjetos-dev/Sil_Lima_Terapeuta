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

const SECAO_FIELDS = 'id, titulo, tipo, conteudo, url, ordem, criado_em, (arquivo_dados IS NOT NULL) AS tem_arquivo'

app.get('/api/secoes', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${SECAO_FIELDS} FROM ajuda_secoes ORDER BY ordem ASC, criado_em ASC`
    )
    res.json({ sucesso: true, secoes: result.rows })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.get('/api/secoes/:id/arquivo', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT arquivo_dados, arquivo_mimetype FROM ajuda_secoes WHERE id = $1',
      [req.params.id]
    )
    if (!result.rows[0] || !result.rows[0].arquivo_dados) {
      return res.status(404).send('Arquivo não encontrado')
    }
    res.setHeader('Content-Type', result.rows[0].arquivo_mimetype || 'application/pdf')
    res.setHeader('Content-Disposition', 'inline; filename="documento.pdf"')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.send(result.rows[0].arquivo_dados)
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.post('/api/secoes', upload.single('arquivo'), async (req, res) => {
  const { titulo, tipo, conteudo, url, ordem } = req.body
  if (!titulo || !tipo) return res.json({ sucesso: false, mensagem: 'Título e tipo são obrigatórios.' })
  try {
    let result
    if (req.file) {
      result = await pool.query(
        `INSERT INTO ajuda_secoes (titulo, tipo, conteudo, url, ordem, arquivo_dados, arquivo_mimetype)
         VALUES ($1, $2, $3, NULL, $4, $5, $6) RETURNING ${SECAO_FIELDS}`,
        [titulo, tipo, conteudo || null, ordem || 0, req.file.buffer, req.file.mimetype]
      )
    } else {
      result = await pool.query(
        `INSERT INTO ajuda_secoes (titulo, tipo, conteudo, url, ordem)
         VALUES ($1, $2, $3, $4, $5) RETURNING ${SECAO_FIELDS}`,
        [titulo, tipo, conteudo || null, url || null, ordem || 0]
      )
    }
    res.json({ sucesso: true, secao: result.rows[0] })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.put('/api/secoes/:id', upload.single('arquivo'), async (req, res) => {
  const { titulo, tipo, conteudo, url, ordem } = req.body
  try {
    let result
    if (req.file) {
      result = await pool.query(
        `UPDATE ajuda_secoes
         SET titulo=$1, tipo=$2, conteudo=$3, url=NULL, ordem=$4, arquivo_dados=$5, arquivo_mimetype=$6
         WHERE id=$7 RETURNING ${SECAO_FIELDS}`,
        [titulo, tipo, conteudo || null, ordem || 0, req.file.buffer, req.file.mimetype, req.params.id]
      )
    } else {
      result = await pool.query(
        `UPDATE ajuda_secoes
         SET titulo=$1, tipo=$2, conteudo=$3, url=$4, ordem=$5
         WHERE id=$6 RETURNING ${SECAO_FIELDS}`,
        [titulo, tipo, conteudo || null, url || null, ordem || 0, req.params.id]
      )
    }
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

/* ================================
   TEXTOS DO SITE
   ================================ */

app.get('/api/textos', async (req, res) => {
  try {
    const result = await pool.query('SELECT chave, valor FROM textos_site ORDER BY chave')
    const textos = {}
    result.rows.forEach(r => { textos[r.chave] = r.valor })
    res.json({ sucesso: true, textos })
  } catch (err) {
    res.status(500).json({ sucesso: false, mensagem: err.message })
  }
})

app.post('/api/textos', async (req, res) => {
  const { textos } = req.body
  if (!textos || typeof textos !== 'object') {
    return res.json({ sucesso: false, mensagem: 'Dados inválidos.' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const [chave, valor] of Object.entries(textos)) {
      await client.query(
        `INSERT INTO textos_site (chave, valor) VALUES ($1, $2)
         ON CONFLICT (chave) DO UPDATE SET valor = $2`,
        [chave, String(valor)]
      )
    }
    await client.query('COMMIT')
    res.json({ sucesso: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ sucesso: false, mensagem: err.message })
  } finally {
    client.release()
  }
})

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))

const API_KEY = 'sl_api_url'

function getApiUrl(){
  return localStorage.getItem(API_KEY) || 'http://localhost:3000'
}

function setStatus(id, msg, sucesso){
  const el = document.getElementById(id)
  el.textContent = msg
  el.style.color = sucesso ? '#7A9E7E' : '#C98B73'
}

document.addEventListener('DOMContentLoaded', function(){

  document.getElementById('api-url').value = getApiUrl()

  /* Salvar URL */
  document.getElementById('btn-salvar-url').addEventListener('click', function(){
    const url = document.getElementById('api-url').value.trim().replace(/\/$/, '')
    localStorage.setItem(API_KEY, url)
    setStatus('status-conexao', 'URL salva com sucesso.', true)
  })

  /* Testar conexão */
  document.getElementById('btn-testar').addEventListener('click', async function(){
    setStatus('status-conexao', 'Testando...', true)
    try {
      const res = await fetch(getApiUrl() + '/api/testar-conexao')
      const data = await res.json()
      setStatus('status-conexao', data.mensagem, data.sucesso)
    } catch(e) {
      setStatus('status-conexao', 'Não foi possível conectar ao servidor.', false)
    }
  })

  /* Adicionar usuário */
  document.getElementById('form-add-usuario').addEventListener('submit', async function(e){
    e.preventDefault()
    const body = {
      nome:  document.getElementById('u-nome').value,
      email: document.getElementById('u-email').value,
      senha: document.getElementById('u-senha').value
    }
    try {
      const res = await fetch(getApiUrl() + '/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      setStatus('status-add', data.mensagem || 'Usuário adicionado!', data.sucesso)
      if(data.sucesso){
        document.getElementById('form-add-usuario').reset()
        carregarUsuarios()
      }
    } catch(e) {
      setStatus('status-add', 'Erro ao conectar ao servidor.', false)
    }
  })

  /* Carregar usuários */
  document.getElementById('btn-carregar').addEventListener('click', carregarUsuarios)

})

async function carregarUsuarios(){
  const container = document.getElementById('tabela-usuarios')
  container.innerHTML = '<p class="dev-desc">Carregando...</p>'
  try {
    const res = await fetch(getApiUrl() + '/api/usuarios')
    const data = await res.json()
    if(!data.sucesso || data.usuarios.length === 0){
      container.innerHTML = '<p class="dev-desc">Nenhum usuário cadastrado.</p>'
      return
    }
    let html = `<table class="dev-table">
      <thead><tr>
        <th>ID</th><th>Nome</th><th>E-mail</th><th>Criado em</th><th></th>
      </tr></thead><tbody>`
    data.usuarios.forEach(function(u){
      html += `<tr>
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
        <td><button class="dev-btn dev-btn-danger dev-btn-sm" onclick="deletarUsuario(${u.id})">Excluir</button></td>
      </tr>`
    })
    html += '</tbody></table>'
    container.innerHTML = html
  } catch(e) {
    container.innerHTML = '<p class="dev-desc">Erro ao carregar usuários.</p>'
  }
}

async function deletarUsuario(id){
  if(!confirm('Excluir este usuário?')) return
  try {
    await fetch(getApiUrl() + '/api/usuarios/' + id, { method: 'DELETE' })
    carregarUsuarios()
  } catch(e) {
    alert('Erro ao excluir usuário.')
  }
}

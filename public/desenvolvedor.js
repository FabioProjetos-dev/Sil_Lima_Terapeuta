/* Admin check */
if(localStorage.getItem('sl_usuario_tipo') !== 'admin'){
  window.location.href = 'index.html'
}

const API_KEY = 'sl_api_url'

const SLOTS = [
  { id: 'img1',   label: 'Foto — Seção "Quem sou eu"',     fallback: 'images/img1.jpeg' },
  { id: 'img3',   label: 'Foto — Seção "Depoimentos"',      fallback: 'images/img3.jpeg' },
  { id: 'fundo1', label: 'Imagem de Fundo (Sobre e Vídeo)', fallback: 'images/fundo1.png' }
]

function getApiUrl(){
  return localStorage.getItem(API_KEY) || 'http://localhost:3000'
}

function setStatus(id, msg, sucesso){
  const el = document.getElementById(id)
  if(!el) return
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
      senha: document.getElementById('u-senha').value,
      tipo:  document.getElementById('u-tipo').value
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

  /* Renderizar slots de imagem */
  renderizarSlots()

})

/* ================================
   USUÁRIOS
   ================================ */

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
        <th>ID</th><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Criado em</th><th></th>
      </tr></thead><tbody>`
    data.usuarios.forEach(function(u){
      const cor = u.tipo === 'admin' ? '#C98B73' : '#7A9E7E'
      html += `<tr>
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td><span style="background:${cor};color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold">${u.tipo}</span></td>
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

/* ================================
   IMAGENS
   ================================ */

function renderizarSlots(){
  const container = document.getElementById('dev-slots')
  container.innerHTML = SLOTS.map(function(slot){
    return `
    <div class="dev-slot" id="slot-${slot.id}">
      <div class="dev-slot-preview">
        <img
          src="${getApiUrl()}/api/imagens/${slot.id}"
          onerror="this.src='${slot.fallback}'"
          alt="${slot.label}"
        >
      </div>
      <div class="dev-slot-info">
        <p class="dev-slot-label">${slot.label}</p>
        <p class="dev-slot-id">slot: <code>${slot.id}</code></p>
        <div class="dev-form-row" style="margin-top:10px">
          <input type="file" id="file-${slot.id}" accept="image/*" style="flex:1;padding:8px">
          <button class="dev-btn dev-btn-sm" onclick="uploadImagem('${slot.id}')">Upload</button>
          <button class="dev-btn dev-btn-danger dev-btn-sm" onclick="excluirImagem('${slot.id}')">Remover</button>
        </div>
        <p class="dev-status" id="status-img-${slot.id}"></p>
      </div>
    </div>`
  }).join('')
}

async function uploadImagem(slotId){
  const input = document.getElementById('file-' + slotId)
  if(!input.files || !input.files[0]){
    setStatus('status-img-' + slotId, 'Selecione um arquivo primeiro.', false)
    return
  }
  const formData = new FormData()
  formData.append('imagem', input.files[0])
  setStatus('status-img-' + slotId, 'Enviando...', true)
  try {
    const res = await fetch(getApiUrl() + '/api/imagens/' + slotId, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    setStatus('status-img-' + slotId, data.sucesso ? 'Imagem salva com sucesso!' : data.mensagem, data.sucesso)
    if(data.sucesso){
      const img = document.querySelector('#slot-' + slotId + ' img')
      img.src = getApiUrl() + '/api/imagens/' + slotId + '?t=' + Date.now()
      input.value = ''
    }
  } catch(e) {
    setStatus('status-img-' + slotId, 'Erro ao enviar imagem.', false)
  }
}

async function excluirImagem(slotId){
  if(!confirm('Remover imagem do banco? O site usará o arquivo local como fallback.')) return
  try {
    await fetch(getApiUrl() + '/api/imagens/' + slotId, { method: 'DELETE' })
    const slot = SLOTS.find(function(s){ return s.id === slotId })
    const img = document.querySelector('#slot-' + slotId + ' img')
    img.src = slot ? slot.fallback : ''
    setStatus('status-img-' + slotId, 'Imagem removida. Usando arquivo local.', true)
  } catch(e) {
    alert('Erro ao remover imagem.')
  }
}

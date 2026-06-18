/* Admin check */
if(localStorage.getItem('sl_usuario_tipo') !== 'admin'){
  window.location.href = 'index.html'
}

const apiUrl = localStorage.getItem('sl_api_url') || ''
let editandoId = null
let secoesData = []

function setStatus(msg, sucesso){
  const el = document.getElementById('status-secao')
  el.textContent = msg
  el.style.color = sucesso ? '#7A9E7E' : '#C98B73'
}

function atualizarUrlRow(){
  const tipo = document.getElementById('secao-tipo').value
  document.getElementById('url-row').style.display =
    (tipo === 'pdf' || tipo === 'video') ? 'block' : 'none'
}

document.addEventListener('DOMContentLoaded', function(){

  document.getElementById('secao-tipo').addEventListener('change', atualizarUrlRow)

  /* Salvar / Atualizar seção */
  document.getElementById('form-secao').addEventListener('submit', async function(e){
    e.preventDefault()
    const tipo = document.getElementById('secao-tipo').value
    const body = {
      titulo:   document.getElementById('secao-titulo').value,
      tipo,
      conteudo: document.getElementById('secao-conteudo').value || null,
      url:      (tipo !== 'texto') ? document.getElementById('secao-url').value || null : null,
      ordem:    parseInt(document.getElementById('secao-ordem').value) || 0
    }
    try {
      const endpoint = editandoId
        ? apiUrl + '/api/secoes/' + editandoId
        : apiUrl + '/api/secoes'
      const method = editandoId ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if(data.sucesso){
        setStatus(editandoId ? 'Seção atualizada com sucesso!' : 'Seção criada com sucesso!', true)
        cancelarEdicao()
        carregarSecoes()
      } else {
        setStatus(data.mensagem || 'Erro ao salvar.', false)
      }
    } catch(e){
      setStatus('Erro ao conectar ao servidor.', false)
    }
  })

  document.getElementById('btn-cancelar').addEventListener('click', cancelarEdicao)
  document.getElementById('btn-recarregar').addEventListener('click', carregarSecoes)

  carregarSecoes()
})

function cancelarEdicao(){
  editandoId = null
  document.getElementById('form-secao').reset()
  document.getElementById('secao-id').value = ''
  document.getElementById('url-row').style.display = 'none'
  document.getElementById('cfg-form-titulo').textContent = 'Nova Seção — Página Ajuda'
  document.getElementById('btn-salvar-secao').textContent = 'Salvar Seção'
  document.getElementById('btn-cancelar').style.display = 'none'
  setStatus('', true)
}

function editarSecao(id){
  const s = secoesData.find(function(sec){ return sec.id === id })
  if(!s) return

  editandoId = s.id
  document.getElementById('secao-id').value = s.id
  document.getElementById('secao-titulo').value = s.titulo
  document.getElementById('secao-tipo').value = s.tipo
  document.getElementById('secao-conteudo').value = s.conteudo || ''
  document.getElementById('secao-url').value = s.url || ''
  document.getElementById('secao-ordem').value = s.ordem
  atualizarUrlRow()

  document.getElementById('cfg-form-titulo').textContent = 'Editando: ' + s.titulo
  document.getElementById('btn-salvar-secao').textContent = 'Atualizar'
  document.getElementById('btn-cancelar').style.display = 'inline-block'
  setStatus('', true)

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function excluirSecao(id){
  if(!confirm('Excluir esta seção?')) return
  try {
    await fetch(apiUrl + '/api/secoes/' + id, { method: 'DELETE' })
    carregarSecoes()
  } catch(e){
    alert('Erro ao excluir seção.')
  }
}

const BADGE = { texto: '#7A9E7E', pdf: '#C98B73', video: '#3E4348' }

async function carregarSecoes(){
  const container = document.getElementById('lista-secoes')
  container.innerHTML = '<p class="dev-desc">Carregando...</p>'
  try {
    const res = await fetch(apiUrl + '/api/secoes')
    const data = await res.json()
    if(!data.sucesso || data.secoes.length === 0){
      container.innerHTML = '<p class="dev-desc">Nenhuma seção cadastrada ainda.</p>'
      secoesData = []
      return
    }
    secoesData = data.secoes
    let html = `<table class="dev-table">
      <thead><tr>
        <th>Ordem</th><th>Título</th><th>Tipo</th><th>Criado em</th><th></th>
      </tr></thead><tbody>`
    secoesData.forEach(function(s){
      const cor = BADGE[s.tipo] || '#888'
      html += `<tr>
        <td style="text-align:center">${s.ordem}</td>
        <td>${s.titulo}</td>
        <td>
          <span style="background:${cor};color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:uppercase">
            ${s.tipo}
          </span>
        </td>
        <td>${new Date(s.criado_em).toLocaleDateString('pt-BR')}</td>
        <td>
          <div style="display:flex;gap:8px">
            <button class="dev-btn dev-btn-sm" onclick="editarSecao(${s.id})">Editar</button>
            <button class="dev-btn dev-btn-danger dev-btn-sm" onclick="excluirSecao(${s.id})">Excluir</button>
          </div>
        </td>
      </tr>`
    })
    html += '</tbody></table>'
    container.innerHTML = html
  } catch(e){
    container.innerHTML = '<p class="dev-desc">Erro ao carregar seções.</p>'
  }
}

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
  const mostrarUrl = tipo === 'pdf' || tipo === 'video'
  document.getElementById('url-row').style.display = mostrarUrl ? 'block' : 'none'
  document.getElementById('pdf-arquivo-row').style.display = tipo === 'pdf' ? 'block' : 'none'

  const urlInput = document.getElementById('secao-url')
  if(tipo === 'pdf'){
    urlInput.placeholder = 'URL de um PDF externo (opcional se fizer upload abaixo)'
  } else {
    urlInput.placeholder = 'Link do YouTube'
  }
}

document.addEventListener('DOMContentLoaded', function(){

  document.getElementById('secao-tipo').addEventListener('change', atualizarUrlRow)

  /* Salvar / Atualizar seção */
  document.getElementById('form-secao').addEventListener('submit', async function(e){
    e.preventDefault()
    const tipo      = document.getElementById('secao-tipo').value
    const titulo    = document.getElementById('secao-titulo').value
    const conteudo  = document.getElementById('secao-conteudo').value || ''
    const url       = document.getElementById('secao-url').value || ''
    const ordem     = parseInt(document.getElementById('secao-ordem').value) || 0
    const arquivo   = document.getElementById('secao-arquivo')
    const temArquivo = tipo === 'pdf' && arquivo && arquivo.files[0]

    try {
      const endpoint = editandoId
        ? apiUrl + '/api/secoes/' + editandoId
        : apiUrl + '/api/secoes'
      const method = editandoId ? 'PUT' : 'POST'

      let res
      if(temArquivo){
        const formData = new FormData()
        formData.append('titulo', titulo)
        formData.append('tipo', tipo)
        formData.append('conteudo', conteudo)
        formData.append('ordem', ordem)
        formData.append('arquivo', arquivo.files[0])
        res = await fetch(endpoint, { method, body: formData })
      } else {
        res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, tipo, conteudo: conteudo || null, url: url || null, ordem })
        })
      }

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

  /* Editor de textos */
  renderizarEditorTextos()
  carregarTextosSite()

  document.getElementById('textos-editor').addEventListener('click', async function(e){
    const btn = e.target.closest('button[data-grupo]')
    if(!btn) return
    await salvarGrupoTexto(btn.dataset.grupo, btn)
  })

})

/* ================================
   SEÇÕES
   ================================ */

function cancelarEdicao(){
  editandoId = null
  document.getElementById('form-secao').reset()
  document.getElementById('secao-id').value = ''
  document.getElementById('url-row').style.display = 'none'
  document.getElementById('pdf-arquivo-row').style.display = 'none'
  document.getElementById('arquivo-info').textContent = ''
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

  document.getElementById('arquivo-info').textContent =
    s.tem_arquivo ? '✓ Arquivo PDF carregado no banco. Selecione um novo arquivo para substituí-lo.' : ''

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
        <th>Ordem</th><th>Título</th><th>Tipo</th><th>Arquivo</th><th>Criado em</th><th></th>
      </tr></thead><tbody>`
    secoesData.forEach(function(s){
      const cor = BADGE[s.tipo] || '#888'
      const arquivoBadge = s.tem_arquivo
        ? `<span style="background:#7A9E7E;color:white;padding:2px 8px;border-radius:20px;font-size:11px">PDF ✓</span>`
        : `<span style="color:#bbb;font-size:13px">—</span>`
      html += `<tr>
        <td style="text-align:center">${s.ordem}</td>
        <td>${s.titulo}</td>
        <td>
          <span style="background:${cor};color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:uppercase">
            ${s.tipo}
          </span>
        </td>
        <td>${arquivoBadge}</td>
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


/* ================================
   TEXTOS DO SITE
   ================================ */

const GRUPOS_TEXTO = [
  {
    id: 'hero',
    label: '🌵 Hero — Banner Principal',
    campos: [
      { chave: 'hero_titulo',    label: 'Título',         tipo: 'input'    },
      { chave: 'hero_descricao', label: 'Parágrafo',      tipo: 'textarea' },
      { chave: 'hero_cta',       label: 'Botão CTA',      tipo: 'input'    }
    ]
  },
  {
    id: 'sobre',
    label: '🌿 Quem Sou Eu',
    campos: [
      { chave: 'sobre_titulo',   label: 'Título',         tipo: 'input'    },
      { chave: 'sobre_p1',       label: 'Parágrafo 1',    tipo: 'textarea' },
      { chave: 'sobre_p2',       label: 'Parágrafo 2',    tipo: 'textarea' },
      { chave: 'sobre_p3',       label: 'Parágrafo 3',    tipo: 'textarea' },
      { chave: 'sobre_p4',       label: 'Parágrafo 4',    tipo: 'textarea' },
      { chave: 'sobre_destaque', label: 'Destaque',       tipo: 'input'    }
    ]
  },
  {
    id: 'areas',
    label: '🌱 Atendimento — Cards',
    campos: [
      { chave: 'areas_titulo',  label: 'Título da seção', tipo: 'input'    },
      { chave: 'card1_titulo',  label: 'Card 1 — Título', tipo: 'input'    },
      { chave: 'card1_texto',   label: 'Card 1 — Texto',  tipo: 'textarea' },
      { chave: 'card2_titulo',  label: 'Card 2 — Título', tipo: 'input'    },
      { chave: 'card2_texto',   label: 'Card 2 — Texto',  tipo: 'textarea' },
      { chave: 'card3_titulo',  label: 'Card 3 — Título', tipo: 'input'    },
      { chave: 'card3_texto',   label: 'Card 3 — Texto',  tipo: 'textarea' },
      { chave: 'card4_titulo',  label: 'Card 4 — Título', tipo: 'input'    },
      { chave: 'card4_texto',   label: 'Card 4 — Texto',  tipo: 'textarea' },
      { chave: 'card5_titulo',  label: 'Card 5 — Título', tipo: 'input'    },
      { chave: 'card5_texto',   label: 'Card 5 — Texto',  tipo: 'textarea' }
    ]
  },
  {
    id: 'video',
    label: '▶ Seção de Vídeo',
    campos: [
      { chave: 'video_titulo', label: 'Título da seção', tipo: 'input' }
    ]
  },
  {
    id: 'metodo',
    label: '📋 Método de Acompanhamento',
    campos: [
      { chave: 'metodo_titulo',       label: 'Título',          tipo: 'input'    },
      { chave: 'metodo_intro',        label: 'Introdução',      tipo: 'textarea' },
      { chave: 'metodo_subtitulo',    label: 'Subtítulo',       tipo: 'input'    },
      { chave: 'metodo_li1',          label: 'Item 1',          tipo: 'input'    },
      { chave: 'metodo_li2',          label: 'Item 2',          tipo: 'input'    },
      { chave: 'metodo_li3',          label: 'Item 3',          tipo: 'input'    },
      { chave: 'metodo_li4',          label: 'Item 4',          tipo: 'input'    },
      { chave: 'metodo_li5',          label: 'Item 5',          tipo: 'input'    },
      { chave: 'metodo_li6',          label: 'Item 6',          tipo: 'input'    },
      { chave: 'metodo_encerramento', label: 'Encerramento',    tipo: 'textarea' }
    ]
  },
  {
    id: 'historia',
    label: '🌵 História — Florescer no Árido',
    campos: [
      { chave: 'historia_titulo',   label: 'Título',       tipo: 'input'    },
      { chave: 'historia_p1',       label: 'Parágrafo 1',  tipo: 'textarea' },
      { chave: 'historia_p2',       label: 'Parágrafo 2',  tipo: 'textarea' },
      { chave: 'historia_p3',       label: 'Parágrafo 3',  tipo: 'textarea' },
      { chave: 'historia_p4',       label: 'Parágrafo 4',  tipo: 'textarea' },
      { chave: 'historia_p5',       label: 'Parágrafo 5',  tipo: 'textarea' },
      { chave: 'historia_p6',       label: 'Parágrafo 6',  tipo: 'textarea' },
      { chave: 'historia_destaque', label: 'Destaque',     tipo: 'input'    }
    ]
  },
  {
    id: 'depoimentos',
    label: '💬 Depoimentos',
    campos: [
      { chave: 'dep_titulo', label: 'Título',         tipo: 'input'    },
      { chave: 'dep1',       label: 'Depoimento 1',   tipo: 'textarea' },
      { chave: 'dep2',       label: 'Depoimento 2',   tipo: 'textarea' },
      { chave: 'dep3',       label: 'Depoimento 3',   tipo: 'textarea' }
    ]
  },
  {
    id: 'chamada',
    label: '📣 Chamada Final',
    campos: [
      { chave: 'chamada_titulo',    label: 'Título',     tipo: 'input'    },
      { chave: 'chamada_descricao', label: 'Descrição',  tipo: 'textarea' },
      { chave: 'chamada_cta',       label: 'Botão CTA',  tipo: 'input'    }
    ]
  },
  {
    id: 'contato',
    label: '📩 Contato',
    campos: [
      { chave: 'contato_titulo', label: 'Título da seção', tipo: 'input' }
    ]
  }
]

function renderizarEditorTextos(){
  const container = document.getElementById('textos-editor')
  let html = ''
  GRUPOS_TEXTO.forEach(function(grupo){
    html += `<details class="texto-grupo">
      <summary class="texto-grupo-summary">${grupo.label}</summary>
      <div class="texto-grupo-body">`

    grupo.campos.forEach(function(campo){
      if(campo.tipo === 'textarea'){
        html += `<div class="texto-campo">
          <label class="texto-label">${campo.label}</label>
          <textarea class="cfg-textarea texto-input" data-chave="${campo.chave}" rows="3"></textarea>
        </div>`
      } else {
        html += `<div class="texto-campo">
          <label class="texto-label">${campo.label}</label>
          <input type="text" class="texto-input texto-input-linha" data-chave="${campo.chave}">
        </div>`
      }
    })

    html += `<div style="margin-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <button class="dev-btn dev-btn-sm" data-grupo="${grupo.id}">Salvar</button>
        <span class="dev-status" id="status-texto-${grupo.id}"></span>
      </div>
    </div></details>`
  })
  container.innerHTML = html
}

function preencherCamposTexto(textos){
  document.querySelectorAll('.texto-input[data-chave]').forEach(function(el){
    const chave = el.getAttribute('data-chave')
    if(textos[chave] !== undefined) el.value = textos[chave]
  })
}

async function carregarTextosSite(){
  try {
    const res = await fetch(apiUrl + '/api/textos')
    const data = await res.json()
    if(data.sucesso) preencherCamposTexto(data.textos)
  } catch(e){}
}

async function salvarGrupoTexto(grupoId, btn){
  const grupo = GRUPOS_TEXTO.find(function(g){ return g.id === grupoId })
  if(!grupo) return

  const textos = {}
  grupo.campos.forEach(function(campo){
    const el = document.querySelector('.texto-input[data-chave="' + campo.chave + '"]')
    if(el && el.value.trim()) textos[campo.chave] = el.value.trim()
  })

  const status = document.getElementById('status-texto-' + grupoId)
  btn.disabled = true
  btn.textContent = 'Salvando...'

  try {
    const res = await fetch(apiUrl + '/api/textos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textos })
    })
    const data = await res.json()
    status.textContent = data.sucesso ? '✓ Salvo com sucesso!' : (data.mensagem || 'Erro ao salvar.')
    status.style.color = data.sucesso ? '#7A9E7E' : '#C98B73'
  } catch(e){
    status.textContent = 'Erro ao conectar ao servidor.'
    status.style.color = '#C98B73'
  } finally {
    btn.disabled = false
    btn.textContent = 'Salvar'
    setTimeout(function(){ status.textContent = '' }, 3000)
  }
}

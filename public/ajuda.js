const apiUrl = localStorage.getItem('sl_api_url') || ''

/* Mostrar link de configurações para admins */
document.addEventListener('DOMContentLoaded', function(){
  if(localStorage.getItem('sl_usuario_tipo') === 'admin'){
    document.querySelectorAll('.nav-admin').forEach(function(el){
      el.style.display = 'inline'
    })
  }
})

function extrairYoutubeId(url){
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function renderSecao(s){
  let corpo = ''

  if(s.tipo === 'texto'){
    corpo = `<p class="ajuda-texto">${s.conteudo ? s.conteudo.replace(/\n/g,'<br>') : ''}</p>`

  } else if(s.tipo === 'pdf'){
    const pdfHref = s.tem_arquivo
      ? (apiUrl + '/api/secoes/' + s.id + '/arquivo')
      : s.url
    corpo = `
      ${s.conteudo ? `<p class="ajuda-descricao">${s.conteudo}</p>` : ''}
      ${pdfHref ? `<a href="${pdfHref}" target="_blank" class="ajuda-btn-pdf" download>📄 Baixar PDF</a>` : ''}`

  } else if(s.tipo === 'video'){
    const id = s.url ? extrairYoutubeId(s.url) : null
    corpo = `
      ${s.conteudo ? `<p class="ajuda-descricao">${s.conteudo}</p>` : ''}
      ${id
        ? `<div class="ajuda-video-box">
             <iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>
           </div>`
        : `<a href="${s.url}" target="_blank" class="ajuda-link-video">▶ Assistir vídeo</a>`
      }`
  }

  return `
  <article class="ajuda-card">
    <div class="ajuda-card-header">
      <span class="ajuda-tipo-badge ajuda-tipo-${s.tipo}">${s.tipo}</span>
      <h3>${s.titulo}</h3>
    </div>
    <div class="ajuda-card-body">
      ${corpo}
    </div>
  </article>`
}

async function carregarSecoes(){
  const container = document.getElementById('ajuda-conteudo')
  try {
    const res = await fetch(apiUrl + '/api/secoes')
    const data = await res.json()
    if(!data.sucesso || data.secoes.length === 0){
      container.innerHTML = '<p class="ajuda-vazio">Nenhum conteúdo disponível no momento.</p>'
      return
    }
    container.innerHTML = data.secoes.map(renderSecao).join('')
  } catch(e){
    container.innerHTML = '<p class="ajuda-vazio">Erro ao carregar conteúdo.</p>'
  }
}

document.addEventListener('DOMContentLoaded', carregarSecoes)

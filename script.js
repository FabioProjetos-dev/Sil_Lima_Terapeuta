/* ================================
   SCROLL SUAVE
   ================================ */

function scrollToContato(){
  document.getElementById("contato").scrollIntoView({ behavior:"smooth" })
}


/* ================================
   SLIDER DEPOIMENTOS
   ================================ */

let slideIndex = 0
const slides = document.querySelectorAll(".slide")

function showSlide(){
  slides.forEach(function(s){ s.classList.remove("active") })
  if(slides[slideIndex]) slides[slideIndex].classList.add("active")
  slideIndex = (slideIndex + 1) % slides.length
}

if(slides.length) setInterval(showSlide, 4000)


/* ================================
   ANIMAÇÃO AO ROLAR
   ================================ */

function revealOnScroll(){
  document.querySelectorAll(".reveal").forEach(function(el){
    if(el.getBoundingClientRect().top < window.innerHeight - 150){
      el.classList.add("active")
    }
  })
}

window.addEventListener("scroll", revealOnScroll)
document.addEventListener("DOMContentLoaded", revealOnScroll)


/* ================================
   TEXTOS DINÂMICOS DO SITE
   ================================ */

;(function carregarTextos(){
  fetch('/api/textos')
    .then(function(res){ return res.json() })
    .then(function(data){
      if(!data.sucesso) return
      var textos = data.textos

      // Textos dinâmicos
      Object.keys(textos).forEach(function(chave){
        document.querySelectorAll('[data-texto="' + chave + '"]').forEach(function(el){
          el.textContent = textos[chave]
        })
      })

      // Links de redes sociais (data-url)
      var algumSocial = false
      document.querySelectorAll('[data-url]').forEach(function(el){
        var chave = el.getAttribute('data-url')
        if(textos[chave]){
          el.href = textos[chave]
          el.style.display = 'inline-flex'
          algumSocial = true
        }
      })
      if(algumSocial){
        var container = document.getElementById('sobre-social')
        if(container) container.style.display = 'flex'
      }
    })
    .catch(function(){})
})()


/* ================================
   FOTOS DO BANCO
   Carrega a imagem local primeiro (rápido, sem esperar banco de dados)
   e só troca pela versão do banco se o admin tiver enviado uma.
   ================================ */

document.querySelectorAll('img[data-slot]').forEach(function(img){
  var slot = img.getAttribute('data-slot')
  var dbImg = new Image()
  dbImg.onload = function(){ img.src = '/api/imagens/' + slot }
  dbImg.src = '/api/imagens/' + slot
})


/* ================================
   CHATBOT (carregado após login)
   ================================ */

function carregarChatbot(){
  const atual = document.getElementById("chatbot-config")
  if(atual) atual.remove()
  const s2 = document.createElement("script")
  s2.id = "chatbot-config"
  s2.src = "https://files.bpcontent.cloud/2025/11/19/11/20251119114535-JHDSPSER.js"
  s2.defer = true
  document.body.appendChild(s2)
}


/* ================================
   SESSÃO: expira depois de 24h
   ================================ */

const SESSAO_DURACAO_MS = 24 * 60 * 60 * 1000

function sessaoExpirada(){
  const login = parseInt(localStorage.getItem("sl_login_time") || "0", 10)
  return (Date.now() - login) > SESSAO_DURACAO_MS
}

function encerrarSessaoSeExpirada(){
  if(localStorage.getItem("sl_usuario_nome") && sessaoExpirada()){
    localStorage.removeItem("sl_usuario_nome")
    localStorage.removeItem("sl_usuario_tipo")
    localStorage.removeItem("sl_usuario_email")
    localStorage.removeItem("sl_login_time")
  }
}


/* ================================
   NAV: visibilidade por tipo de usuário
   ================================ */

function aplicarEstadoNav(){
  encerrarSessaoSeExpirada()

  const nome = localStorage.getItem("sl_usuario_nome")
  const tipo = localStorage.getItem("sl_usuario_tipo")
  const btnAbrir = document.getElementById("btn-abrir-login")

  if(nome && btnAbrir){
    btnAbrir.textContent = "Olá, " + nome.split(" ")[0]
  }

  document.querySelectorAll(".nav-logado").forEach(function(el){
    el.style.display = nome ? "inline" : "none"
  })

  document.querySelectorAll(".nav-admin").forEach(function(el){
    el.style.display = (tipo === "admin") ? "inline" : "none"
  })
}


/* ================================
   MODAL AUTH + FORM CONTATO
   ================================ */

document.addEventListener("DOMContentLoaded", function(){

  /* Restaurar estado de login ao carregar a página */
  aplicarEstadoNav()

  /* ================================
     HAMBURGER MENU
     ================================ */

  const hamburger = document.getElementById("hamburger")
  const navMenu   = document.getElementById("nav-menu")

  if(hamburger && navMenu){

    hamburger.addEventListener("click", function(){
      hamburger.classList.toggle("ativo")
      navMenu.classList.toggle("ativo")
      document.body.style.overflow =
        navMenu.classList.contains("ativo") ? "hidden" : ""
    })

    navMenu.querySelectorAll("a").forEach(function(link){
      link.addEventListener("click", function(){
        hamburger.classList.remove("ativo")
        navMenu.classList.remove("ativo")
        document.body.style.overflow = ""
      })
    })

  }

  /* --- Modal --- */
  const modalOverlay = document.getElementById("modal-auth")
  const btnAbrir     = document.getElementById("btn-abrir-login")
  const btnFechar    = document.getElementById("modal-fechar")
  const formLogin    = document.getElementById("form-login")
  const erroEl       = document.getElementById("login-erro")

  if(!modalOverlay) return

  btnAbrir.addEventListener("click", function(){
    modalOverlay.classList.add("ativo")
  })

  btnFechar.addEventListener("click", function(){
    modalOverlay.classList.remove("ativo")
    erroEl.textContent = ""
  })

  modalOverlay.addEventListener("click", function(e){
    if(e.target === modalOverlay){
      modalOverlay.classList.remove("ativo")
      erroEl.textContent = ""
    }
  })

  formLogin.addEventListener("submit", async function(e){
    e.preventDefault()
    erroEl.textContent = ""

    const email  = document.getElementById("login-email").value
    const senha  = document.getElementById("login-senha").value

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      })
      const data = await res.json()

      if(data.sucesso){
        localStorage.setItem("sl_usuario_nome",  data.usuario.nome)
        localStorage.setItem("sl_usuario_tipo",  data.usuario.tipo)
        localStorage.setItem("sl_usuario_email", data.usuario.email)
        localStorage.setItem("sl_login_time",    Date.now().toString())
        modalOverlay.classList.remove("ativo")
        aplicarEstadoNav()
        carregarChatbot()
      } else {
        erroEl.textContent = data.mensagem || "E-mail ou senha inválidos."
      }
    } catch(err){
      erroEl.textContent = "Erro ao conectar ao servidor."
    }
  })

  /* --- Form contato WhatsApp --- */
  const formContato = document.getElementById("form-contato")
  if(formContato){
    formContato.addEventListener("submit", function(e){
      e.preventDefault()
      const nome     = document.getElementById("nome").value
      const email    = document.getElementById("email").value
      const mensagem = document.getElementById("mensagem").value
      let texto = `Olá, sou ${nome} e gostaria de ter mais detalhes sobre as sessões.\nEmail: ${email}`
      if(mensagem) texto += `\nMensagem: ${mensagem}`
      window.location.href = `https://wa.me/553197223852?text=${encodeURIComponent(texto)}`
    })
  }

})

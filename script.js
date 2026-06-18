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


/* ================================
   IMAGENS DE FUNDO DO BANCO
   ================================ */

;(function aplicarImagensFundo(){
  const alvos = ['.imagem-fundo', '.video-section']
  const img = new Image()
  img.onload = function(){
    alvos.forEach(function(sel){
      const el = document.querySelector(sel)
      if(el) el.style.backgroundImage = 'url(/api/imagens/fundo1)'
    })
  }
  img.onerror = function(){
    alvos.forEach(function(sel){
      const el = document.querySelector(sel)
      if(el) el.style.backgroundImage = 'url(images/fundo1.png)'
    })
  }
  img.src = '/api/imagens/fundo1'
})()


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
   NAV: visibilidade por tipo de usuário
   ================================ */

function aplicarEstadoNav(){
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
    const apiUrl = localStorage.getItem("sl_api_url") || ""

    try {
      const res = await fetch(apiUrl + "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha })
      })
      const data = await res.json()

      if(data.sucesso){
        localStorage.setItem("sl_usuario_nome",  data.usuario.nome)
        localStorage.setItem("sl_usuario_tipo",  data.usuario.tipo)
        localStorage.setItem("sl_usuario_email", data.usuario.email)
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
      const texto    = `Olá, meu nome é ${nome}.\nEmail: ${email}.\nMensagem: ${mensagem}`
      window.open(`https://wa.me/553197223852?text=${encodeURIComponent(texto)}`, "_blank")
    })
  }

})

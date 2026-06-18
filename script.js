function scrollToContato(){

document
.getElementById("contato")
.scrollIntoView({
behavior:"smooth"
})

}



/* slider depoimentos */

let index = 0

const slides =
document.querySelectorAll(".slide")

function showSlide(){

slides.forEach(s =>
s.classList.remove("active")
)

slides[index].classList.add("active")

index++

if(index >= slides.length){
index = 0
}

}

setInterval(showSlide,4000)



/* animação ao rolar */

function revealOnScroll(){

const reveals =
document.querySelectorAll(".reveal")

for(let i=0;i<reveals.length;i++){

const windowHeight =
window.innerHeight

const elementTop =
reveals[i]
.getBoundingClientRect().top

const elementVisible = 150

if(elementTop < windowHeight - elementVisible){

reveals[i].classList.add("active")

}

}

}

window.addEventListener("scroll", revealOnScroll)



/* ================================
   CHATBOT (carregado após login)
   ================================ */

function carregarChatbot(){

const atual = document.getElementById("chatbot-config")
if(atual){ atual.remove() }

const s2 = document.createElement("script")
s2.id = "chatbot-config"
s2.src = "https://files.bpcontent.cloud/2025/11/19/11/20251119114535-JHDSPSER.js"
s2.defer = true
document.body.appendChild(s2)

}



/* ================================
   MODAL AUTH
   ================================ */

document.addEventListener("DOMContentLoaded", function(){

const modalOverlay = document.getElementById("modal-auth")
const btnAbrir     = document.getElementById("btn-abrir-login")
const btnFechar    = document.getElementById("modal-fechar")
const formLogin    = document.getElementById("form-login")
const erroEl       = document.getElementById("login-erro")

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

  const email = document.getElementById("login-email").value
  const senha = document.getElementById("login-senha").value
  const apiUrl = localStorage.getItem("sl_api_url") || "http://localhost:3000"

  try {
    const res = await fetch(apiUrl + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    })
    const data = await res.json()

    if(data.sucesso){
      modalOverlay.classList.remove("ativo")
      btnAbrir.textContent = "Olá, " + data.usuario.nome.split(" ")[0]
      carregarChatbot()
    } else {
      erroEl.textContent = data.mensagem || "E-mail ou senha inválidos."
    }
  } catch(err) {
    erroEl.textContent = "Erro ao conectar ao servidor."
  }
})

})



document.addEventListener("DOMContentLoaded", function(){

const form = document.getElementById("form-contato")

form.addEventListener("submit", function(e){

e.preventDefault()

const nome = document.getElementById("nome").value
const email = document.getElementById("email").value
const mensagem = document.getElementById("mensagem").value

const texto =
`Olá, meu nome é ${nome}.
Email: ${email}.
Mensagem: ${mensagem}`

const numero = "553197223852"

const url =
`https://wa.me/${numero}?text=${encodeURIComponent(texto)}`

window.open(url, "_blank")

})

})
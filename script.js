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
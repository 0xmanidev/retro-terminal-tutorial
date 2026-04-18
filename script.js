const bootBtn=document.getElementById("bootBtn");
const boot=document.getElementById("boot");
const desktop= document.getElementById("desktop")



let cwd =["home","user"];
function startOS(){
    bootBtn.style.display='none';
    boot.style.display='block';
    renderPrompt();
}
function renderPrompt(){
    prompt.textContent = "user@computer:/"+ cwd.join("/")+"$";
}
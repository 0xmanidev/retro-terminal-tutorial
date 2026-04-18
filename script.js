const bootBtn=document.getElementById("bootBtn");
const boot=document.getElementById("boot");
const desktop= document.getElementById("desktop")



let cwd =["home","user"];
function startOS(){
    document.getElementById("boot").style.display='none';
    document.getElementById("desktop").style.display='block';
    renderPrompt();
}
function renderPrompt(){
    prompt.textContent = "user@computer:/"+ cwd.join("/")+"$";
}

let highestZ = 10;
function bringtoFront(win){
    highestZ++;
    win.style.zIndex = highestZ;
}

const allWindows = document.querySelectorAll()
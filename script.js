console.log("SCRIPT CARREGADO");

const btnCreateRoom =
document.getElementById("btnCreateRoom");

const btnJoinRoom =
document.getElementById("btnJoinRoom");

btnCreateRoom.addEventListener(
    "click",
    () => {
        alert("Botão Criar Sala funcionando");
    }
);

btnJoinRoom.addEventListener(
    "click",
    () => {
        alert("Botão Entrar funcionando");
    }
);

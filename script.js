import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// ELEMENTOS
// =========================

const homeScreen = document.getElementById("homeScreen");
const roomScreen = document.getElementById("roomScreen");
const gameScreen = document.getElementById("gameScreen");

const btnCreateRoom = document.getElementById("btnCreateRoom");
const btnJoinRoom = document.getElementById("btnJoinRoom");
const btnCopyLink = document.getElementById("btnCopyLink");

const roomCodeInput = document.getElementById("roomCode");

const roomIdLabel = document.getElementById("roomId");
const playerCountLabel = document.getElementById("playerCount");
const roomLinkInput = document.getElementById("roomLink");

const waitingMessage = document.getElementById("waitingMessage");

// =========================
// VARIÁVEIS
// =========================

let roomId = null;
let playerId = null;

// =========================
// GERAR CÓDIGO
// =========================

function generateRoomCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(let i = 0; i < 6; i++) {

        code += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );

    }

    return code;
}

// =========================
// GERAR ID JOGADOR
// =========================

function generatePlayerId() {

    return "player_" +
        Math.random()
        .toString(36)
        .substring(2, 12);

}

// =========================
// MOSTRAR TELA
// =========================

function showRoomScreen() {

    homeScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");

}

// =========================
// CRIAR SALA
// =========================

btnCreateRoom.addEventListener(
    "click",
    async () => {

        roomId = generateRoomCode();

        playerId = generatePlayerId();

        const roomRef =
            doc(db, "rooms", roomId);

        await setDoc(roomRef, {

            createdAt: Date.now(),

            status: "waiting",

            currentTurn: 1,

            players: {
                player1: playerId,
                player2: null
            }

        });

        enterRoom(roomId);

    }
);

// =========================
// ENTRAR POR CÓDIGO
// =========================

btnJoinRoom.addEventListener(
    "click",
    async () => {

        const code =
            roomCodeInput.value
            .trim()
            .toUpperCase();

        if(!code) {

            alert("Digite um código.");

            return;

        }

        joinRoom(code);

    }
);

// =========================
// ENTRAR NA SALA
// =========================

async function joinRoom(code) {

    const roomRef =
        doc(db, "rooms", code);

    const snap =
        await getDoc(roomRef);

    if(!snap.exists()) {

        alert("Sala não encontrada.");

        return;

    }

    const data = snap.data();

    if(data.players.player2) {

        alert("Sala cheia.");

        return;

    }

    playerId = generatePlayerId();

    await updateDoc(roomRef, {

        "players.player2": playerId,

        status: "playing"

    });

    enterRoom(code);

}

// =========================
// ABRIR SALA
// =========================

function enterRoom(code) {

    roomId = code;

    showRoomScreen();

    roomIdLabel.textContent =
        roomId;

    const link =

        window.location.origin +
        window.location.pathname +
        "?sala=" +
        roomId;

    roomLinkInput.value = link;

    listenRoom();

}

// =========================
// COPIAR LINK
// =========================

btnCopyLink.addEventListener(
    "click",
    () => {

        navigator.clipboard.writeText(
            roomLinkInput.value
        );

        alert(
            "Link copiado!"
        );

    }
);

// =========================
// OUVIR ALTERAÇÕES
// =========================

function listenRoom() {

    const roomRef =
        doc(db, "rooms", roomId);

    onSnapshot(
        roomRef,
        (snapshot) => {

            if(!snapshot.exists())
                return;

            const data =
                snapshot.data();

            let players = 1;

            if(
                data.players.player2
            ) {

                players = 2;

            }

            playerCountLabel.textContent =
                players + "/2";

            if(
                data.status ===
                "playing"
            ) {

                waitingMessage.innerHTML =
                    "Jogador encontrado!";

                setTimeout(() => {

                    roomScreen
                    .classList
                    .add("hidden");

                    gameScreen
                    .classList
                    .remove("hidden");

                }, 1500);

            }

        }
    );

}

// =========================
// ENTRAR POR LINK
// =========================

const params =
    new URLSearchParams(
        window.location.search
    );

const sala =
    params.get("sala");

if(sala) {

    joinRoom(
        sala.toUpperCase()
    );

}
// =========================
// TESTE TABULEIROS
// =========================

function createBoard(boardId) {

    const board =
        document.getElementById(boardId);

    if(!board) return;

    board.innerHTML = "";

    for(let row = 0; row < 10; row++) {

        for(let col = 0; col < 10; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            board.appendChild(cell);

        }

    }

}

setTimeout(() => {

    createBoard("playerBoard");
    createBoard("enemyBoard");

}, 100);

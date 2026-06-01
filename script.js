import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// LOG
// =========================
console.log("SCRIPT CARREGADO");

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

const playerBoardDiv = document.getElementById("playerBoard");
const enemyBoardDiv = document.getElementById("enemyBoard");

// =========================
// VARIÁVEIS
// =========================
let roomId = null;
let playerId = null;
let myBoard = [];
let enemyBoard = [];

// =========================
// CONFIG
// =========================
const SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2];

// =========================
// UTIL
// =========================
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function generatePlayerId() {
    return "player_" + Math.random().toString(36).substring(2, 10);
}

// =========================
// TABULEIRO
// =========================
function createBoard() {
    return Array.from({ length: SIZE }, () =>
        Array(SIZE).fill(0)
    );
}

function placeShips(board) {

    for (const size of SHIPS) {

        let placed = false;

        while (!placed) {

            const horizontal = Math.random() < 0.5;

            const row = Math.floor(Math.random() * SIZE);
            const col = Math.floor(Math.random() * SIZE);

            let canPlace = true;

            for (let i = 0; i < size; i++) {
                const r = horizontal ? row : row + i;
                const c = horizontal ? col + i : col;

                if (r >= SIZE || c >= SIZE || board[r][c] !== 0) {
                    canPlace = false;
                    break;
                }
            }

            if (!canPlace) continue;

            for (let i = 0; i < size; i++) {
                const r = horizontal ? row : row + i;
                const c = horizontal ? col + i : col;
                board[r][c] = 1;
            }

            placed = true;
        }
    }

    return board;
}

// =========================
// RENDER TABULEIRO
// =========================
function buildBoards() {

    playerBoardDiv.innerHTML = "";
    enemyBoardDiv.innerHTML = "";

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {

            const p = document.createElement("div");
            p.className = "cell";
            p.dataset.r = r;
            p.dataset.c = c;

            const e = document.createElement("div");
            e.className = "cell";
            e.dataset.r = r;
            e.dataset.c = c;

            playerBoardDiv.appendChild(p);
            enemyBoardDiv.appendChild(e);
        }
    }
}

function renderMyBoard() {

    const cells = playerBoardDiv.querySelectorAll(".cell");

    cells.forEach(cell => {

        const r = cell.dataset.r;
        const c = cell.dataset.c;

        if (myBoard[r][c] === 1) {
            cell.classList.add("ship");
        }
    });
}

// =========================
// CRIAR SALA
// =========================
btnCreateRoom.addEventListener("click", async () => {

    roomId = generateRoomCode();
    playerId = generatePlayerId();

    myBoard = placeShips(createBoard());

    await setDoc(doc(db, "rooms", roomId), {
        status: "waiting",
        players: {
            player1: playerId,
            player2: null
        },
        boards: {
            player1: JSON.stringify(myBoard),
            player2: null
        },
        turn: "player1"
    });

    showRoom();
});

// =========================
// ENTRAR SALA
// =========================
btnJoinRoom.addEventListener("click", async () => {

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) return;

    const ref = doc(db, "rooms", code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        alert("Sala não existe");
        return;
    }

    roomId = code;
    playerId = generatePlayerId();

    myBoard = placeShips(createBoard());

    await updateDoc(ref, {
        "players.player2": playerId,
        "boards.player2": JSON.stringify(myBoard),
        status: "playing"
    });

    showRoom();
});

// =========================
// MOSTRAR SALA (UI)
// =========================
function showRoom() {

    homeScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");
    gameScreen.classList.add("hidden");

    roomIdLabel.textContent = roomId;

    const link =
        window.location.origin +
        window.location.pathname +
        "?sala=" +
        roomId;

    roomLinkInput.value = link;

    buildBoards();
    renderMyBoard();

    listenRoom();
}

// =========================
// COPIAR LINK
// =========================
btnCopyLink.addEventListener("click", () => {

    navigator.clipboard.writeText(roomLinkInput.value);

    alert("Link copiado!");
});

// =========================
// LISTENER FIREBASE
// =========================
function listenRoom() {

    onSnapshot(doc(db, "rooms", roomId), (snap) => {

        const data = snap.data();
        if (!data) return;

        const players =
            data.players.player2 ? "2/2" : "1/2";

        playerCountLabel.textContent = players;

        if (data.status === "playing") {

            waitingMessage.innerText = "Jogador conectado!";
        }
    });
}

// =========================
// ENTRADA POR LINK
// =========================
const params = new URLSearchParams(window.location.search);
const sala = params.get("sala");

if (sala) {
    roomId = sala.toUpperCase();
    showRoom();
}

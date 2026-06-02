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

const playerBoardDiv = document.getElementById("playerBoard");
const enemyBoardDiv = document.getElementById("enemyBoard");

const turnText = document.getElementById("turnText");

// =========================
// VARIÁVEIS
// =========================

const BOARD_SIZE = 10;
const SHIPS = [5,4,3,3,2];

let roomId = null;
let playerId = null;
let playerRole = null;

let myBoard = [];
let enemyBoard = [];

let gameStarted = false;

// =========================
// UTILITÁRIOS
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
    return "player_" + Math.random().toString(36).substring(2, 12);
}

// =========================
// TABULEIRO
// =========================

function createEmptyBoard() {
    return Array.from({ length: BOARD_SIZE }, () =>
        Array(BOARD_SIZE).fill(0)
    );
}

function placeShipsRandomly() {
    const board = createEmptyBoard();

    for (const shipSize of SHIPS) {
        let placed = false;

        while (!placed) {
            const horizontal = Math.random() < 0.5;

            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);

            let canPlace = true;

            for (let i = 0; i < shipSize; i++) {
                const r = horizontal ? row : row + i;
                const c = horizontal ? col + i : col;

                if (
                    r >= BOARD_SIZE ||
                    c >= BOARD_SIZE ||
                    board[r][c] !== 0
                ) {
                    canPlace = false;
                    break;
                }
            }

            if (!canPlace) continue;

            for (let i = 0; i < shipSize; i++) {
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

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {

            const pCell = document.createElement("div");
            pCell.className = "cell";
            pCell.dataset.row = row;
            pCell.dataset.col = col;
            playerBoardDiv.appendChild(pCell);

            const eCell = document.createElement("div");
            eCell.className = "cell";
            eCell.dataset.row = row;
            eCell.dataset.col = col;
            enemyBoardDiv.appendChild(eCell);
        }
    }
}

function renderPlayerBoard() {
    const cells = playerBoardDiv.querySelectorAll(".cell");

    cells.forEach(cell => {
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);

        cell.className = "cell";

        if (myBoard[r][c] === 1) {
            cell.classList.add("ship");
        }
    });
}

// =========================
// GAME START
// =========================

function startGame(roomData) {

    if (gameStarted) return;
    gameStarted = true;

    console.log("🔥 JOGO INICIADO");

    homeScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    buildBoards();
    renderPlayerBoard();
    updateTurn(roomData);
}

function updateTurn(room) {
    if (!turnText) return;

    if (room.currentTurn === playerRole) {
        turnText.textContent = "Sua vez 🎯";
    } else {
        turnText.textContent = "Aguardando adversário...";
    }
}

// =========================
// CRIAR SALA
// =========================

btnCreateRoom.addEventListener("click", async () => {

    roomId = generateRoomCode();
    playerId = generatePlayerId();
    playerRole = "player1";

    myBoard = placeShipsRandomly();

    await setDoc(doc(db, "rooms", roomId), {
        createdAt: Date.now(),
        status: "waiting",
        currentTurn: "player1",
        players: {
            player1: playerId,
            player2: null
        },
        boards: {
            player1: myBoard,
            player2: null
        }
    });

    enterRoom(roomId);
});

// =========================
// ENTRAR SALA
// =========================

btnJoinRoom.addEventListener("click", async () => {

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) return;

    const roomRef = doc(db, "rooms", code);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
        alert("Sala não encontrada");
        return;
    }

    const data = snap.data();

    if (data.players.player2) {
        alert("Sala cheia");
        return;
    }

    roomId = code;
    playerId = generatePlayerId();
    playerRole = "player2";

    myBoard = placeShipsRandomly();

    await updateDoc(roomRef, {
        "players.player2": playerId,
        "boards.player2": myBoard,
        status: "playing"
    });

    enterRoom(roomId);
});

// =========================
// ENTRAR NA SALA UI
// =========================

function enterRoom(code) {

    roomId = code;

    homeScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");

    roomIdLabel.textContent = roomId;

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

btnCopyLink.addEventListener("click", () => {
    navigator.clipboard.writeText(roomLinkInput.value);
    alert("Link copiado!");
});

// =========================
// FIREBASE LISTENER
// =========================

function listenRoom() {

    const roomRef = doc(db, "rooms", roomId);

    onSnapshot(roomRef, (snapshot) => {

        if (!snapshot.exists()) return;

        const data = snapshot.data();

        let players = 1;
        if (data.players.player2) players = 2;

        playerCountLabel.textContent = players + "/2";

        if (data.status === "playing") {
            startGame(data);
        }

    });
}

// =========================
// LINK AUTO JOIN
// =========================

const params = new URLSearchParams(window.location.search);
const sala = params.get("sala");

if (sala) {
    roomCodeInput.value = sala.toUpperCase();
    btnJoinRoom.click();
}

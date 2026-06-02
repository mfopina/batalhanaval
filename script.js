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
// CONFIG
// =========================

const BOARD_SIZE = 10;
const SHIPS = [5,4,3,3,2];

let roomId = null;
let playerId = null;
let playerRole = null;

let myBoard = [];
let gameStarted = false;

// =========================
// HELPERS
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

    for (const ship of SHIPS) {
        let placed = false;

        while (!placed) {
            const horizontal = Math.random() < 0.5;
            const row = Math.floor(Math.random() * BOARD_SIZE);
            const col = Math.floor(Math.random() * BOARD_SIZE);

            let ok = true;

            for (let i = 0; i < ship; i++) {
                const r = horizontal ? row : row + i;
                const c = horizontal ? col + i : col;

                if (
                    r >= BOARD_SIZE ||
                    c >= BOARD_SIZE ||
                    board[r][c] !== 0
                ) {
                    ok = false;
                    break;
                }
            }

            if (!ok) continue;

            for (let i = 0; i < ship; i++) {
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
// RENDER
// =========================

function buildBoards() {
    playerBoardDiv.innerHTML = "";
    enemyBoardDiv.innerHTML = "";

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {

            const p = document.createElement("div");
            p.className = "cell";
            p.dataset.row = r;
            p.dataset.col = c;
            playerBoardDiv.appendChild(p);

            const e = document.createElement("div");
            e.className = "cell";
            e.dataset.row = r;
            e.dataset.col = c;
            enemyBoardDiv.appendChild(e);
        }
    }
}

function renderMyBoard() {
    const cells = playerBoardDiv.querySelectorAll(".cell");

    cells.forEach(cell => {
        const r = +cell.dataset.row;
        const c = +cell.dataset.col;

        cell.className = "cell";

        if (myBoard[r][c] === 1) {
            cell.classList.add("ship");
        }
    });
}

// =========================
// START GAME
// =========================

function startGame(room) {

    if (gameStarted) return;
    gameStarted = true;

    console.log("JOGO INICIADO");

    homeScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    buildBoards();
    renderMyBoard();
    updateTurn(room);
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
// CREATE ROOM
// =========================

btnCreateRoom.addEventListener("click", async () => {

    roomId = generateRoomCode();
    playerId = generatePlayerId();
    playerRole = "player1";

    myBoard = placeShipsRandomly();

    await setDoc(doc(db, "rooms", roomId), {
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
// JOIN ROOM
// =========================

btnJoinRoom.addEventListener("click", async () => {

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) return;

    const ref = doc(db, "rooms", code);
    const snap = await getDoc(ref);

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

    // 🔥 CORREÇÃO IMPORTANTE
    await updateDoc(ref, {
        "players.player2": playerId,
        "boards.player2": myBoard
    });

    await updateDoc(ref, {
        status: "playing"
    });

    enterRoom(roomId);
});

// =========================
// ENTER ROOM
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
// COPY LINK
// =========================

btnCopyLink.addEventListener("click", () => {
    navigator.clipboard.writeText(roomLinkInput.value);
    alert("Link copiado!");
});

// =========================
// LISTENER FIREBASE
// =========================

function listenRoom() {

    const ref = doc(db, "rooms", roomId);

    onSnapshot(ref, (snap) => {

        if (!snap.exists()) return;

        const room = snap.data();

        let players = 1;
        if (room.players.player2) players = 2;

        playerCountLabel.textContent = players + "/2";

        if (room.status === "playing") {
            startGame(room);
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

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

const SIZE = 10;
const SHIPS = [5,4,3,3,2];

let roomId = null;
let playerId = null;
let playerRole = null;

let myBoard = [];
let gameStarted = false;

// =========================
// HELPERS
// =========================

function generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function generateId() {
    return "p_" + Math.random().toString(36).substring(2, 10);
}

// =========================
// TABULEIRO
// =========================

function emptyBoard() {
    return Array.from({ length: SIZE }, () =>
        Array(SIZE).fill(0)
    );
}

function placeShips() {
    const board = emptyBoard();

    for (const ship of SHIPS) {
        let ok = false;

        while (!ok) {
            const h = Math.random() < 0.5;
            const r = Math.floor(Math.random() * SIZE);
            const c = Math.floor(Math.random() * SIZE);

            let can = true;

            for (let i = 0; i < ship; i++) {
                const rr = h ? r : r + i;
                const cc = h ? c + i : c;

                if (rr >= SIZE || cc >= SIZE || board[rr][cc]) {
                    can = false;
                    break;
                }
            }

            if (!can) continue;

            for (let i = 0; i < ship; i++) {
                const rr = h ? r : r + i;
                const cc = h ? c + i : c;
                board[rr][cc] = 1;
            }

            ok = true;
        }
    }

    return board;
}

// 🔥 FIX FIREBASE
function toSave(board) {
    return JSON.stringify(board);
}

function fromSave(data) {
    return JSON.parse(data);
}

// =========================
// RENDER
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
            playerBoardDiv.appendChild(p);

            const e = document.createElement("div");
            e.className = "cell";
            enemyBoardDiv.appendChild(e);
        }
    }
}

function renderPlayer() {
    const cells = playerBoardDiv.querySelectorAll(".cell");

    cells.forEach(cell => {
        const r = +cell.dataset.r;
        const c = +cell.dataset.c;

        cell.className = "cell";

        if (myBoard[r][c] === 1) {
            cell.classList.add("ship");
        }
    });
}

// =========================
// GAME START
// =========================

function startGame(room) {

    if (gameStarted) return;
    gameStarted = true;

    homeScreen.classList.add("hidden");
    roomScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    buildBoards();
    renderPlayer();
    updateTurn(room);
}

function updateTurn(room) {
    if (!turnText) return;

    if (room.currentTurn === playerRole) {
        turnText.textContent = "Sua vez 🎯";
    } else {
        turnText.textContent = "Aguardando...";
    }
}

// =========================
// CREATE ROOM
// =========================

btnCreateRoom.onclick = async () => {

    roomId = generateCode();
    playerId = generateId();
    playerRole = "player1";

    myBoard = placeShips();

    await setDoc(doc(db, "rooms", roomId), {
        status: "waiting",
        currentTurn: "player1",
        players: {
            player1: playerId,
            player2: null
        },
        boards: {
            player1: toSave(myBoard),
            player2: null
        }
    });

    enterRoom(roomId);
};

// =========================
// JOIN ROOM
// =========================

btnJoinRoom.onclick = async () => {

    const code = roomCodeInput.value.trim().toUpperCase();
    if (!code) return;

    const ref = doc(db, "rooms", code);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        alert("Sala não existe");
        return;
    }

    const data = snap.data();

    if (data.players.player2) {
        alert("Sala cheia");
        return;
    }

    roomId = code;
    playerId = generateId();
    playerRole = "player2";

    myBoard = placeShips();

    await updateDoc(ref, {
        "players.player2": playerId,
        "boards.player2": toSave(myBoard),
        status: "playing"
    });

    enterRoom(roomId);
};

// =========================
// ENTER ROOM
// =========================

function enterRoom(code) {

    roomId = code;

    homeScreen.classList.add("hidden");
    roomScreen.classList.remove("hidden");

    roomIdLabel.textContent = roomId;

    roomLinkInput.value =
        window.location.origin +
        window.location.pathname +
        "?sala=" +
        roomId;

    listenRoom();
}

// =========================
// COPY LINK
// =========================

btnCopyLink.onclick = () => {
    navigator.clipboard.writeText(roomLinkInput.value);
};

// =========================
// FIREBASE LISTENER
// =========================

function listenRoom() {

    const ref = doc(db, "rooms", roomId);

    onSnapshot(ref, snap => {

        if (!snap.exists()) return;

        const room = snap.data();

        let count = room.players.player2 ? 2 : 1;
        playerCountLabel.textContent = count + "/2";

        if (room.status === "playing") {

            myBoard = fromSave(room.boards[playerRole]);

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
    roomCodeInput.value = sala;
    btnJoinRoom.click();
}

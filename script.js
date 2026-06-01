import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// =========================
// CONFIGURAÇÕES
// =========================

const BOARD_SIZE = 10;

const SHIPS = [
    5,
    4,
    3,
    3,
    2
];

// =========================
// ESTADO
// =========================

let roomId = null;
let playerId = null;
let playerRole = null;

let myBoard = [];
let enemyBoard = [];

let roomData = null;

// =========================
// ELEMENTOS
// =========================

const homeScreen =
document.getElementById("homeScreen");

const roomScreen =
document.getElementById("roomScreen");

const gameScreen =
document.getElementById("gameScreen");

const btnCreateRoom =
document.getElementById("btnCreateRoom");
console.log("Botão criar:", btnCreateRoom);

const btnJoinRoom =
document.getElementById("btnJoinRoom");

const btnCopyLink =
document.getElementById("btnCopyLink");

const roomCodeInput =
document.getElementById("roomCode");

const roomIdLabel =
document.getElementById("roomId");

const playerCountLabel =
document.getElementById("playerCount");

const roomLinkInput =
document.getElementById("roomLink");

const waitingMessage =
document.getElementById("waitingMessage");

const turnText =
document.getElementById("turnText");

const gameStatus =
document.getElementById("gameStatus");

const playerBoardDiv =
document.getElementById("playerBoard");

const enemyBoardDiv =
document.getElementById("enemyBoard");

const gameLog =
document.getElementById("gameLog");

// =========================
// UTILIDADES
// =========================

function generateRoomCode() {

    const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(let i=0;i<6;i++){

        code += chars[
            Math.floor(
                Math.random() *
                chars.length
            )
        ];

    }

    return code;

}

function generatePlayerId() {

    return "player_" +

    Math.random()
    .toString(36)
    .substring(2,12);

}

function createBoard() {

    return Array.from(
        {length:BOARD_SIZE},
        ()=>Array(BOARD_SIZE).fill(0)
    );

}

function boardToString(board){

    return JSON.stringify(board);

}

function stringToBoard(text){

    return JSON.parse(text);

}

// =========================
// NAVIOS ALEATÓRIOS
// =========================

function placeShipsRandomly() {

    const board =
    createBoard();

    for(const size of SHIPS){

        let placed = false;

        while(!placed){

            const horizontal =
            Math.random() < 0.5;

            const row =
            Math.floor(
                Math.random() *
                BOARD_SIZE
            );

            const col =
            Math.floor(
                Math.random() *
                BOARD_SIZE
            );

            let canPlace =
            true;

            for(
                let i=0;
                i<size;
                i++
            ){

                const r =
                horizontal ?
                row :
                row+i;

                const c =
                horizontal ?
                col+i :
                col;

                if(
                    r >= BOARD_SIZE ||
                    c >= BOARD_SIZE ||
                    board[r][c] !== 0
                ){

                    canPlace = false;
                    break;

                }

            }

            if(!canPlace)
                continue;

            for(
                let i=0;
                i<size;
                i++
            ){

                const r =
                horizontal ?
                row :
                row+i;

                const c =
                horizontal ?
                col+i :
                col;

                board[r][c] = 1;

            }

            placed = true;

        }

    }

    return board;

}

// =========================
// DESENHAR TABULEIROS
// =========================

function buildBoards() {

    playerBoardDiv.innerHTML = "";
    enemyBoardDiv.innerHTML = "";

    for(let row=0;row<10;row++){

        for(let col=0;col<10;col++){

            const playerCell =
            document.createElement("div");

            playerCell.className =
            "cell";

            playerCell.dataset.row =
            row;

            playerCell.dataset.col =
            col;

            playerBoardDiv.appendChild(
                playerCell
            );

            const enemyCell =
            document.createElement("div");

            enemyCell.className =
            "cell";

            enemyCell.dataset.row =
            row;

            enemyCell.dataset.col =
            col;

            enemyBoardDiv.appendChild(
                enemyCell
            );

        }

    }

}

function renderPlayerBoard(){

    const cells =
    playerBoardDiv.querySelectorAll(
        ".cell"
    );

    cells.forEach(cell=>{

        const row =
        Number(
            cell.dataset.row
        );

        const col =
        Number(
            cell.dataset.col
        );

        cell.className =
        "cell";

        if(
            myBoard[row][col] === 1
        ){

            cell.classList.add(
                "ship"
            );

        }

    });

    // =========================
// ELEMENTOS DE STATUS
// =========================

const turnText =
document.getElementById("turnText");

const hitsLabel =
document.getElementById("hits");

const missesLabel =
document.getElementById("misses");

const gameStatus =
document.getElementById("gameStatus");

let hits = 0;
let misses = 0;

// =========================
// DESENHAR TABULEIRO INIMIGO
// =========================

function renderEnemyBoard(room){

    const cells =
    enemyBoardDiv.querySelectorAll(
        ".cell"
    );

    cells.forEach(cell=>{

        const row =
        Number(cell.dataset.row);

        const col =
        Number(cell.dataset.col);

        cell.onclick = null;

        cell.className =
        "cell";

        const shotKey =
        row + "_" + col;

        const myShots =
        room.shots?.[playerRole] || {};

        if(myShots[shotKey]){

            if(
                myShots[shotKey] ===
                "hit"
            ){

                cell.classList.add(
                    "hit"
                );

            }else{

                cell.classList.add(
                    "miss"
                );

            }

        }

        if(
            room.currentTurn ===
            playerRole
        ){

            if(
                !myShots[shotKey]
            ){

                cell.onclick =
                ()=>fireShot(
                    row,
                    col
                );

            }

        }

    });

}

// =========================
// DISPARAR TIRO
// =========================

async function fireShot(
    row,
    col
){

    const roomRef =
    doc(
        db,
        "rooms",
        roomId
    );

    const snap =
    await getDoc(
        roomRef
    );

    const room =
    snap.data();

    let enemyBoardData;

    if(
        playerRole ===
        "player1"
    ){

        enemyBoardData =
        JSON.parse(
            room.boards.player2
        );

    }else{

        enemyBoardData =
        JSON.parse(
            room.boards.player1
        );

    }

    const hit =

        enemyBoardData[row][col]
        === 1;

    const shotKey =
    row + "_" + col;

    const update = {};

    update[
        `shots.${playerRole}.${shotKey}`
    ] =
    hit
    ? "hit"
    : "miss";

    update.currentTurn =

        playerRole ===
        "player1"

        ? "player2"

        : "player1";

    await updateDoc(
        roomRef,
        update
    );

}

// =========================
// OUVIR JOGO
// =========================

function updateGame(room){

    if(
        room.currentTurn ===
        playerRole
    ){

        turnText.textContent =
        "Sua vez";

    }else{

        turnText.textContent =
        "Vez do adversário";

    }

    renderEnemyBoard(
        room
    );

    const myShots =
    room.shots?.[
        playerRole
    ] || {};

    hits = 0;
    misses = 0;

    Object.values(
        myShots
    ).forEach(result=>{

        if(
            result === "hit"
        ){

            hits++;

        }else{

            misses++;

        }

    });

    hitsLabel.textContent =
    hits;

    missesLabel.textContent =
    misses;

}
}


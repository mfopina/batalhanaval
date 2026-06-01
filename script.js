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

}


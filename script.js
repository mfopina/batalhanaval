import { db } from "./firebase.js";

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const BOARD_SIZE = 10;
const SHIPS = [5,4,3,3,2];

let roomId = null;
let playerId = null;
let playerRole = null;

let myBoard = [];
let enemyBoard = [];

let roomListener = null;

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

const roomLinkInput =
document.getElementById("roomLink");

const playerCountLabel =
document.getElementById("playerCount");

function generateRoomCode() {

    const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for(let i=0;i<6;i++){

        code += chars[
            Math.floor(
                Math.random()*chars.length
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

function createEmptyBoard() {

    return Array.from(
        {length: BOARD_SIZE},
        () => Array(BOARD_SIZE).fill(0)
    );

}

function placeShipsRandomly() {

    const board =
    createEmptyBoard();

    for(const shipSize of SHIPS){

        let placed = false;

        while(!placed){

            const horizontal =
            Math.random() < 0.5;

            const row =
            Math.floor(
                Math.random()*BOARD_SIZE
            );

            const col =
            Math.floor(
                Math.random()*BOARD_SIZE
            );

            let canPlace = true;

            for(let i=0;i<shipSize;i++){

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

            for(let i=0;i<shipSize;i++){

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

function buildBoards() {

    buildBoard(
        "playerBoard"
    );

    buildBoard(
        "enemyBoard"
    );

}

function buildBoard(id){

    const board =
    document.getElementById(id);

    board.innerHTML = "";

    for(let row=0;row<10;row++){

        for(let col=0;col<10;col++){

            const cell =
            document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            board.appendChild(cell);

        }

    }

}

function renderMyBoard(){

    const board =
    document.getElementById(
        "playerBoard"
    );

    const cells =
    board.querySelectorAll(".cell");

    cells.forEach(cell=>{

        const row =
        Number(cell.dataset.row);

        const col =
        Number(cell.dataset.col);

        cell.className =
        "cell";

        const value =
        myBoard[row][col];

        if(value === 1){

            cell.classList.add(
                "ship"
            );

        }

    });

}

btnCreateRoom.addEventListener(
"click",
async ()=>{

    roomId =
    generateRoomCode();

    playerId =
    generatePlayerId();

    playerRole =
    "player1";

    myBoard =
    placeShipsRandomly();

    await setDoc(
        doc(db,"rooms",roomId),
        {

            status:"waiting",

            currentTurn:"player1",

            winner:null,

            players:{
                player1:playerId,
                player2:null
            },

            boards:{
                player1:myBoard,
                player2:null
            }

        }
    );

    enterRoom();

});

btnJoinRoom.addEventListener(
"click",
async ()=>{

    const code =
    roomCodeInput.value
    .trim()
    .toUpperCase();

    if(!code)
        return;

    const roomRef =
    doc(db,"rooms",code);

    const snap =
    await getDoc(roomRef);

    if(!snap.exists()){

        alert(
            "Sala não encontrada"
        );

        return;

    }

    const data =
    snap.data();

    playerId =
    generatePlayerId();

    playerRole =
    "player2";

    myBoard =
    placeShipsRandomly();

    await updateDoc(
        roomRef,
        {

            "players.player2":
            playerId,

            "boards.player2": JSON.stringify(myBoard),

            status:
            "playing"

        }
    );

    roomId = code;

    enterRoom();

});

function enterRoom(){

    homeScreen.classList.add(
        "hidden"
    );

    roomScreen.classList.add(
        "hidden"
    );

    gameScreen.classList.remove(
        "hidden"
    );

    buildBoards();

    renderMyBoard();

    roomIdLabel.textContent =
    roomId;

    startRoomListener();

}

function startRoomListener(){

    const roomRef =
    doc(db,"rooms",roomId);

    roomListener =
    onSnapshot(
        roomRef,
        snapshot=>{

            if(
                !snapshot.exists()
            )
                return;

            const room =
            snapshot.data();

            if(
                playerRole ===
                "player1"
            ){

                enemyBoard =
                room.boards.player2
                ? JSON.parse(room.boards.player2)
                : null;

            }

            if(
                playerRole ===
                "player2"
            ){

                enemyBoard =
                room.boards.player1
                ? JSON.parse(room.boards.player1)
                : null;

            }

        }
    );

}

const params =
new URLSearchParams(
    window.location.search
);

const sala =
params.get("sala");

if(sala){

    roomCodeInput.value =
    sala.toUpperCase();

}




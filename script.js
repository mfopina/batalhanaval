const BOARD_SIZE = 10;
const SHIPS = [5, 4, 3, 3, 2];

let roomId = null;
let playerId = null;
let playerNumber = null;

let myBoard = [];
let enemyBoard = [];

let roomUnsubscribe = null;

function createEmptyBoard() {

    return Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(0)
    );

}

function placeShipsRandomly() {

    const board = createEmptyBoard();

    for(const shipSize of SHIPS) {

        let placed = false;

        while(!placed) {

            const horizontal =
                Math.random() < 0.5;

            const row =
                Math.floor(
                    Math.random() * BOARD_SIZE
                );

            const col =
                Math.floor(
                    Math.random() * BOARD_SIZE
                );

            let canPlace = true;

            for(let i = 0; i < shipSize; i++) {

                const r =
                    horizontal ? row : row + i;

                const c =
                    horizontal ? col + i : col;

                if(
                    r >= BOARD_SIZE ||
                    c >= BOARD_SIZE ||
                    board[r][c] !== 0
                ) {

                    canPlace = false;
                    break;

                }

            }

            if(!canPlace)
                continue;

            for(let i = 0; i < shipSize; i++) {

                const r =
                    horizontal ? row : row + i;

                const c =
                    horizontal ? col + i : col;

                board[r][c] = 1;

            }

            placed = true;

        }

    }

    return board;

}

function buildBoard(containerId) {

    const board =
        document.getElementById(containerId);

    board.innerHTML = "";

    for(let row = 0; row < BOARD_SIZE; row++) {

        for(let col = 0; col < BOARD_SIZE; col++) {

            const cell =
                document.createElement("div");

            cell.classList.add("cell");

            cell.dataset.row = row;
            cell.dataset.col = col;

            board.appendChild(cell);

        }

    }

}

function renderPlayerBoard() {

    const board =
        document.getElementById(
            "playerBoard"
        );

    const cells =
        board.querySelectorAll(".cell");

    cells.forEach(cell => {

        const row =
            Number(cell.dataset.row);

        const col =
            Number(cell.dataset.col);

        cell.className = "cell";

        const value =
            myBoard[row][col];

        if(value === 1) {

            cell.classList.add("ship");

        }

        if(value === 2) {

            cell.classList.add("miss");

        }

        if(value === 3) {

            cell.classList.add("hit");

        }

    });

}

function startLocalTest() {

    myBoard =
        placeShipsRandomly();

    buildBoard(
        "playerBoard"
    );

    buildBoard(
        "enemyBoard"
    );

    renderPlayerBoard();

}

window.addEventListener(
    "load",
    () => {

        startLocalTest();

    }
);

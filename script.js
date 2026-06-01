import { db } from "./firebase.js";

import {
    doc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const btnCreateRoom =
document.getElementById("btnCreateRoom");

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

btnCreateRoom.addEventListener(
"click",
async ()=>{

    const roomId =
    generateRoomCode();

    console.log(
        "Criando sala:",
        roomId
    );

    await setDoc(
        doc(db,"rooms",roomId),
        {
            createdAt:
            Date.now(),

            status:
            "waiting"
        }
    );

    alert(
        "Sala criada: " +
        roomId
    );

});

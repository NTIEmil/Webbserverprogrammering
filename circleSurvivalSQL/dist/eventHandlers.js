"use strict";
// Skapar en prjektil
function createProjectile(event) {
    // Räknar ut projektilens vnkel
    let angle = Math.atan2(event.clientY - player.yPos, event.clientX - player.xPos);
    // Räkanr ut projektiles vektorhastighet
    let velocity = {
        x: Math.cos(angle) * projectileSpeed,
        y: Math.sin(angle) * projectileSpeed,
    };
    // Lägger till projektilen i projektillistan
    projectiles.push(new Projectile(player.xPos, player.yPos, 5, "white", velocity));
}
// När en knapp upptäcks som nertryckt
function onKeyDown(event) {
    // Om knappen inte redan har tryckts ner
    if (!pressedKeys.includes(event.key)) {
        // Läggs till i listan av nedtryckta knappar
        pressedKeys.push(event.key);
        // Genomför vad knapparna gör
        playerKeyboardInput();
    }
}
// När en knapp upptäcks att inte längre tryckas ner
function onKeyUp(event) {
    // Tas bort från lsitan av nedtryckta knappar
    pressedKeys.splice(pressedKeys.indexOf(event.key), 1);
    // Genomför vad knapparna gör eller slutar göra
    playerKeyboardInput();
}
// Genomför vad spelarens knapptryck gör
function playerKeyboardInput() {
    // Kollar vart spelaren håller på att förflytta sig
    let moveUp = pressedKeys.includes("w") ||
        pressedKeys.includes("W") ||
        pressedKeys.includes("ArrowUp");
    let moveDown = pressedKeys.includes("s") ||
        pressedKeys.includes("S") ||
        pressedKeys.includes("ArrowDown");
    let moveLeft = pressedKeys.includes("a") ||
        pressedKeys.includes("A") ||
        pressedKeys.includes("ArrowLeft");
    let moveRight = pressedKeys.includes("d") ||
        pressedKeys.includes("D") ||
        pressedKeys.includes("ArrowRight");
    // Om "q" trycks ner
    if (pressedKeys.includes("q") || pressedKeys.includes("Q")) {
        // Menyn byter från öppen till stängd eller tvärt om
        openUpgradeMenu = !openUpgradeMenu;
        // Om menyn är öppen
        if (openUpgradeMenu == true) {
            // pausa spelet
            pause();
        }
        else {
            // Avpausa spelet
            unpause();
        }
    }
    // Om "Esc" trycks ner och spelet inte är pausat
    if (pressedKeys.includes("Escape") && paused == false) {
        // Pausa spelet
        pause();
    }
    // Skapar en stillastående vektor
    let newTargetVelocity = { x: 0, y: 0 };
    // Kollar om spelaren ska färdas upp eller ner
    if (moveUp && !moveDown) {
        newTargetVelocity.y = -playerMaxSpeed;
    }
    else if (!moveUp && moveDown) {
        newTargetVelocity.y = playerMaxSpeed;
    }
    // Kollar om spelaren ska färdas till vänster eller höger
    if (moveLeft && !moveRight) {
        newTargetVelocity.x = -playerMaxSpeed;
    }
    else if (!moveLeft && moveRight) {
        newTargetVelocity.x = playerMaxSpeed;
    }
    // Om spelaren fördas diagonalt
    if (newTargetVelocity.y != 0 && newTargetVelocity.x != 0) {
        // Minska ahstigheten sä att det går lika snabbt som om den hade färdats rakt
        newTargetVelocity.y *= 0.7;
        newTargetVelocity.x *= 0.7;
    }
    // Sätter spelarens målhastighet till den nya vektorn
    player.targetVelocity = newTargetVelocity;
}
// Pausar spelet
function pause() {
    // Avbryter animeringen av spelet
    clearInterval(animationIntervalID);
    // Om spelet inte redan är pausat
    if (paused == false) {
        // Gör spelplanen mörkare
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Låter inte spelaren skjuta
        removeEventListener("click", createProjectile);
    }
    // Om uppgraderingsmenyn into är öppen
    if (openUpgradeMenu == false) {
        // Visar pausmenyn
        pauseDisplay.style.display = "block";
        // Låter dig opausa genom att klicka med musen
        addEventListener("click", unpause);
    }
    else {
        // Visar uppgraderingsmenyn istället för pausmenyn
        pauseDisplay.style.display = "none";
        upgradeDisplay.style.display = "flex";
        // Opausar inte när du klickar med musen
        removeEventListener("click", unpause);
    }
    paused = true;
}
// Opausa spelet
function unpause() {
    // Gömmer påde paus och uppgraderingsmenyn
    pauseDisplay.style.display = "none";
    upgradeDisplay.style.display = "none";
    // Låter dig inte opausa utan istället sjkuta med musknappen
    removeEventListener("click", unpause);
    addEventListener("click", createProjectile);
    // Sätter ignång animeringen igen
    startAnimation();
    // Meddelar attt spelet är opausat
    paused = false;
}

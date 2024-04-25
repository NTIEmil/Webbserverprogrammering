// Canvas
const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

// Canvas täcker fönstret
canvas.width = innerWidth;
canvas.height = innerHeight;

// Alla HTML-element

// Statistikvisaren
const statDisplay = document.querySelector<HTMLElement>("#statDisplay")!;
const scoreElement = document.querySelector("#scoreElement")!;
const lifeElement = document.querySelector("#lifeElement")!;
const highscoreButtons = document.querySelectorAll(".toggle-button");

// Start- och slutmenyn
const gameOverDisplay =
  document.querySelector<HTMLElement>("#gameOverDisplay")!;
const startGameButton = document.querySelector("#startGameButton")!;
const finalScoreElement = document.querySelector("#finalScoreElement")!;

// Pausskärmen
const pauseDisplay = document.querySelector<HTMLElement>("#pauseDisplay")!;

// Erfarenhetsviddsaren
const progressDisplay =
  document.querySelector<HTMLElement>("#progressDisplay")!;
const experienceBar = document.querySelector("#experienceBar")!;
const upgradeMessage = document.querySelector<HTMLElement>("#upgradeMessage")!;

// Uppgraderingsmenyn
const upgradeDisplay = document.querySelector<HTMLElement>("#upgradeDisplay")!;
const upgradeOptions = document.querySelector<HTMLElement>("#upgradeOptions")!;

// Topplistan
const scoreboardDisplay =
  document.querySelector<HTMLElement>("#scoreboardDisplay")!;
const scoreboardTable =
  document.querySelector<HTMLElement>("#scoreboardTable")!;

// Kontrolllistan
const controlsDisplay =
  document.querySelector<HTMLElement>("#controlsDisplay")!;

// Anvädnarnamnet
const aliasInput = document.querySelector("#aliasInput")!;

// Anvädnarens upplösning
const standardResolution: number = 1080 * 1920;
const widnowResuliton: number = canvas.height * canvas.width;

// Vad alla storlekar och hastigheter ska multipliceras med
const screenSizeMultiplier: number = widnowResuliton / standardResolution;

// Mitten av skärmen
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

// Alla variabler angående hastigheter
const projectileSpeed: number = 7 * screenSizeMultiplier;
const playerMaxSpeed: number = 5 * screenSizeMultiplier;
const playerAcceleration: number = 0.5 * screenSizeMultiplier;
const particleFriction: number = 0.98;
const enemyBaseSpeed: number = 2 * screenSizeMultiplier;
const particleSpeed: number = 6 * screenSizeMultiplier;

// Antal bilder per sekund
const fps: number = 60;

// Erfarenehten som krävs för uppgraderingar
let startingExperiencePerLevel: number = 10;
const experiencePerLevelMultiplier: number = 1.5;

// Alla variabler som ändras med uppgraderingar
let experiencePerKill = { number: 5 };
let projectileDamage = { number: 5 };
let startingLives: number = 3;
let lives = { number: startingLives };
let superiority = { number: 0 };

// Lsita med alla uppgraderingar
const upgrades: upgrade[] = [
  {
    name: "Deadlier Projectiles",
    description: "Damage Per Hit",
    variable: projectileDamage,
    amount: 1,
  },
  {
    name: "Insert Name",
    description: "Current Lives",
    variable: lives,
    amount: 1,
    function: "updateLife()",
  },
  {
    name: "Faster Learning",
    description: "Experience Per Kill",
    variable: experiencePerKill,
    amount: 1,
  },
  {
    name: "Superiority Complex",
    description: "Superiority Feeling",
    variable: superiority,
    amount: 1,
  },
];

// Skapar spelaren
const player = new Player(centerX, centerY, 10, "white");

// Aöla lsitor med objekt på skärmen
let projectiles: Projectile[] = [];
let enemies: Enemy[] = [];
let particles: Particle[] = [];

// Lista med nedtryckta knappar
let pressedKeys: string[] = [];

// Alla manyer som kan öppnas
let openUpgradeMenu: boolean = false;
let paused: boolean = false;

// Topplistan
let highScoreList: highScore[] = [];

// Definieringen av övriga variabler
let animationID: number;
let animationIntervalID: number;
let score: number;
let enemySpawnDelay: number;
let experiencePoints: number;
let experiencePerLevel: number;

// Starting highscore filter
let highscoreFilter: string = "global";

// Server-kommunikation
// @ts-ignore
const socket = io();

// När sidan har laddats in
$(() => {
  getHighScores();
});

// Lägger till alla slutpoäng från databasen
function getHighScores(filter?: string) {
  if (filter) {
    highscoreFilter = filter
  }
  $.get(`/scores/${highscoreFilter}`, (data) => {
    highScoreList = data;
    console.log(highScoreList);
    updateHighscores();
  });
}

// Skickat slutpoängen till servern
function postHighscore(highScore: Number) {
  console.log(highScore);
  $.post("/scores", { HighScore: highScore });
  getHighScores();
}

// Nollställning i början av varje spel
function init() {
  // Spelaren står still i mitten av skrämen
  player.xPos = centerX;
  player.yPos = centerY;
  player.velocity = { x: 0, y: 0 };

  // Nollställning av variabler som funktioner använder
  animationID = 0;
  enemySpawnDelay = 2 * fps;

  // Nollställning av listor
  projectiles = [];
  enemies = [];
  particles = [];

  // Nollställningen av variabler som ändras av uppgraderingar
  experiencePerKill.number = 5;
  projectileDamage.number = 5;
  superiority.number = 0;

  // Nollställning av liv
  lives.number = startingLives;
  updateLife();

  // Nollställning av poäng
  score = 0;
  updateScore();

  // Nollställning av erfarenhet
  experiencePerLevel = startingExperiencePerLevel;
  updateExperienceBar();
  updateExperience(0);

  // Nya uppgraderingar
  newUpgrades();

  // Spelet startar
  startAnimation();
}

// Skapar fiender
function spawnEnemy() {
  let newEnemy: Enemy;

  // Slumpar vilken typ av fiende det blir
  // Det är troligare att den blir en special-typ ju mer poäng spelaren har
  if (Math.random() > score / 100) {
    newEnemy = new Enemy(20, 1, "red");
  } else {
    switch (Math.floor(Math.random() * 3 + 1)) {
      case 1:
        newEnemy = new Enemy(40, 0.5, "orange");
        break;
      case 2:
        newEnemy = new Enemy(15, 2.5, "blue");
        break;
      case 3:
        newEnemy = new Enemy(25, 1, "yellow");
    }
  }

  // Den läggs till bland fienderna
  enemies.push(newEnemy!);
}

// Alla projektiler uppdateras
function updateProjectiles() {
  // Görs för alla projektiler
  projectiles.forEach((projectile, projectileIndex) => {
    // Deras rita-funktion körs
    projectile.draw();

    // Kollar om de är utanför skärmen
    if (
      projectile.xPos + projectile.radius < 0 ||
      projectile.xPos - projectile.radius > canvas.width ||
      projectile.yPos + projectile.radius < 0 ||
      projectile.yPos - projectile.radius > canvas.height
    ) {
      // De tas bort
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });
}

// Alla partiklar uppdateras
function updateParticles() {
  // Görs för alla partiklar
  particles.forEach((particle, index) => {
    // Kollar om de fortfarande syns
    if (particle.alpha <= 0.01) {
      // Tar bort dem
      setTimeout(() => {
        particles.splice(index, 1);
      }, 0);
    } else {
      // Ritar ut dem
      particle.draw();
    }
  });
}

// När spelet tar slut
function endGame() {
  // Avbryter animering av spelet
  clearInterval(animationIntervalID);

  // Ändrar vad som visas på skärmen
  gameOverDisplay.style.display = "flex";
  scoreboardDisplay.style.display = "flex";
  controlsDisplay.style.display = "flex";
  statDisplay.style.display = "none";
  progressDisplay.style.display = "none";

  // Uppdaterar slutpoängen
  finalScoreElement.innerHTML = score.toString();

  // Tar bort eventLsiteners som används under spelet
  removeEventListener("click", createProjectile);
  removeEventListener("keydown", onKeyDown);
  removeEventListener("blur", pause);

  // Sparar ner topplsitan i databasen
  postHighscore(score);
}

// Kollar om en fiende träffar spelaren
function enemyHittingPlayer(enemy: Enemy, enemyIndex: number) {
  // Avständet mellan fienden och spealren
  const distance = Math.hypot(
    player.xPos - enemy.xPos,
    player.yPos - enemy.yPos
  );

  // Om de träffar varandra
  if (distance - enemy.radius - player.radius < 0) {
    // Spelaren tappar liv
    lives.number--;

    // Livmätaren uppdateras
    updateLife();

    // Om spelaren ahr slut på liv
    if (lives.number == 0) {
      // Spelet tar slut
      endGame();
    } else {
      // Fienden tas bort
      setTimeout(() => {
        enemies.splice(enemyIndex, 1);
      }, 0);
    }
  }
}

// Kollar om en en fiende träffas av en projektil
function projectileHittingEnemy(enemy: Enemy, enemyIndex: number) {
  // Kollar alla projektiler
  projectiles.forEach((projectile, projectileIndex) => {
    // Avståndet mellan projektilen och fienden
    let distance = Math.hypot(
      projectile.xPos - enemy.xPos,
      projectile.yPos - enemy.yPos
    );

    // Om de träffar varandra
    if (distance - enemy.radius - projectile.radius < 0) {
      // Partiklar skapas
      for (let i = 0; i < enemy.radius * 2; i++) {
        particles.push(
          new Particle(
            projectile.xPos,
            projectile.yPos,
            Math.random() * 2,
            enemy.colour,
            {
              x: (Math.random() - 0.5) * (Math.random() * particleSpeed),
              y: (Math.random() - 0.5) * (Math.random() * particleSpeed),
            }
          )
        );
      }

      // Om fiendens radier är tillräckligt stor
      if (enemy.minRadius >= 20) {
        // Fienden blir mindre
        enemy.minRadius -= projectileDamage.number;
      } else {
        // Spelaren för erfarenhet
        updateExperience(experiencePoints + experiencePerKill.number);

        // Fienden tas bort
        setTimeout(() => {
          enemies.splice(enemyIndex, 1);
        }, 0);
      }

      // Projektilen tas bort
      setTimeout(() => {
        projectiles.splice(projectileIndex, 1);
      }, 0);
    }
  });
}

// Uppdaterar erfarehneten
function updateExperience(value: number) {
  // Sätter procentmätaren för att representera det nya värdet
  experiencePoints = value;
  experienceBar.setAttribute("value", experiencePoints.toString());

  // Kollar om det finns tillräckligt med erfarenhet för att uppgradera
  if (experiencePoints >= experiencePerLevel) {
    upgradeMessage.style.display = "block";
  } else {
    upgradeMessage.style.display = "none";
  }
}

// Uppdaterar spelarens poäng
function updateScore() {
  scoreElement.innerHTML = "Score: " + score.toString();
}

// Uppdaterar spelarens liv
function updateLife() {
  lifeElement.innerHTML = "Lives: " + lives.number.toString();
}

// Uppdaterar erfarenehten som krävs för nästa uppgradering
function updateExperienceBar() {
  experienceBar.setAttribute("max", experiencePerLevel.toString());
}

// Animerar spelet (fps) gånger per sekund
function startAnimation() {
  // @ts-ignore
  animationIntervalID = setInterval(() => {
    animationID = requestAnimationFrame(animate);
  }, 1000 / fps);
}

// Animerar spelt
function animate() {
  // Om det ahr gått en sekund
  if (animationID % fps == 0) {
    // Ökar spelarens poäng
    score += 1;
    updateScore();
  }

  // Om det är dags för en fiende attt skapas
  if (animationID % enemySpawnDelay == 0) {
    // Drar ner tiden till nsäta fiende
    enemySpawnDelay = Math.round(enemySpawnDelay * 0.98);

    // Skapar en fiende
    spawnEnemy();
  }

  // Gör bakgrunden mörkare
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ritar ut spelaren
  player.draw();

  // Uppdaterar alla partiklar
  updateParticles();

  // Uppdaterar alla projektiler
  updateProjectiles();

  // Går inegom alla fiender
  enemies.forEach((enemy, enemyIndex) => {
    // Ritar ut fienden
    enemy.draw();

    // Kollar om den träffar spelaren
    enemyHittingPlayer(enemy, enemyIndex);

    // Kollar om den träffas av en projektil
    projectileHittingEnemy(enemy, enemyIndex);
  });
}

// Skapar ett HTML-element
function newElement(parent: HTMLElement, tag: string, text: string) {
  // Skapar elementet och dess text
  let element = document.createElement(tag);
  let elementText = document.createTextNode(text);

  // Lägger i elementen i föräldern
  element.appendChild(elementText);
  parent.appendChild(element);

  // Retunerar elementet
  return element;
}

// Förnyar uppgraderingarna
function newUpgrades() {
  let upgrade: upgrade;
  let upgradeSelection: upgrade[] = [];

  // Tömmer uppgraderingsmenyn
  while (upgradeOptions.hasChildNodes()) {
    upgradeOptions.removeChild(upgradeOptions.lastChild!);
  }

  // Skapar tre uppgraderings div-ar
  for (let i = 0; i < 3; i++) {
    // Slumpar en uppgradering
    upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];

    // Ifall den redan har valts att vara ett alternativ
    while (upgradeSelection.includes(upgrade)) {
      // Fortsätter slumpa
      upgrade = upgrades[Math.floor(Math.random() * upgrades.length)];
    }

    // Läggs till bland valda uppgraderingar
    upgradeSelection.push(upgrade);

    // Skapar en div-tag med alla dess barn-taggar
    let div = document.createElement("div");
    newElement(div, "h2", upgrade.name);
    newElement(div, "p", upgrade.description);
    newElement(
      div,
      "p",
      upgrade.variable.number +
        " => " +
        (upgrade.variable.number + upgrade.amount)
    );
    let button = newElement(div, "button", "Select");

    // Lägger till div-en i uppgraderingsmenyn
    upgradeOptions.appendChild(div);

    // Ger kanppen ett ID
    button.id = upgrade.name.replace(/\s/g, "");
    let buttonElement = document.querySelector("#" + button.id)!;

    // Skapar en eventListener för knappen
    buttonElement.addEventListener("click", () => {
      // Om spelaren ahr tillräckligt med erfarenhet för att uppgradera
      if (experiencePoints >= experiencePerLevel) {
        // Ta bort den använda mängden erfarenhet
        updateExperience(experiencePoints - experiencePerLevel);

        // Räknar ut hur mcyekt erfarenhet som krövs för nästa uppgradering
        experiencePerLevel *= experiencePerLevelMultiplier;

        // Uppdatera krävd erfareneht för att uppgradera
        updateExperienceBar();

        // Hittar uppgraderingen som ska genomföras
        let upgrade = upgradeSelection.find(
          (upgrade) => upgrade.name.replace(/\s/g, "") == buttonElement.id
        )!;

        // Upppdaterar aktuell variabel
        upgrade.variable.number += upgrade.amount;

        // Genomför uppgraderings funkttion om den har en
        if (upgrade.function != undefined) {
          eval(upgrade.function);
        }

        // Förnyar uppgraderingarna
        newUpgrades();
      }
    });
  }
}

// Uppdaterar topplsitan
function updateHighscores() {
  let highScore: highScore;

  // Tömmer topplsitan på skärmen
  while (scoreboardTable.hasChildNodes()) {
    scoreboardTable.removeChild(scoreboardTable.lastChild!);
  }

  // Sorterar topplsitan
  try {
    highScoreList.sort((a, b) => {
      return b.Score - a.Score;
    });
  } catch {}

  // Tar fram top 5
  for (let i = 0; i < 5; i++) {
    // Om det finns tillräcklgit många i topplistan
    try {
      if (highScoreList.length > i) {
        // Lägger till dem
        highScore = highScoreList[i];
      } else {
        // Lägger till en tom plats
        highScore = {
          Name: "-",
          Score: 0,
        };
      }
    } catch {
      highScore = {
        Name: "-",
        Score: 0,
      };
    }

    // Skapar en tabell av topplistan
    let tableRow = document.createElement("tr");
    newElement(tableRow, "th", highScore.Name);
    newElement(tableRow, "th", highScore.Score.toString());

    // Lägger till topplsitan på skärmen
    scoreboardTable.appendChild(tableRow);
  }
}

// Updates the highscore lsit and colour of the toggle buttons whenever one
// of the is pressed.
highscoreButtons.forEach(function (button: Element) {
  button.addEventListener("click", () => {
    // Remove 'active' class from all buttons
    highscoreButtons.forEach(function (btn) {
      btn.classList.remove("active");
    });

    // Add 'active' class to the clicked button
    // @ts-ignore
    button.classList.add("active");

    // Update highscore list
    getHighScores(button.id)
  });
});

// Startknappen i start- och slutmenyn
startGameButton.addEventListener("click", () => {
  gameOverDisplay.style.display = "none";
  scoreboardDisplay.style.display = "none";
  controlsDisplay.style.display = "none";
  statDisplay.style.display = "block";
  progressDisplay.style.display = "flex";

  // Nollstälelt allt inför spelet
  init();

  // Lägger till spelets eventLsiteners
  addEventListener("keydown", onKeyDown);
  addEventListener("keyup", onKeyUp);
  addEventListener("blur", pause);
  // Denna läggs till på detta viset för att spelaren itne ska sjkuta med knapptrycket de gjorde för att starta spelet
  setTimeout(() => {
    addEventListener("click", createProjectile);
  });
});

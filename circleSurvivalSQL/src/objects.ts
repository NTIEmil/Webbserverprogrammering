// En vektor
type velocity = {
  x: number;
  y: number;
};

// En uppgradering
type upgrade = {
  name: string;
  description: string;
  variable: { number: number };
  amount: number;
  function?: string;
};

// Ett spelresultat
type highScore = {
  Name: string;
  Score: number;
};

// Förslyttande objekt
class MovingObject {
  xPos: number;
  yPos: number;
  radius: number;
  colour: string;
  velocity: velocity;

  constructor(xPos: number, yPos: number, radius: number, colour: string) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.radius = radius;
    this.colour = colour;
    this.velocity = { x: 0, y: 0 };
  }

  // Ska ritas ut på skärmen
  draw() {
    // Uppdaterar objektets position
    this.update();

    // Ritas ut på skärmen
    ctx.beginPath();
    ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.colour;
    ctx.fill();
  }

  // Uppdaterar objektets position
  update() {
    // Färdas med sin satta hastighet
    this.xPos += this.velocity.x;
    this.yPos += this.velocity.y;
  }
}

// Spelaren
class Player extends MovingObject {
  targetVelocity: velocity;

  constructor(xPos: number, yPos: number, radius: number, colour: string) {
    super(xPos, yPos, radius, colour);
    this.targetVelocity = this.velocity;
  }

  // Uppdaterar spelarens position
  update() {
    // Uppdaterar hastigheten i Y-led
    if (this.velocity.y < this.targetVelocity.y) {
      if (this.velocity.y + playerAcceleration < this.targetVelocity.y) {
        this.velocity.y = this.targetVelocity.y;
      } else {
        this.velocity.y += playerAcceleration;
      }
    } else if (this.velocity.y > this.targetVelocity.y) {
      if (this.velocity.y - playerAcceleration > this.targetVelocity.y) {
        this.velocity.y = this.targetVelocity.y;
      } else {
        this.velocity.y -= playerAcceleration;
      }
    }

    // Uppdaterar hastigheten i X-led
    if (this.velocity.x < this.targetVelocity.x) {
      if (this.velocity.x + playerAcceleration < this.targetVelocity.x) {
        this.velocity.x = this.targetVelocity.x;
      } else {
        this.velocity.x += playerAcceleration;
      }
    } else if (this.velocity.x > this.targetVelocity.x) {
      if (this.velocity.x - playerAcceleration > this.targetVelocity.x) {
        this.velocity.x = this.targetVelocity.x;
      } else {
        this.velocity.x -= playerAcceleration;
      }
    }

    // Spelarens färdas i dess hastighet
    this.xPos += this.velocity.x;
    this.yPos += this.velocity.y;

    // Ser till att spelaren inte hmnar utanför skärmen

    // Kollar om spelaren träffar går in i väggarna i höjdled
    if (this.xPos - this.radius < 0) {
      this.xPos = this.radius;
    } else if (this.xPos + this.radius > canvas.width) {
      this.xPos = canvas.width - this.radius;
    }

    // Kollar om spelaren träffar väggarna på sidorna
    if (this.yPos - this.radius < 0) {
      this.yPos = this.radius;
    } else if (this.yPos + this.radius > canvas.height) {
      this.yPos = canvas.height - this.radius;
    }
  }
}

// Fiender
class Enemy extends MovingObject {
  minRadius: number;
  speed: number;

  constructor(radius: number, speedMultiplier: number, colour: string) {
    let xPos: number;
    let yPos: number;

    // Slumpar fram var fienden skapas
    if (Math.random() < 0.5) {
      // Fienden skapas Höst upp eller längst ner
      xPos = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      yPos = Math.random() * canvas.height;
    } else {
      // Fienden skapas till höger eller vänster
      xPos = Math.random() * canvas.width;
      yPos = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    super(xPos, yPos, radius, colour);
    this.minRadius = this.radius;

    // Fiendens hastighet anpassas efter skärmen
    this.speed = enemyBaseSpeed * speedMultiplier;
  }

  // Uppdaterar fiendens position
  update() {
    // Krymper fienden om den har tagit skada
    if (this.radius > this.minRadius) {
      this.radius -= 1;
    }

    // Räknar ut vinkeln till spelaren
    let newAngle = Math.atan2(player.yPos - this.yPos, player.xPos - this.xPos);

    // Skapar en vektor mot spelaren
    let newVelocity = {
      x: Math.cos(newAngle) * this.speed,
      y: Math.sin(newAngle) * this.speed,
    };

    // Sätter den nya vektorn till fiendens hastighet
    this.velocity = newVelocity;

    // Fienden färdas i dess hastighet
    this.xPos += this.velocity.x;
    this.yPos += this.velocity.y;
  }
}

// Projektiler
class Projectile extends MovingObject {
  constructor(
    xPos: number,
    yPos: number,
    radius: number,
    colour: string,
    velocity: velocity
  ) {
    super(xPos, yPos, radius, colour);
    this.velocity = velocity;
  }
}

// Partiklar
class Particle extends Projectile {
  alpha: number;

  constructor(
    xPos: number,
    yPos: number,
    radius: number,
    colour: string,
    velocity: velocity
  ) {
    super(xPos, yPos, radius, colour, velocity);
    this.alpha = 1;
  }

  // Den ska ritas ut på skärmen
  draw() {
    // Uppdateras dess position
    this.update();

    // Ritas ut på skärmen
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.xPos, this.yPos, this.radius, 0, Math.PI * 2, false);
    ctx.fillStyle = this.colour;
    ctx.fill();
    ctx.restore();
  }

  // Uppdateras dess position
  update() {
    // Dess hastighet minskar
    this.velocity.x *= particleFriction;
    this.velocity.y *= particleFriction;

    // Den färdas enligt dess hastighet
    this.xPos += this.velocity.x;
    this.yPos += this.velocity.y;

    // Den blir lite mindre synlig
    this.alpha -= 0.01;
  }
}

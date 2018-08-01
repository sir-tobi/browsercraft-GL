
let canvas = document.getElementById("gameArea");
let ctx = canvas.getContext("2d");
let objectId = 0;

function sprite (options) {

    var that = {};

    that.context = options.context;
    that.width = options.width;
    that.height = options.height;
    that.image = options.image;

    return that;
}

const units = [];
const collidables = [];
let selectedUnits = [];

canvas.addEventListener('click', on_canvas_click, false);
canvas.addEventListener('contextmenu', on_canvas_rightclick, false);

class Unit {
    constructor (x, y) {
        this.id = objectId++;
        this.movementSpeed = 300;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.width = 60;
        this.height = 60;
        this.distanceTraveledX = 0;
        this.distanceTraveledY = 0;
        this.iSelected =false;

        // stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.attack = 20;
        this.defense = 2;
        this.attackRadius = 20;
        this.effectiveAttackRadius = this.width / 2 + this.attackRadius; // note: always width === height
        this.sightRadius = 150;
        this.effectiveSightRadius = this.width / 2 + this.sightRadius;
        this.selectionRadius = 0;
        this.effectiveSelectionRadius = this.width / 2 + this.selectionRadius;

        // sprite
        this.sprite = new Image ();
        this.sprite.src = "assets/sprites/grunt.png";
        this.spriteWidth = 73;
        this.spriteHeight = 73;
        this.direction = 0;

        // animation
        this.animPhase = 0;
        this.animFramesBetweenPhases = 9;
        this.animWalking = 0;
        this.animWalkingMax = 292;
    }
}

createUnit(100, 100);
createUnit(400, 400);


function createUnit (x, y) {
    let unit = new Unit(x, y);
    units.push(unit);
    collidables.push(unit);
}

function on_canvas_click(e) {
    const clicked = {
        width: 1,
        height: 1,
        x: e.clientX,
        y: e.clientY
    }
    let collisionFound = false;
    units.forEach(iUnit => {
        if (doesCollide(clicked, iUnit)) {
            collisionFound = true;
            let doesContain = selectedUnits.find(iSelected => (iSelected.id === iUnit.id));
            if (!doesContain) {
                selectedUnits.push(iUnit);
                iUnit.iSelected = true;
            }
        }
    });
    if (!collisionFound) {
        selectedUnits.forEach(iUnit => {
            iUnit.iSelected = false;
        });
        selectedUnits = [];
    }
}

function on_canvas_rightclick(e) {
    e.preventDefault();
    selectedUnits.forEach((iUnit, idx) => {
        iUnit.targetX = e.clientX + (idx * iUnit.width + 10); // TODO put padding in variable
        iUnit.targetY = e.clientY + (idx * iUnit.height + 10);
    });
}

let last = 0;
function loopy (t) {
    // Move logic
    dt = (t - last) / 1000;
    last = t;
    units.forEach(iUnit => {
    // Movement
        if (iUnit.x != iUnit.targetX && iUnit.y != iUnit.targetY) {
            let dirX = iUnit.targetX - iUnit.x;
            let dirY = iUnit.targetY - iUnit.y;
            let magnitude = Math.sqrt(dirX*dirX + dirY*dirY);
            let normalizedX = dirX / magnitude;
            let normalizedY = dirY / magnitude;
            let distanceToTravelX = normalizedX * iUnit.movementSpeed * dt;
            let distanceToTravelY = normalizedY * iUnit.movementSpeed * dt;
            let newX = iUnit.x + distanceToTravelX;
            let newY = iUnit.y + distanceToTravelY;
            // No sizzle dizzle dazzling
            if (Math.abs(distanceToTravelX) > Math.abs(normalizedX) * magnitude) {
                newX = iUnit.targetX;
            }
            if (Math.abs(distanceToTravelY) > Math.abs(normalizedY) * magnitude) {
                newY = iUnit.targetY;
            }
            iUnit.x = newX;
            iUnit.y = newY;

            iUnit.distanceTraveledX = distanceToTravelX;
            iUnit.distanceTraveledY = distanceToTravelY;

            var angle = Math.atan2(iUnit.targetY - iUnit.y, iUnit.targetX - iUnit.x) * 180 / Math.PI;

            // Walking animation
            iUnit.animPhase++;
            if (iUnit.animPhase >= iUnit.animFramesBetweenPhases) {
                iUnit.animPhase = 0;
                /*
                    Each direction has a range of 45 degrees. Top is 0 degree +/- 22,5 (45 / 2).
                    The direction will determine the shown animation sprite. One sprite for each direction.

                                    dirX    dirY    angleMin  angleMax
                    top             0       pos.    -112.6    -67.5  
                    top-right       pos.    pos.     -67.6    -22.5
                    right           pos.    0        -22.6     22.5      
                    down-right      pos.    neg.      22.6      67.5
                    down            0       neg.      67.6     112.5
                    down-left       neg.    neg.     112.6     157.5
                    left            neg.    0        157.6     180.0   & -180   -157.5
                    top-left        neg.    pos.    -157.6    -112.5

                */

                // Determine direction
                if (angle > -112.5 && angle < -67.6) {
                    iUnit.direction = 0; // top
                } else if (angle > -67.5 && angle < -22.6) {
                    iUnit.direction = 1; // top-right
                } else if (angle > -22.5 && angle < 22.6) {
                    iUnit.direction = 2; // right
                } else if (angle > 22.5 && angle < 67.6) {
                    iUnit.direction = 3; // down-right
                } else if (angle > 67.5 && angle < 112.6) {
                    iUnit.direction = 4; // down
                } else if (angle > 112.5 && angle < 157.6) {
                    iUnit.direction = 5; // down-left
                } else if (angle > 157.5 && angle < 180 || angle > -157.5 && angle < -180.1) {
                    iUnit.direction = 6; // left
                } else if (angle < -112.5 && angle > -157.6) {
                    iUnit.direction = 7; // top-left
                }

                // Show next sprite
                if (!(iUnit.animWalking >= iUnit.animWalkingMax)) {
                    iUnit.animWalking += iUnit.spriteHeight;
                } else {
                    // Reset animation after maximum of sprites is reached
                    iUnit.animWalking = 0;
                }
            }
        }
    });

    // Collision Pass
    units.forEach(iUnit => {
        collidables.forEach(iCollidable => {
            if (iUnit != iCollidable) {
                if (doesCollide(iUnit, iCollidable)) {
                    iUnit.targetX = iUnit.x;
                    iUnit.targetY = iUnit.y;

                    iUnit.x = iUnit.x - iUnit.distanceTraveledX;
                    iUnit.y = iUnit.y - iUnit.distanceTraveledY;
                }
            }
        });
    });

    // draw
    ctx.fillStyle = "#C5C19Cff";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
    units.forEach(iUnit => {
        ctx.fillStyle = "#ff111122";
        rect = ctx.fillRect(iUnit.x - iUnit.attackRadius, iUnit.y - iUnit.attackRadius, iUnit.effectiveAttackRadius * 2, iUnit.effectiveAttackRadius * 2);
        ctx.fillStyle = "#11991111";
        rect = ctx.fillRect(iUnit.x - iUnit.sightRadius, iUnit.y - iUnit.sightRadius, iUnit.effectiveSightRadius * 2, iUnit.effectiveSightRadius * 2);
        if (iUnit.iSelected) {
            ctx.strokeStyle = "#11ff11ff";
            rect = ctx.strokeRect(iUnit.x - iUnit.selectionRadius, iUnit.y - iUnit.selectionRadius, iUnit.effectiveSelectionRadius * 2, iUnit.effectiveSelectionRadius * 2);
        }
        ctx.fillStyle = "#11111122";
        rect = ctx.fillRect(iUnit.x, iUnit.y, iUnit.width, iUnit.height);
        ctx.drawImage(
            iUnit.sprite,
            iUnit.direction * iUnit.spriteWidth,
            iUnit.animWalking,
            iUnit.spriteWidth,
            iUnit.spriteHeight,
            iUnit.x,
            iUnit.y,
            iUnit.width,
            iUnit.height);
    });
    requestAnimationFrame(loopy);
}
requestAnimationFrame(loopy);

function doesCollide (rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y);
}

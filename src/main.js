// List of used debug flags (adapt or append as needed)
// @Incomplete - some functionality is missing or could be added/enhanced
// @FIXME - not necessarily broken but should be changed


const canvas = document.getElementById("gameArea");
const ctx = canvas.getContext("2d");
let objectId = 0;
let nextLeftClickAction = "";

//// For Debugging
const DebugFlags = {
    roundPositionUpdateToFullPixels: {
        value: false,
        key: 'r'
    },
    moveOnlyAlong8CardinalDirections: {
        value: false,
        key: 'c'
    }
};
_DebugKeysToFlagNames = {};
Object.keys(DebugFlags).forEach(flag => {
    _DebugKeysToFlagNames[DebugFlags[flag].key] = flag;
});
console.log(`Initial DebugFlags\n${JSON.stringify(DebugFlags, null, 4)}`);
//// For Debugging END

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
window.addEventListener('keydown', on_keydown);

function on_keydown(e) {
    if (Object.keys(_DebugKeysToFlagNames).includes(e.key)) {
        console.log(`DebugFlag '${_DebugKeysToFlagNames[e.key]}' is now set to: ${!DebugFlags[_DebugKeysToFlagNames[e.key]].value}`);
        DebugFlags[_DebugKeysToFlagNames[e.key]].value = !DebugFlags[_DebugKeysToFlagNames[e.key]].value;
    }
    if (e.key = "a") {
        // @FIXME
        if (nextLeftClickAction === "attackMove") {
            canvas.classList.toggle("attackMove");
            nextLeftClickAction = "";
        } else if (selectedUnits.length > 0) {
            canvas.classList.toggle("attackMove");
            nextLeftClickAction = "attackMove";
        }
    }
}

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
        this.attackSpeed = 10; // per x frames
        this.attackCooldown = 20;
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
        this.animWalkingMax = 73 * 4;
        this.animAttackingStart = 73 * 4;
        this.animAttackingMax = 73 * 8;
        this.direction = 0; // @FIXME - should be more descriptive if it is specifically for sprites (we may want/need to save the mathematical direction on Unit)

        // animation
        this.animation = 0;
        this.animPhase = 0;
        this.animFramesBetweenPhases = 9;
        this.animWalking = 0;
        this.animAttacking = 73 * 5;

        // attack
        this.targetUnit = null;
        this.fixedAggro = false;
        this.attackCooldownTicker = 0;
        this.attackPhase = 0;
        this.attackTarget = null;
        this.isAggro = false;
        this.isAttacking = false;
    }

    performAttack(enemy) {
        this.attackPhase++;
        if (this.attackPhase >= this.attackSpeed && this.attackCooldownTicker <= 0) {
            this.attackPhase = 0;
            // Show next sprite
            if (!(this.animAttacking >= this.animAttackingMax)) {
                this.animAttacking += this.spriteHeight;
            } else {
                // Reset animation after maximum of sprites is reached
                enemy.hp -= (this.attack - enemy.defense);
                console.log(enemy.hp);
                this.attackCooldownTicker = this.attackCooldown;
                this.animAttacking = this.animAttackingStart;
            }
        }
    }
}

// @Incomplete if we want a featurecomplete, bugfree (and cornercase respecting) vector class we should use an existing library
class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // @Incomplete
    // All these function (except 'length') return a new vec2 object.
    // Maybe add flag to modify the object the method was called on instead.
    subtract(s) {
        if (typeof s === 'number') {
            return new Vec2(this.x - s, this.y - s);
        }
        return new Vec2(this.x - s.x, this.y - s.y);
    }

    multiply(m) {
        if (typeof m === 'number'){
            return new Vec2(this.x * m, this.y * m);
        }
        return new Vec2(this.x * m.x, this.y * m.y);
    }

    normalize() {
        let length = this.length();
        let x = this.x / length;
        let y = this.y / length;
        return new Vec2(x, y);
    }
    
    length() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }
}

createUnit(100, 100);
createUnit(400, 400);
createUnit(700, 300);


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

    if (nextLeftClickAction === "attackMove") {
        canvas.classList.toggle("attackMove");
        selectedUnits.forEach((unit, idx) => {
            nextLeftClickAction = "";
            unit.isMoving = true;
            unit.isAggro =  true;
            unit.targetUnit = null;
            unit.targetX = e.clientX + (idx * unit.width + 10) - unit.width / 2; // TODO put padding in variable
            unit.targetY = e.clientY + (idx * unit.height + 10) - unit.height / 2;
        });
    } else {
        // Unit selection
        let collisionFound = false;
        units.forEach(unit => {
            if (doesCollide(clicked, unit)) {
                collisionFound = true;
                let doesContain = selectedUnits.find(iSelected => (iSelected.id === unit.id));
                if (!doesContain) {
                    selectedUnits.push(unit);
                    unit.iSelected = true;
                }
            }
        });
        if (!collisionFound) {
            selectedUnits.forEach(unit => {
                unit.iSelected = false;
            });
            selectedUnits = [];
        }
    }
}

function on_canvas_rightclick(e) {
    e.preventDefault();
    // @FIXME Copy pasted from unit selection (left click)
    if (nextLeftClickAction === "attackMove") {
        canvas.classList.toggle("attackMove");
    }

    nextLeftClickAction = "";

    const clicked = {
        width: 1,
        height: 1,
        x: e.clientX,
        y: e.clientY
    }
    let collisionTarget = null;
    units.forEach(unit => {
        if (doesCollide(clicked, unit)) {
            collisionTarget = unit;
            // @FIXME Short circuit missing
        }
    });
    if (collisionTarget) {
        selectedUnits.forEach(unit => {
            unit.targetUnit = collisionTarget;
            unit.fixedAggro = true;
            unit.isAggro = true;
            console.log(unit.isAggro);
            console.log(unit.targetUnit);
        });
    } else {
        selectedUnits.forEach((unit, idx) => {
            unit.isAttacking = false;
            unit.isAggro =  false;
            unit.targetUnit = null;
            unit.targetX = e.clientX + (idx * unit.width + 10) - unit.width / 2; // TODO put padding in variable
            unit.targetY = e.clientY + (idx * unit.height + 10) - unit.height / 2;
        });
    }
}

function doesCollide (rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.height + rect1.y > rect2.y);
}

function update_attacking (dt) {
    units.forEach(unit => {
        unit.attackCooldownTicker--;
        if (!unit.isAggro) {
            return;
        }
        
        let enemy = null;
        let minDistance = null;
        units.forEach(targetUnit => {
            if (unit != targetUnit) {
                let aggroRadius = {
                    x: unit.x - unit.sightRadius, //TODO aggro Radius
                    y: unit.y - unit.sightRadius,
                    width: unit.effectiveSightRadius *2,
                    height: unit.effectiveSightRadius *2
                }

                // Check for target
                if (!unit.fixedAggro) {
                    if (doesCollide(aggroRadius, targetUnit)) {
                        let vecUnit = new Vec2(unit.x, unit.y);
                        let vecTarget = new Vec2(targetUnit.x, targetUnit.y);
                        let distance = vecUnit.subtract(vecTarget);
                        if (minDistance === null) {
                            minDistance = distance;
                            enemy = targetUnit;
                        }
                        if (distance < minDistance) {
                            minDistance = distance;
                            enemy = targetUnit;
                        }
                    }
                } else {
                    enemy = unit.targetUnit;
                }
            }
        });
        unit.targetUnit = enemy;

        let attackRadius = {
            x: unit.x - unit.attackRadius,
            y: unit.y - unit.attackRadius,
            width: unit.effectiveAttackRadius *2,
            height: unit.effectiveAttackRadius *2
        }

        if (unit.targetUnit) {
            unit.targetX = unit.targetUnit.x;
            unit.targetY = unit.targetUnit.y;
            
            if (doesCollide(attackRadius, enemy)) {
                unit.isAttacking = true;
                unit.performAttack(enemy);
            } else {
                unit.isAttacking = false;
            }
        }  
    });
}

function update_movement(dt) {
     // Movement
     units.forEach(unit => {
        if (unit.x != unit.targetX && unit.y != unit.targetY && !unit.isAttacking) {
            // set new position
            let target = new Vec2(unit.targetX, unit.targetY);
            let position = new Vec2(unit.x, unit.y);
            let direction = target.subtract(position);
            let direction_normalized = direction.normalize();
            if (DebugFlags.moveOnlyAlong8CardinalDirections.value) {
                // @FIXME - copy pasted from the walking animation for now
                var angle = Math.atan2(unit.targetY - unit.y, unit.targetX - unit.x) * 180 / Math.PI;
                // Determine direction
                if (angle > -112.5 && angle < -67.6) {
                    direction_normalized = new Vec2(0, -1); // top
                } else if (angle > -67.5 && angle < -22.6) {
                    direction_normalized = new Vec2(1, -1).normalize(); // top-right
                } else if (angle > -22.5 && angle < 22.6) {
                    direction_normalized = new Vec2(1, 0); // right
                } else if (angle > 22.5 && angle < 67.6) {
                    direction_normalized = new Vec2(1, 1).normalize(); // down-right
                } else if (angle > 67.5 && angle < 112.6) {
                    direction_normalized = new Vec2(0, 1); // down
                } else if (angle > 112.5 && angle < 157.6) {
                    direction_normalized = new Vec2(-1, 1).normalize(); // down-left
                } else if (angle > 157.5 && angle < 180 || angle < -157.5 && angle > -180.1) {
                    direction_normalized = new Vec2(-1, 0); // left
                } else if (angle < -112.5 && angle > -157.6) {
                    direction_normalized = new Vec2(-1, -1).normalize(); // top-left
                }
            }

            let velocity = direction_normalized.multiply(unit.movementSpeed);
            let covered_distance = velocity.multiply(dt);
            if (covered_distance.length() > direction.length()) {
                // x,y of the unit + direction should be targetX,Y
                // but that may not be true due to floating point precision?
                // It at least seems not to be a problem
                covered_distance = direction;
            }
            unit.x += covered_distance.x;
            unit.y += covered_distance.y;
            if (DebugFlags.roundPositionUpdateToFullPixels.value) {
                unit.x = Math.round(unit.x);
                unit.y = Math.round(unit.y);
            }


            // Walking animation
            var angle = Math.atan2(unit.targetY - unit.y, unit.targetX - unit.x) * 180 / Math.PI;
            unit.animPhase++;
            if (unit.animPhase >= unit.animFramesBetweenPhases) {
                unit.animPhase = 0;
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
                    unit.direction = 0; // top
                } else if (angle > -67.5 && angle < -22.6) {
                    unit.direction = 1; // top-right
                } else if (angle > -22.5 && angle < 22.6) {
                    unit.direction = 2; // right
                } else if (angle > 22.5 && angle < 67.6) {
                    unit.direction = 3; // down-right
                } else if (angle > 67.5 && angle < 112.6) {
                    unit.direction = 4; // down
                } else if (angle > 112.5 && angle < 157.6) {
                    unit.direction = 5; // down-left
                } else if (angle > 157.5 && angle < 180 || angle < -157.5 && angle > -180.1) {
                    unit.direction = 6; // left
                } else if (angle < -112.5 && angle > -157.6) {
                    unit.direction = 7; // top-left
                }

                // Show next sprite
                if (!(unit.animWalking >= unit.animWalkingMax)) {
                    unit.animWalking += unit.spriteHeight;
                } else {
                    // Reset animation after maximum of sprites is reached
                    unit.animWalking = 0;
                }
            }
        }
    });
}

function update_collision(dt) {
    // Collision Pass
    units.forEach(unit => {
        collidables.forEach(iCollidable => {
            if (unit != iCollidable) {
                if (doesCollide(unit, iCollidable)) {
                    unit.targetX = unit.x;
                    unit.targetY = unit.y;

                    unit.x = unit.x - unit.distanceTraveledX;
                    unit.y = unit.y - unit.distanceTraveledY;
                }
            }
        });
    });
}

function update(dt) {
    update_attacking(dt);
    update_movement(dt);
    update_collision(dt);
}


function flush_canvas() {
    ctx.fillStyle = "#C5C19Cff";
    ctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);
}

function render() {
    flush_canvas()

    units.forEach(unit => {
        // Attack radius
        ctx.fillStyle = "#ff111122";
        rect = ctx.fillRect(unit.x - unit.attackRadius, unit.y - unit.attackRadius, unit.effectiveAttackRadius * 2, unit.effectiveAttackRadius * 2);
        // Sight radius
        ctx.fillStyle = "#11991111";
        rect = ctx.fillRect(unit.x - unit.sightRadius, unit.y - unit.sightRadius, unit.effectiveSightRadius * 2, unit.effectiveSightRadius * 2);
        // Selection border
        if (unit.iSelected) {
            ctx.strokeStyle = "#11ff11ff";
            rect = ctx.strokeRect(unit.x - unit.selectionRadius, unit.y - unit.selectionRadius, unit.effectiveSelectionRadius * 2, unit.effectiveSelectionRadius * 2);
        }
        // Collision radius
        ctx.fillStyle = "#11111122";
        rect = ctx.fillRect(unit.x, unit.y, unit.width, unit.height);

        if (unit.isAttacking) {
            unit.animation = unit.animAttacking;
        } else {
            unit.animation = unit.animWalking;
        }
        // Unit sprite
        ctx.drawImage(
            unit.sprite,
            unit.direction * unit.spriteWidth,
            unit.animation,
            unit.spriteWidth,
            unit.spriteHeight,
            unit.x,
            unit.y,
            unit.width,
            unit.height
        );
    });
}


let lastTimeStamp = 0;
function tick(timeStamp /* DOMHighResTimeStamp */) {
    let dt = (timeStamp - lastTimeStamp) / 1000;
    lastTimeStamp = timeStamp;

    update(dt);
    render();

    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
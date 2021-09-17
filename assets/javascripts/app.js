'use strict'

// Disable dragging

document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());

Math.seedrandom(`${(new Date()).getTime()}`);
let two = new Two({ fullscreen: true, autostart: true }).appendTo(document.body);

// resize the two canvas to allow events to flow to html header

let svg = document.getElementsByTagName('svg')[0];
let header = document.querySelector("#header");
svg.style.top = header.getBoundingClientRect().bottom;

let message = document.querySelector("#message");
let infoA = document.querySelector("#infoA");

const smallScale = 0.6,
    tinyScale = 0.2,
    largeScale = 2;

const startingMessage = 'left/right arrows rotate the ship, up/down arrows control the engine';
const landedMessage = 'well done: take off again by increasing engine level to \'5\'';
const crashedMessage = 'Bad luck !!! - the Eagle has not landed';

let ground, ship, camera, state = startingState;

function startingState() {
    let nextState = flyingState;
    message.textContent = startingMessage;

    two.clear();
    ground = new Terrain(two);
    ship = new Ship(two, 0, ground.minY - 100, 0.5, -0.1, -Math.PI / 2);
    camera = new Camera(two);
    camera.chase = {};

    two.scene.scale = smallScale;
    two.scene.translation.x = two.width / 2;
    two.scene.translation.y = two.height - ground.maxY * smallScale;
    return nextState;
}

function flyingState() {
    let nextState = flyingState;
    camera.chase = { position: ship.translation.clone(), scale: smallScale };

    let groundDistance = ship.hitTest(ground);
    if (groundDistance === 0) {
        nextState = crashState;
    } else {
        let padInfo = ground.padInfoNearest(ship.translation);
        if (padInfo.distance < 20000) {
            nextState = approachingState;
            let position = new Two.Vector(padInfo.center.x, padInfo.center.y - 100 * two.scene.scale);
            camera.chase = { position: position, scale: largeScale };
        } else {
            camera.chase.position.x = ship.translation.x;
            camera.chase.position.y = ship.translation.y / 3;
        }
    }

    return nextState;

}

function approachingState() {
    let nextState = approachingState;
    let groundDistance = ship.hitTest(ground);
    let padInfo = ground.padInfoNearest(ship.translation);

    if (groundDistance === 0) {
        if (padInfo.pad.landTest(ship)) {
            padInfo.pad.fill = 'Green';
            nextState = landedState;
        } else {
            padInfo.pad.fill = 'Red';
            nextState = crashState;
        }
    } else {
        if (padInfo.distance > 30000) {
            nextState = flyingState;
            camera.chase.scale = smallScale;
            padInfo.pad.clearStatus();
        } else {
            padInfo.pad.updateStatus(ship.v, ship.rotation);
        }
    }
    return nextState;
}

function landedState() {
    let nextState = landedState;
    message.textContent = landedMessage;

    if (ship.engineLevel < 5) {
        ship.stopped = true;
    } else {
        ship.fill = 'White';
        ship.stopped = false;
        ship.v.y = -0.1;
        nextState = flyingState;
        message.textContent = startingMessage;
    }
    return nextState;
}

function crashState() {
    let nextState = idleState;
    message.textContent = crashedMessage;

    camera.chase = { position: ship.translation, scale: tinyScale };

    let debris = new Debris(two, ship);
    ship.stopped = true;
    two.remove(ship.group);
    ship = debris;
    return nextState;
}

function idleState() {
    return idleState;
}

document.addEventListener("keydown", event => {
    switch (event.keyCode) {
        case 37: // left
            ship.av -= 0.001;
            break;
        case 38: // up
            ship.engineLevel += 1;
            break;
        case 39: // right
            ship.av += 0.001;
            break;
        case 40: // down
            ship.engineLevel -= 1;
            break;
        default:
            break;
    }

});

let button = document.querySelector("#restart");

button.addEventListener("click", event => {
    state = startingState;
});

// used for debug
let fps = 0;

function currentFPS(dt) {
    let currentFps = (dt) ? 1000 / dt : 0;
    fps += (currentFps - fps) / 50;
    return fps;
}

two.bind('update', (frame, dt) => {
    dt = dt || 0;
    state = state();
    camera.tick(dt);
    ship.tick(dt);
    infoA.innerHTML = `<div style="position:absolute; top 40px; right:0px;">` +
        `<table>` +
            `<tr><td style="width:100px">horizontal speed:&nbsp;</td><td style="width:60px">${ship.v.x.toFixed(3)}</td></tr>` +
            `<tr><td style="width:100px">vertical speed:&nbsp;</td><td style="width:60px">${ship.v.y.toFixed(3)}</td></tr>` +
        `</table>` +
        `</div>`;

});
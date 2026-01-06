// Simple Pong game
// Left paddle = player (mouse + arrow keys)
// Right paddle = computer AI

const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const compScoreEl = document.getElementById('computerScore');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game objects
const paddleWidth = 12;
const paddleHeight = 100;
const paddlePadding = 10;

const player = {
  x: paddlePadding,
  y: (HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 6,
  dy: 0
};

const computer = {
  x: WIDTH - paddleWidth - paddlePadding,
  y: (HEIGHT - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 5
};

const ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 8,
  speed: 5,
  dx: 5,
  dy: 0,
};

let playerScore = 0;
let compScore = 0;

let upPressed = false;
let downPressed = false;

let lastTime = 0;
let paused = false;

// Initialize ball direction
function resetBall(direction = null) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 5;
  // Random vertical angle
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30deg..30deg
  const dir = direction === 'left' ? -1 : direction === 'right' ? 1 : (Math.random() > 0.5 ? 1 : -1);
  ball.dx = dir * ball.speed * Math.cos(angle);
  ball.dy = ball.speed * Math.sin(angle);
}

// Draw helpers
function drawRect(x,y,w,h,color='#fff'){
  ctx.fillStyle = color;
  ctx.fillRect(x,y,w,h);
}
function drawCircle(x,y,r,color='#fff'){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.closePath();
  ctx.fill();
}
function drawNet(){
  const netWidth = 2;
  const segment = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for(let i=0;i<HEIGHT;i += segment*1.5){
    ctx.fillRect((WIDTH/2) - (netWidth/2), i, netWidth, segment);
  }
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Collision detection between ball and paddle
function rectCircleColliding(rect, circle){
  // Find closest point to circle within the rectangle
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;

  return (dx*dx + dy*dy) <= (circle.radius * circle.radius);
}

function update(delta){
  // Player control by keys
  if (upPressed) player.y -= player.speed;
  if (downPressed) player.y += player.speed;

  // Keep player in bounds
  player.y = clamp(player.y, 0, HEIGHT - player.height);

  // Simple AI: follow the ball with limited speed
  const targetY = ball.y - (computer.height / 2);
  if (computer.y + computer.height/2 < ball.y - 6) {
    computer.y += computer.speed;
  } else if (computer.y + computer.height/2 > ball.y + 6) {
    computer.y -= computer.speed;
  }
  computer.y = clamp(computer.y, 0, HEIGHT - computer.height);

  // Move ball
  ball.x += ball.dx;
  ball.y += ball.dy;

  // Top & bottom collision
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.dy = -ball.dy;
  } else if (ball.y + ball.radius >= HEIGHT) {
    ball.y = HEIGHT - ball.radius;
    ball.dy = -ball.dy;
  }

  // Paddle collisions
  if (rectCircleColliding(player, ball) && ball.dx < 0) {
    // reflect
    // compute hit factor (-1 .. 1)
    const relativeIntersectY = (player.y + (player.height/2)) - ball.y;
    const normalized = relativeIntersectY / (player.height/2);
    const bounceAngle = normalized * (Math.PI / 3); // 60 degrees max
    const speedIncrease = 0.5;
    const newSpeed = Math.min(12, ball.speed + speedIncrease);
    ball.speed = newSpeed;
    ball.dx = Math.abs(newSpeed * Math.cos(bounceAngle));
    ball.dy = - newSpeed * Math.sin(bounceAngle);
  } else if (rectCircleColliding(computer, ball) && ball.dx > 0) {
    const relativeIntersectY = (computer.y + (computer.height/2)) - ball.y;
    const normalized = relativeIntersectY / (computer.height/2);
    const bounceAngle = normalized * (Math.PI / 3);
    const speedIncrease = 0.5;
    const newSpeed = Math.min(12, ball.speed + speedIncrease);
    ball.speed = newSpeed;
    ball.dx = - Math.abs(newSpeed * Math.cos(bounceAngle));
    ball.dy = - newSpeed * Math.sin(bounceAngle);
  }

  // Score
  if (ball.x - ball.radius <= 0) {
    // computer scores
    compScore++;
    compScoreEl.textContent = compScore;
    resetBall('right'); // serve toward player (right)
  } else if (ball.x + ball.radius >= WIDTH) {
    // player scores
    playerScore++;
    playerScoreEl.textContent = playerScore;
    resetBall('left'); // serve toward computer (left)
  }
}

function render(){
  // Clear
  ctx.clearRect(0,0,WIDTH,HEIGHT);

  // Background
  ctx.fillStyle = '#07132a';
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // Net
  drawNet();

  // Paddles
  drawRect(player.x, player.y, player.width, player.height, '#22d3ee');
  drawRect(computer.x, computer.y, computer.width, computer.height, '#b3eaf6');

  // Ball
  drawCircle(ball.x, ball.y, ball.radius, '#dbeef6');

  // Optionally draw a stroke around ball
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.stroke();
}

function loop(timestamp){
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!paused) {
    update(delta);
    render();
  }
  requestAnimationFrame(loop);
}

// Input: mouse movement over canvas -> set player's center to mouse position
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height;
  const mouseY = (e.clientY - rect.top) * scaleY;
  player.y = clamp(mouseY - (player.height/2), 0, HEIGHT - player.height);
});

// Keyboard controls
window.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowUp' || e.key === 'Up') {
    upPressed = true;
  } else if (e.key === 'ArrowDown' || e.key === 'Down') {
    downPressed = true;
  } else if (e.key === 'p' || e.key === 'P') {
    paused = !paused;
  } else if (e.key === 'r' || e.key === 'R') {
    // reset scores
    playerScore = 0; compScore = 0;
    playerScoreEl.textContent = playerScore;
    compScoreEl.textContent = compScore;
    resetBall();
  }
});
window.addEventListener('keyup', (e)=>{
  if (e.key === 'ArrowUp' || e.key === 'Up') {
    upPressed = false;
  } else if (e.key === 'ArrowDown' || e.key === 'Down') {
    downPressed = false;
  }
});

// Disable context menu on canvas (so right-click won't get in the way)
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Start
resetBall();
requestAnimationFrame(loop);
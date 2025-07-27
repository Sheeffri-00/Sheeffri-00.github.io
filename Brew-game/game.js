const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const targetY = 500;
const hitWindow = 30;
let spawnRate = 1100;      // Tiempo inicial entre notas (ms)
const minSpawnRate = 500;  // Límite mínimo de generación
const spawnAcceleration = 5; // Cuánto se reduce por paso
let noteSpeed = 2.5;
let selectedStepType = 0;
let score = 0;
let notes = [];
let hitEffects = [];
let showStepNumbers = false; // NUEVO: estado del toggle de números
let lastStepType = -1;
let consecutiveCount = 0;
let comboCount = 0;
let lastComboTime = 0;
let floatingTexts = [];
let shakeDuration = 0;
let shakeAmplitude = 5;
const maxLives = 10;
let lives = 5;
let isGameOver = false;
let destructionParticles = [];
let selectorDestroyed = false;
let gameOverTime = null;

// Aumentar la velocidad del movimiento y frecuencia de notas
setInterval(() => {
  noteSpeed += 0.15;
}, 8000);

// Configuración de estrellas de fondo
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random(),
    delta: Math.random() * 0.02 + 0.005,
    vy: Math.random() * 0.5 + 0.2 // velocidad vertical lenta
  });
}

// Cargar imágenes para cada tipo de nota
const stepImages = [];
const imageSources = [
  "assets/step1.png", // amarillo
  "assets/step2.png", // celeste
  "assets/step3.png", // rojo
  "assets/step4.png"  // morado
];

for (let i = 0; i < 4; i++) {
  const img = new Image();
  img.src = imageSources[i];
  stepImages.push(img);
}

// Generar notas aleatorias
spawnNoteLoop();

// Eventos de teclado
window.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    selectedStepType = (selectedStepType + 1) % 4;
  }
  if (e.key === "p" || e.key === "P") {
    showStepNumbers = !showStepNumbers; // Alternar visibilidad
  }
});

// Dibujar estrellas de fondo
function drawBackgroundStars() {
  for (let star of stars) {
    // Parpadeo suave
    star.opacity += star.delta;
    if (star.opacity >= 1 || star.opacity <= 0) {
      star.delta *= -1;
    }

    // Movimiento vertical hacia abajo
    star.y += star.vy;

    // Reaparece arriba si sale de la pantalla
    if (star.y > height) {
      star.y = -star.radius;
      star.x = Math.random() * width;
    }

    // Dibujo
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
    ctx.fill();
  }
}

function spawnNoteLoop() {
  // Lógica de generación
  let type;
  do {
    type = Math.floor(Math.random() * 4);
  } while (type === lastStepType && consecutiveCount >= 2);

  if (type === lastStepType) {
    consecutiveCount++;
  } else {
    lastStepType = type;
    consecutiveCount = 1;
  }

  notes.push({ type, y: -40 });

  // Disminuir el intervalo gradualmente
  spawnRate = Math.max(minSpawnRate, spawnRate - spawnAcceleration);

  // Llamar nuevamente con el nuevo intervalo
  setTimeout(spawnNoteLoop, spawnRate);
}

// Dibujar imagen con número superpuesto
function drawStepImageWithNumber(img, x, y, size, number) {
  ctx.drawImage(img, x, y, size, size);

  if (showStepNumbers) {
    // Fondo del número (negro)
    ctx.fillStyle = "#000";
    ctx.fillRect(x + 2, y + 2, 14, 14);

    // Número (blanco)
    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(number.toString(), x + 9, y + 9);
  }
}

// Agregar texto flotante
function addFloatingText(text, x, y, color) {
  floatingTexts.push({
    text,
    x,
    y,
    alpha: 1,
    dy: -0.5,
    color
  });
}

// Actualizar y dibujar textos flotantes
function updateAndDrawFloatingTexts() {
  floatingTexts.forEach(ft => {
    ft.y += ft.dy;
    ft.alpha -= 0.02;
    ctx.globalAlpha = ft.alpha;
    ctx.fillStyle = ft.color;
    ctx.font = "20px Arial";
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.globalAlpha = 1;
  });

  // Remover los que ya desaparecieron
  floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
}

function drawCombo()
{
  const scale = 1 + Math.min(comboCount - 4, 20) * 0.05; // crecimiento progresivo, máx 2.0x
  const comboText = `x${comboCount}`;

  ctx.save();
  ctx.translate(width / 2 + 50, targetY - 120); // posición del combo
  ctx.scale(scale, scale);
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 24px Arial";
  ctx.shadowColor = "yellow";
  ctx.shadowBlur = Math.min(comboCount - 4, 20) * 0.25;
  ctx.fillText(comboText, 0, 0);
  ctx.restore();
}

// Dibujar efectos de acierto
function drawHitEffects() {
  for (let effect of hitEffects) {
    ctx.beginPath();
    ctx.arc(width / 2, targetY, effect.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${effect.color.r}, ${effect.color.g}, ${effect.color.b}, ${effect.opacity})`;
    ctx.fill();
    effect.radius += 1.5;
    effect.opacity -= 0.05;
  }
  hitEffects = hitEffects.filter(e => e.opacity > 0);
}

// Dibujar barra de vida
function drawLives() {
  const barWidth = 15;
  const barHeight = 20;
  const spacing = 5;
  const startX = 20;
  const startY = 20;

  // Color interpolado: rojo -> amarillo -> verde
  const t = lives / maxLives;
  let color;
  if (t < 0.5) {
    color = interpolateColor("#FF0000", "#FFFF00", t * 2); // rojo → amarillo
  } else {
    color = interpolateColor("#FFFF00", "#00FF00", (t - 0.5) * 2); // amarillo → verde
  }

  // Brillo si está en vida máxima
  if (lives === maxLives) {
    const glow = Math.sin(Date.now() / 100) * 10 + 25;
    ctx.shadowColor = "#00FFCC"; // color más brillante
    ctx.shadowBlur = glow;
  } else {
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < maxLives; i++) {
    ctx.fillStyle = i < lives ? color : "#333";
    ctx.fillRect(startX + i * (barWidth + spacing), startY, barWidth, barHeight);
  }

  // Contenedor
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX - 5,
    startY - 5,
    maxLives * (barWidth + spacing) - spacing + 10,
    barHeight + 10
  );
}

// Funciones partículas de destrucción
function createDestructionParticles(x, y, color) {
  destructionParticles = [];
  for (let i = 0; i < 20; i++) {
    destructionParticles.push({
      x,
      y,
      radius: Math.random() * 4 + 2,
      dx: (Math.random() - 0.5) * 6,
      dy: (Math.random() - 0.5) * 6,
      alpha: 1,
      color
    });
  }
}
function drawDestructionParticles() {
  destructionParticles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}
function updateDestructionParticles() {
  destructionParticles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    p.alpha -= 0.02;
  });
  destructionParticles = destructionParticles.filter(p => p.alpha > 0);
}

// Dibuja el selector de pasos
function drawSelector() {
  let shakeOffsetX = 0;
  if (shakeDuration > 0) {
    shakeOffsetX = (Math.random() - 0.5) * shakeAmplitude * 2;
    shakeDuration--;
  }
  drawStepImageWithNumber(
    stepImages[selectedStepType],
    width / 2 - 20 + shakeOffsetX,
    targetY - 20,
    40,
    selectedStepType + 1
  );
}

// Colores RGB para efecto visual
function getStepColorRGB(type) {
  const map = [
    { r: 255, g: 255, b: 0 },   // amarillo
    { r: 0, g: 255, b: 255 },   // celeste
    { r: 255, g: 0, b: 0 },     // rojo
    { r: 160, g: 0, b: 255 }    // morado
  ];
  return map[type];
}

// Utilidad: interpolar entre dos colores hex
function interpolateColor(color1, color2, factor) {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  return `rgb(${r}, ${g}, ${b})`;
}

// Dibuja la pantalla de Game Over
function drawGameOverScreen() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";

  // Título
  ctx.fillStyle = "#fff";
  ctx.font = "48px Arial";
  ctx.fillText("🎮 Game Over", width / 2, height / 2 - 100);

  // Fondo destacado para el score
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(width / 2 - 140, height / 2 - 60, 280, 60);
  ctx.strokeStyle = "#fff";
  ctx.strokeRect(width / 2 - 140, height / 2 - 60, 280, 60);

  // Score destacado
  ctx.fillStyle = "#FFD700"; // dorado
  ctx.font = "36px Arial";
  ctx.fillText(`Puntaje: ${score}`, width / 2, height / 2 - 20);

  // Botón ficticio de compartir
  ctx.fillStyle = "#2196F3";
  ctx.fillRect(width / 2 - 80, height / 2 + 20, 160, 40);
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("📤 Compartir", width / 2, height / 2 + 48);

  // Instrucción para reiniciar
  ctx.fillStyle = "#ccc";
  ctx.font = "16px Arial";
  ctx.fillText("Presiona F5 para reiniciar", width / 2, height / 2 + 90);
}

function gameLoop() {
  ctx.clearRect(0, 0, width, height);

  // Dibujar fondo
  drawBackgroundStars();

  // Zona de impacto
  if (!selectorDestroyed && !isGameOver) {
    ctx.fillStyle = "#444";
    ctx.fillRect(width / 2 - 25, targetY - 25, 50, 50);
  }

  // Dibujar notas
  for (let note of notes) {
    note.y += noteSpeed;
    drawStepImageWithNumber(stepImages[note.type], width / 2 - 20, note.y - 20, 40, note.type + 1);    
  }

  // Verificar aciertos
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    if (Math.abs(note.y - targetY) < hitWindow) {
      if (note.type === selectedStepType) {
        comboCount++;
        lastComboTime = Date.now();
        const scoreModifier = 100 + Math.max(comboCount - 3, 0) * 20; // Incremento progresivo
        score += scoreModifier;
        hitEffects.push({
          color: getStepColorRGB(note.type),
          radius: 30,
          opacity: 1
        });

        // Gana una vida con acierto (máximo: maxLives)
        if (lives < maxLives) lives++;

        addFloatingText(`+${Math.abs(scoreModifier)}`, 70, 180, "#44FF00");
      } else {
        comboCount = 0;
        const scoreModifier = -200;
        score = Math.max(score + scoreModifier, 0);        
        shakeDuration = 10;

        // Pierde vidas con error
        lives -= 2;
        if (lives <= 0) {
          isGameOver = true;
        }

        addFloatingText(`-${Math.abs(scoreModifier)}`, 70, 180, "#FF4400");
      }

      notes.splice(i, 1);
      break;
    }  
  }

  // Dibujar barra de vida
  drawLives();

  // Limpiar notas fuera de pantalla
  notes = notes.filter(note => note.y < height + 40);

  // Dibujar efectos
  drawHitEffects();

  // UI Text
  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  //ctx.fillText(`Step Seleccionado: ${selectedStepType + 1}`, 10, 30);
  ctx.fillText(`Score: ${score}`, 10, 100);
  //ctx.fillText(`Mostrar números: ${showStepNumbers ? "Sí (P)" : "No (P)"}`, 10, 130);
  // Mostrar combo si es >= 3 y reciente
  if (comboCount >= 4 && Date.now() - lastComboTime < 2000) {
    drawCombo();
  }

  // Actualizar y dibujar textos flotantes
  updateAndDrawFloatingTexts();

  // Dibujar selector actual
  if (!selectorDestroyed && !isGameOver) {
    drawSelector();
  }

  // Finalizar el juego si se acabaron las vidas
  if (isGameOver) {
    // Marca el momento del Game Over (una sola vez)
    if (gameOverTime === null) {
      gameOverTime = Date.now();
      const x = width / 2;
      const y = targetY - 20;
      const color = getStepColorRGB(selectedStepType);
      //createDestructionParticles(x, y, "#00FFCC");
      createDestructionParticles(x, y, `rgb(${color.r}, ${color.g}, ${color.b})`);
      selectorDestroyed = true;
    }

    // Actualiza y dibuja partículas
    updateDestructionParticles();
    drawDestructionParticles();

    // Mostrar pantalla de Game Over después de 1 segundo
    if (Date.now() - gameOverTime > 1000) {
      drawGameOverScreen();
      return; // Ahora sí detenemos el loop
    }

    requestAnimationFrame(gameLoop);
    return; // Seguimos mostrando las partículas mientras tanto
  }

  // Bucle principal
  requestAnimationFrame(gameLoop);
}

gameLoop();

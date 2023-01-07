import p5 from "p5";

export function drawGrid(p: p5, gridSize = 100, gridColor = "#ffffff") {
  p.stroke(gridColor);

  // Draw vertical lines
  for (let x = 0; x < p.width; x += gridSize) {
    p.line(x, 0, x, p.height);
  }

  // Draw horizontal lines
  for (let y = 0; y < p.height; y += gridSize) {
    p.line(0, y, p.width, y);
  }
}

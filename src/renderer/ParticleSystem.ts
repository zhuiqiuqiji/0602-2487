interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

class ParticleSystem {
  particles: Particle[] = [];

  emit(x: number, y: number, count: number, color: string, speed: number = 30, size: number = 2): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = speed * (0.5 + Math.random() * 0.5);
      const maxLife = 0.3 + Math.random() * 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * magnitude,
        vy: Math.sin(angle) * magnitude,
        life: maxLife,
        maxLife,
        color,
        size,
      });
    }
  }

  emitDig(x: number, y: number): void {
    this.emit(x, y, 8, '#8D6E63', 40, 2);
  }

  emitCombat(x: number, y: number): void {
    this.emit(x, y, 5, '#F44336', 25, 2);
  }

  emitHatch(x: number, y: number): void {
    this.emit(x, y, 10, '#FFFFFF', 20, 3);
  }

  emitFood(x: number, y: number): void {
    this.emit(x, y, 4, '#4CAF50', 15, 2);
  }

  update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 20 * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export default ParticleSystem;

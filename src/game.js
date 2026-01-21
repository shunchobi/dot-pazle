export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.currentLevel = null;
        this.dots = []; // The playable dots {x, y, id}
        this.connectedDots = []; // Indexes of connected dots
        this.image = new Image();
        this.scale = 1;
        this.isCompleted = false;

        // Creator Mode State
        this.isCreatorMode = false;
        this.recordedDots = [];
        this.onDotsRecorded = null; // Callback for UI

        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Handle image load
        this.image.onload = () => {
            this.resizeCanvas();
            this.draw();
        };
    }

    loadLevel(level) {
        this.currentLevel = level;
        this.image.src = level.imageSrc;
        this.dots = level.dots ? [...level.dots] : [];
        this.reset();
    }

    reset() {
        this.connectedDots = [];
        this.isCompleted = false;
        this.recordedDots = [];
        document.getElementById('completion-overlay').classList.add('hidden');
        if (this.isCreatorMode) {
            // In creator mode, start with empty or existing dots to extend?
            // For now, let's start clear to record fresh.
            this.recordedDots = [];
        }
        this.draw();
    }

    setCreatorMode(enabled) {
        this.isCreatorMode = enabled;
        this.reset();
    }

    resizeCanvas() {
        // Fit canvas to image or simple max width
        // For simplicity, match image natural size or limit to window
        // Let's stick to natural size for now to map coordinates 1:1 easily
        this.canvas.width = this.image.naturalWidth;
        this.canvas.height = this.image.naturalHeight;
        this.draw();
    }

    getMousePos(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (evt.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (evt.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleClick(e) {
        const pos = this.getMousePos(e);

        if (this.isCreatorMode) {
            this.handleCreatorClick(pos);
        } else {
            this.handleGameClick(pos);
        }
    }

    handleCreatorClick(pos) {
        const id = this.recordedDots.length + 1;
        this.recordedDots.push({ id, x: Math.round(pos.x), y: Math.round(pos.y) });
        this.draw();
        if (this.onDotsRecorded) {
            this.onDotsRecorded(this.recordedDots);
        }
    }

    handleGameClick(pos) {
        if (this.isCompleted) return;

        const nextDotIndex = this.connectedDots.length; // 0 for first dot (id 1)
        const targetDot = this.dots[nextDotIndex];

        if (!targetDot) return;

        // Check distance
        const dist = Math.hypot(pos.x - targetDot.x, pos.y - targetDot.y);
        const hitRadius = 20; // Tolerance

        if (dist < hitRadius) {
            this.connectedDots.push(nextDotIndex);

            // Completion Check
            if (this.connectedDots.length === this.dots.length) {
                this.isCompleted = true;
                document.getElementById('completion-overlay').classList.remove('hidden');
            }
            this.draw();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Background Image
        if (this.image.complete) {
            this.ctx.drawImage(this.image, 0, 0);
        }

        // 2. Draw Lines
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#4a90e2';
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Choose which dots to draw (Game mode vs Creator mode)
        const activeDots = this.isCreatorMode ? this.recordedDots : this.dots;
        const connectedCount = this.isCreatorMode ? activeDots.length : this.connectedDots.length;

        if (connectedCount > 0) {
            const firstDot = activeDots[0];
            this.ctx.moveTo(firstDot.x, firstDot.y);

            // In game mode, we only draw lines for dots that have been connected
            // In creator mode, we draw lines for all recorded dots to visualize
            const limit = this.isCreatorMode ? activeDots.length : this.connectedDots.length;

            for (let i = 1; i < limit; i++) {
                const dot = activeDots[i];
                this.ctx.lineTo(dot.x, dot.y);
            }

            // If completed, connect back to start? (Optional, usually dot-to-dot ends at last number)
            // But if it's a closed loop shape, typically 1 is connected to N?
            // For now, simple sequence.
        }
        this.ctx.stroke();

        // 3. Draw Dots (Debug/Interaction Visuals)
        // In a real dot-to-dot, the image HAS the dots. We just overlay our logic.
        // But to help the user know where to click (invisible hit zones), maybe we debug draw them
        // or just draw a subtle highlight for the *next* dot?

        // For Creator Mode, we MUST draw dots so we see them.
        if (this.isCreatorMode) {
            this.ctx.fillStyle = 'red';
            activeDots.forEach(dot => {
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(dot.id, dot.x + 5, dot.y - 5);
                this.ctx.fillStyle = 'red';
            });
        } else if (!this.isCompleted && this.dots.length > 0) {
            // In game mode, show a subtle highlight for the next dot to click
            const nextDotIndex = this.connectedDots.length;
            if (nextDotIndex < this.dots.length) {
                const nextDot = this.dots[nextDotIndex];
                this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(nextDot.x, nextDot.y, 25, 0, Math.PI * 2);
                this.ctx.stroke();

                // Pulse effect (optional, commented out for now)
                // this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.3)';
                // this.ctx.beginPath();
                // this.ctx.arc(nextDot.x, nextDot.y, 30, 0, Math.PI * 2);
                // this.ctx.stroke();
            }
        }
    }
}

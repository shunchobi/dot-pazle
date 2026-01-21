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

        // Drawing state for freehand mode
        this.isDrawing = false;
        this.drawnPath = []; // Array of {x, y} points of the user's drawn line

        // Creator Mode State
        this.isCreatorMode = false;
        this.recordedDots = [];
        this.onDotsRecorded = null; // Callback for UI

        // Add event listeners for freehand drawing
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Keep click handler for creator mode
        this.canvas.addEventListener('click', this.handleClick.bind(this));

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.image.complete) {
                this.resizeCanvas();
            }
        });

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
        this.drawnPath = [];
        this.isDrawing = false;
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
        // Fit canvas to screen while maintaining aspect ratio
        const maxWidth = Math.min(800, window.innerWidth - 40); // Leave some margin
        const maxHeight = window.innerHeight - 250; // Leave space for header and controls

        const imageWidth = this.image.naturalWidth;
        const imageHeight = this.image.naturalHeight;
        const imageAspect = imageWidth / imageHeight;

        let displayWidth = maxWidth;
        let displayHeight = maxWidth / imageAspect;

        // If height is too tall, scale based on height instead
        if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = maxHeight * imageAspect;
        }

        // Set canvas display size
        this.canvas.width = imageWidth;
        this.canvas.height = imageHeight;
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';

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
        }
        // Game mode now uses freehand drawing, not click
    }

    handleMouseDown(e) {
        if (this.isCreatorMode || this.isCompleted) return;

        const pos = this.getMousePos(e);
        this.isDrawing = true;
        this.drawnPath = [pos];
    }

    handleMouseMove(e) {
        if (!this.isDrawing || this.isCreatorMode || this.isCompleted) return;

        const pos = this.getMousePos(e);
        this.drawnPath.push(pos);

        // Check if we've passed through the next dot
        this.checkDotProximity(pos);

        this.draw();
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
    }

    checkDotProximity(pos) {
        const nextDotIndex = this.connectedDots.length;
        if (nextDotIndex >= this.dots.length) return;

        const targetDot = this.dots[nextDotIndex];
        const dist = Math.hypot(pos.x - targetDot.x, pos.y - targetDot.y);
        const hitRadius = 30; // Slightly larger for freehand

        if (dist < hitRadius) {
            this.connectedDots.push(nextDotIndex);

            // Completion Check
            if (this.connectedDots.length === this.dots.length) {
                this.isCompleted = true;
                this.isDrawing = false;
                document.getElementById('completion-overlay').classList.remove('hidden');
            }
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

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Background Image
        if (this.image.complete) {
            this.ctx.drawImage(this.image, 0, 0);
        }

        // 2. Draw Lines
        if (this.isCreatorMode) {
            // Creator mode: draw lines connecting recorded dots
            const activeDots = this.recordedDots;
            if (activeDots.length > 0) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = '#4a90e2';
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';

                const firstDot = activeDots[0];
                this.ctx.moveTo(firstDot.x, firstDot.y);

                for (let i = 1; i < activeDots.length; i++) {
                    const dot = activeDots[i];
                    this.ctx.lineTo(dot.x, dot.y);
                }
                this.ctx.stroke();
            }
        } else {
            // Game mode: draw the user's freehand path
            if (this.drawnPath.length > 1) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 3;
                this.ctx.strokeStyle = '#4a90e2';
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';

                this.ctx.moveTo(this.drawnPath[0].x, this.drawnPath[0].y);
                for (let i = 1; i < this.drawnPath.length; i++) {
                    this.ctx.lineTo(this.drawnPath[i].x, this.drawnPath[i].y);
                }
                this.ctx.stroke();
            }

            // Draw connection lines for successfully connected dots
            if (this.connectedDots.length > 0) {
                this.ctx.beginPath();
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = 'rgba(46, 204, 113, 0.5)';
                this.ctx.setLineDash([5, 5]);

                const firstDot = this.dots[this.connectedDots[0]];
                this.ctx.moveTo(firstDot.x, firstDot.y);

                for (let i = 1; i < this.connectedDots.length; i++) {
                    const dot = this.dots[this.connectedDots[i]];
                    this.ctx.lineTo(dot.x, dot.y);
                }
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }

        // 3. Draw Dots (Debug/Interaction Visuals)
        // In a real dot-to-dot, the image HAS the dots. We just overlay our logic.
        // But to help the user know where to click (invisible hit zones), maybe we debug draw them
        // or just draw a subtle highlight for the *next* dot?

        // For Creator Mode, we MUST draw dots so we see them.
        if (this.isCreatorMode) {
            this.ctx.fillStyle = 'red';
            this.recordedDots.forEach(dot => {
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'black';
                this.ctx.fillText(dot.id, dot.x + 5, dot.y - 5);
                this.ctx.fillStyle = 'red';
            });
        } else if (this.dots.length > 0) {
            // In game mode, show visual feedback for dots
            // Draw all passed dots in green
            for (let i = 0; i < this.connectedDots.length; i++) {
                const dot = this.dots[this.connectedDots[i]];
                this.ctx.fillStyle = 'rgba(46, 204, 113, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(dot.x, dot.y, 15, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw checkmark
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(dot.x - 5, dot.y);
                this.ctx.lineTo(dot.x - 2, dot.y + 4);
                this.ctx.lineTo(dot.x + 6, dot.y - 4);
                this.ctx.stroke();
            }

            // Show a highlight for the next dot to pass through
            if (!this.isCompleted) {
                const nextDotIndex = this.connectedDots.length;
                if (nextDotIndex < this.dots.length) {
                    const nextDot = this.dots[nextDotIndex];
                    this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.8)';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(nextDot.x, nextDot.y, 25, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
        }
    }
}

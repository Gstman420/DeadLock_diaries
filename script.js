// Constants for the simulation
const NUM_PHILOSOPHERS = 5;
const TABLE_RADIUS = 150;
const INNER_CIRCLE_RADIUS = 80;
const PHILOSOPHER_RADIUS = 20;
const CHOPSTICK_LENGTH = 40;
const CHOPSTICK_ANIMATION_OFFSET = 20; // How far the chopstick moves when in use
const CHOPSTICK_COLOR = '#2ecc71'; // Green color for all chopsticks
const ARROW_ROTATION_DURATION = 500; // 500ms for smooth rotation

// Animation constants - adjusted for better visibility
const ANIMATION_DURATION = 1000;   // 1 second for transitions
const UPDATE_INTERVAL = 1000;      // 1 second for updates
const THINKING_ANIMATION = {
    scale: [1, 1.3, 1],
    opacity: [1, 0.8, 1]
};
const EATING_ANIMATION = {
    scale: [1, 1.4, 1],
    rotation: [0, 15, -15, 0]
};

// State of the simulation
let philosophers = [];
let chopsticks = [];
let isSimulationRunning = false;
let animationFrameId = null;
let lastUpdateTime = 0;

function startAnimation(philosopher, type) {
    philosopher.animation = {
        startTime: performance.now(),
        duration: ANIMATION_DURATION,
        type: type,
        progress: 0
    };
}

function updateAnimation(philosopher, currentTime) {
    if (philosopher.animation.type) {
        const elapsed = currentTime - philosopher.animation.startTime;
        philosopher.animation.progress = Math.min(1, elapsed / philosopher.animation.duration);
        
        if (philosopher.animation.type === 'thinking') {
            philosopher.scale = interpolate(
                THINKING_ANIMATION.scale[0],
                THINKING_ANIMATION.scale[1],
                easeInOutQuad(philosopher.animation.progress)
            );
        } else if (philosopher.animation.type === 'eating') {
            philosopher.scale = interpolate(
                EATING_ANIMATION.scale[0],
                EATING_ANIMATION.scale[1],
                easeInOutQuad(philosopher.animation.progress)
            );
            philosopher.rotation = (philosopher.animation.progress * 30) * Math.PI / 180; // More rotation
        }

        if (philosopher.animation.progress >= 1) {
            philosopher.animation.type = null;
            philosopher.scale = 1;
            philosopher.rotation = 0;
        }
    }
}

// Animation helper functions
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function interpolate(start, end, progress) {
    return start + (end - start) * progress;
}

// Initialize the simulation
function initSimulation() {
    const canvas = document.createElement('canvas');
    canvas.width = TABLE_RADIUS * 2 + 100;
    canvas.height = TABLE_RADIUS * 2 + 100;
    document.getElementById('simulation-visualization').innerHTML = '';
    document.getElementById('simulation-visualization').appendChild(canvas);
    
    const ctx = canvas.getContext('2d');

    // Reset arrays
    philosophers = [];
    chopsticks = [];

    // Create philosophers and chopsticks
    for (let i = 0; i < NUM_PHILOSOPHERS; i++) {
        const angle = (i * 2 * Math.PI) / NUM_PHILOSOPHERS;
        const x = TABLE_RADIUS + 50 + (TABLE_RADIUS - 30) * Math.cos(angle);
        const y = TABLE_RADIUS + 50 + (TABLE_RADIUS - 30) * Math.sin(angle);

        philosophers.push({
            x,
            y,
            angle,
            state: 'thinking',
            color: '#3498db',
            thinkingTime: Math.random() * 3000 + 2000,
            eatingTime: Math.random() * 2000 + 1000,
            stateTimer: 0,
            animation: {
                startTime: 0,
                duration: 0,
                type: null,
                progress: 0
            },
            scale: 1,
            rotation: 0,
            leftChopstick: null,
            rightChopstick: null
        });

        chopsticks.push({
            x: TABLE_RADIUS + 50 + (TABLE_RADIUS - 40) * Math.cos(angle + Math.PI / NUM_PHILOSOPHERS),
            y: TABLE_RADIUS + 50 + (TABLE_RADIUS - 40) * Math.sin(angle + Math.PI / NUM_PHILOSOPHERS),
            angle: angle + Math.PI / NUM_PHILOSOPHERS,
            available: true,
            owner: null
        });
    }

    // Assign chopsticks to philosophers
    philosophers.forEach((philosopher, index) => {
        philosopher.leftChopstick = chopsticks[index];
        philosopher.rightChopstick = chopsticks[(index + 1) % NUM_PHILOSOPHERS];
    });

    // Draw initial state
    draw(ctx);
}

// Draw the simulation
function draw(ctx) {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw outer table with enhanced gradient
    const outerGradient = ctx.createRadialGradient(
        TABLE_RADIUS + 50, TABLE_RADIUS + 50, 0,
        TABLE_RADIUS + 50, TABLE_RADIUS + 50, TABLE_RADIUS
    );
    outerGradient.addColorStop(0, '#3498db');  // Bright blue center
    outerGradient.addColorStop(0.5, '#2980b9'); // Medium blue
    outerGradient.addColorStop(1, '#2c3e50');   // Dark blue edge
    
    // Add glow effect
    ctx.shadowColor = 'rgba(52, 152, 219, 0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    ctx.arc(TABLE_RADIUS + 50, TABLE_RADIUS + 50, TABLE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = outerGradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw inner circle with enhanced gradient
    const innerGradient = ctx.createRadialGradient(
        TABLE_RADIUS + 50, TABLE_RADIUS + 50, 0,
        TABLE_RADIUS + 50, TABLE_RADIUS + 50, INNER_CIRCLE_RADIUS
    );
    innerGradient.addColorStop(0, '#e74c3c');    // Bright red center
    innerGradient.addColorStop(0.5, '#c0392b');  // Medium red
    innerGradient.addColorStop(1, '#962d22');    // Dark red edge

    // Add inner glow
    ctx.shadowColor = 'rgba(231, 76, 60, 0.4)';
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(TABLE_RADIUS + 50, TABLE_RADIUS + 50, INNER_CIRCLE_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw decorative rings with enhanced effects
    for (let i = 1; i <= 3; i++) {
        const ringRadius = INNER_CIRCLE_RADIUS + (i * 15);
        const opacity = 0.2 - (i * 0.05);
        
        // Add subtle glow to rings
        ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(TABLE_RADIUS + 50, TABLE_RADIUS + 50, ringRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // Draw table border with enhanced glow
    ctx.beginPath();
    ctx.arc(TABLE_RADIUS + 50, TABLE_RADIUS + 50, TABLE_RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(52, 152, 219, 0.6)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw decorative dots around the circle
    for (let i = 0; i < 36; i++) {
        const angle = (i * 10) * Math.PI / 180;
        const dotRadius = TABLE_RADIUS - 5;
        const x = TABLE_RADIUS + 50 + dotRadius * Math.cos(angle);
        const y = TABLE_RADIUS + 50 + dotRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }

    // Draw chopsticks with enhanced appearance
    chopsticks.forEach(chopstick => {
        ctx.save();
        
        // Calculate base position
        let x = chopstick.x;
        let y = chopstick.y;
        
        // If chopstick is in use, move it forward
        if (chopstick.owner !== null) {
            // Calculate the direction vector from table center to chopstick
            const centerX = TABLE_RADIUS + 50;
            const centerY = TABLE_RADIUS + 50;
            const dx = x - centerX;
            const dy = y - centerY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize and scale the movement
            const moveX = (dx / length) * CHOPSTICK_ANIMATION_OFFSET;
            const moveY = (dy / length) * CHOPSTICK_ANIMATION_OFFSET;
            
            // Apply the movement
            x += moveX;
            y += moveY;
        }
        
        ctx.translate(x, y);
        ctx.rotate(chopstick.angle);

        // Draw chopstick shadow
        ctx.beginPath();
        ctx.moveTo(-CHOPSTICK_LENGTH/2, 2);
        ctx.lineTo(CHOPSTICK_LENGTH/2, 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Draw chopstick with consistent green color
        const chopstickGradient = ctx.createLinearGradient(-CHOPSTICK_LENGTH/2, 0, CHOPSTICK_LENGTH/2, 0);
        chopstickGradient.addColorStop(0, CHOPSTICK_COLOR);
        chopstickGradient.addColorStop(1, adjustColor(CHOPSTICK_COLOR, -20));

        ctx.beginPath();
        ctx.moveTo(-CHOPSTICK_LENGTH/2, 0);
        ctx.lineTo(CHOPSTICK_LENGTH/2, 0);
        ctx.strokeStyle = chopstickGradient;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Add a subtle glow effect for chopsticks in use
        if (chopstick.owner !== null) {
            ctx.shadowColor = 'rgba(46, 204, 113, 0.4)';
            ctx.shadowBlur = 10;
            ctx.stroke();
        }

        ctx.restore();
    });

    // Draw philosophers with enhanced appearance
    philosophers.forEach((philosopher, index) => {
        ctx.save();
        ctx.translate(philosopher.x, philosopher.y);
        ctx.rotate(philosopher.rotation);
        ctx.scale(philosopher.scale, philosopher.scale);

        // Draw philosopher shadow with enhanced blur
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        
        ctx.beginPath();
        ctx.arc(2, 2, PHILOSOPHER_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Draw philosopher with enhanced gradient
        const philosopherGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, PHILOSOPHER_RADIUS);
        philosopherGradient.addColorStop(0, philosopher.color);
        philosopherGradient.addColorStop(1, adjustColor(philosopher.color, -30));

        ctx.beginPath();
        ctx.arc(0, 0, PHILOSOPHER_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = philosopherGradient;
        ctx.fill();

        // Draw philosopher border with glow
        ctx.beginPath();
        ctx.arc(0, 0, PHILOSOPHER_RADIUS, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw philosopher number with enhanced style
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(index + 1, 0, 0);

        ctx.restore();

        // Draw state with enhanced background
        const stateText = philosopher.state;
        ctx.font = 'bold 14px Arial';
        const stateWidth = ctx.measureText(stateText).width;
        const stateX = philosopher.x - stateWidth/2;
        const stateY = philosopher.y + PHILOSOPHER_RADIUS + 20;

        // Draw state background with enhanced style
        const padding = 8;
        const boxHeight = 24;
        const boxWidth = stateWidth + (padding * 2);
        const radius = 12;

        // Draw shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Draw background with gradient
        const stateGradient = ctx.createLinearGradient(stateX - padding, stateY - boxHeight/2, stateX - padding, stateY + boxHeight/2);
        stateGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        stateGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');

        ctx.beginPath();
        ctx.moveTo(stateX - padding + radius, stateY - boxHeight/2);
        ctx.lineTo(stateX - padding + boxWidth - radius, stateY - boxHeight/2);
        ctx.quadraticCurveTo(stateX - padding + boxWidth, stateY - boxHeight/2, stateX - padding + boxWidth, stateY - boxHeight/2 + radius);
        ctx.lineTo(stateX - padding + boxWidth, stateY + boxHeight/2 - radius);
        ctx.quadraticCurveTo(stateX - padding + boxWidth, stateY + boxHeight/2, stateX - padding + boxWidth - radius, stateY + boxHeight/2);
        ctx.lineTo(stateX - padding + radius, stateY + boxHeight/2);
        ctx.quadraticCurveTo(stateX - padding, stateY + boxHeight/2, stateX - padding, stateY + boxHeight/2 - radius);
        ctx.lineTo(stateX - padding, stateY - boxHeight/2 + radius);
        ctx.quadraticCurveTo(stateX - padding, stateY - boxHeight/2, stateX - padding + radius, stateY - boxHeight/2);
        ctx.closePath();
        ctx.fillStyle = stateGradient;
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Draw state text
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stateText, philosopher.x, stateY);
    });
}

// Helper function to adjust color brightness
function adjustColor(color, amount) {
    return '#' + color.replace(/^#/, '').replace(/../g, color => 
        ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
    );
}

// Helper function to check if neighbors are eating
function canPhilosopherEat(index) {
    const leftNeighbor = (index - 1 + NUM_PHILOSOPHERS) % NUM_PHILOSOPHERS;
    const rightNeighbor = (index + 1) % NUM_PHILOSOPHERS;
    
    // Check if either neighbor is eating
    if (philosophers[leftNeighbor].state === 'eating' || 
        philosophers[rightNeighbor].state === 'eating') {
        return false;
    }
    
    // Check if both chopsticks are available
    if (!philosophers[index].leftChopstick.available || 
        !philosophers[index].rightChopstick.available) {
        return false;
    }
    
    return true;
}

// Helper function to implement asymmetric strategy
function tryPickupChopsticks(index) {
    const isEven = index % 2 === 0;
    const philosopher = philosophers[index];
    
    if (isEven) {
        // Even philosophers try left first, then right
        if (philosopher.leftChopstick.available) {
            philosopher.leftChopstick.available = false;
            philosopher.leftChopstick.owner = index;
            if (philosopher.rightChopstick.available) {
                philosopher.rightChopstick.available = false;
                philosopher.rightChopstick.owner = index;
                return true;
            } else {
                // Release left chopstick if right is not available
                philosopher.leftChopstick.available = true;
                philosopher.leftChopstick.owner = null;
            }
        }
    } else {
        // Odd philosophers try right first, then left
        if (philosopher.rightChopstick.available) {
            philosopher.rightChopstick.available = false;
            philosopher.rightChopstick.owner = index;
            if (philosopher.leftChopstick.available) {
                philosopher.leftChopstick.available = false;
                philosopher.leftChopstick.owner = index;
                return true;
            } else {
                // Release right chopstick if left is not available
                philosopher.rightChopstick.available = true;
                philosopher.rightChopstick.owner = null;
            }
        }
    }
    return false;
}

// Update the updateSimulation function to remove arrow tracking
function updateSimulation(deltaTime) {
    const currentTime = performance.now();
    const stateList = document.getElementById('state-list');
    stateList.innerHTML = '';

    philosophers.forEach((philosopher, index) => {
        // Update animation
        updateAnimation(philosopher, currentTime);

        philosopher.stateTimer += deltaTime;

        switch (philosopher.state) {
            case 'thinking':
                if (philosopher.stateTimer >= philosopher.thinkingTime) {
                    philosopher.state = 'hungry';
                    philosopher.color = '#e67e22'; // Yellow for hungry
                    philosopher.stateTimer = 0;
                    startAnimation(philosopher, 'hungry');
                }
                break;

            case 'hungry':
                if (canPhilosopherEat(index) && tryPickupChopsticks(index)) {
                    philosopher.state = 'eating';
                    philosopher.color = '#27ae60'; // Green for eating
                    philosopher.stateTimer = 0;
                    startAnimation(philosopher, 'eating');
                }
                break;

            case 'eating':
                if (philosopher.stateTimer >= philosopher.eatingTime) {
                    // Release both chopsticks
                    philosopher.leftChopstick.available = true;
                    philosopher.leftChopstick.owner = null;
                    philosopher.rightChopstick.available = true;
                    philosopher.rightChopstick.owner = null;
                    
                    philosopher.state = 'thinking';
                    philosopher.color = '#3498db'; // Blue for thinking
                    philosopher.stateTimer = 0;
                    philosopher.thinkingTime = Math.random() * 3000 + 2000;
                    startAnimation(philosopher, 'thinking');
                }
                break;
        }

        // Update state list
        const stateItem = document.createElement('li');
        stateItem.innerHTML = `
            <span class="color-box ${philosopher.state}"></span>
            Philosopher ${index + 1}: ${philosopher.state}
        `;
        stateList.appendChild(stateItem);
    });

    // Draw immediately after state updates
    draw(document.querySelector('canvas').getContext('2d'));
}

// Animation loop
function animate(currentTime) {
    if (!isSimulationRunning) return;

    if (!lastUpdateTime) lastUpdateTime = currentTime;
    const deltaTime = currentTime - lastUpdateTime;

    if (deltaTime >= UPDATE_INTERVAL) {
        updateSimulation(deltaTime);
        lastUpdateTime = currentTime;
    }

    animationFrameId = requestAnimationFrame(animate);
}

// Event listeners
document.getElementById('start-sim').addEventListener('click', function() {
    if (!isSimulationRunning) {
        isSimulationRunning = true;
        lastUpdateTime = performance.now();
        animate(lastUpdateTime);
        scrollToSimulation();
    }
});

document.getElementById('pause-sim').addEventListener('click', () => {
    isSimulationRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // First reset all chopsticks to available
    chopsticks.forEach(chopstick => {
        chopstick.available = true;
        chopstick.owner = null;
    });

    // Then update chopstick states based on philosopher states
    philosophers.forEach((philosopher, index) => {
        if (philosopher.state === 'eating') {
            // Only if philosopher is eating, both chopsticks should be unavailable
            philosopher.leftChopstick.available = false;
            philosopher.rightChopstick.available = false;
            philosopher.leftChopstick.owner = index;
            philosopher.rightChopstick.owner = index;
        }
        // For both thinking and hungry states, chopsticks remain available (green)
    });

    // Update state list
    const stateList = document.getElementById('state-list');
    stateList.innerHTML = '';
    philosophers.forEach((philosopher, index) => {
        const stateItem = document.createElement('li');
        stateItem.innerHTML = `
            <span class="color-box ${philosopher.state}"></span>
            Philosopher ${index + 1}: ${philosopher.state}
        `;
        stateList.appendChild(stateItem);
    });

    // Redraw the simulation to reflect the correct states
    draw(document.querySelector('canvas').getContext('2d'));
    scrollToSimulation();
});

document.getElementById('reset-sim').addEventListener('click', () => {
    isSimulationRunning = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    
    // Reset the simulation
    initSimulation();
    
    // Reset the state list
    const stateList = document.getElementById('state-list');
    stateList.innerHTML = '';
    philosophers.forEach((philosopher, index) => {
        const stateItem = document.createElement('li');
        stateItem.innerHTML = `
            <span class="color-box ${philosopher.state}"></span>
            Philosopher ${index + 1}: ${philosopher.state}
        `;
        stateList.appendChild(stateItem);
    });
    
    scrollToSimulation();
});

// Initialize when the page loads
window.addEventListener('load', initSimulation);

// Add this after the initSimulation function
function scrollToSimulation() {
    const simulationSection = document.getElementById('simulation');
    simulationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
} 
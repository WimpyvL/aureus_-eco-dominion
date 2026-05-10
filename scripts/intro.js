import { spawn } from 'child_process';
import readline from 'readline';

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",
};

const logo = [
    " █████╗ ██╗   ██╗██████╗ ███████╗██╗   ██╗███████╗",
    "██╔══██╗██║   ██║██╔══██╗██╔════╝██║   ██║██╔════╝",
    "███████║██║   ██║██████╔╝█████╗  ██║   ██║███████╗",
    "██╔══██║██║   ██║██╔══██╗██╔══╝  ██║   ██║╚════██║",
    "██║  ██║╚██████╔╝██║  ██║███████╗╚██████╔╝███████║",
    "╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝"
];

const subtitle = "--- ECO-DOMINION SANI CORE ---";

const files = [
    "engine/kernel/EventBus.ts",
    "engine/space/ActiveSet.ts",
    "engine/render/ThreeRenderAdapter.ts",
    "game/state/World.ts",
    "services/api/client.ts"
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runIntro() {
    process.stdout.write('\x1Bc'); // Clear screen

    // Step 1: Fake loading logs
    for (const file of files) {
        console.log(`${colors.dim}[WAIT]${colors.reset} Initializing ${file}...`);
        await sleep(Math.random() * 200 + 50);
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        console.log(`${colors.fgGreen}[OK]${colors.reset} ${file} stabilized.`);
    }

    await sleep(300);
    process.stdout.write('\x1Bc');

    // Step 2: Logo animation (flickering in)
    for (let flicker = 0; flicker < 5; flicker++) {
        readline.cursorTo(process.stdout, 0, 0);
        if (flicker % 2 === 0) {
            logo.forEach(line => console.log(`${colors.fgYellow}${colors.bright}${line}${colors.reset}`));
        } else {
            logo.forEach(() => console.log(""));
        }
        await sleep(100);
    }

    // Step 3: Final Logo and Progress
    const frames = 30;
    for (let i = 0; i <= frames; i++) {
        readline.cursorTo(process.stdout, 0, 0);

        // Logo
        logo.forEach(line => console.log(`${colors.fgYellow}${colors.bright}${line}${colors.reset}`));

        console.log(`\n${colors.fgCyan}${colors.bright}    ${subtitle}${colors.reset}\n`);

        // Progress bar
        const progress = Math.round((i / frames) * 100);
        const barWidth = 40;
        const filledWidth = Math.round((i / frames) * barWidth);
        const bar = "█".repeat(filledWidth) + "░".repeat(barWidth - filledWidth);

        console.log(`    SYSTEM STATUS: [${colors.fgCyan}${bar}${colors.reset}] ${progress}%`);

        if (i === frames) {
            console.log(`\n${colors.fgGreen}${colors.bright}    >> LINK ESTABLISHED. REDIRECTING TO VITE ENGINE...${colors.reset}\n`);
        }

        await sleep(30);
    }

    await sleep(800);
}

runIntro().then(() => {
    const child = spawn('npm', ['run', 'vite'], {
        stdio: 'inherit',
        shell: true
    });
});

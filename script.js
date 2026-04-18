
const bootBtn = document.getElementById("bootBtn");
const boot = document.getElementById("boot");
const desktop = document.getElementById("desktop");

const terminal = document.getElementById("terminal");
const header = document.getElementById("header");
const closeBtn = document.getElementById("closeBtn");
const terminalIcon = document.getElementById("terminalIcon");

const aboutIcon = document.getElementById("aboutIcon");
const aboutWin = document.getElementById("aboutWin");
const aboutHeader = document.getElementById("aboutHeader");
const aboutClose = document.getElementById("aboutClose");

const instructionsIcon = document.getElementById("instructionsIcon");
const instructionsWin = document.getElementById("instructionsWin");
const instructionsHeader = document.getElementById("instructionsHeader");
const instructionsClose = document.getElementById("instructionsClose");

const out = document.getElementById("out");
const cmd = document.getElementById("cmd");
const prompt = document.getElementById("prompt");
function startOS() {
    document.getElementById('boot').style.display = 'none';
    document.getElementById('desktop').style.display = 'block';
    renderPrompt();
}

/* WINDOW STACKING Z-INDEX MANAGER */
let highestZ = 10;
function bringToFront(win) {
    highestZ++;
    win.style.zIndex = highestZ;
}

const allWindows = document.querySelectorAll('.window');
allWindows.forEach(win => {
    win.addEventListener('mousedown', () => bringToFront(win));
    win.addEventListener('touchstart', () => bringToFront(win), {passive: true});
});

/* FILESYSTEM */
let fs = JSON.parse(localStorage.getItem("fs95")) || {
    home: { user: { docs: {}, "notes.txt": "Win95 shell ready. The system is functioning normally." } }
};

let cwd = ["home", "user"];
let history = [];
let hIndex = 0;

bootBtn.onclick = () => {
    boot.style.display = "none";
    desktop.style.display = "block";
    renderPrompt();
};

/* WINDOW CONTROL - Single Tap/Click Mapped */
terminalIcon.onclick = () => {
    terminal.style.display = "flex";
    bringToFront(terminal);
    cmd.focus();
};

aboutIcon.onclick = () => {
    aboutWin.style.display = "flex";
    bringToFront(aboutWin);
};

instructionsIcon.onclick = () => {
    instructionsWin.style.display = "flex";
    bringToFront(instructionsWin);
};

/* Auto-focus terminal input when clicking inside the window */
terminal.onclick = () => cmd.focus();

/* Close buttons */
aboutClose.onclick = () => aboutWin.style.display = "none";
instructionsClose.onclick = () => instructionsWin.style.display = "none";
closeBtn.onclick = () => terminal.style.display = "none";

/* Dragging logic */
function drag(win, bar) {
    let active = false, dx = 0, dy = 0;

    // Mouse events
    bar.onmousedown = e => {
        active = true;
        dx = e.clientX - win.offsetLeft;
        dy = e.clientY - win.offsetTop;
        bringToFront(win);
    };

    document.addEventListener("mousemove", e => {
        if (!active) return;
        win.style.left = e.clientX - dx + "px";
        win.style.top = e.clientY - dy + "px";
    });

    document.addEventListener("mouseup", () => active = false);

    // Touch events for mobile
    bar.ontouchstart = e => {
        active = true;
        let touch = e.touches[0];
        dx = touch.clientX - win.offsetLeft;
        dy = touch.clientY - win.offsetTop;
        bringToFront(win);
    };

    document.addEventListener("touchmove", e => {
        if (!active) return;
        let touch = e.touches[0];
        win.style.left = touch.clientX - dx + "px";
        win.style.top = touch.clientY - dy + "px";
    }, {passive: false});

    document.addEventListener("touchend", () => active = false);
}

drag(terminal, header);
drag(aboutWin, aboutHeader);
drag(instructionsWin, instructionsHeader);

/* TERMINAL CORE */
function resolve(p) {
    if (!p || p === "~") return ["home", "user"];
    let base = p.startsWith("/") ? [] : [...cwd];
    
    p.split("/").forEach(x => {
        if (!x || x === ".") return;
        if (x === "..") {
            // Edge Case fix: Prevent going higher than root
            if (base.length > 0) base.pop();
        } else {
            base.push(x);
        }
    });
    return base;
}

function get(path) {
    let ref = fs;
    for (const p of path) {
        if (typeof ref !== "object" || !(p in ref)) return null;
        ref = ref[p];
    }
    return ref;
}

function parent(path) {
    let p = [...path];
    let name = p.pop();
    return [get(p), name];
}

function renderPrompt() {
    prompt.textContent = "user@os95:/" + cwd.join("/") + " $ ";
}

function print(t = "") {
    out.innerText += "\n" + t;
    // Auto-scroll to bottom reliably
    setTimeout(() => {
        out.scrollTop = out.scrollHeight;
    }, 10);
}

function save() {
    localStorage.setItem("fs95", JSON.stringify(fs));
}

/* COMMANDS */
const commands = {
    help: () => print(
        "Available Commands:\n" +
        "  ls        - List contents of current or specified directory\n" +
        "  pwd       - Print the working directory path\n" +
        "  cd [dir]  - Change directory (defaults to home)\n" +
        "  mkdir [d] - Create a new directory\n" +
        "  touch [f] - Create a new empty file\n" +
        "  rm [f]    - Remove a file or directory\n" +
        "  cat [f]   - Display the contents of a file\n" +
        "  cp [s] [d]- Copy a source file/dir to destination\n" +
        "  mv [s] [d]- Move or rename a file/dir\n" +
        "  grep [t][f]- Search for text within a file\n" +
        "  echo [t]  - Print text to the terminal\n" +
        "  whoami    - Display current user\n" +
        "  date      - Display current system date\n" +
        "  time      - Display current system time\n" +
        "  history   - Show list of previously used commands\n" +
        "  clear     - Clear terminal output screen\n" +
        "  reset     - WIPE ALL DATA and reboot system"
    ),
    
    whoami: () => print("Current user: user"),
    date: () => print(new Date().toDateString()),
    time: () => print(new Date().toLocaleTimeString()),
    history: () => {
        if (history.length === 0) return print("History is empty.");
        history.forEach((h, i) => print(`  ${i + 1}  ${h}`));
    },
    
    ls: a => {
        let pathArr = a[0] ? resolve(a[0]) : cwd;
        let d = get(pathArr);
        if (!d) return print(`ls: cannot access '${a[0]}': No such file or directory`);
        if (typeof d !== "object") return print(`ls: cannot access '${a[0]}': Not a directory`);
        
        let keys = Object.keys(d);
        if (keys.length === 0) return print("[Empty directory]"); 
        print(keys.join("   "));
        print(`\nTotal items: ${keys.length}`);
    },
    
    pwd: () => print("/" + cwd.join("/")),
    
    cd: a => {
        let targetStr = a[0] || "~"; // Default to home
        let p = resolve(targetStr);
        let targetObj = get(p);
        
        if (targetObj && typeof targetObj === "object") {
            cwd = p;
        } else if (targetObj !== null) {
            print(`cd: ${targetStr}: Not a directory`);
        } else {
            print(`cd: ${targetStr}: No such file or directory`);
        }
    },
    
    mkdir: a => {
        if(!a[0]) return print("mkdir: missing operand (e.g. mkdir myfolder)");
        let [par, name] = parent(resolve(a[0]));
        
        if (!par) return print(`mkdir: cannot create directory '${a[0]}': Path does not exist`);
        if (typeof par !== "object") return print(`mkdir: cannot create directory '${a[0]}': Parent is not a directory`);
        if (name in par) return print(`mkdir: cannot create directory '${a[0]}': File or folder already exists`);
        
        par[name] = {};
        print(`Directory '${name}' successfully created.`);
    },
    
    touch: a => {
        if(!a[0]) return print("touch: missing file operand");
        let [par, name] = parent(resolve(a[0]));
        
        if (!par) return print(`touch: cannot touch '${a[0]}': No such directory`);
        if (typeof par !== "object") return print(`touch: cannot touch '${a[0]}': Not a directory path`);
        if (typeof par[name] === "object") return print(`touch: cannot touch '${a[0]}': Is a directory`);
        
        par[name] = "";
        print(`File '${name}' created.`);
    },
    
    cat: a => {
        if(!a[0]) return print("cat: missing file operand");
        let f = get(resolve(a[0]));
        
        if (f === null) return print(`cat: ${a[0]}: No such file or directory`);
        if (typeof f === "object") return print(`cat: ${a[0]}: Is a directory`);
        
        print(f);
    },
    
    rm: a => {
        if(!a[0]) return print("rm: missing operand");
        let [par, name] = parent(resolve(a[0]));
        
        if (!par || !(name in par)) return print(`rm: cannot remove '${a[0]}': No such file or directory`);
        
        let type = typeof par[name] === "object" ? "Directory" : "File";
        delete par[name];
        print(`${type} '${name}' deleted successfully.`);
    },
    
    cp: a => {
        if(a.length < 2) return print("cp: missing source or destination operand");
        let src = get(resolve(a[0]));
        let [par, name] = parent(resolve(a[1]));
        
        if (src === null) return print(`cp: cannot stat '${a[0]}': No such file or directory`);
        if (!par) return print(`cp: cannot create regular file '${a[1]}': No such directory`);
        
        par[name] = JSON.parse(JSON.stringify(src)); // Deep copy
        print(`Copied to '${a[1]}' successfully.`);
    },
    
    mv: a => {
        if(a.length < 2) return print("mv: missing source or destination operand");
        let src = get(resolve(a[0]));
        if (src === null) return print(`mv: cannot stat '${a[0]}': No such file or directory`);
        
        commands.cp(a);
        if(get(resolve(a[1])) !== null) { // Only remove original if copy succeeded
            commands.rm([a[0]]);
        }
    },
    
    grep: a => {
        if(a.length < 2) return print("grep: missing search text or file operand");
        let txt = a[0];
        let file = get(resolve(a[1]));
        
        if (file === null) return print(`grep: ${a[1]}: No such file or directory`);
        if (typeof file === "object") return print(`grep: ${a[1]}: Is a directory`);
        
        let matches = 0;
        file.split("\n").forEach(l => {
            if (l.includes(txt)) {
                print(l);
                matches++;
            }
        });
        if (matches === 0) print(`No matches found for '${txt}' in ${a[1]}.`);
    },
    
    clear: () => { out.innerText = ""; },
    
    reset: () => {
        print("Wiping filesystem and rebooting...");
        setTimeout(() => {
            localStorage.clear();
            location.reload();
        }, 1000);
    },
    
    echo: a => print(a.join(" "))
};

/* INPUT ENGINE */
cmd.onkeydown = e => {
    if (e.key === "Enter") {
        let line = cmd.value.trim();
        print(prompt.textContent + line);
        
        if (line) {
            history.push(line);
            hIndex = history.length;
            
            // Split by space but ignore extra spaces
            let parts = line.split(/\s+/);
            let c = parts[0];
            
            if (commands[c]) {
                commands[c](parts.slice(1));
            } else {
                print(`bash: ${c}: command not found. Type 'help' for available commands.`);
            }
        }
        
        cmd.value = "";
        renderPrompt();
        save();
    }
    
    // Command history traversal
    if (e.key === "ArrowUp") {
        if(history.length > 0) {
            hIndex = Math.max(0, hIndex - 1);
            cmd.value = history[hIndex] || "";
            // Prevent cursor from jumping to the beginning
            setTimeout(() => { cmd.selectionStart = cmd.selectionEnd = cmd.value.length; }, 0);
        }
    }
    
    if (e.key === "ArrowDown") {
        if(history.length > 0) {
            hIndex = Math.min(history.length, hIndex + 1);
            cmd.value = history[hIndex] || "";
        }
    }
};
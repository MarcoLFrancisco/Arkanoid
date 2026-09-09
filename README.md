# Neon Arkanoid

A neon browser brick-breaker game built with HTML, CSS, JavaScript, and Canvas.

## How to download, open in VS Code, and run

### 1. Install the prerequisites

- **Visual Studio Code:** https://code.visualstudio.com/
- **Python 3:** https://www.python.org/downloads/ — used only to start a local web server.
- A current **Chrome, Edge, Firefox, or Safari** browser. The game requires JavaScript modules, Pointer Events, and Canvas 2D `roundRect` support.

No Node.js, npm installation, build step, or VS Code extension is required.

### 2. Get the game from GitHub: clone or download

Choose either option below. Both require access to GitHub to download the project; playing locally afterward does not require GitHub. Make sure the game changes have been merged into the repository's default branch first.

#### Option A — Clone with Git

Install **Git** from https://git-scm.com/downloads if needed, then reopen your terminal so Git is available.

Open a terminal in the parent folder where you want to store the project, such as your projects folder. Run these commands one at a time:

```sh
git --version
git clone https://github.com/MarcoLFrancisco/Arkanoid.git
cd Arkanoid
```

Expected result: Git creates an `Arkanoid` folder containing the repository files and checks out its default branch. After `cd Arkanoid`, your terminal is in the project root containing `index.html`.

To open that folder in VS Code, run the following if the VS Code command-line launcher is available:

```sh
code .
```

If `code` is not recognized, use **File > Open Folder…** in VS Code and select the new `Arkanoid` folder, as described in step 3. Continue to step 4 to start the local server.

These are standard Git and VS Code commands; they have not been executed in this review environment.

#### Option B — Download ZIP (no Git required)

1. Open https://github.com/MarcoLFrancisco/Arkanoid.
2. Select the repository's default branch.
3. Click the green **Code** button, then **Download ZIP**.
4. Extract the ZIP into a folder on your computer. Do not work inside the ZIP archive.
5. Continue to step 3 to open the extracted project in VS Code.

If you already have a local copy, update it with the latest merged files instead. Preserve any local edits before replacing files or updating your checkout.

### 3. Open the project folder in VS Code

1. Start VS Code.
2. Choose **File > Open Folder…**.
3. Select the folder that directly contains `index.html`: `Arkanoid` if you cloned it, or the extracted ZIP folder (which may be named `Arkanoid-main` or similar).
4. Click **Select Folder** or **Open**.

The VS Code Explorer should show this structure:

```text
index.html
styles.css
README.md
src/
  levels.js
  game.js
  renderer.js
  main.js
```

If Explorer shows only another enclosing folder, open that inner project folder instead. Do not open only `src/` or only `index.html`.

### 4. Start the game server from the VS Code terminal

Choose **Terminal > New Terminal**. Its working directory must be the project folder containing `index.html`, not `src/` or the parent downloads folder.

You can confirm the directory contents with `dir` in Windows PowerShell or `ls` on macOS/Linux. The output should include `index.html`, `styles.css`, and `src`.

**Windows — run these commands one at a time:**

```sh
py -3 --version
py -3 -m http.server 8000 --bind 127.0.0.1
```

**macOS/Linux — run these commands one at a time:**

```sh
python3 --version
python3 -m http.server 8000 --bind 127.0.0.1
```

The version command should report Python 3. The server command should report that it is serving HTTP on port 8000 and remain running. Keep this terminal open while playing.

These are standard Python commands, not repository scripts. Source inspection confirms the game uses static files and relative JavaScript module imports with no build configuration. These commands have not been executed in this review environment.

### 5. Open and play in your browser

1. Open **http://127.0.0.1:8000/** in your browser.
2. Expect the neon game interface and an enabled **Start game** button.
3. Click **Start game**.
4. Press **Space** or click **Launch ball** to begin.

VS Code is the editor; the game runs in the browser. You do not need VS Code's Run button or F5.

Do not double-click `index.html` to play. Opening it with a `file://` URL can prevent the JavaScript modules from loading.

### 6. Edit or stop the game

- After editing code in VS Code, save the file and refresh the browser to load the change. Refreshing resets the current game.
- To stop the server, click its terminal and press **Ctrl+C**.
- To play later, reopen the project folder, run the server command again, and visit the same browser URL.

## Controls

- **Move:** Left/Right arrows, A/D, or mouse/touch movement on the playfield.
- **Launch:** Space, Launch ball button, or click/tap on the playfield.
- **Pause/resume:** P, Escape, or the Pause/Resume buttons.
- **Play again:** Use the button after winning or losing.

Aim rebounds with different parts of the paddle. Clear bricks to progress through five levels. Armored bricks require multiple hits. Leaving the window or hiding the tab pauses active gameplay.

## Testing and expected results

There is no automated test suite, test command, package manifest, or build configuration in this repository. Do not run `npm test` or `npm run build`; those scripts do not exist. Runtime behavior has not been verified in this review environment.

After following the local VS Code setup above, perform these manual browser checks:

1. **Startup:** The start button becomes enabled, and browser developer tools show no failed source requests or uncaught errors.
2. **Controls:** Start and launch the ball. Test keyboard and mouse movement; the paddle should stay inside the field. While holding a movement key, move the mouse to the opposite side of the playfield, then release the key without moving the mouse again. The paddle should stop rather than chase the ignored pointer position. Move the mouse again to regain pointer control. Keyboard movement takes priority while movement keys are held.
3. **Collisions:** The ball should bounce off the paddle, bricks, and top/side walls. Bricks should take damage and the score should increase.
4. **Lives:** Missing the ball should reduce lives. Losing all lives should display Game over; Play again should reset gameplay.
5. **Progression:** Clearing a formation should advance to the next level. Clearing all five should show the victory screen.
6. **Pause:** Test the pause button, P, Escape, and switching tabs. Gameplay should freeze and resume without a large movement jump.
7. **Layout:** Resize the browser. The playfield should retain its proportions and buttons should remain usable.
8. **Reduced motion:** Enable your system's reduced-motion setting. Ball trails and particles should be disabled while gameplay remains functional.

These are expected results, not recorded passing tests. Opening developer tools can remove focus and pause the game; resume before continuing.

### Touch devices and external environments

No external service, account, credentials, or database is required for local desktop play.

Real touch-device validation is separate from local VS Code checks. Test dragging, tapping to launch, releasing a drag, and orientation changes on actual touch hardware; browser mobile emulation alone is insufficient.

The server command binds to your computer's loopback address, so another device cannot reach it. Testing on a phone requires a separately configured reachable static host or a local server on that device. No hosting configuration is included. Do not use Python's development server as a production server.

## Troubleshooting

- **Python command not found:** Install Python 3, then restart the VS Code terminal. On Windows, ensure the Python launcher is available for `py -3`.
- **Port 8000 is already in use:** Replace `8000` with `8001` in the server command, then visit `http://127.0.0.1:8001/`.
- **Directory listing or 404:** Stop the server and open the correct project folder containing `index.html`; start a new terminal there and retry.
- **Loading the arcade never finishes:** Confirm you are using the HTTP address, not a file URL. Check that all four files in `src/` are present and inspect the browser console/network panel for errors.
- **Unable to start:** Use an updated browser and check the console, particularly for missing Canvas `roundRect` support.
- **Changes do not appear:** Save your edits and reload. If necessary, disable browser caching in developer tools and reload again.

## Merge history

<!-- bumblebee-pr-3 -->
### Merged change: Replace empty stylesheet with complete responsive neon arcade design

Merged pull request #3: https://github.com/MarcoLFrancisco/Arkanoid/pull/3

Files in the approved proposal:
- styles.css

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-5 -->
### Merged change: Add five neon levels and shared playfield configuration

Merged pull request #5: https://github.com/MarcoLFrancisco/Arkanoid/pull/5

Files in the approved proposal:
- src/levels.js

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-7 -->
### Merged change: Add Arkanoid physics and gameplay engine

Merged pull request #7: https://github.com/MarcoLFrancisco/Arkanoid/pull/7

Files in the approved proposal:
- src/game.js

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-9 -->
### Merged change: Add neon Canvas renderer with particles and responsive resolution

Merged pull request #9: https://github.com/MarcoLFrancisco/Arkanoid/pull/9

Files in the approved proposal:
- src/renderer.js

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-11 -->
### Merged change: Connect Arkanoid gameplay, browser controls, and menus

Merged pull request #11: https://github.com/MarcoLFrancisco/Arkanoid/pull/11

Files in the approved proposal:
- src/main.js

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-13 -->
### Merged change: Add step-by-step VS Code setup and browser run instructions

Merged pull request #13: https://github.com/MarcoLFrancisco/Arkanoid/pull/13

Files in the approved proposal:
- README.md

Bumblebee has not run automated tests or verified runtime behavior for this change.


<!-- bumblebee-pr-16 -->
### Merged change: Prevent stale pointer targets from taking over keyboard movement

Merged pull request #16: https://github.com/MarcoLFrancisco/Arkanoid/pull/16

Files in the approved proposal:
- src/main.js
- README.md

Bumblebee has not run automated tests or verified runtime behavior for this change.

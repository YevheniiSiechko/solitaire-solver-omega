# ♠️ Solitaire Solver: Omega Edition

![Version](https://img.shields.io/badge/version-Omega_v7-emerald)
![Tech](https://img.shields.io/badge/stack-React_|_Tailwind-blue)
![License](https://img.shields.io/badge/license-MIT-grey)

**Solitaire Solver Omega** is a powerful Single File Application (SFA) designed to solve and deeply analyze Klondike Solitaire game states.

The project utilizes a **Portfolio Solving** approach: instead of relying on a single algorithm, it deploys a team of 12 specialized "Agents" (strategies) that compete to find the optimal solution for every level.

## ✨ Features

* **🧠 Portfolio AI Engine:** The system automatically iterates through 12 unique strategies (from the balanced *Apex* to the aggressive *Rusher* and defensive *Hoarder*) to crack even the most difficult deals.
* **📊 Batch Analysis:** Load a JSON file containing thousands of levels, and the bot will analyze them all, providing statistics on Win Rate, Average Moves, and Difficulty.
* **🙂 "Fun Factor" Analysis:** The system doesn't just output "Solved"; it evaluates the level like a human player. You'll know if a game is an "Easy Breeze", a "Brain Teaser", or a "Hard Grind".
* **⚡ Move Optimization:** Even after a level is solved, the bot continues searching with other strategies to find the shortest path to victory.
* **🛠 Zero-Config:** The entire application is contained within a single `index.html` file. No `npm install`, build steps, or servers required.

## 🚀 How to Run

1.  Download the `index.html` file (or clone this repository).
2.  Open it in any modern web browser (Chrome, Firefox, Edge).
3.  Enjoy!

### Modes:
* **Board Mode:** Paste a Deck String and click "Analyze & Solve" to watch the bot solve a specific game visually.
* **Analytics Mode:** Upload a `.json` file with a database of levels for mass testing.

## 🤖 Strategies (AI Agents)

The bot uses a set of heuristics with varying weights for:
* *Foundation* priority
* *Tableau* building
* *Hidden Card* penalties
* *Mobility* & *Chain Reactions*

**Key Bot Personalities:**
1.  **Apex (Balanced):** The gold standard, a smart balance between offense and defense.
2.  **Royal Guard:** Priority #1 is clearing spots for Kings.
3.  **The Excavator:** Obsessed with digging out the deepest column.
4.  **The Unblocker:** Focuses on horizontal card mobility.
5.  **The Hoarder:** Keeps cards on the table to build long sequences.
6.  ...and others (12 strategies in total).

## 📂 Data Format

For Batch Analysis, use a JSON file with the following structure:

```json
{
  "games": [
    {
      "GameId": 10001,
      "DecodedDeck": "AH,2H,3H,4H,5H...", 
      "Type": "Classic",
      "TypeDescription": "Classic 3-Card Draw"
    }
  ]
}

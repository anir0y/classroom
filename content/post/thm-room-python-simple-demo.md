---
title: "TryHackMe Python Simple Demo: Building Guess the Number"
date: 2026-08-09T00:55:00+05:30
lastmod: 2026-08-09T01:15:00+05:30
author: Animesh Roy
avatar: /img/avatar.jpeg
authorlink: https://anir0y.in
featureimage: img/thm-pythondemo/00-thumbnail.png

categories:
  - TryHackMe
tags:
  - tryhackme
  - thm
  - rooms
  - Pre Security
  - Python
  - Programming
  - Fundamentals

draft: false
description: "Walkthrough of TryHackMe Python Simple Demo: building a Guess the Number game with variables, print/int/input, if/elif/else conditionals, and a while loop."
---

## Python: Simple Demo

After Data Representation and Data Encoding taught how a computer stores numbers and characters, Python: Simple Demo is where you finally make it do something. It is a Pre Security room in the Software Basics module, and instead of front-loading syntax it builds one small program end to end: a Guess the Number game. The computer picks a secret between 1 and 20, you keep guessing, and it tells you too low or too high until you land it. By the time the game works you have quietly met the three pillars that hold up every imperative language: variables, conditionals, and loops.

![The Python Simple Demo room on TryHackMe at 100 percent, showing five tasks Introduction, Variables, Conditional Statements, Iterations, and Conclusion all complete](/img/thm-pythondemo/01-room.png)

The room ships a lab VM with VS Code and every version of the program (`guess_v1.py`, `guess_v2.py`, `guess_v3.py`) under `/home/ubuntu/Python-Demo`, so you can follow along and edit. The questions are all conceptual though, so I worked from the code itself and ran the finished game locally to check my answers.

## Task 2: Variables

A variable is a labelled box that holds a value. The game needs three: `secret` for the hidden number, `tries` to count attempts, and `guess` for the player's current input. The secret comes from Python's `random` library, specifically `random.randint(1, 20)`, which returns an integer in that inclusive range. The counters start at zero, and `guess` is seeded to a value that can never be the answer so the game does not end before it begins.

Two built-in functions do the talking. `print()` writes text to the screen, and reading input is a two-step move: `input()` returns whatever the user typed as a string, and `int()` converts that string into a number so it can be compared arithmetically.

```python
secret = random.randint(1, 20)   # pick the hidden number
tries  = 0
guess  = 0

print("I'm thinking of a number between 1 and 20")   # print() displays text
text  = input("Take a guess: ")  # input() returns a string
guess = int(text)                # int() converts that string to a number
tries = tries + 1
```

The two Task 2 answers fall straight out of that:

- The function used to display text on the screen is **`print()`**.
- The function used to convert the user's input to an integer is **`int()`**.

## Task 3: Conditional Statements

A single guess is not a game. To give a hint, the program has to compare the guess against the secret and react differently in each case, and that is what conditionals are for. The logic reads like plain English: if the guess is outside 1 to 20 it is out of range; otherwise if it is below the secret it is too low; otherwise if it is above it is too high; otherwise it must be equal, so you won.

Python spells "else if" as **`elif`**, and the chain is evaluated top to bottom, stopping at the first branch that is true:

```python
if guess < 1 or guess > 20:
    print("That number is out of range. Try again.")
elif guess < secret:
    print("Too low, try again.")
elif guess > secret:
    print("Too high, try again.")
else:
    print("You got it in", tries, "tries!")
```

The second Task 3 question asks what the program prints if the user enters 50. Fifty is greater than 20, so the very first condition (`guess < 1 or guess > 20`) is true and the rest of the chain is skipped. The output is **"That number is out of range. Try again."**

## Task 4: Iterations

The last missing piece is repetition. Giving the player one shot is cruel, so the program wraps the guess-and-hint block in a loop that runs until the guess matches the secret. In Python "does not equal" is `!=`, so the condition "keep going while the guess is wrong" is `while guess != secret:`. Everything indented under the `while` runs again and again; the moment the guess equals the secret, `guess != secret` becomes false and the loop exits.

![Terminal card showing the finished guess_the_number.py annotated with where variables, the while loop, and the if/elif/else chain each live](/img/thm-pythondemo/02-build.png)

The two Task 4 answers:

- The loop the program uses is a **`while`** loop.
- If the user guesses correctly on their third attempt, the `else` branch runs `print("You got it in", tries, "tries!")` with `tries` equal to 3, so it displays **"You got it in 3 tries!"**

{{< ad >}}

With the loop in place the game is complete. Running the finished program reproduces the exact session the room shows in its introduction:

![Terminal card showing a real run of the game: thinking of a number, guesses of 10, 5, 7, then 8, ending with You got it in 4 tries](/img/thm-pythondemo/03-session.png)

The whole thing is fifteen lines. The finished game is here:

> Finished game on GitHub Gist: [`guess_the_number.py`](https://gist.github.com/anir0y/c457a0e17a439da2da3d69eeafd25565)

<script src="https://gist.github.com/anir0y/c457a0e17a439da2da3d69eeafd25565.js"></script>

## One security-flavoured aside

This is a beginner room, but it is worth noticing the assumption hiding in `int(input(...))`. It trusts that whatever the user typed is a valid number. Type `hello` at the prompt and the program does not print a friendly message, it crashes with a `ValueError`, because `int("hello")` is undefined. That is the smallest possible version of a lesson every security-minded developer internalises: input is never trustworthy until you have validated it. A real program wraps that conversion in error handling; a toy one crashes; an insecure one does something far worse with the bad input. The habit of asking "what if the input is not what I expect" starts on exactly this line.

## Room summary

| | |
|---|---|
| Room | Python: Simple Demo (Pre Security path, Software Basics, Premium) |
| Category | Software Basics, Fundamentals, Easy |
| Task 2 | display text = `print()`; convert input to integer = `int()` |
| Task 3 | else-if = `elif`; input 50 prints "That number is out of range. Try again." |
| Task 4 | loop type = `while`; correct guess in 3 tries prints "You got it in 3 tries!" |
| Result | a working Guess the Number game built from variables, conditionals, and a loop |

## Wrap-up

There is no exploit here and no flag, and that is fine. The point of the room is that a real, playable program is just three ideas stacked together: values you name and update, decisions the program makes with `if` / `elif` / `else`, and repetition with a `while` loop. Once you can read those fifteen lines and predict exactly what they print, you can read most short scripts you will meet later, whether it is an automation helper, a small exploit proof of concept, or the guts of a tool you are trying to understand. Fundamentals like this are the cheap tax you pay once so that everything after it reads faster.

![The Python Simple Demo room completed on TryHackMe, all five tasks done, 48 points earned](/img/thm-pythondemo/04-complete.png)

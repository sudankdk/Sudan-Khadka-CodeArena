package service

import (
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/repo"
	"go.uber.org/zap"
)

// challengeSeed holds the broken code that players receive plus the correct code
// used to generate the reference screenshot.
type challengeSeed struct {
	Title       string
	Description string
	Difficulty  string

	// Broken code — given to players
	BrokenHTML string
	BrokenCSS  string
	BrokenJS   string

	// Correct code — used to generate reference screenshot only
	CorrectHTML string
	CorrectCSS  string
	CorrectJS   string

	PixelThreshold float64
	DiffThreshold  float64
	TimeLimit      int
	ViewportWidth  int
	ViewportHeight int
}

var seedChallenges = []challengeSeed{
	// ──────────────────── EASY ────────────────────
	{
		Title:       "Fix the Centered Card",
		Description: "A card component should be centered on the page with a blue background, white text, rounded corners, and a subtle shadow. The CSS has several broken properties — fix them to match the reference.",
		Difficulty:  "easy",
		BrokenHTML: `<div class="card">
  <h2>Hello World</h2>
  <p>This card should be centered with a shadow.</p>
</div>`,
		BrokenCSS: `body {
  margin: 0;
  height: 100vh;
  display: flx;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  font-family: sans-serif;
}
.card {
  background: blu;
  color: white;
  padding: 40px;
  border-radius: 12;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  text-align: center;
  max-width: 320px;
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="card">
  <h2>Hello World</h2>
  <p>This card should be centered with a shadow.</p>
</div>`,
		CorrectCSS: `body {
  margin: 0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
  font-family: sans-serif;
}
.card {
  background: blue;
  color: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  text-align: center;
  max-width: 320px;
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      600,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Navigation Bar",
		Description: "A horizontal navigation bar should span the full width with a dark background, evenly spaced white links, and a hover highlight. Several CSS values are wrong — fix them.",
		Difficulty:  "easy",
		BrokenHTML: `<nav class="navbar">
  <a href="#">Home</a>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Contact</a>
</nav>`,
		BrokenCSS: `.navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #333;
  padding: 16px 0;
}
.navbar a {
  color: wite;
  text-decoration: none;
  font-size: 18px;
  font-family: sans-serif;
  padding: 8px 16;
  border-radius: 4px;
  transition: background 0.3 ease;
}
.navbar a:hover {
  background: rgba(255,255,255,0.2);
}`,
		BrokenJS: "",
		CorrectHTML: `<nav class="navbar">
  <a href="#">Home</a>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Contact</a>
</nav>`,
		CorrectCSS: `.navbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #333;
  padding: 16px 0;
}
.navbar a {
  color: white;
  text-decoration: none;
  font-size: 18px;
  font-family: sans-serif;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background 0.3s ease;
}
.navbar a:hover {
  background: rgba(255,255,255,0.2);
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      600,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Profile Avatar",
		Description: "A circular profile avatar should appear centered over a gradient banner. The image border, shape, and positioning are broken — fix the CSS.",
		Difficulty:  "easy",
		BrokenHTML: `<div class="banner">
  <div class="avatar"></div>
</div>
<p class="name">Jane Doe</p>`,
		BrokenCSS: `body {
  margin: 0;
  font-family: sans-serif;
  text-align: center;
  background: #fafafa;
}
.banner {
  height: 180px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  position: relative;
}
.avatar {
  width: 100px;
  height: 100px;
  background: #ccc;
  border: 4px solid white;
  border-radius: 0;
  position: absolute;
  bottom: -50;
  left: 50%;
  transform: translateX(-50);
}
.name {
  margin-top: 60px;
  font-size: 22px;
  font-weight: bold;
  color: #333;
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="banner">
  <div class="avatar"></div>
</div>
<p class="name">Jane Doe</p>`,
		CorrectCSS: `body {
  margin: 0;
  font-family: sans-serif;
  text-align: center;
  background: #fafafa;
}
.banner {
  height: 180px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  position: relative;
}
.avatar {
  width: 100px;
  height: 100px;
  background: #ccc;
  border: 4px solid white;
  border-radius: 50%;
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
}
.name {
  margin-top: 60px;
  font-size: 22px;
  font-weight: bold;
  color: #333;
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      600,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},

	// ──────────────────── MEDIUM ────────────────────
	{
		Title:       "Fix the Pricing Table",
		Description: "A three-column pricing table should display Starter, Pro, and Enterprise plans side-by-side. The layout, featured card highlight, and button styles are broken. Fix the HTML structure and CSS.",
		Difficulty:  "medium",
		BrokenHTML: `<div class="pricing">
  <div class="plan">
    <h3>Starter</h3>
    <div class="price">$9<span>/mo</span></div>
    <ul>
      <li>5 Projects</li>
      <li>10GB Storage</li>
      <li>Email Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
  <div class="plan featured">
    <h3>Pro</h3>
    <div class="price">$29<span>/mo</span></div>
    <ul>
      <li>Unlimited Projects</li>
      <li>100GB Storage</li>
      <li>Priority Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
  <div class="plan">
    <h3>Enterprise</h3>
    <div class="price">$99<span>/mo</span></div>
    <ul>
      <li>Unlimited Everything</li>
      <li>1TB Storage</li>
      <li>24/7 Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.pricing {
  display: block;
  gap: 24px;
  align-items: center;
}
.plan {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 260px;
}
.plan.featured {
  background: #4f46e5;
  color: white;
  transform: scale(1);
}
.plan h3 { font-size: 22px; margin-bottom: 8px; }
.price { font-size: 48px; font-weight: bold; margin: 16px 0; }
.price span { font-size: 18px; font-weight: normal; }
ul { list-style: none; margin-bottom: 24px; }
li { padding: 8px 0; border-bottom: 1px solid #eee; }
.featured li { border-bottom-color: rgba(255,255,255,0.2); }
button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 32;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
.featured button {
  background: white;
  color: #4f46e5;
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="pricing">
  <div class="plan">
    <h3>Starter</h3>
    <div class="price">$9<span>/mo</span></div>
    <ul>
      <li>5 Projects</li>
      <li>10GB Storage</li>
      <li>Email Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
  <div class="plan featured">
    <h3>Pro</h3>
    <div class="price">$29<span>/mo</span></div>
    <ul>
      <li>Unlimited Projects</li>
      <li>100GB Storage</li>
      <li>Priority Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
  <div class="plan">
    <h3>Enterprise</h3>
    <div class="price">$99<span>/mo</span></div>
    <ul>
      <li>Unlimited Everything</li>
      <li>1TB Storage</li>
      <li>24/7 Support</li>
    </ul>
    <button>Choose Plan</button>
  </div>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.pricing {
  display: flex;
  gap: 24px;
  align-items: center;
}
.plan {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  width: 260px;
}
.plan.featured {
  background: #4f46e5;
  color: white;
  transform: scale(1.08);
}
.plan h3 { font-size: 22px; margin-bottom: 8px; }
.price { font-size: 48px; font-weight: bold; margin: 16px 0; }
.price span { font-size: 18px; font-weight: normal; }
ul { list-style: none; margin-bottom: 24px; }
li { padding: 8px 0; border-bottom: 1px solid #eee; }
.featured li { border-bottom-color: rgba(255,255,255,0.2); }
button {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
.featured button {
  background: white;
  color: #4f46e5;
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      900,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Todo List",
		Description: "A simple interactive todo list. Items should be added when the button is clicked and the input is not empty. Completed items should have a strikethrough style. The JavaScript event wiring and DOM manipulation are broken.",
		Difficulty:  "medium",
		BrokenHTML: `<div class="todo-app">
  <h2>Todo List</h2>
  <div class="input-row">
    <input type="text" id="todoInput" placeholder="Add a task..." />
    <button id="addBtn">Add</button>
  </div>
  <ul id="todoList">
    <li>Buy groceries</li>
    <li class="done">Walk the dog</li>
    <li>Read a book</li>
  </ul>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #f9fafb;
  display: flex;
  justify-content: center;
  padding-top: 60px;
}
.todo-app {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  width: 380px;
}
h2 { margin-bottom: 16px; color: #1f2937; }
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
input {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
#addBtn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
ul { list-style: none; }
li {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 15px;
  color: #374151;
}
li.done {
  text-decoration: none;
  color: #9ca3af;
}`,
		BrokenJS: `document.getElementById('addBtn').addEventlistener('click', function() {
  const input = document.getElementById('todoInput');
  if (input.value.trim() !== '') {
    const li = document.createElement('li');
    li.textContent = input.value;
    document.getElementById('todoList').appendChild(li);
    input.vale = '';
  }
});

document.getElementById('todoList').addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    e.target.classlist.toggle('done');
  }
});`,
		CorrectHTML: `<div class="todo-app">
  <h2>Todo List</h2>
  <div class="input-row">
    <input type="text" id="todoInput" placeholder="Add a task..." />
    <button id="addBtn">Add</button>
  </div>
  <ul id="todoList">
    <li>Buy groceries</li>
    <li class="done">Walk the dog</li>
    <li>Read a book</li>
  </ul>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #f9fafb;
  display: flex;
  justify-content: center;
  padding-top: 60px;
}
.todo-app {
  background: white;
  padding: 32px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  width: 380px;
}
h2 { margin-bottom: 16px; color: #1f2937; }
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
input {
  flex: 1;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}
#addBtn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
ul { list-style: none; }
li {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 15px;
  color: #374151;
}
li.done {
  text-decoration: line-through;
  color: #9ca3af;
}`,
		CorrectJS: `document.getElementById('addBtn').addEventListener('click', function() {
  const input = document.getElementById('todoInput');
  if (input.value.trim() !== '') {
    const li = document.createElement('li');
    li.textContent = input.value;
    document.getElementById('todoList').appendChild(li);
    input.value = '';
  }
});

document.getElementById('todoList').addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    e.target.classList.toggle('done');
  }
});`,
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      900,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Responsive Grid Gallery",
		Description: "A responsive image gallery should display colored tiles in a CSS Grid that wraps into multiple rows. The grid, gap, and aspect-ratio properties are broken — fix them to match the reference layout.",
		Difficulty:  "medium",
		BrokenHTML: `<div class="gallery">
  <div class="tile" style="background:#ef4444;">1</div>
  <div class="tile" style="background:#f97316;">2</div>
  <div class="tile" style="background:#eab308;">3</div>
  <div class="tile" style="background:#22c55e;">4</div>
  <div class="tile" style="background:#3b82f6;">5</div>
  <div class="tile" style="background:#8b5cf6;">6</div>
  <div class="tile" style="background:#ec4899;">7</div>
  <div class="tile" style="background:#14b8a6;">8</div>
  <div class="tile" style="background:#f43f5e;">9</div>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #111827;
  padding: 40px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16;
  max-width: 900px;
  margin: 0 auto;
}
.tile {
  aspect-ratio: 1/1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}
.tile:hover {
  transform: scale(1.05);
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="gallery">
  <div class="tile" style="background:#ef4444;">1</div>
  <div class="tile" style="background:#f97316;">2</div>
  <div class="tile" style="background:#eab308;">3</div>
  <div class="tile" style="background:#22c55e;">4</div>
  <div class="tile" style="background:#3b82f6;">5</div>
  <div class="tile" style="background:#8b5cf6;">6</div>
  <div class="tile" style="background:#ec4899;">7</div>
  <div class="tile" style="background:#14b8a6;">8</div>
  <div class="tile" style="background:#f43f5e;">9</div>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: sans-serif;
  background: #111827;
  padding: 40px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 900px;
  margin: 0 auto;
}
.tile {
  aspect-ratio: 1/1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  transition: transform 0.2s;
}
.tile:hover {
  transform: scale(1.05);
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      900,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},

	// ──────────────────── HARD ────────────────────
	{
		Title:       "Fix the Animated Login Form",
		Description: "A login form with floating labels, a gradient background, glass-morphism card, and smooth focus transitions. Multiple CSS issues including backdrop-filter, transforms, transitions, and pseudo-element selectors are broken.",
		Difficulty:  "hard",
		BrokenHTML: `<div class="login-container">
  <div class="login-card">
    <h1>Welcome Back</h1>
    <form>
      <div class="field">
        <input type="email" id="email" placeholder=" " required />
        <label for="email">Email Address</label>
      </div>
      <div class="field">
        <input type="password" id="password" placeholder=" " required />
        <label for="password">Password</label>
      </div>
      <button type="submit">Sign In</button>
    </form>
    <p class="footer">Don't have an account? <a href="#">Sign Up</a></p>
  </div>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10);
  border-radius: 20px;
  padding: 48px 40px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
}
h1 {
  color: white;
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
}
.field {
  position: relative;
  margin-bottom: 24px;
}
.field input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3 ease;
}
.field input:focus {
  border-color: #a78bfa;
}
.field label {
  position: absolute;
  left: 16px;
  top: 14px;
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  pointer-events: none;
  transition: all 0.2;
}
.field input:focus + label,
.field input:not(:placeholder-shown) + label {
  top: -10px;
  left: 12px;
  font-size: 12;
  color: #a78bfa;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 0 6px;
  border-radius: 4px;
}
button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #a78bfa, #6d28d9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2 ease, box-shadow 0.2s ease;
}
button[type="submit"]:hover {
  transform: translateY(-2);
  box-shadow: 0 6px 20px rgba(109,40,217,0.4);
}
.footer {
  text-align: center;
  color: rgba(255,255,255,0.7);
  margin-top: 24px;
  font-size: 14px;
}
.footer a {
  color: #a78bfa;
  text-decoration: none;
  font-weight: 600;
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="login-container">
  <div class="login-card">
    <h1>Welcome Back</h1>
    <form>
      <div class="field">
        <input type="email" id="email" placeholder=" " required />
        <label for="email">Email Address</label>
      </div>
      <div class="field">
        <input type="password" id="password" placeholder=" " required />
        <label for="password">Password</label>
      </div>
      <button type="submit">Sign In</button>
    </form>
    <p class="footer">Don't have an account? <a href="#">Sign Up</a></p>
  </div>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 48px 40px;
  width: 400px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
}
h1 {
  color: white;
  text-align: center;
  margin-bottom: 32px;
  font-size: 28px;
}
.field {
  position: relative;
  margin-bottom: 24px;
}
.field input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 10px;
  color: white;
  font-size: 16px;
  outline: none;
  transition: border-color 0.3s ease;
}
.field input:focus {
  border-color: #a78bfa;
}
.field label {
  position: absolute;
  left: 16px;
  top: 14px;
  color: rgba(255,255,255,0.6);
  font-size: 16px;
  pointer-events: none;
  transition: all 0.2s;
}
.field input:focus + label,
.field input:not(:placeholder-shown) + label {
  top: -10px;
  left: 12px;
  font-size: 12px;
  color: #a78bfa;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 0 6px;
  border-radius: 4px;
}
button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #a78bfa, #6d28d9);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
button[type="submit"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(109,40,217,0.4);
}
.footer {
  text-align: center;
  color: rgba(255,255,255,0.7);
  margin-top: 24px;
  font-size: 14px;
}
.footer a {
  color: #a78bfa;
  text-decoration: none;
  font-weight: 600;
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      1200,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Dashboard Stats Cards",
		Description: "A dashboard with four stat cards in a grid, each with an icon circle, value, label, and a colored left border accent. The grid layout, icon positioning, accent border, and responsive spacing are broken.",
		Difficulty:  "hard",
		BrokenHTML: `<div class="dashboard">
  <div class="stat-card" style="--accent:#3b82f6;">
    <div class="icon" style="background:#dbeafe;color:#3b82f6;">&#128200;</div>
    <div class="info">
      <span class="value">12,845</span>
      <span class="label">Total Users</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#10b981;">
    <div class="icon" style="background:#d1fae5;color:#10b981;">&#128176;</div>
    <div class="info">
      <span class="value">$48,290</span>
      <span class="label">Revenue</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#f59e0b;">
    <div class="icon" style="background:#fef3c7;color:#f59e0b;">&#128230;</div>
    <div class="info">
      <span class="value">1,294</span>
      <span class="label">Orders</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#ef4444;">
    <div class="icon" style="background:#fee2e2;color:#ef4444;">&#128293;</div>
    <div class="info">
      <span class="value">23</span>
      <span class="label">Issues</span>
    </div>
  </div>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24;
  width: 720px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border-left: 4 solid var(--accent, #3b82f6);
  position: relative;
}
.icon {
  width: 56px;
  height: 56px;
  border-radius: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.info {
  display: flex;
  flex-direction: column;
}
.value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}
.label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}`,
		BrokenJS: "",
		CorrectHTML: `<div class="dashboard">
  <div class="stat-card" style="--accent:#3b82f6;">
    <div class="icon" style="background:#dbeafe;color:#3b82f6;">&#128200;</div>
    <div class="info">
      <span class="value">12,845</span>
      <span class="label">Total Users</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#10b981;">
    <div class="icon" style="background:#d1fae5;color:#10b981;">&#128176;</div>
    <div class="info">
      <span class="value">$48,290</span>
      <span class="label">Revenue</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#f59e0b;">
    <div class="icon" style="background:#fef3c7;color:#f59e0b;">&#128230;</div>
    <div class="info">
      <span class="value">1,294</span>
      <span class="label">Orders</span>
    </div>
  </div>
  <div class="stat-card" style="--accent:#ef4444;">
    <div class="icon" style="background:#fee2e2;color:#ef4444;">&#128293;</div>
    <div class="info">
      <span class="value">23</span>
      <span class="label">Issues</span>
    </div>
  </div>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  width: 720px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border-left: 4px solid var(--accent, #3b82f6);
  position: relative;
}
.icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.info {
  display: flex;
  flex-direction: column;
}
.value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}
.label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}`,
		CorrectJS:      "",
		PixelThreshold: 0.1,
		DiffThreshold:  0.05,
		TimeLimit:      1200,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
	{
		Title:       "Fix the Countdown Timer",
		Description: "A countdown timer displays days, hours, minutes, and seconds in styled boxes on a dark background. The JavaScript timer logic, number formatting, and CSS layout have multiple bugs — fix them all.",
		Difficulty:  "hard",
		BrokenHTML: `<div class="countdown-container">
  <h1>Launch In</h1>
  <div class="timer">
    <div class="unit">
      <span id="days">00</span>
      <small>Days</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="hours">00</span>
      <small>Hours</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="minutes">00</span>
      <small>Minutes</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="seconds">00</span>
      <small>Seconds</small>
    </div>
  </div>
</div>`,
		BrokenCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f172a;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.countdown-container { text-align: center; }
h1 {
  font-size: 36px;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #a78bfa, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.timer {
  display: flex;
  gap: 12;
  align-items: center;
}
.unit {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px 32px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.unit span {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: 2px;
}
.unit small {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.separator {
  font-size: 48;
  color: #475569;
  padding-bottom: 28px;
}`,
		BrokenJS: `const deadline = new Date();
deadline.setDate(deadline.getDate() + 7);

function update() {
  const now = new Date().getTime();
  const diff = deadline - now;

  if (diff <= 0) return;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = hours;
  document.getElementById('minutes').textContent = minutes;
  document.getElementById('seconds').textContent = seconds;
}

update();`,
		CorrectHTML: `<div class="countdown-container">
  <h1>Launch In</h1>
  <div class="timer">
    <div class="unit">
      <span id="days">00</span>
      <small>Days</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="hours">00</span>
      <small>Hours</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="minutes">00</span>
      <small>Minutes</small>
    </div>
    <div class="separator">:</div>
    <div class="unit">
      <span id="seconds">00</span>
      <small>Seconds</small>
    </div>
  </div>
</div>`,
		CorrectCSS: `* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', sans-serif;
  background: #0f172a;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.countdown-container { text-align: center; }
h1 {
  font-size: 36px;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #a78bfa, #38bdf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.timer {
  display: flex;
  gap: 12px;
  align-items: center;
}
.unit {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px 32px;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.unit span {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: 2px;
}
.unit small {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 8px;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.separator {
  font-size: 48px;
  color: #475569;
  padding-bottom: 28px;
}`,
		CorrectJS: `const deadline = new Date();
deadline.setDate(deadline.getDate() + 7);

function pad(n) { return String(n).padStart(2, '0'); }

function update() {
  const now = new Date().getTime();
  const diff = deadline - now;

  if (diff <= 0) return;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = pad(days);
  document.getElementById('hours').textContent = pad(hours);
  document.getElementById('minutes').textContent = pad(minutes);
  document.getElementById('seconds').textContent = pad(seconds);
}

update();
setInterval(update, 1000);`,
		PixelThreshold: 0.15,
		DiffThreshold:  0.08,
		TimeLimit:      1200,
		ViewportWidth:  1280,
		ViewportHeight: 720,
	},
}

// generatePlaceholderPNG creates a simple colored placeholder PNG image.
// Used as a fallback when chromedp cannot generate a proper reference screenshot.
func generatePlaceholderPNG(outputDir string, width, height int, col color.Color) (string, error) {
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return "", err
	}

	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, col)
		}
	}

	filename := "ref_placeholder_" + uuid.New().String() + ".png"
	path := filepath.Join(outputDir, filename)
	f, err := os.Create(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if err := png.Encode(f, img); err != nil {
		return "", err
	}
	return path, nil
}

// SeedChallenges inserts seed challenges into the database if none exist.
// It tries to generate reference screenshots via chromedp; if that fails,
// it falls back to placeholder PNGs so challenges are always seeded.
// If challenges already exist but have placeholder screenshots, it attempts
// to regenerate them with proper browser screenshots.
func SeedChallenges(challengeRepo repo.FrontendChallengeRepo, judgeSvc *JudgeService) {
	// Check if challenges already exist
	existing, total, err := challengeRepo.List(1, 100, "")
	if err != nil {
		logger.Error("Failed to check existing challenges", zap.Error(err))
		return
	}
	if total > 0 && len(existing) > 0 {
		logger.Info("Challenges already present — skipping seeding and regeneration", zap.Int64("count", total))
		return
	}

	logger.Info("Seeding frontend challenges", zap.Int("count", len(seedChallenges)))

	for _, s := range seedChallenges {
		// Try to generate a proper reference screenshot from the correct code
		refPath, err := judgeSvc.GenerateReferenceScreenshot(
			s.CorrectHTML, s.CorrectCSS, s.CorrectJS,
			s.ViewportWidth, s.ViewportHeight,
		)
		if err != nil {
			logger.Warn("chromedp screenshot failed, using placeholder",
				zap.String("challenge", s.Title),
				zap.Error(err),
			)
			// Fallback: generate a simple placeholder PNG
			refPath, err = generatePlaceholderPNG(
				judgeSvc.outputDir, s.ViewportWidth, s.ViewportHeight,
				color.RGBA{R: 200, G: 200, B: 200, A: 255},
			)
			if err != nil {
				logger.Error("Failed to generate placeholder screenshot",
					zap.String("challenge", s.Title),
					zap.Error(err),
				)
				continue
			}
		}

		challenge := &domain.FrontendChallenge{
			Title:                   s.Title,
			Description:             s.Description,
			Difficulty:              s.Difficulty,
			BrokenHTML:              s.BrokenHTML,
			BrokenCSS:               s.BrokenCSS,
			BrokenJS:                s.BrokenJS,
			ReferenceScreenshotPath: refPath,
			PixelThreshold:          s.PixelThreshold,
			DiffThreshold:           s.DiffThreshold,
			TimeLimit:               s.TimeLimit,
			ViewportWidth:           s.ViewportWidth,
			ViewportHeight:          s.ViewportHeight,
		}

		if err := challengeRepo.Create(challenge); err != nil {
			logger.Error("Failed to seed challenge",
				zap.String("challenge", s.Title),
				zap.Error(err),
			)
			continue
		}

		logger.Info("Seeded challenge",
			zap.String("title", s.Title),
			zap.String("difficulty", s.Difficulty),
			zap.String("ref_screenshot", refPath),
		)
	}

	logger.Info("Challenge seeding complete")
}

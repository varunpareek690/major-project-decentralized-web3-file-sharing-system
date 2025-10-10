// --- 0. DOM Elements (Saare HTML elements ko pakadna) ---
document.addEventListener('DOMContentLoaded', () => {
  // Global state
  let myPeerId = null;
  let ws = null;
  let allFilesData = {}; // File size aur seeder count track karne ke liye

  // Status Bar
  const peerIdDisplay = document.getElementById('peer-id');
  const peerCountDisplay = document.getElementById('peer-count');

  // Section 1: Seed
  const seedFileInput = document.getElementById('seed-file-input');
  const seedButton = document.getElementById('seed-button');


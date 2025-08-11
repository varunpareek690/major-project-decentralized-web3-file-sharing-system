# Project ChainShare: A Decentralized P2P File Sharing System with Blockchain Integration

[![Status](https://img.shields.io/badge/status-in_development-orange)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A peer-to-peer, trackerless file-sharing system inspired by BitTorrent, enhanced with a blockchain layer for integrity, transparency, and incentivization.

---

## 📖 Overview & Motivation

Traditional file-sharing systems, including many torrenting ecosystems, often rely on centralized trackers for peer discovery. These trackers represent a single point of failure and a target for censorship. If a tracker goes down, the entire swarm can be crippled.

**Project ChainShare** reimagines this process by creating a fully decentralized architecture. Our motivation is to build a resilient, secure, and transparent file-sharing network where:
1.  **No Central Servers Are Needed:** Peers discover each other using a Distributed Hash Table (DHT), making the network robust and censorship-resistant.
2.  **Trust is Programmed:** A blockchain layer is used to create an immutable ledger of peer participation, verify file integrity through on-chain hashes, and pave the way for a tokenized economy that rewards users for seeding files (contributing bandwidth).
3.  **Users Control Their Data:** The P2P nature ensures that files are transferred directly between users without passing through an intermediary.

This project merges the efficiency of P2P networking with the trust and decentralization of blockchain technology.



---

## ✨ Features

### Core Features (MVP for Local Testing)
* **💻 Trackerless Peer Discovery:** Utilizes a Kademlia-based DHT to allow peers to find each other without a central server.
* **🧩 File Chunking & Hashing:** Large files are split into smaller, manageable chunks. Each chunk is verified using its own cryptographic hash (`SHA-256`) to ensure data integrity.
* **🔗 Magnet Link Generation:** Generates a unique `magnet` link containing the file's **infohash** (a hash of file metadata) for easy sharing.
* **🤝 P2P File Transfer:** Direct transfer of file chunks between a **Seeder** (uploader) and a **Leecher** (downloader).
* **📜 Basic Blockchain Logging:** Records proof of file availability and download completion on a testnet blockchain (e.g., Polygon Mumbai, Ethereum Sepolia).

### Planned Features (Long-Term Vision)
* **🌐 NAT Traversal:** Implementation of STUN/TURN protocols to enable peers to connect across different private networks (beyond a single LAN).
* **🔐 Encrypted Communication:** End-to-end encryption for all peer-to-peer communication to ensure privacy and security.
* **💰 Tokenized Incentives:** A smart contract-based system to reward seeders with cryptographic tokens for their uptime and bandwidth contribution.
* **🛡️ Security Hardening:** Mechanisms to mitigate common P2P attacks like Sybil attacks and swarm poisoning.
* **🖥️ User-Friendly Frontend:** A simple graphical or web-based UI for selecting files, managing downloads, and viewing network status.

---

## 🏗️ System Architecture

The system is composed of four primary components: the **Seeder**, the **Leecher**, the **DHT Network**, and the **Blockchain**.

```ascii
+-----------+      (2. Announce File Infohash)        +----------------+
|  Seeder   | -------------------------------------> |                |
+-----------+      (4. Request Chunks)              |   DHT Network  |
     ^         <-------------------------------------> | (Peer Discovery) |
     |                                              |                |
     | (5. P2P Chunk Transfer)                      +----------------+
     |                                                     ^
     v                                                     | (3. Query DHT for Peers)
+-----------+                                              |
|  Leecher  | ---------------------------------------------+
+-----------+      (6. Log Transaction)
     |         (e.g., download complete, integrity proof)
     |
     v
+--------------------------+
|   Blockchain Ledger      |
| (Participation &         |
|  Integrity Proofs)       |
+--------------------------+
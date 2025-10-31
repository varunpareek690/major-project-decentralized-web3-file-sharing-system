# Understanding Pieces and Hashes in Torrents

Torrents use a peer-to-peer protocol to efficiently distribute files across a network. To ensure data integrity and enable reliable sharing, files in a torrent are divided into smaller units called **pieces**. This document explains what pieces are, how they are hashed, and their role in the BitTorrent protocol.

---

## 1. What Are Pieces?

A **piece** is a fixed-size segment of the file being shared via a torrent. Rather than downloading the entire file at once, BitTorrent allows peers to download pieces from multiple sources simultaneously.

* **Typical Sizes**:

  * 256 KB
  * 512 KB
  * 1 MB

The choice of piece size affects the efficiency of the torrent:

* **Smaller pieces**: Allow for faster verification and more granular sharing but create more metadata overhead.
* **Larger pieces**: Reduce overhead but can slow down verification and sharing if a piece is corrupted.

---

## 2. SHA-1 Hashing of Pieces

Each piece in a torrent is assigned a **SHA-1 hash**, which is a cryptographic fingerprint of the piece's data.


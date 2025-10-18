# Understanding Pieces and Hashes in Torrents

Torrents use a peer-to-peer protocol to efficiently distribute files across a network. To ensure data integrity and enable reliable sharing, files in a torrent are divided into smaller units called **pieces**. This document explains what pieces are, how they are hashed, and their role in the BitTorrent protocol.

---

## 1. What Are Pieces?

A **piece** is a fixed-size segment of the file being shared via a torrent. Rather than downloading the entire file at once, BitTorrent allows peers to download pieces from multiple sources simultaneously.

* **Typical Sizes**:


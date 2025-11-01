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

* SHA-1 generates a **20-byte hash** for any input.
* These hashes are stored in the torrent file, allowing peers to verify the integrity of downloaded pieces.

### Why Hashes Are Important

* **Data integrity**: Ensures that the piece you downloaded matches exactly the original data.
* **Security**: Protects against malicious peers that may send fake or corrupted data.
* **Verification**: The client can immediately reject corrupted pieces without affecting the rest of the download.

---

## 3. Info Dictionary in a Torrent File

The torrent file contains an **info dictionary** that specifies the details of the pieces. Two important keys related to pieces are:

### `piece length`

* Specifies the size of each piece in **bytes**.
* Example:

  ```json
  "piece length": 1048576
  ```

  Here, each piece is 1 MB (1,048,576 bytes).

### `pieces`

* Contains the concatenated SHA-1 hashes of all pieces.
* Each SHA-1 hash is **20 bytes long**.
* Example (conceptual representation):

  ```
  pieces = SHA1(piece1) + SHA1(piece2) + SHA1(piece3) + ...
  ```
* When downloading, the client compares the SHA-1 hash of a received piece with the corresponding hash in this field to ensure correctness.

---

## 4. How Piece Verification Works

1. The client downloads a piece from a peer.
2. Computes the SHA-1 hash of the downloaded piece.
3. Compares the computed hash with the corresponding hash in the `pieces` field of the torrent file.
4. If the hashes match, the piece is valid and added to the local file.
5. If the hashes don’t match, the piece is discarded, and the client tries to download it again.

This process ensures that only valid data is written, even when some peers are malicious or unreliable.

---

## 5. Summary

* **Pieces**: Fixed-size parts of a file, typically 256 KB or 1 MB.
* **SHA-1 Hashes**: Ensure integrity and security of each piece.
* **Info Dictionary Keys**:

  * `piece length`: size of each piece in bytes.
  * `pieces`: concatenated 20-byte SHA-1 hashes of all pieces.
* **Verification**: Essential to prevent corrupted or fake data from being saved.

By using pieces and SHA-1 hashes, BitTorrent achieves a secure, reliable, and efficient file-sharing protocol.

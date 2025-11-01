# Info Hash

## Overview

The **info hash** is a unique identifier for a torrent file. It is used by BitTorrent clients when communicating with **trackers** or **peers**. Every torrent has a unique info hash, even if two torrents have similar metadata.

## What is the Info Hash?

- It is the **SHA-1 hash** of the **bencoded info dictionary** of a torrent file.
- It uniquely identifies the torrent content.
- Used in peer-to-peer communication to locate peers sharing the same torrent.

## Calculating the Info Hash

To calculate the info hash:

1. **Extract the info dictionary** from the torrent file.  
   - The info dictionary contains information about the files, file sizes, piece length, and pieces.

2. **Bencode the info dictionary**.  
   - Bencoding is the encoding format used by torrent files.
   - Ensure the dictionary is bencoded **exactly as it appears in the torrent file**.

3. **Compute the SHA-1 hash** of the bencoded info dictionary.  
   - This produces a 20-byte hash, usually represented as a **40-character hexadecimal string**.

## Example (Conceptual)

Torrent file: example.torrent

Extract info dictionary:
{
name: "example_file.txt",
length: 1024,
piece length: 512,
pieces: "<binary data>"
}

Bencode the dictionary:
d4:name16:example_file.txt6:lengthi1024e12:piece lengthi512e6:pieces<binary data>e

Compute SHA-1:
SHA1(bencoded dictionary) => 40-character hex string

pgsql
Copy code

## Notes

- The info hash is **independent of other torrent metadata** (like trackers, comments, or creation date).  
- It is critical that the **bencoding is exact**, otherwise the resulting hash will be incorrect.  
- The info hash is used in magnet links to identify the torrent.

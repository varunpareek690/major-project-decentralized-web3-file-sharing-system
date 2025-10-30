# Info Hash

## Overview

The **info hash** is a unique identifier for a torrent file. It is used by BitTorrent clients when communicating with **trackers** or **peers**. Every torrent has a unique info hash, even if two torrents have similar metadata.

## What is the Info Hash?

- It is the **SHA-1 hash** of the **bencoded info dictionary** of a torrent file.
- It uniquely identifies the torrent content.
- Used in peer-to-peer communication to locate peers sharing the same torrent.

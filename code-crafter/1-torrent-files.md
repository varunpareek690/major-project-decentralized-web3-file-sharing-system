# Understanding `.torrent` Files

A `.torrent` file is a **metadata file used by the BitTorrent protocol** to facilitate peer-to-peer file sharing. It does **not contain the actual content** being shared, but it contains all the information peers need to download and verify the data.

`.torrent` files are **bencoded**, which makes them compact, deterministic, and suitable for distributed systems.

---

## Core Components of a `.torrent` File

A typical `.torrent` file contains the following top-level keys:

1. **`announce`**

   * Type: String
   * The URL of the tracker, a server that helps peers find each other.
   * Example:

     ```bencode
     13:http://tracker.example.com
     ```

2. **`info`**

   * Type: Dictionary
   * Contains the metadata for the actual content being shared.
   * This section is **critical**, as its SHA-1 hash is used as the **info hash**, a unique identifier for the torrent.

   Common keys inside `info`:

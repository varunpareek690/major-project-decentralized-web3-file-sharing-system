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

   * **`name`** → Suggested filename or folder name for the content.
   * **`length`** → File size in bytes (for single-file torrents).
   * **`files`** → List of dictionaries with `length` and `path` (for multi-file torrents).
   * **`piece length`** → The size of each piece in bytes.
   * **`pieces`** → Concatenated SHA-1 hashes of all pieces.

3. **Optional Keys**

   * **`announce-list`** → List of backup trackers.
   * **`creation date`** → Unix timestamp of torrent creation.
   * **`comment`** → User-supplied comment about the torrent.
   * **`created by`** → Software that generated the torrent.
   * **`encoding`** → Character encoding (usually UTF-8).

---

## Single-File Torrent Example

**Bencoded form:**

```
d8:announce13:http://tracker.example.com4:infod6:lengthi12345e4:name8:myfile.txteee
```

**Decoded structure:**

```json
{
  "announce": "http://tracker.example.com",
  "info": {
    "name": "myfile.txt",
    "length": 12345
  }
}
```

---

## Multi-File Torrent Example

**Bencoded form:**

```
d8:announce13:http://tracker.example.com4:infod5:filesl

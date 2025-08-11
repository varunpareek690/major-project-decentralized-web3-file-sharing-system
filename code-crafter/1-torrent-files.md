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
d6:lengthi12345e4:pathl8:file1.txteed6:lengthi67890e4:pathl8:file2.txteee
4:name9:myfolder12:piece lengthi16384e6:pieces20:...20:...ee
```

**Decoded structure:**

```json
{
  "announce": "http://tracker.example.com",
  "info": {
    "name": "myfolder",
    "piece length": 16384,
    "pieces": "<binary data of concatenated SHA-1 hashes>",
    "files": [
      {"length": 12345, "path": ["file1.txt"]},
      {"length": 67890, "path": ["file2.txt"]}
    ]
  }
}
```

---

## Understanding the `pieces` Field

* The `pieces` field is a **concatenation of 20-byte SHA-1 hashes** of each file piece.
* Pieces are chunks of the file(s) with size defined by `piece length`.
* Each peer uses these hashes to verify the integrity of downloaded data.

---

## Info Hash

* The **info dictionary** is **bencoded separately** and then SHA-1 hashed.
* This **info hash** is the unique identifier of a torrent.
* Used by:

  * Trackers to identify the torrent
  * DHT for peer discovery
  * Magnet links (`magnet:?xt=urn:btih:<info_hash>`)

---

## Optional Tracker List

* Key: `announce-list`
* Provides a list of backup trackers in case the main tracker is unavailable.
* Example:

```bencode
ll13:http://tracker1.example.comel13:http://tracker2.example.comee
```

---

## Summary of `.torrent` File Structure

| Key             | Type       | Description                                         |
| --------------- | ---------- | --------------------------------------------------- |
| `announce`      | String     | Primary tracker URL                                 |
| `announce-list` | List       | Optional backup trackers                            |
| `info`          | Dictionary | Contains file metadata (name, length, pieces, etc.) |
| `creation date` | Integer    | Optional timestamp                                  |
| `comment`       | String     | Optional user comment                               |
| `created by`    | String     | Optional software info                              |
| `encoding`      | String     | Optional text encoding                              |

**Important:** The **`info` dictionary** must be **bencoded and sorted** consistently, as it is used to calculate the torrent’s info hash.

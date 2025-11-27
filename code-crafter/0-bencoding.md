# Bencoding: A Simple Data Serialization Format

Bencoding (short for **binary encoding**) is a minimal data serialization format originally created for the **BitTorrent protocol**. It is designed to be:

* **Simple** → Easy to parse and generate.
* **Deterministic** → The same data always produces the same encoded form.
* **Compact** → Minimal overhead compared to formats like XML or JSON.
* **Versatile** → Capable of encoding text, binary data, lists, and dictionaries.

It is still widely used in **`.torrent` files** and **BitTorrent peer communications**.

---

## Core Data Types

Bencoding supports **four primitive types**: integers, strings, lists, and dictionaries.

### 1. Integers

* Format:

  ```
  i<digits>e
  ```
* Must start with `i` and end with `e`.
* Supports negative numbers (leading `-` is allowed).
* Leading zeros are **not allowed** (except for `0` itself).

**Examples:**

* `i42e` → `42`
* `i-3e` → `-3`
* `i0e` → `0`

---

### 2. Strings

* Format:

  ```
  <length>:<string>
  ```
* `<length>` is the number of **bytes** (not characters).
* Strings can contain **binary data**, not just UTF-8 text.

**Examples:**

* `4:spam` → `"spam"`
* `0:` → `""` (empty string)
* `11:hello world` → `"hello world"`

---

### 3. Lists

* Format:

  ```
  l<items>e
  ```
* Begins with `l`, ends with `e`.
* Can contain any valid bencoded type (including nested lists and dictionaries).

**Example:**

```
l4:spam4:eggse
```

→ `["spam", "eggs"]`

**Nested example:**

```
li42e3:fooe
```

→ `[42, "foo"]`

---

### 4. Dictionaries

* Format:

  ```
  d<key><value>e
  ```
* Begins with `d`, ends with `e`.
* Keys **must be strings** (bencoded as such).
* Keys must be **sorted lexicographically**.

**Example:**

```
d3:cow3:moo4:spam4:eggse
```

→ `{"cow": "moo", "spam": "eggs"}`

**Nested example:**

```
d4:dictd3:foo3:bare4:listli1ei2eee
```

→ `{"dict": {"foo": "bar"}, "list": [1, 2]}`

---

## Why Sorting Dictionary Keys Matters

Since BitTorrent uses SHA-1 hashes on bencoded data (e.g., when computing the **info hash** of a `.torrent` file), the encoding must be **deterministic**.

If dictionaries were not sorted, two peers might produce different encodings for the same logical structure → leading to mismatched hashes and broken communication.

Thus, **all dictionary keys must be sorted in lexicographical (binary string) order**.

---

## Practical Example: A `.torrent` File

A minimal `.torrent` file might look like this in raw bencoding:

```
d8:announce13:http://tracker.example.com4:infod6:lengthi12345e4:name8:myfile.txteee
```

Decoded structure:

```json
{
  "announce": "http://tracker.example.com",
  "info": {
    "length": 12345,
    "name": "myfile.txt"
  }
}
```

---

## Common Uses

* **`.torrent` files** → Store metadata about shared files:

  * Tracker URLs
  * File names
  * File lengths
  * Piece hashes
* **BitTorrent Distributed Hash Table (DHT)** → Peers exchange bencoded messages.
* **Lightweight serialization** → Although rare outside BitTorrent, bencoding can be used anywhere a simple, deterministic format is useful.

---

## Comparison to Other Formats

| Feature        | Bencoding  | JSON       | XML       |
| -------------- | ---------- | ---------- | --------- |
| Human-readable | Somewhat   | Yes        | Yes       |
| Binary data    | Yes        | Base64     | Encoded   |
| Deterministic  | Yes        | Not always | No        |
| Data types     | 4 types    | Many       | Many      |
| Used in        | BitTorrent | Web APIs   | Documents |

---

## Summary

* **Integers** → `i<digits>e`
* **Strings** → `<length>:<string>`
* **Lists** → `l<items>e`
* **Dictionaries** → `d<key><value>e` (sorted keys)

Bencoding may look primitive compared to JSON or YAML, but its **simplicity, binary-safety, and determinism** make it perfect for the **BitTorrent ecosystem**, where consistent encoding is critical.

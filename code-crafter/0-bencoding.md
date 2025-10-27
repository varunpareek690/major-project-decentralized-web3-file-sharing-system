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

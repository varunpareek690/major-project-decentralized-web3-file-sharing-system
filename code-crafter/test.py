import os
import json
from datetime import datetime
from pathlib import Path

class BencodeDecoder:
    def __init__(self, data):
        self.data = data
        self.index = 0

    def decode(self):
        return self._parse()

    def _parse(self):
        if self.index >= len(self.data):
            raise ValueError("Unexpected end of data")

        # Debug information
        print(f"Debug: Parsing at index {self.index}, byte={self.data[self.index]}, char='{chr(self.data[self.index]) if 32 <= self.data[self.index] <= 126 else '?'}'")
        
        char = chr(self.data[self.index])

        if char == 'i':
            return self._parse_int()
        elif char.isdigit():
            return self._parse_string()
        elif char == 'l':
            return self._parse_list()
        elif char == 'd':
            return self._parse_dict()
        else:
            # Show context around the error
            start = max(0, self.index - 10)
            end = min(len(self.data), self.index + 10)
            context_bytes = self.data[start:end]
            context_hex = ' '.join(f'{b:02x}' for b in context_bytes)
            marker_pos = (self.index - start) * 3
            marker = ' ' * marker_pos + '^'
            
            print(f"Context around error:")
            print(f"  Bytes: {context_hex}")
            print(f"  Pos:   {marker}")
            
            raise ValueError(f"Invalid bencode format at index {self.index} (char='{char}', byte={self.data[self.index]})")

    def _parse_int(self):
        self.index += 1  # skip 'i'
        end = self.data.find(b'e', self.index)
        if end == -1:
            raise ValueError("Invalid integer: missing 'e'")
        
        num_str = self.data[self.index:end].decode('ascii')
        self.index = end + 1
        return int(num_str)

    def _parse_string(self):
        # Find the colon
        colon_pos = self.data.find(b':', self.index)
        if colon_pos == -1:
            raise ValueError("Invalid string: missing ':'")
        
        # Parse length
        length_str = self.data[self.index:colon_pos].decode('ascii')
        length = int(length_str)
        
        # Extract string data
        start = colon_pos + 1
        end = start + length
        
        if end > len(self.data):
            raise ValueError(f"String length {length} exceeds data bounds")
        
        string_data = self.data[start:end]
        self.index = end  # Move to position after string data
        
        # Debug output for string parsing
        print(f"  String parse: length={length}, start={start}, end={end}, new_index={self.index}")
        if length < 100:  # Only show content for short strings
            try:
                print(f"  String content: {string_data.decode('utf-8', errors='replace')}")
            except:
                print(f"  String content (hex): {string_data.hex()}")
        else:
            print(f"  String content: <{length} bytes of binary data>")
            
        return string_data

    def _parse_list(self):
        self.index += 1  # skip 'l'
        result = []
        
        while self.index < len(self.data) and self.data[self.index] != ord('e'):
            result.append(self._parse())
        
        if self.index >= len(self.data):
            raise ValueError("Invalid list: missing 'e'")
        
        self.index += 1  # skip 'e'
        return result

    def _parse_dict(self):
        self.index += 1  # skip 'd'
        result = {}
        
        while self.index < len(self.data) and self.data[self.index] != ord('e'):
            # Parse key (must be a string)
            key_data = self._parse()
            if not isinstance(key_data, bytes):
                raise ValueError("Dictionary key must be a string")
            
            key = key_data.decode('utf-8', errors='replace')
            
            # Parse value
            value = self._parse()
            result[key] = value
        
        if self.index >= len(self.data):
            raise ValueError("Invalid dictionary: missing 'e'")
        
        self.index += 1  # skip 'e'
        return result


def decode_bencode(data):
    """Decode bencode data"""
    decoder = BencodeDecoder(data)
    return decoder.decode()


def parse_torrent_file(filepath):
    """Parse a torrent file and return structured data"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # Decode the bencode data
    torrent = decode_bencode(data)
    
    # Convert bytes to strings for display, but keep important binary data
    torrent = convert_torrent_data(torrent)
    
    return torrent


def convert_torrent_data(torrent):
    """Convert byte strings to UTF-8 strings where appropriate"""
    result = {}
    
    for key, value in torrent.items():
        if key == 'announce' and isinstance(value, bytes):
            result[key] = value.decode('utf-8', errors='replace')
        elif key == 'created by' and isinstance(value, bytes):
            result[key] = value.decode('utf-8', errors='replace')
        elif key == 'comment' and isinstance(value, bytes):
            result[key] = value.decode('utf-8', errors='replace')
        elif key == 'info' and isinstance(value, dict):
            result[key] = convert_info_dict(value)
        elif key == 'announce-list' and isinstance(value, list):
            result[key] = [[url.decode('utf-8', errors='replace') if isinstance(url, bytes) else url 
                          for url in tier] for tier in value]
        else:
            result[key] = value
    
    return result


def convert_info_dict(info):
    """Convert the info dictionary, handling special cases"""
    result = {}
    
    for key, value in info.items():
        if key == 'name' and isinstance(value, bytes):
            result[key] = value.decode('utf-8', errors='replace')
        elif key == 'pieces' and isinstance(value, bytes):
            # Keep pieces as hex string for display
            result[key] = value.hex()
            result['pieces_raw'] = value  # Keep raw bytes for calculations
            # Also show number of pieces
            result['num_pieces'] = len(value) // 20  # Each SHA-1 hash is 20 bytes
        elif key == 'files' and isinstance(value, list):
            result[key] = convert_files_list(value)
        else:
            result[key] = value
    
    return result


def convert_files_list(files):
    """Convert files list for multi-file torrents"""
    result = []
    for file_info in files:
        file_dict = {}
        for key, value in file_info.items():
            if key == 'path' and isinstance(value, list):
                file_dict[key] = [path.decode('utf-8', errors='replace') 
                                if isinstance(path, bytes) else path for path in value]
            else:
                file_dict[key] = value
        result.append(file_dict)
    return result


def display_torrent_info(torrent):
    """Display torrent information in a readable format"""
    print("=" * 50)
    print("TORRENT FILE INFORMATION")
    print("=" * 50)
    
    # Basic info
    print(f"Tracker URL: {torrent.get('announce', 'N/A')}")
    print(f"Created by: {torrent.get('created by', 'N/A')}")
    
    if 'creation date' in torrent:
        date = datetime.fromtimestamp(torrent['creation date'])
        print(f"Creation date: {date.strftime('%Y-%m-%d %H:%M:%S')}")
    
    print(f"Comment: {torrent.get('comment', 'N/A')}")
    
    # Info section
    if 'info' in torrent:
        info = torrent['info']
        print("\n" + "=" * 50)
        print("FILE INFORMATION")
        print("=" * 50)
        
        print(f"Name: {info.get('name', 'N/A')}")
        print(f"Piece length: {info.get('piece length', 'N/A'):,} bytes")
        
        # File size info
        if 'length' in info:
            # Single file torrent
            size_bytes = info['length']
            size_mb = size_bytes / (1024 * 1024)
            print(f"File size: {size_bytes:,} bytes ({size_mb:.2f} MB)")
        elif 'files' in info:
            # Multi-file torrent
            total_size = sum(f.get('length', 0) for f in info['files'])
            size_mb = total_size / (1024 * 1024)
            print(f"Total size: {total_size:,} bytes ({size_mb:.2f} MB)")
            print(f"Number of files: {len(info['files'])}")
            
            print("\nFiles:")
            for i, file_info in enumerate(info['files'][:10]):  # Show first 10 files
                path = '/'.join(file_info.get('path', [f'file_{i}']))
                size = file_info.get('length', 0)
                print(f"  {path} ({size:,} bytes)")
            
            if len(info['files']) > 10:
                print(f"  ... and {len(info['files']) - 10} more files")
        
        # Pieces info
        if 'pieces' in info:
            pieces_hex = info['pieces']
            num_pieces = info.get('num_pieces', len(pieces_hex) // 40)
            print(f"\nNumber of pieces: {num_pieces}")
            if len(pieces_hex) >= 40:
                print(f"First piece hash: {pieces_hex[:40]}")
                if num_pieces > 1 and len(pieces_hex) >= 80:
                    print(f"Last piece hash: {pieces_hex[-40:]}")


def analyze_file_structure(filepath):
    """Analyze the raw structure of a torrent file"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    print(f"\nFile: {filepath}")
    print(f"Size: {len(data)} bytes")
    print(f"First 100 bytes (as text where possible):")
    
    # Show first 100 bytes
    for i in range(0, min(100, len(data)), 20):
        chunk = data[i:i+20]
        hex_str = ' '.join(f'{b:02x}' for b in chunk)
        ascii_str = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in chunk)
        print(f"{i:03d}: {hex_str:<60} {ascii_str}")


def manual_parse_test(filepath):
    """Manually trace through the torrent file structure"""
    with open(filepath, 'rb') as f:
        data = f.read()
    
    print("Manual parsing test:")
    print(f"Total file size: {len(data)} bytes")
    
    # Show the complete hex dump to understand structure
    print("Complete file hex dump:")
    for i in range(0, len(data), 16):
        chunk = data[i:i+16]
        hex_str = ' '.join(f'{b:02x}' for b in chunk)
        ascii_str = ''.join(chr(b) if 32 <= b <= 126 else '.' for b in chunk)
        print(f"{i:03d}: {hex_str:<48} {ascii_str}")
    
    print("\nLet's find where the pieces data starts and ends:")
    pieces_pos = data.find(b'6:pieces')
    if pieces_pos != -1:
        print(f"Found '6:pieces' at position {pieces_pos}")
        # After "6:pieces" should come the length
        after_pieces = pieces_pos + 8  # length of "6:pieces"
        print(f"Position after '6:pieces': {after_pieces}")
        print(f"Next bytes: {data[after_pieces:after_pieces+10]}")
        
        # Look for the pattern "60:" which should be the length of pieces data
        if data[after_pieces:after_pieces+3] == b'60:':
            pieces_data_start = after_pieces + 3
            pieces_data_end = pieces_data_start + 60
            print(f"Pieces data from {pieces_data_start} to {pieces_data_end}")
            print(f"After pieces data should be 'e': {data[pieces_data_end:pieces_data_end+5]}")
    
    print(f"\nLooking for the error position (232):")
    if len(data) > 232:
        print(f"Byte at 232: {data[232]} (0x{data[232]:02x})")
        print(f"Context: {data[225:240]}")
        print(f"Context hex: {' '.join(f'{b:02x}' for b in data[225:240])}")


def main():
    # File to parse
    torrent_file = "sample.torrent"
    
    if not os.path.exists(torrent_file):
        print(f"Error: {torrent_file} not found!")
        print("Available files in current directory:")
        for file in os.listdir("."):
            if file.endswith(".torrent"):
                print(f"  {file}")
        return
    
    try:
        print("Analyzing file structure...")
        analyze_file_structure(torrent_file)
        
        print("\nManual parsing test...")
        manual_parse_test(torrent_file)
        
        print("\nParsing torrent file...")
        torrent = parse_torrent_file(torrent_file)
        
        display_torrent_info(torrent)
        
        # Save parsed data to JSON for inspection
        output_file = "parsed_torrent.json"
        torrent_for_json = json.loads(json.dumps(torrent, default=str))  # Convert non-serializable objects
        
        with open(output_file, 'w') as f:
            json.dump(torrent_for_json, f, indent=2)
        
        print(f"\nParsed data saved to: {output_file}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
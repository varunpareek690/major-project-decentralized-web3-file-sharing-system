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
            

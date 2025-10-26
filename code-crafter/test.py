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

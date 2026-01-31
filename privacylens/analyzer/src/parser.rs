//! Bytecode parser for Solana BPF programs

use crate::types::*;
use anyhow::{anyhow, Result};
use goblin::elf::Elf;
use sha2::{Digest, Sha256};
use std::collections::HashMap;

/// Parsed program information
#[derive(Debug, Clone)]
pub struct ParsedProgram {
    /// SHA256 hash of the bytecode
    pub hash: String,
    /// Raw bytecode
    pub bytecode: Vec<u8>,
    /// Text section (code)
    pub text_section: Vec<u8>,
    /// Data sections
    pub data_sections: HashMap<String, Vec<u8>>,
    /// Symbol table
    pub symbols: Vec<Symbol>,
    /// Parsed instructions
    pub instructions: Vec<Instruction>,
    /// Program entry point
    pub entry_point: u64,
}

/// Symbol information
#[derive(Debug, Clone)]
pub struct Symbol {
    pub name: String,
    pub address: u64,
    pub size: u64,
    pub is_function: bool,
}

/// BPF Instruction
#[derive(Debug, Clone)]
pub struct Instruction {
    /// Instruction offset
    pub offset: usize,
    /// Opcode
    pub opcode: u8,
    /// Source register
    pub src_reg: u8,
    /// Destination register
    pub dst_reg: u8,
    /// Offset field
    pub off: i16,
    /// Immediate value
    pub imm: i32,
    /// Raw bytes
    pub raw: [u8; 8],
}

impl Instruction {
    /// Check if this is a memory access instruction
    pub fn is_memory_access(&self) -> bool {
        let class = self.opcode & 0x07;
        matches!(class, 0x61 | 0x62 | 0x63 | 0x69 | 0x6a | 0x6b | 0x71 | 0x72 | 0x73 | 0x79 | 0x7a | 0x7b)
    }

    /// Check if this is a call instruction
    pub fn is_call(&self) -> bool {
        self.opcode == 0x85
    }

    /// Check if this is a branch instruction
    pub fn is_branch(&self) -> bool {
        let class = self.opcode & 0x07;
        class == 0x05 || class == 0x06 || class == 0x07
    }

    /// Check if this is a comparison
    pub fn is_comparison(&self) -> bool {
        let op = self.opcode & 0xf0;
        matches!(op, 0x10 | 0x20 | 0x30 | 0x50 | 0xa0 | 0xb0 | 0xc0 | 0xd0)
    }
}

/// Bytecode parser
pub struct Parser;

impl Parser {
    /// Parse Solana BPF bytecode
    pub fn parse(bytecode: &[u8]) -> Result<ParsedProgram> {
        // Calculate hash
        let hash = Self::calculate_hash(bytecode);

        // Try to parse as ELF
        let elf = match Elf::parse(bytecode) {
            Ok(elf) => elf,
            Err(_) => {
                // If not ELF, treat as raw bytecode
                return Self::parse_raw(bytecode, hash);
            }
        };

        // Extract text section
        let text_section = Self::extract_text_section(&elf, bytecode)?;

        // Extract data sections
        let data_sections = Self::extract_data_sections(&elf, bytecode);

        // Extract symbols
        let symbols = Self::extract_symbols(&elf);

        // Parse instructions
        let instructions = Self::parse_instructions(&text_section);

        Ok(ParsedProgram {
            hash,
            bytecode: bytecode.to_vec(),
            text_section,
            data_sections,
            symbols,
            instructions,
            entry_point: elf.entry,
        })
    }

    /// Calculate SHA256 hash of bytecode
    fn calculate_hash(bytecode: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(bytecode);
        hex::encode(hasher.finalize())
    }

    /// Extract the .text section containing code
    fn extract_text_section(elf: &Elf, bytecode: &[u8]) -> Result<Vec<u8>> {
        for section in &elf.section_headers {
            let name = elf.shdr_strtab.get_at(section.sh_name).unwrap_or("");
            if name == ".text" {
                let start = section.sh_offset as usize;
                let end = start + section.sh_size as usize;
                if end <= bytecode.len() {
                    return Ok(bytecode[start..end].to_vec());
                }
            }
        }
        // Fallback: use the entire bytecode
        Ok(bytecode.to_vec())
    }

    /// Extract data sections
    fn extract_data_sections(elf: &Elf, bytecode: &[u8]) -> HashMap<String, Vec<u8>> {
        let mut sections = HashMap::new();

        for section in &elf.section_headers {
            let name = elf.shdr_strtab.get_at(section.sh_name).unwrap_or("");
            if name.starts_with(".data") || name.starts_with(".rodata") || name == ".bss" {
                let start = section.sh_offset as usize;
                let end = start + section.sh_size as usize;
                if end <= bytecode.len() {
                    sections.insert(name.to_string(), bytecode[start..end].to_vec());
                }
            }
        }

        sections
    }

    /// Extract symbol table
    fn extract_symbols(elf: &Elf) -> Vec<Symbol> {
        let mut symbols = Vec::new();

        for sym in &elf.syms {
            if let Some(name) = elf.strtab.get_at(sym.st_name) {
                if !name.is_empty() {
                    symbols.push(Symbol {
                        name: name.to_string(),
                        address: sym.st_value,
                        size: sym.st_size,
                        is_function: sym.is_function(),
                    });
                }
            }
        }

        symbols
    }

    /// Parse BPF instructions from text section
    fn parse_instructions(text: &[u8]) -> Vec<Instruction> {
        let mut instructions = Vec::new();
        let mut offset = 0;

        while offset + 8 <= text.len() {
            let raw: [u8; 8] = text[offset..offset + 8].try_into().unwrap();

            let opcode = raw[0];
            let regs = raw[1];
            let dst_reg = regs & 0x0f;
            let src_reg = (regs >> 4) & 0x0f;
            let off = i16::from_le_bytes([raw[2], raw[3]]);
            let imm = i32::from_le_bytes([raw[4], raw[5], raw[6], raw[7]]);

            instructions.push(Instruction {
                offset,
                opcode,
                src_reg,
                dst_reg,
                off,
                imm,
                raw,
            });

            // Handle wide instructions (64-bit immediate)
            if opcode == 0x18 {
                offset += 8; // Skip the second part
            }

            offset += 8;
        }

        instructions
    }

    /// Parse raw bytecode (not ELF)
    fn parse_raw(bytecode: &[u8], hash: String) -> Result<ParsedProgram> {
        let instructions = Self::parse_instructions(bytecode);

        Ok(ParsedProgram {
            hash,
            bytecode: bytecode.to_vec(),
            text_section: bytecode.to_vec(),
            data_sections: HashMap::new(),
            symbols: Vec::new(),
            instructions,
            entry_point: 0,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_calculation() {
        let data = b"test data";
        let hash = Parser::calculate_hash(data);
        assert_eq!(hash.len(), 64); // SHA256 produces 64 hex chars
    }

    #[test]
    fn test_parse_raw_bytecode() {
        // Minimal BPF instruction: exit
        let bytecode = vec![0x95, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        let result = Parser::parse(&bytecode);
        assert!(result.is_ok());

        let parsed = result.unwrap();
        assert_eq!(parsed.instructions.len(), 1);
        assert_eq!(parsed.instructions[0].opcode, 0x95);
    }
}
